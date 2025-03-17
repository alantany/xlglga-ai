import { NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'

export async function GET(request: Request) {
  try {
    // 获取场景 ID
    const url = new URL(request.url)
    const id = url.searchParams.get('id')
    
    if (!id) {
      return NextResponse.json(
        { error: '缺少场景 ID 参数' },
        { status: 400 }
      )
    }
    
    // 读取场景文件
    const scenarioPath = path.join(process.cwd(), 'data', 'scenarios', `scenario${id}.txt`)
    
    try {
      const content = await fs.readFile(scenarioPath, 'utf-8')
      return NextResponse.json({ content })
    } catch (readError) {
      console.error('读取场景文件错误:', readError)
      return NextResponse.json(
        { error: '无法读取场景文件' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('API错误:', error)
    return NextResponse.json(
      { error: '处理请求时出错' },
      { status: 500 }
    )
  }
} 