# 🔐 GitHub Secrets Setup for SSH Deployment

## 🎯 **Required GitHub Secrets**

You need to add these secrets to your GitHub repository for SSH deployment to work.

### **Step 1: Go to GitHub Repository Settings**

1. **Go to your repository**: `https://github.com/naqash263/NovaWrite`
2. **Click "Settings"** (top menu)
3. **Click "Secrets and variables"** → **"Actions"**
4. **Click "New repository secret"** for each secret below

### **Step 2: Add These Secrets**

#### **1. HOST** 🌐
- **Name**: `HOST`
- **Value**: `162.254.39.126` (your server IP)
- **Description**: Your Namecheap server IP address

#### **2. USERNAME** 👤
- **Name**: `USERNAME`
- **Value**: `timesovh` (your cPanel username)
- **Description**: Your cPanel username

#### **3. SSH_KEY** 🔑
- **Name**: `SSH_KEY`
- **Value**: Your private SSH key (see below for how to get it)
- **Description**: Private SSH key for server access

#### **4. SSH_PASSPHRASE** 🔒
- **Name**: `SSH_PASSPHRASE`
- **Value**: Your SSH key passphrase (if any)
- **Description**: Passphrase for your SSH key

## 🔑 **How to Get Your SSH Key**

### **Option A: If you already have SSH access**
```bash
# Check if you have SSH key
ls -la ~/.ssh/

# If you see id_rsa and id_rsa.pub, you're good
# Copy the private key content:
cat ~/.ssh/id_rsa
```

### **Option B: Generate new SSH key**
```bash
# Generate new SSH key
ssh-keygen -t rsa -b 4096 -C "your-email@example.com"

# When prompted:
# - Enter file name: press Enter (default)
# - Enter passphrase: enter a strong passphrase
# - Confirm passphrase: enter the same passphrase

# Copy the private key
cat ~/.ssh/id_rsa

# Copy the public key
cat ~/.ssh/id_rsa.pub
```

### **Option C: Use cPanel File Manager**
1. **Login to cPanel**
2. **Go to "File Manager"**
3. **Navigate to `/home/timesovh/.ssh/`**
4. **Download `id_rsa`** (private key)
5. **Open the file and copy its content**

## 🔧 **Step 3: Add Public Key to Server**

### **If you generated a new key:**
1. **Copy the public key**: `cat ~/.ssh/id_rsa.pub`
2. **SSH into your server**: `ssh timesovh@162.254.39.126`
3. **Add to authorized_keys**:
   ```bash
   mkdir -p ~/.ssh
   echo "your-public-key-here" >> ~/.ssh/authorized_keys
   chmod 600 ~/.ssh/authorized_keys
   chmod 700 ~/.ssh
   ```

### **If using cPanel File Manager:**
1. **Upload `id_rsa.pub`** to `/home/timesovh/.ssh/`
2. **Rename it to `authorized_keys`**
3. **Set permissions**: 600 for `authorized_keys`, 700 for `.ssh` folder

## 🧪 **Step 4: Test SSH Connection**

```bash
# Test SSH connection
ssh -p 21098 timesovh@162.254.39.126

# If successful, you should see a shell prompt
# If not, check your SSH key and permissions
```

## 🚀 **Step 5: Test GitHub Actions**

1. **Make a small change** to any file
2. **Commit and push**:
   ```bash
   git add .
   git commit -m "test: Test GitHub Actions deployment"
   git push origin main
   ```
3. **Go to GitHub** → **"Actions"** tab
4. **Watch the deployment** run automatically

## 🚨 **Troubleshooting**

### **If SSH connection fails:**
- **Check SSH key format** (should start with `-----BEGIN OPENSSH PRIVATE KEY-----`)
- **Verify server IP** and port (21098)
- **Check username** (timesovh)
- **Ensure public key** is in `~/.ssh/authorized_keys`

### **If deployment fails:**
- **Check GitHub Actions logs** for specific errors
- **Verify file paths** in the deployment script
- **Ensure permissions** are correct on the server

### **If you get permission denied:**
- **Check SSH key permissions**: `chmod 600 ~/.ssh/id_rsa`
- **Check authorized_keys permissions**: `chmod 600 ~/.ssh/authorized_keys`
- **Check .ssh folder permissions**: `chmod 700 ~/.ssh`

## 💡 **Pro Tips**

1. **Keep your SSH key secure** - never share the private key
2. **Use a strong passphrase** for your SSH key
3. **Test the connection** before setting up GitHub Actions
4. **Monitor the Actions tab** for deployment status
5. **Keep backups** of your SSH keys

---

**Once you set up these secrets, your GitHub Actions will automatically deploy to your Namecheap server every time you push to the main branch!** 🚀
