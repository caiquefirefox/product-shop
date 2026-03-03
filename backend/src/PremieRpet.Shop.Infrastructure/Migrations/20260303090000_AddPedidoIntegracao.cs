using System;
using Microsoft.EntityFrameworkCore.Migrations;
using PremieRpet.Shop.Domain.Constants;

#nullable disable

namespace PremieRpet.Shop.Infrastructure.Migrations
{
    public partial class AddPedidoIntegracao : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "PedidoIntegracaoStatus",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Nome = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PedidoIntegracaoStatus", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "PedidoIntegracaoLogs",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    PedidoId = table.Column<Guid>(type: "uuid", nullable: false),
                    StatusId = table.Column<Guid>(type: "uuid", nullable: false),
                    Resultado = table.Column<string>(type: "text", nullable: true),
                    DataCriacao = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PedidoIntegracaoLogs", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PedidoIntegracaoLogs_PedidoIntegracaoStatus_StatusId",
                        column: x => x.StatusId,
                        principalTable: "PedidoIntegracaoStatus",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_PedidoIntegracaoLogs_Pedidos_PedidoId",
                        column: x => x.PedidoId,
                        principalTable: "Pedidos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_PedidoIntegracaoLogs_DataCriacao",
                table: "PedidoIntegracaoLogs",
                column: "DataCriacao");

            migrationBuilder.CreateIndex(
                name: "IX_PedidoIntegracaoLogs_PedidoId",
                table: "PedidoIntegracaoLogs",
                column: "PedidoId");

            migrationBuilder.CreateIndex(
                name: "IX_PedidoIntegracaoLogs_StatusId",
                table: "PedidoIntegracaoLogs",
                column: "StatusId");

            migrationBuilder.CreateIndex(
                name: "IX_PedidoIntegracaoStatus_Nome",
                table: "PedidoIntegracaoStatus",
                column: "Nome",
                unique: true);

            migrationBuilder.InsertData(
                table: "PedidoIntegracaoStatus",
                columns: new[] { "Id", "Nome" },
                values: new object[,]
                {
                    { PedidoIntegracaoStatusIds.NaoIntegrado, "Não integrado" },
                    { PedidoIntegracaoStatusIds.Processando, "Processando" },
                    { PedidoIntegracaoStatusIds.Integrado, "Integrado" },
                    { PedidoIntegracaoStatusIds.Erro, "Erro" }
                });
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(name: "PedidoIntegracaoLogs");
            migrationBuilder.DropTable(name: "PedidoIntegracaoStatus");
        }
    }
}
