import { NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const id = url.searchParams.get('id')
    const type = url.searchParams.get('type') // 新增type参数，用于区分是获取目录列表还是文件内容
    const file = url.searchParams.get('file') // 新增file参数，用于获取具体文件内容
    
    if (!id) {
      return NextResponse.json(
        { error: '缺少场景 ID 参数' },
        { status: 400 }
      )
    }

    // 根据阶段ID获取对应的目录名
    const stageDirs = {
      '1': '1、立案前材料',
      '2': '2、刑拘前材料',
      '3': '3、报捕前材料',
      '4': '4、起诉前材料'
    }
    
    const stageDir = stageDirs[id as keyof typeof stageDirs]
    if (!stageDir) {
      return NextResponse.json(
        { error: '无效的阶段 ID' },
        { status: 400 }
      )
    }

    const dirPath = path.join(process.cwd(), 'data', 'scenarios', stageDir)

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
        const filePath = path.join(dirPath, file)
        console.log(`正在读取文件: ${filePath}`)
        const content = await fs.readFile(filePath, 'utf-8')
        console.log(`成功读取文件: ${file}，内容长度: ${content.length}`)
        console.log(`文件内容前200个字符: ${content.substring(0, 200)}...`)
        return NextResponse.json({ content })
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