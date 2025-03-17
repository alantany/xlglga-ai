import { useEffect, useState, useRef } from "react"

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
      }, 80) // 打字速度，从20ms增加到80ms，使其慢4倍
      
      return () => clearTimeout(timer)
    }
  }, [processedResponse, currentIndex, isResponding])
  
  // 当响应内容变化时重置
  useEffect(() => {
    setDisplayedResponse("")
    setCurrentIndex(0)
    setIsTyping(true)
  }, [processedResponse])
  
  // 计算完成百分比
  const completionPercentage = processedResponse ? Math.min(100, Math.round((currentIndex / processedResponse.length) * 100)) : 0

  // 思考动画
  const ThinkingAnimation = () => (
    <div className="flex flex-col items-center justify-center h-full">
      <div className="flex space-x-3 mb-4">
        <div className="w-4 h-4 bg-emerald-500 rounded-full animate-pulse" style={{ animationDelay: "0ms" }}></div>
        <div className="w-4 h-4 bg-emerald-500 rounded-full animate-pulse" style={{ animationDelay: "300ms" }}></div>
        <div className="w-4 h-4 bg-emerald-500 rounded-full animate-pulse" style={{ animationDelay: "600ms" }}></div>
      </div>
      <p className="text-2xl text-emerald-300 font-medium">AI 正在思考中，请稍候...</p>
      <p className="text-sm text-slate-400 mt-2">复杂问题可能需要较长时间</p>
    </div>
  )

  // 渲染对话消息
  const renderConversation = () => {
    if (conversationHistory.length === 0) {
      return (
        <>
          {isResponding && !processedResponse ? (
            <ThinkingAnimation />
          ) : (
            <>
              <div className="flex items-start mb-6">
                <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center mr-3 flex-shrink-0">
                  <span className="text-white font-bold">AI</span>
                </div>
                <div className="bg-slate-800/60 rounded-lg p-4 max-w-[90%]">
                  {displayedResponse}
                  {(isTyping) && <span className="inline-block w-4 h-8 ml-1 bg-emerald-400 animate-pulse"></span>}
                </div>
              </div>
            </>
          )}
        </>
      );
    }

    return (
      <>
        {conversationHistory.map((message, index) => (
          <div key={index} className={`flex items-start mb-6 ${message.role === 'user' ? 'justify-end' : ''}`}>
            {message.role === 'assistant' && (
              <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center mr-3 flex-shrink-0">
                <span className="text-white font-bold">AI</span>
              </div>
            )}
            <div className={`rounded-lg p-4 max-w-[90%] ${
              message.role === 'user' 
                ? 'bg-blue-600/40 text-white' 
                : 'bg-slate-800/60'
            }`}>
              {message.role === 'assistant' && index === conversationHistory.length - 1 && isTyping
                ? displayedResponse
                : cleanupExcessiveWhitespace(message.content)}
              {message.role === 'assistant' && index === conversationHistory.length - 1 && isTyping && (
                <span className="inline-block w-4 h-8 ml-1 bg-emerald-400 animate-pulse"></span>
              )}
            </div>
            {message.role === 'user' && (
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center ml-3 flex-shrink-0">
                <span className="text-white font-bold">您</span>
              </div>
            )}
          </div>
        ))}
        {isResponding && !processedResponse && (
          <div className="flex items-start mb-6">
            <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center mr-3 flex-shrink-0">
              <span className="text-white font-bold">AI</span>
            </div>
            <div className="bg-slate-800/60 rounded-lg p-4">
              <ThinkingAnimation />
            </div>
          </div>
        )}
      </>
    );
  };

  return (
    <div className="bg-slate-900/60 backdrop-blur-sm rounded-lg p-12 border border-emerald-500/20 shadow-lg min-h-[350px] flex flex-col relative overflow-hidden group transition-all duration-300 hover:border-emerald-500/30">
      {/* Tech decoration */}
      <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-500/5 rounded-bl-full"></div>
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-teal-500/5 rounded-tr-full"></div>
      <div className="absolute top-4 right-4 w-2 h-2 bg-emerald-400 rounded-full"></div>
      <div className="absolute top-4 right-10 w-1 h-1 bg-teal-400 rounded-full"></div>

      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-emerald-500 mr-3 animate-pulse"></div>
          <h2 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">
            对话内容:
          </h2>
        </div>
        
        {isResponding && !processedResponse && (
          <div className="flex items-center">
            <span className="text-xs text-emerald-300 ml-2 animate-pulse">
              思考中...
            </span>
          </div>
        )}
        
        {processedResponse && isTyping && (
          <div className="flex items-center">
            <span className="text-xs text-slate-400 ml-2">
              正在输出...
            </span>
          </div>
        )}
        
        {processedResponse && !isTyping && !isResponding && (
          <div className="flex items-center">
            <span className="text-xs text-emerald-400 ml-2">
              回答完成
            </span>
          </div>
        )}
      </div>

      <div 
        ref={responseRef}
        className="text-2xl leading-relaxed flex-1 text-white/90 relative z-10 whitespace-pre-wrap overflow-auto max-h-[500px] p-2 scroll-smooth"
      >
        {renderConversation()}
      </div>
    </div>
  )
}

