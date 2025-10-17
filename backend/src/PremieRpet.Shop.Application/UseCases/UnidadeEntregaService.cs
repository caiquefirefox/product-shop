using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using PremieRpet.Shop.Application.DTOs;
using PremieRpet.Shop.Application.Interfaces.Repositories;
using PremieRpet.Shop.Application.Interfaces.UseCases;

namespace PremieRpet.Shop.Application.UseCases;

public sealed class UnidadeEntregaService : IUnidadeEntregaService
{
    private readonly IUnidadeEntregaRepository _repo;

    public UnidadeEntregaService(IUnidadeEntregaRepository repo)
        => _repo = repo;

    public async Task<IReadOnlyList<UnidadeEntregaDto>> ListarAsync(CancellationToken ct)
    {
        var unidades = await _repo.ListarAsync(ct);
        return unidades
            .Select(u => new UnidadeEntregaDto(u.Id, u.Nome))
            .ToList();
    }

    public async Task<UnidadeEntregaDto?> ObterAsync(Guid id, CancellationToken ct)
    {
        var unidade = await _repo.ObterPorIdAsync(id, ct);
        return unidade is null ? null : new UnidadeEntregaDto(unidade.Id, unidade.Nome);
    }
}
