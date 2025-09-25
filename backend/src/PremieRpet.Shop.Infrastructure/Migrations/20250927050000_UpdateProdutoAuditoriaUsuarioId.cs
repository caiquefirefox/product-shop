using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PremieRpet.Shop.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class UpdateProdutoAuditoriaUsuarioId : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "CriadoPorUsuarioIdTemp",
                table: "Produtos",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "AtualizadoPorUsuarioIdTemp",
                table: "Produtos",
                type: "uuid",
                nullable: true);

            migrationBuilder.Sql(@"
                INSERT INTO \"Usuarios\" (\"Id\", \"MicrosoftId\", \"Cpf\", \"CriadoEm\", \"AtualizadoEm\")
                SELECT DISTINCT
                    md5(src.\"MicrosoftId\")::uuid,
                    src.\"MicrosoftId\",
                    NULL,
                    NOW(),
                    NOW()
                FROM (
                    SELECT p.\"CriadoPorUsuarioId\" AS \"MicrosoftId\"
                    FROM \"Produtos\" p
                    WHERE p.\"CriadoPorUsuarioId\" IS NOT NULL AND p.\"CriadoPorUsuarioId\" <> ''
                    UNION
                    SELECT p.\"AtualizadoPorUsuarioId\"
                    FROM \"Produtos\" p
                    WHERE p.\"AtualizadoPorUsuarioId\" IS NOT NULL AND p.\"AtualizadoPorUsuarioId\" <> ''
                ) src
                WHERE NOT EXISTS (
                    SELECT 1 FROM \"Usuarios\" u WHERE u.\"MicrosoftId\" = src.\"MicrosoftId\"
                );
            ");

            migrationBuilder.Sql(@"
                UPDATE \"Produtos\" p
                SET \"CriadoPorUsuarioIdTemp\" = u.\"Id\"
                FROM \"Usuarios\" u
                WHERE p.\"CriadoPorUsuarioId\" IS NOT NULL
                  AND p.\"CriadoPorUsuarioId\" = u.\"MicrosoftId\";
            ");

            migrationBuilder.Sql(@"
                UPDATE \"Produtos\" p
                SET \"AtualizadoPorUsuarioIdTemp\" = u.\"Id\"
                FROM \"Usuarios\" u
                WHERE p.\"AtualizadoPorUsuarioId\" IS NOT NULL
                  AND p.\"AtualizadoPorUsuarioId\" = u.\"MicrosoftId\";
            ");

            migrationBuilder.DropColumn(
                name: "CriadoPorUsuarioId",
                table: "Produtos");

            migrationBuilder.DropColumn(
                name: "AtualizadoPorUsuarioId",
                table: "Produtos");

            migrationBuilder.RenameColumn(
                name: "CriadoPorUsuarioIdTemp",
                table: "Produtos",
                newName: "CriadoPorUsuarioId");

            migrationBuilder.RenameColumn(
                name: "AtualizadoPorUsuarioIdTemp",
                table: "Produtos",
                newName: "AtualizadoPorUsuarioId");

            migrationBuilder.CreateIndex(
                name: "IX_Produtos_CriadoPorUsuarioId",
                table: "Produtos",
                column: "CriadoPorUsuarioId");

            migrationBuilder.CreateIndex(
                name: "IX_Produtos_AtualizadoPorUsuarioId",
                table: "Produtos",
                column: "AtualizadoPorUsuarioId");

            migrationBuilder.AddForeignKey(
                name: "FK_Produtos_Usuarios_AtualizadoPorUsuarioId",
                table: "Produtos",
                column: "AtualizadoPorUsuarioId",
                principalTable: "Usuarios",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_Produtos_Usuarios_CriadoPorUsuarioId",
                table: "Produtos",
                column: "CriadoPorUsuarioId",
                principalTable: "Usuarios",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Produtos_Usuarios_AtualizadoPorUsuarioId",
                table: "Produtos");

            migrationBuilder.DropForeignKey(
                name: "FK_Produtos_Usuarios_CriadoPorUsuarioId",
                table: "Produtos");

            migrationBuilder.DropIndex(
                name: "IX_Produtos_AtualizadoPorUsuarioId",
                table: "Produtos");

            migrationBuilder.DropIndex(
                name: "IX_Produtos_CriadoPorUsuarioId",
                table: "Produtos");

            migrationBuilder.AddColumn<string>(
                name: "AtualizadoPorUsuarioIdTemp",
                table: "Produtos",
                type: "character varying(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CriadoPorUsuarioIdTemp",
                table: "Produtos",
                type: "character varying(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.Sql(@"
                UPDATE \"Produtos\" p
                SET \"CriadoPorUsuarioIdTemp\" = u.\"MicrosoftId\"
                FROM \"Usuarios\" u
                WHERE p.\"CriadoPorUsuarioId\" IS NOT NULL
                  AND p.\"CriadoPorUsuarioId\" = u.\"Id\";
            ");

            migrationBuilder.Sql(@"
                UPDATE \"Produtos\" p
                SET \"AtualizadoPorUsuarioIdTemp\" = u.\"MicrosoftId\"
                FROM \"Usuarios\" u
                WHERE p.\"AtualizadoPorUsuarioId\" IS NOT NULL
                  AND p.\"AtualizadoPorUsuarioId\" = u.\"Id\";
            ");

            migrationBuilder.DropColumn(
                name: "AtualizadoPorUsuarioId",
                table: "Produtos");

            migrationBuilder.DropColumn(
                name: "CriadoPorUsuarioId",
                table: "Produtos");

            migrationBuilder.RenameColumn(
                name: "AtualizadoPorUsuarioIdTemp",
                table: "Produtos",
                newName: "AtualizadoPorUsuarioId");

            migrationBuilder.RenameColumn(
                name: "CriadoPorUsuarioIdTemp",
                table: "Produtos",
                newName: "CriadoPorUsuarioId");
        }
    }
}
