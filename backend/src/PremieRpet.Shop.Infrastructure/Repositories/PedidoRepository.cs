using System;
using System.Collections.Generic;
using System.Linq;
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
            _db.ChangeTracker.TrackGraph(pedido, node =>
            {
                switch (node.Entry.Entity)
                {
                    case Pedido:
                        node.Entry.State = EntityState.Modified;
                        break;
                    case PedidoItem item:
                        node.Entry.State = item.Id == Guid.Empty
                            ? EntityState.Added
                            : EntityState.Modified;
                        break;
                    case PedidoHistorico historico:
                        node.Entry.State = historico.Id == Guid.Empty
                            ? EntityState.Added
                            : EntityState.Unchanged;
                        break;
                    default:
                        node.Entry.State = node.Entry.IsKeySet
                            ? EntityState.Modified
                            : EntityState.Added;
                        break;
                }
            });

            var idsAtuais = pedido.Itens.Select(i => i.Id).ToHashSet();
            var itensRemovidos = await _db.PedidoItens
                .Where(i => i.PedidoId == pedido.Id && !idsAtuais.Contains(i.Id))
                .ToListAsync(ct);

            if (itensRemovidos.Count > 0)
                _db.PedidoItens.RemoveRange(itensRemovidos);
        }

        foreach (var historico in pedido.Historicos)
        {
            var entry = _db.Entry(historico);

            if (historico.Id == Guid.Empty)
            {
                entry.State = EntityState.Added;

                if (historico.PedidoId == Guid.Empty)
                    historico.PedidoId = pedido.Id;
            }
            else if (entry.State == EntityState.Detached)
            {
                entry.State = EntityState.Unchanged;
            }
            else if (entry.State == EntityState.Modified)
            {
                entry.State = EntityState.Unchanged;
            }
        }

        foreach (var entry in _db.ChangeTracker.Entries<PedidoItem>())
        {
            if (entry.State == EntityState.Added && entry.Entity.Id == Guid.Empty)
                entry.Entity.Id = Guid.NewGuid();
        }

        foreach (var entry in _db.ChangeTracker.Entries<PedidoHistorico>())
        {
            if (entry.State == EntityState.Added && entry.Entity.Id == Guid.Empty)
                entry.Entity.Id = Guid.NewGuid();
        }

        await _db.SaveChangesAsync(ct);
    }

    public async Task<Pedido?> GetByIdAsync(Guid id, CancellationToken ct)
        => await _db.Pedidos
             .Include(p => p.Empresa)
            .FirstOrDefaultAsync(p => p.Id == id, ct);

    public async Task<Pedido?> GetWithItensAsync(Guid id, CancellationToken ct)
        => await _db.Pedidos
            .Include(p => p.Status)
             .Include(p => p.Empresa)
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
         .Include(p => p.Empresa)
        .Include(p => p.Itens)
            .ThenInclude(i => i.Produto)
        .AsQueryable();

    public IQueryable<PedidoStatus> StatusQuery() => _db.PedidoStatus.AsQueryable();
}
