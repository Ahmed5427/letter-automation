exports.handler = async (event, context) => {
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    // Parse the request body
    const requestData = JSON.parse(event.body);
    
    console.log('Proxying request to API:', requestData);

    // Make the request to your API
    const fetch = require('node-fetch');
    const response = await fetch('http://128.140.37.194:5000/generate-letter', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData),
    });

    const responseText = await response.text();
    console.log('API Response:', responseText);

    // Try to parse as JSON, fallback to text
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch (parseError) {
      responseData = { content: responseText };
    }

    return {
      statusCode: response.status,
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(responseData),
    };

  } catch (error) {
    console.error('Error in generate-letter function:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: error.message 
      }),
    };
  }
};