#!/bin/bash

# SPJ AI Dashboard Deployment Script
# This script automates the deployment process to AWS

set -e

echo "🚀 Starting SPJ AI Dashboard Deployment to AWS..."

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

# Check if required tools are installed
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    if ! command -v aws &> /dev/null; then
        print_error "AWS CLI is not installed. Please install it first."
        exit 1
    fi
    
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install it first."
        exit 1
    fi
    
    if ! command -v git &> /dev/null; then
        print_error "Git is not installed. Please install it first."
        exit 1
    fi
    
    print_status "All prerequisites are installed ✅"
}

# Get user input for deployment configuration
get_deployment_config() {
    echo ""
    print_status "Please provide the following information for deployment:"
    
    read -p "AWS Region (default: us-east-1): " AWS_REGION
    AWS_REGION=${AWS_REGION:-us-east-1}
    
    read -p "EC2 Instance IP: " EC2_IP
    if [ -z "$EC2_IP" ]; then
        print_error "EC2 Instance IP is required"
        exit 1
    fi
    
    read -p "RDS Endpoint: " RDS_ENDPOINT
    if [ -z "$RDS_ENDPOINT" ]; then
        print_error "RDS Endpoint is required"
        exit 1
    fi
    
    read -p "S3 Bucket Name: " S3_BUCKET
    if [ -z "$S3_BUCKET" ]; then
        print_error "S3 Bucket Name is required"
        exit 1
    fi
    
    read -p "Database Password: " DB_PASSWORD
    if [ -z "$DB_PASSWORD" ]; then
        print_error "Database Password is required"
        exit 1
    fi
    
    read -p "JWT Secret: " JWT_SECRET
    if [ -z "$JWT_SECRET" ]; then
        print_error "JWT Secret is required"
        exit 1
    fi
    
    read -p "EC2 Key File Path: " KEY_FILE
    if [ -z "$KEY_FILE" ]; then
        print_error "EC2 Key File Path is required"
        exit 1
    fi
}

# Build and deploy frontend
deploy_frontend() {
    print_status "Building and deploying frontend..."
    
    cd frontend
    
    # Install dependencies
    print_status "Installing frontend dependencies..."
    npm install
    
    # Build for production
    print_status "Building frontend for production..."
    npm run build
    
    # Deploy to S3
    print_status "Deploying frontend to S3..."
    aws s3 sync build/ s3://$S3_BUCKET --delete
    
    print_status "Frontend deployed successfully ✅"
    cd ..
}

# Deploy backend
deploy_backend() {
    print_status "Deploying backend to EC2..."
    
    # Create deployment package
    print_status "Creating backend deployment package..."
    tar -czf backend-deployment.tar.gz backend/
    
    # Copy to EC2
    print_status "Copying backend to EC2..."
    scp -i "$KEY_FILE" backend-deployment.tar.gz ec2-user@$EC2_IP:~/
    
    # Deploy on EC2
    print_status "Deploying backend on EC2..."
    ssh -i "$KEY_FILE" ec2-user@$EC2_IP << EOF
        # Extract deployment package
        tar -xzf backend-deployment.tar.gz
        cd backend
        
        # Create production environment file
        cat > .env << EOL
NODE_ENV=production
PORT=3000
DB_HOST=$RDS_ENDPOINT
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=$DB_PASSWORD
JWT_SECRET=$JWT_SECRET
FRONTEND_URL=https://$S3_BUCKET.s3-website-$AWS_REGION.amazonaws.com
EOL
        
        # Install dependencies
        npm install
        
        # Run database migrations
        node scripts/migrate.js
        
        # Start the application
        npm start
EOF
    
    print_status "Backend deployed successfully ✅"
}

# Test deployment
test_deployment() {
    print_status "Testing deployment..."
    
    # Test backend health
    print_status "Testing backend health endpoint..."
    if curl -f http://$EC2_IP:3000/api/health; then
        print_status "Backend health check passed ✅"
    else
        print_warning "Backend health check failed. Please check the logs."
    fi
    
    # Test frontend
    print_status "Frontend should be available at: https://$S3_BUCKET.s3-website-$AWS_REGION.amazonaws.com"
}

# Main deployment function
main() {
    echo "=========================================="
    echo "  SPJ AI Dashboard AWS Deployment"
    echo "=========================================="
    echo ""
    
    check_prerequisites
    get_deployment_config
    
    echo ""
    print_status "Starting deployment with the following configuration:"
    echo "  AWS Region: $AWS_REGION"
    echo "  EC2 IP: $EC2_IP"
    echo "  RDS Endpoint: $RDS_ENDPOINT"
    echo "  S3 Bucket: $S3_BUCKET"
    echo ""
    
    read -p "Do you want to continue with the deployment? (y/N): " confirm
    if [[ $confirm != [yY] ]]; then
        print_status "Deployment cancelled."
        exit 0
    fi
    
    deploy_frontend
    deploy_backend
    test_deployment
    
    echo ""
    print_status "🎉 Deployment completed successfully!"
    echo ""
    print_status "Your dashboard is now available at:"
    echo "  Frontend: https://$S3_BUCKET.s3-website-$AWS_REGION.amazonaws.com"
    echo "  Backend API: http://$EC2_IP:3000/api"
    echo ""
    print_warning "Don't forget to:"
    echo "  1. Update security groups if needed"
    echo "  2. Set up monitoring and alerts"
    echo "  3. Configure SSL certificates"
    echo "  4. Set up automated backups"
}

# Run main function
main "$@"
