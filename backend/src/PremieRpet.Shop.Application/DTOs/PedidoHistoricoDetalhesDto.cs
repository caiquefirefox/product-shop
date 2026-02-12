using System.Collections.Generic;

namespace PremieRpet.Shop.Application.DTOs;

public sealed record PedidoHistoricoDetalhesDto(
    IReadOnlyList<PedidoHistoricoAlteracaoItemDto> Itens,
    string? StatusAnterior,
    string? StatusAtual
);
