using System;
using System.Collections.Generic;

namespace PremieRpet.Shop.Application.DTOs;

public sealed record PedidoCreateDto
{
    public Guid EmpresaId { get; init; }
    public IReadOnlyList<PedidoItemDto> Itens { get; init; } = Array.Empty<PedidoItemDto>();
    public string? Cpf { get; init; }
}
