namespace PremieRpet.Shop.Infrastructure.Options;

public sealed class AzureBlobStorageOptions
{
    public string ConnectionString { get; set; } = string.Empty;
    public string ProdutosContainer { get; set; } = "produtos";
}
