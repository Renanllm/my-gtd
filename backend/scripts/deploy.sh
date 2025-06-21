#!/bin/bash

# Deployment script for My GTD Backend
# Run this script on your VPS after following the initial setup steps

set -e  # Exit on any error

echo "🚀 Starting deployment of My GTD Backend..."

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
if [[ $EUID -eq 0 ]]; then
   print_error "This script should not be run as root. Please run as a regular user with sudo privileges."
   exit 1
fi

# Check if .env file exists
if [ ! -f .env ]; then
    print_error ".env file not found. Please create it first with your production configuration."
    exit 1
fi

print_status "Installing dependencies..."
npm install

print_status "Building the application..."
npm run build

print_status "Generating Prisma client..."
npx prisma generate

print_status "Running database migrations..."
npx prisma migrate deploy

print_status "Creating logs directory..."
mkdir -p logs

print_status "Starting application with PM2..."
pm2 start ecosystem.config.js --env production

print_status "Saving PM2 configuration..."
pm2 save

print_status "Setting up PM2 startup script..."
pm2 startup

print_status "Checking application status..."
pm2 status

print_status "Deployment completed successfully! 🎉"
print_status "Your application should now be running on port 3001"
print_status "Check the status with: pm2 status"
print_status "View logs with: pm2 logs my-gtd-backend"

# Optional: Check if Nginx is configured
if command -v nginx &> /dev/null; then
    print_status "Nginx is installed. Make sure to configure it as a reverse proxy."
    print_warning "Don't forget to set up SSL certificate with Let's Encrypt!"
else
    print_warning "Nginx is not installed. Consider installing it for production use."
fi

print_status "Next steps:"
echo "1. Configure Nginx reverse proxy (see DEPLOYMENT.md)"
echo "2. Set up SSL certificate with Let's Encrypt"
echo "3. Configure firewall rules"
echo "4. Set up database backups"
echo "5. Monitor your application logs" 