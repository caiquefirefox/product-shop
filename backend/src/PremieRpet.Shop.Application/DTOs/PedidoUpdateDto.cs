using System.Collections.Generic;

namespace PremieRpet.Shop.Application.DTOs;

public sealed record PedidoUpdateDto(
    string UnidadeEntrega,
    IReadOnlyList<PedidoUpdateItemDto> Itens
);
