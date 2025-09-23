using System;
using System.Collections.Generic;
using System.Linq;
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
        => await Query()
            .FirstOrDefaultAsync(p => p.Codigo == codigo, ct);

    public async Task<IReadOnlyList<ProdutoEspecieOpcao>> ListarEspeciesAsync(CancellationToken ct)
        => await _db.ProdutoEspecieOpcoes
            .OrderBy(o => o.Nome)
            .ToListAsync(ct);

    public async Task<IReadOnlyList<ProdutoPorteOpcao>> ListarPortesAsync(CancellationToken ct)
        => await _db.ProdutoPorteOpcoes
            .OrderBy(o => o.Nome)
            .ToListAsync(ct);

    public async Task<IReadOnlyList<ProdutoTipoProdutoOpcao>> ListarTiposProdutoAsync(CancellationToken ct)
        => await _db.ProdutoTipoProdutoOpcoes
            .OrderBy(o => o.Nome)
            .ToListAsync(ct);

    public async Task<ProdutoEspecieOpcao?> ObterEspecieAsync(Guid id, CancellationToken ct)
        => await _db.ProdutoEspecieOpcoes.FirstOrDefaultAsync(o => o.Id == id, ct);

    public async Task<ProdutoTipoProdutoOpcao?> ObterTipoProdutoAsync(Guid id, CancellationToken ct)
        => await _db.ProdutoTipoProdutoOpcoes.FirstOrDefaultAsync(o => o.Id == id, ct);

    public async Task<IReadOnlyList<ProdutoPorteOpcao>> ObterPortesAsync(IEnumerable<Guid> ids, CancellationToken ct)
    {
        var portesIds = ids.Distinct().ToList();
        if (portesIds.Count == 0)
            return Array.Empty<ProdutoPorteOpcao>();

        return await _db.ProdutoPorteOpcoes
            .Where(o => portesIds.Contains(o.Id))
            .ToListAsync(ct);
    }

    public IQueryable<Produto> Query()
        => _db.Produtos
            .Include(p => p.EspecieOpcao)
            .Include(p => p.TipoProdutoOpcao)
            .Include(p => p.Portes)
                .ThenInclude(pp => pp.PorteOpcao)
            .AsQueryable();

    public async Task UpdateAsync(Produto produto, CancellationToken ct)
    {
        _db.Produtos.Update(produto);
        await _db.SaveChangesAsync(ct);
    }
}
