using PremieRpet.Shop.Domain.Entities;

namespace PremieRpet.Shop.Application.Interfaces.Repositories;

public interface IPedidoRepository
{
    Task AddAsync(Pedido pedido, CancellationToken ct);
    IQueryable<Pedido> Query();
}
