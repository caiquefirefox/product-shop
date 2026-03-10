using System;

namespace PremieRpet.Shop.Application.DTOs;

public sealed record PedidoResumoDto(
    Guid Id,
    string UsuarioNome,
    string? UsuarioCpf,
    Guid EmpresaId,
    string EmpresaNome,
    int CondicaoPagamento,
    int StatusId,
    string StatusNome,
    DateTimeOffset DataHora,
    int CompetenciaAnoMes,
    decimal Total,
    decimal PesoTotalKg
);
