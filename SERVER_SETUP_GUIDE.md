# 🛠️ Server Setup Guide for Namecheap

## 🎯 **Overview**
This guide helps you set up your Namecheap server for the NovaWrite application.

## 📋 **Prerequisites**
- SSH access to your Namecheap server
- Basic command line knowledge

## 🚀 **Step 1: Connect to Your Server**

```bash
ssh -p 21098 timesovh@162.254.39.126
```

## 🔧 **Step 2: Install Required Software**

### **Install Node.js and npm**
```bash
# Run the Node.js installation script
./install-nodejs.sh

# Or install manually:
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### **Install PHP and Composer**
```bash
# Install PHP 8.2 and extensions
sudo apt-get update
sudo apt-get install -y php8.2 php8.2-cli php8.2-fpm php8.2-mysql php8.2-pgsql php8.2-xml php8.2-mbstring php8.2-curl php8.2-zip php8.2-gd php8.2-intl

# Install Composer
curl -sS https://getcomposer.org/installer | php
sudo mv composer.phar /usr/local/bin/composer
sudo chmod +x /usr/local/bin/composer
```

### **Install Git**
```bash
sudo apt-get install -y git
```

## 📁 **Step 3: Set Up Application Directory**

```bash
# Create app directory
mkdir -p ~/naqashthaheem.com
cd ~/naqashthaheem.com

# Clone the repository
git clone https://github.com/naqash263/NovaWrite.git .

# Set up environment
cp production.env.example backend/.env.production
```

## ⚙️ **Step 4: Configure Environment**

Edit the environment file:
```bash
nano backend/.env.production
```

Update these values:
```env
APP_NAME="Naqash Thaheem"
APP_ENV=production
APP_DEBUG=false
APP_URL=https://naqashthaheem.com

# Database Configuration
DB_CONNECTION=pgsql
DB_HOST=localhost
DB_DATABASE=your_database_name
DB_USERNAME=your_database_user
DB_PASSWORD=your_database_password

# Email Configuration
MAIL_MAILER=smtp
MAIL_HOST=mail.naqashthaheem.com
MAIL_PORT=587
MAIL_USERNAME=contact@naqashthaheem.com
MAIL_PASSWORD=your_email_password
MAIL_FROM_ADDRESS="contact@naqashthaheem.com"
MAIL_FROM_NAME="Naqash Thaheem"
```

## 🗄️ **Step 5: Set Up Database**

```bash
# Create database (if using PostgreSQL)
sudo -u postgres createdb your_database_name
sudo -u postgres createuser your_database_user
sudo -u postgres psql -c "ALTER USER your_database_user PASSWORD 'your_database_password';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE your_database_name TO your_database_user;"
```

## 🚀 **Step 6: Deploy Application**

```bash
# Run the deployment script
./cpanel-deploy.sh
```

## 🔍 **Step 7: Verify Installation**

```bash
# Check if everything is working
./check-migrations.sh

# Test the application
curl -I https://naqashthaheem.com
```

## 🛠️ **Troubleshooting**

### **If migrations fail:**
```bash
# Reset migrations
./reset-migrations.sh
```

### **If Node.js is missing:**
```bash
# Install Node.js
./install-nodejs.sh
```

### **If frontend build fails:**
```bash
# Build frontend manually
cd frontend
npm install
npm run build
```

## 📋 **Manual Commands**

### **Update Application:**
```bash
cd ~/naqashthaheem.com
git pull origin main
./cpanel-deploy.sh
```

### **Check Logs:**
```bash
# Laravel logs
tail -f backend/storage/logs/laravel.log

# Server logs
tail -f /var/log/apache2/error.log
```

### **Restart Services:**
```bash
# Restart Apache
sudo systemctl restart apache2

# Restart PHP-FPM
sudo systemctl restart php8.2-fpm
```

## 🎉 **Success!**

Once everything is set up, your application should be available at:
- **Frontend**: https://naqashthaheem.com
- **API**: https://naqashthaheem.com/api

## 📞 **Need Help?**

If you encounter issues:
1. Check the logs
2. Run the troubleshooting scripts
3. Verify all services are running
4. Check file permissions

---

**Your NovaWrite application is now ready for production!** 🚀
