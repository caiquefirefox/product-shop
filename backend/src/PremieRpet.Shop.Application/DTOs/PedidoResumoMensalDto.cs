namespace PremieRpet.Shop.Application.DTOs;

public sealed record PedidoResumoMensalDto(
    decimal LimiteKg,
    decimal TotalConsumidoKg,
    decimal TotalValor,
    int TotalItens,
    int TotalPedidos
);
