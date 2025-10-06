# Namecheap Stellar Plus Pre-Deployment Setup Guide

This guide will help you prepare your Namecheap Stellar Plus hosting environment before deploying NovaWrite.

## 🎯 **Step 1: Access Your Namecheap Account**

### **1.1 Login to Namecheap**
- Go to [https://www.namecheap.com/](https://www.namecheap.com/)
- Login to your account
- Navigate to **"Account" > "Domain List"**

### **1.2 Access cPanel**
- Find your domain `naqashthaheem.com`
- Click **"Manage"** next to your domain
- Click **"cPanel"** to access the hosting control panel

## 🗄️ **Step 2: Database Setup**

### **2.1 Create PostgreSQL Database**
1. In cPanel, find **"PostgreSQL Databases"**
2. Create a new database:
   - **Database Name**: `naqashth_novawrite` (or similar)
   - **Note**: Namecheap adds a prefix to your username
3. Create a database user:
   - **Username**: `naqashth_novauser` (or similar)
   - **Password**: Generate a strong password (save this!)
4. Add the user to the database with **ALL PRIVILEGES**

### **2.2 Note Database Credentials**
```
Database Host: localhost (or provided by Namecheap)
Database Name: naqashth_novawrite
Database User: naqashth_novauser
Database Password: [Your generated password]
Database Port: 5432 (default for PostgreSQL)
```

## 📁 **Step 3: File Structure Setup**

### **3.1 Check Your Domain Structure**
- Your domain should point to: `/public_html/`
- We'll need to set up the structure as:
  ```
  public_html/
  ├── api/          # Laravel backend
  └── dist/         # React frontend build
  ```

### **3.2 Check PHP Version**
- In cPanel, go to **"Select PHP Version"**
- Ensure you have **PHP 8.1 or higher**
- Enable required extensions:
  - `pdo_pgsql`
  - `openssl`
  - `mbstring`
  - `tokenizer`
  - `xml`
  - `ctype`
  - `json`
  - `bcmath`
  - `fileinfo`
  - `curl`

## 🔧 **Step 4: Composer Installation**

### **4.1 Install Composer**
1. In cPanel, go to **"File Manager"**
2. Navigate to your domain's root directory
3. Download Composer:
   ```bash
   curl -sS https://getcomposer.org/installer | php
   ```
4. Move to global location:
   ```bash
   mv composer.phar /usr/local/bin/composer
   ```

## 📧 **Step 5: Email Configuration**

### **5.1 Check Email Settings**
- In cPanel, go to **"Email Accounts"**
- Note your email server details:
  - **SMTP Host**: `mail.naqashthaheem.com`
  - **SMTP Port**: `587` (or `465` for SSL)
  - **Authentication**: Required

### **5.2 Test Email Account**
- Create an email account: `contact@naqashthaheem.com`
- Test sending/receiving emails
- Note the password for SMTP configuration

## 🔐 **Step 6: SSL Certificate**

### **6.1 Enable SSL**
- In cPanel, go to **"SSL/TLS"**
- Enable **"Force HTTPS Redirect"**
- Ensure your domain has a valid SSL certificate

## 📊 **Step 7: Check Resource Limits**

### **7.1 Verify Hosting Limits**
- **Disk Space**: Ensure you have enough space (NovaWrite needs ~500MB)
- **Memory Limit**: Check PHP memory limit (should be at least 256MB)
- **Execution Time**: Check max execution time (should be at least 300 seconds)

## 🚀 **Step 8: Prepare Environment File**

### **8.1 Create Production .env File**
You'll need to create a `.env` file with these settings:

```env
APP_NAME="Naqash Thaheem"
APP_ENV=production
APP_KEY=base64:YOUR_GENERATED_KEY
APP_DEBUG=false
APP_URL=https://naqashthaheem.com

LOG_CHANNEL=stack
LOG_DEPRECATIONS_CHANNEL=null
LOG_LEVEL=error

DB_CONNECTION=pgsql
DB_HOST=localhost
DB_PORT=5432
DB_DATABASE=naqashth_novawrite
DB_USERNAME=naqashth_novauser
DB_PASSWORD=your_database_password

BROADCAST_DRIVER=log
CACHE_DRIVER=file
FILESYSTEM_DISK=local
QUEUE_CONNECTION=sync
SESSION_DRIVER=file
SESSION_LIFETIME=120

MEMCACHED_HOST=127.0.0.1

REDIS_HOST=127.0.0.1
REDIS_PASSWORD=null
REDIS_PORT=6379

MAIL_MAILER=smtp
MAIL_HOST=mail.naqashthaheem.com
MAIL_PORT=587
MAIL_USERNAME=contact@naqashthaheem.com
MAIL_PASSWORD=your_email_password
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS="contact@naqashthaheem.com"
MAIL_FROM_NAME="${APP_NAME}"

AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_DEFAULT_REGION=us-east-1
AWS_BUCKET=
AWS_USE_PATH_STYLE_ENDPOINT=false

PUSHER_APP_ID=
PUSHER_APP_KEY=
PUSHER_APP_SECRET=
PUSHER_HOST=
PUSHER_PORT=443
PUSHER_SCHEME=https
PUSHER_APP_CLUSTER=mt1

VITE_APP_NAME="${APP_NAME}"
VITE_PUSHER_APP_KEY="${PUSHER_APP_KEY}"
VITE_PUSHER_HOST="${PUSHER_HOST}"
VITE_PUSHER_PORT="${PUSHER_PORT}"
VITE_PUSHER_SCHEME="${PUSHER_SCHEME}"
VITE_PUSHER_APP_CLUSTER="${PUSHER_APP_CLUSTER}"
```

## 📋 **Step 9: Information Collection Checklist**

Please collect the following information from your Namecheap cPanel:

### **Database Information**
- [ ] Database host
- [ ] Database name
- [ ] Database username
- [ ] Database password
- [ ] Database port

### **Email Information**
- [ ] SMTP host
- [ ] SMTP port
- [ ] SMTP username (email address)
- [ ] SMTP password
- [ ] Encryption type (TLS/SSL)

### **Server Information**
- [ ] PHP version
- [ ] Available PHP extensions
- [ ] Memory limit
- [ ] Max execution time
- [ ] Disk space available

### **Domain Information**
- [ ] Document root path
- [ ] SSL certificate status
- [ ] Domain pointing correctly

## 🔍 **Step 10: Test Basic Connectivity**

### **10.1 Test Database Connection**
- Try connecting to your database using a tool like pgAdmin
- Or use cPanel's **"phpPgAdmin"** to test

### **10.2 Test Email Sending**
- Send a test email from cPanel
- Verify it reaches the destination

## 📞 **Step 11: Namecheap Support**

If you encounter any issues:
- **Live Chat**: Available in your Namecheap account
- **Support Ticket**: Submit through your account
- **Documentation**: [Namecheap Knowledge Base](https://www.namecheap.com/support/)

## ⚠️ **Important Notes**

1. **Backup First**: Always backup your current files before making changes
2. **Test Environment**: Consider setting up a subdomain for testing first
3. **Security**: Use strong passwords for all accounts
4. **Monitoring**: Keep track of resource usage

## 🎯 **Next Steps After Preparation**

Once you have all the information above:
1. We'll create the production `.env` file
2. Set up the deployment script
3. Deploy the application
4. Configure the web server
5. Test all functionality

---

**Need Help?** If you get stuck on any step, let me know and I'll guide you through it!
