// Updated Backend Server for New USPS APIs (2024+)
// This server handles the new USPS Developer Portal APIs with OAuth 2.0

const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// New USPS API Configuration
const USPS_CONSUMER_KEY = process.env.USPS_CONSUMER_KEY || 'YOUR_CONSUMER_KEY';
const USPS_CONSUMER_SECRET = process.env.USPS_CONSUMER_SECRET || 'YOUR_CONSUMER_SECRET';
const USPS_BASE_URL = 'https://apis.usps.com';
let accessToken = null;
let tokenExpiry = null;

// Get OAuth 2.0 Access Token
async function getAccessToken() {
    if (accessToken && tokenExpiry && new Date() < tokenExpiry) {
        return accessToken;
    }

    try {
        const credentials = Buffer.from(`${USPS_CONSUMER_KEY}:${USPS_CONSUMER_SECRET}`).toString('base64');
        
        const response = await fetch(`${USPS_BASE_URL}/oauth/v1/token`, {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${credentials}`,
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: 'grant_type=client_credentials&scope=addresses'
        });

        if (!response.ok) {
            throw new Error(`Token request failed: ${response.status}`);
        }

        const data = await response.json();
        accessToken = data.access_token;
        tokenExpiry = new Date(Date.now() + (data.expires_in - 60) * 1000);
        
        console.log('USPS Access Token obtained successfully');
        return accessToken;

    } catch (error) {
        console.error('Failed to get USPS access token:', error);
        throw error;
    }
}

// New USPS Address Validation Endpoint
app.post('/api/usps/validate-address', async (req, res) => {
    try {
        const { address1, address2, city, state, zip5 } = req.body;

        if (!address1 || !city || !state || !zip5) {
            return res.status(400).json({ error: 'Missing required address fields' });
        }

        const token = await getAccessToken();
        
        const requestBody = {
            address: {
                streetAddress: address1,
                secondaryAddress: address2 || '',
                city: city,
                state: state,
                zipCode: zip5,
                urbanization: ''
            }
        };

        const response = await fetch(`${USPS_BASE_URL}/addresses/v1/address`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            throw new Error(`Address validation failed: ${response.status}`);
        }

        const data = await response.json();
        console.log('USPS Address Validation Response:', data);

        // Parse response for frontend
        const result = {
            isValid: data.address?.deliveryPoint === 'VALID',
            standardizedAddress: {
                streetAddress: data.address?.streetAddress || address1,
                secondaryAddress: data.address?.secondaryAddress || address2 || '',
                city: data.address?.city || city,
                state: data.address?.state || state,
                zipCode: data.address?.zipCode || zip5,
                zipPlus4: data.address?.zipPlus4 || '',
                county: data.address?.county || '',
                carrierRoute: data.address?.carrierRoute || ''
            },
            message: data.address?.deliveryPoint === 'VALID' ? 'Address validated successfully' : 'Address could not be verified'
        };

        res.json(result);

    } catch (error) {
        console.error('Address validation error:', error);
        res.status(500).json({ error: 'Failed to validate address' });
    }
});

// New USPS Shipping Rates Endpoint
app.post('/api/usps/shipping-rates', async (req, res) => {
    try {
        const { zipFrom, zipTo, weight = 16 } = req.body;

        if (!zipFrom || !zipTo) {
            return res.status(400).json({ error: 'Missing ZIP codes' });
        }

        const token = await getAccessToken();
        
        const requestBody = {
            origin: {
                zipCode: zipFrom
            },
            destination: {
                zipCode: zipTo
            },
            package: {
                weight: {
                    ounces: weight
                },
                dimensions: {
                    length: 9,
                    width: 6,
                    height: 1,
                    unit: 'IN'
                },
                container: 'VARIABLE'
            },
            services: [
                'PRIORITY',
                'GROUND_ADVANTAGE',
                'PRIORITY_EXPRESS'
            ]
        };

        const response = await fetch(`${USPS_BASE_URL}/prices/v1/domestic-rates`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            throw new Error(`Shipping rates failed: ${response.status}`);
        }

        const data = await response.json();
        console.log('USPS Shipping Rates Response:', data);

        // Parse response for frontend
        const rates = [];
        
        if (data.prices && data.prices.domestic) {
            data.prices.domestic.forEach(price => {
                rates.push({
                    service: price.service,
                    rate: price.totalPrice,
                    estimatedDays: price.deliveryTimeframe || null,
                    zone: price.zone || null
                });
            });
        }

        res.json({ rates });

    } catch (error) {
        console.error('Shipping rates error:', error);
        res.status(500).json({ error: 'Failed to calculate shipping rates' });
    }
});

// Payment Intent Endpoint (for Stripe)
app.post('/create-payment-intent', async (req, res) => {
    try {
        const { amount, currency, orderDetails } = req.body;
        
        // In production, you would integrate with Stripe here
        // For now, return a mock payment intent
        const paymentIntent = {
            client_secret: `pi_mock_${Date.now()}_secret_${Date.now()}`,
            id: `pi_mock_${Date.now()}`
        };
        
        res.json(paymentIntent);
    } catch (error) {
        console.error('Payment intent error:', error);
        res.status(500).json({ error: 'Failed to create payment intent' });
    }
});

// Order Confirmation Email Endpoint
app.post('/send-order-confirmation', async (req, res) => {
    try {
        const orderDetails = req.body;
        
        console.log('Order confirmation request:', orderDetails);
        
        // In production, you would integrate with an email service like SendGrid, Nodemailer, etc.
        // For now, just log order details
        console.log('Order confirmation sent for:', orderDetails.orderId);
        
        res.json({ success: true });
    } catch (error) {
        console.error('Order confirmation error:', error);
        res.status(500).json({ error: 'Failed to send order confirmation' });
    }
});

// Serve static files
app.get('/', (req, res) => {
    res.sendFile('index.html', { root: '.' });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`USPS Consumer Key: ${USPS_CONSUMER_KEY}`);
    console.log('Using New USPS APIs (2024+)');
    console.log('Available endpoints:');
    console.log('  POST /api/usps/validate-address (New Address API)');
    console.log('  POST /api/usps/shipping-rates (New Pricing API)');
    console.log('  POST /create-payment-intent');
    console.log('  POST /send-order-confirmation');
});

module.exports = app;
