using System.Collections.Generic;

namespace PremieRpet.Shop.Application.DTOs;

public sealed record PedidoDetalheCompletoDto(
    PedidoDetalheDto Pedido,
    IReadOnlyList<PedidoHistoricoDto> Historico
);
