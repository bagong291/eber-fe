# Admin Eber - Deployment Guide

Panduan lengkap untuk deploy aplikasi Admin Eber ke berbagai environment.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Manual Deployment](#manual-deployment)
4. [Docker Deployment](#docker-deployment)
5. [Update/Redeploy](#updateredeploy)
6. [Rollback](#rollback)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Server Requirements

| Component | Minimum Version |
|-----------|-----------------|
| Node.js | 18.x or higher |
| NPM | 9.x or higher |
| Nginx | 1.18 or higher |
| Git | 2.x or higher |

### Development Machine

```bash
# Check versions
node -v    # v18.x.x or higher
npm -v     # 9.x.x or higher
git --version
```

---

## Environment Setup

### 1. Clone Repository

```bash
# SSH
 git clone git@github.com:username/admin-eber.git

# HTTPS
git clone https://github.com/username/admin-eber.git

# Masuk ke direktori
cd admin-eber
```

### 2. Configure Environment Variables

```bash
# Copy environment file
cp .env.example .env

# Edit .env sesuai environment
nano .env
```

**Production Environment:**
```env
VITE_API_URL=https://fish.ebergroup.com/api/v1
VITE_IMAGE_URL=https://fish.ebergroup.com
VITE_ENABLE_DELETE_ALL_PRODUCTS=false
```

**Staging Environment:**
```env
VITE_API_URL=https://staging.ebergroup.com/api/v1
VITE_IMAGE_URL=https://staging.ebergroup.com
VITE_ENABLE_DELETE_ALL_PRODUCTS=false
```

---

## Manual Deployment

### First Time Deployment

```bash
# 1. Clone repository (jika belum)
git clone <repository-url>
cd admin-eber

# 2. Install dependencies
npm install

# 3. Setup environment
cp .env.example .env
# Edit .env dengan konfigurasi production

# 4. Build application
npm run build

# 5. Copy dist ke web server
sudo cp -r dist/* /var/www/admin-eber/

# 6. Configure Nginx
sudo nano /etc/nginx/sites-available/admin-eber
```

**Nginx Configuration:**
```nginx
server {
    listen 80;
    server_name admin.ebergroup.com;
    
    root /var/www/admin-eber;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Enable gzip
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
    
    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/admin-eber /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### With HTTPS (SSL)

```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx

# Obtain SSL certificate
sudo certbot --nginx -d admin.ebergroup.com

# Auto-renewal test
sudo certbot renew --dry-run
```

---

## Docker Deployment

### Using Docker Compose (Recommended)

```bash
# 1. Clone repository
git clone <repository-url>
cd admin-eber

# 2. Setup environment
cp .env.example .env
# Edit .env

# 3. Build and run with docker-compose
docker-compose up -d --build

# 4. Check logs
docker-compose logs -f

# 5. Stop container
docker-compose down
```

**docker-compose.yml:**
```yaml
version: '3.8'

services:
  admin-eber:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: admin-eber
    ports:
      - "8080:80"
    restart: unless-stopped
    environment:
      - NODE_ENV=production
```

### Using Docker Only

```bash
# Build image
docker build -t admin-eber:latest .

# Run container
docker run -d \
  --name admin-eber \
  -p 8080:80 \
  --restart unless-stopped \
  admin-eber:latest

# Check running containers
docker ps

# View logs
docker logs -f admin-eber

# Stop container
docker stop admin-eber
docker rm admin-eber
```

### Push to Docker Registry

```bash
# Tag image
docker tag admin-eber:latest your-registry.com/admin-eber:v1.0.0

# Push to registry
docker push your-registry.com/admin-eber:v1.0.0

# Pull on server
docker pull your-registry.com/admin-eber:v1.0.0
```

---

## Update/Redeploy

### Manual Update

```bash
# 1. Navigate to project directory
cd /var/www/admin-eber

# 2. Pull latest changes
git pull origin main

# 3. Install dependencies (jika ada perubahan)
npm install

# 4. Rebuild application
npm run build

# 5. Copy new build
sudo rm -rf /var/www/admin-eber/*
sudo cp -r dist/* /var/www/admin-eber/

# 6. Restart Nginx (jika perlu)
sudo systemctl reload nginx
```

**One-liner Update Script:**
```bash
#!/bin/bash
# deploy.sh

cd /var/www/admin-eber || exit 1

echo "Pulling latest changes..."
git pull origin main

echo "Installing dependencies..."
npm install

echo "Building application..."
npm run build

echo "Deploying..."
sudo rm -rf /var/www/html/admin-eber/*
sudo cp -r dist/* /var/www/html/admin-eber/

echo "Restarting Nginx..."
sudo systemctl reload nginx

echo "Deployment complete!"
```

```bash
# Make executable and run
chmod +x deploy.sh
./deploy.sh
```

### Docker Update

```bash
# 1. Pull latest code
git pull origin main

# 2. Rebuild and restart
docker-compose down
docker-compose up -d --build

# 3. Clean up old images
docker image prune -f
```

### Using PM2 (for Node.js serve)

```bash
# Install PM2
npm install -g pm2

# Create ecosystem file
pm2 ecosystem

# Start with PM2
pm2 start ecosystem.config.js

# Save PM2 config
pm2 save
pm2 startup
```

**ecosystem.config.js:**
```javascript
module.exports = {
  apps: [{
    name: 'admin-eber',
    script: 'serve',
    args: '-s dist -l 8080',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production'
    }
  }]
};
```

---

## Rollback

### Git Rollback

```bash
# Check previous commits
git log --oneline -10

# Rollback to specific commit
git reset --hard <commit-hash>

# Or rollback 1 commit
git reset --hard HEAD~1

# Rebuild and redeploy
npm run build
sudo cp -r dist/* /var/www/admin-eber/
```

### Docker Rollback

```bash
# List previous images
docker images admin-eber

# Run previous version
docker stop admin-eber
docker rm admin-eber
docker run -d --name admin-eber -p 8080:80 admin-eber:<previous-tag>
```

### Backup Strategy

```bash
# Before deployment, backup current build
sudo cp -r /var/www/admin-eber /var/backups/admin-eber-$(date +%Y%m%d-%H%M%S)

# Quick rollback script
#!/bin/bash
BACKUP_DIR="/var/backups"
LATEST=$(ls -t $BACKUP_DIR | grep admin-eber | head -1)
sudo rm -rf /var/www/admin-eber/*
sudo cp -r $BACKUP_DIR/$LATEST/* /var/www/admin-eber/
sudo systemctl reload nginx
```

---

## CI/CD Pipeline (GitHub Actions)

**.github/workflows/deploy.yml:**
```yaml
name: Deploy to Production

on:
  push:
    branches: [ main ]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Build application
      run: npm run build
      env:
        VITE_API_URL: ${{ secrets.VITE_API_URL }}
        VITE_IMAGE_URL: ${{ secrets.VITE_IMAGE_URL }}
    
    - name: Deploy to server
      uses: appleboy/scp-action@master
      with:
        host: ${{ secrets.HOST }}
        username: ${{ secrets.USERNAME }}
        key: ${{ secrets.SSH_KEY }}
        source: "dist/"
        target: "/var/www/admin-eber"
        strip_components: 1
    
    - name: Restart Nginx
      uses: appleboy/ssh-action@master
      with:
        host: ${{ secrets.HOST }}
        username: ${{ secrets.USERNAME }}
        key: ${{ secrets.SSH_KEY }}
        script: |
          sudo systemctl reload nginx
```

---

## Troubleshooting

### Build Failures

```bash
# Clear cache
rm -rf node_modules
rm package-lock.json
npm cache clean --force

# Reinstall and build
npm install
npm run build
```

### 404 Errors After Refresh

Pastikan Nginx config memiliki:
```nginx
try_files $uri $uri/ /index.html;
```

### CORS Errors

Periksa konfigurasi CORS di backend API. Pastikan origin frontend diizinkan.

### Environment Variables Not Working

```bash
# Pastikan .env ada di root
cat .env

# Rebuild setelah mengubah .env
npm run build
```

### Docker Issues

```bash
# Remove all containers and images
docker-compose down
docker system prune -a

# Rebuild from scratch
docker-compose up -d --build
```

### Check Logs

```bash
# Nginx logs
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log

# Application logs (PM2)
pm2 logs admin-eber

# Docker logs
docker-compose logs -f
```

---

## Deployment Checklist

- [ ] Environment variables configured correctly
- [ ] API URL points to correct backend
- [ ] Build completes without errors
- [ ] All assets loaded correctly (check Network tab)
- [ ] Login functionality works
- [ ] All API calls successful
- [ ] SSL certificate valid (if using HTTPS)
- [ ] Mobile responsive works
- [ ] Backup created before deployment

---

## Quick Reference

| Command | Description |
|---------|-------------|
| `npm install` | Install dependencies |
| `npm run build` | Build for production |
| `npm run dev` | Start dev server |
| `git pull` | Pull latest changes |
| `docker-compose up -d` | Start with Docker |
| `docker-compose down` | Stop Docker containers |
| `sudo nginx -t` | Test Nginx config |
| `sudo systemctl reload nginx` | Reload Nginx |

---

## Environment URLs

| Environment | URL |
|-------------|-----|
| Development | http://localhost:8080 |
| Staging | https://staging-admin.ebergroup.com |
| Production | https://admin.ebergroup.com |
