using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using PremieRpet.Shop.Application.Interfaces.Services;
using PremieRpet.Shop.Infrastructure.Options;

namespace PremieRpet.Shop.Infrastructure.Services;

public sealed class EntraIdRoleService : IEntraIdRoleService
{
    private static readonly Uri GraphBaseUri = new("https://graph.microsoft.com/v1.0/");

    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IOptions<EntraIdAppRoleOptions> _options;
    private readonly ILogger<EntraIdRoleService> _logger;

    private readonly SemaphoreSlim _tokenLock = new(1, 1);
    private string? _cachedToken;
    private DateTimeOffset _tokenExpiresAt = DateTimeOffset.MinValue;

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true
    };

    public EntraIdRoleService(IHttpClientFactory httpClientFactory, IOptions<EntraIdAppRoleOptions> options, ILogger<EntraIdRoleService> logger)
    {
        _httpClientFactory = httpClientFactory;
        _options = options;
        _logger = logger;
    }

    public async Task<IReadOnlyList<string>> GetUserRolesAsync(string userObjectId, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(userObjectId))
            throw new ArgumentException("Identificador do usuário inválido.", nameof(userObjectId));

        var userGuid = ParseObjectId(userObjectId);
        var assignments = await GetAssignmentsAsync(userGuid, ct);
        if (assignments.Count == 0)
            return Array.Empty<string>();

        var roleIds = GetRoleIdLookup();
        var result = new List<string>();

        foreach (var assignment in assignments)
        {
            if (assignment.AppRoleId is null)
                continue;

            if (roleIds.TryGetValue(assignment.AppRoleId.Value, out var roleName))
            {
                result.Add(roleName);
            }
            else
            {
                _logger.LogWarning("Role {RoleId} não está configurada no mapeamento e será ignorada.", assignment.AppRoleId.Value);
            }
        }

        return result
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .OrderBy(r => r, StringComparer.OrdinalIgnoreCase)
            .ToArray();
    }

    public async Task ReplaceUserRolesAsync(string userObjectId, IEnumerable<string> roles, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(userObjectId))
            throw new ArgumentException("Identificador do usuário inválido.", nameof(userObjectId));

        var userGuid = ParseObjectId(userObjectId);
        var desiredRoles = roles?.Where(r => !string.IsNullOrWhiteSpace(r)).Select(r => r.Trim()).ToArray() ?? Array.Empty<string>();
        var options = ValidateOptions();

        var assignments = await GetAssignmentsAsync(userGuid, ct);
        var desiredRoleIds = new HashSet<Guid>(desiredRoles.Select(role =>
        {
            if (!options.RoleIds.TryGetValue(role, out var idValue) || !Guid.TryParse(idValue, out var parsed))
                throw new InvalidOperationException($"Perfil '{role}' não está configurado na aplicação Entra ID.");
            return parsed;
        }));

        var toRemove = assignments
            .Where(a => a.AppRoleId is not null && !desiredRoleIds.Contains(a.AppRoleId.Value))
            .ToList();

        foreach (var assignment in toRemove)
        {
            if (!string.IsNullOrWhiteSpace(assignment.Id))
            {
                await RemoveAssignmentAsync(userGuid, assignment.Id, ct);
            }
        }

        var currentRoleIds = assignments
            .Where(a => a.AppRoleId is not null)
            .Select(a => a.AppRoleId!.Value)
            .ToHashSet();

        foreach (var roleId in desiredRoleIds)
        {
            if (!currentRoleIds.Contains(roleId))
            {
                await AddAssignmentAsync(userGuid, roleId, ct);
            }
        }
    }

    private async Task<IReadOnlyList<AppRoleAssignment>> GetAssignmentsAsync(Guid userObjectId, CancellationToken ct)
    {
        var options = ValidateOptions();
        var token = await GetAccessTokenAsync(ct);
        var client = _httpClientFactory.CreateClient();
        client.BaseAddress = GraphBaseUri;
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var enterpriseAppId = Guid.Parse(options.EnterpriseAppObjectId);
        var url = $"users/{FormatGuid(userObjectId)}/appRoleAssignments?$filter=resourceId eq {FormatGuid(enterpriseAppId)}";
        using var request = new HttpRequestMessage(HttpMethod.Get, url);
        using var response = await client.SendAsync(request, ct);

        if (!response.IsSuccessStatusCode)
        {
            var detail = await response.Content.ReadAsStringAsync(ct);
            _logger.LogError("Falha ao consultar roles no Graph ({Status}): {Detail}", response.StatusCode, detail);
            throw CreateGraphException(
                response,
                detail,
                "Não foi possível consultar as roles do usuário no Microsoft Graph.",
                GraphPermissionScope.AssignmentsRead);
        }

        await using var stream = await response.Content.ReadAsStreamAsync(ct);
        var payload = await JsonSerializer.DeserializeAsync<GraphAppRoleAssignmentsResponse>(stream, JsonOptions, ct)
            ?? new GraphAppRoleAssignmentsResponse();

        return payload.Value ?? Array.Empty<AppRoleAssignment>();
    }

    private async Task RemoveAssignmentAsync(Guid userObjectId, string assignmentId, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(assignmentId))
        {
            _logger.LogWarning("Identificador da atribuição vazio ao tentar remover role do usuário {UserId}.", userObjectId);
            return;
        }

        var options = ValidateOptions();
        var enterpriseAppId = Guid.Parse(options.EnterpriseAppObjectId);
        var token = await GetAccessTokenAsync(ct);
        var client = _httpClientFactory.CreateClient();
        client.BaseAddress = GraphBaseUri;
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        using var request = new HttpRequestMessage(HttpMethod.Delete, $"servicePrincipals/{enterpriseAppId}/appRoleAssignedTo/{Uri.EscapeDataString(assignmentId)}");
        using var response = await client.SendAsync(request, ct);

        if (!response.IsSuccessStatusCode)
        {
            var detail = await response.Content.ReadAsStringAsync(ct);
            _logger.LogError("Falha ao remover role ({Status}): {Detail}", response.StatusCode, detail);
            throw CreateGraphException(
                response,
                detail,
                "Não foi possível remover a role do usuário no Microsoft Graph.",
                GraphPermissionScope.AssignmentsWrite);
        }
    }

    private async Task AddAssignmentAsync(Guid userObjectId, Guid roleId, CancellationToken ct)
    {
        var options = ValidateOptions();
        var enterpriseAppId = Guid.Parse(options.EnterpriseAppObjectId);
        var token = await GetAccessTokenAsync(ct);
        var client = _httpClientFactory.CreateClient();
        client.BaseAddress = GraphBaseUri;
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var payload = new
        {
            principalId = userObjectId,
            resourceId = enterpriseAppId,
            appRoleId = roleId
        };

        using var request = new HttpRequestMessage(HttpMethod.Post, $"servicePrincipals/{enterpriseAppId}/appRoleAssignedTo")
        {
            Content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json")
        };

        using var response = await client.SendAsync(request, ct);

        if (!response.IsSuccessStatusCode)
        {
            var detail = await response.Content.ReadAsStringAsync(ct);
            _logger.LogError("Falha ao adicionar role ({Status}): {Detail}", response.StatusCode, detail);
            throw CreateGraphException(
                response,
                detail,
                "Não foi possível atribuir a role ao usuário no Microsoft Graph.",
                GraphPermissionScope.AssignmentsWrite);
        }
    }

    private static Guid ParseObjectId(string objectId)
    {
        if (!Guid.TryParse(objectId, out var guid))
            throw new InvalidOperationException("Identificador do usuário não corresponde a um Object ID válido do Entra ID.");

        return guid;
    }

    private async Task<string> GetAccessTokenAsync(CancellationToken ct)
    {
        if (!string.IsNullOrEmpty(_cachedToken) && _tokenExpiresAt > DateTimeOffset.UtcNow.AddMinutes(1))
            return _cachedToken!;

        await _tokenLock.WaitAsync(ct);
        try
        {
            if (!string.IsNullOrEmpty(_cachedToken) && _tokenExpiresAt > DateTimeOffset.UtcNow.AddMinutes(1))
                return _cachedToken!;

            var options = ValidateOptions();
            var client = _httpClientFactory.CreateClient();
            var tokenEndpoint = new Uri($"https://login.microsoftonline.com/{options.TenantId}/oauth2/v2.0/token");

            using var request = new HttpRequestMessage(HttpMethod.Post, tokenEndpoint)
            {
                Content = new FormUrlEncodedContent(new Dictionary<string, string>
                {
                    ["client_id"] = options.ClientId,
                    ["client_secret"] = options.ClientSecret,
                    ["scope"] = "https://graph.microsoft.com/.default",
                    ["grant_type"] = "client_credentials"
                })
            };

            using var response = await client.SendAsync(request, ct);

            if (!response.IsSuccessStatusCode)
            {
                var detail = await response.Content.ReadAsStringAsync(ct);
                _logger.LogError("Falha ao obter token do Microsoft Identity ({Status}): {Detail}", response.StatusCode, detail);
                throw CreateGraphException(
                    response,
                    detail,
                    "Não foi possível autenticar na API do Microsoft Graph.",
                    GraphPermissionScope.Token);
            }

            await using var stream = await response.Content.ReadAsStreamAsync(ct);
            var token = await JsonSerializer.DeserializeAsync<TokenResponse>(stream, JsonOptions, ct)
                ?? throw new InvalidOperationException("Resposta inválida ao solicitar token do Microsoft Graph.");

            if (string.IsNullOrWhiteSpace(token.AccessToken))
                throw new InvalidOperationException("Resposta inválida ao solicitar token do Microsoft Graph.");

            _cachedToken = token.AccessToken;
            var expiresIn = token.ExpiresIn > 0 ? token.ExpiresIn : 3600;
            _tokenExpiresAt = DateTimeOffset.UtcNow.AddSeconds(expiresIn - 60);

            return _cachedToken;
        }
        finally
        {
            _tokenLock.Release();
        }
    }

    private EntraIdAppRoleOptions ValidateOptions()
    {
        var options = _options.Value;
        if (string.IsNullOrWhiteSpace(options.TenantId)
            || string.IsNullOrWhiteSpace(options.ClientId)
            || string.IsNullOrWhiteSpace(options.ClientSecret)
            || string.IsNullOrWhiteSpace(options.EnterpriseAppObjectId))
        {
            throw new InvalidOperationException("Configuração do Azure Entra ID incompleta.");
        }

        if (!Guid.TryParse(options.EnterpriseAppObjectId, out _))
            throw new InvalidOperationException("Enterprise Application (service principal) inválida na configuração do Azure Entra ID.");

        return options;
    }

    private Dictionary<Guid, string> GetRoleIdLookup()
    {
        var options = ValidateOptions();
        var lookup = new Dictionary<Guid, string>();

        foreach (var pair in options.RoleIds)
        {
            if (Guid.TryParse(pair.Value, out var id))
                lookup[id] = pair.Key;
        }

        return lookup;
    }

    private static string FormatGuid(Guid value)
        => value.ToString("D");

    private Exception CreateGraphException(
        HttpResponseMessage response,
        string? detail,
        string defaultMessage,
        GraphPermissionScope scope)
    {
        var permissionHelp = BuildPermissionHelpMessage(scope);

        if (string.IsNullOrWhiteSpace(detail))
            return new InvalidOperationException($"{defaultMessage} {permissionHelp}");

        try
        {
            var error = JsonSerializer.Deserialize<GraphErrorResponse>(detail, JsonOptions);
            if (error?.Error is GraphError graphError)
            {
                if (IsAuthorizationDenied(response, graphError))
                {
                    return new InvalidOperationException(permissionHelp);
                }

                if (!string.IsNullOrWhiteSpace(graphError.Message))
                {
                    return new InvalidOperationException($"{defaultMessage} Detalhes: {graphError.Message}. {permissionHelp}");
                }
            }
        }
        catch (JsonException)
        {
            // Ignora erros de parsing e cai no retorno padrão com o detalhe bruto.
        }

        if (response.StatusCode == HttpStatusCode.Forbidden)
        {
            return new InvalidOperationException(permissionHelp);
        }

        return new InvalidOperationException($"{defaultMessage} Detalhes: {detail}. {permissionHelp}");
    }

    private static bool IsAuthorizationDenied(HttpResponseMessage response, GraphError graphError)
    {
        if (response.StatusCode == HttpStatusCode.Forbidden)
            return true;

        return string.Equals(graphError.Code, "Authorization_RequestDenied", StringComparison.OrdinalIgnoreCase)
            || string.Equals(graphError.Code, "AuthorizationFailed", StringComparison.OrdinalIgnoreCase);
    }

    private string BuildPermissionHelpMessage(GraphPermissionScope scope)
    {
        var clientId = _options.Value.ClientId;
        var appIdentifier = string.IsNullOrWhiteSpace(clientId)
            ? "configurada em AzureEntra"
            : $"({clientId}) configurada em AzureEntra";

        return scope switch
        {
            GraphPermissionScope.AssignmentsRead =>
                "A aplicação " + appIdentifier + " precisa da permissão de aplicativo 'AppRoleAssignment.ReadWrite.All' " +
                "concedida no Microsoft Graph para listar os vínculos em `users/{id}/appRoleAssignments`. Abra o " +
                "registro da API utilizado pelo backend (App registrations), inclua a permissão em Microsoft Graph > Application " +
                "permissions e confirme o 'Grant admin consent'. Depois, em Aplicativos empresariais > (sua API) > Permissions, " +
                "verifique se o status aparece como concedido; se necessário, clique em 'Grant admin consent' novamente ou execute `az ad app permission admin-consent --id <client-id>` com uma conta administradora." ,
            GraphPermissionScope.AssignmentsWrite =>
                "A aplicação " + appIdentifier + " precisa da permissão de aplicativo 'AppRoleAssignment.ReadWrite.All' " +
                "concedida no Microsoft Graph para criar e remover vínculos em `servicePrincipals/{appId}/appRoleAssignedTo`. " +
                "Confirme a adição da permissão no registro da API, o 'Grant admin consent' e o status concedido também em Aplicativos empresariais > (sua API) > Permissions; se necessário, utilize 'Grant admin consent' novamente ou o comando `az ad app permission admin-consent --id <client-id>`." ,
            GraphPermissionScope.Token =>
                "A aplicação " + appIdentifier + " não conseguiu autenticar no Microsoft Graph com client credentials. Revise " +
                "TenantId, ClientId e ClientSecret na configuração 'AzureEntra', confirme que o segredo não expirou em " +
                "Certificados e segredos e que a aplicação recebeu 'Grant admin consent' para as permissões requeridas." ,
            _ =>
                "A aplicação " + appIdentifier + " não possui permissões suficientes no Microsoft Graph. Conceda 'AppRoleAssignment.ReadWrite.All' como permissão de aplicativo e aplique 'Grant admin consent'."
        };
    }

    private enum GraphPermissionScope
    {
        AssignmentsRead,
        AssignmentsWrite,
        Token
    }

    private sealed record GraphAppRoleAssignmentsResponse
    {
        public IReadOnlyList<AppRoleAssignment>? Value { get; init; }
    }

    private sealed record GraphErrorResponse
    {
        public GraphError? Error { get; init; }
    }

    private sealed record GraphError
    {
        public string? Code { get; init; }
        public string? Message { get; init; }
    }

    private sealed record AppRoleAssignment
    {
        public string? Id { get; init; }
        public Guid? AppRoleId { get; init; }
    }

    private sealed record TokenResponse
    {
        [JsonPropertyName("access_token")]
        public string? AccessToken { get; init; }

        [JsonPropertyName("expires_in")]
        public int ExpiresIn { get; init; }

        [JsonPropertyName("ext_expires_in")]
        public int ExtendedExpiresIn { get; init; }

        [JsonPropertyName("token_type")]
        public string? TokenType { get; init; }
    }
}
