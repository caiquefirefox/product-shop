using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using PremieRpet.Shop.Infrastructure;

#nullable disable

namespace PremieRpet.Shop.Infrastructure.Migrations
{
    [DbContext(typeof(ShopDbContext))]
    [Migration("20260226120000_AddUsuarioCondicaoPagamento")]
    public partial class AddUsuarioCondicaoPagamento : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "CondicaoPagamento",
                table: "Usuarios",
                type: "integer",
                nullable: false,
                defaultValue: 3);

            migrationBuilder.Sql("UPDATE \"Usuarios\" SET \"CondicaoPagamento\" = 3 WHERE \"CondicaoPagamento\" IS NULL OR \"CondicaoPagamento\" NOT IN (3, 28);");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CondicaoPagamento",
                table: "Usuarios");
        }
    }
}
