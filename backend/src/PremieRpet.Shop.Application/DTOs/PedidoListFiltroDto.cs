using System;

namespace PremieRpet.Shop.Application.DTOs;

public sealed record PedidoListFiltroDto(
    int Page,
    int PageSize,
    DateTimeOffset? De,
    DateTimeOffset? Ate,
    Guid? UsuarioId,
    int? StatusId,
    string? UsuarioBusca,
    Guid? EmpresaId,
    int? CompetenciaAnoMes
)
{
    public const int DefaultPage = 1;
    public const int DefaultPageSize = 10;
}
