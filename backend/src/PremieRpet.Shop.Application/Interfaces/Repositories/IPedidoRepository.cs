using PremieRpet.Shop.Domain.Entities;

namespace PremieRpet.Shop.Application.Interfaces.Repositories;

public interface IPedidoRepository
{
    Task AddAsync(Pedido pedido, CancellationToken ct);
    Task UpdateAsync(Pedido pedido, CancellationToken ct);
    Task<Pedido?> GetByIdAsync(Guid id, CancellationToken ct);
    Task<Pedido?> GetWithItensAsync(Guid id, CancellationToken ct);
    Task AddHistoricoAsync(PedidoHistorico historico, CancellationToken ct);
    IQueryable<Pedido> Query();
}
