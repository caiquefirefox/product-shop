namespace PremieRpet.Shop.Domain.Constants;

public static class PedidoStatusIds
{
    public const int Solicitado = 1;
    public const int Aprovado = 2;
    public const int Cancelado = 3;

    public static readonly int[] ContaParaLimite = new[] { Solicitado, Aprovado };
}
