const express = require('express');
const jsforce = require('jsforce');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname)));
app.use(require('cors')());

// Salesforce Configuration
const SALESFORCE_CONFIG = {
  loginUrl: process.env.SALESFORCE_LOGIN_URL || 'https://loyaltysampleappcom-a-dev-ed.develop.my.salesforce-setup.com',
  clientId: process.env.SALESFORCE_CLIENT_ID,
  clientSecret: process.env.SALESFORCE_CLIENT_SECRET
};

// Validate required environment variables (only if credentials are provided)
if (SALESFORCE_CONFIG.clientId && SALESFORCE_CONFIG.clientSecret) {
  console.log('✅ Salesforce credentials detected');
} else {
  console.log('⚠️  Salesforce credentials not configured - Salesforce endpoints will be disabled');
  console.log('   Set SALESFORCE_CLIENT_ID and SALESFORCE_CLIENT_SECRET to enable Salesforce integration');
}

// Salesforce connection instance
let conn = null;
let accessToken = null;
let tokenExpiry = null;

/**
 * Authenticate with Salesforce using OAuth 2.0 Client Credentials flow
 * @returns {Promise<Object>} Connection object
 */
async function authenticateSalesforce() {
  try {
    // Check if credentials are configured
    if (!SALESFORCE_CONFIG.clientId || !SALESFORCE_CONFIG.clientSecret) {
      throw new Error('Salesforce credentials not configured');
    }

    // Check if we have a valid token
    if (accessToken && tokenExpiry && Date.now() < tokenExpiry) {
      return conn;
    }

    console.log('Authenticating with Salesforce using OAuth 2.0 Client Credentials flow...');
    console.log(`Login URL: ${SALESFORCE_CONFIG.loginUrl}`);
    
    // For Client Credentials flow, we MUST use the standard Salesforce login domain
    // Custom domains (like .my.salesforce.com or .my.salesforce-setup.com) don't support OAuth token endpoints
    // Check for manual override first, then auto-detect
    let tokenUrl;
    
    // Allow manual override via environment variable
    if (process.env.SALESFORCE_TOKEN_ENDPOINT) {
      tokenUrl = process.env.SALESFORCE_TOKEN_ENDPOINT;
      console.log(`Using manual token endpoint override: ${tokenUrl}`);
    } else {
      // Auto-detect based on login URL
      const loginUrl = SALESFORCE_CONFIG.loginUrl.toLowerCase();
      
      // Check if it's a sandbox (contains -dev-ed, --, .sandbox., or test.salesforce.com)
      if (loginUrl.includes('-dev-ed') || 
          loginUrl.includes('--') || 
          loginUrl.includes('.sandbox.') ||
          loginUrl.includes('test.salesforce.com') ||
          loginUrl.includes('cs') || // Community sandbox
          loginUrl.includes('develop.my.salesforce') ||
          loginUrl.includes('my.salesforce-setup.com')) { // Custom setup domains are always sandboxes
        // Sandbox - use test.salesforce.com
        tokenUrl = 'https://test.salesforce.com/services/oauth2/token';
        console.log('Detected sandbox instance - using test.salesforce.com');
      } else {
        // Production - use login.salesforce.com
        tokenUrl = 'https://login.salesforce.com/services/oauth2/token';
        console.log('Detected production instance - using login.salesforce.com');
      }
      
      console.log(`Using token endpoint: ${tokenUrl}`);
    }
    
    // Prepare the request body for Client Credentials flow
    const https = require('https');
    const http = require('http');
    const url = require('url');
    
    const tokenRequestData = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: SALESFORCE_CONFIG.clientId,
      client_secret: SALESFORCE_CONFIG.clientSecret
    }).toString();

    // Validate tokenUrl is correct
    if (!tokenUrl.startsWith('https://')) {
      throw new Error(`Invalid token URL: ${tokenUrl}. Must use HTTPS.`);
    }
    
    console.log(`Making token request to: ${tokenUrl}`);
    
    // Make token request using native Node.js https/http
    const parsedUrl = new URL(tokenUrl);
    
    // Ensure we're using HTTPS
    if (parsedUrl.protocol !== 'https:') {
      throw new Error(`Token URL must use HTTPS, got: ${parsedUrl.protocol}`);
    }
    
    const requestModule = https; // Always use HTTPS for Salesforce
    
    const tokenResponse = await new Promise((resolve, reject) => {
      const options = {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port || 443,
        path: parsedUrl.pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(tokenRequestData)
        }
      };
      
      console.log(`Request options:`, {
        hostname: options.hostname,
        port: options.port,
        path: options.path,
        method: options.method
      });

      const req = requestModule.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          console.log(`Token response status: ${res.statusCode}`);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            try {
              const parsed = JSON.parse(data);
              console.log('Token request successful');
              resolve(parsed);
            } catch (e) {
              console.error('Failed to parse token response:', data);
              reject(new Error(`Failed to parse token response: ${e.message}`));
            }
          } else {
            console.error(`Token request failed with status ${res.statusCode}`);
            console.error('Response data:', data.substring(0, 500)); // Log first 500 chars
            reject(new Error(`Token request failed: ${res.statusCode} - ${data.substring(0, 200)}`));
          }
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      req.write(tokenRequestData);
      req.end();
    });

    // Extract token and instance URL from response
    accessToken = tokenResponse.access_token;
    const instanceUrl = tokenResponse.instance_url;
    
    // Calculate token expiry (typically expires in 2 hours, but use actual expires_in if provided)
    const expiresIn = tokenResponse.expires_in || 7200; // Default to 2 hours
    tokenExpiry = Date.now() + (expiresIn * 1000);
    
    // Create connection with the access token
    conn = new jsforce.Connection({
      accessToken: accessToken,
      instanceUrl: instanceUrl
    });
    
    console.log('✅ Successfully authenticated with Salesforce');
    console.log(`Instance URL: ${instanceUrl}`);
    console.log(`Token expires in: ${expiresIn} seconds`);
    
    return conn;
  } catch (error) {
    console.error('❌ Salesforce authentication failed:', error.message);
    if (error.message && error.message.includes('Token request failed')) {
      console.error('Full error details:', error.message);
    }
    throw error;
  }
}

