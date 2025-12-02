/**
 * Test script to validate Salesforce integration
 * Run with: node test-salesforce.js
 * 
 * Make sure to set environment variables first:
 * export SALESFORCE_CLIENT_ID="your_key"
 * export SALESFORCE_CLIENT_SECRET="your_secret"
 */

require('dotenv').config();
const jsforce = require('jsforce');

const SALESFORCE_CONFIG = {
  loginUrl: process.env.SALESFORCE_LOGIN_URL || 'https://loyaltysampleappcom-a-dev-ed.develop.my.salesforce-setup.com',
  clientId: process.env.SALESFORCE_CLIENT_ID,
  clientSecret: process.env.SALESFORCE_CLIENT_SECRET
};

async function testSalesforceConnection() {
  console.log('🧪 Testing Salesforce Connection...\n');
  
  // Validate configuration
  if (!SALESFORCE_CONFIG.clientId || !SALESFORCE_CONFIG.clientSecret) {
    console.error('❌ ERROR: Missing Salesforce credentials!');
    console.error('Please set SALESFORCE_CLIENT_ID and SALESFORCE_CLIENT_SECRET environment variables.');
    process.exit(1);
  }

  console.log('📋 Configuration:');
  console.log(`   Login URL: ${SALESFORCE_CONFIG.loginUrl}`);
  console.log(`   Client ID: ${SALESFORCE_CONFIG.clientId.substring(0, 20)}...`);
  console.log(`   Client Secret: ${SALESFORCE_CONFIG.clientSecret.substring(0, 10)}...\n`);

  try {
    // Create connection
    console.log('🔐 Step 1: Creating Salesforce connection...');
    const conn = new jsforce.Connection({
      oauth2: {
        loginUrl: SALESFORCE_CONFIG.loginUrl,
        clientId: SALESFORCE_CONFIG.clientId,
        clientSecret: SALESFORCE_CONFIG.clientSecret
      }
    });

    // Authenticate
    console.log('🔑 Step 2: Authenticating with Salesforce...');
    const userInfo = await conn.login();
    console.log('✅ Authentication successful!\n');

    // Display user info
    console.log('👤 User Information:');
    console.log(`   User ID: ${userInfo.id}`);
    console.log(`   Organization ID: ${userInfo.organizationId}`);
    console.log(`   Access Token: ${conn.accessToken.substring(0, 20)}...\n`);

    // Test query - Get organization info
    console.log('📊 Step 3: Testing SOQL query...');
    const orgResult = await conn.query('SELECT Id, Name, OrganizationType, InstanceName FROM Organization LIMIT 1');
    console.log('✅ Query successful!\n');

    console.log('🏢 Organization Information:');
    const org = orgResult.records[0];
    console.log(`   Name: ${org.Name}`);
    console.log(`   Type: ${org.OrganizationType}`);
    console.log(`   Instance: ${org.InstanceName}`);
    console.log(`   ID: ${org.Id}\n`);

    // Test describe global
    console.log('📦 Step 4: Testing API access (describeGlobal)...');
    const globalDescribe = await conn.describeGlobal();
    console.log(`✅ Successfully retrieved ${globalDescribe.sobjects.length} Salesforce objects\n`);

    // Test Account query (if available)
    console.log('🔍 Step 5: Testing Account query...');
    try {
      const accountResult = await conn.query('SELECT Id, Name FROM Account LIMIT 5');
      console.log(`✅ Found ${accountResult.totalSize} Account records`);
      if (accountResult.records.length > 0) {
        console.log('   Sample records:');
        accountResult.records.forEach((acc, idx) => {
          console.log(`   ${idx + 1}. ${acc.Name} (${acc.Id})`);
        });
      }
    } catch (error) {
      console.log(`⚠️  Account query failed (this is okay if no Accounts exist): ${error.message}`);
    }

    console.log('\n✅ All tests passed! Salesforce integration is working correctly.');
    console.log('\n📝 Next steps:');
    console.log('   1. Set these as Heroku Config Vars:');
    console.log('      - SALESFORCE_CLIENT_ID');
    console.log('      - SALESFORCE_CLIENT_SECRET');
    console.log('      - SALESFORCE_LOGIN_URL (optional, has default)');
    console.log('   2. Deploy to Heroku');
    console.log('   3. Test API endpoints at /api/salesforce/test\n');

  } catch (error) {
    console.error('\n❌ Test failed!');
    console.error(`Error: ${error.message}`);
    
    if (error.errorCode) {
      console.error(`Error Code: ${error.errorCode}`);
    }
    
    if (error.errorCode === 'INVALID_CLIENT') {
      console.error('\n💡 Troubleshooting:');
      console.error('   - Verify your Consumer Key and Consumer Secret are correct');
      console.error('   - Check that the Connected App is enabled');
      console.error('   - Ensure OAuth Scopes are configured');
    } else if (error.errorCode === 'INVALID_LOGIN') {
      console.error('\n💡 Troubleshooting:');
      console.error('   - Verify the login URL is correct');
      console.error('   - Check that the Salesforce instance is accessible');
    }
    
    process.exit(1);
  }
}

// Run the test
testSalesforceConnection();

