using System;

namespace PremieRpet.Shop.Application.DTOs;

public sealed record PedidoResumoDto(
    Guid Id,
    string UsuarioNome,
    string? UsuarioCpf,
    Guid UnidadeEntregaId,
    string UnidadeEntregaNome,
    int StatusId,
    string StatusNome,
    DateTimeOffset DataHora,
    decimal Total,
    decimal PesoTotalKg
);
