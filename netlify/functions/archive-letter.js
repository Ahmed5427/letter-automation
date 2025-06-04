const https = require('https');
const http = require('http');
const { URL } = require('url');

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

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
    console.log('Archive function called');
    
    const requestData = JSON.parse(event.body);
    console.log('Archive request data:', requestData);

    // Simple JSON post instead of multipart form data
    const postData = JSON.stringify(requestData);
    
    const options = {
      hostname: '128.140.37.194',
      port: 5000,
      path: '/archive-letter',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      },
      timeout: 15000
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
        reject(error);
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });

      req.write(postData);
      req.end();
    });

    console.log('Archive API response:', response.statusCode);

    let responseData;
    try {
      responseData = JSON.parse(response.data);
    } catch (parseError) {
      responseData = { message: response.data };
    }

    return {
      statusCode: response.statusCode,
      headers,
      body: JSON.stringify(responseData)
    };

  } catch (error) {
    console.error('Archive function error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'خطأ في حفظ الخطاب',
        message: error.message 
      })
    };
  }
};
