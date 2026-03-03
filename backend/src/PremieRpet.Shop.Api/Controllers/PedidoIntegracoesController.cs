using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PremieRpet.Shop.Application.DTOs;
using PremieRpet.Shop.Application.Interfaces.UseCases;

namespace PremieRpet.Shop.Api.Controllers;

[ApiController]
[Route("api/pedidos/integracoes")]
public class PedidoIntegracoesController(IPedidoIntegracaoService service) : ControllerBase
{
    [HttpGet("status")]
    [Authorize("Admin")]
    public Task<IReadOnlyList<PedidoIntegracaoStatusDto>> ListarStatus(CancellationToken ct)
        => service.ListarStatusAsync(ct);

    [HttpPost]
    [Authorize("Admin")]
    public Task<PedidoIntegracaoLogDto> Registrar([FromBody] PedidoIntegracaoLogCreateDto dto, CancellationToken ct)
        => service.RegistrarAsync(dto, ct);
}
