# SPJ AI Dashboard Deployment Script for Windows PowerShell
# This script automates the deployment process to AWS

param(
    [string]$AWSRegion = "us-east-1",
    [string]$EC2IP = "",
    [string]$RDSEndpoint = "",
    [string]$S3Bucket = "",
    [string]$DBPassword = "",
    [string]$JWTSecret = "",
    [string]$KeyFile = ""
)

# Function to print colored output
function Write-Status {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

# Check if required tools are installed
function Test-Prerequisites {
    Write-Status "Checking prerequisites..."
    
    if (-not (Get-Command aws -ErrorAction SilentlyContinue)) {
        Write-Error "AWS CLI is not installed. Please install it first."
        exit 1
    }
    
    if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
        Write-Error "Docker is not installed. Please install it first."
        exit 1
    }
    
    if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
        Write-Error "Git is not installed. Please install it first."
        exit 1
    }
    
    Write-Status "All prerequisites are installed ✅"
}

# Get user input for deployment configuration
function Get-DeploymentConfig {
    Write-Host ""
    Write-Status "Please provide the following information for deployment:"
    
    if (-not $AWSRegion) {
        $script:AWSRegion = Read-Host "AWS Region (default: us-east-1)"
        if (-not $script:AWSRegion) { $script:AWSRegion = "us-east-1" }
    }
    
    if (-not $EC2IP) {
        $script:EC2IP = Read-Host "EC2 Instance IP"
        if (-not $script:EC2IP) {
            Write-Error "EC2 Instance IP is required"
            exit 1
        }
    }
    
    if (-not $RDSEndpoint) {
        $script:RDSEndpoint = Read-Host "RDS Endpoint"
        if (-not $script:RDSEndpoint) {
            Write-Error "RDS Endpoint is required"
            exit 1
        }
    }
    
    if (-not $S3Bucket) {
        $script:S3Bucket = Read-Host "S3 Bucket Name"
        if (-not $script:S3Bucket) {
            Write-Error "S3 Bucket Name is required"
            exit 1
        }
    }
    
    if (-not $DBPassword) {
        $script:DBPassword = Read-Host "Database Password" -AsSecureString
        $script:DBPassword = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($script:DBPassword))
        if (-not $script:DBPassword) {
            Write-Error "Database Password is required"
            exit 1
        }
    }
    
    if (-not $JWTSecret) {
        $script:JWTSecret = Read-Host "JWT Secret"
        if (-not $script:JWTSecret) {
            Write-Error "JWT Secret is required"
            exit 1
        }
    }
    
    if (-not $KeyFile) {
        $script:KeyFile = Read-Host "EC2 Key File Path"
        if (-not $script:KeyFile) {
            Write-Error "EC2 Key File Path is required"
            exit 1
        }
    }
}

# Build and deploy frontend
function Deploy-Frontend {
    Write-Status "Building and deploying frontend..."
    
    Set-Location frontend
    
    # Install dependencies
    Write-Status "Installing frontend dependencies..."
    npm install
    
    # Build for production
    Write-Status "Building frontend for production..."
    npm run build
    
    # Deploy to S3
    Write-Status "Deploying frontend to S3..."
    aws s3 sync build/ "s3://$S3Bucket" --delete
    
    Write-Status "Frontend deployed successfully ✅"
    Set-Location ..
}

# Deploy backend
function Deploy-Backend {
    Write-Status "Deploying backend to EC2..."
    
    # Create deployment package
    Write-Status "Creating backend deployment package..."
    Compress-Archive -Path "backend\*" -DestinationPath "backend-deployment.zip" -Force
    
    # Copy to EC2
    Write-Status "Copying backend to EC2..."
    scp -i "$KeyFile" backend-deployment.zip "ec2-user@$EC2IP`:~/"
    
    # Deploy on EC2
    Write-Status "Deploying backend on EC2..."
    $deployScript = @"
# Extract deployment package
unzip -o backend-deployment.zip -d backend
cd backend

# Create production environment file
cat > .env << EOL
NODE_ENV=production
PORT=3000
DB_HOST=$RDSEndpoint
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=$DBPassword
JWT_SECRET=$JWTSecret
FRONTEND_URL=https://$S3Bucket.s3-website-$AWSRegion.amazonaws.com
EOL

# Install dependencies
npm install

# Run database migrations
node scripts/migrate.js

# Start the application
npm start
"@
    
    ssh -i "$KeyFile" "ec2-user@$EC2IP" $deployScript
    
    Write-Status "Backend deployed successfully ✅"
}

# Test deployment
function Test-Deployment {
    Write-Status "Testing deployment..."
    
    # Test backend health
    Write-Status "Testing backend health endpoint..."
    try {
        $response = Invoke-WebRequest -Uri "http://$EC2IP`:3000/api/health" -UseBasicParsing
        if ($response.StatusCode -eq 200) {
            Write-Status "Backend health check passed ✅"
        }
    }
    catch {
        Write-Warning "Backend health check failed. Please check the logs."
    }
    
    # Test frontend
    Write-Status "Frontend should be available at: https://$S3Bucket.s3-website-$AWSRegion.amazonaws.com"
}

# Main deployment function
function Main {
    Write-Host "=========================================="
    Write-Host "  SPJ AI Dashboard AWS Deployment"
    Write-Host "=========================================="
    Write-Host ""
    
    Test-Prerequisites
    Get-DeploymentConfig
    
    Write-Host ""
    Write-Status "Starting deployment with the following configuration:"
    Write-Host "  AWS Region: $AWSRegion"
    Write-Host "  EC2 IP: $EC2IP"
    Write-Host "  RDS Endpoint: $RDSEndpoint"
    Write-Host "  S3 Bucket: $S3Bucket"
    Write-Host ""
    
    $confirm = Read-Host "Do you want to continue with the deployment? (y/N)"
    if ($confirm -notmatch "^[yY]$") {
        Write-Status "Deployment cancelled."
        exit 0
    }
    
    Deploy-Frontend
    Deploy-Backend
    Test-Deployment
    
    Write-Host ""
    Write-Status "🎉 Deployment completed successfully!"
    Write-Host ""
    Write-Status "Your dashboard is now available at:"
    Write-Host "  Frontend: https://$S3Bucket.s3-website-$AWSRegion.amazonaws.com"
    Write-Host "  Backend API: http://$EC2IP`:3000/api"
    Write-Host ""
    Write-Warning "Don't forget to:"
    Write-Host "  1. Update security groups if needed"
    Write-Host "  2. Set up monitoring and alerts"
    Write-Host "  3. Configure SSL certificates"
    Write-Host "  4. Set up automated backups"
}

# Run main function
Main
