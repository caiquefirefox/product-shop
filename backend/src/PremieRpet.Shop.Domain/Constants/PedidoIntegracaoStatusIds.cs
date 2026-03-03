using System;

namespace PremieRpet.Shop.Domain.Constants;

public static class PedidoIntegracaoStatusIds
{
    public static readonly Guid NaoIntegrado = Guid.Parse("44e6cbe7-a622-44f6-bca3-25fca0f57ad5");
    public static readonly Guid Processando = Guid.Parse("c92bce6d-2af9-4c29-8671-7fc2db3f1e23");
    public static readonly Guid Integrado = Guid.Parse("4d8f6f4f-fdd2-46c1-b59e-d79914f0b0f8");
    public static readonly Guid Erro = Guid.Parse("a84a6907-4447-4296-9f92-b62c4e8f4476");
}
