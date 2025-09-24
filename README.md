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

## 3) Conteinerização e deploy (Docker + Azure Container Registry)

### Backend (.NET 9)

1. Entre na pasta do backend e gere a imagem multi-stage otimizada para produção:

   ```bash
   cd backend
   docker build -t <registry>.azurecr.io/product-shop-api:1.0.0 .
   ```

2. Ao executar o container, informe as configurações obrigatórias via variáveis de ambiente:

   ```bash
   docker run -it --rm -p 8080:8080 \
     -e ConnectionStrings__Postgres="Host=<host>;Port=5432;Database=<db>;Username=<user>;Password=<password>" \
     -e Auth__TenantId="<tenant-guid>" \
     -e Auth__Audience="api://<api-app-id>" \
     -e Auth__ClientId="<api-client-id>" \
     -e Cors__Origins="https://app.suaempresa.com" \
     <registry>.azurecr.io/product-shop-api:1.0.0
   ```

   A aplicação escuta na porta `8080` dentro do container. Garanta que o serviço de banco de dados esteja acessível a partir do cluster/host que executará a imagem.

### Frontend (React + Vite)

1. Gere o build estático com Node.js e sirva com NGINX:

   ```bash
   cd frontend
   docker build -t <registry>.azurecr.io/product-shop-web:1.0.0 .
   ```

   Use `--build-arg VITE_API_BASE_URL="https://sua-api.azurewebsites.net"` caso precise sobrescrever a URL consumida pelo frontend no momento do build.

2. Para validar localmente:

   ```bash
   docker run -it --rm -p 8081:80 <registry>.azurecr.io/product-shop-web:1.0.0
   ```

   O NGINX já possui configuração para aplicações SPA (rota fallback para `index.html`) e um endpoint de health check em `/healthz`.

### Publicação no Azure Container Registry (ACR)

```bash
az login
az acr login --name <registry>

# Backend
docker push <registry>.azurecr.io/product-shop-api:1.0.0

# Frontend
docker push <registry>.azurecr.io/product-shop-web:1.0.0
```

Substitua `<registry>` pelo nome do ACR (sem o sufixo `.azurecr.io`). Depois do push você pode usar os repositórios diretamente em Web App for Containers, Azure Container Apps, AKS, etc., configurando as mesmas variáveis de ambiente utilizadas durante o teste local.
