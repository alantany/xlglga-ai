/**
 * 系统提示词配置文件
 * 用于集中管理与大模型对话的提示词
 */
import fs from 'fs';
import path from 'path';

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

// 尝试读取JSON配置文件
let promptConfig: PromptConfig;
try {
  const configPath = path.join(process.cwd(), 'prompts', 'ui_prompts.json');
  const configData = fs.readFileSync(configPath, 'utf8');
  promptConfig = JSON.parse(configData);
  console.log('成功加载提示词配置文件');
} catch (error) {
  console.error('无法读取提示词配置文件，使用默认配置:', error);
  // 默认配置
  promptConfig = {
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
}

/**
 * 从配置中获取提示词并填充文件内容
 * @param type 提示词类型
 * @param fileContents 文件内容
 * @returns 完整的系统提示词
 */
function getPromptFromConfig(type: string, fileContents: FileContent[]): string {
  // 获取对应类型的提示词模板
  const template = promptConfig.systemPrompts[type]?.content || 
                  promptConfig.systemPrompts['criminal'].content;
  
  // 构建文件内容字符串
  let filesString = '';
  fileContents.forEach((file) => {
    filesString += `=== ${file.filename} ===\n${file.content}\n\n`;
  });
  
  // 替换模板中的{FILES}占位符
  return template.replace('{FILES}', filesString);
}

/**
 * 获取刑侦专家提示词
 * @param fileContents 案件相关文件内容
 * @returns 完整的系统提示词
 */
export function getCriminalExpertPrompt(fileContents: FileContent[]): string {
  return getPromptFromConfig('criminal', fileContents);
}

/**
 * 获取交通事故分析专家提示词
 * @param fileContents 交通事故相关文件内容
 * @returns 完整的系统提示词
 */
export function getTrafficExpertPrompt(fileContents: FileContent[]): string {
  return getPromptFromConfig('traffic', fileContents);
}

/**
 * 获取民事案件分析专家提示词
 * @param fileContents 民事案件相关文件内容
 * @returns 完整的系统提示词
 */
export function getCivilExpertPrompt(fileContents: FileContent[]): string {
  return getPromptFromConfig('civil', fileContents);
}

/**
 * 根据场景ID获取合适的提示词
 * @param scenarioId 场景ID
 * @param fileContents 文件内容
 * @returns 对应场景的系统提示词
 */
export function getPromptByScenarioId(scenarioId: string, fileContents: FileContent[]): string {
  // 根据scenarioId的前缀判断案件类型
  if (scenarioId.startsWith('criminal_')) {
    return getCriminalExpertPrompt(fileContents);
  } else if (scenarioId.startsWith('traffic_')) {
    return getTrafficExpertPrompt(fileContents);
  } else if (scenarioId.startsWith('civil_')) {
    return getCivilExpertPrompt(fileContents);
  }
  
  // 默认返回刑侦专家提示词
  return getCriminalExpertPrompt(fileContents);
} 