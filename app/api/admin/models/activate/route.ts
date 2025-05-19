import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// 配置文件路径
const CONFIG_PATH = path.join(process.cwd(), 'config', 'models.json');

export async function POST(request: Request) {
  try {
    const { modelId } = await request.json();

    // 读取当前配置
    const configData = fs.readFileSync(CONFIG_PATH, 'utf8');
    const config = JSON.parse(configData);

    // 更新活动模型
    const updatedModels = config.models.map((model: any) => ({
      ...model,
      isActive: model.id === modelId,
    }));

    // 保存更新后的配置
    fs.writeFileSync(
      CONFIG_PATH,
      JSON.stringify({ models: updatedModels }, null, 2),
      'utf8'
    );

    // 更新环境变量
    const activeModel = updatedModels.find((m: any) => m.isActive);
    if (activeModel) {
      if (activeModel.type === 'ollama') {
        process.env.OLLAMA_API_URL = activeModel.apiUrl;
        process.env.OLLAMA_MODEL = activeModel.modelName;
      } else if (activeModel.type === 'openrouter') {
        process.env.OPENROUTER_API_URL = activeModel.apiUrl;
        process.env.OPENROUTER_MODEL = activeModel.modelName;
      } else if (activeModel.type === 'telcom') {
        process.env.URL = activeModel.apiUrl;
        process.env.MODEL = activeModel.modelName;
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('激活模型出错:', error);
    return NextResponse.json(
      { error: '激活模型失败' },
      { status: 500 }
    );
  }
} 