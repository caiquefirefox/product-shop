using PremieRpet.Shop.Domain.Entities;

namespace PremieRpet.Shop.Application.Interfaces.Repositories;

public interface IProdutoRepository
{
    Task<Produto?> GetAsync(string codigo, CancellationToken ct);
    Task<bool> ExistsAsync(string codigo, CancellationToken ct);
    Task AddAsync(Produto produto, CancellationToken ct);
    Task UpdateAsync(Produto produto, CancellationToken ct);
    Task DeleteAsync(Produto produto, CancellationToken ct);
    IQueryable<Produto> Query();
}
