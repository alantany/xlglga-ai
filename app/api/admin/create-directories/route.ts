import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

// 定义类型
interface ScenarioConfig {
  scenarioCategories: Array<{
    id: number;
    title: string;
    description: string;
    baseDirectory: string;
    subScenarios: Array<{
      id: string;
      title: string;
      description: string;
      directory: string;
    }>;
  }>;
}

export async function POST(request: Request) {
  try {
    // 验证请求权限（生产环境应该有更复杂的验证机制）
    // 如果没有访问权限，返回403
    
    // 读取配置文件
    const configPath = path.join(process.cwd(), 'app', 'data', 'scenarios-config.json')
    
    // 检查配置文件是否存在
    if (!fs.existsSync(configPath)) {
      return NextResponse.json(
        { error: '配置文件不存在' },
        { status: 404 }
      )
    }
    
    // 读取配置
    const configContent = fs.readFileSync(configPath, 'utf8')
    const config = JSON.parse(configContent) as ScenarioConfig
    
    if (!config || !config.scenarioCategories) {
      return NextResponse.json(
        { error: '无效的配置数据' },
        { status: 400 }
      )
    }
    
    // 基础数据目录
    const baseDir = path.join(process.cwd(), 'data', 'scenarios')
    
    // 确保基础目录存在
    if (!fs.existsSync(baseDir)) {
      fs.mkdirSync(baseDir, { recursive: true })
    }
    
    // 创建场景目录
    const results: string[] = []
    config.scenarioCategories.forEach((category) => {
      // 创建主场景目录
      const categoryPath = path.join(baseDir, category.baseDirectory)
      if (!fs.existsSync(categoryPath)) {
        fs.mkdirSync(categoryPath, { recursive: true })
        results.push(`创建主场景目录: ${category.baseDirectory}`)
      } else {
        results.push(`主场景目录已存在: ${category.baseDirectory}`)
      }
    
      // 创建子场景目录
      category.subScenarios.forEach((subScenario) => {
        const subScenarioPath = path.join(categoryPath, subScenario.directory)
        if (!fs.existsSync(subScenarioPath)) {
          fs.mkdirSync(subScenarioPath, { recursive: true })
          results.push(`创建子场景目录: ${category.baseDirectory}/${subScenario.directory}`)
        } else {
          results.push(`子场景目录已存在: ${category.baseDirectory}/${subScenario.directory}`)
        }
      })
    })
    
    return NextResponse.json({ 
      success: true,
      results
    })
  } catch (error) {
    console.error('处理请求错误:', error)
    return NextResponse.json(
      { error: '处理请求时出错: ' + (error as Error).message },
      { status: 500 }
    )
  }
} 