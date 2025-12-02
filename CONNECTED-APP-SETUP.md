# Connected App Configuration for OAuth 2.0 Client Credentials Flow

## The Error

The error "request not supported on this domain" when using `login.salesforce.com` typically means:

**The Connected App is not configured to support OAuth 2.0 Client Credentials flow.**

## Required Connected App Configuration

### Step 1: Enable OAuth Settings

1. In Salesforce, go to **Setup** → **App Manager**
2. Find your Connected App → Click **View**
3. Click **Edit**
4. Under **API (Enable OAuth Settings)**, check:
   - ✅ **Enable OAuth Settings**

### Step 2: Configure OAuth Scopes

Under **Selected OAuth Scopes**, you need:
- **Manage user data via APIs (api)** - **REQUIRED for REST API access**
- **Full access (full)** - OR
- **Perform requests on your behalf at any time (refresh_token, offline_access)**

**Important:** 
- The **"Manage user data via APIs (api)"** scope is **essential** for REST API calls
- Without this scope, tokens may authenticate but fail with "INVALID_SESSION_ID" for REST API
- The Client Credentials flow requires specific scopes. Make sure at least one of these is selected.

### Step 3: Enable Client Credentials Flow

The Connected App must explicitly support Client Credentials flow:

1. In the Connected App settings, look for:
   - **OAuth Policies** section
   - **Permitted Users** should be set to allow the flow
   
2. For Client Credentials flow, you typically need:
   - **Permitted Users**: "All users may self-authorize" OR "Admin approved users are pre-authorized"
   - **IP Relaxation**: May need to be relaxed for Heroku IPs

### Step 3.5: Configure Run-As User (CRITICAL for REST API)

**This is the most important step for REST API access!**

For Client Credentials flow tokens to work with REST API, you MUST configure a "Run-As User":

1. In the Connected App settings, find **OAuth Policies** section
2. Set **Permitted Users** to: **"Admin approved users are pre-authorized"**
3. **Click Save** - This will reveal the **Run-As User** field
4. Select a **Run-As User** from the dropdown
   - This user must have:
     - ✅ **API Enabled** permission in their profile
     - ✅ Permissions to access the objects/APIs you need
     - ✅ Appropriate security settings (not locked to IP, etc.)
5. **Save** the Connected App

**Why this is critical:**
- Without a Run-As User, Client Credentials tokens may authenticate but fail with "INVALID_SESSION_ID" for REST API calls
- The Run-As User provides the security context for all API calls made with this token
- The token will inherit the permissions of the Run-As User

### Step 4: Verify Consumer Key and Secret

1. In the Connected App, click **Manage Consumer Details**
2. Verify the **Consumer Key** matches your `SALESFORCE_CLIENT_ID`
3. If you don't have the **Consumer Secret**, click **Reset Secret** and update Heroku config

## Alternative: Check if Client Credentials is Supported

Not all Salesforce orgs support Client Credentials flow. Check:

1. **Salesforce Edition**: Some editions may not support this flow
2. **API Access**: Ensure API access is enabled for your org
3. **Connected App Type**: Some Connected App types may not support Client Credentials

## Testing the Configuration

After updating the Connected App, test directly:

```bash
curl -X POST https://login.salesforce.com/services/oauth2/token \
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

**If you still get "request not supported on this domain":**
- The Connected App may not support Client Credentials flow
- You may need to use a different OAuth flow (Username/Password, JWT Bearer, etc.)

## Alternative OAuth Flows

If Client Credentials flow is not supported, consider:

1. **Username/Password Flow** (for server-to-server)
2. **JWT Bearer Token Flow** (requires certificate)
3. **Web Server Flow** (requires user interaction)

## Next Steps

1. **Verify Connected App settings** in Salesforce
2. **Test with curl** to isolate the issue
3. **Check Salesforce documentation** for your org's OAuth capabilities
4. **Contact Salesforce support** if the Connected App appears correctly configured but still fails

