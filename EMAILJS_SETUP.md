# EmailJS Setup Guide for Feedback System

## 🚀 Quick Setup Steps

### 1. Create EmailJS Account
1. Go to [https://www.emailjs.com/](https://www.emailjs.com/)
2. Sign up for a free account
3. Verify your email address

### 2. Add Email Service
1. Go to **Email Services** in your EmailJS dashboard
2. Click **Add New Service**
3. Choose **Gmail** (or your preferred email provider)
4. Connect your Gmail account (`itschaidev@gmail.com`)
5. **Copy the Service ID** (you'll need this)

### 3. Create Email Template
1. Go to **Email Templates** in your EmailJS dashboard
2. Click **Create New Template**
3. Use this template:

**Subject:** `{{subject}}`

**Content (HTML):**
```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
        .header { background: #ff6b6b; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f8f9fa; padding: 20px; border-radius: 0 0 8px 8px; }
        .user-info { background: white; padding: 15px; border-radius: 5px; margin: 10px 0; border-left: 4px solid #007bff; }
        .feedback-section { background: #e3f2fd; padding: 15px; border-radius: 5px; margin: 10px 0; }
        .summary { background: #fff3cd; padding: 15px; border-radius: 5px; margin: 10px 0; border-left: 4px solid #ffc107; }
        .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; padding-top: 15px; border-top: 1px solid #ddd; }
        .highlight { background: #fff; padding: 10px; border-radius: 3px; border: 1px solid #ddd; }
    </style>
</head>
<body>
    <div class="header">
        <h2>🚨 NEW USER FEEDBACK REQUEST 🚨</h2>
    </div>
    
    <div class="content">
        <div class="user-info">
            <h3>👤 User Information</h3>
            <p><strong>Name:</strong> {{from_name}}</p>
            <p><strong>Email:</strong> {{from_email}}</p>
            <p><strong>Reply to:</strong> {{reply_to}}</p>
        </div>
        
        <div class="feedback-section">
            <h3>📝 WHAT THE USER IS ASKING FOR:</h3>
            <div class="highlight">{{user_feedback}}</div>
        </div>
        
        <div class="summary">
            <h3>📧 QUICK SUMMARY:</h3>
            <p>{{user_request}}</p>
        </div>
        
        <div class="footer">
            <p><strong>⏰ Received:</strong> {{current_date}}</p>
            <p>This feedback was sent from the Lunchbox AI website.</p>
            <p><strong>Please respond to the user's request at:</strong> {{reply_to}}</p>
        </div>
    </div>
</body>
</html>
```

4. **Copy the Template ID** (you'll need this)

**Important:** Make sure to select **HTML** as the content type in EmailJS when creating the template, not plain text.

### 4. Get Public Key
1. Go to **Account** → **General**
2. **Copy your Public Key** (you'll need this)

### 5. Update the Code
Replace these placeholders in `/src/app/docs/faq/page.tsx`:

```typescript
// Line 76: Replace YOUR_PUBLIC_KEY
emailjs.init('YOUR_ACTUAL_PUBLIC_KEY');

// Line 80: Replace YOUR_SERVICE_ID  
'YOUR_ACTUAL_SERVICE_ID',

// Line 81: Template ID (✅ DONE)
'template_kcmvp1a',
```

**✅ Template ID Updated:** `template_kcmvp1a` has been set in the code.
**✅ Service ID Updated:** `service_hg7n139` has been set in the code.
**✅ Public Key Updated:** `TSwFpk0978_sYw4MH` has been set in the code.

**🎉 SETUP COMPLETE!** All EmailJS credentials have been configured.

## 📧 What Happens After Setup

When users submit feedback:
1. **Form submits** → EmailJS sends email
2. **Email sent** → To `itschaidev@gmail.com`
3. **User sees success** → Toast notification
4. **You receive email** → With beautifully formatted HTML email

## 🎨 HTML Email Features

The HTML template includes:
- **Professional styling** - Clean, modern design
- **Color-coded sections** - Easy to scan and read
- **Responsive layout** - Works on all email clients
- **Clear hierarchy** - User info, feedback, and summary sections
- **Visual indicators** - Emojis and colors for quick identification
- **Mobile-friendly** - Optimized for mobile email viewing

## 🔧 Template Variables

The template uses these variables:
- `{{from_name}}` - User's name
- `{{from_email}}` - User's email  
- `{{user_feedback}}` - What the user is asking for/feedback message
- `{{user_request}}` - Quick summary of user's request
- `{{reply_to}}` - Reply-to email (user's email)
- `{{subject}}` - Email subject
- `{{current_date}}` - Current date/time

## ✅ Testing

After setup:
1. Fill out the feedback form
2. Submit feedback
3. Check `itschaidev@gmail.com` for the email
4. Verify all information is correct

## 🆓 Free Tier Limits

EmailJS free tier includes:
- 200 emails per month
- 1 email service
- 2 email templates
- Perfect for feedback system!

## 🚨 Important Notes

- **Keep your keys secure** - Don't commit them to public repos
- **Test thoroughly** - Make sure emails are delivered
- **Monitor usage** - Stay within free tier limits
- **Backup template** - Save your email template

## 🆘 Troubleshooting

**Common Issues:**
1. **Invalid service ID** - Double-check service ID
2. **Template not found** - Verify template ID
3. **Public key error** - Check public key format
4. **Gmail connection** - Reconnect Gmail service

**Need Help?**
- EmailJS Documentation: https://www.emailjs.com/docs/
- Support: https://www.emailjs.com/support/
