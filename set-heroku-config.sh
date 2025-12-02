#!/bin/bash

# Script to set Heroku Config Vars for Salesforce integration
# Run this script to configure your Heroku app with Salesforce credentials

echo "Setting Heroku Config Vars for Salesforce integration..."
echo ""

# Replace 'your-app-name' with your actual Heroku app name
# Or set it as an environment variable: export HEROKU_APP_NAME=your-app-name
APP_NAME=${HEROKU_APP_NAME:-"your-app-name"}

if [ "$APP_NAME" = "your-app-name" ]; then
    echo "⚠️  Please set your Heroku app name:"
    echo "   export HEROKU_APP_NAME=your-actual-app-name"
    echo "   Or edit this script and replace 'your-app-name'"
    exit 1
fi

echo "App Name: $APP_NAME"
echo ""

# Set Salesforce credentials
# Replace the placeholder values with your actual credentials
heroku config:set SALESFORCE_CLIENT_ID=your_consumer_key_here --app $APP_NAME

heroku config:set SALESFORCE_CLIENT_SECRET=your_consumer_secret_here --app $APP_NAME

heroku config:set SALESFORCE_LOGIN_URL=https://your-instance.salesforce.com --app $APP_NAME

echo ""
echo "✅ Heroku Config Vars set successfully!"
echo ""
echo "Verify with: heroku config --app $APP_NAME"
echo ""

