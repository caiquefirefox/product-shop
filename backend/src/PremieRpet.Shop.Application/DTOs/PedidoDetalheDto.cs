namespace PremieRpet.Shop.Application.DTOs;

public sealed record PedidoDetalheDto(
    Guid Id,
    string UsuarioId,
    string UsuarioNome,
    string UnidadeEntrega,
    DateTimeOffset DataHora,
    decimal Total,
    decimal PesoTotalKg,
    IReadOnlyList<PedidoDetalheItemDto> Itens
);