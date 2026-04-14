# Silk Way Cargo24 Deployment Guide

This guide describes production deployment on Ubuntu VPS with Nginx, PM2, and PostgreSQL.

## 1. Install packages on server

```bash
sudo apt update
sudo apt install -y nginx postgresql postgresql-contrib curl git
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pm2
```

## 2. Prepare project files

```bash
sudo mkdir -p /var/www
sudo chown -R $USER:$USER /var/www
git clone <YOUR_REPO_URL> /var/www/silkway
cd /var/www/silkway/backend
npm install
```

## 3. Create PostgreSQL database

```bash
sudo -u postgres psql
```

Run in `psql`:

```sql
CREATE USER silkway_user WITH PASSWORD 'CHANGE_ME_STRONG_PASSWORD';
CREATE DATABASE silkway_db OWNER silkway_user;
GRANT ALL PRIVILEGES ON DATABASE silkway_db TO silkway_user;
\q
```

## 4. Configure backend env

```bash
cd /var/www/silkway/backend
cp .env.example .env
```

Set values in `/var/www/silkway/backend/.env`:

```env
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_USER=silkway_user
DB_PASSWORD=CHANGE_ME_STRONG_PASSWORD
DB_NAME=silkway_db
ADMIN_API_KEY=CHANGE_ME_ADMIN_KEY
```

## 5. Run SQL init

```bash
psql -h localhost -U silkway_user -d silkway_db -f /var/www/silkway/backend/sql/init.sql
```

## 6. Start backend with PM2

```bash
cd /var/www/silkway/backend
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup
```

## 7. Configure Nginx

Use config from `deploy/nginx/silkway.conf`:

```bash
sudo cp /var/www/silkway/deploy/nginx/silkway.conf /etc/nginx/sites-available/silkway
sudo ln -s /etc/nginx/sites-available/silkway /etc/nginx/sites-enabled/silkway
sudo nginx -t
sudo systemctl reload nginx
```

## 8. Switch frontend config to production

Local development uses `frontend/js/config.js` with `http://localhost:3000`.
Before production deployment, replace it with production config:

```bash
cp /var/www/silkway/frontend/js/config.prod.js /var/www/silkway/frontend/js/config.js
```

## 9. Enable HTTPS

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d silkwaycargo24.kz -d www.silkwaycargo24.kz
```

## 10. Post-deploy verification

```bash
curl http://127.0.0.1:3000/api/health
curl https://silkwaycargo24.kz/robots.txt
curl https://silkwaycargo24.kz/sitemap.xml
```

Expected:
- `/api/health` returns `{"ok":true}`
- `robots.txt` and `sitemap.xml` are accessible

## 11. Update release

```bash
cd /var/www/silkway
git pull
cd backend
npm install
pm2 restart silkway-backend
```

If `frontend/js/config.js` was changed during local work, re-apply production config:

```bash
cp /var/www/silkway/frontend/js/config.prod.js /var/www/silkway/frontend/js/config.js
```
