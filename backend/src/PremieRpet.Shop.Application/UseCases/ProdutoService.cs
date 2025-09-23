using System;
using System.Collections.Generic;
using System.Linq;
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

    private static ProdutoDto MapToDto(Produto p)
    {
        var portesOrdenados = p.Portes
            .Select(pp => pp.PorteOpcao)
            .Where(po => po is not null)
            .OrderBy(po => po!.Nome)
            .ToList();

        var porteIds = portesOrdenados.Select(po => po!.Id).ToList();
        var porteNomes = portesOrdenados.Select(po => po!.Nome).ToList();

        return new ProdutoDto(
            p.Codigo,
            p.Descricao,
            p.Peso,
            (int)p.TipoPeso,
            p.Sabores,
            p.EspecieOpcaoId,
            p.EspecieOpcao?.Nome ?? string.Empty,
            porteIds,
            porteNomes,
            p.TipoProdutoOpcaoId,
            p.TipoProdutoOpcao?.Nome ?? string.Empty,
            p.Preco,
            p.QuantidadeMinimaDeCompra);
    }

    private static IReadOnlyList<Guid> NormalizarPortes(IReadOnlyList<Guid> ids)
        => ids?.Where(id => id != Guid.Empty).Distinct().ToList() ?? Array.Empty<Guid>();

    public async Task CreateAsync(string codigo, ProdutoCreateUpdateDto dto, CancellationToken ct)
    {
        if (await _repo.ExistsAsync(codigo, ct))
            throw new InvalidOperationException($"Produto {codigo} já existe.");

        var especie = await _repo.ObterEspecieAsync(dto.EspecieOpcaoId, ct)
            ?? throw new InvalidOperationException("Espécie inválida.");
        var tipoProduto = await _repo.ObterTipoProdutoAsync(dto.TipoProdutoOpcaoId, ct)
            ?? throw new InvalidOperationException("Tipo de produto inválido.");

        var porteIds = NormalizarPortes(dto.PorteOpcaoIds);
        var portes = await _repo.ObterPortesAsync(porteIds, ct);
        if (porteIds.Count != portes.Count)
            throw new InvalidOperationException("Um ou mais portes são inválidos.");

        var prod = new Produto
        {
            Codigo = codigo,
            Descricao = dto.Descricao,
            Peso = dto.Peso,
            TipoPeso = (TipoPeso)dto.TipoPeso,
            Sabores = dto.Sabores,
            EspecieOpcaoId = especie.Id,
            TipoProdutoOpcaoId = tipoProduto.Id,
            Preco = dto.Preco,
            QuantidadeMinimaDeCompra = Math.Max(1, dto.QuantidadeMinimaDeCompra),
            Portes = portes.Select(p => new ProdutoPorte { PorteOpcaoId = p.Id }).ToList()
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
        return p is null ? null : MapToDto(p);
    }

    public async Task<IReadOnlyList<ProdutoDto>> ListAsync(string? filtro, CancellationToken ct)
    {
        var q = _repo.Query().AsNoTracking();
        if (!string.IsNullOrWhiteSpace(filtro))
            q = q.Where(p => p.Descricao.ToLower().Contains(filtro.ToLower()));

        var produtos = await q.OrderBy(p => p.Descricao).ToListAsync(ct);
        return produtos.Select(MapToDto).ToList();
    }

    public async Task<IReadOnlyList<ProdutoOpcaoDto>> ListarEspeciesAsync(CancellationToken ct)
        => (await _repo.ListarEspeciesAsync(ct))
            .Select(o => new ProdutoOpcaoDto(o.Id, o.Nome))
            .ToList();

    public async Task<IReadOnlyList<ProdutoOpcaoDto>> ListarPortesAsync(CancellationToken ct)
        => (await _repo.ListarPortesAsync(ct))
            .Select(o => new ProdutoOpcaoDto(o.Id, o.Nome))
            .ToList();

    public async Task<IReadOnlyList<ProdutoOpcaoDto>> ListarTiposProdutoAsync(CancellationToken ct)
        => (await _repo.ListarTiposProdutoAsync(ct))
            .Select(o => new ProdutoOpcaoDto(o.Id, o.Nome))
            .ToList();

    public async Task UpdateAsync(string codigo, ProdutoCreateUpdateDto dto, CancellationToken ct)
    {
        var prod = await _repo.GetAsync(codigo, ct) ?? throw new InvalidOperationException("Produto não encontrado.");
        var especie = await _repo.ObterEspecieAsync(dto.EspecieOpcaoId, ct)
            ?? throw new InvalidOperationException("Espécie inválida.");
        var tipoProduto = await _repo.ObterTipoProdutoAsync(dto.TipoProdutoOpcaoId, ct)
            ?? throw new InvalidOperationException("Tipo de produto inválido.");

        var porteIds = NormalizarPortes(dto.PorteOpcaoIds);
        var portes = await _repo.ObterPortesAsync(porteIds, ct);
        if (porteIds.Count != portes.Count)
            throw new InvalidOperationException("Um ou mais portes são inválidos.");

        prod.Descricao = dto.Descricao;
        prod.Peso = dto.Peso;
        prod.TipoPeso = (TipoPeso)dto.TipoPeso;
        prod.Sabores = dto.Sabores;
        prod.EspecieOpcaoId = especie.Id;
        prod.TipoProdutoOpcaoId = tipoProduto.Id;
        prod.Preco = dto.Preco;
        prod.QuantidadeMinimaDeCompra = Math.Max(1, dto.QuantidadeMinimaDeCompra);

        prod.Portes ??= new List<ProdutoPorte>();
        prod.Portes.Clear();
        foreach (var porte in portes)
            prod.Portes.Add(new ProdutoPorte { ProdutoId = prod.Id, PorteOpcaoId = porte.Id });

        await _repo.UpdateAsync(prod, ct);
    }
}
