using System;
using System.Collections.Generic;

namespace PremieRpet.Shop.Application.DTOs;

public sealed record PedidoDetalheDto(
    Guid Id,
    Guid UsuarioId,
    string UsuarioNome,
    string? UsuarioCpf,
    Guid UnidadeEntregaId,
    string UnidadeEntregaNome,
    int StatusId,
    string StatusNome,
    DateTimeOffset DataHora,
    decimal Total,
    decimal PesoTotalKg,
    IReadOnlyList<PedidoDetalheItemDto> Itens
);
