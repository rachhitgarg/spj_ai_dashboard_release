# AWS Cloud Deployment Guide for SPJ AI Dashboard

This guide will walk you through deploying your modern React + Node.js dashboard to AWS Cloud using free tier services.

## Prerequisites

1. **AWS Account**: Sign up for AWS Free Tier at [aws.amazon.com](https://aws.amazon.com)
2. **AWS CLI**: Install AWS CLI on your local machine
3. **Docker**: Ensure Docker is installed and running
4. **Git**: For version control

## Step 1: Prepare Your Application

### 1.1 Initialize Git Repository
```bash
cd spj-ai-dashboard-modern
git init
git add .
git commit -m "Initial commit: SPJ AI Dashboard"
```

### 1.2 Create .gitignore
```bash
echo "node_modules/
.env
.env.local
.env.production
dist/
build/
*.log
.DS_Store
.vscode/
.idea/" > .gitignore
```

## Step 2: Set Up AWS Services

### 2.1 Create AWS Account and Configure CLI
1. Go to [AWS Console](https://console.aws.amazon.com)
2. Create a new account (Free Tier eligible)
3. Install AWS CLI: `pip install awscli`
4. Configure AWS CLI: `aws configure`
   - Enter your Access Key ID
   - Enter your Secret Access Key
   - Choose region: `us-east-1` (recommended for free tier)
   - Output format: `json`

### 2.2 Create IAM User (Recommended)
1. Go to IAM → Users → Create User
2. User name: `spj-dashboard-deploy`
3. Attach policies: `AmazonEC2FullAccess`, `AmazonRDSFullAccess`, `AmazonS3FullAccess`
4. Create access keys and download credentials

## Step 3: Deploy Database (Amazon RDS)

### 3.1 Create PostgreSQL Database
1. Go to RDS → Create Database
2. Choose: PostgreSQL
3. Template: Free tier
4. DB instance identifier: `spj-dashboard-db`
5. Master username: `postgres`
6. Master password: `YourSecurePassword123!`
7. DB instance class: `db.t3.micro` (free tier)
8. Storage: 20 GB (free tier)
9. VPC: Default VPC
10. Public access: Yes
11. Security group: Create new
12. Create database

### 3.2 Configure Security Group
1. Go to EC2 → Security Groups
2. Find your RDS security group
3. Edit inbound rules:
   - Type: PostgreSQL, Port: 5432, Source: 0.0.0.0/0

## Step 4: Deploy Backend (Amazon EC2)

### 4.1 Launch EC2 Instance
1. Go to EC2 → Launch Instance
2. Name: `spj-dashboard-backend`
3. AMI: Amazon Linux 2 (free tier)
4. Instance type: `t2.micro` (free tier)
5. Key pair: Create new or use existing
6. Security group: Create new
   - SSH (22): Your IP
   - HTTP (80): 0.0.0.0/0
   - HTTPS (443): 0.0.0.0/0
   - Custom TCP (3000): 0.0.0.0/0
7. Launch instance

### 4.2 Connect to EC2 Instance
```bash
# Replace with your key file and instance IP
ssh -i "your-key.pem" ec2-user@your-instance-ip
```

### 4.3 Install Dependencies on EC2
```bash
# Update system
sudo yum update -y

# Install Node.js
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 18
nvm use 18

# Install Docker
sudo yum install -y docker
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -a -G docker ec2-user

# Install Git
sudo yum install -y git

# Logout and login again to apply docker group changes
```

## Step 5: Deploy Frontend (Amazon S3 + CloudFront)

### 5.1 Create S3 Bucket
1. Go to S3 → Create bucket
2. Bucket name: `spj-dashboard-frontend` (must be globally unique)
3. Region: `us-east-1`
4. Block public access: Uncheck all
5. Create bucket

### 5.2 Configure S3 for Static Website Hosting
1. Select your bucket → Properties
2. Static website hosting: Enable
3. Index document: `index.html`
4. Error document: `index.html`
5. Save

### 5.3 Create CloudFront Distribution (Optional but Recommended)
1. Go to CloudFront → Create Distribution
2. Origin domain: Your S3 bucket
3. Default cache behavior: Redirect HTTP to HTTPS
4. Price class: Use only US, Canada and Europe
5. Create distribution

## Step 6: Deploy Application

### 6.1 Deploy Backend to EC2
```bash
# On your local machine
cd spj-ai-dashboard-modern

# Create deployment package
tar -czf backend-deployment.tar.gz backend/

# Copy to EC2
scp -i "your-key.pem" backend-deployment.tar.gz ec2-user@your-instance-ip:~/

# On EC2 instance
tar -xzf backend-deployment.tar.gz
cd backend

# Create production environment file
cat > .env << EOF
NODE_ENV=production
PORT=3000
DB_HOST=your-rds-endpoint.amazonaws.com
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=YourSecurePassword123!
JWT_SECRET=your-super-secret-jwt-key-here
FRONTEND_URL=https://your-cloudfront-domain.cloudfront.net
EOF

# Install dependencies and start
npm install
npm start
```

### 6.2 Deploy Frontend to S3
```bash
# On your local machine
cd spj-ai-dashboard-modern/frontend

# Install dependencies
npm install

# Build for production
npm run build

# Install AWS CLI if not already installed
pip install awscli

# Configure AWS CLI
aws configure

# Sync build folder to S3
aws s3 sync build/ s3://spj-dashboard-frontend --delete
```

## Step 7: Configure Domain and SSL (Optional)

### 7.1 Register Domain (Optional)
1. Go to Route 53 → Register Domain
2. Choose a domain name
3. Complete registration

### 7.2 Set Up SSL Certificate
1. Go to Certificate Manager
2. Request certificate
3. Add domain name
4. Validate certificate

## Step 8: Environment Configuration

### 8.1 Update Frontend Environment
```bash
# In frontend/src/services/api.js
# Update API_BASE_URL to your EC2 instance IP
const API_BASE_URL = 'http://your-ec2-ip:3000/api';
```

### 8.2 Update Backend CORS
```bash
# In backend/server.js
# Update CORS origin to your S3/CloudFront URL
app.use(cors({
  origin: ['https://your-cloudfront-domain.cloudfront.net', 'http://your-s3-bucket.s3-website-us-east-1.amazonaws.com'],
  credentials: true
}));
```

## Step 9: Database Migration

### 9.1 Run Database Migrations
```bash
# On EC2 instance
cd backend
node scripts/migrate.js
```

## Step 10: Test Deployment

### 10.1 Test Backend
```bash
# Test API endpoints
curl http://your-ec2-ip:3000/api/health
curl http://your-ec2-ip:3000/api/analytics/overview
```

### 10.2 Test Frontend
1. Visit your S3 website URL or CloudFront URL
2. Test login functionality
3. Test dashboard features

## Step 11: Set Up Monitoring and Logging

### 11.1 CloudWatch Logs
1. Go to CloudWatch → Log Groups
2. Create log group: `/aws/ec2/spj-dashboard`
3. Configure log streams for your application

### 11.2 Set Up Alarms
1. Go to CloudWatch → Alarms
2. Create alarms for:
   - EC2 CPU utilization
   - RDS connection count
   - Application errors

## Step 12: Backup and Security

### 12.1 Database Backups
1. Go to RDS → Your database
2. Enable automated backups
3. Set backup retention period

### 12.2 Security Hardening
1. Update security groups to restrict access
2. Use IAM roles instead of access keys
3. Enable MFA for AWS account
4. Regular security updates

## Cost Optimization (Free Tier)

### Free Tier Limits:
- **EC2**: 750 hours/month of t2.micro
- **RDS**: 750 hours/month of db.t2.micro
- **S3**: 5 GB storage, 20,000 GET requests
- **CloudFront**: 1 TB data transfer, 10,000,000 requests

### Cost Monitoring:
1. Go to Billing → Cost Explorer
2. Set up billing alerts
3. Monitor usage regularly

## Troubleshooting

### Common Issues:
1. **Database Connection**: Check security groups and VPC settings
2. **CORS Errors**: Verify frontend URL in backend CORS configuration
3. **Build Failures**: Check Node.js version compatibility
4. **Permission Errors**: Verify IAM policies and S3 bucket permissions

### Useful Commands:
```bash
# Check EC2 instance status
aws ec2 describe-instances --instance-ids i-your-instance-id

# Check RDS status
aws rds describe-db-instances --db-instance-identifier spj-dashboard-db

# View CloudWatch logs
aws logs describe-log-groups
aws logs get-log-events --log-group-name /aws/ec2/spj-dashboard
```

## Next Steps

1. **Set up CI/CD**: Use GitHub Actions or AWS CodePipeline
2. **Add monitoring**: Implement application performance monitoring
3. **Scale up**: Consider load balancers and auto-scaling groups
4. **Add features**: Implement additional dashboard features
5. **Security audit**: Regular security assessments

## Support and Resources

- [AWS Free Tier Documentation](https://aws.amazon.com/free/)
- [AWS CLI Documentation](https://docs.aws.amazon.com/cli/)
- [Docker Documentation](https://docs.docker.com/)
- [React Deployment Guide](https://create-react-app.dev/docs/deployment/)

---

**Note**: This guide uses AWS Free Tier services. Monitor your usage to avoid unexpected charges. Some services may have limitations in the free tier.
