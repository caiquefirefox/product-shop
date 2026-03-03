using System;
using Microsoft.EntityFrameworkCore.Migrations;

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
                    PedidoExternoId = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    DataCriacao = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()")
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

            migrationBuilder.InsertData(
                table: "PedidoIntegracaoStatus",
                columns: new[] { "Id", "Nome" },
                values: new object[,]
                {
                    { new Guid("5bf5f98a-f8f7-4f6c-af7f-6e6ef4e2a1bf"), "Não integrado" },
                    { new Guid("4eca7f0b-b347-4fc4-b4ec-cf581f5f9e03"), "Processando" },
                    { new Guid("7c8906e9-a10f-4c6f-a0cd-75cf4f7facdf"), "Integrado" },
                    { new Guid("f5ef5e17-03d0-40f9-a5ad-231470c4ca8f"), "Erro" }
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
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "PedidoIntegracaoLogs");

            migrationBuilder.DropTable(
                name: "PedidoIntegracaoStatus");
        }
    }
}
