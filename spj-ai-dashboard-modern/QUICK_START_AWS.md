# Quick Start Guide: Deploy SPJ AI Dashboard to AWS

This is a condensed guide to get your dashboard running on AWS Cloud quickly.

## 🚀 Quick Deployment (30 minutes)

### Step 1: AWS Setup (5 minutes)
1. **Create AWS Account**: Go to [aws.amazon.com](https://aws.amazon.com) and sign up
2. **Install AWS CLI**: `pip install awscli`
3. **Configure AWS CLI**: `aws configure`
   - Enter your Access Key ID and Secret Access Key
   - Region: `us-east-1`
   - Output: `json`

### Step 2: Create AWS Resources (10 minutes)

#### Database (RDS)
```bash
# Create PostgreSQL database
aws rds create-db-instance \
  --db-instance-identifier spj-dashboard-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --master-username postgres \
  --master-user-password YourPassword123! \
  --allocated-storage 20 \
  --vpc-security-group-ids sg-xxxxxxxxx
```

#### Server (EC2)
```bash
# Launch EC2 instance
aws ec2 run-instances \
  --image-id ami-0c02fb55956c7d316 \
  --count 1 \
  --instance-type t2.micro \
  --key-name your-key-pair \
  --security-group-ids sg-xxxxxxxxx
```

#### Frontend (S3)
```bash
# Create S3 bucket
aws s3 mb s3://spj-dashboard-frontend

# Enable static website hosting
aws s3 website s3://spj-dashboard-frontend \
  --index-document index.html \
  --error-document index.html
```

### Step 3: Deploy Application (15 minutes)

#### Option A: Automated Deployment
```bash
# Make script executable (Linux/Mac)
chmod +x deploy.sh
./deploy.sh

# Or run PowerShell script (Windows)
.\deploy.ps1
```

#### Option B: Manual Deployment

**Deploy Backend:**
```bash
# Build and upload backend
cd backend
tar -czf ../backend-deployment.tar.gz .
scp -i your-key.pem backend-deployment.tar.gz ec2-user@your-ec2-ip:~/

# On EC2 instance
ssh -i your-key.pem ec2-user@your-ec2-ip
tar -xzf backend-deployment.tar.gz
cd backend
npm install
npm start
```

**Deploy Frontend:**
```bash
# Build and upload frontend
cd frontend
npm install
npm run build
aws s3 sync build/ s3://spj-dashboard-frontend --delete
```

## 🔧 Configuration

### Environment Variables
Create `.env` file on EC2:
```bash
NODE_ENV=production
PORT=3000
DB_HOST=your-rds-endpoint.amazonaws.com
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=YourPassword123!
JWT_SECRET=your-super-secret-jwt-key
FRONTEND_URL=https://spj-dashboard-frontend.s3-website-us-east-1.amazonaws.com
```

### Security Groups
Ensure these ports are open:
- **EC2**: 22 (SSH), 80 (HTTP), 443 (HTTPS), 3000 (API)
- **RDS**: 5432 (PostgreSQL)

## 🧪 Testing

### Test Backend
```bash
curl http://your-ec2-ip:3000/api/health
```

### Test Frontend
Visit: `https://spj-dashboard-frontend.s3-website-us-east-1.amazonaws.com`

## 📊 Monitoring

### Check Resources
```bash
# Check EC2 status
aws ec2 describe-instances --instance-ids i-your-instance-id

# Check RDS status
aws rds describe-db-instances --db-instance-identifier spj-dashboard-db

# Check S3 bucket
aws s3 ls s3://spj-dashboard-frontend
```

### View Logs
```bash
# SSH to EC2 and check logs
ssh -i your-key.pem ec2-user@your-ec2-ip
pm2 logs  # if using PM2
# or
tail -f /var/log/your-app.log
```

## 💰 Cost Monitoring

### Free Tier Limits
- **EC2**: 750 hours/month of t2.micro
- **RDS**: 750 hours/month of db.t2.micro  
- **S3**: 5 GB storage, 20,000 GET requests

### Set Billing Alerts
1. Go to AWS Billing → Budgets
2. Create budget with $5 threshold
3. Set up email notifications

## 🚨 Troubleshooting

### Common Issues

**Database Connection Failed:**
```bash
# Check security group
aws ec2 describe-security-groups --group-ids sg-xxxxxxxxx

# Test connection
telnet your-rds-endpoint.amazonaws.com 5432
```

**Frontend Not Loading:**
```bash
# Check S3 bucket policy
aws s3api get-bucket-policy --bucket spj-dashboard-frontend

# Check CloudFront distribution
aws cloudfront list-distributions
```

**Backend Not Starting:**
```bash
# Check logs on EC2
ssh -i your-key.pem ec2-user@your-ec2-ip
journalctl -u your-service-name
```

## 🔄 Updates and Maintenance

### Update Application
```bash
# Pull latest changes
git pull origin main

# Rebuild and redeploy
./deploy.sh
```

### Database Backup
```bash
# Create manual backup
aws rds create-db-snapshot \
  --db-instance-identifier spj-dashboard-db \
  --db-snapshot-identifier spj-dashboard-backup-$(date +%Y%m%d)
```

## 📞 Support

- **AWS Support**: https://console.aws.amazon.com/support
- **Documentation**: https://docs.aws.amazon.com
- **Community**: https://forums.aws.amazon.com

---

## 🎯 Success Checklist

- [ ] AWS account created and configured
- [ ] RDS PostgreSQL database running
- [ ] EC2 instance launched and accessible
- [ ] S3 bucket created and configured
- [ ] Backend deployed and responding
- [ ] Frontend deployed and accessible
- [ ] Database migrations completed
- [ ] Authentication working
- [ ] Dashboard features functional
- [ ] Monitoring and alerts configured

**🎉 Your SPJ AI Dashboard is now live on AWS Cloud!**

Access your dashboard at: `https://spj-dashboard-frontend.s3-website-us-east-1.amazonaws.com`
