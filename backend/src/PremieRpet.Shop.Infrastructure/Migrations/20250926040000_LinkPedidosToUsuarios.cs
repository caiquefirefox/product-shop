using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PremieRpet.Shop.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class LinkPedidosToUsuarios : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "UsuarioPerfilId",
                table: "Pedidos",
                type: "uuid",
                nullable: true);

            // Insere perfis de usuário que ainda não existem, a partir dos Pedidos
            migrationBuilder.Sql(@"
                INSERT INTO ""Usuarios"" (""Id"", ""MicrosoftId"", ""Cpf"", ""CriadoEm"", ""AtualizadoEm"")
                SELECT
                    md5(p.""UsuarioId"")::uuid,
                    p.""UsuarioId"",
                    NULL,
                    NOW(),
                    NOW()
                FROM ""Pedidos"" p
                WHERE p.""UsuarioId"" IS NOT NULL
                  AND NOT EXISTS (
                      SELECT 1 FROM ""Usuarios"" u WHERE u.""MicrosoftId"" = p.""UsuarioId""
                  )
                GROUP BY p.""UsuarioId"";
            ");

            // Completa/atualiza CPF quando vier dos pedidos
            migrationBuilder.Sql(@"
                UPDATE ""Usuarios"" u
                SET ""Cpf"" = COALESCE(u.""Cpf"", NULLIF(TRIM(src.""UsuarioCpf""), '')),
                    ""AtualizadoEm"" = CASE
                        WHEN u.""Cpf"" IS NULL AND NULLIF(TRIM(src.""UsuarioCpf""), '') IS NOT NULL THEN NOW()
                        ELSE u.""AtualizadoEm""
                    END
                FROM (
                    SELECT p.""UsuarioId"", MAX(p.""UsuarioCpf"") AS ""UsuarioCpf""
                    FROM ""Pedidos"" p
                    WHERE p.""UsuarioCpf"" IS NOT NULL AND TRIM(p.""UsuarioCpf"") <> ''
                    GROUP BY p.""UsuarioId""
                ) src
                WHERE u.""MicrosoftId"" = src.""UsuarioId"";
            ");

            // Preenche a FK nos pedidos com o Id do usuário correspondente
            migrationBuilder.Sql(@"
                UPDATE ""Pedidos"" p
                SET ""UsuarioPerfilId"" = u.""Id""
                FROM ""Usuarios"" u
                WHERE u.""MicrosoftId"" = p.""UsuarioId"";
            ");

            // Para qualquer registro remanescente, gera UUID determinístico com md5(UsuarioId)
            migrationBuilder.Sql(@"
                UPDATE ""Pedidos""
                SET ""UsuarioPerfilId"" = md5(""UsuarioId"")::uuid
                WHERE ""UsuarioPerfilId"" IS NULL AND ""UsuarioId"" IS NOT NULL;
            ");

            migrationBuilder.AlterColumn<Guid>(
                name: "UsuarioPerfilId",
                table: "Pedidos",
                type: "uuid",
                nullable: false,
                oldClrType: typeof(Guid),
                oldType: "uuid",
                oldNullable: true);

            // Remove a antiga coluna string e renomeia a nova para UsuarioId (agora FK)
            migrationBuilder.DropColumn(
                name: "UsuarioId",
                table: "Pedidos");

            migrationBuilder.RenameColumn(
                name: "UsuarioPerfilId",
                table: "Pedidos",
                newName: "UsuarioId");

            migrationBuilder.CreateIndex(
                name: "IX_Pedidos_UsuarioId",
                table: "Pedidos",
                column: "UsuarioId");

            migrationBuilder.AddForeignKey(
                name: "FK_Pedidos_Usuarios_UsuarioId",
                table: "Pedidos",
                column: "UsuarioId",
                principalTable: "Usuarios",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Pedidos_Usuarios_UsuarioId",
                table: "Pedidos");

            migrationBuilder.DropIndex(
                name: "IX_Pedidos_UsuarioId",
                table: "Pedidos");

            // Volta a coluna antiga com o MicrosoftId (string)
            migrationBuilder.AddColumn<string>(
                name: "UsuarioMicrosoftId",
                table: "Pedidos",
                type: "character varying(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.Sql(@"
                UPDATE ""Pedidos"" p
                SET ""UsuarioMicrosoftId"" = u.""MicrosoftId""
                FROM ""Usuarios"" u
                WHERE u.""Id"" = p.""UsuarioId"";
            ");

            migrationBuilder.AlterColumn<string>(
                name: "UsuarioMicrosoftId",
                table: "Pedidos",
                type: "character varying(200)",
                maxLength: 200,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(200)",
                oldMaxLength: 200,
                oldNullable: true);

            migrationBuilder.DropColumn(
                name: "UsuarioId",
                table: "Pedidos");

            migrationBuilder.RenameColumn(
                name: "UsuarioMicrosoftId",
                table: "Pedidos",
                newName: "UsuarioId");
        }
    }
}
