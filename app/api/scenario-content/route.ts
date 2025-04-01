import { NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'
import scenariosConfig from '@/app/data/scenarios-config.json'

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const id = url.searchParams.get('id')
    const type = url.searchParams.get('type') // 新增type参数，用于区分是获取目录列表还是文件内容
    const file = url.searchParams.get('file') // 新增file参数，用于获取具体文件内容
    
    console.log(`请求参数: id=${id}, type=${type}, file=${file || '无'}`)
    
    if (!id) {
      return NextResponse.json(
        { error: '缺少场景 ID 参数' },
        { status: 400 }
      )
    }

    // 从配置文件中查找对应的场景目录
    let stageDir = null;
    for (const category of scenariosConfig.scenarioCategories) {
      for (const subScenario of category.subScenarios) {
        if (subScenario.id === id) {
          stageDir = `${category.baseDirectory}/${subScenario.directory}`;
          break;
        }
      }
      if (stageDir) break;
    }
    
    if (!stageDir) {
      return NextResponse.json(
        { error: '无效的阶段 ID' },
        { status: 400 }
      )
    }

    const dirPath = path.join(process.cwd(), 'data', 'scenarios', stageDir)
    console.log(`实际目录路径: ${dirPath}`)

    // 获取目录文件列表
    if (type === 'list') {
      try {
        console.log(`正在读取目录: ${dirPath}`)
        const files = await fs.readdir(dirPath)
        const txtFiles = files.filter(file => file.endsWith('.txt'))
        console.log(`找到 ${txtFiles.length} 个txt文件:`, txtFiles)
        return NextResponse.json({ files: txtFiles })
      } catch (error) {
        console.error('读取目录错误:', error)
        return NextResponse.json(
          { error: '无法读取目录' },
          { status: 500 }
        )
      }
    }
    
    // 获取具体文件内容
    if (type === 'file' && file) {
      try {
        // 确保文件名正确解码
        const decodedFile = decodeURIComponent(file)
        console.log(`原始文件名: ${file}`)
        console.log(`解码后文件名: ${decodedFile}`)
        
        const filePath = path.join(dirPath, decodedFile)
        console.log(`完整文件路径: ${filePath}`)
        
        // 检查文件是否存在
        try {
          await fs.access(filePath)
          console.log(`文件存在，准备读取内容`)
        } catch (error) {
          console.error(`文件不存在: ${filePath}，错误:`, error)
          return NextResponse.json(
            { error: '文件不存在' },
            { status: 404 }
          )
        }

        // 读取文件内容
        try {
          const content = await fs.readFile(filePath, 'utf-8')
          console.log(`成功读取文件: ${decodedFile}，内容长度: ${content.length}`)
          
          if (!content || content.trim().length === 0) {
            console.error(`文件内容为空: ${decodedFile}`)
            return NextResponse.json(
              { error: '文件内容为空' },
              { status: 404 }
            )
          }

          return NextResponse.json({ content })
        } catch (readError: any) {
          console.error(`读取文件内容错误:`, readError)
          return NextResponse.json(
            { error: `读取文件内容失败: ${readError.message}` },
            { status: 500 }
          )
        }
      } catch (error) {
        console.error('读取文件错误:', error)
        return NextResponse.json(
          { error: '无法读取文件' },
          { status: 500 }
        )
      }
    }

    return NextResponse.json(
      { error: '无效的请求类型' },
      { status: 400 }
    )
  } catch (error) {
    console.error('API错误:', error)
    return NextResponse.json(
      { error: '处理请求时出错' },
      { status: 500 }
    )
  }
} 