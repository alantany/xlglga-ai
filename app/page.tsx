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
  const [response, setResponse] = useState("")
  const [hoveredScenario, setHoveredScenario] = useState<number | null>(null)
  const [scenarioContent, setScenarioContent] = useState<string>("")
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
      title: "对多名嫌疑人讯问笔录进行内容对比分析",
    },
    {
      id: 2,
      title: "评估讯问笔录内容的准确性和一致性",
    },
    {
      id: 3,
      title: "通过多轮交互深入分析复杂案情",
    },
    {
      id: 4,
      title: "生成案件相关的任务关系图谱",
    },
    {
      id: 5,
      title: "辅助生成规范的移送起诉意见书",
    },
    {
      id: 6,
      title: "确保生成的移送起诉意见书符合法律规范",
    },
  ]

  // 处理鼠标悬停事件
  const handleScenarioHover = async (index: number | null, event?: React.MouseEvent) => {
    // 清除之前的超时
    if (tooltipTimeoutRef.current) {
      clearTimeout(tooltipTimeoutRef.current);
      tooltipTimeoutRef.current = null;
    }
    
    // 如果鼠标移出按钮，但移入了提示框，则不隐藏提示
    if (index === null && isTooltipHovered) {
      return;
    }
    
    // 如果鼠标移出按钮，设置延迟隐藏提示
    if (index === null) {
      tooltipTimeoutRef.current = setTimeout(() => {
        if (!isTooltipHovered) {
          setHoveredScenario(null);
          setScenarioContent("");
        }
      }, 300); // 300ms 延迟，给用户时间移动到提示框
      return;
    }
    
    setHoveredScenario(index);
    
    // 如果有事件，记录鼠标位置
    if (event) {
      const rect = event.currentTarget.getBoundingClientRect();
      setHoverPosition({
        top: rect.top,
        left: rect.right + 10 // 在按钮右侧10px处显示
      });
    }
    
    if (index !== null) {
      try {
        const response = await fetch(`/api/scenario-content?id=${index + 1}`);
        if (response.ok) {
          const data = await response.json();
          setScenarioContent(data.content);
        }
      } catch (error) {
        console.error('获取场景内容失败:', error);
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

  // 发送用户输入
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
      
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          scenarioId: currentScenario + 1,
          conversationHistory: updatedHistory,
          isMultiRound: true
        }),
        signal,
      });
      
      if (!response.ok) {
        throw new Error('API请求失败');
      }
      
      const data = await response.json();
      setResponse(data.response);
      
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
        setResponse("抱歉，生成回答时出现错误。请稍后重试。");
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
      setResponse("")
      
      // 创建新的 AbortController
      abortControllerRef.current = new AbortController()
      const signal = abortControllerRef.current.signal
      
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          scenarioId: currentScenario + 1,
          isMultiRound: false
        }),
        signal, // 添加信号以支持中止
      })
      
      if (!response.ok) {
        throw new Error('API请求失败')
      }
      
      const data = await response.json()
      setResponse(data.response)
      
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
        setResponse("抱歉，生成回答时出现错误。请稍后重试。")
      }
    } finally {
      if (abortControllerRef.current) {
        abortControllerRef.current = null
      }
      setIsResponding(false)
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white p-8 overflow-hidden">
      {/* Tech background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-10">
          <div className="absolute top-[10%] left-[5%] w-[30%] h-[30%] rounded-full bg-blue-500 blur-[100px]"></div>
          <div className="absolute bottom-[20%] right-[10%] w-[25%] h-[25%] rounded-full bg-indigo-500 blur-[100px]"></div>
          <div className="absolute top-[40%] right-[20%] w-[20%] h-[20%] rounded-full bg-cyan-500 blur-[100px]"></div>
        </div>
        <div className="absolute top-0 left-0 w-full h-full grid grid-cols-12 grid-rows-12 opacity-5">
          {Array.from({ length: 24 }).map((_, i) => (
            <div key={i} className="border border-blue-500/20"></div>
          ))}
        </div>
      </div>

      <header className="mb-8 relative z-10">
        <h1 className="text-7xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-cyan-300 to-blue-500 pb-2 tracking-tight">
          内蒙古锡林郭勒盟公安局
        </h1>
        <h1 className="text-7xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-cyan-300 to-blue-500 pb-2 tracking-tight">
          公安办案AI辅助系统场景演示
        </h1>
        <div className="w-32 h-1 bg-gradient-to-r from-blue-500 to-cyan-400 mx-auto mt-4"></div>
      </header>

      <div className="flex-1 flex gap-8 max-w-7xl mx-auto w-full relative z-10">
        {/* 左侧场景列表 */}
        <div className="w-1/3 flex flex-col gap-4">
          <div className="bg-slate-900/60 backdrop-blur-sm rounded-lg p-6 border border-blue-500/20 shadow-lg">
            <h2 className="text-2xl font-bold mb-4 text-blue-300">选择场景</h2>
            <div className="flex flex-col gap-3">
              {scenarios.map((scenario, index) => (
                <div 
                  key={scenario.id}
                  className="relative"
                  onMouseEnter={(e) => handleScenarioHover(index, e)}
                  onMouseLeave={() => handleScenarioHover(null)}
                >
                  <button
                    className={`w-full text-left p-4 rounded-md transition-all duration-300 ${
                      currentScenario === index
                        ? "bg-gradient-to-r from-blue-900/80 to-cyan-900/80 border border-blue-400/50 shadow-lg shadow-blue-500/20"
                        : "bg-slate-800/60 hover:bg-slate-700/60 border border-slate-700/50 hover:border-blue-500/30"
                    }`}
                    onClick={() => setCurrentScenario(index)}
                  >
                    <div className="flex items-center">
                      <span className={`text-xl font-bold mr-2 ${currentScenario === index ? "text-blue-300" : "text-slate-300"}`}>
                        场景{scenario.id}
                      </span>
                      <span className="text-sm text-slate-400">
                        {scenario.title}
                      </span>
                    </div>
                  </button>
                </div>
              ))}
            </div>
          </div>
          
          <div className="mt-4 flex justify-center">
            <Button
              size="lg"
              onClick={handleResponse}
              className={`text-xl py-6 px-8 transition-all duration-300 flex items-center gap-3 w-full ${
                isResponding 
                  ? "bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500" 
                  : "bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500"
              } border-0 shadow-lg shadow-blue-500/20`}
            >
              {isResponding ? (
                <>
                  <StopCircle className="w-5 h-5" />
                  停止回答
                </>
              ) : (
                <>
                  <Play className="w-5 h-5" />
                  开始回答
                </>
              )}
            </Button>
          </div>
          
          {/* 多轮对话输入区域 */}
          {response && (
            <div className="mt-4 bg-slate-900/60 backdrop-blur-sm rounded-lg p-4 border border-blue-500/20 shadow-lg">
              <h3 className="text-xl font-bold mb-3 text-blue-300">继续对话</h3>
              <div className="flex flex-col gap-3">
                <div className="relative">
                  <textarea
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    placeholder="输入您的问题或使用语音输入..."
                    className="w-full p-3 bg-slate-800/60 border border-slate-700 rounded-md text-white resize-none h-24"
                  />
                  <div className="absolute right-2 bottom-2 flex gap-2">
                    <button
                      onClick={toggleRecording}
                      className={`p-2 rounded-full ${
                        isRecording 
                          ? "bg-red-500 hover:bg-red-600" 
                          : "bg-blue-500 hover:bg-blue-600"
                      }`}
                    >
                      {isRecording ? <MicOff size={20} /> : <Mic size={20} />}
                    </button>
                  </div>
                </div>
                <Button
                  onClick={sendUserInput}
                  disabled={!userInput.trim() || isResponding}
                  className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white py-2 flex items-center justify-center gap-2"
                >
                  <Send size={16} />
                  发送问题
                </Button>
              </div>
            </div>
          )}
        </div>
        
        {/* 右侧 AI 回答 */}
        <div className="w-2/3">
          <ResponseDisplay 
            response={response} 
            isResponding={isResponding} 
            conversationHistory={conversationHistory}
          />
        </div>
      </div>

      {/* 使用 Portal 将悬停提示放在页面最顶层 */}
      {isMounted && (hoveredScenario !== null || isTooltipHovered) && scenarioContent && createPortal(
        <div 
          className="fixed bg-slate-800 border border-blue-500/30 rounded-md p-4 shadow-xl text-sm whitespace-pre-wrap max-h-[400px] overflow-auto w-[400px] text-white"
          style={{ 
            top: `${hoverPosition.top}px`, 
            left: `${hoverPosition.left}px`,
            zIndex: 9999
          }}
          onMouseEnter={handleTooltipMouseEnter}
          onMouseLeave={handleTooltipMouseLeave}
        >
          {scenarioContent}
        </div>,
        document.body
      )}
    </div>
  )
}

