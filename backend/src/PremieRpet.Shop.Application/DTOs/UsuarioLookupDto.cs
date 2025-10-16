using System;

namespace PremieRpet.Shop.Application.DTOs;

public sealed record UsuarioLookupDto(
    string MicrosoftId,
    string Email,
    string? Mail,
    string? UserPrincipalName,
    string? DisplayName
);
