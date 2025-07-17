#!/bin/bash

# BigBrains Form Creator Deployment Script
# This script pulls the latest changes from git and redeploys the application

set -e  # Exit on any error

# Configuration
APP_NAME="bb-windows-2"
REPO_DIR="/var/www/bb-windows-2"
NGINX_SITE="/etc/nginx/sites-available/bb-windows-2"
LOG_FILE="/var/log/bb-windows-2.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "$LOG_FILE"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$LOG_FILE"
}

# Check if running as root
check_root() {
    if [[ $EUID -ne 0 ]]; then
        error "This script must be run as root (use sudo)"
        exit 1
    fi
}



# Setup repository
setup_repository() {
    log "Setting up repository..."
    
    if [ ! -d "$REPO_DIR" ]; then
        log "Creating application directory..."
        mkdir -p "$REPO_DIR"
    fi
    
    cd "$REPO_DIR"
    
    # Check if it's a git repository
    if [ ! -d ".git" ]; then
        error "Not a git repository. Please initialize git first:"
        error "cd $REPO_DIR && git init && git remote add origin YOUR_REPO_URL"
        exit 1
    fi
    
    # Pull latest changes
    log "Pulling latest changes from git..."
    git fetch origin
    git reset --hard origin/main 2>/dev/null || git reset --hard origin/master 2>/dev/null || {
        error "Failed to pull from main/master branch"
        exit 1
    }
    
    success "Git pull completed"
}

# Detect deployment type
detect_deployment_type() {
    if [ -f "$REPO_DIR/package.json" ] && [ -f "$REPO_DIR/server.js" ]; then
        echo "nodejs"
    else
        echo "static"
    fi
}

# Deploy static files
deploy_static() {
    log "Deploying as static application..."
    
    # Set correct permissions
    chown -R www-data:www-data "$REPO_DIR"
    chmod -R 755 "$REPO_DIR"
    
    # Create Nginx configuration if it doesn't exist
    if [ ! -f "$NGINX_SITE" ]; then
        log "Creating Nginx configuration..."
        cat > "$NGINX_SITE" << EOF
server {
    listen 80;
    listen [::]:80;
    
    root $REPO_DIR;
    index index.html index.htm;
    
    server_name windows2.homeprosusa.org;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    
    location / {
        try_files \$uri \$uri/ =404;
    }
    
    # Static assets with long cache
    location ~* \.(css|js|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Security - deny access to sensitive files
    location ~ /\. {
        deny all;
    }
    
    location ~ /(package\.json|server\.js|deploy\.sh|\.git) {
        deny all;
    }
}
EOF
        success "Nginx configuration created"
    fi
    
    # Enable site and reload nginx
    ln -sf "$NGINX_SITE" /etc/nginx/sites-enabled/
    
    # Remove default site if it exists
    if [ -f "/etc/nginx/sites-enabled/default" ]; then
        rm -f /etc/nginx/sites-enabled/default
        log "Removed default Nginx site"
    fi
    
    # Test nginx configuration
    if nginx -t; then
        systemctl reload nginx
        success "Nginx reloaded successfully"
    else
        error "Nginx configuration test failed"
        exit 1
    fi
}

# Deploy Node.js application
deploy_nodejs() {
    log "Deploying as Node.js application..."
    
    cd "$REPO_DIR"
    
    # Install/update dependencies
    log "Installing Node.js dependencies..."
    npm install --production
    
    # Install PM2 if not installed
    if ! command -v pm2 &> /dev/null; then
        log "Installing PM2..."
        npm install -g pm2
    fi
    
    # Stop existing application
    pm2 stop "$APP_NAME" 2>/dev/null || true
    pm2 delete "$APP_NAME" 2>/dev/null || true
    
    # Start application with PM2
    log "Starting application with PM2..."
    pm2 start server.js --name "$APP_NAME"
    pm2 save
    
    # Setup PM2 startup if not already done
    pm2 startup systemd -u root --hp /root 2>/dev/null || true
    
    # Create Nginx reverse proxy configuration
    if [ ! -f "$NGINX_SITE" ]; then
        log "Creating Nginx reverse proxy configuration..."
        cat > "$NGINX_SITE" << EOF
server {
    listen 80;
    listen [::]:80;
    
    server_name windows2.homeprosusa.org;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_connect_timeout 30s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
    }
    
    # Health check endpoint
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
EOF
        success "Nginx reverse proxy configuration created"
    fi
    
    # Enable site and reload nginx
    ln -sf "$NGINX_SITE" /etc/nginx/sites-enabled/
    
    # Remove default site if it exists
    if [ -f "/etc/nginx/sites-enabled/default" ]; then
        rm -f /etc/nginx/sites-enabled/default
        log "Removed default Nginx site"
    fi
    
    # Test nginx configuration
    if nginx -t; then
        systemctl reload nginx
        success "Nginx reloaded successfully"
    else
        error "Nginx configuration test failed"
        exit 1
    fi
    
    # Set correct permissions
    chown -R www-data:www-data "$REPO_DIR"
    chmod -R 755 "$REPO_DIR"
    
    success "Node.js application deployed successfully"
}

# Check application status
check_status() {
    log "Checking application status..."
    
    # Check Nginx
    if systemctl is-active --quiet nginx; then
        success "Nginx is running"
    else
        error "Nginx is not running"
    fi
    
    # Check if it's a Node.js deployment
    if [ "$(detect_deployment_type)" = "nodejs" ]; then
        # Check PM2 process
        if pm2 describe "$APP_NAME" &>/dev/null; then
            success "PM2 process '$APP_NAME' is running"
            pm2 status "$APP_NAME"
        else
            error "PM2 process '$APP_NAME' is not running"
        fi
    fi
    
    # Test HTTP response
    if curl -s -o /dev/null -w "%{http_code}" http://localhost | grep -q "200"; then
        success "Application is responding (HTTP 200)"
    else
        warning "Application may not be responding correctly"
    fi
}



# Main deployment function
main() {
    log "Starting deployment process..."
    
    check_root
    setup_repository
    
    DEPLOYMENT_TYPE=$(detect_deployment_type)
    log "Detected deployment type: $DEPLOYMENT_TYPE"
    
    case $DEPLOYMENT_TYPE in
        "nodejs")
            deploy_nodejs
            ;;
        "static")
            deploy_static
            ;;
        *)
            error "Unknown deployment type"
            exit 1
            ;;
    esac
    
    check_status
    
    success "Deployment completed successfully!"
    log "Application should be available at: http://your-server-ip"
}

# Help function
show_help() {
    echo "BigBrains Form Creator Deployment Script"
    echo ""
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -h, --help     Show this help message"
    echo "  -s, --status   Check application status only"
    echo ""
    echo "Examples:"
    echo "  sudo $0                 # Full deployment"
    echo "  sudo $0 --status        # Check status"
}

# Parse command line arguments
case "${1:-}" in
    -h|--help)
        show_help
        exit 0
        ;;
    -s|--status)
        check_root
        check_status
        exit 0
        ;;
    "")
        main
        ;;
    *)
        error "Unknown option: $1"
        show_help
        exit 1
        ;;
esac 