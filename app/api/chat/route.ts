import { NextResponse } from 'next/server'
import { getPromptByScenarioId } from '@/prompts/system_prompts'
import fs from 'fs'
import path from 'path'

interface ChatMessage {
  role: string
  content: string
}

interface FileContent {
  filename: string
  content: string
}

// 配置文件路径
const CONFIG_PATH = path.join(process.cwd(), 'config', 'models.json')

export async function POST(request: Request) {
  try {
    const { scenarioId, conversationHistory, isMultiRound, fileContents } = await request.json()
    // 获取系统提示词
    const systemPrompt = await getPromptByScenarioId(scenarioId, fileContents)
    // 构建消息数组
    const messages: ChatMessage[] = []
    messages.push({ role: "system", content: systemPrompt })
    if (conversationHistory && conversationHistory.length > 0) {
      messages.push(...conversationHistory)
    }

    // 读取当前激活的模型配置
    const configData = fs.readFileSync(CONFIG_PATH, 'utf8')
    const config = JSON.parse(configData)
    const activeModel = config.models.find((m: any) => m.isActive)
    if (!activeModel) {
      return NextResponse.json({ error: '未找到激活模型' }, { status: 500 })
    }

    let response, data, content
    if (activeModel.type === 'ollama') {
      console.log('正在调用Ollama API...')
      response = await fetch(`${activeModel.apiUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: activeModel.modelName, messages, stream: false }),
      })
      data = await response.json()
      content = data.message?.content || data.choices?.[0]?.message?.content || data.choices?.[0]?.text || ''
    } else if (activeModel.type === 'openrouter') {
      console.log('正在调用OpenRouter API...')
      response = await fetch(`${activeModel.apiUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'HTTP-Referer': 'https://localhost:3000',
          'X-Title': 'Public Security AI Assistant',
          'OpenAI-Organization': 'cursor-ai'
        },
        body: JSON.stringify({ model: activeModel.modelName, messages, temperature: 0.7, max_tokens: 4000 }),
      })
      data = await response.json()
      content = data.choices?.[0]?.message?.content || ''
    } else if (activeModel.type === 'telcom') {
      console.log('正在调用Telcom API...')
      response = await fetch(activeModel.apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: activeModel.modelName, messages, temperature: 0.7, max_tokens: 4000 }),
      })
      data = await response.json()
      content = data.choices?.[0]?.message?.content || data.result || ''
    } else {
      return NextResponse.json({ error: '未知模型类型' }, { status: 500 })
    }

    if (!response.ok) {
      const errorText = await response.text()
      return NextResponse.json({ error: errorText }, { status: response.status })
    }
    if (!content) {
      return NextResponse.json({ error: 'API响应内容为空' }, { status: 500 })
    }
    // 统一过滤 <think> 或 thinking 内容
    content = content
      .replace(/<think>[\s\S]*?<\/think>/gi, '')
      .replace(/thinking[.。…]*$/i, '')
      .trim()
    return NextResponse.json({ response: content })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}