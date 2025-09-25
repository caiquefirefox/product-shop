using System;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PremieRpet.Shop.Api.Security;
using PremieRpet.Shop.Application.DTOs;
using PremieRpet.Shop.Application.Interfaces.UseCases;
using PremieRpet.Shop.Domain.Entities;
using System.Security.Claims;

namespace PremieRpet.Shop.Api.Controllers;

[ApiController]
[Route("api/checkout")]
public class CheckoutController(IPedidoService pedidos, IHttpContextAccessor ctx) : ControllerBase
{
    [HttpPost]
    [Authorize]
    public async Task<IActionResult> Criar([FromBody] PedidoCreateDto dto, CancellationToken ct)
    {
        var usuarioId = User.GetUserId();
        if (string.IsNullOrWhiteSpace(usuarioId))
            return Problem(title: "Token sem identificador de usuário (oid/sub).", statusCode: StatusCodes.Status401Unauthorized);

        var usuarioNome = User.GetDisplayName();
        if (string.IsNullOrWhiteSpace(usuarioNome))
            return Problem(title: "Token sem identificador de nome de usuário.", statusCode: StatusCodes.Status401Unauthorized);

        try
        {
            var pedidoId = await pedidos.CriarPedidoAsync(usuarioId, usuarioNome, dto, ct);
            return Ok(new { id = pedidoId });
        }
        catch (InvalidOperationException ex)
        {
            return Problem(detail: ex.Message, statusCode: StatusCodes.Status400BadRequest);
        }
    }
}
