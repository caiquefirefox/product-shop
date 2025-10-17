using System;
using System.Collections.Generic;

namespace PremieRpet.Shop.Application.DTOs;

public sealed record PedidoUpdateDto(
    Guid UnidadeEntregaId,
    IReadOnlyList<PedidoUpdateItemDto> Itens
);
