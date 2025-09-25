using System;

namespace PremieRpet.Shop.Application.DTOs;

public sealed record PedidoResumoDto(
    Guid Id,
    string UsuarioNome,
    string? UsuarioCpf,
    string UnidadeEntrega,
    DateTimeOffset DataHora,
    decimal Total,
    decimal PesoTotalKg
);
