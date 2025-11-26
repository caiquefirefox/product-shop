using PremieRpet.Shop.Application.DTOs;

namespace PremieRpet.Shop.Api.Contracts;

public sealed record LocalLoginResponse(string Token, UsuarioDto Usuario);
