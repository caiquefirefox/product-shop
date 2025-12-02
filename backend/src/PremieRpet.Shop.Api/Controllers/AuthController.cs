using System;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using PremieRpet.Shop.Api.Contracts;
using PremieRpet.Shop.Api;
using PremieRpet.Shop.Application.Interfaces.UseCases;

namespace PremieRpet.Shop.Api.Controllers;

[ApiController]
[Route("api/auth")]
public sealed class AuthController(IConfiguration configuration, IUsuarioService usuarios) : ControllerBase
{
    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<IActionResult> Login([FromBody] LocalLoginRequest request, CancellationToken ct)
    {
        try
        {
            var usuario = await usuarios.AutenticarLocalAsync(request.Cpf, request.Senha, ct);
            var token = GenerateToken(usuario);
            return Ok(new LocalLoginResponse(token, usuario));
        }
        catch (InvalidOperationException ex)
        {
            var isInactiveUser = string.Equals(ex.Message, "Usuário inativo.", StringComparison.OrdinalIgnoreCase);
            var status = isInactiveUser ? StatusCodes.Status403Forbidden : StatusCodes.Status400BadRequest;
            var type = isInactiveUser ? ProblemTypeConstants.InactiveUser : null;

            return Problem(detail: ex.Message, statusCode: status, type: type, title: isInactiveUser ? "Usuário inativo" : null);
        }
    }

    private string GenerateToken(Application.DTOs.UsuarioDto usuario)
    {
        var issuer = configuration["Auth:LocalIssuer"] ?? "premierpet.shop.local";
        var audience = configuration["Auth:LocalAudience"] ?? "premierpet.shop.api";
        var secret = configuration["Auth:LocalSigningKey"];
        if (string.IsNullOrWhiteSpace(secret))
            throw new InvalidOperationException("Configuração Auth:LocalSigningKey ausente.");

        var signingKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret));
        var credentials = new SigningCredentials(signingKey, SecurityAlgorithms.HmacSha256);

        var claims = new List<Claim>
        {
            new Claim(JwtRegisteredClaimNames.Sub, usuario.Id.ToString()),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
            new Claim("cpf", usuario.Cpf ?? string.Empty)
        };

        var emailClaim = !string.IsNullOrWhiteSpace(usuario.Email)
            ? usuario.Email
            : !string.IsNullOrWhiteSpace(usuario.Cpf)
                ? $"{usuario.Cpf}@local"
                : $"{usuario.Id}@local";

        claims.Add(new Claim("preferred_username", emailClaim));
        claims.Add(new Claim(ClaimTypes.Email, emailClaim));

        foreach (var role in usuario.Roles)
        {
            claims.Add(new Claim(ClaimTypes.Role, role));
        }

        var token = new JwtSecurityToken(
            issuer,
            audience,
            claims,
            expires: DateTime.UtcNow.AddHours(8),
            signingCredentials: credentials);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
