const axios = require('axios');

async function testCheckoutFlow() {
  const API_URL = 'http://localhost:3001/api';
  let token = null;
  let sessionCookie = null;

  try {
    console.log('1. Creating a new cart/session...');
    // First get a cart to establish session
    const cartResponse = await axios.get(`${API_URL}/cart`, {
      withCredentials: true,
    });
    console.log('Cart response:', cartResponse.data);
    
    // Store session cookie
    const setCookieHeader = cartResponse.headers['set-cookie'];
    if (setCookieHeader) {
      sessionCookie = setCookieHeader[0];
      console.log('Session cookie:', sessionCookie);
    }

    console.log('\n2. Adding a product to cart...');
    const addToCartResponse = await axios.post(
      `${API_URL}/cart/items`,
      {
        productId: 1, // Assuming product ID 1 exists
        quantity: 1,
      },
      {
        headers: sessionCookie ? { Cookie: sessionCookie } : {},
        withCredentials: true,
      }
    );
    console.log('Add to cart response:', addToCartResponse.data);

    console.log('\n3. Attempting to checkout without login...');
    try {
      const checkoutResponse = await axios.get(`${API_URL}/checkout`, {
        headers: sessionCookie ? { Cookie: sessionCookie } : {},
        withCredentials: true,
      });
      console.log('Checkout response (should fail):', checkoutResponse.data);
    } catch (error) {
      console.log('Expected error - need to login:', error.response?.status, error.response?.data);
    }

    console.log('\n4. Logging in...');
    const loginResponse = await axios.post(
      `${API_URL}/auth/login`,
      {
        email: 'user@cobytes.com',
        password: 'pass',
      },
      {
        headers: sessionCookie ? { Cookie: sessionCookie } : {},
        withCredentials: true,
      }
    );
    console.log('Login response:', loginResponse.data);
    
    if (loginResponse.data.data?.token) {
      token = loginResponse.data.data.token;
      console.log('Got token:', token);
    }

    console.log('\n5. Fetching user data after login...');
    const meResponse = await axios.get(`${API_URL}/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
        ...(sessionCookie ? { Cookie: sessionCookie } : {}),
      },
      withCredentials: true,
    });
    console.log('Me response:', meResponse.data);

    console.log('\n6. Fetching cart after login...');
    const cartAfterLoginResponse = await axios.get(`${API_URL}/cart`, {
      headers: {
        Authorization: `Bearer ${token}`,
        ...(sessionCookie ? { Cookie: sessionCookie } : {}),
      },
      withCredentials: true,
    });
    console.log('Cart after login:', cartAfterLoginResponse.data);

  } catch (error) {
    console.error('\nError occurred:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
      console.error('Response headers:', error.response.headers);
    }
  }
}

testCheckoutFlow();