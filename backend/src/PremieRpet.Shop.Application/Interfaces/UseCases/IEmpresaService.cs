using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using PremieRpet.Shop.Application.DTOs;

namespace PremieRpet.Shop.Application.Interfaces.UseCases;

public interface IEmpresaService
{
    Task<IReadOnlyList<EmpresaDto>> ListarAsync(CancellationToken ct);
    Task<EmpresaDto?> ObterAsync(Guid id, CancellationToken ct);
}
