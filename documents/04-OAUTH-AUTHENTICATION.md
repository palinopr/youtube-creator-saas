# YouTube OAuth 2.0 Authentication - Complete Reference

## Overview

YouTube APIs use OAuth 2.0 for authentication. API keys can only access public data, while OAuth 2.0 tokens are required for private data and write operations.

---

## Authentication Methods

### 1. API Key (Public Data Only)

For read-only access to public data:

```
GET https://www.googleapis.com/youtube/v3/videos
  ?id=VIDEO_ID
  &part=snippet,statistics
  &key=YOUR_API_KEY
```

**Limitations**:
- Cannot access private videos
- Cannot access user-specific data
- Cannot perform write operations
- Cannot access Analytics/Reporting APIs

### 2. OAuth 2.0 (Full Access)

Required for:
- Accessing private/unlisted videos
- Accessing user's own channel data
- Accessing Analytics data
- Write operations (upload, update, delete)
- Managing subscriptions, playlists, etc.

---

## OAuth 2.0 Scopes

### Data API Scopes

| Scope | Description |
|-------|-------------|
| `https://www.googleapis.com/auth/youtube` | Manage YouTube account |
| `https://www.googleapis.com/auth/youtube.readonly` | View YouTube account |
| `https://www.googleapis.com/auth/youtube.force-ssl` | Manage account (SSL required) |
| `https://www.googleapis.com/auth/youtube.upload` | Upload videos |
| `https://www.googleapis.com/auth/youtubepartner` | View/manage YouTube assets |
| `https://www.googleapis.com/auth/youtubepartner-channel-audit` | View private channel data (audit) |
| `https://www.googleapis.com/auth/youtube.channel-memberships.creator` | View channel memberships |

### Analytics API Scopes

| Scope | Description |
|-------|-------------|
| `https://www.googleapis.com/auth/yt-analytics.readonly` | View YouTube Analytics reports |
| `https://www.googleapis.com/auth/yt-analytics-monetary.readonly` | View monetary Analytics reports |

### Scope Selection Guide

| Use Case | Required Scopes |
|----------|-----------------|
| View public videos | API Key only |
| View own channel stats | `youtube.readonly` |
| View Analytics | `yt-analytics.readonly` |
| View Revenue data | `yt-analytics-monetary.readonly` |
| Upload videos | `youtube.upload` |
| Manage playlists | `youtube` or `youtube.force-ssl` |
| Manage comments | `youtube.force-ssl` |
| Access memberships | `youtube.channel-memberships.creator` |

---

## OAuth 2.0 Flow Types

### 1. Server-Side Web Applications

Best for: Backend services, SaaS applications

**Flow**: Authorization Code Flow

```
1. Redirect user to Google OAuth
2. User grants permissions
3. Google redirects with authorization code
4. Exchange code for tokens
5. Store refresh token securely
6. Use access token for API calls
```

### 2. Client-Side JavaScript Applications

Best for: Single-page apps, browser-based tools

**Flow**: Implicit Flow (deprecated) → Use PKCE instead

```
1. Redirect user to Google OAuth with PKCE challenge
2. User grants permissions
3. Google redirects with authorization code
4. Exchange code + verifier for tokens
```

### 3. Installed/Desktop Applications

Best for: CLI tools, desktop apps

**Flow**: OAuth 2.0 for Installed Apps

```
1. Open browser for user authorization
2. User grants permissions
3. Receive authorization code via redirect or manual entry
4. Exchange code for tokens
```

### 4. Service Accounts

Best for: Server-to-server, automated processes

**Note**: Limited YouTube API support. Cannot impersonate regular users.

---

## Implementation Examples

### Setting Up OAuth in Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Enable YouTube Data API v3
4. Enable YouTube Analytics API (if needed)
5. Enable YouTube Reporting API (if needed)
6. Go to **Credentials** → **Create Credentials** → **OAuth Client ID**
7. Configure OAuth consent screen
8. Add required scopes
9. Create OAuth 2.0 credentials
10. Download client configuration JSON

### Node.js Implementation

