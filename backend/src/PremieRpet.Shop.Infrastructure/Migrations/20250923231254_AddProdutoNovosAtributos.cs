using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace PremieRpet.Shop.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddProdutoNovosAtributos : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "EspecieOpcaoId",
                table: "Produtos",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<Guid>(
                name: "TipoProdutoOpcaoId",
                table: "Produtos",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.CreateTable(
                name: "ProdutoEspecieOpcoes",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Nome = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProdutoEspecieOpcoes", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ProdutoPorteOpcoes",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Nome = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProdutoPorteOpcoes", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ProdutoTipoProdutoOpcoes",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Nome = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProdutoTipoProdutoOpcoes", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ProdutoPortes",
                columns: table => new
                {
                    ProdutoId = table.Column<Guid>(type: "uuid", nullable: false),
                    PorteOpcaoId = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProdutoPortes", x => new { x.ProdutoId, x.PorteOpcaoId });
                    table.ForeignKey(
                        name: "FK_ProdutoPortes_ProdutoPorteOpcoes_PorteOpcaoId",
                        column: x => x.PorteOpcaoId,
                        principalTable: "ProdutoPorteOpcoes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ProdutoPortes_Produtos_ProdutoId",
                        column: x => x.ProdutoId,
                        principalTable: "Produtos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.InsertData(
                table: "ProdutoEspecieOpcoes",
                columns: new[] { "Id", "Nome" },
                values: new object[,]
                {
                    { new Guid("1582b871-a8ab-404b-9745-b5d2d7b028d1"), "Gato" },
                    { new Guid("729ab7c1-d382-41d7-9324-8f9c4da49a98"), "Cães" }
                });

            migrationBuilder.InsertData(
                table: "ProdutoPorteOpcoes",
                columns: new[] { "Id", "Nome" },
                values: new object[,]
                {
                    { new Guid("78c01073-e9a1-4f06-b825-2a9af0032aa6"), "Mini" },
                    { new Guid("ce1dc193-dc38-4805-8ba0-7cb732f4eac6"), "Médio" },
                    { new Guid("d29df7b6-989e-46e7-820b-49e221056a4c"), "Grande" },
                    { new Guid("d3541027-0408-4f9a-9937-18f4ae808fc9"), "NA" },
                    { new Guid("d97fd958-c42a-4e45-8448-46eec579ed3c"), "Pequeno" },
                    { new Guid("f04e38ce-f558-4bb9-8642-6750cf8145fd"), "Gigante" }
                });

            migrationBuilder.InsertData(
                table: "ProdutoTipoProdutoOpcoes",
                columns: new[] { "Id", "Nome" },
                values: new object[,]
                {
                    { new Guid("1e2e7740-36e1-4961-96a5-308c6e48b457"), "Cookie" },
                    { new Guid("5006ea85-e9b1-4185-ba5d-08cecbcaf998"), "Alimento Seco" },
                    { new Guid("601026f0-606b-4f67-bad7-eaefa16c62c6"), "Alimento Úmido" }
                });

            migrationBuilder.CreateIndex(
                name: "IX_Produtos_EspecieOpcaoId",
                table: "Produtos",
                column: "EspecieOpcaoId");

            migrationBuilder.CreateIndex(
                name: "IX_Produtos_TipoProdutoOpcaoId",
                table: "Produtos",
                column: "TipoProdutoOpcaoId");

            migrationBuilder.CreateIndex(
                name: "IX_ProdutoEspecieOpcoes_Nome",
                table: "ProdutoEspecieOpcoes",
                column: "Nome",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ProdutoPorteOpcoes_Nome",
                table: "ProdutoPorteOpcoes",
                column: "Nome",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ProdutoPortes_PorteOpcaoId",
                table: "ProdutoPortes",
                column: "PorteOpcaoId");

            migrationBuilder.CreateIndex(
                name: "IX_ProdutoTipoProdutoOpcoes_Nome",
                table: "ProdutoTipoProdutoOpcoes",
                column: "Nome",
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Produtos_ProdutoEspecieOpcoes_EspecieOpcaoId",
                table: "Produtos",
                column: "EspecieOpcaoId",
                principalTable: "ProdutoEspecieOpcoes",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Produtos_ProdutoTipoProdutoOpcoes_TipoProdutoOpcaoId",
                table: "Produtos",
                column: "TipoProdutoOpcaoId",
                principalTable: "ProdutoTipoProdutoOpcoes",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Produtos_ProdutoEspecieOpcoes_EspecieOpcaoId",
                table: "Produtos");

            migrationBuilder.DropForeignKey(
                name: "FK_Produtos_ProdutoTipoProdutoOpcoes_TipoProdutoOpcaoId",
                table: "Produtos");

            migrationBuilder.DropTable(
                name: "ProdutoEspecieOpcoes");

            migrationBuilder.DropTable(
                name: "ProdutoPortes");

            migrationBuilder.DropTable(
                name: "ProdutoTipoProdutoOpcoes");

            migrationBuilder.DropTable(
                name: "ProdutoPorteOpcoes");

            migrationBuilder.DropIndex(
                name: "IX_Produtos_EspecieOpcaoId",
                table: "Produtos");

            migrationBuilder.DropIndex(
                name: "IX_Produtos_TipoProdutoOpcaoId",
                table: "Produtos");

            migrationBuilder.DropColumn(
                name: "EspecieOpcaoId",
                table: "Produtos");

            migrationBuilder.DropColumn(
                name: "TipoProdutoOpcaoId",
                table: "Produtos");
        }
    }
}
