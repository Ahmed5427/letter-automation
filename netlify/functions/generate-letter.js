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

    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.log('Request timing out after 8 seconds');
      controller.abort();
    }, 8000); // 8 seconds timeout (less than Netlify's 10s limit)

    try {
      console.log('Making request to external API...');
      
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
        throw new Error(`API returned ${response.status}`);
      }

      const responseText = await response.text();
      console.log('API response text:', responseText);

      // Try to parse as JSON
      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch (parseError) {
        console.log('Response is not JSON, treating as text');
        responseData = { letter: responseText, content: responseText };
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(responseData)
      };

    } catch (fetchError) {
      clearTimeout(timeoutId);
      
      if (fetchError.name === 'AbortError') {
        console.log('Request was aborted due to timeout');
        
        // Return a fallback response instead of failing
        const fallbackResponse = {
          letter: generateFallbackLetter(requestData),
          source: 'fallback',
          message: 'تم إنشاء الخطاب باستخدام النظام البديل بسبب بطء الاستجابة'
        };
        
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(fallbackResponse)
        };
      }
      
      throw fetchError;
    }

  } catch (error) {
    console.error('Function error:', error);
    
    // Always return a usable response, even if there's an error
    const requestData = JSON.parse(event.body || '{}');
    const fallbackResponse = {
      letter: generateFallbackLetter(requestData),
      source: 'fallback',
      message: 'تم إنشاء الخطاب باستخدام النظام البديل'
    };
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(fallbackResponse)
    };
  }
};

// Fallback letter generator
function generateFallbackLetter(data) {
  const currentDate = new Date().toLocaleDateString('ar-SA');
  
  return `بسم الله الرحمن الرحيم

${currentDate}

السيد/ة ${data.recipient || 'المحترم/ة'}

السلام عليكم ورحمة الله وبركاته

الموضوع: ${data.title || 'خطاب رسمي'}

${getGreeting(data.tone)}

${data.prompt || 'نتوجه إليكم بهذا الخطاب...'}

${getClosing(data.tone)}

${getSignature(data.tone)}

---
نوع الخطاب: ${data.category || 'عام'}
الغرض: ${data.sub_category || 'مراسلة'}
${data.isFirst ? 'هذه أول مراسلة' : 'هذه مراسلة متابعة'}
`;
}

function getGreeting(tone) {
  switch(tone) {
    case 'ودي':
      return 'نأمل أن تكونوا في أتم الصحة والعافية.';
    case 'رسمي':
      return 'نتشرف بمراسلتكم في هذا الأمر المهم.';
    case 'شبه رسمي':
      return 'يسرنا التواصل معكم بخصوص هذا الموضوع.';
    default:
      return 'نتوجه إليكم بكل احترام وتقدير.';
  }
}

function getClosing(tone) {
  switch(tone) {
    case 'ودي':
      return 'نتطلع إلى ردكم الكريم وتعاونكم المستمر.';
    case 'رسمي':
      return 'نرجو منكم التكرم بالنظر في هذا الطلب واتخاذ اللازم.';
    case 'شبه رسمي':
      return 'نأمل في تعاونكم ونشكركم مقدماً.';
    default:
      return 'شاكرين لكم تعاونكم وحسن استجابتكم.';
  }
}

function getSignature(tone) {
  switch(tone) {
    case 'ودي':
      return 'مع أطيب التمنيات';
    case 'رسمي':
      return 'وتفضلوا بقبول فائق الاحترام والتقدير';
    case 'شبه رسمي':
      return 'وتقبلوا منا أسمى آيات الاحترام';
    default:
      return 'والله الموفق';
  }
}