```javascript
const { google } = require('googleapis');

// Initialize OAuth2 client
const oauth2Client = new google.auth.OAuth2(
  'YOUR_CLIENT_ID',
  'YOUR_CLIENT_SECRET',
  'YOUR_REDIRECT_URI'
);

// Generate authorization URL
const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',  // Get refresh token
  scope: [
    'https://www.googleapis.com/auth/youtube.readonly',
    'https://www.googleapis.com/auth/yt-analytics.readonly'
  ],
  prompt: 'consent'  // Force consent to get refresh token
});

// Exchange authorization code for tokens
async function getTokens(code) {
  const { tokens } = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);
  return tokens;
}

// Refresh access token
async function refreshAccessToken(refreshToken) {
  oauth2Client.setCredentials({ refresh_token: refreshToken });
  const { credentials } = await oauth2Client.refreshAccessToken();
  return credentials.access_token;
}

// Use authenticated client
const youtube = google.youtube({
  version: 'v3',
  auth: oauth2Client
});

const youtubeAnalytics = google.youtubeAnalytics({
  version: 'v2',
  auth: oauth2Client
});
```

### Python Implementation

```python
from google_auth_oauthlib.flow import InstalledAppFlow
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
import os

SCOPES = [
    'https://www.googleapis.com/auth/youtube.readonly',
    'https://www.googleapis.com/auth/yt-analytics.readonly'
]

def get_authenticated_service():
    creds = None

    # Check for saved credentials
    if os.path.exists('token.json'):
        creds = Credentials.from_authorized_user_file('token.json', SCOPES)

    # If no valid credentials, get new ones
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_secrets_file(
                'client_secrets.json', SCOPES
            )
            creds = flow.run_local_server(port=8080)

        # Save credentials for next time
        with open('token.json', 'w') as token:
            token.write(creds.to_json())

    # Build services
    youtube = build('youtube', 'v3', credentials=creds)
    youtube_analytics = build('youtubeAnalytics', 'v2', credentials=creds)

    return youtube, youtube_analytics
```

### TypeScript/Next.js Implementation

```typescript
import { google } from 'googleapis';

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

// API route to initiate OAuth
export async function GET(request: Request) {
  const scopes = [
    'https://www.googleapis.com/auth/youtube.readonly',
    'https://www.googleapis.com/auth/yt-analytics.readonly',
    'https://www.googleapis.com/auth/yt-analytics-monetary.readonly'
  ];

  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent',
    state: 'some_state_value'  // For CSRF protection
  });

  return Response.redirect(url);
}

// API route for OAuth callback
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');

  if (!code) {
    return Response.json({ error: 'No code provided' }, { status: 400 });
  }

  try {
    const { tokens } = await oauth2Client.getToken(code);

    // Store tokens securely (database, encrypted cookie, etc.)
    await saveTokens(tokens);

    return Response.redirect('/dashboard');
  } catch (error) {
    return Response.json({ error: 'Token exchange failed' }, { status: 500 });
  }
}
```

---

## Token Management

### Token Types

| Token | Purpose | Lifetime |
|-------|---------|----------|
| Access Token | API authentication | ~1 hour |
| Refresh Token | Obtain new access tokens | Long-lived (until revoked) |
| ID Token | User identity (OpenID Connect) | ~1 hour |

### Token Storage Best Practices

**DO**:
- Store refresh tokens encrypted in database
- Use secure, httpOnly cookies for session management
- Implement token rotation on refresh
- Set appropriate token expiration checks

**DON'T**:
- Store tokens in localStorage (XSS vulnerable)
- Store tokens in URL parameters
- Log tokens or include in error messages
- Share tokens between users

### Token Refresh Logic

```javascript
async function makeAuthenticatedRequest(endpoint) {
  // Check if access token is expired
  if (isTokenExpired(accessToken)) {
    accessToken = await refreshAccessToken(refreshToken);
    await saveAccessToken(accessToken);
  }

  // Make API request
  const response = await fetch(endpoint, {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  });

  // Handle token errors
  if (response.status === 401) {
    // Token might have been revoked
    throw new Error('Authentication required');
  }

  return response.json();
}
```

---

## Consent Screen Configuration

### Required Information

| Field | Description |
|-------|-------------|
| App name | Your application name |
| User support email | Contact email for users |
| App logo | Square logo (120x120 to 1024x1024) |
| Application home page | Public homepage URL |
| Application privacy policy | Privacy policy URL |
| Application terms of service | Terms of service URL |
| Authorized domains | Domains for OAuth redirects |

### Verification Requirements

| Publishing Status | Requirements |
|-------------------|--------------|
| Testing | Limited to 100 test users |
| In production | Google verification required for sensitive scopes |

### Sensitive Scopes Requiring Verification

- `youtube` (full account access)
- `youtube.force-ssl` (full account access)
- `yt-analytics-monetary.readonly` (revenue data)
- `youtube.channel-memberships.creator` (membership data)

