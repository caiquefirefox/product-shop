using System;
using System.Collections.Generic;

namespace PremieRpet.Shop.Application.DTOs;

public sealed record PedidoDetalheDto(
    Guid Id,
    Guid UsuarioId,
    string UsuarioNome,
    string? UsuarioCpf,
    Guid EmpresaId,
    string EmpresaNome,
    int CondicaoPagamento,
    int StatusId,
    string StatusNome,
    string IntegracaoStatus,
    string? IntegracaoPedidoExternoId,
    DateTimeOffset DataHora,
    decimal Total,
    decimal PesoTotalKg,
    IReadOnlyList<PedidoDetalheItemDto> Itens
);
