namespace PremieRpet.Shop.Application.DTOs;

public sealed record PedidoDetalheItemDto(
    string ProdutoCodigo,
    string Descricao,
    decimal Preco,
    int Quantidade,
    decimal Subtotal,
    decimal PesoKg,
    decimal PesoTotalKg
);