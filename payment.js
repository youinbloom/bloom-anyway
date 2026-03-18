// Payment Processing Integration for Bloom Anyway Book Website
// This file handles payment processing with Stripe and PayPal

class PaymentProcessor {
    constructor() {
        // Stripe configuration - replace with your actual Stripe publishable key
        this.stripePublishableKey = 'pk_test_YOUR_STRIPE_PUBLISHABLE_KEY'; // Replace with your key
        
        // PayPal configuration - replace with your actual PayPal client ID
        this.payPalClientId = 'YOUR_PAYPAL_CLIENT_ID'; // Replace with your client ID
        
        this.bookPrice = 19.99;
        this.currency = 'USD';
    }

    // Initialize Stripe
    async initializeStripe() {
        if (typeof Stripe === 'undefined') {
            // Load Stripe script if not already loaded
            await this.loadScript('https://js.stripe.com/v3/');
        }
        
        if (this.stripePublishableKey !== 'pk_test_YOUR_STRIPE_PUBLISHABLE_KEY') {
            this.stripe = Stripe(this.stripePublishableKey);
            return true;
        }
        
        return false; // Demo mode
    }

    // Initialize PayPal
    async initializePayPal() {
        if (typeof paypal === 'undefined') {
            // Load PayPal script if not already loaded
            await this.loadScript(`https://www.paypal.com/sdk/js?client-id=${this.payPalClientId}&currency=${this.currency}`);
        }
        
        if (this.payPalClientId !== 'YOUR_PAYPAL_CLIENT_ID') {
            return true;
        }
        
        return false; // Demo mode
    }

    // Load external script dynamically
    loadScript(src) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    // Process payment with Stripe
    async processStripePayment(orderDetails) {
        try {
            const isInitialized = await this.initializeStripe();
            
            if (!isInitialized) {
                return this.demoPayment('Stripe', orderDetails);
            }

            // Create payment intent on your server
            const response = await fetch('/create-payment-intent', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    amount: Math.round(orderDetails.total * 100), // Convert to cents
                    currency: this.currency,
                    orderDetails: orderDetails
                })
            });

            const { client_secret } = await response.json();

            // Confirm payment on the client
            const { error, paymentIntent } = await this.stripe.confirmCardPayment(client_secret, {
                payment_method: {
                    card: this.stripe.elements.getElement('card'),
                    billing_details: {
                        name: `${orderDetails.firstName} ${orderDetails.lastName}`,
                        address: {
                            line1: orderDetails.address1,
                            line2: orderDetails.address2,
                            city: orderDetails.city,
                            state: orderDetails.state,
                            postal_code: orderDetails.zipCode,
                            country: 'US',
                        },
                    },
                }
            });

            if (error) {
                throw new Error(error.message);
            }

            return {
                success: true,
                paymentId: paymentIntent.id,
                status: paymentIntent.status,
                method: 'Stripe'
            };

        } catch (error) {
            console.error('Stripe payment error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Process payment with PayPal
    async processPayPalPayment(orderDetails) {
        try {
            const isInitialized = await this.initializePayPal();
            
            if (!isInitialized) {
                return this.demoPayment('PayPal', orderDetails);
            }

            return new Promise((resolve, reject) => {
                paypal.Buttons({
                    createOrder: (data, actions) => {
                        return actions.order.create({
                            purchase_units: [{
                                amount: {
                                    value: orderDetails.total.toFixed(2),
                                    currency_code: this.currency
                                },
                                description: 'Bloom Anyway Book',
                                custom_id: orderDetails.orderId
                            }]
                        });
                    },
                    onApprove: (data, actions) => {
                        return actions.order.capture().then((details) => {
                            resolve({
                                success: true,
                                paymentId: details.id,
                                status: details.status,
                                method: 'PayPal',
                                payer: details.payer
                            });
                        });
                    },
                    onError: (err) => {
                        reject(new Error('PayPal payment failed'));
                    }
                }).render('#paypal-button-container');
            });

        } catch (error) {
            console.error('PayPal payment error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Demo payment for testing purposes
    demoPayment(method, orderDetails) {
        return new Promise((resolve) => {
            // Simulate payment processing
            setTimeout(() => {
                resolve({
                    success: true,
                    paymentId: `demo_${method}_${Date.now()}`,
                    status: 'completed',
                    method: method,
                    demo: true,
                    message: `This is a demo ${method} payment. In production, this would process a real payment.`
                });
            }, 2000);
        });
    }

    // Create order details object
    createOrderDetails(formData) {
        return {
            orderId: `BA_${Date.now()}`,
            firstName: formData.get('firstName'),
            lastName: formData.get('lastName'),
            email: formData.get('email'),
            phone: formData.get('phone'),
            address1: formData.get('address1'),
            address2: formData.get('address2'),
            city: formData.get('city'),
            state: formData.get('state'),
            zipCode: formData.get('zipCode'),
            bookPrice: this.bookPrice,
            shippingCost: formData.get('shippingCost'),
            total: formData.get('total'),
            timestamp: new Date().toISOString()
        };
    }

    // Send order confirmation email (this would be handled by your backend)
    async sendOrderConfirmation(orderDetails) {
        try {
            // In production, this would call your backend API
            const response = await fetch('/send-order-confirmation', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(orderDetails)
            });

            if (response.ok) {
                return { success: true };
            } else {
                throw new Error('Failed to send confirmation email');
            }
        } catch (error) {
            console.error('Email sending error:', error);
            return { success: false, error: error.message };
        }
    }

    // Show payment success message
    showPaymentSuccess(result, orderDetails) {
        const modal = document.getElementById('purchaseModal');
        const modalContent = modal.querySelector('.bg-white');
        
        modalContent.innerHTML = `
            <div class="p-8 text-center">
                <div class="mb-6">
                    <i class="fas fa-check-circle text-green-500 text-6xl"></i>
                </div>
                <h2 class="text-2xl font-bold mb-4">Order Confirmed!</h2>
                <div class="bg-gray-50 p-4 rounded-lg mb-6">
                    <p class="text-lg mb-2">Thank you for your order!</p>
                    <p class="text-gray-600 mb-2">Order ID: ${orderDetails.orderId}</p>
                    <p class="text-gray-600 mb-2">Payment Method: ${result.method}</p>
                    <p class="text-gray-600 mb-2">Total: $${orderDetails.total}</p>
                    <p class="text-gray-600">You will receive a confirmation email shortly.</p>
                </div>
                ${result.demo ? '<p class="text-orange-500 text-sm mb-4">This was a demo payment. No actual charges were made.</p>' : ''}
                <button onclick="closePurchaseModal()" class="bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-700 transition">
                    Close
                </button>
            </div>
        `;
    }

    // Show payment error message
    showPaymentError(error) {
        alert(`Payment failed: ${error}. Please try again or contact support.`);
    }
}

// Export for use in the main application
window.PaymentProcessor = PaymentProcessor;
