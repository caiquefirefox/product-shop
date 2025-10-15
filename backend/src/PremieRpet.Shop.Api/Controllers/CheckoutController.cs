using System;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PremieRpet.Shop.Api.Security;
using PremieRpet.Shop.Application.DTOs;
using PremieRpet.Shop.Application.Interfaces.UseCases;

namespace PremieRpet.Shop.Api.Controllers;

[ApiController]
[Route("api/checkout")]
public class CheckoutController(IPedidoService pedidos, IHttpContextAccessor ctx) : ControllerBase
{
    [HttpPost]
    [Authorize]
    public async Task<IActionResult> Criar([FromBody] PedidoCreateDto dto, CancellationToken ct)
    {
        var usuarioEmail = User.GetUserEmail();
        if (string.IsNullOrWhiteSpace(usuarioEmail))
            return Problem(title: "Token sem e-mail do usuário (preferred_username/email).", statusCode: StatusCodes.Status401Unauthorized);

        var usuarioNome = User.GetDisplayName();
        if (string.IsNullOrWhiteSpace(usuarioNome))
            return Problem(title: "Token sem identificador de nome de usuário.", statusCode: StatusCodes.Status401Unauthorized);

        try
        {
            var pedido = await pedidos.CriarPedidoAsync(usuarioEmail, usuarioNome, dto, ct);
            return Ok(new { id = pedido.Id });
        }
        catch (InvalidOperationException ex)
        {
            return Problem(detail: ex.Message, statusCode: StatusCodes.Status400BadRequest);
        }
    }
}
