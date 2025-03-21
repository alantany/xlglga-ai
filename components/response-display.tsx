import { useEffect, useState, useRef } from "react"
import { Bot, User, Loader2 } from "lucide-react"

interface ResponseDisplayProps {
  response: string
  isResponding: boolean
  conversationHistory: {role: string, content: string}[]
}

// 清理多余空行的函数（客户端版本）
function cleanupExcessiveWhitespace(text: string): string {
  // 将连续的多个空行（两个以上的换行符）替换为最多两个换行符
  const cleanedText = text.replace(/\n{3,}/g, '\n\n');
  // 去除开头的空行
  return cleanedText.replace(/^\s+/, '');
}

// 思考动画组件
const ThinkingAnimation = () => (
  <div className="flex flex-col items-center justify-center py-20">
    <div className="relative">
      {/* 外圈光环效果 */}
      <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-pulse" style={{ transform: 'scale(1.5)' }}></div>
      <div className="relative">
        <Bot className="w-16 h-16 text-emerald-500" />
        {/* 旋转光点 */}
        <div className="absolute top-0 left-0 w-full h-full animate-spin-slow">
          <div className="absolute top-0 left-1/2 w-2 h-2 bg-emerald-500 rounded-full transform -translate-x-1/2"></div>
        </div>
      </div>
    </div>
    <h3 className="text-3xl font-bold text-emerald-400 mt-8 mb-4">AI 正在思考中</h3>
    <div className="flex items-center gap-2 text-slate-400">
      <Loader2 className="w-5 h-5 animate-spin" />
      <p>正在分析相关材料，请稍候...</p>
    </div>
  </div>
)

export default function ResponseDisplay({ response, isResponding, conversationHistory }: ResponseDisplayProps) {
  const [displayedResponse, setDisplayedResponse] = useState("")
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isTyping, setIsTyping] = useState(false)
  const responseRef = useRef<HTMLDivElement>(null)
  
  // 处理响应内容，清理多余空行
  const processedResponse = response ? cleanupExcessiveWhitespace(response) : "";
  
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
              <p className="text-xl">请选择刑侦阶段并输入您的问题</p>
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
                <div className="text-lg leading-relaxed">
                  {message.role === 'assistant' && index === conversationHistory.length - 1 && isTyping
                    ? displayedResponse
                    : message.content}
                  {message.role === 'assistant' && index === conversationHistory.length - 1 && isTyping && (
                    <span className="inline-block w-2 h-5 ml-1 bg-emerald-400 animate-pulse"></span>
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

