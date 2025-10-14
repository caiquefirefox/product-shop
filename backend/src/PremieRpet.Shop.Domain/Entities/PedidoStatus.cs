namespace PremieRpet.Shop.Domain.Entities;

public sealed class PedidoStatus
{
    public int Id { get; set; }
    public required string Nome { get; set; }
    public ICollection<Pedido> Pedidos { get; set; } = new List<Pedido>();
}
