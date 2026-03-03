using PremieRpet.Shop.Application.DTOs;

namespace PremieRpet.Shop.Application.Interfaces.UseCases;

public interface IPedidoIntegracaoService
{
    Task<PedidoIntegracaoLogDto> RegistrarAsync(PedidoIntegracaoLogCreateDto dto, CancellationToken ct);
}
