using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using PremieRpet.Shop.Infrastructure;

#nullable disable

namespace PremieRpet.Shop.Infrastructure.Migrations
{
    [DbContext(typeof(ShopDbContext))]
    [Migration("20260310120000_AddPedidoCompetenciaAnoMes")]
    public partial class AddPedidoCompetenciaAnoMes : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "CompetenciaAnoMes",
                table: "Pedidos",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.Sql("""
                UPDATE \"Pedidos\"
                SET \"CompetenciaAnoMes\" = (EXTRACT(YEAR FROM \"DataHora\")::int * 100) + EXTRACT(MONTH FROM \"DataHora\")::int
                WHERE \"CompetenciaAnoMes\" = 0;
            """);

            migrationBuilder.CreateIndex(
                name: "IX_Pedidos_CompetenciaAnoMes",
                table: "Pedidos",
                column: "CompetenciaAnoMes");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Pedidos_CompetenciaAnoMes",
                table: "Pedidos");

            migrationBuilder.DropColumn(
                name: "CompetenciaAnoMes",
                table: "Pedidos");
        }
    }
}
