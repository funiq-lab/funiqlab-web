#!/bin/bash

# FuniqLab Nginx Configuration Deployment Script
# This script deploys nginx configurations for all FuniqLab domains

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

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

# Configuration files mapping
declare -A CONFIG_FILES=(
    ["funiqlab.com"]="nginx-main-site.conf"
    ["draw-yourself.funiqlab.com"]="nginx-draw-yourself.conf" 
    ["api.draw-yourself.funiqlab.com"]="nginx-api.conf"
)

# Function to deploy a single config
deploy_config() {
    local domain=$1
    local config_file=$2
    local source_path="scripts/$config_file"
    local dest_path="/etc/nginx/sites-available/$domain"
    local enabled_path="/etc/nginx/sites-enabled/$domain"
    
    log_info "Deploying $domain configuration..."
    
    # Check if source file exists
    if [ ! -f "$source_path" ]; then
        log_warning "Configuration file not found: $source_path"
        return 1
    fi
    
    # Copy configuration
    sudo cp "$source_path" "$dest_path"
    log_success "Configuration copied to $dest_path"
    
    # Enable site if not already enabled
    if [ ! -f "$enabled_path" ]; then
        sudo ln -s "$dest_path" "$enabled_path"
        log_success "Site enabled: $domain"
    else
        log_info "Site already enabled: $domain"
    fi
    
    return 0
}

# Function to check SSL certificates
check_ssl_certificates() {
    log_info "Checking SSL certificates..."
    
    local domains=("www.funiqlab.com" "draw-yourself.funiqlab.com" "api.draw-yourself.funiqlab.com")
    local missing_certs=()
    
    for domain in "${domains[@]}"; do
        if [ ! -f "/etc/letsencrypt/live/$domain/fullchain.pem" ]; then
            missing_certs+=("$domain")
        fi
    done
    
    if [ ${#missing_certs[@]} -gt 0 ]; then
        log_warning "Missing SSL certificates for: ${missing_certs[*]}"
        log_info "Generate certificates with:"
        for domain in "${missing_certs[@]}"; do
            echo "  sudo certbot certonly --nginx -d $domain"
        done
        echo ""
        log_info "Or disable HTTPS temporarily by commenting out SSL lines in config files"
        return 1
    else
        log_success "All SSL certificates found"
        return 0
    fi
}

# Function to remove default nginx site
remove_default_site() {
    if [ -f "/etc/nginx/sites-enabled/default" ]; then
        log_info "Removing default nginx site..."
        sudo rm -f "/etc/nginx/sites-enabled/default"
        log_success "Default site removed"
    fi
}

# Main deployment function
main() {
    echo "🚀 FuniqLab Nginx Configuration Deployment"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    case "${1:-deploy}" in
        "deploy")
            log_info "Deploying all nginx configurations..."
            
            # Deploy each configuration
            local failed_configs=()
            for domain in "${!CONFIG_FILES[@]}"; do
                if ! deploy_config "$domain" "${CONFIG_FILES[$domain]}"; then
                    failed_configs+=("$domain")
                fi
            done
            
            # Remove default site
            remove_default_site
            
            # Check SSL certificates
            check_ssl_certificates
            ssl_check_result=$?
            
            # Test nginx configuration
            log_info "Testing nginx configuration..."
            if sudo nginx -t; then
                log_success "Nginx configuration test passed"
                
                # Reload nginx
                log_info "Reloading nginx..."
                sudo systemctl reload nginx
                log_success "Nginx reloaded successfully"
                
                echo ""
                echo "📋 Deployment Summary:"
                echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
                for domain in "${!CONFIG_FILES[@]}"; do
                    if [[ " ${failed_configs[*]} " != *" $domain "* ]]; then
                        echo "✅ $domain - Deployed successfully"
                    else
                        echo "❌ $domain - Deployment failed"
                    fi
                done
                
                echo ""
                if [ $ssl_check_result -eq 0 ]; then
                    echo "🌐 All sites should be accessible via HTTPS"
                else
                    echo "⚠️  Some SSL certificates are missing - sites may not work on HTTPS"
                fi
                
                echo ""
                echo "📊 Service Status:"
                echo "  • Main website: https://www.funiqlab.com"
                echo "  • Draw Yourself: https://draw-yourself.funiqlab.com (→ :8000)"
                echo "  • API Service: https://api.draw-yourself.funiqlab.com (→ :5001)"
                
            else
                log_error "Nginx configuration test failed!"
                echo ""
                echo "🔧 To debug:"
                echo "  sudo nginx -t"
                echo "  sudo tail -f /var/log/nginx/error.log"
                exit 1
            fi
            ;;
            
        "status")
            echo "📊 Current Nginx Configuration Status"
            echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
            
            for domain in "${!CONFIG_FILES[@]}"; do
                local enabled_path="/etc/nginx/sites-enabled/$domain"
                if [ -f "$enabled_path" ]; then
                    echo "✅ $domain - Enabled"
                else
                    echo "❌ $domain - Not enabled"
                fi
            done
            
            echo ""
            echo "🔒 SSL Certificate Status:"
            local domains=("www.funiqlab.com" "draw-yourself.funiqlab.com" "api.draw-yourself.funiqlab.com")
            for domain in "${domains[@]}"; do
                if [ -f "/etc/letsencrypt/live/$domain/fullchain.pem" ]; then
                    echo "✅ $domain - Certificate exists"
                else
                    echo "❌ $domain - Certificate missing"
                fi
            done
            ;;
            
        "test")
            log_info "Testing nginx configuration..."
            sudo nginx -t
            ;;
            
        "reload")
            log_info "Reloading nginx..."
            sudo nginx -t && sudo systemctl reload nginx
            log_success "Nginx reloaded"
            ;;
            
        *)
            echo "Usage: $0 [deploy|status|test|reload]"
            echo ""
            echo "Commands:"
            echo "  deploy  - Deploy all nginx configurations (default)"
            echo "  status  - Show current configuration status"
            echo "  test    - Test nginx configuration"
            echo "  reload  - Reload nginx service"
            exit 1
            ;;
    esac
}

main "$@"
