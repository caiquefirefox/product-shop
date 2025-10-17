using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PremieRpet.Shop.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddUnidadesEntrega : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "UnidadesEntrega",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Nome = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UnidadesEntrega", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_UnidadesEntrega_Nome",
                table: "UnidadesEntrega",
                column: "Nome",
                unique: true);

            migrationBuilder.InsertData(
                table: "UnidadesEntrega",
                columns: new[] { "Id", "Nome" },
                values: new object[,]
                {
                    { new Guid("f828a309-3b7a-55bb-9921-a4b3640e180b"), "BAHIA" },
                    { new Guid("1401ae7a-fd5d-5fea-978d-4b7ee0350748"), "BRASCORP" },
                    { new Guid("7f6ab4ca-bf95-569b-a9f7-c24f46ac09e2"), "CD SANTANA DE PARNAÍBA" },
                    { new Guid("9b216587-cea4-5f99-a123-d519be4b6925"), "DISTRITO FEDERAL" },
                    { new Guid("4e2c96fa-585a-5d39-9bf3-39b3ef473e7b"), "GOIÁS" },
                    { new Guid("083eb7fc-8fa1-517f-8aec-1e20b779cdb2"), "PARANÁ" },
                    { new Guid("c30f2dd6-8741-58e2-a65b-881435ff701f"), "PERNAMBUCO" },
                    { new Guid("41f894cd-6c17-566f-bd08-6ad8eb97e9d9"), "PREMIER ESCRITÓRIO - SP" },
                    { new Guid("06fd3c2b-6c72-5f94-893d-e63466d0e34d"), "PREMIER INTERIOR - SP" },
                    { new Guid("784332e4-5052-5314-b7c2-4e6fd7f20255"), "PREMIER LITORAL - SP" },
                    { new Guid("595407a3-c4f7-5639-aa7c-a1befb4d6e70"), "RIO DE JANEIRO" },
                    { new Guid("6f208b53-e62b-576a-8de4-fbf673db66aa"), "RIO GRANDE DO SUL" },
                    { new Guid("e1f1e75f-3818-5022-b0f8-3b2060ca2ac1"), "SANTA CATARINA" },
                    { new Guid("737aed3e-dc2e-5534-9456-986f1b7db715"), "CD BETIM - MG" },
                    { new Guid("0c63cefe-5b6b-57f9-b073-a035d292d864"), "RIO GRANDE DO NORTE" },
                    { new Guid("bcb84da6-c993-54e7-8c14-665f89d70433"), "CD EXTREMA - MG" },
                    { new Guid("a1e08cc1-1962-4e30-a9a1-f899176d71a3"), "CD HORTOLÂNDIA" },
                    { new Guid("c3f7f6a1-b95b-4ec4-a8ce-bb3aa3cbd48c"), "CD BARUERI" },
                    { new Guid("1acb4bc4-8c07-5aea-895d-5a8657ae8dbb"), "CEARÁ" },
                    { new Guid("dce4840f-14c4-59d0-8a23-a03df0705d3c"), "FÁBRICA PARANÁ" },
                    { new Guid("1d7f3994-a00a-56a6-aa07-09b593ede157"), "FÁBRICA DOURADO" }
                });

            migrationBuilder.AddColumn<Guid>(
                name: "UnidadeEntregaId",
                table: "Pedidos",
                type: "uuid",
                nullable: true);

            migrationBuilder.Sql(@"UPDATE ""Pedidos"" p
SET ""UnidadeEntregaId"" = u.""Id""
FROM ""UnidadesEntrega"" u
WHERE p.""UnidadeEntrega"" = u.""Nome"";");

            migrationBuilder.Sql(@"UPDATE ""Pedidos""
SET ""UnidadeEntregaId"" = (SELECT ""Id"" FROM ""UnidadesEntrega"" LIMIT 1)
WHERE ""UnidadeEntregaId"" IS NULL;");

            migrationBuilder.AlterColumn<Guid>(
                name: "UnidadeEntregaId",
                table: "Pedidos",
                type: "uuid",
                nullable: false,
                oldClrType: typeof(Guid),
                oldType: "uuid",
                oldNullable: true);

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
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.DropColumn(
                name: "UnidadeEntrega",
                table: "Pedidos");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "UnidadeEntrega",
                table: "Pedidos",
                type: "character varying(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.Sql(@"UPDATE ""Pedidos"" p
SET ""UnidadeEntrega"" = u.""Nome""
FROM ""UnidadesEntrega"" u
WHERE p.""UnidadeEntregaId"" = u.""Id"";");

            migrationBuilder.Sql(@"UPDATE ""Pedidos""
SET ""UnidadeEntrega"" = COALESCE(""UnidadeEntrega"", 'BAHIA');");

            migrationBuilder.DropForeignKey(
                name: "FK_Pedidos_UnidadesEntrega_UnidadeEntregaId",
                table: "Pedidos");

            migrationBuilder.DropIndex(
                name: "IX_Pedidos_UnidadeEntregaId",
                table: "Pedidos");

            migrationBuilder.DropColumn(
                name: "UnidadeEntregaId",
                table: "Pedidos");

            migrationBuilder.DropTable(
                name: "UnidadesEntrega");

            migrationBuilder.AlterColumn<string>(
                name: "UnidadeEntrega",
                table: "Pedidos",
                type: "character varying(200)",
                maxLength: 200,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(200)",
                oldMaxLength: 200,
                oldNullable: true);
        }
    }
}
