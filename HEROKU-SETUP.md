# Heroku Configuration for Salesforce Integration

## Setting Salesforce Credentials in Heroku

The error "Salesforce credentials not configured" means the environment variables are not set in Heroku. Follow these steps to fix it:

## Option 1: Using Heroku CLI (Recommended)

### Step 1: Set Your App Name
```bash
# Replace 'your-app-name' with your actual Heroku app name
export HEROKU_APP_NAME=your-app-name
```

### Step 2: Set Config Vars
Run these commands to set the Salesforce credentials:

```bash
heroku config:set SALESFORCE_CLIENT_ID=your_consumer_key_here --app $HEROKU_APP_NAME

heroku config:set SALESFORCE_CLIENT_SECRET=your_consumer_secret_here --app $HEROKU_APP_NAME

heroku config:set SALESFORCE_LOGIN_URL=https://your-instance.salesforce.com --app $HEROKU_APP_NAME
```

### Step 3: Verify Configuration
```bash
heroku config --app $HEROKU_APP_NAME
```

You should see:
- `SALESFORCE_CLIENT_ID`
- `SALESFORCE_CLIENT_SECRET`
- `SALESFORCE_LOGIN_URL`

### Step 4: Restart the App
```bash
heroku restart --app $HEROKU_APP_NAME
```

## Option 2: Using Heroku Dashboard

1. Go to [Heroku Dashboard](https://dashboard.heroku.com)
2. Select your app
3. Go to **Settings** tab
4. Click **Reveal Config Vars**
5. Add the following variables:

| Key | Value |
|-----|-------|
| `SALESFORCE_CLIENT_ID` | `your_consumer_key_here` |
| `SALESFORCE_CLIENT_SECRET` | `your_consumer_secret_here` |
| `SALESFORCE_LOGIN_URL` | `https://your-instance.salesforce.com` |

6. Click **Add** for each variable
7. Restart your app (Settings → Restart all dynos)

## Option 3: Using the Script

A helper script is provided:

```bash
# Set your app name
export HEROKU_APP_NAME=your-app-name

# Run the script
./set-heroku-config.sh
```

## Verify the Fix

After setting the config vars and restarting:

1. Check the logs:
```bash
heroku logs --tail --app $HEROKU_APP_NAME
```

You should see:
```
✅ Salesforce credentials detected
✅ Successfully authenticated with Salesforce
```

2. Test the API endpoint:
```bash
curl https://your-app-name.herokuapp.com/api/salesforce/test
```

## Troubleshooting

### Still Getting "Credentials not configured" Error?

1. **Verify config vars are set:**
   ```bash
   heroku config --app your-app-name
   ```

2. **Check for typos** in the variable names:
   - Must be exactly: `SALESFORCE_CLIENT_ID`
   - Must be exactly: `SALESFORCE_CLIENT_SECRET`
   - Must be exactly: `SALESFORCE_LOGIN_URL`

3. **Restart the app** after setting config vars:
   ```bash
   heroku restart --app your-app-name
   ```

4. **Check server logs** for detailed error messages:
   ```bash
   heroku logs --tail --app your-app-name
   ```

## Security Note

⚠️ **Never commit credentials to Git!** The `.env` file is already in `.gitignore` and should never be committed. Credentials should only be:
- Stored locally in `.env` (for development)
- Set as Heroku Config Vars (for production)

