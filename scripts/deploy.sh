#!/bin/bash

# FuniqLab Web - Manual Deployment Script
# Usage: ./scripts/deploy.sh [production|staging]

set -e  # Exit on any error

# Configuration
PROJECT_NAME="funiqlab-web"
BUILD_DIR="dist"
BACKUP_DIR="/var/www/backup"
TARGET_DIR="/var/www/funiqlab-web"
WEB_USER="www-data"
NGINX_CONFIG="/etc/nginx/sites-available/funiqlab.com"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

check_requirements() {
    log_info "Checking requirements..."
    
    # Check if we're running as root or with sudo
    if [[ $EUID -eq 0 ]]; then
        log_warning "Running as root. Consider using sudo for specific commands only."
    fi
    
    # Check if build directory exists
    if [ ! -d "$BUILD_DIR" ]; then
        log_error "Build directory '$BUILD_DIR' not found. Please run 'pnpm build' first."
        exit 1
    fi
    
    # Check if target directory exists
    if [ ! -d "$TARGET_DIR" ]; then
        log_info "Creating target directory: $TARGET_DIR"
        sudo mkdir -p "$TARGET_DIR"
    fi
    
    log_success "Requirements check passed"
}

create_backup() {
    log_info "Creating backup..."
    
    # Create backup directory if it doesn't exist
    sudo mkdir -p "$BACKUP_DIR"
    
    # Create backup with timestamp
    BACKUP_NAME="$PROJECT_NAME-$(date +%Y%m%d-%H%M%S)"
    
    if [ -d "$TARGET_DIR" ] && [ "$(ls -A $TARGET_DIR)" ]; then
        sudo cp -r "$TARGET_DIR" "$BACKUP_DIR/$BACKUP_NAME"
        log_success "Backup created: $BACKUP_DIR/$BACKUP_NAME"
        
        # Keep only last 5 backups
        sudo find "$BACKUP_DIR" -name "$PROJECT_NAME-*" -type d | sort -r | tail -n +6 | sudo xargs rm -rf
        log_info "Cleaned old backups (kept last 5)"
    else
        log_info "No existing files to backup"
    fi
}

deploy_files() {
    log_info "Deploying files to $TARGET_DIR..."
    
    # Clear target directory
    sudo rm -rf "$TARGET_DIR"/*
    
    # Copy new files
    sudo cp -r "$BUILD_DIR"/* "$TARGET_DIR"/
    
    # Set correct ownership and permissions
    sudo chown -R "$WEB_USER:$WEB_USER" "$TARGET_DIR"
    sudo chmod -R 644 "$TARGET_DIR"
    sudo find "$TARGET_DIR" -type d -exec chmod 755 {} \;
    
    log_success "Files deployed successfully"
}

reload_web_server() {
    log_info "Reloading Nginx web server..."
    
    # Check if nginx is available
    if command -v nginx > /dev/null; then
        if sudo nginx -t; then
            sudo systemctl reload nginx
            log_success "Nginx reloaded successfully"
        else
            log_error "Nginx configuration test failed"
            return 1
        fi
    else
        log_error "Nginx not found! Please install nginx first."
        return 1
    fi
}

validate_deployment() {
    log_info "Validating deployment..."
    
    # Check if key files exist
    if [ -f "$TARGET_DIR/index.html" ]; then
        log_success "index.html found"
    else
        log_error "index.html not found in deployment"
        return 1
    fi
    
    if [ -f "$TARGET_DIR/site.webmanifest" ]; then
        log_success "site.webmanifest found"
    else
        log_warning "site.webmanifest not found"
    fi
    
    # Check permissions
    OWNER=$(stat -c '%U:%G' "$TARGET_DIR" 2>/dev/null || stat -f '%Su:%Sg' "$TARGET_DIR")
    if [[ "$OWNER" == "$WEB_USER:$WEB_USER" ]]; then
        log_success "Correct ownership set ($OWNER)"
    else
        log_warning "Ownership might be incorrect: $OWNER (expected: $WEB_USER:$WEB_USER)"
    fi
}

rollback() {
    log_warning "Rolling back to previous version..."
    
    LATEST_BACKUP=$(sudo find "$BACKUP_DIR" -name "$PROJECT_NAME-*" -type d | sort -r | head -n 1)
    
    if [ -n "$LATEST_BACKUP" ] && [ -d "$LATEST_BACKUP" ]; then
        sudo rm -rf "$TARGET_DIR"/*
        sudo cp -r "$LATEST_BACKUP"/* "$TARGET_DIR"/
        sudo chown -R "$WEB_USER:$WEB_USER" "$TARGET_DIR"
        reload_web_server
        log_success "Rollback completed to: $(basename $LATEST_BACKUP)"
    else
        log_error "No backup found for rollback"
        exit 1
    fi
}

show_status() {
    log_info "Deployment Status:"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "📁 Target Directory: $TARGET_DIR"
    echo "🌐 Website: https://www.funiqlab.com"
    echo "📊 Files: $(sudo find $TARGET_DIR -type f | wc -l) files"
    echo "💾 Size: $(sudo du -sh $TARGET_DIR | cut -f1)"
    echo "⏰ Last Modified: $(sudo stat -c '%y' $TARGET_DIR 2>/dev/null || sudo stat -f '%Sm' $TARGET_DIR)"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
}

main() {
    echo "🚀 FuniqLab Web Deployment Script"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    case "${1:-deploy}" in
        "deploy")
            check_requirements
            create_backup
            deploy_files
            reload_web_server
            validate_deployment
            show_status
            log_success "🎉 Deployment completed successfully!"
            ;;
        "rollback")
            rollback
            show_status
            ;;
        "status")
            show_status
            ;;
        "validate")
            validate_deployment
            ;;
        *)
            echo "Usage: $0 [deploy|rollback|status|validate]"
            echo ""
            echo "Commands:"
            echo "  deploy    - Deploy latest build (default)"
            echo "  rollback  - Rollback to previous version"
            echo "  status    - Show deployment status"
            echo "  validate  - Validate current deployment"
            exit 1
            ;;
    esac
}

main "$@"
