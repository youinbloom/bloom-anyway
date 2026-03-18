// Backend Server for USPS API Integration
// This server handles CORS issues and provides endpoints for USPS APIs

const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// USPS Configuration
const USPS_USER_ID = process.env.USPS_USER_ID || 'YOUR_USPS_USER_ID';
const USPS_BASE_URL = 'https://secure.shippingapis.com/ShippingAPI.dll';

// USPS Address Validation Endpoint
app.post('/api/usps/validate-address', async (req, res) => {
    try {
        const { address1, address2, city, state, zip5 } = req.body;

        if (!address1 || !city || !state || !zip5) {
            return res.status(400).json({ error: 'Missing required address fields' });
        }

        const xmlRequest = `<?xml version="1.0"?>
            <AddressValidateRequest USERID="${USPS_USER_ID}">
                <Revision>1</Revision>
                <Address ID="0">
                    <Address1>${address2 || ''}</Address1>
                    <Address2>${address1}</Address2>
                    <City>${city}</City>
                    <State>${state}</State>
                    <Zip5>${zip5}</Zip5>
                    <Zip4></Zip4>
                </Address>
            </AddressValidateRequest>`;

        const url = `${USPS_BASE_URL}?API=Verify&XML=${encodeURIComponent(xmlRequest)}`;
        
        console.log('USPS Address Validation Request:', url);

        const response = await fetch(url);
        const xmlText = await response.text();
        
        console.log('USPS Address Validation Response:', xmlText);

        // Parse XML response
        const result = parseAddressValidationResponse(xmlText);
        res.json(result);

    } catch (error) {
        console.error('Address validation error:', error);
        res.status(500).json({ error: 'Failed to validate address' });
    }
});

// USPS Shipping Rates Endpoint
app.post('/api/usps/shipping-rates', async (req, res) => {
    try {
        const { zipFrom, zipTo, weight = 16 } = req.body;

        if (!zipFrom || !zipTo) {
            return res.status(400).json({ error: 'Missing ZIP codes' });
        }

        const xmlRequest = `<?xml version="1.0"?>
            <RateV4Request USERID="${USPS_USER_ID}">
                <Revision>2</Revision>
                <Package ID="0">
                    <Service>PRIORITY</Service>
                    <ZipOrigination>${zipFrom}</ZipOrigination>
                    <ZipDestination>${zipTo}</ZipDestination>
                    <Pounds>0</Pounds>
                    <Ounces>${weight}</Ounces>
                    <Container>VARIABLE</Container>
                    <Size>REGULAR</Size>
                    <Width>6</Width>
                    <Length>9</Length>
                    <Height>1</Height>
                    <Girth>0</Girth>
                    <Machinable>true</Machinable>
                </Package>
            </RateV4Request>`;

        const url = `${USPS_BASE_URL}?API=RateV4&XML=${encodeURIComponent(xmlRequest)}`;
        
        console.log('USPS Shipping Rates Request:', url);

        const response = await fetch(url);
        const xmlText = await response.text();
        
        console.log('USPS Shipping Rates Response:', xmlText);

        // Parse XML response
        const result = parseShippingResponse(xmlText);
        res.json(result);

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
        // For now, just log the order details
        console.log('Order confirmation sent for:', orderDetails.orderId);
        
        res.json({ success: true });
    } catch (error) {
        console.error('Order confirmation error:', error);
        res.status(500).json({ error: 'Failed to send order confirmation' });
    }
});

// Helper function to parse address validation response
function parseAddressValidationResponse(xmlText) {
    const { DOMParser } = require('xmldom');
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, "text/xml");
    
    const errorElement = xmlDoc.querySelector('Error');
    if (errorElement) {
        return {
            error: errorElement.querySelector('Description')?.textContent || 'Address validation failed'
        };
    }

    const address = xmlDoc.querySelector('Address');
    if (address) {
        const dpvConfirmation = address.querySelector('DPVConfirmation')?.textContent;
        const zip4 = address.querySelector('Zip4')?.textContent;
        const carrierRoute = address.querySelector('CarrierRoute')?.textContent;
        
        return {
            isValid: dpvConfirmation === 'Y',
            zip4: zip4,
            carrierRoute: carrierRoute,
            message: dpvConfirmation === 'Y' ? 'Address validated successfully' : 'Address could not be verified'
        };
    }

    return { error: 'Invalid response from USPS' };
}

// Helper function to parse shipping response
function parseShippingResponse(xmlText) {
    const { DOMParser } = require('xmldom');
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, "text/xml");
    
    const errorElement = xmlDoc.querySelector('Error');
    if (errorElement) {
        return {
            error: errorElement.querySelector('Description')?.textContent || 'Shipping calculation failed'
        };
    }

    const packageElement = xmlDoc.querySelector('Package');
    const rates = [];

    if (packageElement) {
        const postages = packageElement.querySelectorAll('Postage');
        postages.forEach(postage => {
            const service = postage.querySelector('MailService')?.textContent;
            const rate = postage.querySelector('Rate')?.textContent;
            const days = postage.querySelector('CommitmentDate')?.textContent;
            
            if (service && rate) {
                rates.push({
                    service: service,
                    rate: parseFloat(rate),
                    estimatedDays: days ? calculateDays(days) : null
                });
            }
        });
    }

    return { rates };
}

// Helper function to calculate estimated delivery days
function calculateDays(commitmentDate) {
    if (!commitmentDate) return null;
    
    const today = new Date();
    const deliveryDate = new Date(commitmentDate);
    const diffTime = Math.abs(deliveryDate - today);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
}

// Serve static files
app.get('/', (req, res) => {
    res.sendFile('index.html', { root: '.' });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`USPS User ID: ${USPS_USER_ID}`);
    console.log('Available endpoints:');
    console.log('  POST /api/usps/validate-address');
    console.log('  POST /api/usps/shipping-rates');
    console.log('  POST /create-payment-intent');
    console.log('  POST /send-order-confirmation');
});

module.exports = app;
