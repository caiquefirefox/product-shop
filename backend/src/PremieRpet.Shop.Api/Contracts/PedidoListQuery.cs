using System;
using PremieRpet.Shop.Application.DTOs;

namespace PremieRpet.Shop.Api.Contracts;

public sealed class PedidoListQuery
{
    public int Page { get; set; } = PedidoListFiltroDto.DefaultPage;
    public int PageSize { get; set; } = PedidoListFiltroDto.DefaultPageSize;
    public DateTimeOffset? De { get; set; }
    public DateTimeOffset? Ate { get; set; }
    public Guid? UsuarioId { get; set; }
    public int? StatusId { get; set; }
    public string? UsuarioBusca { get; set; }

    public PedidoListFiltroDto ToDto() => new(
        Page,
        PageSize,
        De,
        Ate,
        UsuarioId,
        StatusId,
        UsuarioBusca
    );
}
