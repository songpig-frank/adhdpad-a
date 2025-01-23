
import { config } from './config';

// Helper to enforce summary conciseness
const truncateSummary = (text, originalText) => {
  // Only truncate if absolutely necessary
  if (text.length <= 250) return text;
  
  const maxChars = 250;
  const maxWords = 35;
  
  // Truncate by words first
  let truncated = text.split(/\s+/).slice(0, maxWords).join(' ');
  
  // Then by characters
  if (truncated.length > maxChars) {
    truncated = truncated.substring(0, maxChars).replace(/\s+\S*$/, '...');
  }
  
  return truncated;
};

async function getDeepSeekTitle(text) {
  try {
    const response = await fetch(config.deepseek.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.deepseek.apiKey}`
      },
      body: JSON.stringify({
        model: config.deepseek.model,
        messages: [{
          role: 'system',
          content: `Create a title (3-7 words) and summary that:
1. Faithfully represents the original text's structure and flow
2. Uses direct phrases from the text when possible
3. Identifies key themes in order of importance
4. Never adds new topics or interpretations

Example format:
Title: [Core Theme Identification]
Summary: [Logical progression of main ideas using original language]`
        }, {
          role: 'user',
          content: text
        }]
      })
    });

    if (!response.ok) {
      throw new Error('DeepSeek API request failed');
    }

    const data = await response.json();
    const result = data.choices[0]?.message?.content || '';
    
    const lines = result.split('\n').filter(p => p.trim());
    const title = (lines.find(l => l.toLowerCase().includes('title:'))?.replace('Title:', '').trim() 
      || text.split('.')[0].trim() 
      || 'Untitled').replace(/^\*+\s*/, '');
    let summary = (lines.find(l => l.toLowerCase().includes('summary:'))?.replace('Summary:', '').trim() 
      || text.substring(0, 100).trim() 
      || 'No summary available').replace(/^\*+\s*/, '');
    summary = truncateSummary(summary, text) + ' 1*';

    return {
      title,
      summary,
      model: config.deepseek.model,
      success: true
    };
  } catch (error) {
    console.error('DeepSeek failed, falling back to OpenAI:', error);
    return null;
  }
}

async function getOpenAITitle(text) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.openai.apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages: [{
        role: 'system',
          content: `Create a title (3-7 words) and summary that:
1. Maintains the original text's structure and key phrases
2. Lists main ideas in their original sequence
3. Preserves proportional emphasis between topics
4. Avoids any new interpretations or concepts

Example format:
Title: [Primary Theme]
Summary: [Chronological summary of core ideas]`
      }, {
        role: 'user',
        content: text
      }]
    })
  });

  if (!response.ok) {
    throw new Error('OpenAI API request failed');
  }

  const data = await response.json();
  const result = data.choices[0]?.message?.content || '';
  
  // Extract title and summary with fallbacks
  const lines = result.split('\n').filter(p => p.trim());
  const title = lines.find(l => l.toLowerCase().includes('title:'))?.replace('Title:', '').trim() 
    || text.split('.')[0].trim() 
    || 'Untitled';
  let summary = lines.find(l => l.toLowerCase().includes('summary:'))?.replace('Summary:', '').trim() 
    || text.substring(0, 100).trim() 
    || 'No summary available';
  summary = truncateSummary(summary, text) + ' 2*';

  return {
    title,
    summary,
    model: 'GPT-3.5-turbo',
    success: true
  };
}

export async function testDeepSeekConnection() {
  try {
    const response = await fetch(config.deepseek.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.deepseek.apiKey}`
      },
      body: JSON.stringify({
        model: config.deepseek.model,
        messages: [{
          role: 'system',
          content: 'You are a wise assistant. Share a short proverb for the day.'
        }, {
          role: 'user',
          content: 'Share a proverb for today.'
        }]
      })
    });

    const data = await response.json();
    return {
      success: response.ok,
      proverb: data.choices?.[0]?.message?.content || 'No proverb available',
      error: response.ok ? null : (data.error?.message || 'API request failed'),
      model: data.model || config.deepseek.model,
      tokens: {
        total: data.usage?.total_tokens || 0,
        prompt: data.usage?.prompt_tokens || 0,
        completion: data.usage?.completion_tokens || 0
      }
    };
  } catch (error) {
    return {
      success: false,
      proverb: null,
      error: error.message,
      model: config.deepseek.model
    };
  }
}

export async function testOpenAIConnection() {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.openai.apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [{
          role: 'system',
          content: 'You are a wise assistant. Share a short proverb for the day.'
        }, {
          role: 'user',
          content: 'Share a proverb for today.'
        }]
      })
    });

    const data = await response.json();
    return {
      success: response.ok,
      proverb: data.choices?.[0]?.message?.content || 'No proverb available',
      error: response.ok ? null : (data.error?.message || 'API request failed'),
      model: data.model || 'gpt-3.5-turbo',
      tokens: {
        total: data.usage?.total_tokens || 0,
        prompt: data.usage?.prompt_tokens || 0,
        completion: data.usage?.completion_tokens || 0
      }
    };
  } catch (error) {
    return {
      success: false,
      proverb: null,
      error: error.message
    };
  }
}

export async function generateTitleAndSummary(text) {
  if (!config.deepseek.apiKey && !config.openai.apiKey) {
    throw new Error('No API keys configured');
  }

  // Try DeepSeek first
  if (config.deepseek.apiKey) {
    const deepseekResult = await getDeepSeekTitle(text);
    if (deepseekResult) {
      return deepseekResult;
    }
  }

  // Fall back to OpenAI if DeepSeek fails or is not configured
  if (config.openai.apiKey) {
    return await getOpenAITitle(text);
  }

  throw new Error('All AI services failed');
}
