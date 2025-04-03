import { useEffect, useState, useRef } from "react"
import { Bot, User, Loader2 } from "lucide-react"
import dynamic from "next/dynamic"

// 使用dynamic导入RelationshipGraph组件，避免SSR问题
const RelationshipGraph = dynamic(() => import("./RelationshipGraph"), {
  ssr: false,
  loading: () => <div className="animate-pulse h-96 w-full bg-slate-800/20 rounded-lg"></div>
})

interface ResponseDisplayProps {
  response: string
  isResponding: boolean
  conversationHistory: {role: string, content: string}[]
  scenarioId?: string // 添加场景ID属性
}

// 清理多余空行的函数（客户端版本）
function cleanupExcessiveWhitespace(text: string): string {
  // 将连续的多个空行（三个以上的换行符）替换为两个换行符
  // 注意：我们需要保留至少两个换行符以确保段落分隔
  const cleanedText = text.replace(/\n{3,}/g, '\n\n');
  // 去除开头的空行
  return cleanedText.replace(/^\s+/, '');
}

// 清理Markdown格式的函数
function cleanMarkdown(text: string): string {
  if (!text) return "";
  return text
    .replace(/#{1,6}\s+/g, '') // 移除 markdown 样式的标题 # 符号
    .replace(/\*\*([^*]+)\*\*/g, '$1') // 移除粗体 ** 符号但保留内容
    .replace(/\*([^*]+)\*/g, '$1')     // 移除斜体 * 符号但保留内容
    .replace(/#+/g, '')        // 移除剩余的 # 符号
    .replace(/---+/g, '');     // 移除分隔符 ---
}

// 格式化文本，突出显示段落标题
function formatResponseText(text: string): React.ReactNode {
  if (!text) return null;
  
  // 首先清理Markdown符号
  const cleanedText = cleanMarkdown(text);
  
  // 使用正则表达式识别独立成行的段落标题
  // 常见的标题模式包括：事故原因及过程分析、违法行为认定、责任划分依据、案情要点等
  const explicitTitlePattern = /^([\s]*)(事故原因及过程分析|违法行为认定|责任划分依据|案情要点|关键矛盾点|法律依据|案件基本情况|法律关系分析|案件分析|证据审查|证据审核|侦查方向|审查意见|矛盾点分析|嫌疑分析|笔录分析|供述分析|法律评价|案情概述|伤情分析|法律问题|证据清单|综合分析|处理建议)(.?)$/gm;
  
  // 通用的标题判断模式：不超过15个字的单独一行
  const heuristicTitlePattern = /^([\s]*)(.{2,15})(:|：)?$/;
  
  // 将文本按行分割
  const lines = cleanedText.split('\n');
  
  // 检测一行是否可能是标题
  const isTitleLine = (line: string, index: number): boolean => {
    // 重置正则表达式的lastIndex
    explicitTitlePattern.lastIndex = 0;
    
    // 1. 首先检查是否是明确定义的标题
    if (explicitTitlePattern.test(line)) {
      return true;
    }
    
    // 2. 然后使用启发式算法检测其他可能的标题
    // 条件: 前后都是空行(或者是第一行/最后一行)，内容短，不包含标点符号（除了冒号）
    const isShortLine = heuristicTitlePattern.test(line);
    const isPrecededByEmptyLine = index === 0 || lines[index - 1].trim() === '';
    const isFollowedByContent = index < lines.length - 1 && lines[index + 1].trim() !== '';
    
    return isShortLine && isPrecededByEmptyLine && isFollowedByContent;
  };
  
  return (
    <>
      {lines.map((line, index) => {
        // 检查是否是标题行
        const isTitle = isTitleLine(line, index);
        
        // 返回相应的样式化元素
        return (
          <div key={index}>
            {isTitle ? (
              // 标题行 - 使用粗体和特殊颜色
              <div className="font-bold text-emerald-400 text-xl py-1">{line}</div>
            ) : (
              // 普通行
              <div>{line}</div>
            )}
            {/* 如果是空行，添加一些垂直间距 */}
            {line === '' && <div className="h-2"></div>}
          </div>
        );
      })}
    </>
  );
}

// 思考动画组件
const ThinkingAnimation = () => (
  <div className="flex flex-col items-center justify-center py-5">
    <div className="relative">
      {/* 外圈光环效果 */}
      <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-pulse" style={{ transform: 'scale(1.4)' }}></div>
      <div className="relative">
        <Bot className="w-10 h-5 text-emerald-500" />
        {/* 旋转光点 */}
        <div className="absolute top-0 left-0 w-full h-full animate-spin-slow">
          <div className="absolute top-0 left-1/2 w-1.5 h-1.5 bg-emerald-500 rounded-full transform -translate-x-1/2"></div>
        </div>
      </div>
    </div>
    <h3 className="text-xl font-bold text-emerald-400 mt-4 mb-2">AI 正在思考中</h3>
    <div className="flex items-center gap-2 text-slate-400 text-sm">
      <Loader2 className="w-4 h-4 animate-spin" />
      <p>正在分析相关材料，请稍候...</p>
    </div>
  </div>
)

// 添加独立的关系图谱容器组件
const GraphContainer = ({ scenarioId }: { scenarioId?: string }) => {
  if (!scenarioId?.startsWith("relationship_")) return null;
  
  return (
    <div className="mt-8 w-full relative z-10">
      <div className="flex items-center mb-3 border-l-4 border-emerald-500 pl-3">
        <h3 className="text-xl font-bold text-emerald-400">人物关系图谱分析</h3>
        <div className="flex items-center ml-3 text-xs text-gray-400">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 mr-1"></span>
          实时交互可视化
        </div>
      </div>
      <RelationshipGraph />
    </div>
  );
};

export default function ResponseDisplay({ response, isResponding, conversationHistory, scenarioId }: ResponseDisplayProps) {
  const [displayedResponse, setDisplayedResponse] = useState("")
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isTyping, setIsTyping] = useState(false)
  const [showGraph, setShowGraph] = useState(false)  // 添加状态控制是否显示图谱
  const responseRef = useRef<HTMLDivElement>(null)
  
  // 处理响应内容，先清理Markdown格式，然后清理多余空行但保留段落分隔
  const processedResponse = response ? cleanupExcessiveWhitespace(cleanMarkdown(response)) : "";
  
  // 打字机效果
  useEffect(() => {
    if (!processedResponse) {
      setDisplayedResponse("")
      setCurrentIndex(0)
      setIsTyping(false)
      return
    }
    
    // 如果有响应内容，开始打字机效果
    if (processedResponse && !isResponding && currentIndex < processedResponse.length) {
      setIsTyping(true)
      const timer = setTimeout(() => {
        setDisplayedResponse(prev => prev + processedResponse[currentIndex])
        setCurrentIndex(prev => prev + 1)
        
        // 自动滚动到底部，添加延迟使滚动更平滑
        setTimeout(() => {
          if (responseRef.current) {
            responseRef.current.scrollTop = responseRef.current.scrollHeight
          }
        }, 50)
        
        // 检查是否完成
        if (currentIndex + 1 >= processedResponse.length) {
          setIsTyping(false)
        }
      }, 80)
      
      return () => clearTimeout(timer)
    }
  }, [processedResponse, currentIndex, isResponding])
  
  // 当响应内容变化时重置
  useEffect(() => {
    setDisplayedResponse("")
    setCurrentIndex(0)
    setIsTyping(true)
  }, [processedResponse])

  // 渲染对话消息
  const renderConversation = () => {
    if (conversationHistory.length === 0) {
      return (
        <>
          {isResponding ? (
            <ThinkingAnimation />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
              <Bot className="w-16 h-16 mb-4 text-slate-500" />
              <p className="text-xl">请选择案件类型并输入您的问题</p>
              <p className="mt-2">AI助手将协助您进行专业的案件分析</p>
            </div>
          )}
        </>
      );
    }

    return (
      <div className="space-y-8">
        {conversationHistory.map((message, index) => (
          <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex items-start gap-4 max-w-[80%] ${message.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${
                message.role === 'user' ? 'bg-blue-600' : 'bg-emerald-600'
              }`}>
                {message.role === 'user' ? (
                  <User className="w-6 h-6 text-white" />
                ) : (
                  <Bot className="w-6 h-6 text-white" />
                )}
              </div>
              <div className={`rounded-lg p-6 ${
                message.role === 'user' 
                  ? 'bg-blue-600/40 text-white' 
                  : 'bg-gray-800/80 text-white'
              }`}>
                <div className="text-sm opacity-75 mb-2">
                  {message.role === 'user' ? '办案民警' : 'AI分析助手'}
                </div>
                {/* 使用格式化组件来渲染响应内容 */}
                <div className="text-lg leading-relaxed">
                  {message.role === 'assistant' && index === conversationHistory.length - 1 && isTyping ? (
                    // 打字机效果时直接使用pre-wrap，并让光标紧跟文字
                    <div className="whitespace-pre-wrap">
                      {displayedResponse}
                      <span className="inline-block w-2 h-5 align-middle bg-emerald-400 animate-pulse"></span>
                    </div>
                  ) : (
                    // 完整显示时使用格式化函数
                    message.role === 'assistant' ? (
                      <>
                        {formatResponseText(message.content)}
                        
                        {/* 替换原来的自动显示图谱代码，改为显示按钮 */}
                        {message.role === 'assistant' && 
                         index === conversationHistory.length - 1 && 
                         scenarioId?.startsWith("relationship_") && !isTyping && (
                          <div className="mt-8 w-full">
                            {!showGraph ? (
                              <button 
                                onClick={() => setShowGraph(true)}
                                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md flex items-center gap-2 shadow-md transition-colors duration-200"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                                <span>显示人物关系图谱</span>
                              </button>
                            ) : (
                              <>
                                <div className="flex items-center mb-3 border-l-4 border-emerald-500 pl-3">
                                  <h3 className="text-xl font-bold text-emerald-400">人物关系图谱分析</h3>
                                  <div className="flex items-center ml-3 text-xs text-gray-400">
                                    <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 mr-1"></span>
                                    实时交互可视化
                                  </div>
                                </div>
                                <RelationshipGraph />
                                <button 
                                  onClick={() => setShowGraph(false)}
                                  className="mt-4 px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded-md text-sm flex items-center gap-1 transition-colors duration-200"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                  <span>隐藏图谱</span>
                                </button>
                              </>
                            )}
                          </div>
                        )}
                      </>
                    ) : (
                      // 用户消息仍然使用预格式化文本
                      <div className="whitespace-pre-wrap">{message.content}</div>
                    )
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
        {isResponding && (
          <div className="flex justify-start">
            <div className="flex items-start gap-4 max-w-[80%]">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-emerald-600 flex items-center justify-center">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <div className="bg-gray-800/80 rounded-lg p-6">
                <div className="text-sm opacity-75 mb-2">AI分析助手</div>
                <ThinkingAnimation />
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-slate-900/60 backdrop-blur-sm rounded-lg p-8 border border-emerald-500/20 shadow-lg min-h-[350px] flex flex-col relative overflow-hidden group transition-all duration-300 hover:border-emerald-500/30">
      {/* 装饰效果 */}
      <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-500/5 rounded-bl-full"></div>
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-teal-500/5 rounded-tr-full"></div>
      
      <div 
        ref={responseRef}
        className="flex-1 relative z-10 overflow-auto max-h-[600px] scroll-smooth"
      >
        {renderConversation()}
      </div>
    </div>
  )
} 