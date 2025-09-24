using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace PremieRpet.Shop.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddProdutoFaixaEtaria : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "FaixaEtariaOpcaoId",
                table: "Produtos",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.CreateTable(
                name: "ProdutoFaixaEtariaOpcoes",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Nome = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProdutoFaixaEtariaOpcoes", x => x.Id);
                });

            migrationBuilder.InsertData(
                table: "ProdutoFaixaEtariaOpcoes",
                columns: new[] { "Id", "Nome" },
                values: new object[,]
                {
                    { new Guid("1bb02ce7-54c9-43c6-9d28-68c9323fc86e"), "Adulto" },
                    { new Guid("87ba6774-1929-4ada-97ec-385fc846ab51"), "Todas" },
                    { new Guid("8e29fa8e-f3bd-4f4a-a73c-82009fcb2998"), "Filhote" },
                    { new Guid("d815602e-b739-497c-bb92-2ff27c51a638"), "Senior" }
                });

            migrationBuilder.CreateIndex(
                name: "IX_Produtos_FaixaEtariaOpcaoId",
                table: "Produtos",
                column: "FaixaEtariaOpcaoId");

            migrationBuilder.CreateIndex(
                name: "IX_ProdutoFaixaEtariaOpcoes_Nome",
                table: "ProdutoFaixaEtariaOpcoes",
                column: "Nome",
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Produtos_ProdutoFaixaEtariaOpcoes_FaixaEtariaOpcaoId",
                table: "Produtos",
                column: "FaixaEtariaOpcaoId",
                principalTable: "ProdutoFaixaEtariaOpcoes",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Produtos_ProdutoFaixaEtariaOpcoes_FaixaEtariaOpcaoId",
                table: "Produtos");

            migrationBuilder.DropTable(
                name: "ProdutoFaixaEtariaOpcoes");

            migrationBuilder.DropIndex(
                name: "IX_Produtos_FaixaEtariaOpcaoId",
                table: "Produtos");

            migrationBuilder.DropColumn(
                name: "FaixaEtariaOpcaoId",
                table: "Produtos");
        }
    }
}
