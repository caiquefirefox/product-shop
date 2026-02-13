using System;
using System.Collections.Generic;

namespace PremieRpet.Shop.Application.DTOs;

public record ProdutoDto(
    string Codigo,
    string Descricao,
    decimal Peso,
    int TipoPeso,
    string Sabores,
    Guid EspecieOpcaoId,
    string EspecieNome,
    IReadOnlyList<Guid> PorteOpcaoIds,
    IReadOnlyList<string> PorteNomes,
    Guid TipoProdutoOpcaoId,
    string TipoProdutoNome,
    Guid FaixaEtariaOpcaoId,
    string FaixaEtariaNome,
    decimal Preco,
    int QuantidadeMinimaDeCompra,
    string? ImagemUrl,
    string? LinkExterno);
