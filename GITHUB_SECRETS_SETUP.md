# 🔐 GitHub Secrets Setup Guide

This guide will help you set up the required GitHub secrets for automated deployment.

## Required Secrets

You need to set up the following secrets in your GitHub repository:

### 1. HOST
- **Value**: Your Namecheap server hostname or IP
- **Example**: `162.254.39.126` or `server123.web-hosting.com`

### 2. USERNAME
- **Value**: Your Namecheap cPanel username
- **Example**: `timesovh`

### 3. SSH_KEY
- **Value**: Your private SSH key content
- **How to get**: 
  ```bash
  cat ~/.ssh/id_rsa
  ```
  Copy the entire content including `-----BEGIN OPENSSH PRIVATE KEY-----` and `-----END OPENSSH PRIVATE KEY-----`

### 4. SSH_PASSPHRASE
- **Value**: Passphrase for your SSH key (if any)
- **Example**: `your_passphrase_here` or leave empty if no passphrase

## How to Set Up Secrets

1. Go to your GitHub repository
2. Click on **Settings** tab
3. Click on **Secrets and variables** → **Actions**
4. Click **New repository secret**
5. Add each secret with the name and value as specified above

## Testing SSH Connection

Before setting up secrets, test your SSH connection:

```bash
ssh -p 21098 timesovh@162.254.39.126
```

## Troubleshooting

### Common Issues:

1. **Port Error**: Make sure you're using port `21098`
2. **SSH Key**: Ensure your private key is correctly formatted
3. **Host**: Use the correct server hostname or IP
4. **Username**: Use your exact cPanel username

### Debug Mode:

Add this to your workflow to debug connection issues:

```yaml
- name: Test SSH Connection
  uses: appleboy/ssh-action@v0.1.5
  with:
    host: ${{ secrets.HOST }}
    username: ${{ secrets.USERNAME }}
    key: ${{ secrets.SSH_KEY }}
    passphrase: ${{ secrets.SSH_PASSPHRASE }}
    port: 21098
    script: |
      echo "SSH connection successful!"
      whoami
      pwd
```

## Security Notes

- Never commit SSH keys to your repository
- Use GitHub secrets for all sensitive information
- Regularly rotate your SSH keys
- Monitor your deployment logs for any issues