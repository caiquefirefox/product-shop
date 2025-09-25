# Stage 1 - install dependencies
FROM node:20-alpine AS deps
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

# Stage 2 - build the production bundle
FROM node:20-alpine AS build
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run build

# Stage 3 - serve the static bundle with NGINX
FROM nginx:1.27-alpine AS runner

# Copy a custom nginx configuration tailored for single page applications
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy build artefacts
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s CMD wget --no-verbose --spider http://localhost/healthz || exit 1

CMD ["nginx", "-g", "daemon off;"]
