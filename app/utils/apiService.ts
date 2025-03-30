// 获取文件列表
export async function getFileList(subScenarioId: string, signal?: AbortSignal): Promise<string[]> {
  try {
    const response = await fetch(`/api/scenario-content?id=${subScenarioId}&type=list`, { signal });
    if (!response.ok) {
      throw new Error('获取文件列表失败');
    }
    const data = await response.json();
    return data.files || [];
  } catch (error) {
    console.error('获取文件列表失败:', error);
    throw error;
  }
}

// 获取文件内容
export async function getFileContent(subScenarioId: string, file: string, signal?: AbortSignal): Promise<string> {
  try {
    const safeFileName = file;
    const url = `/api/scenario-content?id=${subScenarioId}&type=file&file=${encodeURIComponent(safeFileName)}`;
    const response = await fetch(url, { signal });
    
    if (!response.ok) {
      throw new Error(`获取文件内容失败: ${response.status}`);
    }
    
    const data = await response.json();
    if (data.content) {
      return data.content;
    } else if (data.error) {
      throw new Error(data.error);
    } else {
      throw new Error('文件内容为空');
    }
  } catch (error) {
    console.error('获取文件内容失败:', error);
    throw error;
  }
}

// 发送AI聊天请求
export async function sendChatRequest(params: {
  scenarioId: string;
  conversationHistory?: { role: string; content: string }[];
  isMultiRound: boolean;
  fileContents: { filename: string; content: string }[];
  signal?: AbortSignal;
}): Promise<string> {
  const { scenarioId, conversationHistory = [], isMultiRound, fileContents, signal } = params;
  
  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        scenarioId,
        conversationHistory,
        isMultiRound,
        fileContents
      }),
      signal,
    });
    
    if (!response.ok) {
      throw new Error('AI请求失败');
    }
    
    const data = await response.json();
    return data.response;
  } catch (error) {
    console.error('聊天请求失败:', error);
    throw error;
  }
} 