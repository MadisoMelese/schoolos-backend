# Password Reset Implementation Guide

This document explains how to set up and use the production-ready password reset functionality in SchoolOS.

## Overview

The password reset system uses:
- **Backend**: Node.js with Express, MongoDB, and Nodemailer
- **Frontend**: React with React Router and React Hook Form
- **Email**: SMTP (Gmail, SendGrid, or any SMTP provider)

## Backend Setup

### 1. Install Dependencies

```bash
npm install nodemailer
npm install --save-dev @types/nodemailer
```

### 2. Configure Environment Variables

Add the following to your `.env` file:

```env
# Email Configuration (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM_EMAIL=noreply@schoolos.com
SMTP_FROM_NAME=SchoolOS
```

### 3. Gmail Setup (Recommended for Development)

1. Enable 2-Factor Authentication on your Google Account
2. Generate an App Password:
   - Go to https://myaccount.google.com/apppasswords
   - Select "Mail" and "Windows Computer" (or your device)
   - Copy the generated 16-character password
   - Use this as `SMTP_PASS` in your `.env` file

### 4. Other Email Providers

**SendGrid:**
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=SG.your-sendgrid-api-key
```

**Mailgun:**
```env
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USER=postmaster@your-domain.mailgun.org
SMTP_PASS=your-mailgun-password
```

## API Endpoints

### 1. Request Password Reset

**Endpoint:** `POST /api/auth/password-reset`

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "If an account exists with this email, a password reset link will be sent."
}
```

**Note:** The response is the same whether the email exists or not (for security).

### 2. Confirm Password Reset

**Endpoint:** `POST /api/auth/password-reset/confirm`

**Request Body:**
```json
{
  "resetToken": "token-from-email",
  "newPassword": "NewPassword123!"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password reset successfully. Please login with your new password."
}
```

## Frontend Setup

### 1. Password Reset Page

The password reset page is located at `/password-reset` and supports two flows:

#### Flow 1: Request Reset
- User enters their email
- Backend sends reset link to email
- User clicks link in email

#### Flow 2: Confirm Reset
- User is redirected to `/password-reset?token=<reset-token>`
- User enters new password
- Password is updated and user is redirected to login

### 2. Password Requirements

Passwords must contain:
- At least 8 characters
- At least one uppercase letter (A-Z)
- At least one lowercase letter (a-z)
- At least one number (0-9)
- At least one special character (!@#$%^&*)

Example: `MyPassword123!`

## Email Templates

The system includes two email templates:

### 1. Password Reset Email

Sent when user requests a password reset. Includes:
- User's first name
- Reset link with token
- Link expiration time (1 hour)
- Plain text version of the link

### 2. Welcome Email (Optional)

Can be sent when a new user account is created. Includes:
- Welcome message
- Temporary password (if applicable)
- Login link

## Security Features

1. **Token Hashing**: Reset tokens are hashed using bcrypt before storage
2. **Token Expiration**: Tokens expire after 1 hour
3. **One-Time Use**: Tokens are deleted after successful password reset
4. **Session Invalidation**: All user sessions are cleared after password reset
5. **Token Version**: User's token version is incremented to invalidate old tokens
6. **Email Verification**: Email existence is not revealed for security

## Development vs Production

### Development Mode

If SMTP credentials are not configured:
- Reset tokens are logged to console
- Emails are not sent
- You can manually test the reset flow using the token from logs

Example console output:
```
[DEV] Password reset token for user@example.com: abc123def456ghi789
```

### Production Mode

- Emails are sent via configured SMTP server
- Tokens are not logged
- All security features are active

## Testing the Password Reset Flow

### Manual Testing

1. **Request Reset:**
   ```bash
   curl -X POST http://localhost:5000/api/auth/password-reset \
     -H "Content-Type: application/json" \
     -d '{"email":"user@example.com"}'
   ```

2. **Check Console** (development):
   - Look for the reset token in console logs

3. **Confirm Reset:**
   ```bash
   curl -X POST http://localhost:5000/api/auth/password-reset/confirm \
     -H "Content-Type: application/json" \
     -d '{"resetToken":"token-from-console","newPassword":"NewPassword123!"}'
   ```

### Frontend Testing

1. Navigate to `/password-reset`
2. Enter your email address
3. Click "Send Reset Link"
4. In development, check backend console for token
5. Manually navigate to `/password-reset?token=<token>`
6. Enter new password and confirm
7. Click "Reset Password"
8. You should be redirected to login page

## Troubleshooting

### Emails Not Sending

1. **Check SMTP credentials:**
   - Verify `SMTP_USER` and `SMTP_PASS` are correct
   - For Gmail, ensure you're using App Password, not regular password

2. **Check firewall/network:**
   - Ensure port 587 (or 465) is not blocked
   - Check if your ISP blocks SMTP

3. **Check logs:**
   - Look for error messages in backend console
   - Enable debug logging in nodemailer

### Token Expired

- Tokens expire after 1 hour
- User must request a new reset link

### Password Requirements Not Met

- Ensure password meets all requirements
- Check error message for specific requirement

## File Structure

```
SchoolOS-backend/
├── src/
│   ├── config/
│   │   └── env.ts                 # Environment configuration
│   ├── controllers/
│   │   └── user.controller.ts     # Password reset controllers
│   ├── routes/
│   │   └── auth.routes.ts         # Password reset routes
│   ├── services/
│   │   └── user.service.ts        # Password reset service logic
│   └── utils/
│       └── emailService.ts        # Email sending utility

schoolos-frontend/
├── src/
│   └── features/
│       └── auth/
│           └── pages/
│               └── PasswordResetPage.tsx  # Password reset UI
```

## Next Steps

1. Configure SMTP credentials in `.env`
2. Test the password reset flow
3. Customize email templates if needed
4. Deploy to production

## Support

For issues or questions, please refer to:
- Nodemailer Documentation: https://nodemailer.com/
- Express Documentation: https://expressjs.com/
- React Hook Form Documentation: https://react-hook-form.com/
