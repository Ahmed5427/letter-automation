const http = require('http');

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
    const requestData = JSON.parse(event.body);
    
    // Return immediately and process in background
    setTimeout(async () => {
      try {
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

        const req = http.request(options, (res) => {
          let data = '';
          res.on('data', (chunk) => { data += chunk; });
          res.on('end', () => {
            console.log('Background function completed:', data.substring(0, 100));
          });
        });

        req.write(postData);
        req.end();
        
      } catch (bgError) {
        console.error('Background processing error:', bgError);
      }
    }, 0);

    // Return immediately
    return {
      statusCode: 202, // Accepted
      headers,
      body: JSON.stringify({ 
        message: 'تم إرسال الطلب، جاري المعالجة...',
        status: 'processing' 
      })
    };

  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};