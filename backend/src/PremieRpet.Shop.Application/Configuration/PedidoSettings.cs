using PremieRpet.Shop.Domain.Constants;

namespace PremieRpet.Shop.Application.Configuration;

public sealed class PedidoSettings
{
    public const string SectionName = "Pedidos";
    public const decimal DefaultLimitKgPerUserPerMonth = 33.1m;
    public const int DefaultMinQuantityValue = 1;

    public int EditWindowOpeningDay { get; set; } = 15;

    public int EditWindowClosingDay { get; set; } = 20;

    public int MaxOrdersPerUserPerMonth { get; set; } = 1;

    public int InitialStatusId { get; set; } = PedidoStatusIds.Solicitado;

    public decimal LimitKgPerUserPerMonth { get; set; } = DefaultLimitKgPerUserPerMonth;

    public int DefaultMinQuantity { get; set; } = DefaultMinQuantityValue;
}
