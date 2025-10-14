using System.Collections.Generic;

namespace PremieRpet.Shop.Application.DTOs;

public sealed record PedidoHistoricoDetalhesDto(
    string? UnidadeEntregaAnterior,
    string? UnidadeEntregaAtual,
    IReadOnlyList<PedidoHistoricoAlteracaoItemDto> Itens
);
