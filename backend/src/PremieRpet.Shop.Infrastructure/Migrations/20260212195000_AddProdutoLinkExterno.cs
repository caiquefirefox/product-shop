using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PremieRpet.Shop.Infrastructure.Migrations
{
    public partial class AddProdutoLinkExterno : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "LinkExterno",
                table: "Produtos",
                type: "character varying(1024)",
                maxLength: 1024,
                nullable: true);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "LinkExterno",
                table: "Produtos");
        }
    }
}
