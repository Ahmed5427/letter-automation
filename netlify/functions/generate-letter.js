const https = require('https');
const http = require('http');

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

    // Use native http module instead of node-fetch
    const postData = JSON.stringify(requestData);
    
    const options = {
      hostname: '128.140.37.194',
      port: 5000,
      path: '/generate-letter',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      },
      timeout: 25000 // 25 seconds
    };

    const response = await new Promise((resolve, reject) => {
      const req = http.request(options, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          resolve({
            statusCode: res.statusCode,
            data: data
          });
        });
      });

      req.on('error', (error) => {
        console.error('Request error:', error);
        reject(error);
      });

      req.on('timeout', () => {
        console.log('Request timeout');
        req.destroy();
        reject(new Error('Request timeout'));
      });

      req.write(postData);
      req.end();
    });

    console.log('API response status:', response.statusCode);
    console.log('API response data:', response.data);

    if (response.statusCode !== 200) {
      throw new Error(`API returned ${response.statusCode}: ${response.data}`);
    }

    // Try to parse as JSON
    let responseData;
    try {
      responseData = JSON.parse(response.data);
    } catch (parseError) {
      console.log('Response is not JSON, treating as text');
      responseData = { 
        letter: response.data, 
        content: response.data,
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
    
    if (error.message.includes('timeout')) {
      errorMessage = 'انتهت مهلة الاتصال مع API';
      statusCode = 408;
    } else if (error.code === 'ECONNREFUSED') {
      errorMessage = 'فشل الاتصال بخادم API';
      statusCode = 503;
    }
    
    return {
      statusCode: statusCode,
      headers,
      body: JSON.stringify({ 
        error: errorMessage,
        message: error.message
      })
    };
  }
};
