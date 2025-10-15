using System;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PremieRpet.Shop.Api.Contracts;
using PremieRpet.Shop.Api.Security;
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
        var usuarioId = User.GetUserId();
        if (string.IsNullOrWhiteSpace(usuarioId))
            return Problem(title: "Token sem identificador de usuário (oid/sub).", statusCode: StatusCodes.Status401Unauthorized);

        var perfil = await usuarios.ObterOuCriarAsync(usuarioId, ct);
        return Ok(perfil);
    }

    [HttpGet]
    [Authorize("Admin")]
    public async Task<IActionResult> Listar(CancellationToken ct)
    {
        var lista = await usuarios.ListAsync(ct);
        return Ok(lista);
    }

    [HttpPost]
    [Authorize("Admin")]
    public async Task<IActionResult> Upsert([FromBody] UsuarioUpsertRequest request, CancellationToken ct)
    {
        try
        {
            var resultado = await usuarios.UpsertAsync(request.MicrosoftId, request.Cpf, request.Roles, ct);
            return Ok(resultado);
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
        var usuarioId = User.GetUserId();
        if (string.IsNullOrWhiteSpace(usuarioId))
            return Problem(title: "Token sem identificador de usuário (oid/sub).", statusCode: StatusCodes.Status401Unauthorized);

        try
        {
            var perfil = await usuarios.RegistrarCpfAsync(usuarioId, request.Cpf, ct);
            return Ok(perfil);
        }
        catch (InvalidOperationException ex)
        {
            return Problem(detail: ex.Message, statusCode: StatusCodes.Status400BadRequest);
        }
    }
}
