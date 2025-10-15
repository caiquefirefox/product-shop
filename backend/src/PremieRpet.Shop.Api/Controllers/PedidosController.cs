using System;
using System.Collections.Generic;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PremieRpet.Shop.Api.Contracts;
using PremieRpet.Shop.Api.Security;
using PremieRpet.Shop.Application.DTOs;
using PremieRpet.Shop.Application.Interfaces.UseCases;

namespace PremieRpet.Shop.Api.Controllers;

[ApiController]
[Route("api/pedidos")]
public sealed class PedidosController(IPedidoService pedidos, IUsuarioService usuarios) : ControllerBase
{
    [HttpGet]
    [Authorize]
    public async Task<ActionResult<PagedResultDto<PedidoDetalheDto>>> Listar([FromQuery] PedidoListQuery query, CancellationToken ct)
    {
        var usuarioEmail = User.GetUserEmail();
        if (string.IsNullOrWhiteSpace(usuarioEmail))
            return Problem(title: "Token sem e-mail do usuário (preferred_username/email).", statusCode: StatusCodes.Status401Unauthorized);

        var usuario = await usuarios.ObterOuCriarAsync(usuarioEmail, ct);
        var filtro = query?.ToDto() ?? new PedidoListFiltroDto(
            PedidoListFiltroDto.DefaultPage,
            PedidoListFiltroDto.DefaultPageSize,
            null,
            null,
            null,
            null,
            null
        );

        var resultado = await pedidos.ListarPedidosGerenciaveisAsync(filtro, usuario.Id, User.IsInRole("Admin"), ct);
        return Ok(resultado);
    }

    [HttpGet("resumo-mensal")]
    [Authorize]
    public async Task<ActionResult<PedidoResumoMensalDto>> ResumoMensal([FromQuery] PedidoResumoMensalQuery query, CancellationToken ct)
    {
        var usuarioEmail = User.GetUserEmail();
        if (string.IsNullOrWhiteSpace(usuarioEmail))
            return Problem(title: "Token sem e-mail do usuário (preferred_username/email).", statusCode: StatusCodes.Status401Unauthorized);

        var usuario = await usuarios.ObterOuCriarAsync(usuarioEmail, ct);
        var agora = DateTimeOffset.UtcNow;
        var inicioPadrao = new DateTimeOffset(new DateTime(agora.Year, agora.Month, 1, 0, 0, 0, DateTimeKind.Utc));
        var fimPadrao = inicioPadrao.AddMonths(1).AddTicks(-1);
        var (de, ate, usuarioIdFiltro, statusIdFiltro) = query?.Normalize(agora) ?? (inicioPadrao, fimPadrao, (Guid?)null, (int?)null);

        var isAdmin = User.IsInRole("Admin");
        if (!isAdmin)
        {
            usuarioIdFiltro = null;
        }

        var resumo = await pedidos.ObterResumoAsync(de, ate, usuario.Id, isAdmin, usuarioIdFiltro, statusIdFiltro, ct);
        return Ok(resumo);
    }

    [HttpGet("status")]
    [Authorize]
    public async Task<ActionResult<IReadOnlyList<PedidoStatusDto>>> Status(CancellationToken ct)
    {
        var lista = await pedidos.ListarStatusAsync(ct);
        return Ok(lista);
    }

    [HttpPost("{id:guid}/aprovar")]
    [Authorize("Admin")]
    public async Task<ActionResult<PedidoDetalheDto>> Aprovar(Guid id, CancellationToken ct)
    {
        var usuarioEmail = User.GetUserEmail();
        if (string.IsNullOrWhiteSpace(usuarioEmail))
            return Problem(title: "Token sem e-mail do usuário (preferred_username/email).", statusCode: StatusCodes.Status401Unauthorized);

        var usuarioNome = User.GetDisplayName() ?? string.Empty;
        var usuario = await usuarios.ObterOuCriarAsync(usuarioEmail, ct);

        try
        {
            var atualizado = await pedidos.AprovarPedidoAsync(id, usuario.Id, usuarioNome, ct);
            return Ok(atualizado);
        }
        catch (InvalidOperationException ex)
        {
            return Problem(detail: ex.Message, statusCode: StatusCodes.Status400BadRequest);
        }
    }

    [HttpPost("{id:guid}/cancelar")]
    [Authorize]
    public async Task<ActionResult<PedidoDetalheDto>> Cancelar(Guid id, CancellationToken ct)
    {
        var usuarioEmail = User.GetUserEmail();
        if (string.IsNullOrWhiteSpace(usuarioEmail))
            return Problem(title: "Token sem e-mail do usuário (preferred_username/email).", statusCode: StatusCodes.Status401Unauthorized);

        var usuarioNome = User.GetDisplayName() ?? string.Empty;
        var usuario = await usuarios.ObterOuCriarAsync(usuarioEmail, ct);

        try
        {
            var atualizado = await pedidos.CancelarPedidoAsync(id, usuario.Id, usuarioNome, User.IsInRole("Admin"), ct);
            return Ok(atualizado);
        }
        catch (InvalidOperationException ex)
        {
            return Problem(detail: ex.Message, statusCode: StatusCodes.Status400BadRequest);
        }
    }

    [HttpGet("{id:guid}")]
    [Authorize]
    public async Task<ActionResult<PedidoDetalheCompletoDto>> Obter(Guid id, CancellationToken ct)
    {
        var usuarioEmail = User.GetUserEmail();
        if (string.IsNullOrWhiteSpace(usuarioEmail))
            return Problem(title: "Token sem e-mail do usuário (preferred_username/email).", statusCode: StatusCodes.Status401Unauthorized);

        var usuario = await usuarios.ObterOuCriarAsync(usuarioEmail, ct);
        var detalhe = await pedidos.ObterPedidoCompletoAsync(id, usuario.Id, User.IsInRole("Admin"), ct);
        if (detalhe is null)
            return NotFound();

        return Ok(detalhe);
    }

    [HttpPut("{id:guid}")]
    [Authorize]
    public async Task<ActionResult<PedidoDetalheDto>> Atualizar(Guid id, [FromBody] PedidoUpdateRequest request, CancellationToken ct)
    {
        if (!ModelState.IsValid)
            return ValidationProblem(ModelState);

        var usuarioEmail = User.GetUserEmail();
        if (string.IsNullOrWhiteSpace(usuarioEmail))
            return Problem(title: "Token sem e-mail do usuário (preferred_username/email).", statusCode: StatusCodes.Status401Unauthorized);

        var usuarioNome = User.GetDisplayName() ?? "";
        var usuario = await usuarios.ObterOuCriarAsync(usuarioEmail, ct);

        try
        {
            var dto = request.ToDto();
            var atualizado = await pedidos.AtualizarPedidoAsync(id, dto, usuario.Id, usuarioNome, User.IsInRole("Admin"), ct);
            return Ok(atualizado);
        }
        catch (InvalidOperationException ex)
        {
            return Problem(detail: ex.Message, statusCode: StatusCodes.Status400BadRequest);
        }
    }
}
