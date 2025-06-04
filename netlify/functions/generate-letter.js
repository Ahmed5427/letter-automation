const fetch = require('node-fetch');

exports.handler = async (event, context) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    console.log('Function called with body:', event.body);
    
    const requestData = JSON.parse(event.body);
    console.log('Parsed request data:', requestData);

    console.log('Making request to external API...');
    
    // Much longer timeout - wait for real API response
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.log('Request timing out after 25 seconds');
      controller.abort();
    }, 25000); // 25 seconds timeout

    const response = await fetch('http://128.140.37.194:5000/generate-letter', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData),
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    console.log('API response status:', response.status);

    if (!response.ok) {
      throw new Error(`API returned ${response.status}: ${response.statusText}`);
    }

    const responseText = await response.text();
    console.log('API response text:', responseText);

    // Try to parse as JSON
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch (parseError) {
      console.log('Response is not JSON, treating as text');
      responseData = { 
        letter: responseText, 
        content: responseText,
        source: 'api' 
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(responseData)
    };

  } catch (error) {
    console.error('Function error:', error);
    
    let errorMessage = 'خطأ في الخادم';
    let statusCode = 500;
    
    if (error.name === 'AbortError') {
      errorMessage = 'انتهت مهلة الاتصال مع API';
      statusCode = 408; // Request Timeout
    } else if (error.message.includes('ECONNREFUSED')) {
      errorMessage = 'فشل الاتصال بخادم API';
      statusCode = 503; // Service Unavailable
    } else if (error.message.includes('API returned')) {
      errorMessage = error.message;
      statusCode = 502; // Bad Gateway
    }
    
    return {
      statusCode: statusCode,
      headers,
      body: JSON.stringify({ 
        error: errorMessage,
        message: error.message,
        type: error.name 
      })
    };
  }
};