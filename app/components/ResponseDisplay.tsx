import React from 'react'
import { User, Bot } from 'lucide-react'

interface Props {
  response: string
  isResponding: boolean
  conversationHistory: { role: string; content: string }[]
}

const ResponseDisplay: React.FC<Props> = ({
  response,
  isResponding,
  conversationHistory,
}) => {
  const renderConversation = () => {
    return conversationHistory.map((message, index) => (
      <div
        key={index}
        className={`flex ${
          message.role === 'user' ? 'justify-end' : 'justify-start'
        } mb-4`}
      >
        <div
          className={`flex items-start gap-2 max-w-[80%] ${
            message.role === 'user' ? 'flex-row-reverse' : ''
          }`}
        >
          <div
            className={`p-2 rounded-lg ${
              message.role === 'user'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-white'
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              {message.role === 'user' ? (
                <>
                  <span className="font-medium">办案民警</span>
                  <User className="w-4 h-4" />
                </>
              ) : (
                <>
                  <Bot className="w-4 h-4" />
                  <span className="font-medium">AI分析助手</span>
                </>
              )}
            </div>
            <div className="whitespace-pre-wrap">{message.content}</div>
          </div>
        </div>
      </div>
    ))
  }

  return (
    <div className="h-full overflow-auto p-4">
      {conversationHistory.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-gray-500">
          <div className="mb-2">请选择刑侦阶段并开始分析</div>
          <div>AI将协助您进行专业的案件材料分析</div>
        </div>
      ) : (
        <>
          {renderConversation()}
          {isResponding && (
            <div className="flex justify-start mb-4">
              <div className="flex items-start gap-2 max-w-[80%]">
                <div className="p-2 rounded-lg bg-gray-700 text-white">
                  <div className="flex items-center gap-2 mb-1">
                    <Bot className="w-4 h-4" />
                    <span className="font-medium">AI分析助手</span>
                  </div>
                  <div className="animate-pulse">正在分析中...</div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default ResponseDisplay 