import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function POST(request: Request) {
  try {
    // 验证请求权限（生产环境应该有更复杂的验证机制）
    // 如果没有访问权限，返回403
    
    const { config } = await request.json()
    
    if (!config || !config.scenarioCategories) {
      return NextResponse.json(
        { error: '无效的配置数据' },
        { status: 400 }
      )
    }
    
    // 配置文件路径
    const configPath = path.join(process.cwd(), 'app', 'data', 'scenarios-config.json')
    
    // 写入配置文件
    try {
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8')
      
      console.log('配置文件已保存:', configPath)
      
      return NextResponse.json({ success: true })
    } catch (error) {
      console.error('写入配置文件失败:', error)
      return NextResponse.json(
        { error: '保存配置失败' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('处理请求错误:', error)
    return NextResponse.json(
      { error: '处理请求时出错' },
      { status: 500 }
    )
  }
} 