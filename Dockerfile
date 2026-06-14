# Stage 1: Build React app inside Docker (ensures fresh build every deploy)
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files and install dependencies
COPY package.json package-lock.json ./
RUN npm ci --legacy-peer-deps

# Copy source code and build args
COPY . .

# Build production bundle
RUN npm run build

# Stage 2: Serve with lightweight nginx
FROM nginx:alpine

# Copy built files from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom nginx config (SPA fallback + Cloud Run port 8080)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 8080 (required for Cloud Run)
EXPOSE 8080

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
