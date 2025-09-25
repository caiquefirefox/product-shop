using PremieRpet.Shop.Domain.Entities;

namespace PremieRpet.Shop.Application.Interfaces.Repositories;

public interface IUsuarioRepository
{
    Task<Usuario?> GetByMicrosoftIdAsync(string microsoftId, CancellationToken ct);
    Task AddAsync(Usuario usuario, CancellationToken ct);
    Task UpdateAsync(Usuario usuario, CancellationToken ct);
}
