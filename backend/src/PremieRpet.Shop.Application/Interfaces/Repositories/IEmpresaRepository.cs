using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using PremieRpet.Shop.Domain.Entities;

namespace PremieRpet.Shop.Application.Interfaces.Repositories;

public interface IEmpresaRepository
{
    Task<IReadOnlyList<Empresa>> ListarAsync(CancellationToken ct);
    Task<Empresa?> ObterPorIdAsync(Guid id, CancellationToken ct);
}
