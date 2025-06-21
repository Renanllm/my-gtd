# Deployment Guide: Hostinger VPS

This guide will help you deploy your Node.js/Express backend with PostgreSQL to a Hostinger VPS.

## Prerequisites

1. **Hostinger VPS Account**: You'll need a VPS plan (KVM 1 or higher recommended)
2. **Domain Name**: Optional but recommended for production
3. **SSH Access**: To connect to your VPS
4. **Basic Linux Knowledge**: Familiarity with command line operations

## Step 1: Connect to Your VPS

### Using SSH (Recommended)
```bash
ssh root@your-vps-ip-address
```

### Using Hostinger Browser Terminal
1. Log into your Hostinger account
2. Go to VPS → Overview
3. Click on "Terminal" button

## Step 2: Update System and Install Dependencies

```bash
# Update system packages
apt update && apt upgrade -y

# Install Node.js 18.x (LTS)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt-get install -y nodejs

# Install PostgreSQL
apt install postgresql postgresql-contrib -y

# Install PM2 for process management
npm install -g pm2

# Install Nginx for reverse proxy
apt install nginx -y

# Install Git
apt install git -y

# Verify installations
node --version
npm --version
psql --version
```

## Step 3: Configure PostgreSQL

```bash
# Switch to postgres user
sudo -u postgres psql

# Create database and user
CREATE DATABASE my_gtd;
CREATE USER my_gtd_user WITH ENCRYPTED PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE my_gtd TO my_gtd_user;
\q

# Enable PostgreSQL to start on boot
systemctl enable postgresql
systemctl start postgresql
```

## Step 4: Set Up Application Directory

```bash
# Create application directory
mkdir -p /var/www/my-gtd-backend
cd /var/www/my-gtd-backend

# Clone your repository (replace with your actual repo URL)
git clone https://github.com/yourusername/mini-kojo.git .

# Or upload files manually using SCP/SFTP
```

## Step 5: Configure Environment Variables

```bash
# Create .env file
nano .env
```

Add the following content (adjust values as needed):

```env
# Server Configuration
PORT=3001
NODE_ENV=production

# Database Configuration
DATABASE_URL="postgresql://my_gtd_user:your_secure_password@localhost:5432/my_gtd"

# JWT Configuration
JWT_SECRET=your-super-secure-jwt-secret-key-here
JWT_EXPIRES_IN=24h

# CORS Configuration
CORS_ORIGIN=https://yourdomain.com

# Security
NODE_ENV=production
```

## Step 6: Install Dependencies and Build

```bash
# Navigate to backend directory
cd /var/www/my-gtd-backend/backend

# Install dependencies
npm install

# Build the application
npm run build

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate deploy
```

## Step 7: Configure PM2 for Process Management

```bash
# Create PM2 ecosystem file
nano ecosystem.config.js
```

Add the following content:

```javascript
module.exports = {
  apps: [{
    name: 'my-gtd-backend',
    script: 'dist/server.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
```

```bash
# Create logs directory
mkdir logs

# Start the application with PM2
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Set PM2 to start on boot
pm2 startup
```

## Step 8: Configure Nginx as Reverse Proxy

```bash
# Create Nginx configuration
nano /etc/nginx/sites-available/my-gtd-backend
```

Add the following content:

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Redirect HTTP to HTTPS (uncomment after SSL setup)
    # return 301 https://$server_name$request_uri;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
}
```

```bash
# Enable the site
ln -s /etc/nginx/sites-available/my-gtd-backend /etc/nginx/sites-enabled/

# Remove default site (optional)
rm /etc/nginx/sites-enabled/default

# Test Nginx configuration
nginx -t

# Restart Nginx
systemctl restart nginx
systemctl enable nginx
```

## Step 9: Configure Firewall

```bash
# Install UFW if not already installed
apt install ufw -y

# Configure firewall
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 80
ufw allow 443
ufw allow 3001

# Enable firewall
ufw enable
```

## Step 10: Set Up SSL Certificate (Optional but Recommended)

### Using Let's Encrypt (Free)
```bash
# Install Certbot
apt install certbot python3-certbot-nginx -y

# Obtain SSL certificate
certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Set up auto-renewal
crontab -e
# Add this line: 0 12 * * * /usr/bin/certbot renew --quiet
```

## Step 11: Monitoring and Logs

### PM2 Commands
```bash
# View application status
pm2 status

# View logs
pm2 logs my-gtd-backend

# Restart application
pm2 restart my-gtd-backend

# Stop application
pm2 stop my-gtd-backend

# Delete application from PM2
pm2 delete my-gtd-backend
```

### Nginx Logs
```bash
# Access logs
tail -f /var/log/nginx/access.log

# Error logs
tail -f /var/log/nginx/error.log
```

## Step 12: Database Backup Setup

```bash
# Create backup script
nano /root/backup-db.sh
```

Add the following content:

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/postgresql"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="my_gtd"

mkdir -p $BACKUP_DIR

# Create backup
sudo -u postgres pg_dump $DB_NAME > $BACKUP_DIR/${DB_NAME}_${DATE}.sql

# Keep only last 7 days of backups
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete

echo "Database backup completed: ${DB_NAME}_${DATE}.sql"
```

```bash
# Make script executable
chmod +x /root/backup-db.sh

# Add to crontab for daily backups
crontab -e
# Add this line: 0 2 * * * /root/backup-db.sh
```

## Troubleshooting

### Common Issues

1. **Port 3001 not accessible**
   - Check if application is running: `pm2 status`
   - Check firewall: `ufw status`
   - Check Nginx: `systemctl status nginx`

2. **Database connection issues**
   - Verify PostgreSQL is running: `systemctl status postgresql`
   - Check database credentials in `.env`
   - Test connection: `psql -h localhost -U my_gtd_user -d my_gtd`

3. **Permission issues**
   - Ensure proper file permissions: `chown -R www-data:www-data /var/www/my-gtd-backend`
   - Check log files for specific errors

### Useful Commands

```bash
# Check system resources
htop

# Check disk space
df -h

# Check memory usage
free -h

# Check running processes
ps aux | grep node

# Check open ports
netstat -tlnp
```

## Security Recommendations

1. **Change default SSH port** (optional but recommended)
2. **Use SSH keys instead of passwords**
3. **Regularly update system packages**
4. **Monitor logs for suspicious activity**
5. **Set up fail2ban for additional security**
6. **Regular database backups**
7. **Use strong passwords and JWT secrets**

## Performance Optimization

1. **Enable Nginx gzip compression**
2. **Set up Redis for session storage** (if needed)
3. **Configure database connection pooling**
4. **Set up CDN for static assets**
5. **Monitor and optimize database queries**

## Maintenance

### Regular Tasks
- Update system packages: `apt update && apt upgrade`
- Update Node.js dependencies: `npm update`
- Check and rotate logs
- Monitor disk space and memory usage
- Test database backups

### Update Application
```bash
cd /var/www/my-gtd-backend/backend
git pull origin main
npm install
npm run build
npx prisma migrate deploy
pm2 restart my-gtd-backend
```

This deployment guide should get your backend running on Hostinger VPS. Make sure to replace placeholder values (like `yourdomain.com`, `your_secure_password`, etc.) with your actual values. 