using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PremieRpet.Shop.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddPedidoStatus : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "PedidoStatus",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false),
                    Nome = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PedidoStatus", x => x.Id);
                });

            migrationBuilder.InsertData(
                table: "PedidoStatus",
                columns: new[] { "Id", "Nome" },
                values: new object[,]
                {
                    { 1, "Solicitado" },
                    { 2, "Aprovado" },
                    { 3, "Cancelado" }
                });

            migrationBuilder.AddColumn<int>(
                name: "StatusId",
                table: "Pedidos",
                type: "integer",
                nullable: false,
                defaultValue: 1);

            migrationBuilder.CreateIndex(
                name: "IX_Pedidos_StatusId",
                table: "Pedidos",
                column: "StatusId");

            migrationBuilder.AddForeignKey(
                name: "FK_Pedidos_PedidoStatus_StatusId",
                table: "Pedidos",
                column: "StatusId",
                principalTable: "PedidoStatus",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Pedidos_PedidoStatus_StatusId",
                table: "Pedidos");

            migrationBuilder.DropIndex(
                name: "IX_Pedidos_StatusId",
                table: "Pedidos");

            migrationBuilder.DropColumn(
                name: "StatusId",
                table: "Pedidos");

            migrationBuilder.DropTable(
                name: "PedidoStatus");
        }
    }
}
