namespace PremieRpet.Shop.Application.DTOs;

public sealed record PedidoDetalheItemDto(
    string ProdutoCodigo,
    string Descricao,
    decimal Preco,
    int Quantidade,
    int QuantidadeMinima,
    decimal Subtotal,
    decimal PesoKg,
    decimal PesoTotalKg
);