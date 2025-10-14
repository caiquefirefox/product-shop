using System;

namespace PremieRpet.Shop.Application.DTOs;

public sealed record PedidoResumoDto(
    Guid Id,
    string UsuarioNome,
    string? UsuarioCpf,
    string UnidadeEntrega,
    int StatusId,
    string StatusNome,
    DateTimeOffset DataHora,
    decimal Total,
    decimal PesoTotalKg
);
