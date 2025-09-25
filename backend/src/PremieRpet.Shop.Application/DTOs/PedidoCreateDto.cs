using System;

namespace PremieRpet.Shop.Application.DTOs;

public sealed record PedidoCreateDto
{
    public string UnidadeEntrega { get; init; } = string.Empty;
    public IReadOnlyList<PedidoItemDto> Itens { get; init; } = Array.Empty<PedidoItemDto>();
    public string? Cpf { get; init; }
}
