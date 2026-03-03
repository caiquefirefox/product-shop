using PremieRpet.Shop.Domain.Entities;

namespace PremieRpet.Shop.Application.Interfaces.Repositories;

public interface IPedidoIntegracaoRepository
{
    IQueryable<PedidoIntegracaoLog> QueryLogs();
    IQueryable<PedidoIntegracaoStatus> QueryStatus();
    Task AddLogAsync(PedidoIntegracaoLog log, CancellationToken ct);
}
