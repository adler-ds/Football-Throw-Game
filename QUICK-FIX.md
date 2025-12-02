# Quick Fix for "request not supported on this domain" Error

## The Issue

The error occurs because custom Salesforce domains don't support OAuth token endpoints. The fix has been deployed, but you need to:

1. **Redeploy to Heroku** (if not auto-deployed)
2. **Verify the token endpoint being used**

## Step 1: Check Heroku Logs

Check what token endpoint is being used:

```bash
heroku logs --tail --app your-app-name | grep -i "token endpoint\|Detected"
```

You should see:
```
Detected sandbox instance - using test.salesforce.com
Using token endpoint: https://test.salesforce.com/services/oauth2/token
```

If you see the custom domain in the logs, the code hasn't been deployed yet.

## Step 2: Force Redeploy

If using GitHub auto-deploy, trigger a redeploy:

```bash
# Option 1: Push an empty commit
git commit --allow-empty -m "Trigger redeploy"
git push heroku main

# Option 2: Restart the app (forces reload)
heroku restart --app your-app-name
```

## Step 3: Manual Override (If Needed)

If the automatic detection isn't working, you can manually set the token endpoint by adding a new config var:

```bash
# For sandbox (your case)
heroku config:set SALESFORCE_TOKEN_ENDPOINT=https://test.salesforce.com/services/oauth2/token --app your-app-name

# For production
heroku config:set SALESFORCE_TOKEN_ENDPOINT=https://login.salesforce.com/services/oauth2/token --app your-app-name
```

Then update the code to check for this override first.

## Step 4: Test Directly

Test the token endpoint directly:

```bash
curl -X POST https://test.salesforce.com/services/oauth2/token \
  -d "grant_type=client_credentials" \
  -d "client_id=YOUR_CONSUMER_KEY" \
  -d "client_secret=YOUR_CONSUMER_SECRET" \
  -H "Content-Type: application/x-www-form-urlencoded"
```

If this works, the issue is just that the code needs to be redeployed.

## Current Status

The code should automatically:
- Detect sandbox instances (by checking for `-dev-ed`, `develop`, etc.)
- Use `https://test.salesforce.com/services/oauth2/token` for sandboxes
- Use `https://login.salesforce.com/services/oauth2/token` for production

Your instance URL `loyaltysampleappcom-a-dev-ed.develop.my.salesforce-setup.com` contains both `-dev-ed` and `develop`, so it should definitely use `test.salesforce.com`.

