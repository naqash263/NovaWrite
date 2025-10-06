# Google OAuth Login Setup

This guide will help you set up Google OAuth login for your Laravel/React application.

## Prerequisites

1. **Google Cloud Console Account** - You need access to Google Cloud Console
2. **Domain Configuration** - Your application should be running on a proper domain (for production)

## Step 1: Create Google OAuth Application

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API:
   - Go to "APIs & Services" > "Library"
   - Search for "Google+ API" and enable it
   - Also enable "Google OAuth2 API"

4. Create OAuth 2.0 credentials:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth 2.0 Client IDs"
   - Choose "Web application"
   - Set the name (e.g., "Portfolio OAuth")

5. Configure redirect URIs:
   - **Development**: `http://localhost:3000/auth/google/callback`
   - **Production**: `https://yourdomain.com/auth/google/callback`

6. Note down your:
   - **Client ID** (looks like: `123456789-abcdefg.apps.googleusercontent.com`)
   - **Client Secret** (looks like: `GOCSPX-abcdefghijklmnopqrstuvwxyz`)

## Step 2: Configure Backend Environment

Add the following variables to your `.env` file:

```env
# Google OAuth Configuration
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:3000/auth/google/callback

# For production, use your actual domain:
# GOOGLE_REDIRECT_URI=https://yourdomain.com/auth/google/callback
```

## Step 3: Frontend Configuration

The frontend is already configured to work with the Google OAuth flow. The callback URL should match what you set in Google Cloud Console.

## Step 4: Test the Integration

1. **Start your backend server**:
   ```bash
   cd backend
   php artisan serve
   ```

2. **Start your frontend server**:
   ```bash
   cd frontend
   npm run dev
   ```

3. **Test the login flow**:
   - Go to `/login` page
   - Click "Continue with Google"
   - You should be redirected to Google's OAuth consent screen
   - After authorization, you should be logged in and redirected appropriately

## Step 5: Production Deployment

### Backend Updates
1. Update your `.env` file with production values:
   ```env
   GOOGLE_REDIRECT_URI=https://yourdomain.com/auth/google/callback
   ```

2. Clear and cache the configuration:
   ```bash
   php artisan config:clear
   php artisan config:cache
   ```

### Frontend Updates
1. Update your frontend build configuration if needed
2. Ensure the callback URL matches your production domain

### Google Cloud Console Updates
1. Add your production domain to authorized origins
2. Add your production callback URL to redirect URIs

## API Endpoints

The following endpoints are available for Google OAuth:

### Public Endpoints
- `GET /api/auth/google/redirect` - Get Google OAuth redirect URL
- `POST /api/auth/google/callback` - Handle Google OAuth callback

### Authenticated Endpoints
- `GET /api/auth/google/status` - Check if Google account is linked
- `POST /api/auth/google/unlink` - Unlink Google account
- `POST /api/auth/google/set-password` - Set password for Google OAuth users

## Features Included

1. **New User Registration**: Automatically creates new users from Google accounts
2. **Account Linking**: Links Google accounts to existing email matches
3. **Avatar Integration**: Uses Google profile pictures as user avatars
4. **Email Verification**: Google emails are automatically verified
5. **Secure Authentication**: Full JWT token integration
6. **Activity Logging**: All Google OAuth activities are logged
7. **Account Management**: Users can unlink Google accounts and set passwords

## Security Considerations

1. **HTTPS Required**: For production, always use HTTPS
2. **Domain Verification**: Verify domains in Google Cloud Console
3. **Environment Variables**: Keep client secrets secure and never commit them
4. **CORS Configuration**: Ensure proper CORS settings for your domains
5. **Rate Limiting**: Consider implementing rate limiting for OAuth endpoints

## Troubleshooting

### Common Issues

1. **"redirect_uri_mismatch" error**:
   - Check that your redirect URI in Google Cloud Console exactly matches your application URL
   - Ensure no trailing slashes or case mismatches

2. **"invalid_client" error**:
   - Verify your client ID and secret are correct
   - Check that the OAuth consent screen is configured

3. **Popup blocked**:
   - Users need to allow popups for your domain
   - Consider implementing a fallback redirect method

4. **CORS errors**:
   - Ensure your backend CORS configuration allows your frontend domain
   - Check that credentials are included in requests

### Debug Mode

To enable debug mode for OAuth issues, you can check the activity logs in the admin panel or monitor the Laravel logs.

## Support

If you encounter issues:
1. Check the browser console for JavaScript errors
2. Check Laravel logs for backend errors
3. Verify all environment variables are set correctly
4. Ensure Google Cloud Console configuration matches your setup