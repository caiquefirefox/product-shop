using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using PremieRpet.Shop.Domain.Entities;

namespace PremieRpet.Shop.Application.Interfaces.Repositories;

public interface IUnidadeEntregaRepository
{
    Task<IReadOnlyList<UnidadeEntrega>> ListarAsync(CancellationToken ct);
    Task<UnidadeEntrega?> ObterPorIdAsync(Guid id, CancellationToken ct);
}
