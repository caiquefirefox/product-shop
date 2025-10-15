using System;
using System.Collections.Generic;

namespace PremieRpet.Shop.Application.Interfaces.Services;

public interface IEntraIdRoleService
{
    Task<Guid> ResolveUserIdAsync(string userEmail, CancellationToken ct);
    Task<IReadOnlyList<string>> GetUserRolesAsync(string userEmail, CancellationToken ct);
    Task ReplaceUserRolesAsync(string userEmail, IEnumerable<string> roles, CancellationToken ct);
}
