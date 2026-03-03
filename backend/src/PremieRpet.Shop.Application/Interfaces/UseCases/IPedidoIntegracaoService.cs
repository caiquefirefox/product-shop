using PremieRpet.Shop.Application.DTOs;

namespace PremieRpet.Shop.Application.Interfaces.UseCases;

public interface IPedidoIntegracaoService
{
    Task<IReadOnlyList<PedidoIntegracaoStatusDto>> ListarStatusAsync(CancellationToken ct);
    Task<PedidoIntegracaoLogDto> RegistrarAsync(PedidoIntegracaoLogCreateDto dto, CancellationToken ct);
}
