import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

interface FileContent {
  filename: string;
  content: string;
}

interface PromptConfig {
  systemPrompts: {
    [key: string]: {
      title: string;
      description: string;
      content: string;
    }
  };
  userMessages: {
    defaultQuestion: string;
    followUpQuestions: string[];
  };
  settings: {
    temperature: number;
    max_tokens: number;
    model: string;
  };
}

// 默认配置，避免文件读取失败时无配置可用
const defaultConfig: PromptConfig = {
  systemPrompts: {
    criminal: {
      title: "刑侦专家提示词",
      description: "用于刑事案件分析场景",
      content: "你是一位经验丰富的刑侦专家。我会给你一些询问笔录的内容：\n\n{FILES}\n\n请根据以上材料，进行专业的分析，并回答我接下来的问题。\n在分析时，请注意：\n1. 关注嫌疑人供述中的矛盾点和关键信息\n2. 分析证人证言与物证的关联性\n3. 根据证据评估案件性质和适用法条\n4. 提出进一步侦查方向和建议\n\n请以客观、专业的口吻回答，避免过度主观判断。"
    },
    traffic: {
      title: "交通事故分析专家提示词",
      description: "用于交通事故分析场景",
      content: "你是一位经验丰富的交通事故分析专家。我会给你一些交通事故相关材料：\n\n{FILES}\n\n请根据以上材料，进行专业的交通事故分析，并回答我接下来的问题。"
    },
    civil: {
      title: "民事案件分析专家提示词",
      description: "用于民事案件分析场景",
      content: "你是一位经验丰富的民事案件分析专家。我会给你一些民事案件相关材料：\n\n{FILES}\n\n请根据以上材料，进行专业的民事案件分析，并回答我接下来的问题。"
    },
    sherlock: {
      title: "福尔摩斯分析专家提示词",
      description: "用于犯罪现场推理分析",
      content: "你是福尔摩斯，世界上最伟大的侦探。我会给你一些犯罪现场相关材料：\n\n{FILES}\n\n请根据以上材料，用你惯有的推理能力进行专业分析，并回答我接下来的问题。注重细节观察和逻辑推理。"
    },
    relationship: {
      title: "关系图谱分析专家提示词",
      description: "用于人物关系分析",
      content: "你是一位专业的关系图谱分析专家。我会给你一些人物关系相关材料：\n\n{FILES}\n\n请根据以上材料，分析各人物之间的复杂关系，并回答我接下来的问题。注重发现隐藏的关联和模式。"
    }
  },
  userMessages: {
    defaultQuestion: "请分析这份材料中的关键信息。",
    followUpQuestions: []
  },
  settings: {
    temperature: 0.7,
    max_tokens: 4000,
    model: "deepseek/deepseek-r1:free"
  }
};

// 获取提示词配置
function getPromptConfig(): PromptConfig {
  try {
    const configPath = path.join(process.cwd(), 'prompts', 'ui_prompts.json');
    const configData = fs.readFileSync(configPath, 'utf8');
    return JSON.parse(configData);
  } catch (error) {
    console.error('无法读取提示词配置文件，使用默认配置:', error);
    return defaultConfig;
  }
}

// 清理文本中的特殊字符
function cleanText(text: string): string {
  // 移除标题中的 #、* 等符号
  return text
    .replace(/#{1,6}\s+/g, '') // 移除 markdown 样式的标题 # 符号
    .replace(/\*\*([^*]+)\*\*/g, '$1')  // 移除 ** 符号但保留内容
    .replace(/\*([^*]+)\*/g, '$1')      // 移除单个 * 符号但保留内容
    .replace(/#+/g, '')        // 移除剩余的 # 符号
    .replace(/---+/g, '')      // 移除分隔符 ---
}

// 根据场景ID和文件内容获取系统提示词
export async function POST(request: Request) {
  try {
    const { scenarioId, fileContents } = await request.json();
    
    // 获取配置
    const promptConfig = getPromptConfig();
    
    // 根据scenarioId的前缀判断案件类型
    let type = 'criminal'; // 默认类型
    
    if (scenarioId.startsWith('criminal_')) {
      type = 'criminal';
    } else if (scenarioId.startsWith('traffic_')) {
      type = 'traffic';
    } else if (scenarioId.startsWith('civil_')) {
      type = 'civil';
    } else if (scenarioId.startsWith('sherlock_')) {
      type = 'sherlock';
    } else if (scenarioId.startsWith('relationship_')) {
      type = 'relationship';
    }
    
    // 获取对应类型的提示词模板
    const template = promptConfig.systemPrompts[type]?.content || 
                    promptConfig.systemPrompts['criminal'].content;
    
    // 构建文件内容字符串
    let filesString = '';
    fileContents.forEach((file: FileContent) => {
      // 清理文件内容中的特殊字符
      const cleanedContent = cleanText(file.content);
      filesString += `=== ${file.filename} ===\n${cleanedContent}\n\n`;
    });
    
    // 替换模板中的{FILES}占位符
    const systemPrompt = template.replace('{FILES}', filesString);
    
    return NextResponse.json({ systemPrompt });
  } catch (error: any) {
    console.error('处理系统提示词请求时出错:', error);
    return NextResponse.json(
      { error: `处理系统提示词请求时出错: ${error.message}` },
      { status: 500 }
    );
  }
} 