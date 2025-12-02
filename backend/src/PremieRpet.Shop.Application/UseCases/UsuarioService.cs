using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
using PremieRpet.Shop.Application.DTOs;
using PremieRpet.Shop.Application.Interfaces.Repositories;
using PremieRpet.Shop.Application.Interfaces.Services;
using PremieRpet.Shop.Application.Interfaces.UseCases;
using PremieRpet.Shop.Domain.Entities;
using PremieRpet.Shop.Domain.Rules;

namespace PremieRpet.Shop.Application.UseCases;

public sealed class UsuarioService : IUsuarioService
{
    private static readonly string[] AllowedRoles = ["Admin", "Colaborador"];
    private const string DefaultRole = "Colaborador";

    private readonly IUsuarioRepository _usuarios;
    private readonly IEntraIdRoleService _entraRoles;

    public UsuarioService(IUsuarioRepository usuarios, IEntraIdRoleService entraRoles)
    {
        _usuarios = usuarios;
        _entraRoles = entraRoles;
    }

    public async Task<UsuarioDto> ObterOuCriarAsync(string email, string? microsoftId, CancellationToken ct)
    {
        var normalizedEmail = NormalizeEmailValue(email);
        var (usuario, resolvedMicrosoftId) = await FindExistingUsuarioAsync(normalizedEmail, microsoftId, ct);

        if (usuario is not null && !usuario.Ativo)
            throw new InvalidOperationException("Usuário inativo.");

        if (usuario is null)
        {
            if (string.IsNullOrWhiteSpace(resolvedMicrosoftId))
                throw new InvalidOperationException("Usuário não encontrado.");

            var agora = DateTimeOffset.UtcNow;
            var remoteRoles = await _entraRoles.GetUserRolesAsync(resolvedMicrosoftId, ct);
            var normalizedRoles = NormalizeRoles(remoteRoles, strict: false);

            usuario = new Usuario
            {
                MicrosoftId = resolvedMicrosoftId,
                Email = normalizedEmail,
                Ativo = true,
                CriadoEm = agora,
                AtualizadoEm = agora,
            };

            ApplyRoles(usuario, normalizedRoles);
            await _usuarios.AddAsync(usuario, ct);
        }
        else
        {
            if (string.IsNullOrWhiteSpace(resolvedMicrosoftId))
            {
                usuario = await EnsureRolesAsync(usuario, ct, resolvedMicrosoftId);
            }
            else
            {
                usuario = await SyncFromEntraAsync(usuario, normalizedEmail, resolvedMicrosoftId, ct);
            }
        }

        return ToDto(usuario);
    }

    public async Task<UsuarioDto> RegistrarCpfAsync(string email, string? microsoftId, string cpf, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(cpf))
            throw new InvalidOperationException("CPF obrigatório.");

        var normalizedEmail = NormalizeEmailValue(email);
        var sanitized = CpfRules.Sanitize(cpf);
        if (!CpfRules.IsValid(sanitized))
            throw new InvalidOperationException("CPF inválido.");

        var (usuario, resolvedMicrosoftId) = await FindExistingUsuarioAsync(normalizedEmail, microsoftId, ct);
        var agora = DateTimeOffset.UtcNow;

        if (usuario is null)
        {
            if (string.IsNullOrWhiteSpace(resolvedMicrosoftId))
                throw new InvalidOperationException("Usuário não encontrado.");

            var remoteRoles = await _entraRoles.GetUserRolesAsync(resolvedMicrosoftId, ct);
            var normalizedRoles = NormalizeRoles(remoteRoles, strict: false);

            usuario = new Usuario
            {
                MicrosoftId = resolvedMicrosoftId,
                Email = normalizedEmail,
                Cpf = sanitized,
                Ativo = true,
                CriadoEm = agora,
                AtualizadoEm = agora,
            };

            ApplyRoles(usuario, normalizedRoles);
            await _usuarios.AddAsync(usuario, ct);
            return ToDto(usuario);
        }

        if (string.IsNullOrWhiteSpace(resolvedMicrosoftId))
        {
            usuario = await EnsureRolesAsync(usuario, ct, resolvedMicrosoftId);
        }
        else
        {
            usuario = await SyncFromEntraAsync(usuario, normalizedEmail, resolvedMicrosoftId, ct);
        }

