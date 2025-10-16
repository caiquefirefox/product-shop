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

   * **TenantId** – o identificador (GUID) do diretório Azure Entra onde sua aplicação está registrada. Você pode obtê-lo no portal, em *Azure Active Directory > Visão Geral > ID do locatário*.
   * **ClientId** – o identificador da aplicação (também conhecido como *Application (client) ID*) da API que expõe o escopo usado pelo frontend. Ele é exibido na página de registro da sua aplicação no Azure Entra.
   * **ClientSecret** – o segredo de cliente gerado em *Certificados e Segredos* para a mesma aplicação acima. A API usa esse segredo para adquirir tokens de aplicativo ao chamar a Microsoft Graph.
   * **EnterpriseAppObjectId** – o *Object ID* da Enterprise Application (aplicativo corporativo) que representa a instância da sua API no locatário. Esse valor aparece em *Aplicativos empresariais > (seu aplicativo) > Visão Geral*.
   * **RoleIds.Admin / RoleIds.Colaborador** – os identificadores (GUID) das app roles configuradas no registro da aplicação (ex.: `Admin`, `Colaborador`). Cada chave dentro de `RoleIds` deve apontar para o App Role ID correspondente, permitindo que o backend saiba qual role atribuir ou remover via Microsoft Graph.

   > **Permissões necessárias no Microsoft Graph**
   >
  > Para consultar usuários por e-mail e gerenciar app roles pelo serviço `EntraIdRoleService`, o registro da aplicação **precisa** ter as permissões de aplicativo **Microsoft Graph > AppRoleAssignment.ReadWrite.All** e **Microsoft Graph > User.Read.All**, ambas com **consentimento de administrador** concedido. Sem isso, o Graph retorna `Authorization_RequestDenied` (HTTP 403) informando "Insufficient privileges to complete the operation".
   >
   > Passo a passo no portal:
   > 1. Abra o registro da aplicação que representa a API (`App registrations`).
   > 2. Em **API Permissions**, clique em **Add a permission** > **Microsoft Graph** > **Application permissions**.
  > 3. Marque **AppRoleAssignment.ReadWrite.All** e **User.Read.All**, depois clique em **Add permissions**.
  > 4. De volta à tela de permissões, clique em **Grant admin consent** para o tenant.
  > 5. Em **Enterprise applications > (sua API) > Permissions**, confirme que ambas as permissões aparecem como *Granted*. Se necessário, clique em **Grant admin consent** novamente.
  > 6. Aguarde alguns minutos para a propagação antes de chamar novamente a API.
   >
   > Além disso, certifique-se de que a Enterprise Application correspondente permita atribuições de usuários e que o usuário administrativo possua autorização para gerenciar essas atribuições.

   > **Como diagnosticar `Authorization_RequestDenied`**
   >
   > 1. Confira se o `ClientId` usado em `AzureEntra` pertence ao **mesmo** registro de aplicação onde você adicionou a permissão.
  > 2. Na tela **API permissions**, verifique se a coluna *Status* mostra `Granted for <tenant>` para **AppRoleAssignment.ReadWrite.All** e **User.Read.All**. Se não mostrar, clique novamente em **Grant admin consent**.
  > 3. Vá em **Enterprise applications > (sua API) > Permissions** e confirme que ambas as permissões aparecem como concedidas. Caso o portal indique que o consentimento ainda não foi aplicado, utilize o botão **Grant admin consent** ou execute `az ad app permission admin-consent --id <client-id>` com uma conta administradora.
  > 4. Depois do consentimento, aguarde alguns minutos e tente chamar a API novamente. A propagação pode levar alguns instantes.

## Sincronização de usuários com o Microsoft Entra ID

- A tabela `Usuarios` mantém o `MicrosoftId` (GUID da conta no Entra ID) como identificador principal e agora também persiste o `Email` normalizado informado na interface administrativa.
- Ao cadastrar ou atualizar um usuário pela API, informe o e-mail corporativo; o serviço consulta o Microsoft Graph para resolver o `MicrosoftId`, atribui as roles configuradas e salva os dois campos na base.
- Registros antigos que possuam apenas o `MicrosoftId` terão o `Email` preenchido automaticamente assim que o usuário acessar a aplicação ou for atualizado pelo painel administrativo.
- A tela de administração lista o e-mail e o MicrosoftId de cada usuário para facilitar a conferência com a Enterprise Application do Entra ID.

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
