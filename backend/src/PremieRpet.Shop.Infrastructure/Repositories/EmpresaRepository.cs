using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using PremieRpet.Shop.Application.Interfaces.Repositories;
using PremieRpet.Shop.Domain.Entities;

namespace PremieRpet.Shop.Infrastructure.Repositories;

public sealed class EmpresaRepository : IEmpresaRepository
{
    private readonly ShopDbContext _db;

    public EmpresaRepository(ShopDbContext db)
    {
        _db = db;
    }

    public async Task<IReadOnlyList<Empresa>> ListarAsync(CancellationToken ct)
        => await _db.Empresas
            .AsNoTracking()
            .OrderBy(e => e.Nome)
            .ToListAsync(ct);

    public async Task<Empresa?> ObterPorIdAsync(Guid id, CancellationToken ct)
        => await _db.Empresas
            .AsNoTracking()
            .FirstOrDefaultAsync(e => e.Id == id, ct);
}
