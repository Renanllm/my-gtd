#!/bin/bash

# VPS Setup script for My GTD Backend
# Run this script as root on a fresh VPS

set -e  # Exit on any error

echo "🔧 Setting up VPS for My GTD Backend..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   print_error "This script must be run as root"
   exit 1
fi

print_status "Updating system packages..."
apt update && apt upgrade -y

print_status "Installing Node.js 18.x..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt-get install -y nodejs

print_status "Installing PostgreSQL..."
apt install postgresql postgresql-contrib -y

print_status "Installing PM2..."
npm install -g pm2

print_status "Installing Nginx..."
apt install nginx -y

print_status "Installing Git..."
apt install git -y

print_status "Installing UFW firewall..."
apt install ufw -y

print_status "Installing Certbot for SSL..."
apt install certbot python3-certbot-nginx -y

print_status "Installing additional utilities..."
apt install htop curl wget nano -y

print_status "Configuring PostgreSQL..."
# Create database and user
sudo -u postgres psql -c "CREATE DATABASE my_gtd;"
sudo -u postgres psql -c "CREATE USER my_gtd_user WITH ENCRYPTED PASSWORD 'your_secure_password';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE my_gtd TO my_gtd_user;"

# Enable PostgreSQL to start on boot
systemctl enable postgresql
systemctl start postgresql

print_status "Configuring firewall..."
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 80
ufw allow 443
ufw allow 3001
ufw --force enable

print_status "Creating application directory..."
mkdir -p /var/www/my-gtd-backend
chown -R $SUDO_USER:$SUDO_USER /var/www/my-gtd-backend

print_status "Setting up Nginx..."
# Remove default site
rm -f /etc/nginx/sites-enabled/default

# Create Nginx configuration
cat > /etc/nginx/sites-available/my-gtd-backend << 'EOF'
server {
    listen 80;
    server_name _;

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
EOF

# Enable the site
ln -sf /etc/nginx/sites-available/my-gtd-backend /etc/nginx/sites-enabled/

# Test and restart Nginx
nginx -t
systemctl restart nginx
systemctl enable nginx

print_status "Creating backup directory..."
mkdir -p /var/backups/postgresql
chown postgres:postgres /var/backups/postgresql

print_status "Setting up database backup script..."
cat > /root/backup-db.sh << 'EOF'
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
EOF

chmod +x /root/backup-db.sh

# Add backup to crontab
(crontab -l 2>/dev/null; echo "0 2 * * * /root/backup-db.sh") | crontab -

print_status "VPS setup completed successfully! 🎉"

print_status "Verifying installations..."
echo "Node.js version: $(node --version)"
echo "npm version: $(npm --version)"
echo "PostgreSQL version: $(psql --version)"
echo "Nginx version: $(nginx -v 2>&1)"

print_warning "IMPORTANT: Please change the PostgreSQL password!"
print_warning "Run: sudo -u postgres psql -c \"ALTER USER my_gtd_user WITH PASSWORD 'your_new_secure_password';\""

print_status "Next steps:"
echo "1. Clone your repository to /var/www/my-gtd-backend"
echo "2. Create .env file with your production configuration"
echo "3. Run the deploy.sh script"
echo "4. Set up SSL certificate with Let's Encrypt"
echo "5. Update your domain DNS to point to this VPS"

print_status "Useful commands:"
echo "- Check services: systemctl status postgresql nginx"
echo "- View logs: journalctl -u nginx -f"
echo "- Check firewall: ufw status"
echo "- Monitor resources: htop" 