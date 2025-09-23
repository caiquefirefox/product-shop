using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PremieRpet.Shop.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddClassificacoesProduto : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "EspecieOpcaoId",
                table: "Produtos",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("729ab7c1-d382-41d7-9324-8f9c4da49a98"));

            migrationBuilder.AddColumn<Guid>(
                name: "TipoProdutoOpcaoId",
                table: "Produtos",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("5006ea85-e9b1-4185-ba5d-08cecbcaf998"));
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "EspecieOpcaoId",
                table: "Produtos");

            migrationBuilder.DropColumn(
                name: "TipoProdutoOpcaoId",
                table: "Produtos");
        }
    }
}
