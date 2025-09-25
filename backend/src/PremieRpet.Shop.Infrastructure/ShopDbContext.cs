using System;
using Microsoft.EntityFrameworkCore;
using PremieRpet.Shop.Domain.Entities;

namespace PremieRpet.Shop.Infrastructure;

public sealed class ShopDbContext : DbContext
{
    public DbSet<Produto> Produtos => Set<Produto>();
    public DbSet<Pedido> Pedidos => Set<Pedido>();
    public DbSet<PedidoItem> PedidoItens => Set<PedidoItem>();
    public DbSet<ProdutoEspecieOpcao> ProdutoEspecieOpcoes => Set<ProdutoEspecieOpcao>();
    public DbSet<ProdutoPorteOpcao> ProdutoPorteOpcoes => Set<ProdutoPorteOpcao>();
    public DbSet<ProdutoTipoOpcao> ProdutoTipoOpcoes => Set<ProdutoTipoOpcao>();
    public DbSet<ProdutoFaixaEtariaOpcao> ProdutoFaixaEtariaOpcoes => Set<ProdutoFaixaEtariaOpcao>();
    public DbSet<ProdutoPorte> ProdutoPortes => Set<ProdutoPorte>();
    public DbSet<Usuario> Usuarios => Set<Usuario>();

    public ShopDbContext(DbContextOptions<ShopDbContext> options) : base(options) { }

    protected override void OnModelCreating(ModelBuilder b)
    {
        b.Entity<Produto>(e =>
        {
            e.HasKey(p => p.Id);
            e.HasIndex(p => p.Codigo).IsUnique();
            e.Property(p => p.Codigo).HasMaxLength(64).IsRequired();
            e.Property(p => p.Descricao).HasMaxLength(256).IsRequired();
            e.Property(p => p.EspecieOpcaoId).IsRequired();
            e.Property(p => p.TipoProdutoOpcaoId).IsRequired();
            e.Property(p => p.FaixaEtariaOpcaoId).IsRequired();
            e.Property(x => x.Peso).HasColumnType("decimal(18,4)");
            e.Property(x => x.Preco).HasColumnType("numeric(18,2)");
            e.Property(p => p.TipoPeso).HasColumnType("int");
            e.Property(x => x.QuantidadeMinimaDeCompra).HasDefaultValue(1);
            e.Property(p => p.ImagemUrl).HasMaxLength(1024);
            e.Property(p => p.CriadoPorUsuarioId).HasMaxLength(200);
            e.Property(p => p.AtualizadoPorUsuarioId).HasMaxLength(200);
            e.Property(p => p.CriadoEm);
            e.Property(p => p.AtualizadoEm);

            e.HasOne(p => p.EspecieOpcao)
                .WithMany(e => e.Produtos)
                .HasForeignKey(p => p.EspecieOpcaoId)
                .OnDelete(DeleteBehavior.Restrict);

            e.HasOne(p => p.TipoProdutoOpcao)
                .WithMany(t => t.Produtos)
                .HasForeignKey(p => p.TipoProdutoOpcaoId)
                .OnDelete(DeleteBehavior.Restrict);

            e.HasOne(p => p.FaixaEtariaOpcao)
                .WithMany(f => f.Produtos)
                .HasForeignKey(p => p.FaixaEtariaOpcaoId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        b.Entity<Pedido>(e =>
        {
            e.HasKey(p => p.Id);
            e.Property(p => p.UsuarioId).HasMaxLength(200).IsRequired();
            e.Property(p => p.UsuarioNome).HasMaxLength(200).IsRequired();
            e.Property(p => p.UsuarioCpf).HasMaxLength(11);
            e.Property(p => p.UnidadeEntrega).HasMaxLength(200).IsRequired();
            e.Property(p => p.DataHora);
            e.HasMany(p => p.Itens).WithOne(i => i.Pedido).HasForeignKey(i => i.PedidoId);
        });

        b.Entity<Usuario>(e =>
        {
            e.HasKey(u => u.Id);
            e.Property(u => u.MicrosoftId).HasMaxLength(200).IsRequired();
            e.HasIndex(u => u.MicrosoftId).IsUnique();
            e.Property(u => u.Cpf).HasMaxLength(11);
            e.HasIndex(u => u.Cpf).IsUnique();
            e.Property(u => u.CriadoEm);
            e.Property(u => u.AtualizadoEm);
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

        b.Entity<ProdutoEspecieOpcao>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Nome).HasMaxLength(64).IsRequired();
            e.HasIndex(x => x.Nome).IsUnique();

            e.HasData(
                new ProdutoEspecieOpcao { Id = Guid.Parse("729ab7c1-d382-41d7-9324-8f9c4da49a98"), Nome = "Cães" },
                new ProdutoEspecieOpcao { Id = Guid.Parse("1582b871-a8ab-404b-9745-b5d2d7b028d1"), Nome = "Gato" }
            );
        });

        b.Entity<ProdutoTipoOpcao>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Nome).HasMaxLength(128).IsRequired();
            e.HasIndex(x => x.Nome).IsUnique();

            e.HasData(
                new ProdutoTipoOpcao { Id = Guid.Parse("5006ea85-e9b1-4185-ba5d-08cecbcaf998"), Nome = "Alimento Seco" },
                new ProdutoTipoOpcao { Id = Guid.Parse("1e2e7740-36e1-4961-96a5-308c6e48b457"), Nome = "Cookie" },
                new ProdutoTipoOpcao { Id = Guid.Parse("601026f0-606b-4f67-bad7-eaefa16c62c6"), Nome = "Alimento Úmido" }
            );
        });

