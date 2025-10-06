# NovaWrite Upload Instructions for Namecheap

## Files to Upload

Upload these files to your Namecheap hosting:

### 1. Main Folder Structure
- Your main folder is `naqashthaheem.com` (not public_html)
- Upload everything from the `naqashthaheem.com/` folder to your `naqashthaheem.com/` directory

### 2. Frontend Files (to naqashthaheem.com/)
- Upload all frontend files to the root of `naqashthaheem.com/`
- This includes: index.html, assets/, images/, .htaccess, etc.

### 3. Backend Files (to naqashthaheem.com/api/)
- Upload everything from the `naqashthaheem.com/api/` folder to `naqashthaheem.com/api/`
- This includes: app/, bootstrap/, config/, database/, routes/, storage/, vendor/, etc.

## Final Structure
```
naqashthaheem.com/
├── .htaccess
├── index.html
├── assets/
├── images/
└── api/
    ├── app/
    ├── bootstrap/
    ├── config/
    ├── database/
    ├── routes/
    ├── storage/
    ├── vendor/
    ├── artisan
    ├── composer.json
    ├── composer.lock
    └── .env
```

## After Upload
1. Set proper permissions (755 for directories, 644 for files)
2. Make sure storage/ directory is writable (755)
3. Test the application at https://naqashthaheem.com
4. Test API at https://naqashthaheem.com/api

## Troubleshooting
- Check error logs in cPanel
- Verify database connection
- Test email functionality
- Check file permissions
