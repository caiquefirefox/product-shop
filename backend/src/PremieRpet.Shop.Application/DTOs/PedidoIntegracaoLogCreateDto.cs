using System;

namespace PremieRpet.Shop.Application.DTOs;

public sealed record PedidoIntegracaoLogCreateDto(
    Guid PedidoId,
    Guid StatusId,
    string? Resultado
);
