using System;
using System.Collections.Generic;

namespace PremieRpet.Shop.Application.DTOs;

public sealed record UsuarioDto(
    Guid Id,
    string Email,
    string? Cpf,
    IReadOnlyCollection<string> Roles,
    DateTimeOffset CriadoEm,
    DateTimeOffset AtualizadoEm
);
