using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace PremieRpet.Shop.Application.Interfaces.Services;

public interface IEntraIdRoleService
{
    Task<Guid> ResolveUserIdAsync(string userEmail, CancellationToken ct);
    Task<IReadOnlyList<string>> GetUserRolesAsync(string userEmail, CancellationToken ct);
    Task ReplaceUserRolesAsync(string userEmail, IEnumerable<string> roles, CancellationToken ct);
    Task<IReadOnlyList<EntraUserResult>> SearchUsersAsync(string query, CancellationToken ct);
    Task<IReadOnlyList<EntraUserWithRolesResult>> ListApplicationUsersAsync(CancellationToken ct);
}

public sealed record EntraUserResult(
    string MicrosoftId,
    string Email,
    string? Mail,
    string? UserPrincipalName,
    string? DisplayName
);

public sealed record EntraUserWithRolesResult(
    string MicrosoftId,
    string Email,
    string? DisplayName,
    IReadOnlyCollection<string> Roles
);
