# Deployment Guide

This guide covers deployment options for the English Tutor Backend application.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Environment Configuration](#environment-configuration)
- [Database Setup](#database-setup)
- [Deployment Methods](#deployment-methods)
  - [Docker](#docker)
  - [Heroku](#heroku)
  - [AWS EC2](#aws-ec2)
  - [DigitalOcean](#digitalocean)
  - [Traditional VPS](#traditional-vps)
- [Process Management](#process-management)
- [Monitoring and Logging](#monitoring-and-logging)
- [SSL/HTTPS Setup](#sslhttps-setup)
- [Performance Optimization](#performance-optimization)
- [Backup Strategy](#backup-strategy)

## Prerequisites

- Node.js 18+ installed on server
- PostgreSQL 14+ database
- Domain name (optional but recommended)
- SSL certificate (for HTTPS)

## Environment Configuration

### Production Environment Variables

Create a `.env` file with the following variables:

```bash
# Application
NODE_ENV=production
PORT=8000
API_PREFIX=/api

# Database
DATABASE_URL=postgresql://username:password@host:5432/database_name?schema=public

# JWT - MUST BE CHANGED FROM DEFAULTS
JWT_ACCESS_SECRET=<generate-strong-random-secret-32-chars>
JWT_REFRESH_SECRET=<generate-different-strong-random-secret-32-chars>
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# Security
BCRYPT_ROUNDS=12
MAX_LOGIN_ATTEMPTS=5
ACCOUNT_LOCKOUT_DURATION=900000

# CORS - Your frontend URL
CORS_ORIGIN=https://yourdomain.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info
LOG_FILE=logs/app.log

# Agent Service (when ready)
AGENT_SERVICE_URL=https://agent.yourdomain.com
AGENT_SERVICE_TIMEOUT=30000
```

### Generate Strong Secrets

Use one of these methods to generate secure secrets:

```bash
# Method 1: OpenSSL
openssl rand -base64 32

# Method 2: Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Method 3: Python
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

## Database Setup

### Production Database

1. **Create PostgreSQL Database**

```sql
CREATE DATABASE english_tutor_prod;
CREATE USER english_tutor_user WITH ENCRYPTED PASSWORD 'your-secure-password';
GRANT ALL PRIVILEGES ON DATABASE english_tutor_prod TO english_tutor_user;
```

2. **Update Connection String**

```bash
DATABASE_URL=postgresql://english_tutor_user:your-secure-password@localhost:5432/english_tutor_prod
```

3. **Run Migrations**

```bash
npm run prisma:migrate:prod
```

4. **Verify Database**

```bash
npx prisma db pull
```

## Deployment Methods

### Docker

#### Dockerfile

Create `Dockerfile`:

```dockerfile
# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build TypeScript
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production

# Copy Prisma schema
COPY --from=builder /app/prisma ./prisma

# Generate Prisma client
RUN npx prisma generate

# Copy built application
COPY --from=builder /app/dist ./dist

# Create logs directory
RUN mkdir -p logs

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1); })"

# Start application
CMD ["npm", "start"]
```

#### docker-compose.yml

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:14-alpine
    environment:
      POSTGRES_DB: english_tutor_prod
      POSTGRES_USER: english_tutor_user
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    restart: unless-stopped

  backend:
    build: .
    ports:
      - "8000:8000"
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://english_tutor_user:${DB_PASSWORD}@postgres:5432/english_tutor_prod
      JWT_ACCESS_SECRET: ${JWT_ACCESS_SECRET}
      JWT_REFRESH_SECRET: ${JWT_REFRESH_SECRET}
      CORS_ORIGIN: ${CORS_ORIGIN}
    depends_on:
      - postgres
    restart: unless-stopped
    volumes:
      - ./logs:/app/logs

volumes:
  postgres_data:
```

#### Deploy with Docker

```bash
# Build image
docker build -t english-tutor-backend .

# Run container
docker run -d \
  --name english-tutor-backend \
  -p 8000:8000 \
  --env-file .env \
  english-tutor-backend

# Or use docker-compose
docker-compose up -d

# Run migrations
docker exec english-tutor-backend npx prisma migrate deploy

# View logs
docker logs -f english-tutor-backend
```

### Heroku

1. **Install Heroku CLI**

```bash
npm install -g heroku
heroku login
```

2. **Create Heroku App**

```bash
heroku create your-app-name
```

3. **Add PostgreSQL**

```bash
heroku addons:create heroku-postgresql:hobby-dev
```

4. **Set Environment Variables**

```bash
heroku config:set NODE_ENV=production
heroku config:set JWT_ACCESS_SECRET=your-secret
heroku config:set JWT_REFRESH_SECRET=your-secret
heroku config:set CORS_ORIGIN=https://yourfrontend.com
```

5. **Create Procfile**

```
web: npm start
release: npx prisma migrate deploy
```

6. **Deploy**

```bash
git push heroku main
```

7. **Scale**

```bash
heroku ps:scale web=1
```

### AWS EC2

1. **Launch EC2 Instance**
   - Choose Ubuntu 22.04 LTS
   - t2.small or larger
   - Configure security group (ports 22, 80, 443, 8000)

2. **Connect to Instance**

```bash
ssh -i your-key.pem ubuntu@your-ec2-ip
```

3. **Install Dependencies**

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Install PM2
sudo npm install -g pm2
```

4. **Setup PostgreSQL**

```bash
sudo -u postgres psql

CREATE DATABASE english_tutor_prod;
CREATE USER english_tutor_user WITH ENCRYPTED PASSWORD 'your-password';
GRANT ALL PRIVILEGES ON DATABASE english_tutor_prod TO english_tutor_user;
\q
```

5. **Deploy Application**

```bash
# Clone repository
git clone your-repo-url
cd english-tutor

# Install dependencies
npm ci --only=production

# Set up environment
cp .env.example .env
nano .env  # Edit with production values

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Build application
npm run build

# Start with PM2
pm2 start dist/server.js --name english-tutor-backend
pm2 startup
pm2 save
```

6. **Setup Nginx Reverse Proxy**

```bash
sudo apt install -y nginx

sudo nano /etc/nginx/sites-available/english-tutor
```

```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/english-tutor /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### DigitalOcean

1. **Create Droplet**
   - Ubuntu 22.04
   - Basic plan ($6/month or higher)
   - Add SSH key

2. **Follow AWS EC2 steps 2-6**

3. **Use DigitalOcean App Platform (Alternative)**

```yaml
# .do/app.yaml
name: english-tutor-backend
services:
  - name: api
    github:
      repo: your-username/english-tutor
      branch: main
    build_command: npm ci && npx prisma generate && npm run build
    run_command: npx prisma migrate deploy && npm start
    environment_slug: node-js
    instance_size_slug: basic-xxs
    instance_count: 1
    http_port: 8000
    envs:
      - key: NODE_ENV
        value: production
      - key: DATABASE_URL
        value: ${db.DATABASE_URL}
      - key: JWT_ACCESS_SECRET
        scope: RUN_AND_BUILD_TIME
        type: SECRET
      - key: JWT_REFRESH_SECRET
        scope: RUN_AND_BUILD_TIME
        type: SECRET

databases:
  - name: db
    engine: PG
    version: "14"
```

### Traditional VPS

1. **Prepare Server**

```bash
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Install build tools
sudo apt install -y build-essential
```

2. **Create Application User**

```bash
sudo adduser --disabled-password english-tutor
sudo su - english-tutor
```

3. **Deploy Application**

```bash
git clone your-repo-url
cd english-tutor
npm ci --only=production
npx prisma generate
npm run build
```

4. **Create Systemd Service**

```bash
sudo nano /etc/systemd/system/english-tutor.service
```

```ini
[Unit]
Description=English Tutor Backend
After=network.target postgresql.service

[Service]
Type=simple
User=english-tutor
WorkingDirectory=/home/english-tutor/english-tutor
ExecStart=/usr/bin/npm start
Restart=on-failure
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable english-tutor
sudo systemctl start english-tutor
sudo systemctl status english-tutor
```

## Process Management

### PM2

```bash
# Start application
pm2 start dist/server.js --name english-tutor-backend

# Monitor
pm2 monit

# View logs
pm2 logs english-tutor-backend

# Restart
pm2 restart english-tutor-backend

# Stop
pm2 stop english-tutor-backend

# Auto-start on reboot
pm2 startup
pm2 save
```

### PM2 Ecosystem File

Create `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'english-tutor-backend',
    script: './dist/server.js',
    instances: 2,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
    },
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    max_memory_restart: '500M',
  }],
};
```

```bash
pm2 start ecosystem.config.js
```

## Monitoring and Logging

### Application Logs

Logs are written to:
- `logs/app.log` - All logs
- `logs/error.log` - Error logs only

### Log Rotation

Install logrotate:

```bash
sudo nano /etc/logrotate.d/english-tutor
```

```
/home/english-tutor/english-tutor/logs/*.log {
    daily
    rotate 14
    compress
    delaycompress
    missingok
    notifempty
    create 0644 english-tutor english-tutor
    sharedscripts
    postrotate
        pm2 reloadLogs
    endscript
}
```

### Monitoring with PM2 Plus

```bash
pm2 link <secret> <public>
```

## SSL/HTTPS Setup

### Using Let's Encrypt (Certbot)

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d api.yourdomain.com

# Auto-renewal
sudo certbot renew --dry-run
```

### Nginx SSL Configuration

```nginx
server {
    listen 443 ssl http2;
    server_name api.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/api.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.yourdomain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    location / {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

server {
    listen 80;
    server_name api.yourdomain.com;
    return 301 https://$server_name$request_uri;
}
```

## Performance Optimization

### 1. Enable Gzip in Nginx

```nginx
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types text/plain text/css application/json application/javascript;
```

### 2. Database Connection Pooling

Already configured in Prisma (default pool size: 10 connections)

### 3. Enable Node.js Clustering

Use PM2 cluster mode:

```bash
pm2 start dist/server.js -i max --name english-tutor-backend
```

### 4. Add Redis for Session Storage (Optional)

Install Redis:
```bash
sudo apt install -y redis-server
```

## Backup Strategy

### Database Backups

#### Automated Daily Backups

Create backup script:

```bash
#!/bin/bash
# backup.sh

BACKUP_DIR="/home/english-tutor/backups"
DATE=$(date +%Y%m%d_%H%M%S)
FILENAME="english_tutor_backup_$DATE.sql"

mkdir -p $BACKUP_DIR

pg_dump -U english_tutor_user english_tutor_prod > $BACKUP_DIR/$FILENAME

# Compress backup
gzip $BACKUP_DIR/$FILENAME

# Keep only last 30 days
find $BACKUP_DIR -name "*.gz" -mtime +30 -delete

echo "Backup completed: $FILENAME.gz"
```

Add to crontab:

```bash
crontab -e

# Daily backup at 2 AM
0 2 * * * /home/english-tutor/backup.sh
```

#### Restore from Backup

```bash
gunzip backup_file.sql.gz
psql -U english_tutor_user english_tutor_prod < backup_file.sql
```

## Troubleshooting

### Check Application Logs

```bash
# PM2
pm2 logs

# Systemd
sudo journalctl -u english-tutor -f

# Direct logs
tail -f logs/app.log
tail -f logs/error.log
```

### Check Database Connection

```bash
psql -U english_tutor_user -d english_tutor_prod -h localhost
```

### Check Port Availability

```bash
sudo netstat -tlnp | grep :8000
```

### Restart Services

```bash
# Application
pm2 restart english-tutor-backend

# Nginx
sudo systemctl restart nginx

# PostgreSQL
sudo systemctl restart postgresql
```

## Security Checklist

- [ ] Strong JWT secrets set
- [ ] Database password changed from default
- [ ] Firewall configured (UFW)
- [ ] HTTPS enabled
- [ ] Environment variables secured
- [ ] Database backups configured
- [ ] Rate limiting enabled
- [ ] CORS properly configured
- [ ] Regular security updates
- [ ] Monitoring in place

## Post-Deployment

1. **Test Health Endpoint**
   ```bash
   curl https://api.yourdomain.com/health
   ```

2. **Test API Endpoints**
   ```bash
   curl -X POST https://api.yourdomain.com/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"Test123!","name":"Test"}'
   ```

3. **Monitor Logs**
   ```bash
   pm2 logs --lines 100
   ```

4. **Check Performance**
   ```bash
   pm2 monit
   ```

## Support

For deployment issues, check:
- Application logs
- Database logs
- Nginx logs
- System logs

Contact support or open an issue on the repository.
