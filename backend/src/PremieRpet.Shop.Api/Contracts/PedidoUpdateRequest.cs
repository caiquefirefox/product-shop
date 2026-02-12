using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using PremieRpet.Shop.Application.DTOs;

namespace PremieRpet.Shop.Api.Contracts;

public sealed class PedidoUpdateRequest
{
    [Required]
    public List<PedidoUpdateItemRequest> Itens { get; set; } = new();

    public PedidoUpdateDto ToDto()
        => new(
            Itens?.ConvertAll(i => new PedidoUpdateItemDto(i.ProdutoCodigo, i.Quantidade))
                ?? new List<PedidoUpdateItemDto>()
        );
}

public sealed class PedidoUpdateItemRequest
{
    [Required]
    public string ProdutoCodigo { get; set; } = string.Empty;

    [Range(1, int.MaxValue)]
    public int Quantidade { get; set; }
}
