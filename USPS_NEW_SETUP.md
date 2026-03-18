# New USPS API Setup Guide (2024+)

## 🚨 IMPORTANT: Old USPS Web Tools APIs Were Retired

The old USPS Web Tools APIs (using User ID) were **shut down on January 25, 2026**. You must migrate to the new USPS APIs.

## 📍 New USPS Developer Portal

**URL**: https://developers.usps.com/

## 🔐 New Authentication: OAuth 2.0

**Old System (Retired):**
- Used User ID
- XML-based
- Direct API calls

**New System (Current):**
- Uses OAuth 2.0
- Consumer Key & Consumer Secret
- Bearer token authentication
- Modern REST APIs

## 📋 Step-by-Step Setup

### Step 1: Create USPS Business Account
1. Go to: https://cop.usps.com/cop-navigator?wf=API&showCC=false
2. Sign into your USPS Business Account or create a new one
3. This configures your account for USPS APIs

### Step 2: Create an Application
1. In the COP portal, select "My Apps" at the top
2. Click "Create New Application"
3. Fill out the application details
4. Select the APIs you need (Addresses, Domestic Pricing, etc.)

### Step 3: Get Your Credentials
1. In your app, go to the "Credentials" section
2. Copy your **Consumer Key** and **Consumer Secret**
3. These replace the old User ID system

### Step 4: Update Configuration Files

#### Option A: Frontend Only (Demo Mode)
Update `.env` file:
```bash
cp .env.new .env
```

Edit `.env`:
```env
USPS_CONSUMER_KEY=your_actual_consumer_key_here
USPS_CONSUMER_SECRET=your_actual_consumer_secret_here
```

#### Option B: Full Backend Integration
1. Install dependencies:
```bash
npm install --production
```

2. Update package.json scripts:
```json
{
  "scripts": {
    "start": "node server-new.js",
    "dev": "nodemon server-new.js"
  }
}
```

3. Start backend server:
```bash
npm start
```

### Step 5: Update Frontend Code

Replace the old API script reference in `index.html`:

**Remove:**
```html
<script src="usps-api.js"></script>
```

**Add:**
```html
<script src="usps-api-new.js"></script>
```

## 🆚 API Comparison

| Feature | Old System (Retired) | New System (Current) |
|---------|---------------------|---------------------|
| Auth | User ID | OAuth 2.0 |
| Format | XML | JSON |
| Base URL | secure.shippingapis.com | apis.usps.com |
| Headers | USERID attribute | Authorization: Bearer |
| Testing | Direct calls | apis-tem.usps.com |

## 🛠️ Available APIs

### Addresses API
- **Endpoint**: `/addresses/v1/address`
- **Purpose**: Validate and standardize addresses
- **Features**: Delivery point validation, ZIP+4, carrier routes

### Domestic Pricing API
- **Endpoint**: `/prices/v1/domestic-rates`
- **Purpose**: Calculate shipping costs
- **Services**: Ground Advantage, Priority, Priority Express

### Tracking API
- **Endpoint**: `/tracking/v1/track`
- **Purpose**: Track packages
- **Features**: Real-time tracking, delivery history

## 🧪 Testing

### Testing Environment
Replace `apis.usps.com` with `apis-tem.usps.com` for testing.

### Demo Mode
The code includes demo mode that works without credentials:
- Validates address format
- Returns sample shipping rates
- Perfect for UI development

## 🚀 Production Deployment

### Required Changes:
1. **Environment Variables**: Set real Consumer Key/Secret
2. **Backend Server**: Deploy `server-new.js`
3. **Frontend**: Use `usps-api-new.js`
4. **HTTPS**: Required for production API calls

### Security Notes:
- Never expose Consumer Secret in frontend code
- Use environment variables for credentials
- Implement rate limiting
- Log API calls for monitoring

## 🆘 Troubleshooting

### Common Issues:
1. **"Invalid credentials"** - Check Consumer Key/Secret
2. **"Token expired"** - Implement token refresh logic
3. **"CORS errors"** - Use backend proxy
4. **"Rate limits"** - Implement request throttling

### Solutions:
- Use the provided backend server
- Check token expiry handling
- Monitor API usage in USPS portal
- Contact USPS API support for help

## 📞 Support

- **USPS Developer Portal**: https://developers.usps.com/
- **API Documentation**: https://developers.usps.com/api/catalog
- **Support Email**: Use contact form in developer portal
- **Status Page**: Check for API outages

## 🔄 Migration Checklist

- [ ] Register at new USPS Developer Portal
- [ ] Create application and get credentials
- [ ] Update environment variables
- [ ] Replace old API files with new ones
- [ ] Test with real addresses
- [ ] Deploy to production
- [ ] Monitor API usage and errors
