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
            p.FaixaEtariaOpcaoId,
            p.FaixaEtariaOpcao?.Nome ?? string.Empty,
            p.Preco,
            p.QuantidadeMinimaDeCompra,
            p.ImagemUrl);
    }

    private static IReadOnlyList<Guid> NormalizarPortes(IReadOnlyList<Guid> ids)
    {
        if (ids == null)
            return Array.Empty<Guid>();
        return ids.Where(id => id != Guid.Empty).Distinct().ToList();
    }

    public async Task CreateAsync(string codigo, ProdutoCreateUpdateDto dto, string usuarioMicrosoftId, CancellationToken ct)
    {
        if (await _repo.ExistsAsync(codigo, ct))
            throw new InvalidOperationException($"Produto {codigo} já existe.");

        var especie = await _repo.ObterEspecieAsync(dto.EspecieOpcaoId, ct)
            ?? throw new InvalidOperationException("Espécie inválida.");
        var tipoProduto = await _repo.ObterTipoProdutoAsync(dto.TipoProdutoOpcaoId, ct)
            ?? throw new InvalidOperationException("Tipo de produto inválido.");
        var faixaEtaria = await _repo.ObterFaixaEtariaAsync(dto.FaixaEtariaOpcaoId, ct)
            ?? throw new InvalidOperationException("Faixa etária inválida.");

        var porteIds = NormalizarPortes(dto.PorteOpcaoIds);
        var portes = await _repo.ObterPortesAsync(porteIds, ct);
        if (porteIds.Count != portes.Count)
            throw new InvalidOperationException("Um ou mais portes são inválidos.");

        var agora = DateTimeOffset.UtcNow;

        var prod = new Produto
        {
            Codigo = codigo,
            Descricao = dto.Descricao,
            Peso = dto.Peso,
            TipoPeso = (TipoPeso)dto.TipoPeso,
            Sabores = dto.Sabores,
            EspecieOpcaoId = especie.Id,
            TipoProdutoOpcaoId = tipoProduto.Id,
            FaixaEtariaOpcaoId = faixaEtaria.Id,
            Preco = dto.Preco,
            QuantidadeMinimaDeCompra = Math.Max(1, dto.QuantidadeMinimaDeCompra),
            ImagemUrl = string.IsNullOrWhiteSpace(dto.ImagemUrl) ? null : dto.ImagemUrl,
            Portes = portes.Select(p => new ProdutoPorte { PorteOpcaoId = p.Id }).ToList(),
            CriadoEm = agora,
            AtualizadoEm = agora,
            CriadoPorUsuarioId = usuarioMicrosoftId,
            AtualizadoPorUsuarioId = usuarioMicrosoftId
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

    public async Task<PagedResultDto<ProdutoDto>> ListAsync(ProdutoFiltroDto? filtro, CancellationToken ct)
    {
        var query = _repo.Query().AsNoTracking();

        var page = 1;
        var pageSize = ProdutoFiltroDto.DefaultPageSize;

        if (filtro is not null)
        {
            if (!string.IsNullOrWhiteSpace(filtro.Codigo))
            {
                var codigo = filtro.Codigo.Trim().ToLower();
                query = query.Where(p => p.Codigo.ToLower().Contains(codigo));
            }

            if (!string.IsNullOrWhiteSpace(filtro.Descricao))
            {
                var descricao = filtro.Descricao.Trim().ToLower();
                query = query.Where(p => p.Descricao.ToLower().Contains(descricao));
            }

            if (filtro.TipoProdutoOpcaoId is Guid tipoProdutoId && tipoProdutoId != Guid.Empty)
                query = query.Where(p => p.TipoProdutoOpcaoId == tipoProdutoId);

            if (filtro.EspecieOpcaoId is Guid especieId && especieId != Guid.Empty)
                query = query.Where(p => p.EspecieOpcaoId == especieId);

            if (filtro.FaixaEtariaOpcaoId is Guid faixaEtariaId && faixaEtariaId != Guid.Empty)
                query = query.Where(p => p.FaixaEtariaOpcaoId == faixaEtariaId);

            if (filtro.PorteOpcaoId is Guid porteId && porteId != Guid.Empty)
                query = query.Where(p => p.Portes.Any(pp => pp.PorteOpcaoId == porteId));

            if (filtro.Page > 0)
                page = filtro.Page;

            if (filtro.PageSize > 0)
                pageSize = filtro.PageSize;
        }

        var totalItems = await query.CountAsync(ct);

        if (totalItems == 0)
        {
            return new PagedResultDto<ProdutoDto>(
                Array.Empty<ProdutoDto>(),
                1,
                pageSize,
                0,
                0);
        }

        var totalPages = (int)Math.Ceiling(totalItems / (double)pageSize);
        if (page > totalPages)
            page = totalPages;

        var skip = (page - 1) * pageSize;

        var produtos = await query
            .OrderBy(p => p.Descricao)
            .Skip(skip)
            .Take(pageSize)
            .ToListAsync(ct);

        return new PagedResultDto<ProdutoDto>(
            produtos.Select(MapToDto).ToList(),
            page,
            pageSize,
            totalItems,
            totalPages);
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

    public async Task<IReadOnlyList<ProdutoOpcaoDto>> ListarFaixasEtariasAsync(CancellationToken ct)
        => (await _repo.ListarFaixasEtariasAsync(ct))
            .Select(o => new ProdutoOpcaoDto(o.Id, o.Nome))
            .ToList();

    public async Task UpdateAsync(string codigo, ProdutoCreateUpdateDto dto, string usuarioMicrosoftId, CancellationToken ct)
    {
        var prod = await _repo.GetAsync(codigo, ct) ?? throw new InvalidOperationException("Produto não encontrado.");
        var especie = await _repo.ObterEspecieAsync(dto.EspecieOpcaoId, ct)
            ?? throw new InvalidOperationException("Espécie inválida.");
        var tipoProduto = await _repo.ObterTipoProdutoAsync(dto.TipoProdutoOpcaoId, ct)
            ?? throw new InvalidOperationException("Tipo de produto inválido.");
        var faixaEtaria = await _repo.ObterFaixaEtariaAsync(dto.FaixaEtariaOpcaoId, ct)
            ?? throw new InvalidOperationException("Faixa etária inválida.");

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
        prod.FaixaEtariaOpcaoId = faixaEtaria.Id;
        prod.Preco = dto.Preco;
        prod.QuantidadeMinimaDeCompra = Math.Max(1, dto.QuantidadeMinimaDeCompra);
        prod.ImagemUrl = string.IsNullOrWhiteSpace(dto.ImagemUrl) ? null : dto.ImagemUrl;

        prod.Portes ??= new List<ProdutoPorte>();
        prod.Portes.Clear();
        foreach (var porte in portes)
            prod.Portes.Add(new ProdutoPorte { ProdutoId = prod.Id, PorteOpcaoId = porte.Id });

        prod.AtualizadoEm = DateTimeOffset.UtcNow;
        prod.AtualizadoPorUsuarioId = usuarioMicrosoftId;

        await _repo.UpdateAsync(prod, ct);
    }
}
