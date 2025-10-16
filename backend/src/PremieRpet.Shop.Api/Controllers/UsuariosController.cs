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

        var usuarioId = User.GetUserObjectId();
        var perfil = await usuarios.ObterOuCriarAsync(usuarioEmail, usuarioId, ct);
        return Ok(perfil);
    }

    [HttpGet]
    [Authorize("Admin")]
    public async Task<IActionResult> Listar(CancellationToken ct)
    {
        var lista = await usuarios.ListAsync(ct);
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
            var resultado = await usuarios.UpsertAsync(request.Email, request.Cpf, request.Roles, ct);
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
            var perfil = await usuarios.RegistrarCpfAsync(usuarioEmail, usuarioId, request.Cpf, ct);
            return Ok(perfil);
        }
        catch (InvalidOperationException ex)
        {
            return Problem(detail: ex.Message, statusCode: StatusCodes.Status400BadRequest);
        }
    }
}
