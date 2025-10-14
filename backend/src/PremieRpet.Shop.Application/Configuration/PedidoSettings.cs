using PremieRpet.Shop.Domain.Constants;

namespace PremieRpet.Shop.Application.Configuration;

public sealed class PedidoSettings
{
    public const string SectionName = "Pedidos";

    public int EditWindowOpeningDay { get; set; } = 15;

    public int EditWindowClosingDay { get; set; } = 20;

    public int MaxOrdersPerUserPerMonth { get; set; } = 1;

    public int InitialStatusId { get; set; } = PedidoStatusIds.Solicitado;
}
