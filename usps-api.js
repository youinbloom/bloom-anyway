// USPS API Integration for Bloom Anyway Book Website
// This file handles USPS address validation and shipping cost calculation

class USPSAPI {
    constructor() {
        // You need to get your own USPS User ID from https://www.usps.com/business/web-tools-apis/
        this.userId = 'YOUR_USPS_USER_ID'; // Replace with your actual USPS User ID
        this.baseUrl = 'https://secure.shippingapis.com/ShippingAPI.dll';
    }

    // Validate address using USPS Address Validation API
    async validateAddress(address1, address2, city, state, zip5) {
        const xmlRequest = `<?xml version="1.0"?>
            <AddressValidateRequest USERID="${this.userId}">
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

        try {
            // For direct browser calls, we need to handle CORS
            // Using a CORS proxy for development
            const proxyUrl = 'https://cors-anywhere.herokuapp.com/';
            const url = `${proxyUrl}${this.baseUrl}?API=Verify&XML=${encodeURIComponent(xmlRequest)}`;
            
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const xmlText = await response.text();
            console.log('USPS Address Validation Response:', xmlText);
            return this.parseAddressValidationResponse(xmlText);
        } catch (error) {
            console.error('USPS Address Validation Error:', error);
            // Try alternative method using JSONP-like approach
            return this.validateAddressAlternative(address1, address2, city, state, zip5);
        }
    }

    // Alternative method for address validation (using backend proxy)
    async validateAddressAlternative(address1, address2, city, state, zip5) {
        try {
            // This would call your backend endpoint
            const response = await fetch('/api/usps/validate-address', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    address1,
                    address2,
                    city,
                    state,
                    zip5
                })
            });

            if (response.ok) {
                return await response.json();
            }
        } catch (error) {
            console.error('Alternative address validation failed:', error);
        }
        
        return { error: 'Failed to validate address with USPS' };
    }

    // Parse USPS address validation response
    parseAddressValidationResponse(xmlText) {
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

    // Calculate domestic shipping rates using USPS Rate API
    async calculateShippingRates(zipFrom, zipTo, weight = 16) { // weight in ounces (1 pound = 16 ounces)
        const xmlRequest = `<?xml version="1.0"?>
            <RateV4Request USERID="${this.userId}">
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

        try {
            // For direct browser calls, we need to handle CORS
            // Using a CORS proxy for development
            const proxyUrl = 'https://cors-anywhere.herokuapp.com/';
            const url = `${proxyUrl}${this.baseUrl}?API=RateV4&XML=${encodeURIComponent(xmlRequest)}`;
            
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const xmlText = await response.text();
            console.log('USPS Shipping Rate Response:', xmlText);
            return this.parseShippingResponse(xmlText);
        } catch (error) {
            console.error('USPS Shipping Rate Error:', error);
            // Try alternative method using backend proxy
            return this.calculateShippingRatesAlternative(zipFrom, zipTo, weight);
        }
    }

    // Alternative method for shipping rates (using backend proxy)
    async calculateShippingRatesAlternative(zipFrom, zipTo, weight) {
        try {
            // This would call your backend endpoint
            const response = await fetch('/api/usps/shipping-rates', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    zipFrom,
                    zipTo,
                    weight
                })
            });

            if (response.ok) {
                return await response.json();
            }
        } catch (error) {
            console.error('Alternative shipping calculation failed:', error);
        }
        
        return { error: 'Failed to calculate shipping rates' };
    }

    // Parse USPS shipping rate response
    parseShippingResponse(xmlText) {
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
                        estimatedDays: days ? this.calculateDays(days) : null
                    });
                }
            });
        }

        return { rates };
    }

    // Calculate estimated delivery days from commitment date
    calculateDays(commitmentDate) {
        if (!commitmentDate) return null;
        
        const today = new Date();
        const deliveryDate = new Date(commitmentDate);
        const diffTime = Math.abs(deliveryDate - today);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        return diffDays;
    }

    // Get shipping rates with fallback for demo purposes
    async getShippingRates(zipFrom, zipTo, weight = 16) {
        // If no USPS User ID is configured, use demo rates
        if (this.userId === 'YOUR_USPS_USER_ID') {
            return this.getDemoShippingRates(zipTo);
        }

        const result = await this.calculateShippingRates(zipFrom, zipTo, weight);
        
        if (result.error) {
            // Fallback to demo rates if USPS API fails
            return this.getDemoShippingRates(zipTo);
        }
        
        return result;
    }

    // Demo shipping rates for testing
    getDemoShippingRates(zipTo) {
        // Simulate different rates based on ZIP code regions
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
        // If no USPS User ID is configured, use demo validation
        if (this.userId === 'YOUR_USPS_USER_ID') {
            return this.getDemoAddressValidation(address1, city, state, zip5);
        }

        const result = await this.validateAddress(address1, address2, city, state, zip5);
        
        if (result.error) {
            // Fallback to demo validation
            return this.getDemoAddressValidation(address1, city, state, zip5);
        }
        
        return result;
    }

    // Demo address validation for testing
    getDemoAddressValidation(address1, city, state, zip5) {
        // Basic validation
        if (!address1 || !city || !state || !zip5) {
            return { error: 'All address fields are required' };
        }

        if (zip5.length !== 5 || !/^\d{5}$/.test(zip5)) {
            return { error: 'Invalid ZIP code format' };
        }

        // Simulate successful validation
        return {
            isValid: true,
            message: 'Address format is valid',
            zip4: '1234',
            carrierRoute: 'C001'
        };
    }
}

// Export for use in the main application
window.USPSAPI = USPSAPI;
