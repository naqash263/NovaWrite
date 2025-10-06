# Namecheap Information Collector

Please fill out this form with the information from your Namecheap cPanel. This will help us create the proper deployment configuration.

## 🗄️ **Database Information**

**Database Host:** `_________________` (usually `localhost`)

**Database Name:** `_________________` (e.g., `naqashth_novawrite`)

**Database Username:** `_________________` (e.g., `naqashth_novauser`)

**Database Password:** `_________________` (the password you created)

**Database Port:** `_________________` (usually `5432`)

## 📧 **Email Information**

**SMTP Host:** `_________________` (usually `mail.naqashthaheem.com`)

**SMTP Port:** `_________________` (usually `587` or `465`)

**Email Address:** `_________________` (e.g., `contact@naqashthaheem.com`)

**Email Password:** `_________________` (password for the email account)

**Encryption Type:** `_________________` (TLS or SSL)

## 🖥️ **Server Information**

**PHP Version:** `_________________` (should be 8.1 or higher)

**Memory Limit:** `_________________` (should be at least 256M)

**Max Execution Time:** `_________________` (should be at least 300 seconds)

**Available Disk Space:** `_________________` (should be at least 500MB)

## 🌐 **Domain Information**

**Document Root:** `_________________` (usually `/public_html/`)

**SSL Status:** `_________________` (Active/Inactive)

**Domain Status:** `_________________` (Active/Inactive)

## 📋 **Checklist**

- [ ] I can access my Namecheap cPanel
- [ ] I have created a PostgreSQL database
- [ ] I have created a database user with full privileges
- [ ] I have created an email account
- [ ] I have enabled SSL certificate
- [ ] I have checked PHP version and extensions
- [ ] I have noted all the information above

## 🚀 **Ready for Deployment?**

Once you have filled out all the information above, we can:
1. Create the production `.env` file
2. Set up the deployment script
3. Deploy your NovaWrite application
4. Configure everything for your live site

---

**Note:** Keep this information secure and don't share it publicly!
