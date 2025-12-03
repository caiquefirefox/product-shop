using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using PremieRpet.Shop.Application.DTOs;

namespace PremieRpet.Shop.Api.Contracts;

public sealed class UsuarioUpsertBatchRequest
{
    [Required]
    public required IReadOnlyCollection<UsuarioUpsertBatchItem> Usuarios { get; init; }

    public IReadOnlyCollection<UsuarioUpsertBatchDto> ToDto()
    {
        if (Usuarios is null || Usuarios.Count == 0)
            return Array.Empty<UsuarioUpsertBatchDto>();

        return Usuarios
            .Select(u => new UsuarioUpsertBatchDto(
                u.Id,
                u.AtualizarPerfil,
                u.AtualizarStatus,
                u.Email,
                u.Nome,
                u.Cpf,
                u.Roles,
                u.Ativo))
            .ToArray();
    }
}

public sealed record UsuarioUpsertBatchItem
{
    [Required]
    public Guid Id { get; init; }

    public bool AtualizarPerfil { get; init; }

    public bool AtualizarStatus { get; init; }

    public string? Email { get; init; }

    public string? Nome { get; init; }

    public string? Cpf { get; init; }

    public IEnumerable<string>? Roles { get; init; }

    public bool? Ativo { get; init; }
}
