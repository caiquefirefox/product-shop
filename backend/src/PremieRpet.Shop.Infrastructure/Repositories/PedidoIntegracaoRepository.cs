using Microsoft.EntityFrameworkCore;
using PremieRpet.Shop.Application.Interfaces.Repositories;
using PremieRpet.Shop.Domain.Entities;

namespace PremieRpet.Shop.Infrastructure.Repositories;

public sealed class PedidoIntegracaoRepository(ShopDbContext db) : IPedidoIntegracaoRepository
{
    public IQueryable<PedidoIntegracaoLog> QueryLogs() => db.PedidoIntegracaoLogs.AsQueryable();

    public IQueryable<PedidoIntegracaoStatus> QueryStatus() => db.PedidoIntegracaoStatus.AsQueryable();

    public async Task AddLogAsync(PedidoIntegracaoLog log, CancellationToken ct)
    {
        db.PedidoIntegracaoLogs.Add(log);
        await db.SaveChangesAsync(ct);
    }
}
