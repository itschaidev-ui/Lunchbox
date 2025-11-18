# Discord Bot Setup Guide

Complete guide to set up the Lunchbox Discord bot for credit verification and reward redemption.

## Quick Start Checklist

- [ ] Create Discord Bot Application
- [ ] Configure Discord OAuth
- [ ] Generate Firebase Service Account
- [ ] Create Discord Roles (for rewards)
- [ ] Configure Environment Variables
- [ ] Deploy Firestore Rules
- [ ] Install Bot Dependencies
- [ ] Test Bot Locally
- [ ] Deploy to Production

---

## Step 1: Create Discord Bot

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click "New Application"
3. Name it "Lunchbox" and click "Create"
4. Go to "Bot" section in left sidebar
5. Click "Add Bot"
6. **Copy the Bot Token** (you'll need this for `.env`)
7. Under "Privileged Gateway Intents", enable:
   - ✅ Server Members Intent
   - ✅ Message Content Intent
8. Save Changes

## Step 2: Configure OAuth

1. In the same application, go to "OAuth2" section
2. Click "Add Redirect" under Redirects
3. Add these URLs:
   - Development: `http://localhost:3000/auth/discord/callback`
   - Production: `https://your-domain.com/auth/discord/callback`
4. **Copy the Client ID** (shown at top)
5. Click "Reset Secret" to generate a new Client Secret
6. **Copy the Client Secret**

## Step 3: Invite Bot to Server

1. Go to OAuth2 > URL Generator
2. Select scopes:
   - ✅ `bot`
   - ✅ `applications.commands`
3. Select bot permissions:
   - ✅ Administrator (easiest)
   - Or manually select: Manage Roles, Send Messages, Use Slash Commands
4. Copy the generated URL at bottom
5. Open URL in browser and select your server
6. Authorize the bot

## Step 4: Get Discord Server/Channel IDs

### Enable Developer Mode
1. Open Discord Settings
2. Go to "Advanced"
3. Enable "Developer Mode"

### Get Server ID
1. Right-click your server name
2. Click "Copy Server ID"
3. Save this for `DISCORD_GUILD_ID`

### Get Admin Channel ID
1. Right-click the channel where you want admin notifications
2. Click "Copy Channel ID"
3. Save this for `ADMIN_CHANNEL_ID`

### Get Role IDs (Optional)
1. Go to Server Settings > Roles
2. Right-click each role you want to use for rewards
3. Click "Copy Role ID"
4. Save these for `ROLE_BRONZE_ID`, `ROLE_SILVER_ID`, etc.

## Step 5: Firebase Service Account

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Click ⚙️ (Settings) > Project Settings
4. Go to "Service Accounts" tab
5. Click "Generate New Private Key"
6. Click "Generate Key" (downloads a JSON file)
7. **Keep this file secure!** Never commit to git

### Extract Values from Service Account JSON

Open the downloaded JSON file and copy these values:

```json
{
  "project_id": "your-project-id",           // → FIREBASE_PROJECT_ID
  "private_key": "-----BEGIN PRIVATE...",    // → FIREBASE_PRIVATE_KEY
  "client_email": "firebase-adminsdk@..."    // → FIREBASE_CLIENT_EMAIL
}
```

## Step 6: Configure Discord Bot Environment

1. Navigate to `discord-bot` directory:
   ```bash
   cd discord-bot
   ```

2. Copy the example env file:
   ```bash
   cp .env.example .env
   ```

3. Edit `.env` with your values:

```env
# Discord Bot Configuration
DISCORD_BOT_TOKEN=your_bot_token_here
DISCORD_CLIENT_ID=your_client_id_here
DISCORD_CLIENT_SECRET=your_client_secret_here
DISCORD_GUILD_ID=9876543210987654321
ADMIN_CHANNEL_ID=1111222233334444555

# OAuth Configuration
OAUTH_REDIRECT_URI=http://localhost:3001/auth/discord/callback
WEBSITE_URL=http://localhost:3000

# Firebase Configuration
FIREBASE_PROJECT_ID=lunchbox-12345
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhki...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@lunchbox-12345.iam.gserviceaccount.com

# Discord Role IDs (optional)
ROLE_BRONZE_ID=1234567890123456781
ROLE_SILVER_ID=1234567890123456782
ROLE_GOLD_ID=1234567890123456783
ROLE_PREMIUM_ID=1234567890123456784

# Environment
NODE_ENV=development
LOG_LEVEL=INFO
```

**Important Notes:**
- For `FIREBASE_PRIVATE_KEY`, keep the quotes and newlines (`\n`)
- Don't commit this file to git!

## Step 7: Install Dependencies

```bash
# From discord-bot directory
npm install
```

This installs:
- `discord.js` - Discord API wrapper
- `firebase-admin` - Firebase server SDK
- `express` - OAuth server
- `dotenv` - Environment variables

## Step 8: Deploy Firestore Rules

From project root:

```bash
firebase deploy --only firestore:rules
```

This updates Firebase security rules to allow bot access to:
- `discord_links` - Account linking data
- `redemptions` - Reward redemption records
- `user_credits` - User credit balances
- `credit_transactions` - Transaction history

## Step 9: Test Locally

### Start Website (Terminal 1)
```bash
# From project root
npm run dev
```

### Start Discord Bot (Terminal 2)
```bash
# From project root
npm run bot:dev
```

### Test Commands

1. In Discord, type `/` to see bot commands
2. Try `/link email:your@email.com`
3. Check if you receive confirmation message
4. Try `/credits` to see your balance
5. Try `/rewards` to browse rewards

## Step 10: Deploy to Production

### Option A: Deploy to Firebase Functions

1. Update `discord-bot/.env` for production:
   ```env
   OAUTH_REDIRECT_URI=https://your-domain.com/auth/discord/callback
   WEBSITE_URL=https://your-domain.com
   NODE_ENV=production
   ```

2. Deploy:
   ```bash
   npm run bot:deploy
   ```

3. The bot will run as Firebase Functions:
   - `discordBot` - Main bot function
   - `discordOAuth` - OAuth callback handler

### Option B: Deploy to VPS/Server

1. SSH into your server
2. Clone repository
3. Install dependencies:
   ```bash
   cd discord-bot
   npm install --production
   ```
4. Create `.env` with production values
5. Use PM2 to keep bot running:
   ```bash
   npm install -g pm2
   pm2 start bot.js --name lunchbox-bot
   pm2 startup
   pm2 save
   ```

## Troubleshooting

### Bot Offline

**Problem:** Bot shows as offline in Discord

**Solutions:**
- Check bot token is correct in `.env`
- Verify bot is running (`npm run bot:dev`)
- Check console for errors
- Ensure no firewall blocking connections

### Commands Not Showing

**Problem:** Slash commands don't appear when typing `/`

**Solutions:**
- Wait 5-10 minutes for Discord to sync commands
- Kick and re-invite bot to server
- Check bot has `applications.commands` scope
- Restart Discord client

### Link Command Fails

**Problem:** `/link` returns "No account found"

**Solutions:**
- Verify email is correct
- Check user exists in Firebase Authentication
- Ensure Firebase Admin SDK is properly configured
- Check service account has proper permissions

### OAuth Flow Errors

**Problem:** OAuth redirect fails or shows error

**Solutions:**
- Verify redirect URI matches exactly in Discord Developer Portal
- Check `OAUTH_REDIRECT_URI` in `.env`
- Ensure OAuth server is running (port 3001)
- Check website URL is accessible

### Role Assignment Fails

**Problem:** `/redeem` succeeds but role not assigned

**Solutions:**
- Verify role IDs in `.env` match Discord roles
- Ensure bot has "Manage Roles" permission
- Check bot's role is higher than reward roles in role hierarchy
- Go to Server Settings > Roles and drag bot role above reward roles

### Firebase Permission Errors

**Problem:** "Missing or insufficient permissions"

**Solutions:**
- Deploy latest Firestore rules: `firebase deploy --only firestore:rules`
- Check service account has Firestore access
- Verify `FIREBASE_PROJECT_ID` matches Firebase project
- Check private key is properly formatted (includes newlines)

### Duplicate Credits

**Problem:** Users can earn credits multiple times

**Solutions:**
- This is prevented by `routine_completions` collection
- Verify Firestore rules are deployed
- Check routine completion logic in code

## Security Best Practices

1. **Never expose tokens:**
   - Add `.env` to `.gitignore`
   - Never commit service account JSON
   - Use environment variables in production

2. **Rotate credentials regularly:**
   - Regenerate bot token periodically
   - Rotate OAuth client secret
   - Update Firebase service account key

3. **Limit permissions:**
   - Only grant necessary Discord permissions
   - Use Firebase security rules
   - Restrict admin commands

4. **Monitor logs:**
   - Check Firebase Functions logs
   - Review bot console output
   - Track unusual redemption patterns

## Maintenance

### Update Bot

```bash
cd discord-bot
npm update
npm run bot:deploy  # If using Firebase Functions
```

### Add New Reward

1. Edit `discord-bot/rewards.js`
2. Add new entry to `REWARDS` object:
   ```javascript
   'new-reward': {
     id: 'new-reward',
     name: '🎁 New Reward',
     description: 'Description here',
     cost: 500,
     type: 'role',
     roleId: 'ROLE_ID_HERE',
     deliveryMethod: 'discord',
   },
   ```
3. Update command choices in `bot.js` (line ~200)
4. Restart bot

### View Logs

**Local:**
```bash
# Bot logs in terminal
npm run bot:dev
```

**Firebase Functions:**
```bash
firebase functions:log --only discordBot
```

Or view in Firebase Console > Functions > Logs

## Support Resources

- **Discord.js Docs:** https://discord.js.org/docs
- **Firebase Admin Docs:** https://firebase.google.com/docs/admin/setup
- **Discord Developer Portal:** https://discord.com/developers/docs

## Next Steps

After setup:

1. ✅ Test all commands in Discord
2. ✅ Verify credits update correctly
3. ✅ Test reward redemption and role assignment
4. ✅ Check admin commands work
5. ✅ Test OAuth flow from website
6. ✅ Monitor logs for errors
7. ✅ Announce bot to users
8. ✅ Create reward redemption guide

## FAQ

**Q: Can users link multiple Discord accounts?**
A: No, one Firebase UID = one Discord ID. They must unlink first.

**Q: What happens if user changes email?**
A: They need to unlink and re-link with new email.

**Q: Can I have multiple admins?**
A: Yes, anyone with Administrator permission in Discord can use admin commands.

**Q: How do I backup credit data?**
A: Export Firestore data regularly from Firebase Console.

**Q: Can I test without affecting production?**
A: Yes, create a test Discord server and use separate Firebase project.

---

**Need Help?** Contact dev team in Lunchbox Discord or open an issue on GitHub.

