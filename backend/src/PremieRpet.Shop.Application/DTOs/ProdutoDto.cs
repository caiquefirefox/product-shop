namespace PremieRpet.Shop.Application.DTOs;
public record ProdutoDto(string Codigo, string Descricao, decimal Peso, int TipoPeso, string Sabores, decimal Preco, int QuantidadeMinimaDeCompra);
