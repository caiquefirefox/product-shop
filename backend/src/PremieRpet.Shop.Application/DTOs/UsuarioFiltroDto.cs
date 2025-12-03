using System;

namespace PremieRpet.Shop.Application.DTOs;

public sealed record UsuarioFiltroDto(
    string? Busca,
    string? Cpf,
    string? Perfil,
    string? Origem,
    int Page,
    int PageSize)
{
    public const int DefaultPageSize = 12;

    public bool HasPerfilAdminFilter => string.Equals(Perfil, "Admin", StringComparison.OrdinalIgnoreCase);

    public bool HasPerfilColaboradorFilter => string.Equals(Perfil, "Colaborador", StringComparison.OrdinalIgnoreCase);

    public bool IsOrigemLocal => string.Equals(Origem, "local", StringComparison.OrdinalIgnoreCase);

    public bool IsOrigemSso => string.Equals(Origem, "sso", StringComparison.OrdinalIgnoreCase);
}