/**
 * Ensure Salesforce connection is authenticated
 */
async function ensureAuthenticated() {
  if (!SALESFORCE_CONFIG.clientId || !SALESFORCE_CONFIG.clientSecret) {
    throw new Error('Salesforce credentials not configured');
  }
  if (!conn || !accessToken || Date.now() >= tokenExpiry) {
    await authenticateSalesforce();
  }
  return conn;
}

// Routes

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'Football Throw Game API'
  });
});

// Salesforce connection test endpoint
app.get('/api/salesforce/test', async (req, res) => {
  try {
    const connection = await ensureAuthenticated();
    
    // Test query - get organization info
    const orgInfo = await connection.query('SELECT Id, Name, OrganizationType FROM Organization LIMIT 1');
    
    res.json({
      success: true,
      message: 'Salesforce connection successful',
      data: {
        organization: orgInfo.records[0],
        connectionStatus: 'authenticated',
        tokenExpiry: new Date(tokenExpiry).toISOString()
      }
    });
  } catch (error) {
    console.error('Salesforce test error:', error);
    res.status(500).json({
      success: false,
      message: 'Salesforce connection failed',
      error: error.message
    });
  }
});

// Get Salesforce organization details
app.get('/api/salesforce/org', async (req, res) => {
  try {
    const connection = await ensureAuthenticated();
    const orgInfo = await connection.query('SELECT Id, Name, OrganizationType, InstanceName, CreatedDate FROM Organization LIMIT 1');
    
    res.json({
      success: true,
      data: orgInfo.records[0]
    });
  } catch (error) {
    console.error('Error fetching organization info:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch organization information',
      error: error.message
    });
  }
});

// Query Salesforce records
app.post('/api/salesforce/query', async (req, res) => {
  try {
    const { soql } = req.body;
    
    if (!soql) {
      return res.status(400).json({
        success: false,
        message: 'SOQL query is required'
      });
    }

    const connection = await ensureAuthenticated();
    const result = await connection.query(soql);
    
    res.json({
      success: true,
      data: result.records,
      totalSize: result.totalSize
    });
  } catch (error) {
    console.error('SOQL query error:', error);
    res.status(500).json({
      success: false,
      message: 'Query execution failed',
      error: error.message
    });
  }
});

// Create Salesforce record
app.post('/api/salesforce/create', async (req, res) => {
  try {
    const { sobjectType, record } = req.body;
    
    if (!sobjectType || !record) {
      return res.status(400).json({
        success: false,
        message: 'sobjectType and record are required'
      });
    }

    const connection = await ensureAuthenticated();
    const result = await connection.sobject(sobjectType).create(record);
    
    if (result.success) {
      res.json({
        success: true,
        id: result.id
      });
    } else {
      res.status(400).json({
        success: false,
        errors: result.errors
      });
    }
  } catch (error) {
    console.error('Create record error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create record',
      error: error.message
    });
  }
});

// Update Salesforce record
app.put('/api/salesforce/update/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { sobjectType, record } = req.body;
    
    if (!sobjectType || !record) {
      return res.status(400).json({
        success: false,
        message: 'sobjectType and record are required'
      });
    }

    const connection = await ensureAuthenticated();
    record.Id = id;
    const result = await connection.sobject(sobjectType).update(record);
    
    if (result.success) {
      res.json({
        success: true,
        id: result.id
      });
    } else {
      res.status(400).json({
        success: false,
        errors: result.errors
      });
    }
  } catch (error) {
    console.error('Update record error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update record',
      error: error.message
    });
  }
});

