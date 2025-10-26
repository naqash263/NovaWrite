# 🚀 NovaWrite - Professional Portfolio & Learning Platform

A modern, full-stack web application built with React, TypeScript, Laravel, and PostgreSQL. This platform serves as both a professional portfolio and a comprehensive learning management system.

## ✨ Features

### 🎯 Core Functionality
- **Portfolio Showcase** - Professional presentation of work and skills
- **Course Management** - Complete LMS with lessons, tests, and progress tracking
- **Workflow Automation** - Document and share business processes
- **Blog System** - Content management with categories and tags
- **User Management** - Role-based access control and user groups

### 📧 Email System
- **N8n Webhook Integration** - Automated email sending via webhooks
- **Email Queue System** - Background job processing for reliable email delivery
- **Dynamic Email Templates** - Database-driven email templates
- **Email Verification** - Secure user registration with email verification
- **Welcome Emails** - Automated onboarding experience
- **Password Reset** - Secure password reset flow with email links

### 🔐 Security & Authentication
- **JWT Authentication** - Secure API authentication
- **Email Verification** - Required email verification for new users
- **Role-Based Access** - Admin, user, and custom role management
- **Two-Factor Authentication** - Enhanced security options

## 🛠️ Tech Stack

### Frontend
- **React 19** - Modern UI library
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **React Router** - Client-side routing
- **Axios** - HTTP client

### Backend
- **Laravel 11** - PHP framework
- **PostgreSQL** - Primary database
- **JWT Auth** - API authentication
- **Mail System** - Email functionality
- **Queue System** - Background job processing

### Infrastructure
- **Namecheap Hosting** - Production hosting
- **GitHub** - Version control and CI/CD
- **PostgreSQL** - Production database
- **Queue Workers** - Background job processing for emails
- **N8n** - Workflow automation for email delivery

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PHP 8.2+
- PostgreSQL 13+
- Composer
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/novawrite.git
   cd novawrite
   ```

2. **Backend Setup**
   ```bash
   cd backend
   composer install
   cp .env.example .env
   php artisan key:generate
   php artisan migrate
   php artisan serve --host=0.0.0.0 --port=8001
   
   # Start queue worker for email processing
   php artisan queue:work --tries=3 --timeout=120 &
   ```

3. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   npm start
   ```

4. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8001/api
   - Admin Panel: http://localhost:3000/admin

## 📁 Project Structure

```
novawrite/
├── backend/                 # Laravel API
│   ├── app/
│   │   ├── Http/Controllers/ # API Controllers
│   │   ├── Mail/            # Email Classes
│   │   ├── Models/          # Eloquent Models
│   │   └── Services/        # Business Logic
│   ├── database/
│   │   ├── migrations/      # Database Schema
│   │   └── seeders/         # Sample Data
│   └── resources/views/     # Email Templates
├── frontend/                # React Application
│   ├── src/
│   │   ├── components/      # Reusable Components
│   │   ├── pages/          # Page Components
│   │   ├── hooks/          # Custom Hooks
│   │   └── utils/          # Utility Functions
│   └── public/             # Static Assets
├── deployment/             # Production Files
└── docs/                   # Documentation
```

## 🔧 Configuration

### Environment Variables

**Backend (.env)**
```env
APP_NAME="Naqash Thaheem"
APP_URL=https://naqashthaheem.com
DB_CONNECTION=pgsql
DB_HOST=localhost
DB_DATABASE=novawrite_production
MAIL_FROM_ADDRESS="contact@naqashthaheem.com"
```

**Frontend (.env)**
```env
VITE_API_URL=https://naqashthaheem.com/api
VITE_APP_NAME="Naqash Thaheem"
```

## 🚀 Deployment

### Production Deployment
```bash
# Run deployment script
./deploy.sh

# Or manual deployment
git pull origin main
composer install --no-dev
npm run build
php artisan migrate --force
php artisan config:cache
```

### Update Live Site
```bash
# Quick update script
./update-live.sh

# Or manual update
git pull origin main
composer install --no-dev
cd frontend && npm ci && npm run build
php artisan config:cache
```

## 🎯 Queue Worker & Email System

### Local Development

Start the queue worker to process emails:
```bash
cd backend
php artisan queue:work --tries=3 --timeout=120 &
```

### Production Setup

See [QUEUE_WORKER_SETUP.md](QUEUE_WORKER_SETUP.md) for complete production setup instructions.

**Quick Start for Production:**
```bash
ssh -p 21098 timesovh@162.254.39.126
cd ~/naqashthaheem.com/backend

# Kill existing workers and start new one
pkill -f "artisan queue:work" || true
nohup php artisan queue:work --sleep=3 --tries=3 --max-time=3600 --timeout=120 > storage/logs/queue-worker.log 2>&1 &

# Verify it's running
ps aux | grep "queue:work" | grep -v grep
```

**Important:** The email system uses N8n webhooks for sending emails. Configure your N8n webhook URL in the admin panel under "N8n Configuration".

## 📚 Documentation

- [Deployment Guide](DEPLOYMENT_GUIDE.md) - Complete deployment instructions
- [Live Update Workflow](LIVE_UPDATE_WORKFLOW.md) - Managing production updates
- [Queue Worker Setup](QUEUE_WORKER_SETUP.md) - Queue worker and email system setup
- [Email System Documentation](EMAIL_SYSTEM_DOCUMENTATION.md) - Email functionality
- [User Access Management](USER_ACCESS_MANAGEMENT.md) - User roles and permissions

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Naqash Thaheem**
- Website: [naqashthaheem.com](https://naqashthaheem.com)
- Email: contact@naqashthaheem.com
- LinkedIn: [Your LinkedIn Profile]

## 🙏 Acknowledgments

- Laravel Community
- React Team
- Tailwind CSS
- All contributors and users

---

**Built with ❤️ by Naqash Thaheem**
