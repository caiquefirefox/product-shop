using System;

namespace PremieRpet.Shop.Application.DTOs;

public sealed record ProdutoFiltroDto(
    string? Codigo,
    string? Descricao,
    string? Query,
    Guid? TipoProdutoOpcaoId,
    Guid? EspecieOpcaoId,
    Guid? FaixaEtariaOpcaoId,
    Guid? PorteOpcaoId,
    int Page,
    int PageSize)
{
    public const int DefaultPageSize = 10;
}
