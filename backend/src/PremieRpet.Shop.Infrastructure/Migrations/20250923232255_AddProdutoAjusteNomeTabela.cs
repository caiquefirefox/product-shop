using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PremieRpet.Shop.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddProdutoAjusteNomeTabela : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Produtos_ProdutoTipoProdutoOpcoes_TipoProdutoOpcaoId",
                table: "Produtos");

            migrationBuilder.DropPrimaryKey(
                name: "PK_ProdutoTipoProdutoOpcoes",
                table: "ProdutoTipoProdutoOpcoes");

            migrationBuilder.RenameTable(
                name: "ProdutoTipoProdutoOpcoes",
                newName: "ProdutoTipoOpcoes");

            migrationBuilder.RenameIndex(
                name: "IX_ProdutoTipoProdutoOpcoes_Nome",
                table: "ProdutoTipoOpcoes",
                newName: "IX_ProdutoTipoOpcoes_Nome");

            migrationBuilder.AddPrimaryKey(
                name: "PK_ProdutoTipoOpcoes",
                table: "ProdutoTipoOpcoes",
                column: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Produtos_ProdutoTipoOpcoes_TipoProdutoOpcaoId",
                table: "Produtos",
                column: "TipoProdutoOpcaoId",
                principalTable: "ProdutoTipoOpcoes",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Produtos_ProdutoTipoOpcoes_TipoProdutoOpcaoId",
                table: "Produtos");

            migrationBuilder.DropPrimaryKey(
                name: "PK_ProdutoTipoOpcoes",
                table: "ProdutoTipoOpcoes");

            migrationBuilder.RenameTable(
                name: "ProdutoTipoOpcoes",
                newName: "ProdutoTipoProdutoOpcoes");

            migrationBuilder.RenameIndex(
                name: "IX_ProdutoTipoOpcoes_Nome",
                table: "ProdutoTipoProdutoOpcoes",
                newName: "IX_ProdutoTipoProdutoOpcoes_Nome");

            migrationBuilder.AddPrimaryKey(
                name: "PK_ProdutoTipoProdutoOpcoes",
                table: "ProdutoTipoProdutoOpcoes",
                column: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Produtos_ProdutoTipoProdutoOpcoes_TipoProdutoOpcaoId",
                table: "Produtos",
                column: "TipoProdutoOpcaoId",
                principalTable: "ProdutoTipoProdutoOpcoes",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }
    }
}
