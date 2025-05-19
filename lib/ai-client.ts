import { ChatMessage } from './types';

interface ModelConfig {
  name: string;
  type: 'ollama' | 'openrouter';
  apiUrl: string;
  apiKey?: string;
  modelName: string;
  isActive: boolean;
}

// 清理多余空行的函数
function cleanupExcessiveWhitespace(text: string): string {
  const cleanedText = text.replace(/\n{3,}/g, '\n\n');
  return cleanedText.replace(/^\s+/, '');
}

export async function chatWithAI(messages: ChatMessage[], signal?: AbortSignal): Promise<string> {
  try {
    // 获取当前活动的模型配置
    const response = await fetch('/api/admin/models');
    if (!response.ok) {
      throw new Error('无法获取模型配置');
    }
    
    const models: ModelConfig[] = await response.json();
    const activeModel = models.find(model => model.isActive);
    
    if (!activeModel) {
      throw new Error('未找到活动的模型配置');
    }

    console.log('正在发送请求到', activeModel.name, '...');
    
    if (activeModel.type === 'ollama') {
      // 调用Ollama API
      const ollamaResponse = await fetch(`${activeModel.apiUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: activeModel.modelName,
          messages: messages,
          stream: false,
          options: {
            temperature: 0.7,
            num_predict: 4000,
          }
        }),
        signal,
      });

      if (!ollamaResponse.ok) {
        const errorText = await ollamaResponse.text();
        throw new Error(`Ollama API错误: ${ollamaResponse.status} - ${errorText}`);
      }

      const data = await ollamaResponse.json();
      return cleanupExcessiveWhitespace(data.message.content);
    } else {
      // 调用OpenRouter API
      const openRouterResponse = await fetch(`${activeModel.apiUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${activeModel.apiKey}`,
          'HTTP-Referer': 'localhost:3000',
          'X-Title': 'Public Security AI Assistant'
        },
        body: JSON.stringify({
          model: activeModel.modelName,
          messages: messages,
          temperature: 0.7,
          max_tokens: 4000,
        }),
        signal,
      });

      if (!openRouterResponse.ok) {
        const errorText = await openRouterResponse.text();
        throw new Error(`OpenRouter API错误: ${openRouterResponse.status} - ${errorText}`);
      }

      const data = await openRouterResponse.json();
      return cleanupExcessiveWhitespace(data.choices[0].message.content);
    }
  } catch (error) {
    console.error('AI调用错误:', error);
    throw error;
  }
} 