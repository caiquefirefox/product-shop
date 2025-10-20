using System;
using PremieRpet.Shop.Application.DTOs;

namespace PremieRpet.Shop.Api.Contracts;

public sealed class ProdutoFiltroQuery
{
    public string? Codigo { get; set; }
    public string? Descricao { get; set; }
    public string? Q { get; set; }
    public Guid? TipoProdutoOpcaoId { get; set; }
    public Guid? EspecieOpcaoId { get; set; }
    public Guid? FaixaEtariaOpcaoId { get; set; }
    public Guid? PorteOpcaoId { get; set; }
    public int? Page { get; set; }
    public int? PageSize { get; set; }

    private static string? Normalize(string? value)
        => string.IsNullOrWhiteSpace(value) ? null : value.Trim();

    private static Guid? Normalize(Guid? value)
        => value is Guid guid && guid == Guid.Empty ? null : value;

    private static int NormalizePage(int? value)
        => value is int page && page > 0 ? page : 1;

    private static int NormalizePageSize(int? value)
        => value is int size && size > 0 ? size : ProdutoFiltroDto.DefaultPageSize;

    public ProdutoFiltroDto ToDto() => new(
        Normalize(Codigo),
        Normalize(Descricao),
        Normalize(Q),
        Normalize(TipoProdutoOpcaoId),
        Normalize(EspecieOpcaoId),
        Normalize(FaixaEtariaOpcaoId),
        Normalize(PorteOpcaoId),
        NormalizePage(Page),
        NormalizePageSize(PageSize));
}