        b.Entity<ProdutoFaixaEtariaOpcao>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Nome).HasMaxLength(64).IsRequired();
            e.HasIndex(x => x.Nome).IsUnique();

            e.HasData(
                new ProdutoFaixaEtariaOpcao { Id = Guid.Parse("8e29fa8e-f3bd-4f4a-a73c-82009fcb2998"), Nome = "Filhote" },
                new ProdutoFaixaEtariaOpcao { Id = Guid.Parse("1bb02ce7-54c9-43c6-9d28-68c9323fc86e"), Nome = "Adulto" },
                new ProdutoFaixaEtariaOpcao { Id = Guid.Parse("d815602e-b739-497c-bb92-2ff27c51a638"), Nome = "Senior" },
                new ProdutoFaixaEtariaOpcao { Id = Guid.Parse("87ba6774-1929-4ada-97ec-385fc846ab51"), Nome = "Todas" }
            );
        });

        b.Entity<ProdutoPorteOpcao>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Nome).HasMaxLength(64).IsRequired();
            e.HasIndex(x => x.Nome).IsUnique();

            e.HasData(
                new ProdutoPorteOpcao { Id = Guid.Parse("d97fd958-c42a-4e45-8448-46eec579ed3c"), Nome = "Pequeno" },
                new ProdutoPorteOpcao { Id = Guid.Parse("ce1dc193-dc38-4805-8ba0-7cb732f4eac6"), Nome = "Médio" },
                new ProdutoPorteOpcao { Id = Guid.Parse("d29df7b6-989e-46e7-820b-49e221056a4c"), Nome = "Grande" },
                new ProdutoPorteOpcao { Id = Guid.Parse("f04e38ce-f558-4bb9-8642-6750cf8145fd"), Nome = "Gigante" },
                new ProdutoPorteOpcao { Id = Guid.Parse("d3541027-0408-4f9a-9937-18f4ae808fc9"), Nome = "NA" },
                new ProdutoPorteOpcao { Id = Guid.Parse("78c01073-e9a1-4f06-b825-2a9af0032aa6"), Nome = "Mini" }
            );
        });

        b.Entity<ProdutoPorte>(e =>
        {
            e.HasKey(x => new { x.ProdutoId, x.PorteOpcaoId });

            e.HasOne(x => x.Produto)
                .WithMany(p => p.Portes)
                .HasForeignKey(x => x.ProdutoId)
                .OnDelete(DeleteBehavior.Cascade);

            e.HasOne(x => x.PorteOpcao)
                .WithMany(p => p.Produtos)
                .HasForeignKey(x => x.PorteOpcaoId)
                .OnDelete(DeleteBehavior.Restrict);
        });
    }
}
