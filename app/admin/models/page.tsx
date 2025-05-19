'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Toaster, toast } from 'react-hot-toast';

interface ModelConfig {
  id: string;
  name: string;
  type: 'ollama' | 'openrouter' | 'context7';
  apiUrl: string;
  modelName: string;
  isActive: boolean;
}

export default function ModelsAdmin() {
  const router = useRouter();
  const [models, setModels] = useState<ModelConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 加载模型配置
  useEffect(() => {
    loadModelConfig();
  }, []);

  const loadModelConfig = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/models');
      if (response.ok) {
        const data = await response.json();
        setModels(data);
      } else {
        toast.error('加载模型配置失败');
      }
    } catch (error) {
      toast.error('加载模型配置出错: ' + (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  // 切换活动模型
  const toggleActiveModel = async (modelId: string) => {
    try {
      const response = await fetch('/api/admin/models/activate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ modelId }),
      });

      if (response.ok) {
        toast.success('模型切换成功');
        loadModelConfig(); // 重新加载配置
      } else {
        toast.error('模型切换失败');
      }
    } catch (error) {
      toast.error('模型切换出错: ' + (error as Error).message);
    }
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

  return (
    <div className="container mx-auto p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">模型管理</h1>
      </div>

      <div className="space-y-6">
        {models.map((model) => (
          <div key={model.id} className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold">{model.name}</h2>
                <p className="text-gray-600 mt-1">类型: {model.type}</p>
                <p className="text-gray-600">模型: {model.modelName}</p>
              </div>
              <button
                onClick={() => toggleActiveModel(model.id)}
                className={`px-4 py-2 rounded ${
                  model.isActive
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-blue-600 hover:bg-blue-700'
                } text-white`}
              >
                {model.isActive ? '当前使用' : '切换到此模型'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 