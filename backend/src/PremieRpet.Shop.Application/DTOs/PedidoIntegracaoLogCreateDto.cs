using System;

namespace PremieRpet.Shop.Application.DTOs;

public sealed record PedidoIntegracaoLogCreateDto(
    Guid PedidoId,
    Guid StatusId,
    string? Resultado,
    string? PedidoExternoId
);

public sealed record PedidoIntegracaoLogDto(
    Guid Id,
    Guid PedidoId,
    Guid StatusId,
    string StatusNome,
    string? Resultado,
    string? PedidoExternoId,
    DateTimeOffset DataCriacao
);

public sealed record PedidoIntegracaoStatusDto(
    Guid Id,
    string Nome
);
