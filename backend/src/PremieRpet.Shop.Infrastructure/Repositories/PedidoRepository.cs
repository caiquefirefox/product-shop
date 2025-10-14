using System;
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

    public async Task UpdateAsync(Pedido pedido, CancellationToken ct)
    {
        if (_db.Entry(pedido).State == EntityState.Detached)
        {
            _db.Pedidos.Attach(pedido);
            _db.Entry(pedido).State = EntityState.Modified;
        }

        await _db.SaveChangesAsync(ct);
    }

    public async Task<Pedido?> GetByIdAsync(Guid id, CancellationToken ct)
        => await _db.Pedidos.FirstOrDefaultAsync(p => p.Id == id, ct);

    public async Task<Pedido?> GetWithItensAsync(Guid id, CancellationToken ct)
        => await _db.Pedidos
            .Include(p => p.Status)
            .Include(p => p.Itens)
                .ThenInclude(i => i.Produto)
            .Include(p => p.Historicos)
                .ThenInclude(h => h.Usuario)
            .FirstOrDefaultAsync(p => p.Id == id, ct);

    public async Task AddHistoricoAsync(PedidoHistorico historico, CancellationToken ct)
    {
        _db.PedidoHistoricos.Add(historico);
        await _db.SaveChangesAsync(ct);
    }

    public IQueryable<Pedido> Query() => _db.Pedidos
        .Include(p => p.Status)
        .Include(p => p.Itens)
            .ThenInclude(i => i.Produto)
        .AsQueryable();

    public IQueryable<PedidoStatus> StatusQuery() => _db.PedidoStatus.AsQueryable();
}
