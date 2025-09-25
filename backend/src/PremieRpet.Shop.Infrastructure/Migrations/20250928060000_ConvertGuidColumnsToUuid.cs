using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PremieRpet.Shop.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class ConvertGuidColumnsToUuid : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_PedidoItens_Pedidos_PedidoId",
                table: "PedidoItens");

            migrationBuilder.DropForeignKey(
                name: "FK_PedidoItens_Produtos_ProdutoId",
                table: "PedidoItens");

            migrationBuilder.DropForeignKey(
                name: "FK_Pedidos_Usuarios_UsuarioId",
                table: "Pedidos");

            migrationBuilder.DropForeignKey(
                name: "FK_ProdutoPortes_ProdutoPorteOpcoes_PorteOpcaoId",
                table: "ProdutoPortes");

            migrationBuilder.DropForeignKey(
                name: "FK_ProdutoPortes_Produtos_ProdutoId",
                table: "ProdutoPortes");

            migrationBuilder.DropForeignKey(
                name: "FK_Produtos_ProdutoEspecieOpcoes_EspecieOpcaoId",
                table: "Produtos");

            migrationBuilder.DropForeignKey(
                name: "FK_Produtos_ProdutoFaixaEtariaOpcoes_FaixaEtariaOpcaoId",
                table: "Produtos");

            migrationBuilder.DropForeignKey(
                name: "FK_Produtos_ProdutoTipoProdutoOpcoes_TipoProdutoOpcaoId",
                table: "Produtos");

            migrationBuilder.DropForeignKey(
                name: "FK_Produtos_Usuarios_AtualizadoPorUsuarioId",
                table: "Produtos");

            migrationBuilder.DropForeignKey(
                name: "FK_Produtos_Usuarios_CriadoPorUsuarioId",
                table: "Produtos");

            migrationBuilder.DropPrimaryKey(
                name: "PK_ProdutoPortes",
                table: "ProdutoPortes");

            migrationBuilder.DropPrimaryKey(
                name: "PK_ProdutoPorteOpcoes",
                table: "ProdutoPorteOpcoes");

            migrationBuilder.DropPrimaryKey(
                name: "PK_ProdutoFaixaEtariaOpcoes",
                table: "ProdutoFaixaEtariaOpcoes");

            migrationBuilder.DropPrimaryKey(
                name: "PK_ProdutoTipoOpcoes",
                table: "ProdutoTipoOpcoes");

            migrationBuilder.DropPrimaryKey(
                name: "PK_ProdutoEspecieOpcoes",
                table: "ProdutoEspecieOpcoes");

            migrationBuilder.DropPrimaryKey(
                name: "PK_Produtos",
                table: "Produtos");

            migrationBuilder.DropPrimaryKey(
                name: "PK_PedidoItens",
                table: "PedidoItens");

            migrationBuilder.DropPrimaryKey(
                name: "PK_Pedidos",
                table: "Pedidos");

            migrationBuilder.DropPrimaryKey(
                name: "PK_Usuarios",
                table: "Usuarios");

            migrationBuilder.Sql(@"ALTER TABLE \"Usuarios\" ALTER COLUMN \"Id\" TYPE uuid USING \"Id\"::uuid;");

            migrationBuilder.Sql(@"ALTER TABLE \"Pedidos\" ALTER COLUMN \"Id\" TYPE uuid USING \"Id\"::uuid;");
            migrationBuilder.Sql(@"ALTER TABLE \"Pedidos\" ALTER COLUMN \"UsuarioId\" TYPE uuid USING \"UsuarioId\"::uuid;");

            migrationBuilder.Sql(@"ALTER TABLE \"ProdutoEspecieOpcoes\" ALTER COLUMN \"Id\" TYPE uuid USING \"Id\"::uuid;");
            migrationBuilder.Sql(@"ALTER TABLE \"ProdutoTipoOpcoes\" ALTER COLUMN \"Id\" TYPE uuid USING \"Id\"::uuid;");
            migrationBuilder.Sql(@"ALTER TABLE \"ProdutoFaixaEtariaOpcoes\" ALTER COLUMN \"Id\" TYPE uuid USING \"Id\"::uuid;");
            migrationBuilder.Sql(@"ALTER TABLE \"ProdutoPorteOpcoes\" ALTER COLUMN \"Id\" TYPE uuid USING \"Id\"::uuid;");

            migrationBuilder.Sql(@"ALTER TABLE \"Produtos\" ALTER COLUMN \"Id\" TYPE uuid USING \"Id\"::uuid;");
            migrationBuilder.Sql(@"ALTER TABLE \"Produtos\" ALTER COLUMN \"EspecieOpcaoId\" TYPE uuid USING \"EspecieOpcaoId\"::uuid;");
            migrationBuilder.Sql(@"ALTER TABLE \"Produtos\" ALTER COLUMN \"TipoProdutoOpcaoId\" TYPE uuid USING \"TipoProdutoOpcaoId\"::uuid;");
            migrationBuilder.Sql(@"ALTER TABLE \"Produtos\" ALTER COLUMN \"FaixaEtariaOpcaoId\" TYPE uuid USING \"FaixaEtariaOpcaoId\"::uuid;");
            migrationBuilder.Sql(@"ALTER TABLE \"Produtos\" ALTER COLUMN \"CriadoPorUsuarioId\" TYPE uuid USING NULLIF(\"CriadoPorUsuarioId\", '')::uuid;");
            migrationBuilder.Sql(@"ALTER TABLE \"Produtos\" ALTER COLUMN \"AtualizadoPorUsuarioId\" TYPE uuid USING NULLIF(\"AtualizadoPorUsuarioId\", '')::uuid;");

            migrationBuilder.Sql(@"ALTER TABLE \"ProdutoPortes\" ALTER COLUMN \"ProdutoId\" TYPE uuid USING \"ProdutoId\"::uuid;");
            migrationBuilder.Sql(@"ALTER TABLE \"ProdutoPortes\" ALTER COLUMN \"PorteOpcaoId\" TYPE uuid USING \"PorteOpcaoId\"::uuid;");

            migrationBuilder.Sql(@"ALTER TABLE \"PedidoItens\" ALTER COLUMN \"Id\" TYPE uuid USING \"Id\"::uuid;");
            migrationBuilder.Sql(@"ALTER TABLE \"PedidoItens\" ALTER COLUMN \"PedidoId\" TYPE uuid USING \"PedidoId\"::uuid;");
            migrationBuilder.Sql(@"ALTER TABLE \"PedidoItens\" ALTER COLUMN \"ProdutoId\" TYPE uuid USING \"ProdutoId\"::uuid;");

            migrationBuilder.AddPrimaryKey(
                name: "PK_Usuarios",
                table: "Usuarios",
                column: "Id");

            migrationBuilder.AddPrimaryKey(
                name: "PK_Pedidos",
                table: "Pedidos",
                column: "Id");

            migrationBuilder.AddPrimaryKey(
                name: "PK_ProdutoEspecieOpcoes",
                table: "ProdutoEspecieOpcoes",
                column: "Id");

            migrationBuilder.AddPrimaryKey(
                name: "PK_ProdutoTipoOpcoes",
                table: "ProdutoTipoOpcoes",
                column: "Id");

            migrationBuilder.AddPrimaryKey(
                name: "PK_ProdutoFaixaEtariaOpcoes",
                table: "ProdutoFaixaEtariaOpcoes",
                column: "Id");

            migrationBuilder.AddPrimaryKey(
                name: "PK_ProdutoPorteOpcoes",
                table: "ProdutoPorteOpcoes",
                column: "Id");

            migrationBuilder.AddPrimaryKey(
                name: "PK_Produtos",
                table: "Produtos",
                column: "Id");

            migrationBuilder.AddPrimaryKey(
                name: "PK_PedidoItens",
                table: "PedidoItens",
                column: "Id");

            migrationBuilder.AddPrimaryKey(
                name: "PK_ProdutoPortes",
                table: "ProdutoPortes",
                columns: new[] { "ProdutoId", "PorteOpcaoId" });

            migrationBuilder.AddForeignKey(
                name: "FK_PedidoItens_Pedidos_PedidoId",
                table: "PedidoItens",
                column: "PedidoId",
                principalTable: "Pedidos",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_PedidoItens_Produtos_ProdutoId",
                table: "PedidoItens",
                column: "ProdutoId",
                principalTable: "Produtos",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Pedidos_Usuarios_UsuarioId",
                table: "Pedidos",
                column: "UsuarioId",
                principalTable: "Usuarios",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_ProdutoPortes_ProdutoPorteOpcoes_PorteOpcaoId",
                table: "ProdutoPortes",
                column: "PorteOpcaoId",
                principalTable: "ProdutoPorteOpcoes",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_ProdutoPortes_Produtos_ProdutoId",
                table: "ProdutoPortes",
                column: "ProdutoId",
                principalTable: "Produtos",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Produtos_ProdutoEspecieOpcoes_EspecieOpcaoId",
                table: "Produtos",
                column: "EspecieOpcaoId",
                principalTable: "ProdutoEspecieOpcoes",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Produtos_ProdutoFaixaEtariaOpcoes_FaixaEtariaOpcaoId",
                table: "Produtos",
                column: "FaixaEtariaOpcaoId",
                principalTable: "ProdutoFaixaEtariaOpcoes",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Produtos_ProdutoTipoProdutoOpcoes_TipoProdutoOpcaoId",
                table: "Produtos",
                column: "TipoProdutoOpcaoId",
                principalTable: "ProdutoTipoOpcoes",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

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
                name: "FK_PedidoItens_Pedidos_PedidoId",
                table: "PedidoItens");

            migrationBuilder.DropForeignKey(
                name: "FK_PedidoItens_Produtos_ProdutoId",
                table: "PedidoItens");

            migrationBuilder.DropForeignKey(
                name: "FK_Pedidos_Usuarios_UsuarioId",
                table: "Pedidos");

            migrationBuilder.DropForeignKey(
                name: "FK_ProdutoPortes_ProdutoPorteOpcoes_PorteOpcaoId",
                table: "ProdutoPortes");

            migrationBuilder.DropForeignKey(
                name: "FK_ProdutoPortes_Produtos_ProdutoId",
                table: "ProdutoPortes");

            migrationBuilder.DropForeignKey(
                name: "FK_Produtos_ProdutoEspecieOpcoes_EspecieOpcaoId",
                table: "Produtos");

            migrationBuilder.DropForeignKey(
                name: "FK_Produtos_ProdutoFaixaEtariaOpcoes_FaixaEtariaOpcaoId",
                table: "Produtos");

            migrationBuilder.DropForeignKey(
                name: "FK_Produtos_ProdutoTipoProdutoOpcoes_TipoProdutoOpcaoId",
                table: "Produtos");

            migrationBuilder.DropForeignKey(
                name: "FK_Produtos_Usuarios_AtualizadoPorUsuarioId",
                table: "Produtos");

            migrationBuilder.DropForeignKey(
                name: "FK_Produtos_Usuarios_CriadoPorUsuarioId",
                table: "Produtos");

            migrationBuilder.DropPrimaryKey(
                name: "PK_ProdutoPortes",
                table: "ProdutoPortes");

            migrationBuilder.DropPrimaryKey(
                name: "PK_ProdutoPorteOpcoes",
                table: "ProdutoPorteOpcoes");

            migrationBuilder.DropPrimaryKey(
                name: "PK_ProdutoFaixaEtariaOpcoes",
                table: "ProdutoFaixaEtariaOpcoes");

            migrationBuilder.DropPrimaryKey(
                name: "PK_ProdutoTipoOpcoes",
                table: "ProdutoTipoOpcoes");

            migrationBuilder.DropPrimaryKey(
                name: "PK_ProdutoEspecieOpcoes",
                table: "ProdutoEspecieOpcoes");

            migrationBuilder.DropPrimaryKey(
                name: "PK_Produtos",
                table: "Produtos");

            migrationBuilder.DropPrimaryKey(
                name: "PK_PedidoItens",
                table: "PedidoItens");

            migrationBuilder.DropPrimaryKey(
                name: "PK_Pedidos",
                table: "Pedidos");

            migrationBuilder.DropPrimaryKey(
                name: "PK_Usuarios",
                table: "Usuarios");

            migrationBuilder.Sql(@"ALTER TABLE \"PedidoItens\" ALTER COLUMN \"ProdutoId\" TYPE character varying(36) USING \"ProdutoId\"::text;");
            migrationBuilder.Sql(@"ALTER TABLE \"PedidoItens\" ALTER COLUMN \"PedidoId\" TYPE character varying(36) USING \"PedidoId\"::text;");
            migrationBuilder.Sql(@"ALTER TABLE \"PedidoItens\" ALTER COLUMN \"Id\" TYPE character varying(36) USING \"Id\"::text;");

            migrationBuilder.Sql(@"ALTER TABLE \"ProdutoPortes\" ALTER COLUMN \"PorteOpcaoId\" TYPE character varying(36) USING \"PorteOpcaoId\"::text;");
            migrationBuilder.Sql(@"ALTER TABLE \"ProdutoPortes\" ALTER COLUMN \"ProdutoId\" TYPE character varying(36) USING \"ProdutoId\"::text;");

            migrationBuilder.Sql(@"ALTER TABLE \"Produtos\" ALTER COLUMN \"AtualizadoPorUsuarioId\" TYPE character varying(36) USING \"AtualizadoPorUsuarioId\"::text;");
            migrationBuilder.Sql(@"ALTER TABLE \"Produtos\" ALTER COLUMN \"CriadoPorUsuarioId\" TYPE character varying(36) USING \"CriadoPorUsuarioId\"::text;");
            migrationBuilder.Sql(@"ALTER TABLE \"Produtos\" ALTER COLUMN \"FaixaEtariaOpcaoId\" TYPE character varying(36) USING \"FaixaEtariaOpcaoId\"::text;");
            migrationBuilder.Sql(@"ALTER TABLE \"Produtos\" ALTER COLUMN \"TipoProdutoOpcaoId\" TYPE character varying(36) USING \"TipoProdutoOpcaoId\"::text;");
            migrationBuilder.Sql(@"ALTER TABLE \"Produtos\" ALTER COLUMN \"EspecieOpcaoId\" TYPE character varying(36) USING \"EspecieOpcaoId\"::text;");
            migrationBuilder.Sql(@"ALTER TABLE \"Produtos\" ALTER COLUMN \"Id\" TYPE character varying(36) USING \"Id\"::text;");

            migrationBuilder.Sql(@"ALTER TABLE \"ProdutoPorteOpcoes\" ALTER COLUMN \"Id\" TYPE character varying(36) USING \"Id\"::text;");
            migrationBuilder.Sql(@"ALTER TABLE \"ProdutoFaixaEtariaOpcoes\" ALTER COLUMN \"Id\" TYPE character varying(36) USING \"Id\"::text;");
            migrationBuilder.Sql(@"ALTER TABLE \"ProdutoTipoOpcoes\" ALTER COLUMN \"Id\" TYPE character varying(36) USING \"Id\"::text;");
            migrationBuilder.Sql(@"ALTER TABLE \"ProdutoEspecieOpcoes\" ALTER COLUMN \"Id\" TYPE character varying(36) USING \"Id\"::text;");

            migrationBuilder.Sql(@"ALTER TABLE \"Pedidos\" ALTER COLUMN \"UsuarioId\" TYPE character varying(36) USING \"UsuarioId\"::text;");
            migrationBuilder.Sql(@"ALTER TABLE \"Pedidos\" ALTER COLUMN \"Id\" TYPE character varying(36) USING \"Id\"::text;");

            migrationBuilder.Sql(@"ALTER TABLE \"Usuarios\" ALTER COLUMN \"Id\" TYPE character varying(36) USING \"Id\"::text;");

            migrationBuilder.AddPrimaryKey(
                name: "PK_Usuarios",
                table: "Usuarios",
                column: "Id");

            migrationBuilder.AddPrimaryKey(
                name: "PK_Pedidos",
                table: "Pedidos",
                column: "Id");

            migrationBuilder.AddPrimaryKey(
                name: "PK_Produtos",
                table: "Produtos",
                column: "Id");

            migrationBuilder.AddPrimaryKey(
                name: "PK_ProdutoEspecieOpcoes",
                table: "ProdutoEspecieOpcoes",
                column: "Id");

            migrationBuilder.AddPrimaryKey(
                name: "PK_ProdutoTipoOpcoes",
                table: "ProdutoTipoOpcoes",
                column: "Id");

            migrationBuilder.AddPrimaryKey(
                name: "PK_ProdutoFaixaEtariaOpcoes",
                table: "ProdutoFaixaEtariaOpcoes",
                column: "Id");

            migrationBuilder.AddPrimaryKey(
                name: "PK_ProdutoPorteOpcoes",
                table: "ProdutoPorteOpcoes",
                column: "Id");

            migrationBuilder.AddPrimaryKey(
                name: "PK_PedidoItens",
                table: "PedidoItens",
                column: "Id");

            migrationBuilder.AddPrimaryKey(
                name: "PK_ProdutoPortes",
                table: "ProdutoPortes",
                columns: new[] { "ProdutoId", "PorteOpcaoId" });

            migrationBuilder.AddForeignKey(
                name: "FK_PedidoItens_Pedidos_PedidoId",
                table: "PedidoItens",
                column: "PedidoId",
                principalTable: "Pedidos",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_PedidoItens_Produtos_ProdutoId",
                table: "PedidoItens",
                column: "ProdutoId",
                principalTable: "Produtos",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Pedidos_Usuarios_UsuarioId",
                table: "Pedidos",
                column: "UsuarioId",
                principalTable: "Usuarios",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_ProdutoPortes_ProdutoPorteOpcoes_PorteOpcaoId",
                table: "ProdutoPortes",
                column: "PorteOpcaoId",
                principalTable: "ProdutoPorteOpcoes",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_ProdutoPortes_Produtos_ProdutoId",
                table: "ProdutoPortes",
                column: "ProdutoId",
                principalTable: "Produtos",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Produtos_ProdutoEspecieOpcoes_EspecieOpcaoId",
                table: "Produtos",
                column: "EspecieOpcaoId",
                principalTable: "ProdutoEspecieOpcoes",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Produtos_ProdutoFaixaEtariaOpcoes_FaixaEtariaOpcaoId",
                table: "Produtos",
                column: "FaixaEtariaOpcaoId",
                principalTable: "ProdutoFaixaEtariaOpcoes",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Produtos_ProdutoTipoProdutoOpcoes_TipoProdutoOpcaoId",
                table: "Produtos",
                column: "TipoProdutoOpcaoId",
                principalTable: "ProdutoTipoOpcoes",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

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
    }
}
