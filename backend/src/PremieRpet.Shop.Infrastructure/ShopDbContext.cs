using System;
using Microsoft.EntityFrameworkCore;
using PremieRpet.Shop.Domain.Constants;
using PremieRpet.Shop.Domain.Entities;

namespace PremieRpet.Shop.Infrastructure;

public sealed class ShopDbContext : DbContext
{
    public DbSet<Produto> Produtos => Set<Produto>();
    public DbSet<Pedido> Pedidos => Set<Pedido>();
    public DbSet<PedidoItem> PedidoItens => Set<PedidoItem>();
    public DbSet<PedidoStatus> PedidoStatus => Set<PedidoStatus>();
    public DbSet<PedidoHistorico> PedidoHistoricos => Set<PedidoHistorico>();
    public DbSet<UnidadeEntrega> UnidadesEntrega => Set<UnidadeEntrega>();
    public DbSet<ProdutoEspecieOpcao> ProdutoEspecieOpcoes => Set<ProdutoEspecieOpcao>();
    public DbSet<ProdutoPorteOpcao> ProdutoPorteOpcoes => Set<ProdutoPorteOpcao>();
    public DbSet<ProdutoTipoOpcao> ProdutoTipoOpcoes => Set<ProdutoTipoOpcao>();
    public DbSet<ProdutoFaixaEtariaOpcao> ProdutoFaixaEtariaOpcoes => Set<ProdutoFaixaEtariaOpcao>();
    public DbSet<ProdutoPorte> ProdutoPortes => Set<ProdutoPorte>();
    public DbSet<Usuario> Usuarios => Set<Usuario>();
    public DbSet<UsuarioRole> UsuarioRoles => Set<UsuarioRole>();

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
            e.Property(p => p.CriadoPorUsuarioId);
            e.Property(p => p.AtualizadoPorUsuarioId);
            e.Property(p => p.CriadoEm);
            e.Property(p => p.AtualizadoEm);
            e.HasIndex(p => p.CriadoPorUsuarioId);
            e.HasIndex(p => p.AtualizadoPorUsuarioId);

            e.HasOne<Usuario>()
                .WithMany()
                .HasForeignKey(p => p.CriadoPorUsuarioId)
                .OnDelete(DeleteBehavior.SetNull)
                .HasConstraintName("FK_Produtos_Usuarios_CriadoPorUsuarioId");

            e.HasOne<Usuario>()
                .WithMany()
                .HasForeignKey(p => p.AtualizadoPorUsuarioId)
                .OnDelete(DeleteBehavior.SetNull)
                .HasConstraintName("FK_Produtos_Usuarios_AtualizadoPorUsuarioId");

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

        b.Entity<UnidadeEntrega>(e =>
        {
            e.HasKey(u => u.Id);
            e.Property(u => u.Nome).HasMaxLength(200).IsRequired();
            e.HasIndex(u => u.Nome).IsUnique();

            e.HasData(
                new UnidadeEntrega { Id = Guid.Parse("f828a309-3b7a-55bb-9921-a4b3640e180b"), Nome = "BAHIA" },
                new UnidadeEntrega { Id = Guid.Parse("1401ae7a-fd5d-5fea-978d-4b7ee0350748"), Nome = "BRASCORP" },
                new UnidadeEntrega { Id = Guid.Parse("7f6ab4ca-bf95-569b-a9f7-c24f46ac09e2"), Nome = "CD SANTANA DE PARNAÍBA" },
                new UnidadeEntrega { Id = Guid.Parse("9b216587-cea4-5f99-a123-d519be4b6925"), Nome = "DISTRITO FEDERAL" },
                new UnidadeEntrega { Id = Guid.Parse("4e2c96fa-585a-5d39-9bf3-39b3ef473e7b"), Nome = "GOIÁS" },
                new UnidadeEntrega { Id = Guid.Parse("083eb7fc-8fa1-517f-8aec-1e20b779cdb2"), Nome = "PARANÁ" },
                new UnidadeEntrega { Id = Guid.Parse("c30f2dd6-8741-58e2-a65b-881435ff701f"), Nome = "PERNAMBUCO" },
                new UnidadeEntrega { Id = Guid.Parse("41f894cd-6c17-566f-bd08-6ad8eb97e9d9"), Nome = "PREMIER ESCRITÓRIO - SP" },
                new UnidadeEntrega { Id = Guid.Parse("06fd3c2b-6c72-5f94-893d-e63466d0e34d"), Nome = "PREMIER INTERIOR - SP" },
                new UnidadeEntrega { Id = Guid.Parse("784332e4-5052-5314-b7c2-4e6fd7f20255"), Nome = "PREMIER LITORAL - SP" },
                new UnidadeEntrega { Id = Guid.Parse("595407a3-c4f7-5639-aa7c-a1befb4d6e70"), Nome = "RIO DE JANEIRO" },
                new UnidadeEntrega { Id = Guid.Parse("6f208b53-e62b-576a-8de4-fbf673db66aa"), Nome = "RIO GRANDE DO SUL" },
                new UnidadeEntrega { Id = Guid.Parse("e1f1e75f-3818-5022-b0f8-3b2060ca2ac1"), Nome = "SANTA CATARINA" },
                new UnidadeEntrega { Id = Guid.Parse("737aed3e-dc2e-5534-9456-986f1b7db715"), Nome = "CD BETIM - MG" },
                new UnidadeEntrega { Id = Guid.Parse("0c63cefe-5b6b-57f9-b073-a035d292d864"), Nome = "RIO GRANDE DO NORTE" },
                new UnidadeEntrega { Id = Guid.Parse("bcb84da6-c993-54e7-8c14-665f89d70433"), Nome = "CD EXTREMA - MG" },
                new UnidadeEntrega { Id = Guid.Parse("a1e08cc1-1962-4e30-a9a1-f899176d71a3"), Nome = "CD HORTOLÂNDIA" },
                new UnidadeEntrega { Id = Guid.Parse("c3f7f6a1-b95b-4ec4-a8ce-bb3aa3cbd48c"), Nome = "CD BARUERI" },
                new UnidadeEntrega { Id = Guid.Parse("1acb4bc4-8c07-5aea-895d-5a8657ae8dbb"), Nome = "CEARÁ" },
                new UnidadeEntrega { Id = Guid.Parse("dce4840f-14c4-59d0-8a23-a03df0705d3c"), Nome = "FÁBRICA PARANÁ" },
                new UnidadeEntrega { Id = Guid.Parse("1d7f3994-a00a-56a6-aa07-09b593ede157"), Nome = "FÁBRICA DOURADO" }
            );
        });

