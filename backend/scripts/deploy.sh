#!/bin/bash

# Mini-Kojo Backend Deployment Script
# This script deploys the backend to a VPS

set -e  # Exit on any error

echo "🚀 Starting Mini-Kojo Backend Deployment..."

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

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    print_error "Docker is not running. Please start Docker first."
    exit 1
fi

# Check if .env file exists
if [ ! -f .env ]; then
    print_warning ".env file not found. Creating from env.production..."
    cp env.production .env
    print_warning "Please edit .env file with your actual values before continuing."
    exit 1
fi

# Stop existing containers
print_status "Stopping existing containers..."
docker compose down --remove-orphans

# Build and start services
print_status "Building and starting services..."
docker compose up -d --build

# Wait for services to be ready
print_status "Waiting for services to be ready..."
sleep 10

# Check if backend is healthy
print_status "Checking backend health..."
for i in {1..30}; do
    if curl -f http://localhost:3001/health > /dev/null 2>&1; then
        print_status "Backend is healthy! ✅"
        break
    fi
    if [ $i -eq 30 ]; then
        print_error "Backend health check failed after 30 attempts"
        docker compose logs backend
        exit 1
    fi
    sleep 2
done

# Run database migrations (if needed)
print_status "Running database migrations..."
docker compose exec backend npx prisma migrate deploy || print_warning "Migration failed or not needed"

# Show running containers
print_status "Deployment completed! 🎉"
echo ""
echo "📊 Container Status:"
docker compose ps
echo ""
echo "🌐 Your API is now available at:"
echo "   - Local: http://localhost:3001"
echo "   - External: http://YOUR_VPS_IP:3001"
echo ""
echo "📋 Useful commands:"
echo "   - View logs: docker compose logs -f"
echo "   - Stop services: docker compose down"
echo "   - Restart services: docker compose restart"
echo "   - Update deployment: ./deploy.sh" 