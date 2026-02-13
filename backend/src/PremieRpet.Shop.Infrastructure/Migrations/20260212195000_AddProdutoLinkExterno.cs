using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PremieRpet.Shop.Infrastructure.Migrations
{
    [DbContext(typeof(ShopDbContext))]
    [Migration("20260212195000_AddProdutoLinkExterno")]
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
