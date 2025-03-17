import { NextResponse } from 'next/server'
import { chatWithAI } from '@/lib/openrouter'
import fs from 'fs/promises'
import path from 'path'

// 定义对话消息类型
interface ChatMessage {
  role: string;
  content: string;
}

export async function POST(request: Request) {
  try {
    // 获取请求的信号
    const { signal } = request
    
    const { scenarioId, conversationHistory, isMultiRound } = await request.json()
    
    // 读取场景问题文件
    const scenarioPath = path.join(process.cwd(), 'data', 'scenarios', `scenario${scenarioId}.txt`)
    console.log('读取场景文件:', scenarioPath)
    
    let questionContent = ''
    try {
      questionContent = await fs.readFile(scenarioPath, 'utf-8')
      console.log('场景内容长度:', questionContent.length)
      console.log('场景内容前100个字符:', questionContent.substring(0, 100))
    } catch (readError) {
      console.error('读取场景文件错误:', readError)
      return NextResponse.json(
        { error: '无法读取场景文件' },
        { status: 500 }
      )
    }
    
    // 构建消息
    let messages = []
    
    // 系统消息始终是第一条
    messages.push({
      role: "system" as const,
      content: "你是一个专业的公安工作AI助手，擅长案件分析、文书处理和法律咨询。请根据用户的具体需求提供专业、准确的帮助。"
    })
    
    if (isMultiRound && conversationHistory && conversationHistory.length > 0) {
      // 如果是多轮对话，添加场景内容作为上下文，然后添加对话历史
      messages.push({
        role: "user" as const,
        content: "以下是案件的背景信息，请记住这些信息用于后续对话：\n\n" + questionContent
      })
      
      messages.push({
        role: "assistant" as const,
        content: "我已经了解了案件背景信息，请问有什么需要我帮助分析的问题？"
      })
      
      // 添加对话历史
      messages = [...messages, ...(conversationHistory as ChatMessage[]).map(msg => ({
        role: msg.role as "user" | "assistant",
        content: msg.content
      }))]
      
      console.log('多轮对话消息数量:', messages.length)
    } else {
      // 如果是首次对话，直接使用场景内容作为用户问题
      messages.push({
        role: "user" as const,
        content: questionContent
      })
    }
    
    console.log('发送到AI的消息:', JSON.stringify(messages).substring(0, 200) + '...')
    
    // 检查请求是否已被中止
    if (signal?.aborted) {
      console.log('请求已被中止')
      return NextResponse.json({ response: '请求已被用户中止' }, { status: 499 })
    }
    
    // 调用AI API，传递信号
    const aiResponse = await chatWithAI(messages, signal)
    
    return NextResponse.json({ response: aiResponse })
  } catch (error: any) {
    console.error('API错误:', error)
    
    // 如果是中止错误，返回特定状态码
    if (error.name === 'AbortError') {
      return NextResponse.json(
        { error: '请求已被用户中止' },
        { status: 499 }
      )
    }
    
    return NextResponse.json(
      { error: '处理请求时出错' },
      { status: 500 }
    )
  }
} 