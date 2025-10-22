using System;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using PremieRpet.Shop.Infrastructure;

#nullable disable

namespace PremieRpet.Shop.Infrastructure.Migrations
{
    /// <inheritdoc />
    [DbContext(typeof(ShopDbContext))]
    [Migration("20251025070000_AddProdutoEspecieAmbos")]
    public partial class AddProdutoEspecieAmbos : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.InsertData(
                table: "ProdutoEspecieOpcoes",
                columns: new[] { "Id", "Nome" },
                values: new object[] { new Guid("4e45286c-5cf4-4b86-9a3e-6a620fc7b3f9"), "Ambos" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "ProdutoEspecieOpcoes",
                keyColumn: "Id",
                keyValue: new Guid("4e45286c-5cf4-4b86-9a3e-6a620fc7b3f9"));
        }

        /// <inheritdoc />
        protected override void BuildTargetModel(ModelBuilder modelBuilder)
        {
            new ShopDbContextModelSnapshotProxy().BuildModel(modelBuilder);
        }

        private sealed class ShopDbContextModelSnapshotProxy : ShopDbContextModelSnapshot
        {
            public void BuildModel(ModelBuilder modelBuilder) => base.BuildModel(modelBuilder);
        }
    }
}
