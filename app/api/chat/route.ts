import { NextResponse } from 'next/server'
import { getPromptByScenarioId } from '@/prompts/system_prompts'

interface ChatMessage {
  role: string
  content: string
}

interface FileContent {
  filename: string
  content: string
}

export async function POST(request: Request) {
  try {
    const { scenarioId, conversationHistory, isMultiRound, fileContents } = await request.json()
    
    // 从提示词文件中获取系统提示词
    const systemPrompt = await getPromptByScenarioId(scenarioId, fileContents)
    
    // 构建消息数组
    const messages: ChatMessage[] = []
    messages.push({ role: "system", content: systemPrompt })
    
    // 添加对话历史
    if (conversationHistory && conversationHistory.length > 0) {
      messages.push(...conversationHistory)
    }

    // 检查环境变量
    if (!process.env.OPENROUTER_API_KEY || !process.env.OPENROUTER_API_URL || !process.env.OPENROUTER_MODEL) {
      console.error('缺少必要的环境变量配置')
      return NextResponse.json(
        { error: '系统配置错误' },
        { status: 500 }
      )
    }
    
    // 调用OpenRouter API
    try {
      console.log('正在调用OpenRouter API...')
      
      const response = await fetch(`${process.env.OPENROUTER_API_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'HTTP-Referer': 'https://localhost:3000',
          'X-Title': 'Public Security AI Assistant',
          'OpenAI-Organization': 'cursor-ai'
        },
        body: JSON.stringify({
          model: process.env.OPENROUTER_MODEL,
          messages: messages,
          temperature: 0.7,
          max_tokens: 4000,
        }),
      })

      console.log('发送给API的消息数组:', messages.map(m => ({
        role: m.role,
        contentLength: m.content.length,
        preview: m.content.substring(0, 100) + '...'
      })))

      if (!response.ok) {
        const errorText = await response.text()
        console.error('OpenRouter API 响应错误:', response.status, errorText)
        throw new Error(`API响应错误: ${response.status} ${errorText}`)
      }

      const data = await response.json()
      
      if (!data.choices?.[0]?.message?.content) {
        console.error('API响应格式错误:', data)
        throw new Error('API响应格式错误')
      }

      return NextResponse.json({ response: data.choices[0].message.content })
    } catch (apiError: any) {
      console.error('调用OpenRouter API时出错:', apiError)
      throw new Error(`调用AI服务出错: ${apiError.message}`)
    }
    
  } catch (error: any) {
    console.error('处理请求时出错:', error)
    return NextResponse.json(
      { error: `处理请求时出错: ${error.message}` },
      { status: 500 }
    )
  }
} 