// Get available Salesforce objects
app.get('/api/salesforce/objects', async (req, res) => {
  try {
    const connection = await ensureAuthenticated();
    const globalDescribe = await connection.describeGlobal();
    
    res.json({
      success: true,
      data: globalDescribe.sobjects.map(obj => ({
        name: obj.name,
        label: obj.label,
        keyPrefix: obj.keyPrefix,
        custom: obj.custom
      }))
    });
  } catch (error) {
    console.error('Error fetching objects:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch Salesforce objects',
      error: error.message
    });
  }
});

// Get object metadata
app.get('/api/salesforce/objects/:sobjectType', async (req, res) => {
  try {
    const { sobjectType } = req.params;
    const connection = await ensureAuthenticated();
    const metadata = await connection.sobject(sobjectType).describe();
    
    res.json({
      success: true,
      data: {
        name: metadata.name,
        label: metadata.label,
        fields: metadata.fields.map(field => ({
          name: field.name,
          label: field.label,
          type: field.type,
          required: !field.nillable && !field.defaultedOnCreate,
          updateable: field.updateable,
          createable: field.createable
        }))
      }
    });
  } catch (error) {
    console.error('Error fetching object metadata:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch object metadata',
      error: error.message
    });
  }
});

// Create Member via Salesforce Flow API
app.post('/api/salesforce/create-member', async (req, res) => {
  try {
    const { firstName, lastName, email } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !email) {
      return res.status(400).json({
        success: false,
        error: 'First name, last name, and email are required'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email format'
      });
    }

    // Ensure authenticated
    const connection = await ensureAuthenticated();

    // Prepare Flow API request body
    const flowRequestBody = {
      inputs: [{
        FirstName: firstName,
        LastName: lastName,
        Email: email
      }]
    };

    // Get API version (default to v63.0 as specified)
    const apiVersion = '63.0';
    const flowApiName = 'Create_Member_API';
    
    // Construct the Flow API endpoint path
    const flowApiPath = `/services/data/v${apiVersion}/actions/custom/flow/${flowApiName}`;

    console.log('Calling Salesforce Flow API:', flowApiName);
    console.log('Request body:', JSON.stringify(flowRequestBody, null, 2));

    // Make REST API call to Salesforce Flow using jsforce request method
    // The request method automatically handles authentication headers
    const result = await connection.request({
      method: 'POST',
      url: flowApiPath,
      body: flowRequestBody
    });

    console.log('Flow API Response:', JSON.stringify(result, null, 2));

    // Check if the response is an array (as per example)
    if (Array.isArray(result) && result.length > 0) {
      const flowResult = result[0];
      
      if (flowResult.isSuccess && flowResult.outputValues && flowResult.outputValues.MemberID) {
        const memberId = flowResult.outputValues.MemberID;
        
        return res.json({
          success: true,
          memberId: memberId,
          message: 'Member created successfully'
        });
      } else {
        // Flow completed but may have errors
        const errors = flowResult.errors || ['Unknown error occurred'];
        return res.status(400).json({
          success: false,
          error: Array.isArray(errors) ? errors.join(', ') : errors,
          flowResult: flowResult
        });
      }
    } else {
      // Unexpected response format
      return res.status(500).json({
        success: false,
        error: 'Unexpected response format from Salesforce Flow',
        response: result
      });
    }

  } catch (error) {
    console.error('Create member error:', error);
    
    // Provide more detailed error information
    let errorMessage = error.message || 'Failed to create member';
    
    if (error.errorCode) {
      errorMessage = `${error.errorCode}: ${errorMessage}`;
    }
    
    if (error.response) {
      errorMessage = `${errorMessage} - ${JSON.stringify(error.response)}`;
    }

    return res.status(500).json({
      success: false,
      error: errorMessage,
      details: error.toString()
    });
  }
});

// Route for registration page
app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'register.html'));
});

// Route for the main page (game)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Initialize Salesforce connection on server start (if credentials are configured)
if (SALESFORCE_CONFIG.clientId && SALESFORCE_CONFIG.clientSecret) {
  authenticateSalesforce()
    .then(() => {
      console.log('✅ Salesforce connection initialized');
    })
    .catch((error) => {
      console.error('⚠️  Failed to initialize Salesforce connection:', error.message);
      console.error('⚠️  Server will start but Salesforce endpoints will fail until credentials are configured');
    });
}

// Start server
app.listen(PORT, () => {
    console.log(`🏈 Football Throw Game server running on port ${PORT}`);
    if (SALESFORCE_CONFIG.clientId && SALESFORCE_CONFIG.clientSecret) {
      console.log(`📡 Salesforce instance: ${SALESFORCE_CONFIG.loginUrl}`);
    }
    console.log(`🔗 API endpoints available at http://localhost:${PORT}/api`);
});

module.exports = app;
