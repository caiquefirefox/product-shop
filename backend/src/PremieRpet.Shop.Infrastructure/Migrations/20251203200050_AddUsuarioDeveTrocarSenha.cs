using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PremieRpet.Shop.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddUsuarioDeveTrocarSenha : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "DeveTrocarSenha",
                table: "Usuarios",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.Sql(
                """
                UPDATE "Usuarios"
                SET "DeveTrocarSenha" = TRUE
                WHERE "PasswordHash" IS NOT NULL
                  AND "MicrosoftId" IS NULL;
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "DeveTrocarSenha",
                table: "Usuarios");
        }
    }
}
