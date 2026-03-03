namespace PremieRpet.Shop.Domain.Constants;

public static class PedidoStatusIds
{
    public const int Solicitado = 1;
    public const int Aprovado = 2;
    public const int Cancelado = 3;

    public static readonly int[] ContaParaLimite = new[] { Solicitado, Aprovado };
}

public static class PedidoIntegracaoStatusIds
{
    public static readonly Guid NaoIntegrado = Guid.Parse("5bf5f98a-f8f7-4f6c-af7f-6e6ef4e2a1bf");
    public static readonly Guid Processando = Guid.Parse("4eca7f0b-b347-4fc4-b4ec-cf581f5f9e03");
    public static readonly Guid Integrado = Guid.Parse("7c8906e9-a10f-4c6f-a0cd-75cf4f7facdf");
    public static readonly Guid Erro = Guid.Parse("f5ef5e17-03d0-40f9-a5ad-231470c4ca8f");
}
