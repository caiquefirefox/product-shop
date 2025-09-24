using System;
using System.Collections.Generic;
using PremieRpet.Shop.Domain.Entities;

namespace PremieRpet.Shop.Application.Interfaces.Repositories;

public interface IProdutoRepository
{
    Task<Produto?> GetAsync(string codigo, CancellationToken ct);
    Task<bool> ExistsAsync(string codigo, CancellationToken ct);
    Task AddAsync(Produto produto, CancellationToken ct);
    Task UpdateAsync(Produto produto, CancellationToken ct);
    Task DeleteAsync(Produto produto, CancellationToken ct);
    Task<IReadOnlyList<ProdutoEspecieOpcao>> ListarEspeciesAsync(CancellationToken ct);
    Task<IReadOnlyList<ProdutoPorteOpcao>> ListarPortesAsync(CancellationToken ct);
    Task<IReadOnlyList<ProdutoTipoOpcao>> ListarTiposProdutoAsync(CancellationToken ct);
    Task<IReadOnlyList<ProdutoFaixaEtariaOpcao>> ListarFaixasEtariasAsync(CancellationToken ct);
    Task<ProdutoEspecieOpcao?> ObterEspecieAsync(Guid id, CancellationToken ct);
    Task<ProdutoTipoOpcao?> ObterTipoProdutoAsync(Guid id, CancellationToken ct);
    Task<ProdutoFaixaEtariaOpcao?> ObterFaixaEtariaAsync(Guid id, CancellationToken ct);
    Task<IReadOnlyList<ProdutoPorteOpcao>> ObterPortesAsync(IEnumerable<Guid> ids, CancellationToken ct);
    IQueryable<Produto> Query();
}
