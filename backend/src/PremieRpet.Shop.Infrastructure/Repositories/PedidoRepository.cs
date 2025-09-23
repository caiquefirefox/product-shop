using Microsoft.EntityFrameworkCore;
using PremieRpet.Shop.Application.Interfaces.Repositories;
using PremieRpet.Shop.Domain.Entities;

namespace PremieRpet.Shop.Infrastructure.Repositories;

public sealed class PedidoRepository : IPedidoRepository
{
    private readonly ShopDbContext _db;
    public PedidoRepository(ShopDbContext db) => _db = db;

    public async Task AddAsync(Pedido pedido, CancellationToken ct)
    {
        _db.Pedidos.Add(pedido);
        await _db.SaveChangesAsync(ct);
    }

    public IQueryable<Pedido> Query() => _db.Pedidos.Include(p => p.Itens).AsQueryable();
}
