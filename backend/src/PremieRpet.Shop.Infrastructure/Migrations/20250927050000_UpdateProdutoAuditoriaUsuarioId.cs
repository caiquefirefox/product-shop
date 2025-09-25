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

            // Garante que existam Usuarios para todos os MicrosoftId referenciados nos produtos
            migrationBuilder.Sql(@"
                INSERT INTO ""Usuarios"" (""Id"", ""MicrosoftId"", ""Cpf"", ""CriadoEm"", ""AtualizadoEm"")
                SELECT DISTINCT
                    md5(src.""MicrosoftId"")::uuid,
                    src.""MicrosoftId"",
                    NULL,
                    NOW(),
                    NOW()
                FROM (
                    SELECT NULLIF(TRIM(p.""CriadoPorUsuarioId""), '') AS ""MicrosoftId""
                    FROM ""Produtos"" p
                    WHERE p.""CriadoPorUsuarioId"" IS NOT NULL AND TRIM(p.""CriadoPorUsuarioId"") <> ''
                    UNION
                    SELECT NULLIF(TRIM(p.""AtualizadoPorUsuarioId""), '') AS ""MicrosoftId""
                    FROM ""Produtos"" p
                    WHERE p.""AtualizadoPorUsuarioId"" IS NOT NULL AND TRIM(p.""AtualizadoPorUsuarioId"") <> ''
                ) src
                WHERE src.""MicrosoftId"" IS NOT NULL
                  AND NOT EXISTS (
                      SELECT 1 FROM ""Usuarios"" u WHERE u.""MicrosoftId"" = src.""MicrosoftId""
                  );
            ");

            // Preenche FKs temporárias com o Id do usuário correspondente
            migrationBuilder.Sql(@"
                UPDATE ""Produtos"" p
                SET ""CriadoPorUsuarioIdTemp"" = u.""Id""
                FROM ""Usuarios"" u
                WHERE NULLIF(TRIM(p.""CriadoPorUsuarioId""), '') IS NOT NULL
                  AND u.""MicrosoftId"" = p.""CriadoPorUsuarioId"";
            ");

            migrationBuilder.Sql(@"
                UPDATE ""Produtos"" p
                SET ""AtualizadoPorUsuarioIdTemp"" = u.""Id""
                FROM ""Usuarios"" u
                WHERE NULLIF(TRIM(p.""AtualizadoPorUsuarioId""), '') IS NOT NULL
                  AND u.""MicrosoftId"" = p.""AtualizadoPorUsuarioId"";
            ");

            // Remove as antigas colunas string
            migrationBuilder.DropColumn(
                name: "CriadoPorUsuarioId",
                table: "Produtos");

            migrationBuilder.DropColumn(
                name: "AtualizadoPorUsuarioId",
                table: "Produtos");

            // Renomeia as temporárias (Guid) para as definitivas
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

            // Recria colunas temporárias string para restaurar dados
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

            // Copia de volta o MicrosoftId a partir do Id do usuário
            migrationBuilder.Sql(@"
                UPDATE ""Produtos"" p
                SET ""CriadoPorUsuarioIdTemp"" = u.""MicrosoftId""
                FROM ""Usuarios"" u
                WHERE p.""CriadoPorUsuarioId"" IS NOT NULL
                  AND u.""Id"" = p.""CriadoPorUsuarioId"";
            ");

            migrationBuilder.Sql(@"
                UPDATE ""Produtos"" p
                SET ""AtualizadoPorUsuarioIdTemp"" = u.""MicrosoftId""
                FROM ""Usuarios"" u
                WHERE p.""AtualizadoPorUsuarioId"" IS NOT NULL
                  AND u.""Id"" = p.""AtualizadoPorUsuarioId"";
            ");

            // Remove as colunas Guid
            migrationBuilder.DropColumn(
                name: "AtualizadoPorUsuarioId",
                table: "Produtos");

            migrationBuilder.DropColumn(
                name: "CriadoPorUsuarioId",
                table: "Produtos");

            // Renomeia as string temporárias para os nomes originais
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
