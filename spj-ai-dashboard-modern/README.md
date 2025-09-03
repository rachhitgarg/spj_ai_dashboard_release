# SPJ AI Dashboard - Modern Version

A comprehensive dashboard for tracking and analyzing AI initiatives impact on student outcomes at SPJ. Built with React, Node.js, PostgreSQL, and modern web technologies.

## 🚀 Features

### Core Functionality
- **Executive Overview**: Comprehensive metrics and KPIs
- **AI Tutor Analytics**: Usage patterns and academic performance impact
- **AI Mentor Analytics**: Capstone project improvements and higher degree success
- **JPT Analytics**: Job preparation tool effectiveness and conversion improvements
- **Placements Tracking**: Company visits, placement outcomes, and recruitment trends
- **Data Management**: Excel/CSV upload with schema validation

### Technical Features
- **Modern UI**: React with Tailwind CSS for responsive design
- **Real-time Analytics**: Live data updates and interactive charts
- **Authentication**: JWT-based secure authentication
- **File Upload**: Excel/CSV template support with validation
- **Global Filtering**: Tool, course, cohort, and phase-based filtering
- **Responsive Design**: Mobile-first approach with modern UX

## 🛠️ Tech Stack

### Frontend
- **React 18** - Modern React with hooks
- **Tailwind CSS** - Utility-first CSS framework
- **Recharts** - Data visualization library
- **React Query** - Data fetching and caching
- **React Router** - Client-side routing
- **Axios** - HTTP client
- **Lucide React** - Modern icon library

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **PostgreSQL** - Relational database
- **JWT** - Authentication tokens
- **Multer** - File upload handling
- **XLSX** - Excel file processing
- **Bcrypt** - Password hashing

### DevOps
- **Docker** - Containerization
- **Docker Compose** - Multi-container orchestration
- **Nginx** - Reverse proxy and static file serving

## 📋 Prerequisites

- Node.js 18+ and npm
- PostgreSQL 13+
- Docker and Docker Compose (for containerized deployment)

## 🚀 Quick Start

### Local Development

1. **Clone and setup**
   ```bash
   git clone <repository-url>
   cd spj-ai-dashboard-modern
   npm run install-all
   ```

2. **Database setup**
   ```bash
   # Start PostgreSQL (using Docker)
   docker run --name spj-postgres -e POSTGRES_PASSWORD=password -e POSTGRES_DB=spj_ai_dashboard -p 5432:5432 -d postgres:15-alpine
   
   # Or use local PostgreSQL
   createdb spj_ai_dashboard
   ```

3. **Environment configuration**
   ```bash
   # Backend
   cd backend
   cp env.example .env
   # Edit .env with your database credentials
   
   # Frontend
   cd ../frontend
   # Create .env.local if needed
   echo "REACT_APP_API_URL=http://localhost:5000/api" > .env.local
   ```

4. **Database migration**
   ```bash
   cd backend
   npm run migrate
   ```

5. **Start development servers**
   ```bash
   # From project root
   npm run dev
   ```

   This will start:
   - Backend API on http://localhost:5000
   - Frontend on http://localhost:3000

### Docker Deployment

1. **Environment setup**
   ```bash
   # Create .env file
   cat > .env << EOF
   DB_PASSWORD=your_secure_password
   JWT_SECRET=your_super_secret_jwt_key
   CLIENT_URL=http://localhost:3000
   REACT_APP_API_URL=http://localhost:5000/api
   EOF
   ```

2. **Start services**
   ```bash
   docker-compose up -d
   ```

3. **Initialize database**
   ```bash
   docker-compose exec backend npm run migrate
   ```

4. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000
   - Database: localhost:5432

## 📊 Data Schema

### Core Tables
- **cohort_master**: Cohort information (ID, year, program, phase)
- **placements_cohort**: Placement outcomes and metrics
- **company_visits**: Company visit details and recruitment data
- **jpt_cohort**: JPT usage and performance metrics
- **tutor_sessions**: AI Tutor session data
- **tutor_cohort_summary**: AI Tutor cohort-level summaries
- **mentor_cohort**: AI Mentor impact metrics

### Key Metrics Tracked
- Job conversion rates
- Average and median packages
- Tier-1 company placements
- AI tool usage patterns
- Academic performance improvements
- Higher degree success rates

## 🔧 Configuration

### Environment Variables

#### Backend (.env)
```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=spj_ai_dashboard
DB_USER=postgres
DB_PASSWORD=your_password

# JWT
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRES_IN=7d

# Server
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:3000

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads
```

#### Frontend (.env.local)
```env
REACT_APP_API_URL=http://localhost:5000/api
```

## 📱 Usage

### Authentication
1. Contact administrator for account creation
2. Login with provided credentials
3. Access dashboard features based on role permissions

### Data Upload
1. Navigate to Data Uploader page
2. Download Excel templates
3. Fill templates with your data
4. Upload files with automatic validation
5. View import results and errors

### Analytics
1. Use global filters to focus on specific cohorts/tools
2. Navigate between different analytics pages
3. View real-time metrics and charts
4. Export data for further analysis

## 🚀 AWS Deployment

### Free Tier Setup

1. **EC2 Instance**
   ```bash
   # Launch t2.micro instance
   # Install Docker
   sudo yum update -y
   sudo yum install -y docker
   sudo systemctl start docker
   sudo usermod -a -G docker ec2-user
   
   # Install Docker Compose
   sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
   sudo chmod +x /usr/local/bin/docker-compose
   ```

2. **RDS PostgreSQL** (Free Tier)
   - Create db.t3.micro instance
   - Configure security groups
   - Update environment variables

3. **Deploy Application**
   ```bash
   # Clone repository
   git clone <repository-url>
   cd spj-ai-dashboard-modern
   
   # Configure environment
   cp .env.example .env
   # Edit .env with RDS credentials
   
   # Deploy
   docker-compose up -d
   ```

4. **Domain and SSL** (Optional)
   - Use Route 53 for domain
   - CloudFront for CDN
   - Let's Encrypt for SSL

## 🔒 Security

- JWT-based authentication
- Password hashing with bcrypt
- Input validation and sanitization
- SQL injection prevention
- CORS configuration
- Rate limiting
- Security headers

## 📈 Performance

- React Query for efficient data caching
- Lazy loading and code splitting
- Image optimization
- Gzip compression
- Database indexing
- Connection pooling

## 🧪 Testing

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

## 📝 API Documentation

### Authentication Endpoints
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update profile
- `PUT /api/auth/change-password` - Change password

### Analytics Endpoints
- `GET /api/analytics/overview` - Overview metrics
- `GET /api/analytics/tutor` - AI Tutor analytics
- `GET /api/analytics/mentor` - AI Mentor analytics
- `GET /api/analytics/jpt` - JPT analytics

### Data Management
- `GET /api/cohorts` - Get cohorts
- `GET /api/placements` - Get placement data
- `POST /api/upload/:tableName` - Upload data file
- `GET /api/upload/templates` - Get available templates

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation

## 🔄 Updates

### Version 1.0.0
- Initial release with core functionality
- React + Node.js architecture
- PostgreSQL database
- Docker deployment support
- AWS deployment guide

---

**SPJ AI Dashboard** - Empowering data-driven decisions in AI education initiatives.
