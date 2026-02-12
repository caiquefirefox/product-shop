using System.Collections.Generic;

namespace PremieRpet.Shop.Application.DTOs;

public sealed record PedidoUpdateDto(
    IReadOnlyList<PedidoUpdateItemDto> Itens
);
