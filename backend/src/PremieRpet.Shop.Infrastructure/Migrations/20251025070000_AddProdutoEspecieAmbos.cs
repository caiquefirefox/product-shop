using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PremieRpet.Shop.Infrastructure.Migrations
{
    /// <inheritdoc />
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
    }
}
