using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PremieRpet.Shop.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddPedidoHistorico : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "AtualizadoEm",
                table: "Pedidos",
                type: "timestamp with time zone",
                nullable: false,
                defaultValueSql: "CURRENT_TIMESTAMP AT TIME ZONE 'UTC'");

            migrationBuilder.AddColumn<Guid>(
                name: "AtualizadoPorUsuarioId",
                table: "Pedidos",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "PedidoHistoricos",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    PedidoId = table.Column<Guid>(type: "uuid", nullable: false),
                    UsuarioId = table.Column<Guid>(type: "uuid", nullable: true),
                    UsuarioNome = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    Tipo = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    Detalhes = table.Column<string>(type: "jsonb", nullable: false, defaultValue: "{}"),
                    DataHora = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PedidoHistoricos", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PedidoHistoricos_Pedidos_PedidoId",
                        column: x => x.PedidoId,
                        principalTable: "Pedidos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_PedidoHistoricos_Usuarios_UsuarioId",
                        column: x => x.UsuarioId,
                        principalTable: "Usuarios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Pedidos_AtualizadoPorUsuarioId",
                table: "Pedidos",
                column: "AtualizadoPorUsuarioId");

            migrationBuilder.CreateIndex(
                name: "IX_PedidoHistoricos_PedidoId",
                table: "PedidoHistoricos",
                column: "PedidoId");

            migrationBuilder.CreateIndex(
                name: "IX_PedidoHistoricos_UsuarioId",
                table: "PedidoHistoricos",
                column: "UsuarioId");

            migrationBuilder.AddForeignKey(
                name: "FK_Pedidos_Usuarios_AtualizadoPorUsuarioId",
                table: "Pedidos",
                column: "AtualizadoPorUsuarioId",
                principalTable: "Usuarios",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Pedidos_Usuarios_AtualizadoPorUsuarioId",
                table: "Pedidos");

            migrationBuilder.DropTable(
                name: "PedidoHistoricos");

            migrationBuilder.DropIndex(
                name: "IX_Pedidos_AtualizadoPorUsuarioId",
                table: "Pedidos");

            migrationBuilder.DropColumn(
                name: "AtualizadoEm",
                table: "Pedidos");

            migrationBuilder.DropColumn(
                name: "AtualizadoPorUsuarioId",
                table: "Pedidos");
        }
    }
}
