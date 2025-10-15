using System;
using System.Collections.Generic;
using PremieRpet.Shop.Domain.Entities;

namespace PremieRpet.Shop.Application.Interfaces.Repositories;

public interface IUsuarioRepository
{
    Task<Usuario?> GetByMicrosoftIdAsync(string microsoftId, CancellationToken ct);
    Task<Usuario?> GetByIdAsync(Guid id, CancellationToken ct);
    Task<IReadOnlyList<Usuario>> ListAsync(CancellationToken ct);
    Task AddAsync(Usuario usuario, CancellationToken ct);
    Task UpdateAsync(Usuario usuario, CancellationToken ct);
    Task ReplaceRolesAsync(Guid usuarioId, IEnumerable<string> roles, CancellationToken ct);
}
