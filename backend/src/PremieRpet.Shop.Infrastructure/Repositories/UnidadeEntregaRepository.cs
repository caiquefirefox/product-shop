using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using PremieRpet.Shop.Application.Interfaces.Repositories;
using PremieRpet.Shop.Domain.Entities;

namespace PremieRpet.Shop.Infrastructure.Repositories;

public sealed class UnidadeEntregaRepository : IUnidadeEntregaRepository
{
    private readonly ShopDbContext _db;

    public UnidadeEntregaRepository(ShopDbContext db)
        => _db = db;

    public async Task<IReadOnlyList<UnidadeEntrega>> ListarAsync(Guid? empresaId, CancellationToken ct)
    {
        var query = _db.UnidadesEntrega
            .AsNoTracking()
            .AsQueryable();

        if (empresaId.HasValue)
            query = query.Where(u => u.EmpresaId == empresaId.Value);

        return await query
            .OrderBy(u => u.Nome)
            .ToListAsync(ct);
    }

    public async Task<UnidadeEntrega?> ObterPorIdAsync(Guid id, CancellationToken ct)
        => await _db.UnidadesEntrega
            .AsNoTracking()
            .Include(u => u.Empresa)
            .FirstOrDefaultAsync(u => u.Id == id, ct);
}
