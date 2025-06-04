const FormData = require('form-data');
const fetch = require('node-fetch');

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    // Parse the multipart form data from the request
    const requestData = JSON.parse(event.body);
    
    // Create form data for the API
    const formData = new FormData();
    
    // Add all the fields
    Object.keys(requestData).forEach(key => {
      if (key === 'file') {
        // Handle file data - convert back to buffer if needed
        const fileBuffer = Buffer.from(requestData[key], 'base64');
        formData.append('file', fileBuffer, 'letter.docx');
      } else {
        formData.append(key, requestData[key]);
      }
    });

    console.log('Proxying archive request');

    const response = await fetch('http://128.140.37.194:5000/archive-letter', {
      method: 'POST',
      body: formData,
    });

    const responseText = await response.text();
    console.log('Archive API Response:', responseText);

    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch (parseError) {
      responseData = { message: responseText };
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
    console.error('Error in archive-letter function:', error);
    
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