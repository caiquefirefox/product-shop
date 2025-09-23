using Microsoft.EntityFrameworkCore;
using PremieRpet.Shop.Domain.Entities;

namespace PremieRpet.Shop.Infrastructure;

public sealed class ShopDbContext : DbContext
{
    public DbSet<Produto> Produtos => Set<Produto>();
    public DbSet<Pedido> Pedidos => Set<Pedido>();
    public DbSet<PedidoItem> PedidoItens => Set<PedidoItem>();

    public ShopDbContext(DbContextOptions<ShopDbContext> options) : base(options) { }

    protected override void OnModelCreating(ModelBuilder b)
    {
        b.Entity<Produto>(e =>
        {
            e.HasKey(p => p.Id);
            e.HasIndex(p => p.Codigo).IsUnique();
            e.Property(p => p.Codigo).HasMaxLength(64).IsRequired();
            e.Property(p => p.Descricao).HasMaxLength(256).IsRequired();
            e.Property(x => x.Peso).HasColumnType("decimal(18,4)");
            e.Property(x => x.Preco).HasColumnType("numeric(18,2)");
            e.Property(p => p.TipoPeso).HasColumnType("int");
            e.Property(x => x.QuantidadeMinimaDeCompra).HasDefaultValue(1);
        });

        b.Entity<Pedido>(e =>
        {
            e.HasKey(p => p.Id);
            e.Property(p => p.UsuarioId).HasMaxLength(200).IsRequired();
            e.Property(p => p.UsuarioNome).HasMaxLength(200).IsRequired();
            e.Property(p => p.UnidadeEntrega).HasMaxLength(200).IsRequired();
            e.Property(p => p.DataHora);
            e.HasMany(p => p.Itens).WithOne(i => i.Pedido).HasForeignKey(i => i.PedidoId);
        });

        b.Entity<PedidoItem>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Preco).HasColumnType("numeric(18,2)");
            e.Property(x => x.Peso).HasColumnType("decimal(18,4)");
            e.Property(x => x.TipoPeso).HasColumnType("int");

            e.HasIndex(i => i.ProdutoId);
            e.HasOne(i => i.Produto)
             .WithMany()
             .HasForeignKey(i => i.ProdutoId)
             .OnDelete(DeleteBehavior.Restrict);

            e.HasIndex(i => i.ProdutoCodigo);
        });
    }
}
