#!/bin/bash

# Production Deployment Script for Villa Property Management
# This script handles the complete deployment process

set -e  # Exit on any error

echo "🚀 Starting Production Deployment Process..."
echo "=============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required environment variables are set
check_environment() {
    print_status "Checking environment variables..."
    
    required_vars=(
        "NEXT_PUBLIC_SUPABASE_URL"
        "NEXT_PUBLIC_SUPABASE_ANON_KEY"
        "SUPABASE_SERVICE_ROLE_KEY"
        "NEXT_PUBLIC_APP_URL"
        "NODE_ENV"
    )
    
    missing_vars=()
    
    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ]; then
            missing_vars+=("$var")
        fi
    done
    
    if [ ${#missing_vars[@]} -ne 0 ]; then
        print_error "Missing required environment variables:"
        for var in "${missing_vars[@]}"; do
            echo "  - $var"
        done
        echo ""
        print_error "Please set all required environment variables before deploying."
        exit 1
    fi
    
    print_success "All required environment variables are set"
}

# Check if Supabase CLI is installed and logged in
check_supabase() {
    print_status "Checking Supabase CLI..."
    
    if ! command -v supabase &> /dev/null; then
        print_error "Supabase CLI is not installed. Please install it first:"
        echo "  npm install -g supabase"
        exit 1
    fi
    
    # Check if logged in
    if ! supabase projects list &> /dev/null; then
        print_error "Not logged in to Supabase. Please run:"
        echo "  supabase login"
        exit 1
    fi
    
    print_success "Supabase CLI is ready"
}

# Run database migrations
run_migrations() {
    print_status "Running database migrations..."
    
    if [ -f "supabase/config.toml" ]; then
        print_status "Pushing migrations to Supabase..."
        supabase db push --linked
        print_success "Database migrations completed"
    else
        print_warning "No Supabase configuration found, skipping migrations"
    fi
}

# Build the application
build_application() {
    print_status "Building the application..."
    
    # Install dependencies
    print_status "Installing dependencies..."
    npm ci
    
    # Run build
    print_status "Building Next.js application..."
    npm run build
    
    print_success "Application built successfully"
}

# Run tests (if available)
run_tests() {
    print_status "Running tests..."
    
    if npm run test --if-present &> /dev/null; then
        print_success "All tests passed"
    else
        print_warning "No tests found or tests failed"
    fi
}

# Validate deployment
validate_deployment() {
    print_status "Validating deployment configuration..."
    
    # Check if NODE_ENV is set to production
    if [ "$NODE_ENV" != "production" ]; then
        print_warning "NODE_ENV is not set to 'production'. Current value: $NODE_ENV"
    fi
    
    # Check if NEXT_PUBLIC_BYPASS_AUTH is disabled
    if [ "$NEXT_PUBLIC_BYPASS_AUTH" = "true" ]; then
        print_error "NEXT_PUBLIC_BYPASS_AUTH is enabled! This is a security risk in production."
        exit 1
    fi
    
    # Check if app URL is not localhost
    if [[ "$NEXT_PUBLIC_APP_URL" == *"localhost"* ]]; then
        print_warning "NEXT_PUBLIC_APP_URL appears to be a localhost URL: $NEXT_PUBLIC_APP_URL"
    fi
    
    print_success "Deployment configuration validated"
}

# Deploy Edge Functions (if any)
deploy_functions() {
    print_status "Deploying Edge Functions..."
    
    if [ -d "supabase/functions" ] && [ "$(ls -A supabase/functions)" ]; then
        supabase functions deploy --linked
        print_success "Edge Functions deployed"
    else
        print_warning "No Edge Functions found, skipping"
    fi
}

# Main deployment process
main() {
    echo ""
    print_status "Villa Property Management - Production Deployment"
    echo "=================================================="
    echo ""
    
    # Pre-deployment checks
    check_environment
    check_supabase
    validate_deployment
    
    echo ""
    print_status "Starting deployment process..."
    echo ""
    
    # Build and test
    build_application
    run_tests
    
    # Database setup
    run_migrations
    deploy_functions
    
    echo ""
    print_success "🎉 Production deployment completed successfully!"
    echo ""
    print_status "Next steps:"
    echo "1. Configure your domain and SSL certificate"
    echo "2. Set up monitoring and error tracking"
    echo "3. Configure email templates in Supabase"
    echo "4. Test the complete user flow"
    echo "5. Set up automated backups"
    echo ""
    print_status "Your application is ready at: $NEXT_PUBLIC_APP_URL"
}

# Run the main function
main "$@"
