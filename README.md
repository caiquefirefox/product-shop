# PremieRpet Shop – Fullstack (.NET 9 + React + Azure AD + PostgreSQL)

## 1) Backend
- Configure `backend/PremieRpet.Shop.Api/appsettings.json` (`Postgres`, `Auth:TenantId`, `Auth:Audience`).
- Rodar migrações (ver `backend/README.md`).
- Executar API: `dotnet run --project backend/PremieRpet.Shop.Api`

## 2) Frontend
```
cd frontend/webapp
npm i
cp .env.example .env
# preencha as variáveis VITE_*
npm run dev
```
Acesse `http://localhost:5173`.