using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace PremieRpet.Shop.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddEmpresasUnidadesEntrega : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_UnidadesEntrega_Nome",
                table: "UnidadesEntrega");

            migrationBuilder.AddColumn<Guid>(
                name: "EmpresaId",
                table: "UnidadesEntrega",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.CreateTable(
                name: "Empresas",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Nome = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Empresas", x => x.Id);
                });

            migrationBuilder.InsertData(
                table: "Empresas",
                columns: new[] { "Id", "Nome" },
                values: new object[,]
                {
                    { new Guid("6f9502b1-5ba6-4f4b-920a-66a79ab41c45"), "Eucatex" },
                    { new Guid("f6413e92-bc2f-4baf-881c-d1ec6f6c0a4e"), "PremieRpet" }
                });

            migrationBuilder.UpdateData(
                table: "UnidadesEntrega",
                keyColumn: "Id",
                keyValue: new Guid("06fd3c2b-6c72-5f94-893d-e63466d0e34d"),
                column: "EmpresaId",
                value: new Guid("f6413e92-bc2f-4baf-881c-d1ec6f6c0a4e"));

            migrationBuilder.UpdateData(
                table: "UnidadesEntrega",
                keyColumn: "Id",
                keyValue: new Guid("083eb7fc-8fa1-517f-8aec-1e20b779cdb2"),
                column: "EmpresaId",
                value: new Guid("f6413e92-bc2f-4baf-881c-d1ec6f6c0a4e"));

            migrationBuilder.UpdateData(
                table: "UnidadesEntrega",
                keyColumn: "Id",
                keyValue: new Guid("0c63cefe-5b6b-57f9-b073-a035d292d864"),
                column: "EmpresaId",
                value: new Guid("f6413e92-bc2f-4baf-881c-d1ec6f6c0a4e"));

            migrationBuilder.UpdateData(
                table: "UnidadesEntrega",
                keyColumn: "Id",
                keyValue: new Guid("1401ae7a-fd5d-5fea-978d-4b7ee0350748"),
                column: "EmpresaId",
                value: new Guid("f6413e92-bc2f-4baf-881c-d1ec6f6c0a4e"));

            migrationBuilder.UpdateData(
                table: "UnidadesEntrega",
                keyColumn: "Id",
                keyValue: new Guid("1acb4bc4-8c07-5aea-895d-5a8657ae8dbb"),
                column: "EmpresaId",
                value: new Guid("f6413e92-bc2f-4baf-881c-d1ec6f6c0a4e"));

            migrationBuilder.UpdateData(
                table: "UnidadesEntrega",
                keyColumn: "Id",
                keyValue: new Guid("1d7f3994-a00a-56a6-aa07-09b593ede157"),
                column: "EmpresaId",
                value: new Guid("f6413e92-bc2f-4baf-881c-d1ec6f6c0a4e"));

            migrationBuilder.UpdateData(
                table: "UnidadesEntrega",
                keyColumn: "Id",
                keyValue: new Guid("41f894cd-6c17-566f-bd08-6ad8eb97e9d9"),
                column: "EmpresaId",
                value: new Guid("f6413e92-bc2f-4baf-881c-d1ec6f6c0a4e"));

            migrationBuilder.UpdateData(
                table: "UnidadesEntrega",
                keyColumn: "Id",
                keyValue: new Guid("4e2c96fa-585a-5d39-9bf3-39b3ef473e7b"),
                column: "EmpresaId",
                value: new Guid("f6413e92-bc2f-4baf-881c-d1ec6f6c0a4e"));

            migrationBuilder.UpdateData(
                table: "UnidadesEntrega",
                keyColumn: "Id",
                keyValue: new Guid("595407a3-c4f7-5639-aa7c-a1befb4d6e70"),
                column: "EmpresaId",
                value: new Guid("f6413e92-bc2f-4baf-881c-d1ec6f6c0a4e"));

            migrationBuilder.UpdateData(
                table: "UnidadesEntrega",
                keyColumn: "Id",
                keyValue: new Guid("6f208b53-e62b-576a-8de4-fbf673db66aa"),
                column: "EmpresaId",
                value: new Guid("f6413e92-bc2f-4baf-881c-d1ec6f6c0a4e"));

            migrationBuilder.UpdateData(
                table: "UnidadesEntrega",
                keyColumn: "Id",
                keyValue: new Guid("737aed3e-dc2e-5534-9456-986f1b7db715"),
                column: "EmpresaId",
                value: new Guid("f6413e92-bc2f-4baf-881c-d1ec6f6c0a4e"));

            migrationBuilder.UpdateData(
                table: "UnidadesEntrega",
                keyColumn: "Id",
                keyValue: new Guid("784332e4-5052-5314-b7c2-4e6fd7f20255"),
                column: "EmpresaId",
                value: new Guid("f6413e92-bc2f-4baf-881c-d1ec6f6c0a4e"));

            migrationBuilder.UpdateData(
                table: "UnidadesEntrega",
                keyColumn: "Id",
                keyValue: new Guid("7f6ab4ca-bf95-569b-a9f7-c24f46ac09e2"),
                column: "EmpresaId",
                value: new Guid("f6413e92-bc2f-4baf-881c-d1ec6f6c0a4e"));

            migrationBuilder.UpdateData(
                table: "UnidadesEntrega",
                keyColumn: "Id",
                keyValue: new Guid("9b216587-cea4-5f99-a123-d519be4b6925"),
                column: "EmpresaId",
                value: new Guid("f6413e92-bc2f-4baf-881c-d1ec6f6c0a4e"));

            migrationBuilder.UpdateData(
                table: "UnidadesEntrega",
                keyColumn: "Id",
                keyValue: new Guid("a1e08cc1-1962-4e30-a9a1-f899176d71a3"),
                column: "EmpresaId",
                value: new Guid("f6413e92-bc2f-4baf-881c-d1ec6f6c0a4e"));

            migrationBuilder.UpdateData(
                table: "UnidadesEntrega",
                keyColumn: "Id",
                keyValue: new Guid("bcb84da6-c993-54e7-8c14-665f89d70433"),
                column: "EmpresaId",
                value: new Guid("f6413e92-bc2f-4baf-881c-d1ec6f6c0a4e"));

            migrationBuilder.UpdateData(
                table: "UnidadesEntrega",
                keyColumn: "Id",
                keyValue: new Guid("c30f2dd6-8741-58e2-a65b-881435ff701f"),
                column: "EmpresaId",
                value: new Guid("f6413e92-bc2f-4baf-881c-d1ec6f6c0a4e"));

            migrationBuilder.UpdateData(
                table: "UnidadesEntrega",
                keyColumn: "Id",
                keyValue: new Guid("c3f7f6a1-b95b-4ec4-a8ce-bb3aa3cbd48c"),
                column: "EmpresaId",
                value: new Guid("f6413e92-bc2f-4baf-881c-d1ec6f6c0a4e"));

            migrationBuilder.UpdateData(
                table: "UnidadesEntrega",
                keyColumn: "Id",
                keyValue: new Guid("dce4840f-14c4-59d0-8a23-a03df0705d3c"),
                column: "EmpresaId",
                value: new Guid("f6413e92-bc2f-4baf-881c-d1ec6f6c0a4e"));

            migrationBuilder.UpdateData(
                table: "UnidadesEntrega",
                keyColumn: "Id",
                keyValue: new Guid("e1f1e75f-3818-5022-b0f8-3b2060ca2ac1"),
                column: "EmpresaId",
                value: new Guid("f6413e92-bc2f-4baf-881c-d1ec6f6c0a4e"));

            migrationBuilder.UpdateData(
                table: "UnidadesEntrega",
                keyColumn: "Id",
                keyValue: new Guid("f828a309-3b7a-55bb-9921-a4b3640e180b"),
                column: "EmpresaId",
                value: new Guid("f6413e92-bc2f-4baf-881c-d1ec6f6c0a4e"));

            migrationBuilder.InsertData(
                table: "UnidadesEntrega",
                columns: new[] { "Id", "EmpresaId", "Nome" },
                values: new object[,]
                {
                    { new Guid("0d7a7a3c-c1f5-4bc3-9e1b-df7d21b34cc1"), new Guid("6f9502b1-5ba6-4f4b-920a-66a79ab41c45"), "PERNAMBUCO" },
                    { new Guid("5f933992-bd8c-4bb0-9b9d-3b40dc8b32c0"), new Guid("6f9502b1-5ba6-4f4b-920a-66a79ab41c45"), "BOTUCATU FIBRAS" },
                    { new Guid("a2e3b2f4-22b2-4f30-a47f-b17bbd89f640"), new Guid("6f9502b1-5ba6-4f4b-920a-66a79ab41c45"), "EUCATEX ESCRITÓRIO - SP" },
                    { new Guid("c1eb6c4f-884b-4f59-9bb5-361b5c7235a0"), new Guid("6f9502b1-5ba6-4f4b-920a-66a79ab41c45"), "COSTA RICA" },
                    { new Guid("c3a7853a-10a0-4b34-9c63-63e7d69fdd59"), new Guid("6f9502b1-5ba6-4f4b-920a-66a79ab41c45"), "SALTO" },
                    { new Guid("d8b7ebae-858f-4f9d-8d76-2c7f0f5a6f1b"), new Guid("6f9502b1-5ba6-4f4b-920a-66a79ab41c45"), "BOTUCATU MDP" }
                });

            migrationBuilder.AlterColumn<Guid>(
                name: "EmpresaId",
                table: "UnidadesEntrega",
                type: "uuid",
                nullable: false,
                oldClrType: typeof(Guid),
                oldType: "uuid",
                oldDefaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.CreateIndex(
                name: "IX_UnidadesEntrega_EmpresaId_Nome",
                table: "UnidadesEntrega",
                columns: new[] { "EmpresaId", "Nome" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Empresas_Nome",
                table: "Empresas",
                column: "Nome",
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_UnidadesEntrega_Empresas_EmpresaId",
                table: "UnidadesEntrega",
                column: "EmpresaId",
                principalTable: "Empresas",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_UnidadesEntrega_Empresas_EmpresaId",
                table: "UnidadesEntrega");

            migrationBuilder.DropTable(
                name: "Empresas");

            migrationBuilder.DropIndex(
                name: "IX_UnidadesEntrega_EmpresaId_Nome",
                table: "UnidadesEntrega");

            migrationBuilder.DeleteData(
                table: "UnidadesEntrega",
                keyColumn: "Id",
                keyValue: new Guid("0d7a7a3c-c1f5-4bc3-9e1b-df7d21b34cc1"));

            migrationBuilder.DeleteData(
                table: "UnidadesEntrega",
                keyColumn: "Id",
                keyValue: new Guid("5f933992-bd8c-4bb0-9b9d-3b40dc8b32c0"));

            migrationBuilder.DeleteData(
                table: "UnidadesEntrega",
                keyColumn: "Id",
                keyValue: new Guid("a2e3b2f4-22b2-4f30-a47f-b17bbd89f640"));

            migrationBuilder.DeleteData(
                table: "UnidadesEntrega",
                keyColumn: "Id",
                keyValue: new Guid("c1eb6c4f-884b-4f59-9bb5-361b5c7235a0"));

            migrationBuilder.DeleteData(
                table: "UnidadesEntrega",
                keyColumn: "Id",
                keyValue: new Guid("c3a7853a-10a0-4b34-9c63-63e7d69fdd59"));

            migrationBuilder.DeleteData(
                table: "UnidadesEntrega",
                keyColumn: "Id",
                keyValue: new Guid("d8b7ebae-858f-4f9d-8d76-2c7f0f5a6f1b"));

            migrationBuilder.DropColumn(
                name: "EmpresaId",
                table: "UnidadesEntrega");

            migrationBuilder.CreateIndex(
                name: "IX_UnidadesEntrega_Nome",
                table: "UnidadesEntrega",
                column: "Nome",
                unique: true);
        }
    }
}
