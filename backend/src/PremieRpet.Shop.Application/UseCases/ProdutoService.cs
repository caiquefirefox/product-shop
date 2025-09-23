using Microsoft.EntityFrameworkCore;
using PremieRpet.Shop.Application.DTOs;
using PremieRpet.Shop.Application.Interfaces.Repositories;
using PremieRpet.Shop.Application.Interfaces.UseCases;
using PremieRpet.Shop.Domain.Entities;
using PremieRpet.Shop.Domain.Enums;

namespace PremieRpet.Shop.Application.UseCases;

public sealed class ProdutoService : IProdutoService
{
    private readonly IProdutoRepository _repo;
    public ProdutoService(IProdutoRepository repo) => _repo = repo;

    public async Task CreateAsync(string codigo, ProdutoCreateUpdateDto dto, CancellationToken ct)
    {
        if (await _repo.ExistsAsync(codigo, ct))
            throw new InvalidOperationException($"Produto {codigo} já existe.");

        var prod = new Produto
        {
            Codigo = codigo,
            Descricao = dto.Descricao,
            Peso = dto.Peso,
            TipoPeso = (TipoPeso)dto.TipoPeso,
            Sabores = dto.Sabores,
            Preco = dto.Preco,
            QuantidadeMinimaDeCompra = dto.QuantidadeMinimaDeCompra
        };
        await _repo.AddAsync(prod, ct);
    }

    public async Task DeleteAsync(string codigo, CancellationToken ct)
    {
        var prod = await _repo.GetAsync(codigo, ct) ?? throw new InvalidOperationException("Produto não encontrado.");
        await _repo.DeleteAsync(prod, ct);
    }

    public async Task<ProdutoDto?> GetByCodigoAsync(string codigo, CancellationToken ct)
    {
        var p = await _repo.Query().AsNoTracking().FirstOrDefaultAsync(x => x.Codigo == codigo, ct);
        return p is null ? null : new ProdutoDto(p.Codigo, p.Descricao, p.Peso, (int)p.TipoPeso, p.Sabores, p.Preco, p.QuantidadeMinimaDeCompra);
    }

    public async Task<IReadOnlyList<ProdutoDto>> ListAsync(string? filtro, CancellationToken ct)
    {
        var q = _repo.Query().AsNoTracking();
        if (!string.IsNullOrWhiteSpace(filtro))
            q = q.Where(p => p.Descricao.ToLower().Contains(filtro.ToLower()));

        return await q.OrderBy(p => p.Descricao)
            .Select(p => new ProdutoDto(p.Codigo, p.Descricao, p.Peso, (int)p.TipoPeso, p.Sabores, p.Preco, p.QuantidadeMinimaDeCompra))
            .ToListAsync(ct);
    }

    public async Task UpdateAsync(string codigo, ProdutoCreateUpdateDto dto, CancellationToken ct)
    {
        var prod = await _repo.GetAsync(codigo, ct) ?? throw new InvalidOperationException("Produto não encontrado.");
        prod.Descricao = dto.Descricao;
        prod.Peso = dto.Peso;
        prod.TipoPeso = (TipoPeso)dto.TipoPeso;
        prod.Sabores = dto.Sabores;
        prod.Preco = dto.Preco;
        prod.QuantidadeMinimaDeCompra = dto.QuantidadeMinimaDeCompra;
        await _repo.UpdateAsync(prod, ct);
    }
}
