using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PremieRpet.Shop.Infrastructure.Migrations
{
    public partial class MakeUnidadeEntregaOpcionalEmPedido : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Pedidos_UnidadesEntrega_UnidadeEntregaId",
                table: "Pedidos");

            migrationBuilder.AlterColumn<Guid>(
                name: "UnidadeEntregaId",
                table: "Pedidos",
                type: "uuid",
                nullable: true,
                oldClrType: typeof(Guid),
                oldType: "uuid");

            migrationBuilder.AddForeignKey(
                name: "FK_Pedidos_UnidadesEntrega_UnidadeEntregaId",
                table: "Pedidos",
                column: "UnidadeEntregaId",
                principalTable: "UnidadesEntrega",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Pedidos_UnidadesEntrega_UnidadeEntregaId",
                table: "Pedidos");

            migrationBuilder.Sql(@"UPDATE \"Pedidos\" p
SET \"UnidadeEntregaId\" = (
    SELECT u.\"Id\"
    FROM \"UnidadesEntrega\" u
    WHERE u.\"EmpresaId\" = (
        SELECT e.\"Id\" FROM \"Empresas\" e ORDER BY e.\"Nome\" LIMIT 1
    )
    ORDER BY u.\"Nome\"
    LIMIT 1
)
WHERE p.\"UnidadeEntregaId\" IS NULL;");

            migrationBuilder.AlterColumn<Guid>(
                name: "UnidadeEntregaId",
                table: "Pedidos",
                type: "uuid",
                nullable: false,
                oldClrType: typeof(Guid),
                oldType: "uuid",
                oldNullable: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Pedidos_UnidadesEntrega_UnidadeEntregaId",
                table: "Pedidos",
                column: "UnidadeEntregaId",
                principalTable: "UnidadesEntrega",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }
    }
}
