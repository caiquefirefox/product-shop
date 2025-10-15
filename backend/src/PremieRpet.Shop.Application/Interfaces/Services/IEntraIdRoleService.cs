using System.Collections.Generic;

namespace PremieRpet.Shop.Application.Interfaces.Services;

public interface IEntraIdRoleService
{
    Task<IReadOnlyList<string>> GetUserRolesAsync(string userObjectId, CancellationToken ct);
    Task ReplaceUserRolesAsync(string userObjectId, IEnumerable<string> roles, CancellationToken ct);
}