        if (!usuario.Ativo)
            throw new InvalidOperationException("Usuário inativo.");

        if (string.IsNullOrWhiteSpace(usuario.Cpf))
        {
            usuario.Cpf = sanitized;
            usuario.AtualizadoEm = agora;
            await _usuarios.UpdateAsync(usuario, ct);
        }
        else if (!string.Equals(usuario.Cpf, sanitized, StringComparison.Ordinal))
        {
            throw new InvalidOperationException("CPF já cadastrado e não pode ser alterado.");
        }

        return ToDto(usuario);
    }

    public async Task<UsuarioDto> GarantirCpfAsync(string email, string? microsoftId, string? cpf, CancellationToken ct)
    {
        var normalizedEmail = NormalizeEmailValue(email);
        var (usuario, resolvedMicrosoftId) = await FindExistingUsuarioAsync(normalizedEmail, microsoftId, ct);

        if (usuario is null)
        {
            if (string.IsNullOrWhiteSpace(cpf))
                throw new InvalidOperationException("CPF obrigatório.");

            if (string.IsNullOrWhiteSpace(resolvedMicrosoftId))
                throw new InvalidOperationException("Usuário não encontrado.");

            var sanitized = CpfRules.Sanitize(cpf);
            if (!CpfRules.IsValid(sanitized))
                throw new InvalidOperationException("CPF inválido.");

            var agora = DateTimeOffset.UtcNow;
            var remoteRoles = await _entraRoles.GetUserRolesAsync(resolvedMicrosoftId, ct);
            var normalizedRoles = NormalizeRoles(remoteRoles, strict: false);

            usuario = new Usuario
            {
                MicrosoftId = resolvedMicrosoftId,
                Email = normalizedEmail,
                Cpf = sanitized,
                Ativo = true,
                CriadoEm = agora,
                AtualizadoEm = agora,
            };

            ApplyRoles(usuario, normalizedRoles);
            await _usuarios.AddAsync(usuario, ct);
            return ToDto(usuario);
        }

        if (string.IsNullOrWhiteSpace(resolvedMicrosoftId))
        {
            usuario = await EnsureRolesAsync(usuario, ct, resolvedMicrosoftId);
        }
        else
        {
            usuario = await SyncFromEntraAsync(usuario, normalizedEmail, resolvedMicrosoftId, ct);
        }

        if (!usuario.Ativo)
            throw new InvalidOperationException("Usuário inativo.");

        if (!string.IsNullOrWhiteSpace(usuario.Cpf))
        {
            if (!string.IsNullOrWhiteSpace(cpf))
            {
                var sanitized = CpfRules.Sanitize(cpf);
                if (!string.Equals(usuario.Cpf, sanitized, StringComparison.Ordinal))
                    throw new InvalidOperationException("CPF já cadastrado e não pode ser alterado.");
            }

            return ToDto(usuario);
        }

        if (string.IsNullOrWhiteSpace(cpf))
            throw new InvalidOperationException("CPF obrigatório.");

        var novoCpf = CpfRules.Sanitize(cpf);
        if (!CpfRules.IsValid(novoCpf))
            throw new InvalidOperationException("CPF inválido.");

        usuario.Cpf = novoCpf;
        usuario.AtualizadoEm = DateTimeOffset.UtcNow;
        await _usuarios.UpdateAsync(usuario, ct);

        return ToDto(usuario);
    }

    public async Task<IReadOnlyCollection<UsuarioDto>> ListAsync(CancellationToken ct)
    {
        var usuarios = await _usuarios.ListAsync(ct);
        var resultados = new List<UsuarioDto>(usuarios.Count);

        foreach (var usuario in usuarios)
        {
            var ensured = await EnsureRolesAsync(usuario, ct);
            resultados.Add(ToDto(ensured));
        }

        return resultados;
    }

    public async Task<UsuarioDto> UpsertAsync(string email, string? cpf, IEnumerable<string>? roles, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(email))
            throw new InvalidOperationException("E-mail do usuário obrigatório.");

        var normalizedEmail = NormalizeEmailValue(email);
        var normalizedRoles = NormalizeRoles(roles);
        var sanitizedCpf = SanitizeCpfOrNull(cpf);

        var (usuario, microsoftId) = await FindExistingUsuarioAsync(normalizedEmail, null, ct);
        var agora = DateTimeOffset.UtcNow;

        if (usuario is null)
        {
            usuario = new Usuario
            {
                MicrosoftId = microsoftId,
                Email = normalizedEmail,
                Cpf = sanitizedCpf,
                Ativo = true,
                CriadoEm = agora,
                AtualizadoEm = agora,
            };

            ApplyRoles(usuario, normalizedRoles);
            await _usuarios.AddAsync(usuario, ct);
            await _entraRoles.ReplaceUserRolesAsync(microsoftId, normalizedRoles, ct);

            return ToDto(usuario);
        }

        usuario = await EnsureRolesAsync(usuario, ct, microsoftId);

        if (!string.IsNullOrWhiteSpace(sanitizedCpf))
        {
            if (!string.IsNullOrWhiteSpace(usuario.Cpf) && !string.Equals(usuario.Cpf, sanitizedCpf, StringComparison.Ordinal))
                throw new InvalidOperationException("CPF já cadastrado e não pode ser alterado.");

            if (string.IsNullOrWhiteSpace(usuario.Cpf))
            {
                usuario.Cpf = sanitizedCpf;
            }
        }

        if (!string.IsNullOrWhiteSpace(normalizedEmail) && !string.Equals(usuario.Email, normalizedEmail, StringComparison.OrdinalIgnoreCase))
        {
            usuario.Email = normalizedEmail;
        }

        usuario.AtualizadoEm = agora;
        await _usuarios.UpdateAsync(usuario, ct);
        await _usuarios.ReplaceRolesAsync(usuario.Id, normalizedRoles, ct);
        await _entraRoles.ReplaceUserRolesAsync(microsoftId, normalizedRoles, ct);

        var atualizado = await _usuarios.GetByMicrosoftIdAsync(microsoftId, ct)
            ?? throw new InvalidOperationException("Usuário não encontrado após atualização.");

        return ToDto(atualizado);
    }

    public async Task<UsuarioDto> CriarLocalAsync(string cpf, string senha, IEnumerable<string>? roles, string? email, CancellationToken ct)
    {
        var sanitizedCpf = SanitizeCpfOrNull(cpf) ?? throw new InvalidOperationException("CPF obrigatório.");
        if (string.IsNullOrWhiteSpace(senha))
            throw new InvalidOperationException("Senha obrigatória.");

        var normalizedEmail = TryNormalizeEmail(email);
        var normalizedRoles = NormalizeRoles(roles, strict: false);

        if (!string.IsNullOrWhiteSpace(normalizedEmail))
        {
            var existentePorEmail = await _usuarios.GetByEmailAsync(normalizedEmail, ct);
            if (existentePorEmail is not null)
                throw new InvalidOperationException("E-mail já cadastrado para outro usuário.");
        }

        var existente = await _usuarios.GetByCpfAsync(sanitizedCpf, ct);
        if (existente is not null)
            throw new InvalidOperationException("CPF já cadastrado.");

        var agora = DateTimeOffset.UtcNow;
        var usuario = new Usuario
        {
            Cpf = sanitizedCpf,
            Email = normalizedEmail ?? $"{sanitizedCpf}@local",
            PasswordHash = HashPassword(senha),
            Ativo = true,
            CriadoEm = agora,
            AtualizadoEm = agora,
        };

        ApplyRoles(usuario, normalizedRoles);
        await _usuarios.AddAsync(usuario, ct);
        return ToDto(usuario);
    }

    public async Task<UsuarioDto> AutenticarLocalAsync(string cpf, string senha, CancellationToken ct)
    {
        var sanitizedCpf = SanitizeCpfOrNull(cpf) ?? throw new InvalidOperationException("CPF obrigatório.");
        if (string.IsNullOrWhiteSpace(senha))
            throw new InvalidOperationException("Senha obrigatória.");

        var usuario = await _usuarios.GetByCpfAsync(sanitizedCpf, ct)
            ?? throw new InvalidOperationException("Usuário não encontrado.");

        if (!usuario.Ativo)
            throw new InvalidOperationException("Usuário inativo.");

        if (!VerifyPassword(senha, usuario.PasswordHash))
            throw new InvalidOperationException("Senha inválida.");

        if (string.IsNullOrWhiteSpace(usuario.Email) && !string.IsNullOrWhiteSpace(usuario.Cpf))
        {
            usuario.Email = $"{usuario.Cpf}@local";
            usuario.AtualizadoEm = DateTimeOffset.UtcNow;
            await _usuarios.UpdateAsync(usuario, ct);
        }

        usuario = await SyncLocalWithEntraAsync(usuario, ct);
        return ToDto(usuario);
    }

    public async Task<UsuarioDto> AtualizarLocalAsync(Guid usuarioId, string email, string? cpf, IEnumerable<string>? roles, CancellationToken ct)
    {
        if (usuarioId == Guid.Empty)
            throw new InvalidOperationException("Identificador do usuário obrigatório.");

        if (string.IsNullOrWhiteSpace(email))
            throw new InvalidOperationException("E-mail obrigatório.");

        var normalizedEmail = NormalizeEmailValue(email);
        var sanitizedCpf = SanitizeCpfOrNull(cpf);
        var normalizedRoles = NormalizeRoles(roles, strict: false);

        var usuario = await _usuarios.GetByIdAsync(usuarioId, ct)
            ?? throw new InvalidOperationException("Usuário não encontrado.");

        if (!string.IsNullOrWhiteSpace(usuario.MicrosoftId))
            throw new InvalidOperationException("E-mail de usuário com SSO não pode ser alterado manualmente.");

        var existentePorEmail = await _usuarios.GetByEmailAsync(normalizedEmail, ct);
        if (existentePorEmail is not null && existentePorEmail.Id != usuario.Id)
            throw new InvalidOperationException("E-mail já cadastrado para outro usuário.");

        if (!string.IsNullOrWhiteSpace(sanitizedCpf))
        {
            if (!string.IsNullOrWhiteSpace(usuario.Cpf) && !string.Equals(usuario.Cpf, sanitizedCpf, StringComparison.Ordinal))
                throw new InvalidOperationException("CPF já cadastrado e não pode ser alterado.");

            if (string.IsNullOrWhiteSpace(usuario.Cpf))
            {
                usuario.Cpf = sanitizedCpf;
            }
        }

        usuario.Email = normalizedEmail;
        usuario.AtualizadoEm = DateTimeOffset.UtcNow;
        ApplyRoles(usuario, normalizedRoles);

        await _usuarios.UpdateAsync(usuario, ct);
        await _usuarios.ReplaceRolesAsync(usuario.Id, normalizedRoles, ct);

        var atualizado = await _usuarios.GetByIdAsync(usuario.Id, ct);
        return atualizado is not null ? ToDto(atualizado) : ToDto(usuario);
    }

    public async Task<UsuarioDto> AtualizarStatusAsync(Guid usuarioId, bool ativo, CancellationToken ct)
    {
        if (usuarioId == Guid.Empty)
            throw new InvalidOperationException("Identificador do usuário obrigatório.");

        var usuario = await _usuarios.GetByIdAsync(usuarioId, ct)
            ?? throw new InvalidOperationException("Usuário não encontrado.");

        usuario.Ativo = ativo;
        usuario.AtualizadoEm = DateTimeOffset.UtcNow;

        await _usuarios.UpdateAsync(usuario, ct);

        var atualizado = await _usuarios.GetByIdAsync(usuario.Id, ct);
        return atualizado is not null ? ToDto(atualizado) : ToDto(usuario);
    }

    public async Task<IReadOnlyCollection<UsuarioLookupDto>> BuscarEntraAsync(string termo, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(termo))
            return Array.Empty<UsuarioLookupDto>();

        var trimmed = termo.Trim();

        if (trimmed.Length < 3 && !Guid.TryParse(trimmed, out _))
            return Array.Empty<UsuarioLookupDto>();

        var encontrados = await _entraRoles.SearchUsersAsync(trimmed, ct);
        if (encontrados.Count == 0)
            return Array.Empty<UsuarioLookupDto>();

        var resultados = new List<UsuarioLookupDto>(encontrados.Count);
        var dedupe = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        foreach (var resultado in encontrados)
        {
            if (string.IsNullOrWhiteSpace(resultado.Email))
                continue;

            if (!dedupe.Add(resultado.Email))
                continue;

            resultados.Add(new UsuarioLookupDto(
                resultado.MicrosoftId,
                resultado.Email,
                resultado.Mail,
                resultado.UserPrincipalName,
                resultado.DisplayName));
        }

        return resultados;
    }

    public async Task<UsuarioSyncResult> SincronizarAsync(CancellationToken ct)
    {
        var remoteUsuarios = await _entraRoles.ListApplicationUsersAsync(ct);
        if (remoteUsuarios.Count == 0)
            return new UsuarioSyncResult(0, 0);

        var existentes = await _usuarios.ListAsync(ct);
        var existentesPorId = new Dictionary<string, Usuario>(StringComparer.OrdinalIgnoreCase);
        var existentesPorEmail = new Dictionary<string, Usuario>(StringComparer.OrdinalIgnoreCase);

        foreach (var usuario in existentes)
        {
            if (!string.IsNullOrWhiteSpace(usuario.MicrosoftId) && !existentesPorId.ContainsKey(usuario.MicrosoftId))
                existentesPorId[usuario.MicrosoftId] = usuario;

            var normalizado = TryNormalizeEmail(usuario.Email);
            if (!string.IsNullOrWhiteSpace(normalizado) && !existentesPorEmail.ContainsKey(normalizado))
                existentesPorEmail[normalizado] = usuario;
        }

        var novos = new List<Usuario>();
        var atualizados = new List<Usuario>();
        var atualizadosPorId = new HashSet<Guid>();
        var agora = DateTimeOffset.UtcNow;

        foreach (var remoto in remoteUsuarios)
        {
            var emailNormalizado = TryNormalizeEmail(remoto.Email);
            if (string.IsNullOrWhiteSpace(emailNormalizado))
                continue;

            if (existentesPorId.TryGetValue(remoto.MicrosoftId, out var existentePorId))
            {
                var emailAtual = TryNormalizeEmail(existentePorId.Email);
                if (!string.Equals(emailAtual, emailNormalizado, StringComparison.OrdinalIgnoreCase))
                {
                    if (!string.IsNullOrWhiteSpace(emailAtual) &&
                        existentesPorEmail.TryGetValue(emailAtual, out var usuarioAtual) &&
                        usuarioAtual.Id == existentePorId.Id)
                    {
                        existentesPorEmail.Remove(emailAtual);
                    }

                    existentePorId.Email = emailNormalizado;
                    existentePorId.AtualizadoEm = agora;

                    if (atualizadosPorId.Add(existentePorId.Id))
                        atualizados.Add(existentePorId);

                    existentesPorEmail[emailNormalizado] = existentePorId;
                }

                existentesPorId[remoto.MicrosoftId] = existentePorId;
                continue;
            }

            if (existentesPorEmail.TryGetValue(emailNormalizado, out var existentePorEmail))
            {
                if (!string.Equals(existentePorEmail.MicrosoftId, remoto.MicrosoftId, StringComparison.OrdinalIgnoreCase))
                {
                    var antigoId = existentePorEmail.MicrosoftId;
                    existentePorEmail.MicrosoftId = remoto.MicrosoftId;
                    existentePorEmail.AtualizadoEm = agora;

                    if (atualizadosPorId.Add(existentePorEmail.Id))
                        atualizados.Add(existentePorEmail);

                    if (!string.IsNullOrWhiteSpace(antigoId) &&
                        existentesPorId.TryGetValue(antigoId, out var usuarioAntigo) &&
                        usuarioAntigo.Id == existentePorEmail.Id)
                    {
                        existentesPorId.Remove(antigoId);
                    }
                }

                existentesPorId[remoto.MicrosoftId] = existentePorEmail;
                continue;
            }

            var roles = remoto.Roles.Count > 0
                ? NormalizeRoles(remoto.Roles, strict: false)
                : NormalizeRoles(null, strict: false);

            var novoUsuario = new Usuario
            {
                MicrosoftId = remoto.MicrosoftId,
                Email = emailNormalizado,
                Ativo = true,
                CriadoEm = agora,
                AtualizadoEm = agora,
            };

            ApplyRoles(novoUsuario, roles);
            novos.Add(novoUsuario);
            existentesPorId[remoto.MicrosoftId] = novoUsuario;
            existentesPorEmail[emailNormalizado] = novoUsuario;
        }

        if (novos.Count > 0)
            await _usuarios.AddRangeAsync(novos, ct);

        if (atualizados.Count > 0)
            await _usuarios.UpdateRangeAsync(atualizados, ct);

        return new UsuarioSyncResult(novos.Count, atualizados.Count);
    }

    private async Task<(Usuario? usuario, string? microsoftId)> FindExistingUsuarioAsync(string normalizedEmail, string? providedMicrosoftId, CancellationToken ct)
    {
        var normalizedMicrosoftId = NormalizeMicrosoftId(providedMicrosoftId);
        var existente = await _usuarios.GetByEmailAsync(normalizedEmail, ct);
        if (existente is not null)
        {
            var shouldSkipMicrosoftIdResolution = string.IsNullOrWhiteSpace(existente.MicrosoftId)
                && string.IsNullOrWhiteSpace(normalizedMicrosoftId)
                && !string.IsNullOrWhiteSpace(existente.PasswordHash);

            if (shouldSkipMicrosoftIdResolution)
                return (existente, null);

            var ensuredId = await EnsureMicrosoftIdAsync(existente, normalizedEmail, normalizedMicrosoftId, ct);
            return (existente, ensuredId);
        }

        if (normalizedMicrosoftId is not null)
        {
            var porIdPorToken = await _usuarios.GetByMicrosoftIdAsync(normalizedMicrosoftId, ct);
            if (porIdPorToken is not null)
            {
                var ensured = await EnsureMicrosoftIdAsync(porIdPorToken, normalizedEmail, normalizedMicrosoftId, ct);
                return (porIdPorToken, ensured);
            }
        }

        Guid resolvedId;
        try
        {
            resolvedId = await _entraRoles.ResolveUserIdAsync(normalizedEmail, ct);
        }
        catch (InvalidOperationException) when (normalizedMicrosoftId is not null)
        {
            var porIdPorToken = await _usuarios.GetByMicrosoftIdAsync(normalizedMicrosoftId, ct);
            if (porIdPorToken is not null)
            {
                var ensured = await EnsureMicrosoftIdAsync(porIdPorToken, normalizedEmail, normalizedMicrosoftId, ct);
                return (porIdPorToken, ensured);
            }

            return (null, normalizedMicrosoftId);
        }

        var microsoftId = resolvedId.ToString("D");

        var porId = await _usuarios.GetByMicrosoftIdAsync(microsoftId, ct);
        if (porId is not null)
        {
            var ensuredId = await EnsureMicrosoftIdAsync(porId, normalizedEmail, microsoftId, ct);
            return (porId, ensuredId);
        }

        return (null, microsoftId);
    }

    private async Task<string> EnsureMicrosoftIdAsync(Usuario usuario, string? normalizedEmail, string? fallbackMicrosoftId, CancellationToken ct)
    {
        var emailParaUso = normalizedEmail ?? TryNormalizeEmail(usuario.Email);
        var needsUpdate = false;
        string? microsoftIdParaUso = null;

        if (!string.IsNullOrWhiteSpace(usuario.MicrosoftId) && Guid.TryParse(usuario.MicrosoftId, out var parsed))
        {
            microsoftIdParaUso = parsed.ToString("D");
            if (!string.Equals(usuario.MicrosoftId, microsoftIdParaUso, StringComparison.Ordinal))
            {
                usuario.MicrosoftId = microsoftIdParaUso;
                needsUpdate = true;
            }
        }
        else if (!string.IsNullOrWhiteSpace(fallbackMicrosoftId) && Guid.TryParse(fallbackMicrosoftId, out var parsedFallback))
        {
            microsoftIdParaUso = parsedFallback.ToString("D");
            usuario.MicrosoftId = microsoftIdParaUso;
            needsUpdate = true;
        }
        else
        {
            if (string.IsNullOrWhiteSpace(emailParaUso))
                throw new InvalidOperationException("Não foi possível determinar o usuário no Microsoft Entra ID.");

            var resolved = await _entraRoles.ResolveUserIdAsync(emailParaUso, ct);
            microsoftIdParaUso = resolved.ToString("D");
            usuario.MicrosoftId = microsoftIdParaUso;
            needsUpdate = true;
        }

        if (!string.IsNullOrWhiteSpace(emailParaUso) && !string.Equals(usuario.Email, emailParaUso, StringComparison.OrdinalIgnoreCase))
        {
            usuario.Email = emailParaUso;
            needsUpdate = true;
        }

        if (needsUpdate)
        {
            usuario.AtualizadoEm = DateTimeOffset.UtcNow;
            await _usuarios.UpdateAsync(usuario, ct);
        }

        return usuario.MicrosoftId ?? throw new InvalidOperationException("Não foi possível determinar o usuário no Microsoft Entra ID.");
    }

    private async Task<Usuario> SyncFromEntraAsync(Usuario usuario, string normalizedEmail, string microsoftId, CancellationToken ct)
    {
        var normalizedMicrosoftId = NormalizeMicrosoftId(microsoftId)
            ?? throw new InvalidOperationException("Identificador do usuário no Microsoft Entra ID inválido.");

        var remoteRoles = await _entraRoles.GetUserRolesAsync(normalizedEmail, ct);
        var normalizedRoles = NormalizeRoles(remoteRoles, strict: false);
        var needsUpdate = false;

        if (!string.Equals(usuario.MicrosoftId, normalizedMicrosoftId, StringComparison.OrdinalIgnoreCase))
        {
            usuario.MicrosoftId = normalizedMicrosoftId;
            needsUpdate = true;
        }

        if (!string.Equals(usuario.Email, normalizedEmail, StringComparison.OrdinalIgnoreCase))
        {
            usuario.Email = normalizedEmail;
            needsUpdate = true;
        }

        if (needsUpdate)
        {
            usuario.AtualizadoEm = DateTimeOffset.UtcNow;
            await _usuarios.UpdateAsync(usuario, ct);
        }

        await _usuarios.ReplaceRolesAsync(usuario.Id, normalizedRoles, ct);
        var atualizado = await _usuarios.GetByIdAsync(usuario.Id, ct);
        return atualizado ?? usuario;
    }

    private async Task<Usuario> SyncLocalWithEntraAsync(Usuario usuario, CancellationToken ct)
    {
        var normalizedEmail = TryNormalizeEmail(usuario.Email);
        if (string.IsNullOrWhiteSpace(normalizedEmail))
            return await EnsureRolesAsync(usuario, ct);

        try
        {
            var microsoftGuid = await _entraRoles.ResolveUserIdAsync(normalizedEmail, ct);
            var microsoftId = microsoftGuid.ToString("D");

            return await SyncFromEntraAsync(usuario, normalizedEmail, microsoftId, ct);
        }
        catch (InvalidOperationException)
        {
            return await EnsureRolesAsync(usuario, ct);
        }
    }

    private async Task<Usuario> EnsureRolesAsync(Usuario usuario, CancellationToken ct, string? knownMicrosoftId = null)
    {
        var normalizedEmail = TryNormalizeEmail(usuario.Email);
        var microsoftId = knownMicrosoftId;

        if (string.IsNullOrWhiteSpace(usuario.MicrosoftId) && string.IsNullOrWhiteSpace(microsoftId))
        {
            if (!usuario.Roles.Any())
            {
                var defaultRoles = NormalizeRoles(null);
                await _usuarios.ReplaceRolesAsync(usuario.Id, defaultRoles, ct);
                var atualizadoLocal = await _usuarios.GetByIdAsync(usuario.Id, ct);
                if (atualizadoLocal is not null)
                    return atualizadoLocal;
            }

            return usuario;
        }

        if (string.IsNullOrWhiteSpace(microsoftId) ||
            string.IsNullOrWhiteSpace(usuario.MicrosoftId) ||
            !string.Equals(usuario.MicrosoftId, microsoftId, StringComparison.OrdinalIgnoreCase))
        {
            microsoftId = await EnsureMicrosoftIdAsync(usuario, normalizedEmail, microsoftId, ct);
        }

        if (usuario.Roles.Any())
            return usuario;

        var remoteRoles = await _entraRoles.GetUserRolesAsync(microsoftId!, ct);
        var normalized = remoteRoles.Count > 0
            ? NormalizeRoles(remoteRoles, strict: false)
            : NormalizeRoles(null);

        await _usuarios.ReplaceRolesAsync(usuario.Id, normalized, ct);
        var atualizado = await _usuarios.GetByIdAsync(usuario.Id, ct);
        return atualizado ?? usuario;
    }

    private static void ApplyRoles(Usuario usuario, IReadOnlyCollection<string> roles)
    {
        usuario.Roles.Clear();
        foreach (var role in roles)
        {
            usuario.Roles.Add(new UsuarioRole
            {
                Role = role,
                Usuario = usuario
            });
        }
    }

    private static UsuarioDto ToDto(Usuario usuario)
    {
        var roles = usuario.Roles
            .Select(r => r.Role)
            .Where(r => !string.IsNullOrWhiteSpace(r))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .OrderBy(r => r)
            .ToArray();

        if (roles.Length == 0)
        {
            roles = NormalizeRoles(null).ToArray();
        }

        var microsoftId = !string.IsNullOrWhiteSpace(usuario.MicrosoftId)
            ? usuario.MicrosoftId
            : string.Empty;

        var email = usuario.Email ?? string.Empty;

        return new UsuarioDto(usuario.Id, microsoftId, email, usuario.Ativo, usuario.Cpf, roles, usuario.CriadoEm, usuario.AtualizadoEm);
    }

    private static string? TryNormalizeEmail(string? email)
    {
        if (string.IsNullOrWhiteSpace(email))
            return null;

        var trimmed = email.Trim();
        if (trimmed.Length == 0 || !trimmed.Contains('@'))
            return null;

        return trimmed.ToLowerInvariant();
    }

    private static string? NormalizeMicrosoftId(string? microsoftId)
    {
        if (string.IsNullOrWhiteSpace(microsoftId))
            return null;

        var trimmed = microsoftId.Trim();
        if (trimmed.Length == 0)
            return null;

        return Guid.TryParse(trimmed, out var parsed)
            ? parsed.ToString("D")
            : trimmed;
    }

    private static string NormalizeEmailValue(string email)
    {
        var normalized = TryNormalizeEmail(email);
        if (normalized is null)
            throw new InvalidOperationException("E-mail do usuário inválido.");

        return normalized;
    }

    private static string HashPassword(string password)
    {
        var salt = RandomNumberGenerator.GetBytes(16);
        var hash = Rfc2898DeriveBytes.Pbkdf2(Encoding.UTF8.GetBytes(password), salt, 100_000, HashAlgorithmName.SHA256, 32);
        return $"{Convert.ToBase64String(salt)}.{Convert.ToBase64String(hash)}";
    }

    private static bool VerifyPassword(string password, string? stored)
    {
        if (string.IsNullOrWhiteSpace(stored))
            return false;

        var parts = stored.Split('.', 2);
        if (parts.Length != 2)
            return false;

        try
        {
            var salt = Convert.FromBase64String(parts[0]);
            var expected = Convert.FromBase64String(parts[1]);
            var hash = Rfc2898DeriveBytes.Pbkdf2(Encoding.UTF8.GetBytes(password), salt, 100_000, HashAlgorithmName.SHA256, expected.Length);
            return CryptographicOperations.FixedTimeEquals(hash, expected);
        }
        catch
        {
            return false;
        }
    }

    private static IReadOnlyList<string> NormalizeRoles(IEnumerable<string>? roles, bool strict = true)
    {
        var normalized = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        if (roles is not null)
        {
            foreach (var role in roles)
            {
                if (string.IsNullOrWhiteSpace(role))
                    continue;

                var trimmed = role.Trim();
                var allowed = AllowedRoles.FirstOrDefault(r => r.Equals(trimmed, StringComparison.OrdinalIgnoreCase));
                if (allowed is null)
                {
                    if (strict)
                        throw new InvalidOperationException($"Perfil inválido: {trimmed}.");

                    continue;
                }

                normalized.Add(allowed);
            }
        }

        if (!normalized.Contains(DefaultRole))
            normalized.Add(DefaultRole);

        return normalized.OrderBy(r => r).ToArray();
    }

    private static string? SanitizeCpfOrNull(string? cpf)
    {
        if (string.IsNullOrWhiteSpace(cpf))
            return null;

        var sanitized = CpfRules.Sanitize(cpf);
        if (!CpfRules.IsValid(sanitized))
            throw new InvalidOperationException("CPF inválido.");

        return sanitized;
    }
}
