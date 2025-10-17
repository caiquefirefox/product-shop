using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using PremieRpet.Shop.Application.DTOs;

namespace PremieRpet.Shop.Application.Interfaces.UseCases;

public interface IUnidadeEntregaService
{
    Task<IReadOnlyList<UnidadeEntregaDto>> ListarAsync(CancellationToken ct);
    Task<UnidadeEntregaDto?> ObterAsync(Guid id, CancellationToken ct);
}
