# Setup Guide - Football Throw Game with Salesforce Integration

## Prerequisites

You need to have Node.js and npm installed. If you don't have them:

### Install Node.js

**macOS (using Homebrew):**
```bash
brew install node
```

**Or download from:**
https://nodejs.org/

**Verify installation:**
```bash
node --version
npm --version
```

## Setup Steps

### 1. Install Dependencies

```bash
cd "/Users/dadler/Cursor Projects/Football-Throw-Game"
npm install
```

This will install:
- express (web server)
- jsforce (Salesforce API library)
- dotenv (environment variables)
- cors (CORS middleware)

### 2. Environment Variables

The `.env` file has been created with your Salesforce credentials:
- ✅ SALESFORCE_LOGIN_URL
- ✅ SALESFORCE_CLIENT_ID
- ✅ SALESFORCE_CLIENT_SECRET

**Important:** The `.env` file is already in `.gitignore` and will NOT be committed to version control.

### 3. Test Salesforce Connection

```bash
node test-salesforce.js
```

This will:
- Test authentication with Salesforce
- Query organization information
- List available Salesforce objects
- Verify API access

### 4. Start the Server

```bash
npm start
```

The server will:
- Start on port 3000 (or PORT from environment)
- Serve the Football Throw Game at http://localhost:3000
- Provide API endpoints at http://localhost:3000/api

### 5. Test API Endpoints

**Health Check:**
```bash
curl http://localhost:3000/api/health
```

**Salesforce Connection Test:**
```bash
curl http://localhost:3000/api/salesforce/test
```

**Get Organization Info:**
```bash
curl http://localhost:3000/api/salesforce/org
```

**Query Salesforce Records:**
```bash
curl -X POST http://localhost:3000/api/salesforce/query \
  -H "Content-Type: application/json" \
  -d '{"soql": "SELECT Id, Name FROM Account LIMIT 10"}'
```

## Heroku Deployment

### Set Heroku Config Vars

```bash
heroku config:set SALESFORCE_CLIENT_ID=your_consumer_key_here
heroku config:set SALESFORCE_CLIENT_SECRET=your_consumer_secret_here
heroku config:set SALESFORCE_LOGIN_URL=https://your-instance.salesforce.com
```

### Deploy

```bash
git add .
git commit -m "Add Salesforce integration"
git push heroku main
```

## Available API Endpoints

- `GET /api/health` - Health check
- `GET /api/salesforce/test` - Test Salesforce connection
- `GET /api/salesforce/org` - Get organization details
- `POST /api/salesforce/query` - Execute SOQL queries
- `POST /api/salesforce/create` - Create Salesforce records
- `PUT /api/salesforce/update/:id` - Update Salesforce records
- `GET /api/salesforce/objects` - List all Salesforce objects
- `GET /api/salesforce/objects/:sobjectType` - Get object metadata

## Troubleshooting

### Node.js not found
Install Node.js from https://nodejs.org/ or using Homebrew: `brew install node`

### npm install fails
- Check your internet connection
- Try: `npm install --verbose` for detailed error messages
- Clear npm cache: `npm cache clean --force`

### Salesforce authentication fails
- Verify credentials in `.env` file
- Check that the Connected App is enabled in Salesforce
- Ensure OAuth Scopes are configured correctly
- Verify the login URL is correct

### Port already in use
Change the PORT in `.env` or kill the process using port 3000:
```bash
lsof -ti:3000 | xargs kill
```

