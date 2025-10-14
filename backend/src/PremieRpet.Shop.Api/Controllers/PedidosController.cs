using System;
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
        var usuarioMicrosoftId = User.GetUserId();
        if (string.IsNullOrWhiteSpace(usuarioMicrosoftId))
            return Problem(title: "Token sem identificador de usuário (oid/sub).", statusCode: StatusCodes.Status401Unauthorized);

        var usuario = await usuarios.ObterOuCriarAsync(usuarioMicrosoftId, ct);
        var filtro = query?.ToDto() ?? new PedidoListFiltroDto(PedidoListFiltroDto.DefaultPage, PedidoListFiltroDto.DefaultPageSize, null, null, null);

        var resultado = await pedidos.ListarPedidosGerenciaveisAsync(filtro, usuario.Id, User.IsInRole("Admin"), ct);
        return Ok(resultado);
    }

    [HttpGet("resumo-mensal")]
    [Authorize]
    public async Task<ActionResult<PedidoResumoMensalDto>> ResumoMensal([FromQuery] PedidoResumoMensalQuery query, CancellationToken ct)
    {
        var usuarioMicrosoftId = User.GetUserId();
        if (string.IsNullOrWhiteSpace(usuarioMicrosoftId))
            return Problem(title: "Token sem identificador de usuário (oid/sub).", statusCode: StatusCodes.Status401Unauthorized);

        var usuario = await usuarios.ObterOuCriarAsync(usuarioMicrosoftId, ct);
        var (ano, mes, usuarioIdFiltro) = query?.Normalize(DateTimeOffset.UtcNow) ?? (DateTimeOffset.UtcNow.Year, DateTimeOffset.UtcNow.Month, (Guid?)null);

        if (!User.IsInRole("Admin"))
        {
            usuarioIdFiltro = null;
        }

        var resumo = await pedidos.ObterResumoMensalAsync(ano, mes, usuario.Id, User.IsInRole("Admin"), usuarioIdFiltro, ct);
        return Ok(resumo);
    }

    [HttpGet("{id:guid}")]
    [Authorize]
    public async Task<ActionResult<PedidoDetalheCompletoDto>> Obter(Guid id, CancellationToken ct)
    {
        var usuarioMicrosoftId = User.GetUserId();
        if (string.IsNullOrWhiteSpace(usuarioMicrosoftId))
            return Problem(title: "Token sem identificador de usuário (oid/sub).", statusCode: StatusCodes.Status401Unauthorized);

        var usuario = await usuarios.ObterOuCriarAsync(usuarioMicrosoftId, ct);
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

        var usuarioMicrosoftId = User.GetUserId();
        if (string.IsNullOrWhiteSpace(usuarioMicrosoftId))
            return Problem(title: "Token sem identificador de usuário (oid/sub).", statusCode: StatusCodes.Status401Unauthorized);

        var usuarioNome = User.GetDisplayName() ?? "";
        var usuario = await usuarios.ObterOuCriarAsync(usuarioMicrosoftId, ct);

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
