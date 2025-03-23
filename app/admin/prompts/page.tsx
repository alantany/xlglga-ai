'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';

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

export default function PromptsAdmin() {
  const [promptConfig, setPromptConfig] = useState<PromptConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  // 加载提示词配置
  useEffect(() => {
    const loadPromptConfig = async () => {
      try {
        const response = await fetch('/api/admin/prompts');
        if (response.ok) {
          const data = await response.json();
          setPromptConfig(data);
        } else {
          toast({
            title: '加载失败',
            description: '无法加载提示词配置',
            variant: 'destructive',
          });
        }
      } catch (error) {
        console.error('加载提示词配置出错:', error);
        toast({
          title: '加载错误',
          description: '加载提示词配置时发生错误',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadPromptConfig();
  }, [toast]);

  // 保存提示词配置
  const savePromptConfig = async () => {
    if (!promptConfig) return;

    setIsSaving(true);
    try {
      const response = await fetch('/api/admin/prompts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(promptConfig),
      });

      if (response.ok) {
        toast({
          title: '保存成功',
          description: '提示词配置已更新',
        });
      } else {
        toast({
          title: '保存失败',
          description: '无法保存提示词配置',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('保存提示词配置出错:', error);
      toast({
        title: '保存错误',
        description: '保存提示词配置时发生错误',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // 更新提示词内容
  const updatePromptContent = (type: string, content: string) => {
    if (!promptConfig) return;

    setPromptConfig({
      ...promptConfig,
      systemPrompts: {
        ...promptConfig.systemPrompts,
        [type]: {
          ...promptConfig.systemPrompts[type],
          content,
        },
      },
    });
  };

  // 更新跟进问题
  const updateFollowUpQuestion = (index: number, question: string) => {
    if (!promptConfig) return;

    const updatedQuestions = [...promptConfig.userMessages.followUpQuestions];
    updatedQuestions[index] = question;

    setPromptConfig({
      ...promptConfig,
      userMessages: {
        ...promptConfig.userMessages,
        followUpQuestions: updatedQuestions,
      },
    });
  };

  // 添加跟进问题
  const addFollowUpQuestion = () => {
    if (!promptConfig) return;

    setPromptConfig({
      ...promptConfig,
      userMessages: {
        ...promptConfig.userMessages,
        followUpQuestions: [
          ...promptConfig.userMessages.followUpQuestions,
          '请输入新的跟进问题',
        ],
      },
    });
  };

  // 删除跟进问题
  const removeFollowUpQuestion = (index: number) => {
    if (!promptConfig) return;

    const updatedQuestions = [...promptConfig.userMessages.followUpQuestions];
    updatedQuestions.splice(index, 1);

    setPromptConfig({
      ...promptConfig,
      userMessages: {
        ...promptConfig.userMessages,
        followUpQuestions: updatedQuestions,
      },
    });
  };

  // 更新默认问题
  const updateDefaultQuestion = (question: string) => {
    if (!promptConfig) return;

    setPromptConfig({
      ...promptConfig,
      userMessages: {
        ...promptConfig.userMessages,
        defaultQuestion: question,
      },
    });
  };

  // 更新模型参数
  const updateModelSettings = (
    field: 'temperature' | 'max_tokens' | 'model',
    value: number | string
  ) => {
    if (!promptConfig) return;

    setPromptConfig({
      ...promptConfig,
      settings: {
        ...promptConfig.settings,
        [field]: value,
      },
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">正在加载...</h2>
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
        </div>
      </div>
    );
  }

  if (!promptConfig) {
    return (
      <div className="container mx-auto p-8">
        <h1 className="text-3xl font-bold mb-6">提示词管理</h1>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          无法加载提示词配置。请检查服务器配置或刷新页面重试。
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">提示词管理</h1>
        <Button 
          onClick={savePromptConfig} 
          disabled={isSaving}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {isSaving ? '保存中...' : '保存配置'}
        </Button>
      </div>

      <Tabs defaultValue="criminal">
        <TabsList className="mb-6 bg-gray-100 p-1 rounded-lg">
          <TabsTrigger value="criminal" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            刑事案件
          </TabsTrigger>
          <TabsTrigger value="traffic" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            交通案件
          </TabsTrigger>
          <TabsTrigger value="civil" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            民事案件
          </TabsTrigger>
          <TabsTrigger value="settings" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            模型设置
          </TabsTrigger>
          <TabsTrigger value="questions" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            默认问题
          </TabsTrigger>
        </TabsList>

        {/* 刑事案件提示词 */}
        <TabsContent value="criminal" className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold mb-4">刑事案件提示词</h2>
          <p className="text-gray-600 mb-4">{promptConfig.systemPrompts.criminal.description}</p>
          
          <div className="mb-4">
            <label className="block text-gray-700 font-bold mb-2">提示词内容</label>
            <div className="text-sm text-gray-500 mb-2">
              使用 {'{FILES}'} 作为文件内容的占位符
            </div>
            <textarea
              className="w-full h-64 p-3 border border-gray-300 rounded-md"
              value={promptConfig.systemPrompts.criminal.content}
              onChange={(e) => updatePromptContent('criminal', e.target.value)}
            ></textarea>
          </div>
        </TabsContent>

        {/* 交通案件提示词 */}
        <TabsContent value="traffic" className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold mb-4">交通案件提示词</h2>
          <p className="text-gray-600 mb-4">{promptConfig.systemPrompts.traffic.description}</p>
          
          <div className="mb-4">
            <label className="block text-gray-700 font-bold mb-2">提示词内容</label>
            <div className="text-sm text-gray-500 mb-2">
              使用 {'{FILES}'} 作为文件内容的占位符
            </div>
            <textarea
              className="w-full h-64 p-3 border border-gray-300 rounded-md"
              value={promptConfig.systemPrompts.traffic.content}
              onChange={(e) => updatePromptContent('traffic', e.target.value)}
            ></textarea>
          </div>
        </TabsContent>

        {/* 民事案件提示词 */}
        <TabsContent value="civil" className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold mb-4">民事案件提示词</h2>
          <p className="text-gray-600 mb-4">{promptConfig.systemPrompts.civil.description}</p>
          
          <div className="mb-4">
            <label className="block text-gray-700 font-bold mb-2">提示词内容</label>
            <div className="text-sm text-gray-500 mb-2">
              使用 {'{FILES}'} 作为文件内容的占位符
            </div>
            <textarea
              className="w-full h-64 p-3 border border-gray-300 rounded-md"
              value={promptConfig.systemPrompts.civil.content}
              onChange={(e) => updatePromptContent('civil', e.target.value)}
            ></textarea>
          </div>
        </TabsContent>

        {/* 模型设置 */}
        <TabsContent value="settings" className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold mb-4">模型设置</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-gray-700 font-bold mb-2">模型</label>
              <input
                type="text"
                className="w-full p-3 border border-gray-300 rounded-md"
                value={promptConfig.settings.model}
                onChange={(e) => updateModelSettings('model', e.target.value)}
              />
              <p className="text-sm text-gray-500 mt-1">例如: deepseek/deepseek-r1:free</p>
            </div>
            
            <div>
              <label className="block text-gray-700 font-bold mb-2">温度 (0.0 - 1.0)</label>
              <input
                type="number"
                min="0"
                max="1"
                step="0.1"
                className="w-full p-3 border border-gray-300 rounded-md"
                value={promptConfig.settings.temperature}
                onChange={(e) => updateModelSettings('temperature', parseFloat(e.target.value))}
              />
              <p className="text-sm text-gray-500 mt-1">值越低，回答越确定；值越高，回答越多样</p>
            </div>
            
            <div>
              <label className="block text-gray-700 font-bold mb-2">最大token数</label>
              <input
                type="number"
                min="1000"
                max="8000"
                step="100"
                className="w-full p-3 border border-gray-300 rounded-md"
                value={promptConfig.settings.max_tokens}
                onChange={(e) => updateModelSettings('max_tokens', parseInt(e.target.value))}
              />
              <p className="text-sm text-gray-500 mt-1">控制回答的最大长度</p>
            </div>
          </div>
        </TabsContent>

        {/* 默认问题 */}
        <TabsContent value="questions" className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold mb-4">默认问题设置</h2>
          
          <div className="mb-6">
            <label className="block text-gray-700 font-bold mb-2">初始问题</label>
            <input
              type="text"
              className="w-full p-3 border border-gray-300 rounded-md"
              value={promptConfig.userMessages.defaultQuestion}
              onChange={(e) => updateDefaultQuestion(e.target.value)}
            />
            <p className="text-sm text-gray-500 mt-1">用户未输入问题时系统使用的默认问题</p>
          </div>
          
          <div>
            <div className="flex justify-between items-center mb-4">
              <label className="block text-gray-700 font-bold">跟进问题</label>
              <Button onClick={addFollowUpQuestion} className="bg-green-600 hover:bg-green-700">
                添加问题
              </Button>
            </div>
            
            {promptConfig.userMessages.followUpQuestions.length === 0 ? (
              <p className="text-gray-500 italic">暂无跟进问题</p>
            ) : (
              <div className="space-y-4">
                {promptConfig.userMessages.followUpQuestions.map((question, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      className="flex-1 p-3 border border-gray-300 rounded-md"
                      value={question}
                      onChange={(e) => updateFollowUpQuestion(index, e.target.value)}
                    />
                    <Button 
                      onClick={() => removeFollowUpQuestion(index)}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      删除
                    </Button>
                  </div>
                ))}
              </div>
            )}
            <p className="text-sm text-gray-500 mt-2">系统可能推荐用户使用的跟进问题</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 