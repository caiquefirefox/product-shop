using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PremieRpet.Shop.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddPesoRealEfkProduto : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "PesoKg",
                table: "PedidoItens",
                newName: "Peso");

            migrationBuilder.AddColumn<int>(
                name: "TipoPeso",
                table: "PedidoItens",
                type: "int",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "TipoPeso",
                table: "PedidoItens");

            migrationBuilder.RenameColumn(
                name: "Peso",
                table: "PedidoItens",
                newName: "PesoKg");
        }
    }
}
