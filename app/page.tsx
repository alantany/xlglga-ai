"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import ResponseDisplay from "@/components/response-display"
import { Mic, MicOff, Send, Trash2 } from "lucide-react"
import { createPortal } from "react-dom"

// 添加 SpeechRecognition 类型定义
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionResultList {
  [index: number]: SpeechRecognitionResult;
  length: number;
}

interface SpeechRecognitionResult {
  [index: number]: SpeechRecognitionAlternative;
  length: number;
  isFinal: boolean;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
}

// 扩展 Window 接口
declare global {
  interface Window {
    SpeechRecognition?: {
      new (): SpeechRecognition;
    };
    webkitSpeechRecognition?: {
      new (): SpeechRecognition;
    };
  }
}

export default function LargeScreenDisplay() {
  const [currentScenario, setCurrentScenario] = useState<number | null>(0)
  const [isResponding, setIsResponding] = useState(false)
  const [aiResponse, setAiResponse] = useState("")
  const [hoveredScenario, setHoveredScenario] = useState<number | null>(null)
  const [scenarioContent, setScenarioContent] = useState<string>("")
  const [fileList, setFileList] = useState<string[]>([])
  const [hoveredFile, setHoveredFile] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  const [hoverPosition, setHoverPosition] = useState({ top: 0, left: 0 })
  const [isMounted, setIsMounted] = useState(false)
  const [isTooltipHovered, setIsTooltipHovered] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [userInput, setUserInput] = useState("")
  const [conversationHistory, setConversationHistory] = useState<{role: string, content: string}[]>([])
  const [isMultiRound, setIsMultiRound] = useState(false)
  const [selectedSubScenario, setSelectedSubScenario] = useState<string | null>(null)
  const [isFileListVisible, setIsFileListVisible] = useState(false)
  const [isLoadingFile, setIsLoadingFile] = useState(false)
  const [fileContentsCache, setFileContentsCache] = useState<{[key: string]: string}>({})
  const fileListRef = useRef<HTMLDivElement>(null)
  const subScenarioRef = useRef<HTMLDivElement>(null)
  
  const tooltipTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const recognitionRef = useRef<SpeechRecognition | null>(null)

  // 客户端挂载检测
  useEffect(() => {
    setIsMounted(true)
    return () => setIsMounted(false)
  }, [])

  // 清理超时
  useEffect(() => {
    return () => {
      if (tooltipTimeoutRef.current) {
        clearTimeout(tooltipTimeoutRef.current);
      }
    };
  }, []);

  // 初始化语音识别
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
      
      if (SpeechRecognitionAPI) {
        recognitionRef.current = new SpeechRecognitionAPI();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = 'zh-CN';
        
        recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
          let transcript = '';
          // 安全地访问 results
          for (let i = 0; i < event.results.length; i++) {
            if (event.results[i] && event.results[i][0]) {
              transcript += event.results[i][0].transcript;
            }
          }
          
          setUserInput(transcript);
        };
        
        recognitionRef.current.onerror = (event: SpeechRecognitionErrorEvent) => {
          console.error('语音识别错误:', event.error);
          setIsRecording(false);
        };
        
        recognitionRef.current.onend = () => {
          setIsRecording(false);
        };
      }
    }
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.onresult = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.onend = null;
      }
    };
  }, []);

  // 添加点击事件监听器
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // 如果点击的是文件列表区域或子场景区域，不做处理
      if (
        (fileListRef.current && fileListRef.current.contains(event.target as Node)) ||
        (subScenarioRef.current && subScenarioRef.current.contains(event.target as Node))
      ) {
        return
      }
      
      // 检查是否点击了左侧菜单区域，如果是则不隐藏文件列表
      const leftMenuArea = document.getElementById('left-menu');
      if (leftMenuArea && leftMenuArea.contains(event.target as Node)) {
        return;
      }
      
      // 检查是否点击了右侧内容区域的非AI响应部分（例如文件内容显示区）
      const contentArea = document.getElementById('content-area');
      const aiResponseArea = document.getElementById('ai-response-area');
      if (
        contentArea && 
        contentArea.contains(event.target as Node) && 
        aiResponseArea && 
        !aiResponseArea.contains(event.target as Node)
      ) {
        return;
      }
      
      // 点击其他区域，隐藏文件列表
      setIsFileListVisible(false)
      setIsTooltipHovered(false)
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const scenarios = [
    {
      id: 1,
      title: "刑事案件",
      description: "刑事案件材料分析与研判",
      subScenarios: [
        {
          id: "criminal_1",
          title: "立案前阶段",
          description: "分析案件立案前的相关材料"
        },
        {
          id: "criminal_2", 
          title: "刑拘前阶段",
          description: "分析案件刑事拘留前的相关材料"
        },
        {
          id: "criminal_3",
          title: "报捕前阶段",
          description: "分析案件报请逮捕前的相关材料"
        },
        {
          id: "criminal_4",
          title: "起诉前阶段", 
          description: "分析案件移送起诉前的相关材料"
        }
      ]
    },
    {
      id: 2,
      title: "交通案件",
      description: "交通事故案件材料分析",
      subScenarios: [
        {
          id: "traffic_1",
          title: "交通事故材料",
          description: "分析交通事故现场勘验笔录、询问笔录等材料，研判事故责任"
        }
      ]
    },
    {
      id: 3,
      title: "治安案件",
      description: "治安案件材料分析",
      subScenarios: [
        {
          id: "civil_1",
          title: "故意伤害案件",
          description: "分析故意伤害案件相关材料"
        }
      ]
    }
  ]
  // 处理鼠标悬停事件
  const handleScenarioHover = async (index: number | null, event?: React.MouseEvent) => {
    // 清除之前的定时器
    if (tooltipTimeoutRef.current) {
      clearTimeout(tooltipTimeoutRef.current)
    }
    
    // 如果鼠标移出按钮，但移入了提示框，则不隐藏提示
    if (index === null && isTooltipHovered) {
      return
    }
    
    // 如果鼠标移出按钮，设置延迟隐藏提示
    if (index === null) {
      tooltipTimeoutRef.current = setTimeout(() => {
        if (!isTooltipHovered) {
          setHoveredScenario(null)
          setScenarioContent("")
          setFileList([])
          setHoveredFile(null)
        }
      }, 300)
      return
    }
    
    setHoveredScenario(index)
    
    // 如果有事件，记录鼠标位置
    if (event) {
      const rect = event.currentTarget.getBoundingClientRect()
      setHoverPosition({
        top: rect.top,
        left: rect.right + 10
      })
    }
    
    // 获取目录文件列表
    try {
      const response = await fetch(`/api/scenario-content?id=${index + 1}&type=list`)
      if (response.ok) {
        const data = await response.json()
        setFileList(data.files || [])
        setScenarioContent("")
      }
    } catch (error) {
      console.error('获取文件列表失败:', error)
    }
  }

  const handleFileClick = async (file: string) => {
    if (selectedFile === file) {
      setSelectedFile(null)
      setScenarioContent("")
    } else {
      setSelectedFile(file)
      setIsLoadingFile(true)
      setScenarioContent("")
      
      // 生成缓存键
      const cacheKey = `${selectedSubScenario}_${file}`
      
      // 检查缓存中是否有内容
      if (fileContentsCache[cacheKey]) {
        console.log(`使用缓存的文件内容: ${file}`)
        setScenarioContent(fileContentsCache[cacheKey])
        setIsLoadingFile(false)
        return
      }
      
      try {
        // 确保正确使用子场景ID获取文件内容，传递原始未编码的文件名
        console.log(`正在获取文件: ${file}, 场景ID: ${selectedSubScenario}`)
        
        // 先将文件名编码一次，然后在URL中使用encodeURIComponent再次编码
        // 这样可以确保API端收到的是正确编码的文件名
        const safeFileName = file
        const url = `/api/scenario-content?id=${selectedSubScenario}&type=file&file=${encodeURIComponent(safeFileName)}`
        console.log(`请求URL: ${url}`)
        
        const response = await fetch(url)
        console.log(`获取到响应: 状态码=${response.status}`)
        
        if (response.ok) {
          const responseText = await response.text()
          console.log(`响应文本长度: ${responseText.length}`)
          
          try {
            const data = JSON.parse(responseText)
            if (data.content) {
              console.log(`成功获取文件内容: ${file}, 内容长度: ${data.content.length}`)
              // 保存到缓存
              setFileContentsCache(prev => ({
                ...prev,
                [cacheKey]: data.content
              }))
              setScenarioContent(data.content)
            } else if (data.error) {
              console.error(`API返回错误: ${data.error}`)
              setScenarioContent(`无法读取文件内容: ${data.error}`)
            } else {
              console.error('文件内容为空')
              setScenarioContent("返回的数据中没有文件内容")
            }
          } catch (parseError) {
            console.error('解析JSON响应失败:', parseError)
            setScenarioContent(`解析响应失败: ${responseText.substring(0, 100)}...`)
          }
        } else {
          const errorText = await response.text()
          console.error(`获取文件内容失败: 状态码=${response.status}, 错误=${errorText}`)
          setScenarioContent(`获取文件内容失败: ${response.status} - ${errorText}`)
        }
      } catch (error) {
        console.error('获取文件内容失败:', error)
        setScenarioContent(`获取文件内容时发生错误: ${error instanceof Error ? error.message : String(error)}`)
      } finally {
        setIsLoadingFile(false)
      }
    }
  }

  // 处理子场景点击
  const handleSubScenarioClick = async (subScenarioId: string) => {
    if (selectedSubScenario === subScenarioId) {
      setSelectedSubScenario(null)
      setFileList([])
      setIsFileListVisible(false)
      setSelectedFile(null)
      setScenarioContent("")
    } else {
      // 重置文件相关状态
      setSelectedFile(null)
      setScenarioContent("")
      setSelectedSubScenario(subScenarioId)
      try {
        console.log(`切换到子场景: ${subScenarioId}`)
        const response = await fetch(`/api/scenario-content?id=${subScenarioId}&type=list`)
        if (response.ok) {
          const data = await response.json()
          const files = data.files || []
          console.log(`获取到${files.length}个文件`)
          setFileList(files)
          // 始终将文件列表显示在固定位置，不使用悬浮窗口
          setIsFileListVisible(true)
          // 根据子场景ID找到对应的主场景
          for (let i = 0; i < scenarios.length; i++) {
            if (scenarios[i].subScenarios.some(sub => sub.id === subScenarioId)) {
              setCurrentScenario(i)
              break
            }
          }
        } else {
          console.error(`获取文件列表失败: ${response.status}`)
        }
      } catch (error) {
        console.error('获取文件列表失败:', error)
      }
    }
  }

  // 处理子场景悬停 - 不再使用悬浮窗口
  const handleSubScenarioHover = (show: boolean, event?: React.MouseEvent) => {
    // 不再根据悬停显示文件列表，改为只响应点击事件
    return
  }

  // 处理文件列表鼠标事件
  const handleTooltipMouseEnter = () => {
    setIsTooltipHovered(true)
    if (tooltipTimeoutRef.current) {
      clearTimeout(tooltipTimeoutRef.current)
      tooltipTimeoutRef.current = null
    }
  }

  const handleTooltipMouseLeave = () => {
    setIsTooltipHovered(false)
    // 移除自动隐藏文件列表的逻辑，保持文件列表可见
    // tooltipTimeoutRef.current = setTimeout(() => {
    //   setIsFileListVisible(false)
    // }, 300)
  }

  // 处理语音输入
  const toggleRecording = () => {
    if (isRecording) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsRecording(false);
    } else {
      if (recognitionRef.current) {
        recognitionRef.current.start();
        setIsRecording(true);
      } else {
        alert('您的浏览器不支持语音识别功能');
      }
    }
  };

  // 修改发送用户输入的函数
  const sendUserInput = async () => {
    if (!userInput.trim() || !selectedSubScenario) {
      alert("请先选择具体阶段并输入问题");
      return;
    }
    
    // 停止录音（如果正在录音）
    if (isRecording && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
    }
    
    // 保存用户输入，以便清空输入框
    const currentUserInput = userInput;
    
    // 清空用户输入框
    setUserInput("");
    
    try {
      console.log('开始响应用户输入')
      setIsResponding(true);
      
      // 更新对话历史，立即添加用户问题
      const updatedHistory = [
        ...conversationHistory,
        { role: 'user', content: currentUserInput }
      ];
      setConversationHistory(updatedHistory);
      
      // 创建新的 AbortController
      abortControllerRef.current = new AbortController();
      console.log('创建了新的AbortController实例')
      const signal = abortControllerRef.current.signal;

      // 监听abort事件
      signal.addEventListener('abort', () => {
        console.log('检测到中止信号，请求被中断')
      });

      // 获取当前场景的所有文件内容
      const filesResponse = await fetch(`/api/scenario-content?id=${selectedSubScenario}&type=list`, { signal })
      if (!filesResponse.ok) {
        throw new Error('获取文件列表失败')
      }
      const filesData = await filesResponse.json()
      const files = filesData.files || []

      console.log('当前场景的所有文件:', files)

      // 获取所有文件的内容
      const fileContents = await Promise.all(
        files.map(async (file: string) => {
          try {
            console.log(`正在获取文件内容: ${file}`)
            const response = await fetch(
              `/api/scenario-content?id=${selectedSubScenario}&type=file&file=${encodeURIComponent(file)}`,
              { signal }
            )
            if (response.ok) {
              const data = await response.json()
              console.log(`成功获取文件内容: ${file}`)
              return {
                filename: file,
                content: data.content
              }
            }
            console.error(`获取文件 ${file} 内容失败`)
            return null
          } catch (error: any) {
            // 如果是abort，不显示错误
            if (error.name !== 'AbortError') {
              console.error(`处理文件 ${file} 时出错:`, error)
            }
            return null
          }
        })
      )

      // 过滤掉获取失败的文件
      const validFileContents = fileContents.filter(content => content !== null)
      console.log(`总共成功读取了 ${validFileContents.length} 个文件的内容`)
      console.log('文件列表:', validFileContents.map(f => f.filename))
      
      if (validFileContents.length === 0) {
        throw new Error('未能成功读取任何文件内容')
      }

      console.log('准备发送聊天请求到服务器')
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          scenarioId: selectedSubScenario,
          conversationHistory: updatedHistory,
          isMultiRound: true,
          fileContents: validFileContents
        }),
        signal, // 确保使用中止信号
      });
      
      console.log('收到聊天API响应，状态码:', response.status)
      if (!response.ok) {
        throw new Error('API请求失败');
      }
      
      const data = await response.json();
      setAiResponse(data.response);
      
      // 更新对话历史，添加AI回复
      setConversationHistory([
        ...updatedHistory,
        { role: 'assistant', content: data.response }
      ]);
      
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('用户输入处理已被中止');
        setAiResponse(prev => prev + '\n\n[回答已被用户中止]');
      } else {
        console.error('回答生成错误:', error);
        setAiResponse("抱歉，生成回答时出现错误。请稍后重试。");
      }
    } finally {
      console.log('请求处理完成，重置状态')
      if (abortControllerRef.current) {
        abortControllerRef.current = null;
      }
      setIsResponding(false);
    }
  };

  const handleResponse = async () => {
    // 如果正在响应，则停止 - 不再需要这个逻辑
    if (isResponding) {
      return
    }
    
    // 重置对话历史
    setConversationHistory([]);
    setIsMultiRound(true);
    
    try {
      console.log('开始生成初始回答')
    setIsResponding(true)
      setAiResponse("")
      
      // 创建新的 AbortController
      abortControllerRef.current = new AbortController()
      console.log('创建了新的AbortController实例')
      const signal = abortControllerRef.current.signal

      // 监听abort事件
      signal.addEventListener('abort', () => {
        console.log('检测到中止信号，请求被中断')
      });

      // 获取当前场景的所有文件内容
      const filesResponse = await fetch(`/api/scenario-content?id=${selectedSubScenario}&type=list`, { signal })
      if (!filesResponse.ok) {
        throw new Error('获取文件列表失败')
      }
      const filesData = await filesResponse.json()
      const files = filesData.files || []

      console.log('当前场景的所有文件:', files)

      // 获取所有文件的内容
      const fileContents = await Promise.all(
        files.map(async (file: string) => {
          try {
            console.log(`正在获取文件内容: ${file}`)
            const response = await fetch(
              `/api/scenario-content?id=${selectedSubScenario}&type=file&file=${encodeURIComponent(file)}`,
              { signal }
            )
            if (response.ok) {
              const data = await response.json()
              console.log(`成功获取文件内容: ${file}`)
              return {
                filename: file,
                content: data.content
              }
            }
            console.error(`获取文件 ${file} 内容失败`)
            return null
          } catch (error: any) {
            // 如果是abort，不显示错误
            if (error.name !== 'AbortError') {
              console.error(`处理文件 ${file} 时出错:`, error)
            }
            return null
          }
        })
      )

      // 过滤掉获取失败的文件
      const validFileContents = fileContents.filter(content => content !== null)
      console.log(`总共成功读取了 ${validFileContents.length} 个文件的内容`)
      console.log('文件列表:', validFileContents.map(f => f.filename))
      
      if (validFileContents.length === 0) {
        throw new Error('未能成功读取任何文件内容')
      }

      console.log('准备发送聊天请求到服务器')
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          scenarioId: selectedSubScenario,
          isMultiRound: false,
          fileContents: validFileContents
        }),
        signal, // 确保使用中止信号
      })
      
      console.log('收到聊天API响应，状态码:', response.status)
      if (!response.ok) {
        throw new Error('API请求失败')
      }
      
      const data = await response.json()
      setAiResponse(data.response)
      
      // 将初始问题和回答添加到对话历史
      setConversationHistory([
        { role: 'assistant', content: data.response }
      ]);
      
    } catch (error: any) {
      // 如果是中止错误，不显示错误信息
      if (error.name === 'AbortError') {
        console.log('初始回答生成已被中止')
        setAiResponse(prev => prev + '\n\n[回答已被用户中止]');
      } else {
        console.error('回答生成错误:', error)
        setAiResponse("抱歉，生成回答时出现错误。请稍后重试。")
      }
    } finally {
      console.log('请求处理完成，重置状态')
      if (abortControllerRef.current) {
        abortControllerRef.current = null
      }
        setIsResponding(false)
    }
  }

  // 清空对话历史
  const clearConversation = () => {
    setConversationHistory([])
    setAiResponse("")
    setIsMultiRound(false)
    
    // 如果正在响应，也取消继续加载
    if (isResponding) {
      if (abortControllerRef.current) {
        try {
          abortControllerRef.current.abort()
        } catch (e) {
          console.error('取消请求时出错:', e)
        } finally {
          abortControllerRef.current = null
        }
      }
      setIsResponding(false)
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-slate-950 to-blue-950 text-slate-100">
      <header className="p-6 border-b border-blue-900/30 relative">
        {/* Logo放置在左上角 */}
        <div className="absolute top-4 left-6">
          <img src="/images/gajlogo.png" alt="锡林郭勒盟公安局logo" className="h-12 w-auto" />
        </div>
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-center items-center">
            <div className="flex flex-col items-center">
              <h1 className="text-5xl font-bold text-white text-center">
                <div>锡林郭勒盟公安局</div>
                <div className="mt-2">公安办案AI辅助分析系统</div>
              </h1>
              <div className="text-emerald-400 mt-2 text-lg">北京联通</div>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 p-6 overflow-hidden flex">
        <div className="flex-1 flex gap-4 max-w-7xl mx-auto w-full relative z-10">
          {/* 左侧场景选择区域 - 减小宽度 */}
          <div id="left-menu" className="w-1/5 bg-gray-900 p-4 h-full flex flex-col">
            <div className="grid gap-4">
              {scenarios.map((scenario, index) => (
                <div key={scenario.id} className="space-y-2">
                  {/* 添加分隔线 */}
                  {index > 0 && (
                    <div className="pt-4 pb-2">
                      <div className="h-px bg-gradient-to-r from-transparent via-blue-500 to-transparent mb-4" />
                    </div>
                  )}
                  
                  {/* 添加分类标题 */}
                  <div className="font-bold text-blue-300 uppercase tracking-wider pl-1 mb-3 py-1 flex items-center">
                    <div className="w-1 h-6 bg-blue-500 mr-2 rounded-full"></div>
                    {index === 0 ? 
                      <span className="text-xl">刑事案件</span> : 
                      <span className="text-xl">{index === 1 ? "交通案件" : "治安案件"}</span>
                    }
                  </div>
                  
                  {/* 主场景按钮 */}
                  <button 
                    className={`text-left w-full p-3 rounded-lg border ${
                      currentScenario === index 
                        ? "bg-blue-800 border-blue-600 shadow-lg shadow-blue-900/20" 
                        : "bg-gray-800 border-gray-700 hover:bg-gray-700"
                    } transition-all duration-200 ease-in-out`}
                    onClick={() => {
                      // 如果当前选中的是这个场景，则取消选中（设置为null）
                      if (currentScenario === index) {
                        setCurrentScenario(null)
                        // 如果有选中的子场景，也需要清除
                        if (selectedSubScenario) {
                          setSelectedSubScenario(null)
                          setFileList([])
                          setIsFileListVisible(false)
                        }
                      } else {
                        setCurrentScenario(index)
                      }
                    }}
                  >
                    <div className="flex flex-col gap-2">
                      <span className={`font-extrabold ${
                        currentScenario === index ? "text-blue-300" : "text-slate-300"
                      } text-base`}>
                        {scenario.title}
                      </span>
                      <span className="text-xs text-slate-400">
                        {scenario.description}
                      </span>
                    </div>
                  </button>

                  {/* 子场景列表 - 当前选中的主场景才显示 */}
                  {currentScenario === index && (
                    <div className="ml-2 space-y-1 mt-1">
                      {scenario.subScenarios.map((subScenario) => (
                        <div 
                          key={subScenario.id}
                          ref={subScenarioRef}
                          className={`p-2 bg-gray-700/50 rounded-lg cursor-pointer hover:bg-gray-700 transition-colors ${
                            selectedSubScenario === subScenario.id ? 'bg-gray-700 border border-blue-500' : ''
                          }`}
                          onClick={() => handleSubScenarioClick(subScenario.id)}
                          onMouseEnter={(e) => selectedSubScenario === subScenario.id && handleSubScenarioHover(true, e)}
                          onMouseLeave={() => handleSubScenarioHover(false)}
                        >
                          <h4 className="font-medium text-blue-300 mb-0.5 text-sm">{subScenario.title}</h4>
                          <p className="text-xs text-gray-400">{subScenario.description}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
          ))}
        </div>
      </div>

          {/* 右侧内容区 - 增加宽度占比 */}
          <div id="content-area" className="flex-1 flex flex-col gap-4">
            {/* 响应区 */}
            <div className="bg-gray-900 border border-gray-700 rounded-lg overflow-hidden flex-1 flex flex-col">
              <div className="p-4 bg-gray-800 border-b border-gray-700">
                <h2 className="text-xl font-semibold text-white">
                  {currentScenario !== null 
                    ? `${scenarios[currentScenario].title} - ${selectedSubScenario ? scenarios[currentScenario].subScenarios.find(s => s.id === selectedSubScenario)?.title : '请选择具体阶段'}` 
                    : '选择案件类型开始分析'}
                </h2>
              </div>
              
              {/* 主内容区域，分为文件列表和AI响应 */}
              <div className="flex-1 flex overflow-hidden">
                {/* 文件列表区域 */}
                {selectedSubScenario && fileList.length > 0 && isFileListVisible && (
                  <div ref={fileListRef} className="w-1/4 border-r border-gray-700 bg-gray-900 overflow-y-auto">
                    <div className="p-3">
                      <h3 className="text-base font-semibold mb-3 sticky top-0 bg-gray-900 py-1 text-blue-300">
                        文件列表 ({fileList.length})
                      </h3>
                      <div className="space-y-1">
                        {fileList.map((file, fileIndex) => (
                          <div key={fileIndex} className="cursor-pointer">
                            <div
                              className={`p-1.5 rounded hover:bg-gray-700 text-sm ${
                                selectedFile === file ? 'bg-gray-700' : ''
                              }`}
                              onClick={() => handleFileClick(file)}
                            >
                              {file}
                            </div>
                            {selectedFile === file && (
                              <div className="mt-1.5 p-1.5 bg-gray-800 rounded max-h-[250px] overflow-y-auto">
                                {isLoadingFile ? (
                                  <div className="flex justify-center items-center p-2 text-blue-400 text-sm">
                                    <div className="animate-pulse">加载文件内容中...</div>
                                  </div>
                                ) : (
                                  <pre className="text-xs whitespace-pre-wrap">
                                    {scenarioContent || "无文件内容"}
                                  </pre>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                
                {/* AI响应区域 */}
                <div id="ai-response-area" className={`${selectedSubScenario && fileList.length > 0 && isFileListVisible ? 'w-3/4' : 'w-full'} p-4 overflow-auto`}>
                  <ResponseDisplay 
                    response={aiResponse} 
                    isResponding={isResponding} 
                    conversationHistory={conversationHistory}
                  />
                </div>
        </div>
      </div>

            {/* 输入区 */}
            <div className="bg-gray-900 border border-gray-700 rounded-lg p-3">
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    className="w-full bg-gray-800 text-white border border-gray-700 rounded-md px-3 py-1.5 focus:outline-none focus:border-blue-500"
                    placeholder="输入您的问题..."
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendUserInput();
                      }
                    }}
                    disabled={isResponding}
                  />
                  <button
                    className={`p-1.5 rounded-md ${
                      isRecording ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-700 hover:bg-blue-800'
                    } transition-colors`}
                    onClick={toggleRecording}
          disabled={isResponding}
                  >
                    {isRecording ? <Mic className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  </button>
                  <button
                    className="px-3 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded-md transition text-sm"
                    onClick={sendUserInput}
                    disabled={isResponding || !userInput.trim()}
                  >
                    发送
                  </button>
                </div>
                
                {/* 功能按钮区 */}
                <div className="flex justify-end gap-1.5 mt-1.5">
                  <button
                    className="px-3 py-1.5 bg-gray-700 hover:bg-gray-800 text-white rounded-md transition flex items-center gap-1 text-sm"
                    onClick={clearConversation}
                    disabled={conversationHistory.length === 0}
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>清空</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* 动态背景装饰 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-500/5 to-purple-500/5"></div>
      </div>
    </div>
  )
}

