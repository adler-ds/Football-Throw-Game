# Player Registration & Salesforce Integration

## Overview

The Football Throw Game now includes a registration page that captures player information and creates a member record in Salesforce using the Flow API.

## Registration Flow

1. **Registration Page** (`register.html`)
   - Players must enter First Name, Last Name, and Email (all required)
   - Form validation ensures all fields are filled and email is valid
   - Data is submitted to the backend API

2. **Salesforce Integration** (`/api/salesforce/create-member`)
   - Creates a member record using Salesforce Flow API
   - Endpoint: `/services/data/v63.0/actions/custom/flow/Create_Member_API`
   - Sends player data in the required format
   - Extracts and stores MemberID from response

3. **Game Access**
   - After successful registration, player data (including MemberID) is stored in sessionStorage
   - Player is redirected to the game
   - Game page checks for registration and redirects to registration if not found

## API Endpoint

### POST `/api/salesforce/create-member`

**Request Body:**
```json
{
  "firstName": "David",
  "lastName": "Adler",
  "email": "adler.david@gmail.com"
}
```

**Request to Salesforce Flow:**
```json
{
  "inputs": [{
    "FirstName": "David",
    "LastName": "Adler",
    "Email": "adler.david@gmail.com"
  }]
}
```

**Success Response:**
```json
{
  "success": true,
  "memberId": "0lMal000000DCJVEA4",
  "message": "Member created successfully"
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Error message here"
}
```

## Salesforce Flow API

The integration uses the Salesforce REST API Flow endpoint as documented at:
https://developer.salesforce.com/docs/atlas.en-us.api_rest.meta/api_rest/intro_what_is_rest_api.htm

**Endpoint:** `/services/data/v63.0/actions/custom/flow/Create_Member_API`

**Response Format:**
```json
[
  {
    "actionName": "Create_Member_API",
    "errors": null,
    "invocationId": null,
    "isSuccess": true,
    "outcome": null,
    "outputValues": {
      "MemberID": "0lMal000000DCJVEA4",
      "Flow__InterviewGuid": "9171d0bc96bab89e0de810ea72d419adeea6b1-949c",
      "Flow__InterviewStatus": "Finished"
    },
    "sortOrder": -1,
    "version": 1
  }
]
```

## Error Handling

- **Form Validation**: Client-side validation ensures all required fields are filled
- **Email Validation**: Email format is validated before submission
- **API Errors**: Errors from Salesforce are displayed to the user with a retry option
- **Network Errors**: Network failures are caught and displayed with retry functionality

## Player Data Storage

Player data is stored in `sessionStorage` with the following structure:
```javascript
{
  firstName: "David",
  lastName: "Adler",
  email: "adler.david@gmail.com",
  memberId: "0lMal000000DCJVEA4"
}
```

This data persists for the browser session and can be accessed in the game for tracking purposes.

## Testing

1. Start the server: `npm start`
2. Navigate to: `http://localhost:3000`
3. You'll be redirected to: `http://localhost:3000/register`
4. Fill out the registration form
5. Submit and verify MemberID is created in Salesforce
6. You'll be redirected to the game

## Files Modified/Created

- `register.html` - Registration form page
- `index.html` - Updated to check for registration
- `server.js` - Added `/api/salesforce/create-member` endpoint
- `REGISTRATION.md` - This documentation

