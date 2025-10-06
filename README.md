# NovaWrite - AI-Powered Content Management Platform

A comprehensive full-stack application built with Laravel (Backend) and React (Frontend) for content management, course delivery, workflow automation, and email marketing.

## 🚀 Features

### Core Features
- **Content Management System** - Blog posts, workflows, and resources
- **Course Management** - Interactive courses with lessons, tests, and progress tracking
- **Email System** - Dynamic email templates with SMTP configuration
- **User Management** - Registration, authentication, and role-based access control
- **Admin Dashboard** - Comprehensive admin panel for content and user management
- **API System** - RESTful API with authentication and documentation

### Advanced Features
- **Email Verification** - Secure user registration with email verification
- **Dynamic Email Templates** - Database-driven email templates with variable substitution
- **SMTP Configuration** - Admin-configurable email settings
- **Google OAuth** - Social login integration
- **Two-Factor Authentication** - Enhanced security
- **Performance Optimization** - Caching, lazy loading, and query optimization
- **SEO Optimization** - Meta tags, sitemaps, and structured data

## 🛠 Tech Stack

### Backend
- **Laravel 11** - PHP framework
- **PostgreSQL** - Database
- **JWT Authentication** - API authentication
- **Laravel Mail** - Email system
- **Laravel Queue** - Background job processing

### Frontend
- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **React Router** - Navigation
- **Axios** - HTTP client

### Deployment
- **Namecheap Stellar Plus** - Shared hosting
- **GitHub Actions** - CI/CD pipeline
- **Docker** - Containerization (optional)

## 📁 Project Structure

```
NovaWrite/
├── backend/                 # Laravel API
│   ├── app/
│   │   ├── Http/Controllers/    # API controllers
│   │   ├── Models/             # Eloquent models
│   │   ├── Mail/               # Email templates
│   │   └── Services/           # Business logic
│   ├── database/
│   │   ├── migrations/         # Database migrations
│   │   └── seeders/           # Database seeders
│   └── resources/views/emails/ # Email templates
├── frontend/                # React application
│   ├── src/
│   │   ├── components/        # Reusable components
│   │   ├── pages/            # Page components
│   │   ├── hooks/            # Custom hooks
│   │   └── utils/            # Utility functions
│   └── public/               # Static assets
├── .github/workflows/       # GitHub Actions
├── deploy.sh               # Initial deployment script
├── update-live.sh          # Live site update script
└── docs/                   # Documentation
```

## 🚀 Quick Start

### Prerequisites
- PHP 8.1+
- Node.js 18+
- PostgreSQL 13+
- Composer
- npm/yarn

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
   # Configure your .env file
   php artisan key:generate
   php artisan migrate --seed
   php artisan serve
   ```

3. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   cp .env.example .env
   # Configure your .env file
   npm run dev
   ```

4. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - Admin Panel: http://localhost:3000/admin

## 🔧 Configuration

### Environment Variables

#### Backend (.env)
```env
APP_NAME="Naqash Thaheem"
APP_URL=https://naqashthaheem.com
DB_CONNECTION=pgsql
DB_HOST=localhost
DB_PORT=5432
DB_DATABASE=novawrite
DB_USERNAME=your_username
DB_PASSWORD=your_password

# Email Configuration
MAIL_MAILER=smtp
MAIL_HOST=mail.naqashthaheem.com
MAIL_PORT=587
MAIL_USERNAME=contact@naqashthaheem.com
MAIL_PASSWORD=your_email_password
MAIL_FROM_ADDRESS="contact@naqashthaheem.com"
MAIL_FROM_NAME="${APP_NAME}"
```

#### Frontend (.env)
```env
VITE_API_URL=http://localhost:8000/api
VITE_APP_NAME="Naqash Thaheem"
VITE_APP_URL=https://naqashthaheem.com
```

## 📧 Email System

The application includes a comprehensive email system:

- **Dynamic Templates** - Create and manage email templates from the admin panel
- **SMTP Configuration** - Configure multiple SMTP providers
- **Email Verification** - Automatic email verification for new users
- **Welcome Emails** - Automated welcome emails after verification
- **Template Testing** - Test email templates before sending

### Email Templates
- Welcome Email
- Email Verification
- Password Reset
- Course Enrollment
- Workflow Notifications
- Custom Templates

## 🔐 Authentication & Security

- **JWT Authentication** - Secure API authentication
- **Email Verification** - Required for account activation
- **Role-Based Access Control** - Admin, user, and custom roles
- **Two-Factor Authentication** - Optional 2FA for enhanced security
- **Google OAuth** - Social login integration
- **Password Reset** - Secure password reset via email

## 📊 Admin Features

### Content Management
- Blog posts with rich text editor
- Workflow templates and automation
- Course creation and management
- File uploads and management
- User-generated content moderation

### User Management
- User registration and verification
- Role assignment and permissions
- User groups and access control
- Activity logging and monitoring

### System Configuration
- Email template management
- SMTP configuration
- API token management
- System settings and preferences

## 🚀 Deployment

### Namecheap Stellar Plus Hosting

1. **Initial Deployment**
   ```bash
   ./deploy.sh
   ```

2. **Regular Updates**
   ```bash
   ./update-live.sh
   ```

3. **GitHub Actions** (Automated)
   - Push to main branch triggers deployment
   - Automatic testing and building
   - Email notifications on success/failure

### Manual Deployment Steps

1. Upload files to hosting
2. Configure database connection
3. Run migrations: `php artisan migrate`
4. Seed database: `php artisan db:seed`
5. Set up cron jobs for queue processing
6. Configure web server (Apache/Nginx)

## 📚 Documentation

- [API Documentation](API_DOCUMENTATION.md)
- [Deployment Guide](DEPLOYMENT_GUIDE.md)
- [Email System Guide](EMAIL_SYSTEM_DOCUMENTATION.md)
- [SMTP Configuration](SMTP_CONFIGURATION_GUIDE.md)
- [Live Update Workflow](LIVE_UPDATE_WORKFLOW.md)
- [Content Strategy](CONTENT_STRATEGY.md)
- [Performance Optimization](PERFORMANCE_OPTIMIZATION_SUMMARY.md)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Commit changes: `git commit -am 'Add new feature'`
4. Push to branch: `git push origin feature/new-feature`
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Email: contact@naqashthaheem.com
- Documentation: Check the docs/ folder
- Issues: GitHub Issues

## 🔄 Version History

- **v1.0.0** - Initial release with core features
- **v1.1.0** - Added email system and admin panel
- **v1.2.0** - Added email verification and deployment automation

---

**Built with ❤️ by Naqash Thaheem**
