using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PremieRpet.Shop.Infrastructure.Migrations
{
    public partial class ReplacePedidoUnidadeFkWithEmpresaFk : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "EmpresaId",
                table: "Pedidos",
                type: "uuid",
                nullable: true);

            migrationBuilder.Sql(@"
UPDATE \"Pedidos\" p
SET \"EmpresaId\" = u.\"EmpresaId\"
FROM \"UnidadesEntrega\" u
WHERE p.\"UnidadeEntregaId\" = u.\"Id\";");

            migrationBuilder.Sql(@"
UPDATE \"Pedidos\" p
SET \"EmpresaId\" = (
    SELECT e.\"Id\"
    FROM \"Empresas\" e
    ORDER BY e.\"Nome\"
    LIMIT 1
)
WHERE p.\"EmpresaId\" IS NULL;");

            migrationBuilder.AlterColumn<Guid>(
                name: "EmpresaId",
                table: "Pedidos",
                type: "uuid",
                nullable: false,
                oldClrType: typeof(Guid),
                oldType: "uuid",
                oldNullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Pedidos_EmpresaId",
                table: "Pedidos",
                column: "EmpresaId");

            migrationBuilder.AddForeignKey(
                name: "FK_Pedidos_Empresas_EmpresaId",
                table: "Pedidos",
                column: "EmpresaId",
                principalTable: "Empresas",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.DropForeignKey(
                name: "FK_Pedidos_UnidadesEntrega_UnidadeEntregaId",
                table: "Pedidos");

            migrationBuilder.DropIndex(
                name: "IX_Pedidos_UnidadeEntregaId",
                table: "Pedidos");

            migrationBuilder.DropColumn(
                name: "UnidadeEntregaId",
                table: "Pedidos");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "UnidadeEntregaId",
                table: "Pedidos",
                type: "uuid",
                nullable: true);

            migrationBuilder.Sql(@"
UPDATE \"Pedidos\" p
SET \"UnidadeEntregaId\" = (
    SELECT u.\"Id\"
    FROM \"UnidadesEntrega\" u
    WHERE u.\"EmpresaId\" = p.\"EmpresaId\"
    ORDER BY u.\"Nome\"
    LIMIT 1
)
WHERE p.\"UnidadeEntregaId\" IS NULL;");

            migrationBuilder.CreateIndex(
                name: "IX_Pedidos_UnidadeEntregaId",
                table: "Pedidos",
                column: "UnidadeEntregaId");

            migrationBuilder.AddForeignKey(
                name: "FK_Pedidos_UnidadesEntrega_UnidadeEntregaId",
                table: "Pedidos",
                column: "UnidadeEntregaId",
                principalTable: "UnidadesEntrega",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.DropForeignKey(
                name: "FK_Pedidos_Empresas_EmpresaId",
                table: "Pedidos");

            migrationBuilder.DropIndex(
                name: "IX_Pedidos_EmpresaId",
                table: "Pedidos");

            migrationBuilder.DropColumn(
                name: "EmpresaId",
                table: "Pedidos");
        }
    }
}
