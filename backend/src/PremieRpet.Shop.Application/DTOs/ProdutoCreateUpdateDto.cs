namespace PremieRpet.Shop.Application.DTOs;
public record ProdutoCreateUpdateDto(string Descricao, decimal Peso, int TipoPeso, string Sabores, decimal Preco, int QuantidadeMinimaDeCompra);
