# PremieRpet Shop - Backend (.NET 9)
1) Configure `appsettings.json` com seu Postgres, TenantId, Audience (api://...), credenciais do Azure Entra ID e as chaves de armazenamento:
   ```json
   "AzureStorage": {
     "ConnectionString": "<connection-string-do-blob>",
     "ProdutosContainer": "produtos"
   },
   "AzureEntra": {
     "TenantId": "<tenant-id>",
     "ClientId": "<client-id-da-api>",
     "ClientSecret": "<client-secret-da-api>",
     "EnterpriseAppObjectId": "<object-id-da-enterprise-application>",
     "RoleIds": {
       "Admin": "<app-role-id-admin>",
       "Colaborador": "<app-role-id-colaborador>"
     }
   }
   ```
2) Rode as migrations (após adicionar EF Tools):  
```
dotnet tool install --global dotnet-ef
cd backend/PremieRpet.Shop.Api
dotnet ef migrations add Initial --project ../PremieRpet.Shop.Infrastructure --startup-project .
dotnet ef database update --project ../PremieRpet.Shop.Infrastructure --startup-project .
```
3) Execute a API:
```
dotnet run --project backend/PremieRpet.Shop.Api
```

## Variáveis de ambiente importantes

A janela de edição de pedidos e as regras de criação podem ser configuradas via variáveis de ambiente (ou chaves equivalentes em `appsettings.json`):

| Variável | Descrição | Valor padrão |
| --- | --- | --- |
| `Pedidos__EditWindowOpeningDay` | Dia do mês que inicia a janela de edição de pedidos. | `15` |
| `Pedidos__EditWindowClosingDay` | Dia do mês que encerra a janela de edição de pedidos. | `20` |
| `Pedidos__MaxOrdersPerUserPerMonth` | Quantidade máxima de pedidos por usuário no mês (0 desativa o limite). | `1` |
| `Pedidos__InitialStatusId` | Status inicial do pedido (`1` = Solicitado, `2` = Aprovado). | `1` |
