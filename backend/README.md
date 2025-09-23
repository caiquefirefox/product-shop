# PremieRpet Shop - Backend (.NET 9)
1) Configure `appsettings.json` com seu Postgres, TenantId e Audience (api://...).  
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
