using System;
using System.Collections.Generic;
using System.Linq;
using Microsoft.AspNetCore.Http;
using PremieRpet.Shop.Application.DTOs;

namespace PremieRpet.Shop.Api.Contracts;

public sealed class ProdutoCreateUpdateRequest
{
    public string Descricao { get; set; } = string.Empty;
    public decimal Peso { get; set; }
    public int TipoPeso { get; set; }
    public string Sabores { get; set; } = string.Empty;
    public Guid EspecieOpcaoId { get; set; }
    public List<Guid> PorteOpcaoIds { get; set; } = new();
    public Guid TipoProdutoOpcaoId { get; set; }
    public Guid FaixaEtariaOpcaoId { get; set; }
    public decimal Preco { get; set; }
    public int QuantidadeMinimaDeCompra { get; set; } = 1;
    public string? ImagemUrl { get; set; }
    public string? LinkExterno { get; set; }
    public bool RemoverImagem { get; set; }
    public IFormFile? Imagem { get; set; }

    public ProdutoCreateUpdateDto ToDto(string? imagemFinal)
    {
        var portes = PorteOpcaoIds?.Count > 0
            ? PorteOpcaoIds.Where(id => id != Guid.Empty).Distinct().ToList()
            : new List<Guid>();
        var imagemNormalizada = string.IsNullOrWhiteSpace(imagemFinal) ? null : imagemFinal;
        var linkExternoNormalizado = string.IsNullOrWhiteSpace(LinkExterno) ? null : LinkExterno.Trim();
        return new ProdutoCreateUpdateDto(
            Descricao,
            Peso,
            TipoPeso,
            Sabores ?? string.Empty,
            EspecieOpcaoId,
            portes,
            TipoProdutoOpcaoId,
            FaixaEtariaOpcaoId,
            Preco,
            QuantidadeMinimaDeCompra,
            imagemNormalizada,
            linkExternoNormalizado);
    }
}
