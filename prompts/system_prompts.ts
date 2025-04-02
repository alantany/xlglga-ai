/**
 * 系统提示词配置文件
 * 用于集中管理与大模型对话的提示词
 */

interface FileContent {
  filename: string;
  content: string;
}

/**
 * 获取刑侦专家提示词
 * @param fileContents 案件相关文件内容
 * @returns 完整的系统提示词
 */
export async function getCriminalExpertPrompt(fileContents: FileContent[]): Promise<string> {
  return await getPromptByScenarioId('criminal_1', fileContents);
}

/**
 * 获取交通事故分析专家提示词
 * @param fileContents 交通事故相关文件内容
 * @returns 完整的系统提示词
 */
export async function getTrafficExpertPrompt(fileContents: FileContent[]): Promise<string> {
  return await getPromptByScenarioId('traffic_1', fileContents);
}

/**
 * 获取民事案件分析专家提示词
 * @param fileContents 民事案件相关文件内容
 * @returns 完整的系统提示词
 */
export async function getCivilExpertPrompt(fileContents: FileContent[]): Promise<string> {
  return await getPromptByScenarioId('civil_1', fileContents);
}

/**
 * 获取福尔摩斯推理专家提示词
 * @param fileContents 案件相关文件内容
 * @returns 完整的系统提示词
 */
export async function getSherlockPrompt(fileContents: FileContent[]): Promise<string> {
  return await getPromptByScenarioId('sherlock_1', fileContents);
}

/**
 * 获取关系图谱分析专家提示词
 * @param fileContents 人物关系相关文件内容
 * @returns 完整的系统提示词
 */
export async function getRelationshipPrompt(fileContents: FileContent[]): Promise<string> {
  return await getPromptByScenarioId('relationship_1', fileContents);
}

/**
 * 根据场景ID获取合适的提示词
 * @param scenarioId 场景ID
 * @param fileContents 文件内容
 * @returns 对应场景的系统提示词
 */
export async function getPromptByScenarioId(scenarioId: string, fileContents: FileContent[]): Promise<string> {
  try {
    // 调用API获取提示词
    const response = await fetch('/api/prompts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ scenarioId, fileContents }),
    });
    
    if (!response.ok) {
      throw new Error(`获取提示词失败: ${response.status}`);
    }
    
    const data = await response.json();
    return data.systemPrompt;
  } catch (error) {
    console.error('获取系统提示词时出错:', error);
    // 返回一个默认的提示词
    return `你是一位AI助手。我会给你一些文件内容。请根据这些内容回答我的问题。\n\n${fileContents.map(file => `=== ${file.filename} ===\n${file.content}\n\n`).join('')}`;
  }
} 