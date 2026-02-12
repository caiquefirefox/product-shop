using System;
using System.Collections.Generic;

namespace PremieRpet.Shop.Application.DTOs;

public record ProdutoCreateUpdateDto(
    string Descricao,
    decimal Peso,
    int TipoPeso,
    string Sabores,
    Guid EspecieOpcaoId,
    IReadOnlyList<Guid> PorteOpcaoIds,
    Guid TipoProdutoOpcaoId,
    Guid FaixaEtariaOpcaoId,
    decimal Preco,
    int QuantidadeMinimaDeCompra,
    string? ImagemUrl,
    string? LinkExterno);
