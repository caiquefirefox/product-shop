using System;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PremieRpet.Shop.Application.DTOs;
using PremieRpet.Shop.Application.Interfaces.UseCases;

namespace PremieRpet.Shop.Api.Controllers;

[ApiController]
[Route("api/relatorios")]
public class RelatoriosController(IPedidoService svc) : ControllerBase
{
    [HttpGet("pedidos")]
    [Authorize("Admin")]
    public Task<IReadOnlyList<PedidoResumoDto>> Pedidos([FromQuery] DateTimeOffset? de, [FromQuery] DateTimeOffset? ate, CancellationToken ct)
        => svc.ListarPedidosAsync(de, ate, ct);

    [HttpGet("pedidos/detalhes")]
    [Authorize("Admin")]
    public Task<IReadOnlyList<PedidoDetalheDto>> PedidosDetalhes(
        [FromQuery] DateTimeOffset? de,
        [FromQuery] DateTimeOffset? ate,
        [FromQuery] Guid? usuarioId,
        [FromQuery] int? statusId,
        CancellationToken ct)
        => svc.ListarPedidosDetalhadosAsync(de, ate, usuarioId, statusId, ct);
}
