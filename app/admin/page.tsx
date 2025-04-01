'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Toaster, toast } from 'react-hot-toast'
import scenariosConfig from '../data/scenarios-config.json'
import fs from 'fs'
import path from 'path'

// 定义类型
interface SubScenario {
  id: string;
  title: string;
  description: string;
  directory: string;
}

interface Scenario {
  id: number;
  title: string;
  description: string;
  baseDirectory: string;
  subScenarios: SubScenario[];
}

// 为避免直接修改导入的配置文件，创建副本
let configData = JSON.parse(JSON.stringify(scenariosConfig))

export default function AdminPage() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [activeTab, setActiveTab] = useState('scenarios')
  
  // 场景相关状态
  const [scenarioCategories, setScenarioCategories] = useState<Scenario[]>(configData.scenarioCategories)
  const [selectedCategory, setSelectedCategory] = useState<null | number>(null)
  const [selectedSubScenario, setSelectedSubScenario] = useState<null | string>(null)
  
  // 添加场景的表单状态
  const [newCategoryForm, setNewCategoryForm] = useState({
    title: '',
    description: '',
    baseDirectory: ''
  })
  
  // 添加子场景的表单状态
  const [newSubScenarioForm, setNewSubScenarioForm] = useState({
    title: '',
    description: '',
    directory: ''
  })

  // 认证逻辑 - 简单实现，实际生产环境请使用更安全的方式
  const authenticate = () => {
    // 这里使用一个简单的密码验证，实际应用中应该使用更安全的方式
    if (password === 'admin123') {
      setIsAuthenticated(true)
      localStorage.setItem('admin_authenticated', 'true')
    } else {
      toast.error('密码错误')
    }
  }

  // 检查之前的认证状态
  useEffect(() => {
    const auth = localStorage.getItem('admin_authenticated')
    if (auth === 'true') {
      setIsAuthenticated(true)
    }
  }, [])

  // 保存配置文件
  const saveConfig = async () => {
    try {
      // 在客户端浏览器中，我们不能直接写入文件系统
      // 所以我们需要发送请求到服务器API来保存配置
      const response = await fetch('/api/admin/save-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ config: { scenarioCategories } }),
      })
      
      if (response.ok) {
        toast.success('配置已保存')
        // 更新本地配置副本
        configData.scenarioCategories = [...scenarioCategories]
      } else {
        toast.error('保存失败')
      }
    } catch (error) {
      toast.error('发生错误: ' + (error as Error).message)
    }
  }

  // 创建目录结构
  const createDirectories = async () => {
    try {
      const response = await fetch('/api/admin/create-directories', {
        method: 'POST',
      })
      
      if (response.ok) {
        toast.success('目录结构已创建')
      } else {
        toast.error('创建目录失败')
      }
    } catch (error) {
      toast.error('发生错误: ' + (error as Error).message)
    }
  }

  // 添加新场景类别
  const addCategory = () => {
    if (!newCategoryForm.title || !newCategoryForm.description || !newCategoryForm.baseDirectory) {
      toast.error('请填写所有必填项')
      return
    }

    const newId = Math.max(...scenarioCategories.map((cat: Scenario) => cat.id), 0) + 1
    
    const newCategory: Scenario = {
      id: newId,
      title: newCategoryForm.title,
      description: newCategoryForm.description,
      baseDirectory: newCategoryForm.baseDirectory,
      subScenarios: []
    }
    
    setScenarioCategories([...scenarioCategories, newCategory])
    setNewCategoryForm({ title: '', description: '', baseDirectory: '' })
    toast.success(`场景 "${newCategoryForm.title}" 已添加`)
  }

  // 添加子场景
  const addSubScenario = () => {
    if (selectedCategory === null) {
      toast.error('请先选择一个场景类别')
      return
    }
    
    if (!newSubScenarioForm.title || !newSubScenarioForm.description || !newSubScenarioForm.directory) {
      toast.error('请填写所有必填项')
      return
    }
    
    const category = scenarioCategories[selectedCategory]
    
    // 生成ID
    const idPrefix = generatePinyinPrefix(category.title)
    const idSuffix = category.subScenarios.length + 1
    const id = `${idPrefix}_${idSuffix}`
    
    const newSubScenario = {
      id,
      title: newSubScenarioForm.title,
      description: newSubScenarioForm.description,
      directory: newSubScenarioForm.directory
    }
    
    // 更新状态
    const updatedCategories = [...scenarioCategories]
    updatedCategories[selectedCategory].subScenarios.push(newSubScenario)
    setScenarioCategories(updatedCategories)
    
    setNewSubScenarioForm({ title: '', description: '', directory: '' })
    toast.success(`子场景 "${newSubScenarioForm.title}" 已添加`)
  }

  // 删除场景类别
  const deleteCategory = (index: number) => {
    if (confirm(`确定要删除场景 "${scenarioCategories[index].title}" 吗？这将同时删除其所有子场景。`)) {
      const updatedCategories = [...scenarioCategories]
      updatedCategories.splice(index, 1)
      setScenarioCategories(updatedCategories)
      if (selectedCategory === index) {
        setSelectedCategory(null)
      }
      toast.success('场景已删除')
    }
  }

  // 删除子场景
  const deleteSubScenario = (categoryIndex: number, subScenarioIndex: number) => {
    const subScenarioTitle = scenarioCategories[categoryIndex].subScenarios[subScenarioIndex].title
    
    if (confirm(`确定要删除子场景 "${subScenarioTitle}" 吗？`)) {
      const updatedCategories = [...scenarioCategories]
      updatedCategories[categoryIndex].subScenarios.splice(subScenarioIndex, 1)
      setScenarioCategories(updatedCategories)
      toast.success('子场景已删除')
    }
  }

  // 生成拼音前缀
  const generatePinyinPrefix = (chinese: string) => {
    // 这只是一个简单示例，实际应用中应该使用更完善的拼音转换库
    const pinyinMap: Record<string, string> = {
      '刑': 'xing', '事': 'shi', '交': 'jiao', '通': 'tong', '治': 'zhi', 
      '安': 'an', '福': 'fu', '尔': 'er', '摩': 'mo', '斯': 'si', 
      '关': 'guan', '系': 'xi', '图': 'tu', '谱': 'pu'
    }
    
    // 检查是否包含中文字符
    if (/[\u4e00-\u9fa5]/.test(chinese)) {
      // 转换为拼音并截取前8个字符
      return chinese.replace(/[\u4e00-\u9fa5]/g, char => pinyinMap[char] || 'x').substring(0, 8)
    } else {
      // 如果不是中文，直接转小写并截取
      return chinese.toLowerCase().substring(0, 8)
    }
  }

  // 登录表单
  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-24 bg-gray-900 text-white">
        <Toaster position="top-right" />
        <div className="w-full max-w-md p-8 space-y-8 bg-gray-800 rounded-xl shadow-lg">
          <div className="text-center">
            <h1 className="text-2xl font-bold">管理员登录</h1>
            <p className="mt-2 text-gray-400">请输入管理员密码</p>
          </div>
          
          <div className="mt-8 space-y-6">
            <div>
              <label className="text-sm font-bold text-gray-300">密码</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 mt-1 text-gray-900 placeholder-gray-400 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="输入管理员密码"
              />
            </div>
            
            <button
              onClick={authenticate}
              className="w-full px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              登录
            </button>
            
            <div className="text-center mt-4">
              <Link href="/" className="text-blue-400 hover:text-blue-300 text-sm">
                返回首页
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Toaster position="top-right" />
      
      {/* 顶部导航 */}
      <div className="bg-gray-800 border-b border-gray-700 p-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">系统管理面板</h1>
        <div className="flex items-center space-x-4">
          <Link href="/" className="text-blue-400 hover:text-blue-300">
            返回首页
          </Link>
          <button 
            onClick={() => {
              localStorage.removeItem('admin_authenticated')
              setIsAuthenticated(false)
            }}
            className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-sm"
          >
            退出
          </button>
        </div>
      </div>
      
      {/* 选项卡导航 */}
      <div className="bg-gray-800 border-b border-gray-700 px-4">
        <div className="flex space-x-1">
          <button
            className={`py-3 px-4 ${activeTab === 'scenarios' ? 'border-b-2 border-blue-500 text-blue-400' : 'text-gray-400 hover:text-gray-200'}`}
            onClick={() => setActiveTab('scenarios')}
          >
            场景管理
          </button>
          <button
            className={`py-3 px-4 ${activeTab === 'help' ? 'border-b-2 border-blue-500 text-blue-400' : 'text-gray-400 hover:text-gray-200'}`}
            onClick={() => setActiveTab('help')}
          >
            使用帮助
          </button>
        </div>
      </div>
      
      {/* 内容区域 */}
      <div className="container mx-auto p-6">
        {activeTab === 'scenarios' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 左侧：场景类别列表 */}
            <div className="bg-gray-800 rounded-lg p-4 col-span-1">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold">场景类别</h2>
              </div>
              
              <div className="mb-6 max-h-96 overflow-y-auto">
                {scenarioCategories.map((category: Scenario, index: number) => (
                  <div 
                    key={category.id}
                    className={`p-3 mb-2 rounded cursor-pointer ${selectedCategory === index ? 'bg-blue-700' : 'bg-gray-700 hover:bg-gray-600'}`}
                    onClick={() => setSelectedCategory(index)}
                  >
                    <div className="flex justify-between">
                      <span className="font-medium">{category.title}</span>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteCategory(index)
                        }}
                        className="text-red-400 hover:text-red-300 text-sm"
                      >
                        删除
                      </button>
                    </div>
                    <p className="text-xs text-gray-300 mt-1">{category.description}</p>
                    <p className="text-xs text-gray-400 mt-1">目录: {category.baseDirectory}</p>
                  </div>
                ))}
              </div>
              
              <h3 className="text-md font-semibold mb-2">添加新场景类别</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">标题</label>
                  <input
                    type="text"
                    value={newCategoryForm.title}
                    onChange={(e) => setNewCategoryForm({...newCategoryForm, title: e.target.value})}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                    placeholder="场景标题"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">描述</label>
                  <input
                    type="text"
                    value={newCategoryForm.description}
                    onChange={(e) => setNewCategoryForm({...newCategoryForm, description: e.target.value})}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                    placeholder="场景描述"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">基础目录名</label>
                  <input
                    type="text"
                    value={newCategoryForm.baseDirectory}
                    onChange={(e) => setNewCategoryForm({...newCategoryForm, baseDirectory: e.target.value})}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                    placeholder="基础目录名"
                  />
                </div>
                <button 
                  onClick={addCategory}
                  className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded"
                >
                  添加场景
                </button>
              </div>
            </div>
            
            {/* 中间：子场景列表 */}
            <div className="bg-gray-800 rounded-lg p-4 col-span-1">
              <h2 className="text-lg font-bold mb-4">子场景</h2>
              
              {selectedCategory !== null ? (
                <>
                  <div className="mb-6 max-h-96 overflow-y-auto">
                    {scenarioCategories[selectedCategory].subScenarios.map((subScenario: SubScenario, index: number) => (
                      <div 
                        key={subScenario.id}
                        className="p-3 mb-2 bg-gray-700 rounded"
                      >
                        <div className="flex justify-between">
                          <span className="font-medium">{subScenario.title}</span>
                          <button 
                            onClick={() => deleteSubScenario(selectedCategory, index)}
                            className="text-red-400 hover:text-red-300 text-sm"
                          >
                            删除
                          </button>
                        </div>
                        <p className="text-xs text-gray-300 mt-1">{subScenario.description}</p>
                        <p className="text-xs text-gray-400 mt-1">ID: {subScenario.id}</p>
                        <p className="text-xs text-gray-400">目录: {subScenario.directory}</p>
                      </div>
                    ))}
                  </div>
                  
                  <h3 className="text-md font-semibold mb-2">添加新子场景</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">标题</label>
                      <input
                        type="text"
                        value={newSubScenarioForm.title}
                        onChange={(e) => setNewSubScenarioForm({...newSubScenarioForm, title: e.target.value})}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                        placeholder="子场景标题"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">描述</label>
                      <input
                        type="text"
                        value={newSubScenarioForm.description}
                        onChange={(e) => setNewSubScenarioForm({...newSubScenarioForm, description: e.target.value})}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                        placeholder="子场景描述"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">目录名</label>
                      <input
                        type="text"
                        value={newSubScenarioForm.directory}
                        onChange={(e) => setNewSubScenarioForm({...newSubScenarioForm, directory: e.target.value})}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                        placeholder="目录名"
                      />
                    </div>
                    <button 
                      onClick={addSubScenario}
                      className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded"
                    >
                      添加子场景
                    </button>
                  </div>
                </>
              ) : (
                <div className="text-center text-gray-400 py-10">
                  请先从左侧选择一个场景类别
                </div>
              )}
            </div>
            
            {/* 右侧：操作按钮和帮助 */}
            <div className="bg-gray-800 rounded-lg p-4 col-span-1">
              <h2 className="text-lg font-bold mb-4">操作</h2>
              
              <div className="space-y-4">
                <button 
                  onClick={saveConfig}
                  className="w-full px-4 py-3 bg-green-600 hover:bg-green-700 rounded font-medium"
                >
                  保存配置
                </button>
                
                <button 
                  onClick={createDirectories}
                  className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 rounded font-medium"
                >
                  创建目录结构
                </button>
                
                <hr className="border-gray-700 my-6" />
                
                <div className="bg-gray-700 p-4 rounded">
                  <h3 className="font-semibold mb-2">提示</h3>
                  <ul className="text-sm text-gray-300 list-disc pl-5 space-y-1">
                    <li>修改配置后，请点击"保存配置"将更改写入配置文件</li>
                    <li>保存配置后，点击"创建目录结构"创建相应的目录</li>
                    <li>目录创建后，将案例文件复制到对应目录中</li>
                    <li>完成后重启应用以应用更改</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'help' && (
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4">使用帮助</h2>
            
            <div className="space-y-4 text-gray-300">
              <div>
                <h3 className="text-lg font-semibold mb-2">场景管理系统</h3>
                <p>
                  此管理界面允许您创建、编辑和删除场景，以及管理相应的目录结构。所有更改都会保存到配置文件中，
                  并自动应用到应用程序中。
                </p>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-2">基本步骤</h3>
                <ol className="list-decimal pl-5 space-y-2">
                  <li>在左侧添加场景类别（如刑事案件、交通案件等）</li>
                  <li>选择场景类别后，在中间添加子场景</li>
                  <li>点击"保存配置"保存您的更改</li>
                  <li>点击"创建目录结构"在文件系统中创建对应的目录</li>
                  <li>将案例文件复制到新创建的目录中</li>
                  <li>重启应用以应用更改</li>
                </ol>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-2">目录结构</h3>
                <p>
                  系统会在 <code className="bg-gray-700 px-2 py-1 rounded">data/scenarios/</code> 目录下创建场景目录。
                  每个场景目录下会包含其子场景目录。例如：
                </p>
                <pre className="bg-gray-700 p-3 mt-2 rounded text-sm overflow-x-auto">
                  data/scenarios/刑事案件/1、立案前材料/案例文件.txt{'\n'}
                  data/scenarios/福尔摩斯/现场勘验分析/现场勘验报告.txt
                </pre>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-2">ID规则</h3>
                <p>
                  系统会自动生成ID：
                </p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>主场景ID：按顺序递增的数字</li>
                  <li>子场景ID：格式为 "[场景拼音前缀]_[序号]"，例如 "criminal_1"</li>
                </ul>
                <p className="mt-2">
                  这些ID用于在系统内部标识不同的场景。
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 