---

## Error Handling

### Common OAuth Errors

| Error | Cause | Solution |
|-------|-------|----------|
| `invalid_grant` | Refresh token expired/revoked | Re-authenticate user |
| `access_denied` | User denied permissions | Handle gracefully, explain why needed |
| `invalid_scope` | Requested scope not enabled | Enable scope in Cloud Console |
| `invalid_client` | Incorrect client credentials | Verify client ID/secret |
| `redirect_uri_mismatch` | Redirect URI not registered | Add URI to Cloud Console |

### Error Response Structure

```json
{
  "error": {
    "code": 401,
    "message": "Request had invalid authentication credentials.",
    "status": "UNAUTHENTICATED",
    "details": [
      {
        "type": "type.googleapis.com/google.rpc.ErrorInfo",
        "reason": "ACCESS_TOKEN_EXPIRED",
        "domain": "googleapis.com"
      }
    ]
  }
}
```

---

## Security Best Practices

### 1. Use HTTPS Everywhere
- All redirect URIs must use HTTPS (except localhost)
- All API calls should use HTTPS

### 2. Implement PKCE for Public Clients
```javascript
// Generate code verifier
const codeVerifier = crypto.randomBytes(32).toString('base64url');

// Generate code challenge
const codeChallenge = crypto
  .createHash('sha256')
  .update(codeVerifier)
  .digest('base64url');

// Include in authorization URL
const authUrl = `https://accounts.google.com/o/oauth2/v2/auth
  ?client_id=${clientId}
  &redirect_uri=${redirectUri}
  &response_type=code
  &scope=${scopes}
  &code_challenge=${codeChallenge}
  &code_challenge_method=S256`;
```

### 3. Validate State Parameter
```javascript
// Generate state before redirect
const state = crypto.randomBytes(16).toString('hex');
session.oauthState = state;

// Verify state on callback
if (request.query.state !== session.oauthState) {
  throw new Error('State mismatch - possible CSRF attack');
}
```

### 4. Request Minimum Scopes
- Only request scopes you actually need
- Use `youtube.readonly` instead of `youtube` when possible
- Add scopes incrementally as features are used

### 5. Handle Token Revocation
```javascript
// User can revoke tokens at:
// https://myaccount.google.com/permissions

// Your app should handle revocation gracefully
async function handleApiError(error) {
  if (error.code === 401) {
    await clearUserTokens();
    redirectToLogin();
  }
}
```

---

## Testing OAuth Flows

### Test Users (Development)
1. Go to OAuth consent screen in Cloud Console
2. Add test users (up to 100)
3. Only test users can access app in testing mode

### OAuth Playground
Use [Google OAuth 2.0 Playground](https://developers.google.com/oauthplayground) to:
- Test different scopes
- Get sample access tokens
- Test API calls manually

### Local Development
```javascript
// For local development, use localhost redirect URI
const redirectUri = process.env.NODE_ENV === 'development'
  ? 'http://localhost:3000/api/auth/callback'
  : 'https://yourdomain.com/api/auth/callback';
```

---

## LangGraph Agent Authentication

### Agent Authentication Pattern

```python
from langgraph.graph import StateGraph
from typing import TypedDict

class AgentState(TypedDict):
    youtube_client: Any
    analytics_client: Any
    user_id: str
    access_token: str
    refresh_token: str

async def authenticate_node(state: AgentState):
    """Node to handle YouTube authentication"""

    # Check if tokens are valid
    if is_token_expired(state['access_token']):
        new_token = await refresh_access_token(state['refresh_token'])
        state['access_token'] = new_token

    # Initialize authenticated clients
    state['youtube_client'] = get_youtube_client(state['access_token'])
    state['analytics_client'] = get_analytics_client(state['access_token'])

    return state

# Build graph with authentication
graph = StateGraph(AgentState)
graph.add_node("authenticate", authenticate_node)
graph.add_node("fetch_analytics", fetch_analytics_node)
graph.add_node("process_data", process_data_node)

graph.add_edge("authenticate", "fetch_analytics")
graph.add_edge("fetch_analytics", "process_data")
```

---

## Next Steps

- See [05-RATE-LIMITS-QUOTAS.md](./05-RATE-LIMITS-QUOTAS.md) for quota management
- See [06-LANGGRAPH-AGENT-PATTERNS.md](./06-LANGGRAPH-AGENT-PATTERNS.md) for agent design patterns
