using System;
using System.Collections.Generic;

namespace PremieRpet.Shop.Application.DTOs;

public sealed record UsuarioUpsertBatchDto(
    Guid Id,
    bool AtualizarPerfil,
    bool AtualizarStatus,
    string? Email,
    string? Nome,
    string? Cpf,
    IEnumerable<string>? Roles,
    bool? Ativo
);
