interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OpenRouterResponse {
  choices: {
    message: {
      content: string;
      role: string;
    };
  }[];
}

// 清理多余空行的函数
function cleanupExcessiveWhitespace(text: string): string {
  // 将连续的多个空行（两个以上的换行符）替换为最多两个换行符
  const cleanedText = text.replace(/\n{3,}/g, '\n\n');
  // 去除开头的空行
  return cleanedText.replace(/^\s+/, '');
}

export async function chatWithAI(messages: ChatMessage[], signal?: AbortSignal): Promise<string> {
  try {
    console.log('正在发送请求到 OpenRouter API...');
    
    // 构建请求体
    const requestBody = {
      model: process.env.OPENROUTER_MODEL || 'deepseek/deepseek-r1:free',
      messages: messages,
      temperature: 0.7,
      max_tokens: 4000,
    };
    
    console.log('请求体:', JSON.stringify(requestBody).substring(0, 200) + '...');
    
    // 使用 node-fetch 或全局 fetch
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'HTTP-Referer': 'localhost:3000',
        'X-Title': 'Public Security AI Assistant'
      },
      body: JSON.stringify(requestBody),
      signal, // 添加信号以支持中止
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API响应错误:', response.status, response.statusText);
      console.error('错误详情:', errorText);
      throw new Error(`API请求失败: ${response.status} - ${errorText.substring(0, 200)}...`);
    }

    const responseText = await response.text();
    
    // 检查响应是否为空或只包含空白字符
    if (!responseText.trim()) {
      console.error('API响应为空');
      throw new Error('API响应为空');
    }
    
    console.log('API响应原始内容长度:', responseText.length);
    console.log('API响应前200个字符:', JSON.stringify(responseText.substring(0, 200)));
    
    try {
      const data = JSON.parse(responseText) as OpenRouterResponse;
      
      if (!data.choices || !data.choices.length || !data.choices[0].message) {
        console.error('API响应格式不正确:', JSON.stringify(data));
        throw new Error('API响应格式不正确');
      }
      
      // 获取内容并清理多余空行
      let content = data.choices[0].message.content.trim();
      content = cleanupExcessiveWhitespace(content);
      
      console.log('解析后的内容长度:', content.length);
      console.log('解析后的内容前200个字符:', content.substring(0, 200));
      
      return content;
    } catch (parseError: any) {
      console.error('JSON解析错误:', parseError);
      console.error('尝试解析的内容:', responseText);
      throw new Error(`无法解析API响应: ${parseError.message}`);
    }
  } catch (error) {
    console.error('API调用错误:', error);
    throw error;
  }
} 