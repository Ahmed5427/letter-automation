const http = require('http');

exports.handler = async (event, context) => {
  // Increase function timeout
  context.callbackWaitsForEmptyEventLoop = false;
  
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
    console.log('Function started at:', new Date().toISOString());
    
    const requestData = JSON.parse(event.body);
    console.log('Parsed request data:', JSON.stringify(requestData, null, 2));

    const postData = JSON.stringify(requestData);
    
    const options = {
      hostname: '128.140.37.194',
      port: 5000,
      path: '/generate-letter',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    console.log('Making request to API...');

    // Reduce the HTTP timeout to ensure we get a response before Netlify times out
    const response = await Promise.race([
      new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
          console.log('API responded with status:', res.statusCode);
          
          let data = '';
          
          res.on('data', (chunk) => {
            data += chunk;
          });
          
          res.on('end', () => {
            console.log('Response received at:', new Date().toISOString());
            console.log('Response data length:', data.length);
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

        // Set shorter timeout - 8 seconds to stay under Netlify's 10s limit
        req.setTimeout(8000, () => {
          console.log('HTTP request timeout after 8 seconds');
          req.destroy();
          reject(new Error('HTTP request timeout'));
        });

        req.write(postData);
        req.end();
      }),
      
      // Also add a Promise.race timeout as backup
      new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error('Function timeout - taking too long'));
        }, 9000); // 9 seconds total function timeout
      })
    ]);

    console.log('Response status:', response.statusCode);
    console.log('Response data preview:', response.data.substring(0, 200) + '...');
    
    if (response.statusCode !== 200) {
      console.error('API error response:', response.data);
      throw new Error(`API returned ${response.statusCode}: ${response.data}`);
    }

    // Parse response
    let responseData;
    try {
      responseData = JSON.parse(response.data);
      console.log('Parsed response successfully');
    } catch (parseError) {
      console.log('Response is not JSON, treating as text');
      responseData = { 
        letter: response.data, 
        content: response.data
      };
    }

    console.log('Function completed successfully at:', new Date().toISOString());

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(responseData)
    };

  } catch (error) {
    console.error('Function error:', error);
    console.error('Error occurred at:', new Date().toISOString());
    
    let errorMessage = 'خطأ في الخادم';
    let statusCode = 500;
    
    if (error.message.includes('timeout')) {
      errorMessage = 'الخادم يستغرق وقتاً أطول من المتوقع';
      statusCode = 408;
    } else if (error.code === 'ECONNREFUSED') {
      errorMessage = 'خادم AI غير متاح حالياً';
      statusCode = 503;
    }
    
    return {
      statusCode: statusCode,
      headers,
      body: JSON.stringify({ 
        error: errorMessage,
        details: error.message,
        timestamp: new Date().toISOString()
      })
    };
  }
};
