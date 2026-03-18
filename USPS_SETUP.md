# USPS API Setup Guide

## Step 1: Get USPS User ID

1. Go to https://www.usps.com/business/web-tools-apis/
2. Click on "Register for Web Tools API"
3. Fill out the registration form with your information
4. You'll receive an email with your USPS User ID
5. Your User ID will look something like: `123456789ABCDE`

## Step 2: Update the Code

Once you have your USPS User ID, update the `usps-api.js` file:

1. Open `usps-api.js`
2. Find this line:
   ```javascript
   this.userId = 'YOUR_USPS_USER_ID';
   ```
3. Replace `YOUR_USPS_USER_ID` with your actual User ID:
   ```javascript
   this.userId = '123456789ABCDE'; // Your actual User ID
   ```

## Step 3: Test the Integration

After updating the User ID:
1. Restart your development server (`npm run dev`)
2. Test the address validation by entering a real US address
3. Check the browser console for API responses
4. Verify shipping rates are calculated based on real USPS data

## USPS API Endpoints Used

### Address Validation API
- Endpoint: `https://secure.shippingapis.com/ShippingAPI.dll?API=Verify`
- Validates addresses and provides ZIP+4 information
- Returns delivery point validation (DPV) status

### Rate Calculator API  
- Endpoint: `https://secure.shippingapis.com/ShippingAPI.dll?API=RateV4`
- Calculates shipping costs for different services
- Returns rates for Priority Mail, Ground Advantage, etc.
- Provides estimated delivery times

## API Response Examples

### Address Validation Response
```xml
<AddressValidateResponse>
  <Address>
    <Address2>123 MAIN ST</Address2>
    <City>NEW YORK</City>
    <State>NY</State>
    <Zip5>10001</Zip5>
    <Zip4>1234</Zip4>
    <DPVConfirmation>Y</DPVConfirmation>
    <CarrierRoute>C001</CarrierRoute>
  </Address>
</AddressValidateResponse>
```

### Rate Response
```xml
<RateV4Response>
  <Package ID="0">
    <Postage>
      <MailService>Priority Mail®</MailService>
      <Rate>8.99</Rate>
      <CommitmentDate>2024-03-20</CommitmentDate>
    </Postage>
  </Package>
</RateV4Response>
```

## Important Notes

1. **Production vs Testing**: USPS APIs work in both testing and production environments
2. **Rate Limits**: USPS has rate limits - don't make too many rapid requests
3. **Error Handling**: The code includes fallback to demo rates if API fails
4. **Origin ZIP**: Update the origin ZIP code in `calculateShipping()` to your actual location

## Troubleshooting

### Common Issues:
- **Invalid User ID**: Make sure you're using the exact User ID from USPS
- **CORS Issues**: USPS APIs don't support direct browser calls in production
- **Rate Limits**: Wait between API calls if you get rate limit errors

### Solutions:
- For production, you'll need a backend proxy to call USPS APIs
- The current implementation works for development and testing
- Consider using a service like CORS Anywhere for testing

## Next Steps

1. Get your USPS User ID
2. Update the `usps-api.js` file
3. Test with real addresses
4. Consider setting up a backend for production use
