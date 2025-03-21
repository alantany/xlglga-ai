"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import ResponseDisplay from "@/components/response-display"
import { StopCircle, Play, Mic, MicOff, Send } from "lucide-react"
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
  const [currentScenario, setCurrentScenario] = useState(0)
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

  const scenarios = [
    {
      id: 1,
      title: "第1阶段：立案前材料分析",
      description: "对立案前的案件材料进行全面分析，包括受害人笔录等关键信息的研判"
    },
    {
      id: 2, 
      title: "第2阶段：刑拘前材料分析",
      description: "对刑事拘留前的证据材料进行分析，评估是否符合刑事拘留条件"
    },
    {
      id: 3,
      title: "第3阶段：报捕前材料分析", 
      description: "对逮捕前的案件材料进行法律分析，评估是否达到逮捕条件"
    },
    {
      id: 4,
      title: "第4阶段：起诉前材料分析",
      description: "对起诉前的全部证据材料进行综合研判，评估是否达到起诉标准"
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
      try {
        const response = await fetch(`/api/scenario-content?id=${hoveredScenario! + 1}&type=file&file=${encodeURIComponent(file)}`)
        if (response.ok) {
          const data = await response.json()
          setScenarioContent(data.content)
        }
      } catch (error) {
        console.error('获取文件内容失败:', error)
      }
    }
  }

  // 处理提示框的鼠标事件
  const handleTooltipMouseEnter = () => {
    setIsTooltipHovered(true);
    // 清除任何可能的隐藏超时
    if (tooltipTimeoutRef.current) {
      clearTimeout(tooltipTimeoutRef.current);
      tooltipTimeoutRef.current = null;
    }
  };

  const handleTooltipMouseLeave = () => {
    setIsTooltipHovered(false);
    // 设置延迟隐藏提示
    tooltipTimeoutRef.current = setTimeout(() => {
      setHoveredScenario(null);
      setScenarioContent("");
    }, 300);
  };

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
    if (!userInput.trim()) return;
    
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
      setIsResponding(true);
      
      // 更新对话历史，立即添加用户问题
      const updatedHistory = [
        ...conversationHistory,
        { role: 'user', content: currentUserInput }
      ];
      setConversationHistory(updatedHistory);
      
      // 创建新的 AbortController
      abortControllerRef.current = new AbortController();
      const signal = abortControllerRef.current.signal;

      // 获取当前场景的所有文件内容
      const filesResponse = await fetch(`/api/scenario-content?id=${currentScenario + 1}&type=list`)
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
              `/api/scenario-content?id=${currentScenario + 1}&type=file&file=${encodeURIComponent(file)}`
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
          } catch (error) {
            console.error(`处理文件 ${file} 时出错:`, error)
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

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          scenarioId: currentScenario + 1,
          conversationHistory: updatedHistory,
          isMultiRound: true,
          fileContents: validFileContents
        }),
        signal,
      });
      
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
        console.log('请求已中止');
      } else {
        console.error('回答生成错误:', error);
        setAiResponse("抱歉，生成回答时出现错误。请稍后重试。");
      }
    } finally {
      if (abortControllerRef.current) {
        abortControllerRef.current = null;
      }
      setIsResponding(false);
    }
  };

  const handleResponse = async () => {
    // 如果正在响应，则停止
    if (isResponding && abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
      setIsResponding(false)
      return
    }
    
    // 重置对话历史
    setConversationHistory([]);
    setIsMultiRound(true);
    
    try {
      setIsResponding(true)
      setAiResponse("")
      
      // 创建新的 AbortController
      abortControllerRef.current = new AbortController()
      const signal = abortControllerRef.current.signal

      // 获取当前场景的所有文件内容
      const filesResponse = await fetch(`/api/scenario-content?id=${currentScenario + 1}&type=list`)
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
              `/api/scenario-content?id=${currentScenario + 1}&type=file&file=${encodeURIComponent(file)}`
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
          } catch (error) {
            console.error(`处理文件 ${file} 时出错:`, error)
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

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          scenarioId: currentScenario + 1,
          isMultiRound: false,
          fileContents: validFileContents
        }),
        signal,
      })
      
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
        console.log('请求已中止')
      } else {
        console.error('回答生成错误:', error)
        setAiResponse("抱歉，生成回答时出现错误。请稍后重试。")
      }
    } finally {
      if (abortControllerRef.current) {
        abortControllerRef.current = null
      }
      setIsResponding(false)
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-slate-950 to-blue-950 text-slate-100">
      <header className="p-6 border-b border-blue-900/30">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">公安刑侦全阶段AI辅助分析系统</h1>
        </div>
      </header>

      <main className="flex-1 p-6 overflow-hidden flex">
        <div className="flex-1 flex gap-8 max-w-7xl mx-auto w-full relative z-10">
          {/* 左侧场景选择区域 */}
          <div className="w-1/4 bg-gray-900 p-6 h-full flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">选择刑侦阶段</h2>
            </div>

            <div className="grid gap-4 mb-6">
              {scenarios.map((scenario, index) => (
                <div 
                  key={scenario.id}
                  className="relative"
                  onMouseEnter={(e) => handleScenarioHover(index, e)}
                  onMouseLeave={() => handleScenarioHover(null)}
                >
                  <button 
                    className={`text-left w-full p-4 rounded-lg border ${
                      currentScenario === index 
                        ? "bg-blue-800 border-blue-600" 
                        : "bg-gray-800 border-gray-700 hover:bg-gray-700"
                    } transition-all duration-200 ease-in-out`}
                    onClick={() => setCurrentScenario(index)}
                  >
                    <div className="flex items-center">
                      <span className={`text-xl font-bold mr-2 ${currentScenario === index ? "text-blue-300" : "text-slate-300"}`}>
                        第{scenario.id}阶段
                      </span>
                      <span className="text-sm text-slate-400">
                        {scenario.title}
                      </span>
                    </div>
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-auto">
              <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
                <h3 className="text-lg font-medium text-blue-300 mb-2">使用提示</h3>
                <p className="text-gray-400 text-sm">
                  选择左侧的刑侦阶段，在下方输入框中输入您的问题，AI将基于当前阶段的所有材料为您提供专业分析意见。
                </p>
              </div>
            </div>
          </div>

          {/* 右侧内容区 */}
          <div className="flex-1 flex flex-col gap-4">
            {/* 响应区 */}
            <div className="bg-gray-900 border border-gray-700 rounded-lg overflow-hidden flex-1 flex flex-col">
              <div className="p-4 bg-gray-800 border-b border-gray-700">
                <h2 className="text-xl font-semibold text-white">
                  {currentScenario !== null 
                    ? `${scenarios[currentScenario].title} - 分析结果` 
                    : '选择阶段开始分析'}
                </h2>
              </div>
              <div className="flex-1 p-6 overflow-auto">
                <ResponseDisplay 
                  response={aiResponse} 
                  isResponding={isResponding} 
                  conversationHistory={conversationHistory}
                />
              </div>
            </div>

            {/* 输入区 */}
            <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  className="w-full bg-gray-800 text-white border border-gray-700 rounded-md px-4 py-2 focus:outline-none focus:border-blue-500"
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
                  className={`p-2 rounded-md ${
                    isRecording ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-700 hover:bg-blue-800'
                  } transition-colors`}
                  onClick={toggleRecording}
                  disabled={isResponding}
                >
                  {isRecording ? <Mic className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </button>
                <button
                  className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-md transition"
                  onClick={sendUserInput}
                  disabled={isResponding || !userInput.trim()}
                >
                  发送问题
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* 动态背景装饰 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-500/5 to-purple-500/5"></div>
      </div>

      {/* 文件列表弹窗 */}
      {hoveredScenario !== null && (
        <div
          className="fixed bg-gray-800 border border-gray-700 rounded-lg p-4 z-50 w-[400px]"
          style={{
            top: hoverPosition.top,
            left: hoverPosition.left,
          }}
          onMouseEnter={handleTooltipMouseEnter}
          onMouseLeave={handleTooltipMouseLeave}
        >
          <h3 className="text-lg font-semibold mb-4">
            {scenarios[hoveredScenario].title}
          </h3>
          <div className="space-y-2">
            {fileList.map((file, index) => (
              <div key={index} className="cursor-pointer">
                <div
                  className={`p-2 rounded hover:bg-gray-700 ${
                    selectedFile === file ? 'bg-gray-700' : ''
                  }`}
                  onClick={() => handleFileClick(file)}
                >
                  {file}
                </div>
                {selectedFile === file && scenarioContent && (
                  <div className="mt-2 p-2 bg-gray-900 rounded max-h-[300px] overflow-y-auto">
                    {scenarioContent}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

