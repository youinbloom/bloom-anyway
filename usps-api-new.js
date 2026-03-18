// New USPS API Integration (2024+)
// This file handles USPS APIs using the new developer portal with OAuth 2.0
// Old Web Tools APIs were retired on January 25, 2026

class USPSNewAPI {
    constructor() {
        // New USPS API Configuration
        this.baseUrl = 'https://apis.usps.com';
        this.testingUrl = 'https://apis-tem.usps.com'; // Testing environment
        this.consumerKey = 'YOUR_CONSUMER_KEY';
        this.consumerSecret = 'YOUR_CONSUMER_SECRET';
        this.accessToken = null;
        this.tokenExpiry = null;
    }

    // Get OAuth 2.0 Access Token
    async getAccessToken() {
        // Check if we have a valid token
        if (this.accessToken && this.tokenExpiry && new Date() < this.tokenExpiry) {
            return this.accessToken;
        }

        try {
            const credentials = btoa(`${this.consumerKey}:${this.consumerSecret}`);
            
            const response = await fetch(`${this.baseUrl}/oauth/v1/token`, {
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
            
            this.accessToken = data.access_token;
            // Set token expiry (usually 3600 seconds = 1 hour)
            this.tokenExpiry = new Date(Date.now() + (data.expires_in - 60) * 1000);
            
            console.log('USPS Access Token obtained successfully');
            return this.accessToken;

        } catch (error) {
            console.error('Failed to get USPS access token:', error);
            throw error;
        }
    }

    // Validate address using new USPS Address API
    async validateAddress(address1, address2, city, state, zip5) {
        try {
            const token = await this.getAccessToken();
            
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

            const response = await fetch(`${this.baseUrl}/addresses/v1/address`, {
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
            return this.parseAddressValidationResponse(data);

        } catch (error) {
            console.error('USPS Address Validation Error:', error);
            return { error: 'Failed to validate address with USPS' };
        }
    }

    // Get domestic shipping rates using new USPS Pricing API
    async getShippingRates(originZip, destinationZip, weight = 16) {
        try {
            const token = await this.getAccessToken();
            
            const requestBody = {
                origin: {
                    zipCode: originZip
                },
                destination: {
                    zipCode: destinationZip
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

            const response = await fetch(`${this.baseUrl}/prices/v1/domestic-rates`, {
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
            return this.parseShippingRatesResponse(data);

        } catch (error) {
            console.error('USPS Shipping Rates Error:', error);
            return { error: 'Failed to calculate shipping rates' };
        }
    }

    // Parse new address validation response
    parseAddressValidationResponse(data) {
        if (data.error) {
            return {
                error: data.error.message || 'Address validation failed'
            };
        }

        const address = data.address;
        if (!address) {
            return { error: 'Invalid response from USPS' };
        }

        return {
            isValid: address.deliveryPoint === 'VALID',
            standardizedAddress: {
                streetAddress: address.streetAddress,
                secondaryAddress: address.secondaryAddress || '',
                city: address.city,
                state: address.state,
                zipCode: address.zipCode,
                zipPlus4: address.zipPlus4 || '',
                county: address.county || '',
                carrierRoute: address.carrierRoute || ''
            },
            message: address.deliveryPoint === 'VALID' ? 'Address validated successfully' : 'Address could not be verified'
        };
    }

    // Parse new shipping rates response
    parseShippingRatesResponse(data) {
        if (data.error) {
            return {
                error: data.error.message || 'Shipping calculation failed'
            };
        }

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

        return { rates };
    }

    // Fallback to demo rates if no credentials
    getDemoShippingRates(zipTo) {
        const firstDigit = parseInt(zipTo[0]);
        let baseRate = 5.99;
        let priorityRate = 8.99;
        let expressRate = 24.99;

        // Adjust rates based on region
        if (firstDigit === 9) { // West Coast
            baseRate = 6.99;
            priorityRate = 9.99;
        } else if (firstDigit === 0 || firstDigit === 1) { // Northeast
            baseRate = 7.99;
            priorityRate = 10.99;
        } else if (firstDigit === 8) { // Mountain
            baseRate = 8.99;
            priorityRate = 11.99;
        } else if (firstDigit === 2) { // Alaska/Hawaii region
            baseRate = 12.99;
            priorityRate = 18.99;
            expressRate = 34.99;
        }

        return {
            rates: [
                {
                    service: 'USPS Ground Advantage™',
                    rate: baseRate,
                    estimatedDays: 5
                },
                {
                    service: 'Priority Mail®',
                    rate: priorityRate,
                    estimatedDays: 2
                },
                {
                    service: 'Priority Mail Express®',
                    rate: expressRate,
                    estimatedDays: 1
                }
            ]
        };
    }

    // Validate address with fallback
    async validateAddressWithFallback(address1, address2, city, state, zip5) {
        // If no credentials, use demo validation
        if (this.consumerKey === 'YOUR_CONSUMER_KEY') {
            return this.getDemoAddressValidation(address1, city, state, zip5);
        }

        try {
            return await this.validateAddress(address1, address2, city, state, zip5);
        } catch (error) {
            console.error('USPS API validation failed, using fallback:', error);
            return this.getDemoAddressValidation(address1, city, state, zip5);
        }
    }

    // Get shipping rates with fallback
    async getShippingRatesWithFallback(originZip, destinationZip, weight = 16) {
        // If no credentials, use demo rates
        if (this.consumerKey === 'YOUR_CONSUMER_KEY') {
            return this.getDemoShippingRates(destinationZip);
        }

        try {
            return await this.getShippingRates(originZip, destinationZip, weight);
        } catch (error) {
            console.error('USPS API shipping failed, using fallback:', error);
            return this.getDemoShippingRates(destinationZip);
        }
    }

    // Demo address validation
    getDemoAddressValidation(address1, city, state, zip5) {
        if (!address1 || !city || !state || !zip5) {
            return { error: 'All address fields are required' };
        }

        if (zip5.length !== 5 || !/^\d{5}$/.test(zip5)) {
            return { error: 'Invalid ZIP code format' };
        }

        return {
            isValid: true,
            standardizedAddress: {
                streetAddress: address1,
                city: city,
                state: state,
                zipCode: zip5,
                zipPlus4: '1234'
            },
            message: 'Address format is valid (demo mode)'
        };
    }
}

// Export for use in the main application
window.USPSNewAPI = USPSNewAPI;
