namespace PremieRpet.Shop.Domain.Entities;

public sealed class ProdutoFaixaEtariaOpcao
{
    public Guid Id { get; set; }
    public required string Nome { get; set; }
    public ICollection<Produto> Produtos { get; set; } = new List<Produto>();
}
