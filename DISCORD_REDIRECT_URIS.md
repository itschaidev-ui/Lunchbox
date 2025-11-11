# Discord OAuth Redirect URIs Configuration

## 📋 Add These Redirect URIs to Discord Developer Portal

Go to: https://discord.com/developers/applications/1435366859154129059/oauth2

Click "Add Redirect" and add **BOTH** of these URLs:

### For Local Development:
```
http://localhost:3000/auth/discord/callback
```

### For Production (after deployment):
```
https://studio-7195653935-eecd8.web.app/auth/discord/callback
```

---

## ✅ OAuth Scopes Required

In Discord Developer Portal > OAuth2 > URL Generator, select these scopes:

- ✅ `identify` - Get user's Discord ID and username
- ✅ `email` - Get user's email (for linking to Firebase account)
- ✅ `guilds` - See servers user is in (optional)

**Note:** Since you're using Administrator permissions for the bot, it will have all necessary permissions. The OAuth scopes above are just for the user authorization flow.

---

## 🤖 Bot Invite URL

Use this URL to invite the bot to your server (already has Administrator permission):

### URL Generator Settings:
1. Go to: https://discord.com/developers/applications/1435366859154129059/oauth2/url-generator

2. **Scopes:**
   - ✅ `bot`
   - ✅ `applications.commands`

3. **Bot Permissions:**
   - ✅ Administrator (you said you're using this, so just check this one box)

4. **Generated URL will look like:**
```
https://discord.com/api/oauth2/authorize?client_id=1435366859154129059&permissions=8&scope=bot%20applications.commands
```

**Copy the generated URL and open it in your browser to invite the bot to your server.**

---

## 🔧 Quick Setup Checklist

- [x] Bot Token configured in `.env`
- [x] Client ID configured in `.env`
- [x] Client Secret configured in `.env`
- [ ] **Add redirect URIs in Discord Developer Portal** (see above)
- [ ] **Get your Discord Server ID** (right-click server name > Copy Server ID)
- [ ] **Get your Admin Channel ID** (right-click channel > Copy Channel ID)
- [ ] **Get Firebase Service Account credentials**
- [ ] **Create reward roles in Discord** (Bronze, Silver, Gold, Premium)
- [ ] **Invite bot to your server** (using URL above)

---

## 📝 Next Steps

### 1. Add Redirect URIs to Discord:
1. Go to: https://discord.com/developers/applications/1435366859154129059/oauth2
2. Scroll to "Redirects"
3. Click "Add Redirect"
4. Paste: `http://localhost:3000/auth/discord/callback`
5. Click "Add Another"
6. Paste: `https://studio-7195653935-eecd8.web.app/auth/discord/callback`
7. Click "Save Changes"

### 2. Get Your Server and Channel IDs:
1. In Discord, enable Developer Mode (Settings > Advanced > Developer Mode)
2. Right-click your server name → "Copy Server ID"
3. Update `DISCORD_GUILD_ID` in `.env`
4. Right-click the channel where you want bot notifications → "Copy Channel ID"
5. Update `ADMIN_CHANNEL_ID` in `.env`

### 3. Get Firebase Service Account:
1. Go to: https://console.firebase.google.com/project/studio-7195653935-eecd8/settings/serviceaccounts
2. Click "Generate New Private Key"
3. Download the JSON file
4. Open it and copy the values to `.env`:
   - `project_id` → `FIREBASE_PROJECT_ID`
   - `private_key` → `FIREBASE_PRIVATE_KEY` (keep the quotes and \n characters!)
   - `client_email` → `FIREBASE_CLIENT_EMAIL`

### 4. Create Discord Roles (Optional for Rewards):
1. Go to Server Settings > Roles
2. Create roles: "Bronze Badge", "Silver Badge", "Gold Badge", "Premium"
3. Right-click each role → "Copy Role ID"
4. Update `ROLE_BRONZE_ID`, etc. in `.env`

### 5. Invite Bot to Server:
1. Use URL Generator: https://discord.com/developers/applications/1435366859154129059/oauth2/url-generator
2. Check: `bot` and `applications.commands`
3. Check: `Administrator`
4. Copy generated URL and open in browser
5. Select your server and authorize

### 6. Install Dependencies:
```bash
cd discord-bot
npm install
```

### 7. Test the Bot:
```bash
npm run bot:dev
```

### 8. Try Commands in Discord:
```
/link email:your@email.com
/credits
/rewards
```

---

## 🎯 Summary

**Redirect URIs to add in Discord:**
- `http://localhost:3000/auth/discord/callback` (development)
- `https://studio-7195653935-eecd8.web.app/auth/discord/callback` (production)

**Bot Permissions:** Administrator (already selected ✅)

**OAuth Scopes:** `identify`, `email` (for OAuth flow)

**Still Need:**
- Server ID
- Admin Channel ID  
- Firebase Service Account credentials
- Discord Role IDs (optional)

Once you add the redirect URIs and complete the remaining configuration, you'll be ready to test!

