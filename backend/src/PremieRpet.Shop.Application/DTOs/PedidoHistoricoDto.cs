using System;

namespace PremieRpet.Shop.Application.DTOs;

public sealed record PedidoHistoricoDto(
    Guid Id,
    DateTimeOffset DataHora,
    string Tipo,
    string? UsuarioNome,
    PedidoHistoricoDetalhesDto? Detalhes
);
