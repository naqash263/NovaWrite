# ✅ cPanel Git Setup Checklist

## 🎯 **Your Next Steps (Do these in order)**

### **Step 1: Set Up Git in cPanel** ⏳
- [ ] Login to Namecheap cPanel
- [ ] Find "Git Version Control" in Files section
- [ ] Click "Create" new repository
- [ ] Repository Name: `novawrite`
- [ ] Repository Path: `/naqashthaheem.com`
- [ ] Clone URL: `https://github.com/naqash263/NovaWrite.git`
- [ ] Click "Create"

### **Step 2: Configure Auto-Deploy** ⏳
- [ ] In cPanel Git, find your `novawrite` repository
- [ ] Click "Manage" next to your repository
- [ ] Enable "Auto Deploy" ✅
- [ ] Copy the webhook URL provided
- [ ] Go to GitHub: Settings → Webhooks → Add webhook
- [ ] Paste the webhook URL
- [ ] Select "Just the push event"
- [ ] Save webhook

### **Step 3: Set Up Production Environment** ⏳
- [ ] Copy `production.env.example` to `backend/.env.production`
- [ ] Update database credentials with your cPanel database details
- [ ] Update email settings with your cPanel email details
- [ ] Generate APP_KEY: `php artisan key:generate`
- [ ] Commit the `.env.production` file

### **Step 4: Test the Workflow** ⏳
- [ ] Make a small change in Cursor
- [ ] Run `./quick-update.sh`
- [ ] Check if cPanel automatically pulls the changes
- [ ] Verify your live site updates

## 🚀 **Your New Workflow**

### **Daily Development:**
1. **Code in Cursor** (localhost:3000 and localhost:8000)
2. **Test your changes**
3. **Run**: `./quick-update.sh`
4. **cPanel auto-deploys** from GitHub
5. **Live site updates automatically!**

## 🔧 **If Auto-Deploy Doesn't Work:**

### **Manual Method:**
1. **SSH into server**: `ssh timesovh@162.254.39.126`
2. **Navigate**: `cd /naqashthaheem.com`
3. **Pull changes**: `git pull origin main`
4. **Run deployment**: `./cpanel-deploy.sh`

## 📋 **Files You Need to Update:**

### **In cPanel, update these values:**
- [ ] Database credentials in `.env.production`
- [ ] Email settings in `.env.production`
- [ ] APP_KEY (generate new one)
- [ ] JWT_SECRET (generate new one)

## 🎉 **Benefits You'll Get:**

- ✅ **Automatic deployment** from GitHub
- ✅ **No manual file uploads** needed
- ✅ **Version control** for your live site
- ✅ **Easy rollbacks** if something goes wrong
- ✅ **Professional development workflow**

## 🚨 **Important Notes:**

- **Never commit** `.env` files (they contain secrets)
- **Always test locally** before pushing
- **Keep backups** of important files
- **Monitor your site** after updates

---

**Once you complete these steps, your development workflow will be: Code → Push → Auto-Deploy → Live!** 🚀