        b.Entity<Pedido>(e =>
        {
            e.HasKey(p => p.Id);
            e.Property(p => p.UsuarioId).IsRequired();
            e.Property(p => p.UsuarioNome).HasMaxLength(200).IsRequired();
            e.Property(p => p.UsuarioCpf).HasMaxLength(11);
            e.Property(p => p.UnidadeEntregaId).IsRequired();
            e.Property(p => p.DataHora);
            e.Property(p => p.AtualizadoEm);
            e.Property(p => p.AtualizadoPorUsuarioId);
            e.Property(p => p.StatusId).HasColumnType("int").HasDefaultValue(PedidoStatusIds.Solicitado);
            e.HasMany(p => p.Itens).WithOne(i => i.Pedido).HasForeignKey(i => i.PedidoId);
            e.HasMany(p => p.Historicos).WithOne(h => h.Pedido).HasForeignKey(h => h.PedidoId);

            e.HasIndex(p => p.AtualizadoPorUsuarioId);
            e.HasIndex(p => p.StatusId);
            e.HasIndex(p => p.UnidadeEntregaId);

            e.HasOne<Usuario>()
                .WithMany()
                .HasForeignKey(p => p.UsuarioId)
                .OnDelete(DeleteBehavior.Restrict);

            e.HasOne<Usuario>()
                .WithMany()
                .HasForeignKey(p => p.AtualizadoPorUsuarioId)
                .OnDelete(DeleteBehavior.SetNull)
                .HasConstraintName("FK_Pedidos_Usuarios_AtualizadoPorUsuarioId");

            e.HasOne(p => p.Status)
                .WithMany(s => s.Pedidos)
                .HasForeignKey(p => p.StatusId)
                .OnDelete(DeleteBehavior.Restrict)
                .HasConstraintName("FK_Pedidos_PedidoStatus_StatusId");

            e.HasOne(p => p.UnidadeEntrega)
                .WithMany(u => u.Pedidos)
                .HasForeignKey(p => p.UnidadeEntregaId)
                .OnDelete(DeleteBehavior.Restrict)
                .HasConstraintName("FK_Pedidos_UnidadesEntrega_UnidadeEntregaId");
        });

        b.Entity<PedidoHistorico>(e =>
        {
            e.HasKey(h => h.Id);
            e.Property(h => h.Tipo).HasMaxLength(64).IsRequired();
            e.Property(h => h.Detalhes).HasColumnType("jsonb");
            e.Property(h => h.UsuarioNome).HasMaxLength(200);
            e.Property(h => h.DataHora);

            e.HasIndex(h => h.PedidoId);
            e.HasIndex(h => h.UsuarioId);

            e.HasOne(h => h.Usuario)
                .WithMany()
                .HasForeignKey(h => h.UsuarioId)
                .OnDelete(DeleteBehavior.SetNull)
                .HasConstraintName("FK_PedidoHistoricos_Usuarios_UsuarioId");
        });

        b.Entity<Usuario>(e =>
        {
            e.HasKey(u => u.Id);
            e.Property(u => u.MicrosoftId).HasMaxLength(200).IsRequired();
            e.HasIndex(u => u.MicrosoftId).IsUnique();
            e.Property(u => u.Email).HasMaxLength(200);
            e.HasIndex(u => u.Email).IsUnique();
            e.Property(u => u.Cpf).HasMaxLength(11);
            e.HasIndex(u => u.Cpf).IsUnique();
            e.Property(u => u.CriadoEm);
            e.Property(u => u.AtualizadoEm);

            e.HasMany(u => u.Roles)
                .WithOne(r => r.Usuario)
                .HasForeignKey(r => r.UsuarioId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        b.Entity<UsuarioRole>(e =>
        {
            e.HasKey(r => r.Id);
            e.Property(r => r.Role).HasMaxLength(64).IsRequired();
            e.HasIndex(r => new { r.UsuarioId, r.Role }).IsUnique();
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

        b.Entity<PedidoStatus>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Id).ValueGeneratedNever();
            e.Property(x => x.Nome).HasMaxLength(64).IsRequired();

            e.HasData(
                new PedidoStatus { Id = PedidoStatusIds.Solicitado, Nome = "Solicitado" },
                new PedidoStatus { Id = PedidoStatusIds.Aprovado, Nome = "Aprovado" },
                new PedidoStatus { Id = PedidoStatusIds.Cancelado, Nome = "Cancelado" }
            );
        });
    }
}
