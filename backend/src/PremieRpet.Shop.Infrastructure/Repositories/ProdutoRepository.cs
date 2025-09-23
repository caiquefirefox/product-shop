using Microsoft.EntityFrameworkCore;
using PremieRpet.Shop.Application.Interfaces.Repositories;
using PremieRpet.Shop.Domain.Entities;

namespace PremieRpet.Shop.Infrastructure.Repositories;

public sealed class ProdutoRepository : IProdutoRepository
{
    private readonly ShopDbContext _db;
    public ProdutoRepository(ShopDbContext db) => _db = db;

    public async Task AddAsync(Produto produto, CancellationToken ct)
    {
        _db.Produtos.Add(produto);
        await _db.SaveChangesAsync(ct);
    }

    public async Task DeleteAsync(Produto produto, CancellationToken ct)
    {
        _db.Produtos.Remove(produto);
        await _db.SaveChangesAsync(ct);
    }

    public async Task<bool> ExistsAsync(string codigo, CancellationToken ct)
        => await _db.Produtos.AnyAsync(p => p.Codigo == codigo, ct);

    public async Task<Produto?> GetAsync(string codigo, CancellationToken ct)
        => await _db.Produtos.FirstOrDefaultAsync(p => p.Codigo == codigo, ct);

    public IQueryable<Produto> Query() => _db.Produtos.AsQueryable();

    public async Task UpdateAsync(Produto produto, CancellationToken ct)
    {
        _db.Produtos.Update(produto);
        await _db.SaveChangesAsync(ct);
    }
}
