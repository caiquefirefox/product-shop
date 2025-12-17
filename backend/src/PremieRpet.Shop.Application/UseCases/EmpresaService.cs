using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using PremieRpet.Shop.Application.DTOs;
using PremieRpet.Shop.Application.Interfaces.Repositories;
using PremieRpet.Shop.Application.Interfaces.UseCases;

namespace PremieRpet.Shop.Application.UseCases;

public sealed class EmpresaService : IEmpresaService
{
    private readonly IEmpresaRepository _repo;

    public EmpresaService(IEmpresaRepository repo)
    {
        _repo = repo;
    }

    public async Task<IReadOnlyList<EmpresaDto>> ListarAsync(CancellationToken ct)
        => (await _repo.ListarAsync(ct))
            .Select(e => new EmpresaDto(e.Id, e.Nome))
            .ToList();

    public async Task<EmpresaDto?> ObterAsync(Guid id, CancellationToken ct)
    {
        var empresa = await _repo.ObterPorIdAsync(id, ct);
        return empresa is null ? null : new EmpresaDto(empresa.Id, empresa.Nome);
    }
}
