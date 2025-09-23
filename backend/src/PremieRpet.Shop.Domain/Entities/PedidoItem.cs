namespace PremieRpet.Shop.Domain.Entities;

public sealed class PedidoItem
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ProdutoId { get; set; }
    public Produto? Produto { get; set; }
    public required string ProdutoCodigo { get; set; }
    public required string Descricao { get; set; }
    public required decimal Preco { get; set; }
    public required decimal Peso { get; set; }
    public required int TipoPeso { get; set; }
    public required int Quantidade { get; set; }
    public Guid PedidoId { get; set; }
    public Pedido? Pedido { get; set; }
}
