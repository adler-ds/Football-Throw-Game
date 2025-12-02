# Troubleshooting Salesforce Authentication

## Error: "invalid_grant: authentication failure"

This error typically indicates an issue with the OAuth 2.0 Client Credentials flow configuration. Follow these steps to resolve it:

## Step 1: Verify Connected App Configuration

### In Salesforce Setup:

1. **Navigate to Connected Apps:**
   - Setup → App Manager → Find your Connected App → View

2. **Check OAuth Settings:**
   - ✅ **Enable OAuth Settings** must be checked
   - ✅ **Callback URL** can be any valid URL (e.g., `https://localhost` or `https://your-app.herokuapp.com`)
   - ✅ **Selected OAuth Scopes** must include:
     - `Full access (full)`
     - Or at minimum: `Perform requests on your behalf at any time (refresh_token, offline_access)`

3. **Enable Client Credentials Flow:**
   - The Connected App must support **OAuth 2.0 Client Credentials Flow**
   - This is typically enabled by default, but verify in the Connected App settings

4. **Check Consumer Key and Secret:**
   - Verify the Consumer Key matches `SALESFORCE_CLIENT_ID`
   - Verify the Consumer Secret matches `SALESFORCE_CLIENT_SECRET`
   - **Important:** Consumer Secret is only shown once when created. If you don't have it, you'll need to reset it.

## Step 2: Verify Environment Variables

Check that all Heroku config vars are set correctly:

```bash
heroku config --app your-app-name
```

You should see:
- `SALESFORCE_CLIENT_ID` - Must match the Consumer Key exactly
- `SALESFORCE_CLIENT_SECRET` - Must match the Consumer Secret exactly
- `SALESFORCE_LOGIN_URL` - Must match your Salesforce instance URL

### Common Issues:

1. **Extra spaces or newlines:**
   ```bash
   # Check for hidden characters
   heroku config:get SALESFORCE_CLIENT_ID --app your-app-name | od -c
   ```

2. **Wrong login URL format:**
   - Should be: `https://your-instance.salesforce.com` or `https://your-instance.my.salesforce.com`
   - For sandboxes: `https://your-instance--sandboxname.sandbox.my.salesforce.com`
   - For your instance: `https://loyaltysampleappcom-a-dev-ed.develop.my.salesforce-setup.com`

## Step 3: Test Authentication Directly

You can test the OAuth 2.0 Client Credentials flow directly using curl:

```bash
curl -X POST https://loyaltysampleappcom-a-dev-ed.develop.my.salesforce-setup.com/services/oauth2/token \
  -d "grant_type=client_credentials" \
  -d "client_id=YOUR_CONSUMER_KEY" \
  -d "client_secret=YOUR_CONSUMER_SECRET" \
  -H "Content-Type: application/x-www-form-urlencoded"
```

**Expected Success Response:**
```json
{
  "access_token": "00D...",
  "instance_url": "https://...",
  "id": "https://login.salesforce.com/id/...",
  "token_type": "Bearer",
  "issued_at": "1234567890",
  "signature": "..."
}
```

**If you get an error**, it will tell you what's wrong:
- `invalid_client_id` - Consumer Key is wrong
- `invalid_client` - Consumer Secret is wrong
- `invalid_grant` - Connected App not configured for Client Credentials flow

## Step 4: Check Connected App Permissions

1. **User Permissions:**
   - The Connected App might need specific user permissions
   - Check: Setup → Connected Apps → Your App → Manage → Edit Policies

2. **IP Restrictions:**
   - If IP restrictions are enabled, Heroku's IPs might be blocked
   - Consider relaxing IP restrictions for testing

3. **Admin Approved Users:**
   - If "Admin approved users are pre-authorized" is enabled, you may need to pre-authorize

## Step 5: Verify API Access

Ensure the Connected App has API access enabled:

1. Setup → Connected Apps → Your App → Manage → Edit Policies
2. Check **Permitted Users** settings
3. For Client Credentials flow, typically needs "All users may self-authorize" or "Admin approved users are pre-authorized"

## Step 6: Check Heroku Logs

View detailed error messages:

```bash
heroku logs --tail --app your-app-name
```

Look for:
- Authentication attempts
- Error messages with details
- Token request failures

## Common Solutions

### Solution 1: Reset Consumer Secret

If you don't have the Consumer Secret:

1. Setup → App Manager → Your Connected App → View
2. Click **Manage Consumer Details**
3. Click **Reset Secret**
4. Copy the new secret
5. Update Heroku config var:
   ```bash
   heroku config:set SALESFORCE_CLIENT_SECRET=new_secret --app your-app-name
   ```

### Solution 2: Verify Login URL

The login URL must match your Salesforce instance exactly:

- Production: `https://login.salesforce.com` or `https://yourinstance.salesforce.com`
- Sandbox: `https://test.salesforce.com` or `https://yourinstance--sandbox.sandbox.my.salesforce.com`
- Your instance: `https://loyaltysampleappcom-a-dev-ed.develop.my.salesforce-setup.com`

### Solution 3: Enable Client Credentials Flow

If Client Credentials flow is not enabled:

1. Setup → App Manager → Your Connected App → View
2. Check OAuth Settings
3. Ensure "Enable OAuth Settings" is checked
4. Save changes

## Still Having Issues?

1. **Double-check all credentials** - Copy/paste directly from Salesforce
2. **Test with curl** - Use the curl command above to isolate the issue
3. **Check Salesforce documentation** - [OAuth 2.0 Client Credentials Flow](https://help.salesforce.com/s/articleView?id=sf.remoteaccess_oauth_client_credentials_flow.htm)
4. **Contact Salesforce support** - If the Connected App configuration seems correct but still failing

## Debug Mode

To get more detailed error information, check the Heroku logs:

```bash
heroku logs --tail --app your-app-name | grep -i "salesforce\|auth\|error"
```

This will show detailed authentication attempts and any error messages from Salesforce.

