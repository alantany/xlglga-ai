import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// 配置文件路径
const CONFIG_PATH = path.join(process.cwd(), 'prompts', 'ui_prompts.json');

// 读取提示词配置
export async function GET() {
  try {
    // 检查文件是否存在
    if (!fs.existsSync(CONFIG_PATH)) {
      return NextResponse.json(
        { error: '提示词配置文件不存在' },
        { status: 404 }
      );
    }

    // 读取配置文件
    const configData = fs.readFileSync(CONFIG_PATH, 'utf8');
    const config = JSON.parse(configData);

    return NextResponse.json(config);
  } catch (error) {
    console.error('读取提示词配置出错:', error);
    return NextResponse.json(
      { error: '读取提示词配置失败' },
      { status: 500 }
    );
  }
}

// 保存提示词配置
export async function POST(request: Request) {
  try {
    const config = await request.json();

    // 验证配置数据
    if (!config || !config.systemPrompts) {
      return NextResponse.json(
        { error: '无效的配置数据' },
        { status: 400 }
      );
    }

    // 格式化JSON以便于阅读
    const formattedConfig = JSON.stringify(config, null, 2);

    // 写入配置文件
    fs.writeFileSync(CONFIG_PATH, formattedConfig, 'utf8');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('保存提示词配置出错:', error);
    return NextResponse.json(
      { error: '保存提示词配置失败' },
      { status: 500 }
    );
  }
} 