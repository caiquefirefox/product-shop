using System;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PremieRpet.Shop.Api.Contracts;
using PremieRpet.Shop.Api.Security;
using PremieRpet.Shop.Application.DTOs;
using PremieRpet.Shop.Application.Interfaces.UseCases;

namespace PremieRpet.Shop.Api.Controllers;

[ApiController]
[Route("api/usuarios")]
public sealed class UsuariosController(IUsuarioService usuarios) : ControllerBase
{
    [HttpGet("me")]
    [Authorize]
    public async Task<IActionResult> Me(CancellationToken ct)
    {
        var usuarioEmail = User.GetUserEmail();
        if (string.IsNullOrWhiteSpace(usuarioEmail))
            return Problem(title: "Token sem e-mail do usuário (preferred_username/email).", statusCode: StatusCodes.Status401Unauthorized);

        try
        {
            var usuarioId = User.GetUserObjectId();
            var usuarioNome = User.GetDisplayName();
            var perfil = await usuarios.ObterOuCriarAsync(usuarioEmail, usuarioId, usuarioNome, ct);
            return Ok(perfil);
        }
        catch (InvalidOperationException ex)
        {
            return Problem(detail: ex.Message, statusCode: StatusCodes.Status403Forbidden);
        }
    }

    [HttpGet]
    [Authorize("Admin")]
    public async Task<ActionResult<PagedResultDto<UsuarioDto>>> Listar([FromQuery] UsuarioListQuery query, CancellationToken ct)
    {
        var lista = await usuarios.ListAsync(query.ToDto(), ct);
        return Ok(lista);
    }

    [HttpGet("buscar")]
    [Authorize("Admin")]
    public async Task<IActionResult> Buscar([FromQuery] string termo, CancellationToken ct)
    {
        try
        {
            var resultados = await usuarios.BuscarEntraAsync(termo, ct);
            return Ok(resultados);
        }
        catch (InvalidOperationException ex)
        {
            return Problem(detail: ex.Message, statusCode: StatusCodes.Status400BadRequest);
        }
    }

    [HttpPost]
    [Authorize("Admin")]
    public async Task<IActionResult> Upsert([FromBody] UsuarioUpsertRequest request, CancellationToken ct)
    {
        try
        {
            var resultado = await usuarios.UpsertAsync(request.Email, request.Cpf, request.Nome, request.Roles, request.SemLimite, ct);
            return Ok(resultado);
        }
        catch (InvalidOperationException ex)
        {
            return Problem(detail: ex.Message, statusCode: StatusCodes.Status400BadRequest);
        }
    }

    [HttpPost("lote")]
    [Authorize("Admin")]
    public async Task<IActionResult> UpsertLote([FromBody] UsuarioUpsertBatchRequest request, CancellationToken ct)
    {
        try
        {
            var resultado = await usuarios.UpsertEmLoteAsync(request.ToDto(), ct);
            return Ok(resultado);
        }
        catch (InvalidOperationException ex)
        {
            return Problem(detail: ex.Message, statusCode: StatusCodes.Status400BadRequest);
        }
    }

    [HttpPost("local")]
    [Authorize("Admin")]
    public async Task<IActionResult> CriarLocal([FromBody] UsuarioLocalRequest request, CancellationToken ct)
    {
        try
        {
            var resultado = await usuarios.CriarLocalAsync(request.Cpf, request.Senha, request.Roles, request.Email, request.Nome, request.SemLimite, ct);
            return Ok(resultado);
        }
        catch (InvalidOperationException ex)
        {
            return Problem(detail: ex.Message, statusCode: StatusCodes.Status400BadRequest);
        }
    }

    [HttpPut("local/{id:guid}")]
    [Authorize("Admin")]
    public async Task<IActionResult> AtualizarLocal(Guid id, [FromBody] UsuarioLocalUpdateRequest request, CancellationToken ct)
    {
        try
        {
            var resultado = await usuarios.AtualizarLocalAsync(id, request.Email, request.Cpf, request.Nome, request.Roles, request.SemLimite, ct);
            return Ok(resultado);
        }
        catch (InvalidOperationException ex)
        {
            return Problem(detail: ex.Message, statusCode: StatusCodes.Status400BadRequest);
        }
    }

    [HttpPut("{id:guid}/status")]
    [Authorize("Admin")]
    public async Task<IActionResult> AtualizarStatus(Guid id, [FromBody] UsuarioStatusRequest request, CancellationToken ct)
    {
        try
        {
            var resultado = await usuarios.AtualizarStatusAsync(id, request.Ativo, ct);
            return Ok(resultado);
        }
        catch (InvalidOperationException ex)
        {
            return Problem(detail: ex.Message, statusCode: StatusCodes.Status400BadRequest);
        }
    }

    [HttpPost("sincronizar")]
    [Authorize("Admin")]
    public async Task<IActionResult> Sincronizar(CancellationToken ct)
    {
        try
        {
            var resultado = await usuarios.SincronizarAsync(ct);
            return Ok(new UsuarioSyncResponse(resultado.Inseridos, resultado.Atualizados));
        }
        catch (InvalidOperationException ex)
        {
            return Problem(detail: ex.Message, statusCode: StatusCodes.Status400BadRequest);
        }
    }

    [HttpPut("me/cpf")]
    [Authorize]
    public async Task<IActionResult> DefinirCpf([FromBody] UsuarioCpfRequest request, CancellationToken ct)
    {
        var usuarioEmail = User.GetUserEmail();
        if (string.IsNullOrWhiteSpace(usuarioEmail))
            return Problem(title: "Token sem e-mail do usuário (preferred_username/email).", statusCode: StatusCodes.Status401Unauthorized);

        try
        {
            var usuarioId = User.GetUserObjectId();
            var usuarioNome = User.GetDisplayName();
            var perfil = await usuarios.RegistrarCpfAsync(usuarioEmail, usuarioId, request.Cpf, usuarioNome, ct);
            return Ok(perfil);
        }
        catch (InvalidOperationException ex)
        {
            return Problem(detail: ex.Message, statusCode: StatusCodes.Status400BadRequest);
        }
    }
}
