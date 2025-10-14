namespace PremieRpet.Shop.Application.DTOs;

public sealed record PedidoHistoricoAlteracaoItemDto(
    string ProdutoCodigo,
    string Descricao,
    int QuantidadeAnterior,
    int QuantidadeAtual
);
