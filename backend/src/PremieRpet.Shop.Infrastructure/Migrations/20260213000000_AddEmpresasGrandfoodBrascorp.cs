using System;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PremieRpet.Shop.Infrastructure.Migrations
{
    [DbContext(typeof(ShopDbContext))]
    [Migration("20260213000000_AddEmpresasGrandfoodBrascorp")]
    public partial class AddEmpresasGrandfoodBrascorp : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.InsertData(
                table: "Empresas",
                columns: new[] { "Id", "Nome" },
                values: new object[,]
                {
                    { new Guid("acdf44fb-34d5-4556-ad2d-8175194f2acd"), "Grandfood Agrícola" },
                    { new Guid("74eaed99-6c22-4f5d-89d6-2bf5ee7eb8de"), "Brascorp" }
                });
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "Empresas",
                keyColumn: "Id",
                keyValue: new Guid("acdf44fb-34d5-4556-ad2d-8175194f2acd"));

            migrationBuilder.DeleteData(
                table: "Empresas",
                keyColumn: "Id",
                keyValue: new Guid("74eaed99-6c22-4f5d-89d6-2bf5ee7eb8de"));
        }
    }
}
