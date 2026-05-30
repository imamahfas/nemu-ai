# Step 1: Use a lightweight nginx image
FROM nginx:alpine

# Step 2: Copy the static built dist files to nginx html directory
COPY dist /usr/share/nginx/html

# Step 3: Copy custom nginx config to support React routing (SPA fallback) and Cloud Run Port 8080 binding
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Step 4: Expose port 8080 (standard for Cloud Run)
EXPOSE 8080

# Step 5: Start Nginx
CMD ["nginx", "-g", "daemon off;"]
