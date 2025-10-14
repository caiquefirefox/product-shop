namespace PremieRpet.Shop.Application.DTOs;

public sealed record PedidoUpdateItemDto(
    string ProdutoCodigo,
    int Quantidade
);
