import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// 配置文件路径
const CONFIG_PATH = path.join(process.cwd(), 'config', 'models.json');

// 确保配置目录存在
if (!fs.existsSync(path.dirname(CONFIG_PATH))) {
  fs.mkdirSync(path.dirname(CONFIG_PATH), { recursive: true });
}

// 读取模型配置
export async function GET() {
  try {
    // 检查文件是否存在
    if (!fs.existsSync(CONFIG_PATH)) {
      return NextResponse.json(
        { error: '模型配置文件不存在' },
        { status: 404 }
      );
    }

    // 读取配置文件
    const configData = fs.readFileSync(CONFIG_PATH, 'utf8');
    const config = JSON.parse(configData);

    return NextResponse.json(config.models);
  } catch (error) {
    console.error('读取模型配置出错:', error);
    return NextResponse.json(
      { error: '读取模型配置失败' },
      { status: 500 }
    );
  }
}

// 保存模型配置
export async function POST(request: Request) {
  try {
    const { models } = await request.json();

    // 验证配置数据
    if (!models || !Array.isArray(models)) {
      return NextResponse.json(
        { error: '无效的配置数据' },
        { status: 400 }
      );
    }

    // 格式化JSON以便于阅读
    const formattedConfig = JSON.stringify({ models }, null, 2);

    // 写入配置文件
    fs.writeFileSync(CONFIG_PATH, formattedConfig, 'utf8');

    // 更新环境变量
    const activeModel = models.find(model => model.isActive);
    if (activeModel) {
      if (activeModel.type === 'ollama') {
        process.env.OLLAMA_API_URL = activeModel.apiUrl;
        process.env.OLLAMA_MODEL = activeModel.modelName;
      } else {
        process.env.OPENROUTER_API_URL = activeModel.apiUrl;
        process.env.OPENROUTER_API_KEY = activeModel.apiKey;
        process.env.OPENROUTER_MODEL = activeModel.modelName;
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('保存模型配置出错:', error);
    return NextResponse.json(
      { error: '保存模型配置失败' },
      { status: 500 }
    );
  }
} 