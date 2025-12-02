const express = require('express');
const jsforce = require('jsforce'); // Still needed for other endpoints
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname)));
app.use(require('cors')());

// Salesforce Configuration - Using Auth Provider details
const SALESFORCE_CONFIG = {
  // Auth Provider Token Endpoint (from Auth Provider configuration)
  tokenEndpoint: 'https://login.salesforce.com/services/oauth2/token',
  // Consumer Key and Secret from Auth Provider
  consumerKey: process.env.SALESFORCE_CONSUMER_KEY || process.env.SALESFORCE_CLIENT_ID,
  consumerSecret: process.env.SALESFORCE_CONSUMER_SECRET || process.env.SALESFORCE_CLIENT_SECRET,
  // Instance URL (will be obtained from token response)
  instanceUrl: process.env.SALESFORCE_INSTANCE_URL || null
};

// Token storage
let accessToken = null;
let instanceUrl = null;
let tokenExpiry = null;

// Validate credentials
if (SALESFORCE_CONFIG.consumerKey && SALESFORCE_CONFIG.consumerSecret) {
  console.log('✅ Salesforce Auth Provider credentials detected');
} else {
  console.log('⚠️  Salesforce credentials not configured - Salesforce endpoints will be disabled');
  console.log('   Set SALESFORCE_CONSUMER_KEY and SALESFORCE_CONSUMER_SECRET to enable Salesforce integration');
}

/**
 * Authenticate with Salesforce using OAuth 2.0 Client Credentials flow
 * Uses Auth Provider token endpoint: https://login.salesforce.com/services/oauth2/token
 * @returns {Promise<string>} Access token
 */
async function authenticateSalesforce() {
  try {
    // Check if credentials are configured
    if (!SALESFORCE_CONFIG.consumerKey || !SALESFORCE_CONFIG.consumerSecret) {
      throw new Error('Salesforce credentials not configured');
    }

    // Check if we have a valid token
    if (accessToken && tokenExpiry && Date.now() < tokenExpiry) {
      return accessToken;
    }

    console.log('Authenticating with Salesforce using OAuth 2.0 Client Credentials flow...');
    console.log(`Token endpoint: ${SALESFORCE_CONFIG.tokenEndpoint}`);
    console.log(`Consumer Key: ${SALESFORCE_CONFIG.consumerKey.substring(0, 20)}...`);
    
    const https = require('https');
    
    // Prepare the request body for Client Credentials flow
    const tokenRequestData = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: SALESFORCE_CONFIG.consumerKey,
      client_secret: SALESFORCE_CONFIG.consumerSecret
    }).toString();
    
    const parsedUrl = new URL(SALESFORCE_CONFIG.tokenEndpoint);
    
    // Make token request
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
      
      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          console.log(`Token response status: ${res.statusCode}`);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            try {
              const parsed = JSON.parse(data);
              resolve(parsed);
            } catch (e) {
              console.error('Failed to parse token response:', data);
              reject(new Error(`Failed to parse token response: ${e.message}`));
            }
          } else {
            console.error(`Token request failed with status ${res.statusCode}`);
            console.error('Response data:', data.substring(0, 500));
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
    instanceUrl = tokenResponse.instance_url || SALESFORCE_CONFIG.instanceUrl;
    
    // Calculate token expiry
    const expiresIn = tokenResponse.expires_in || 7200; // Default to 2 hours
    tokenExpiry = Date.now() + (expiresIn * 1000);
    
    console.log('✅ Successfully authenticated with Salesforce');
    console.log(`Instance URL: ${instanceUrl}`);
    console.log(`Token expires in: ${expiresIn} seconds`);
    console.log(`Access Token: ${accessToken.substring(0, 20)}...`);
    console.log(`Token type: ${tokenResponse.token_type || 'Bearer'}`);
    
    return accessToken;
  } catch (error) {
    console.error('❌ Salesforce authentication failed:', error.message);
    throw error;
  }
}

/**
 * Ensure Salesforce is authenticated and return access token
 * @returns {Promise<string>} Access token
 */
async function ensureAuthenticated() {
  if (!SALESFORCE_CONFIG.consumerKey || !SALESFORCE_CONFIG.consumerSecret) {
    throw new Error('Salesforce credentials not configured');
  }
  if (!accessToken || !tokenExpiry || Date.now() >= tokenExpiry) {
    await authenticateSalesforce();
  }
  if (!instanceUrl) {
    throw new Error('Instance URL not available. Authentication may have failed.');
  }
  return accessToken;
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

    // Ensure authenticated and get access token
    const token = await ensureAuthenticated();

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
    
    // Construct the Flow API endpoint URL
    const flowApiPath = `/services/data/v${apiVersion}/actions/custom/flow/${flowApiName}`;
    const flowApiUrl = `${instanceUrl}${flowApiPath}`;

    console.log('Calling Salesforce Flow API:', flowApiName);
    console.log(`Full URL: ${flowApiUrl}`);
    console.log('Request body:', JSON.stringify(flowRequestBody, null, 2));

    // Make direct REST API call to Salesforce Flow
    const https = require('https');
    const parsedUrl = new URL(flowApiUrl);
    const requestBody = JSON.stringify(flowRequestBody);
    
    const result = await new Promise((resolve, reject) => {
      const options = {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port || 443,
        path: parsedUrl.pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Content-Length': Buffer.byteLength(requestBody)
        }
      };
      
      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          console.log(`Flow API response status: ${res.statusCode}`);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            try {
              resolve(JSON.parse(data));
            } catch (e) {
              reject(new Error(`Failed to parse Flow API response: ${e.message}`));
            }
          } else {
            console.error('Flow API error response:', data);
            reject(new Error(`Flow API request failed: ${res.statusCode} - ${data.substring(0, 200)}`));
          }
        });
      });
      
      req.on('error', (error) => {
        reject(error);
      });
      
      req.write(requestBody);
      req.end();
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
