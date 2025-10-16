using System;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PremieRpet.Shop.Api.Reports;
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

    [HttpGet("pedidos/excel")]
    [Authorize("Admin")]
    public async Task<IActionResult> PedidosExcel(
        [FromQuery] DateTimeOffset? de,
        [FromQuery] DateTimeOffset? ate,
        [FromQuery] Guid? usuarioId,
        [FromQuery] int? statusId,
        CancellationToken ct)
    {
        var pedidos = await svc.ListarPedidosDetalhadosAsync(de, ate, usuarioId, statusId, ct);
        var arquivo = PedidosExcelExporter.Gerar(pedidos);
        var nomeArquivo = $"relatorio-pedidos-{DateTimeOffset.UtcNow:yyyyMMddHHmmss}.xlsx";
        return new FileContentResult(arquivo, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
        {
            FileDownloadName = nomeArquivo
        };
    }
}
