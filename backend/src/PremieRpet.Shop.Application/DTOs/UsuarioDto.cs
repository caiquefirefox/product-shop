using System;
using System.Collections.Generic;

namespace PremieRpet.Shop.Application.DTOs;

public sealed record UsuarioDto(
    Guid Id,
    string? Nome,
    string MicrosoftId,
    string Email,
    bool Ativo,
    bool DeveTrocarSenha,
    bool SemLimite,
    string? Cpf,
    IReadOnlyCollection<string> Roles,
    DateTimeOffset CriadoEm,
    DateTimeOffset AtualizadoEm
);
