import { Mic, Trash2 } from "lucide-react";

interface InputSectionProps {
  userInput: string;
  setUserInput: (input: string) => void;
  isResponding: boolean;
  isRecording: boolean;
  toggleRecording: () => void;
  sendUserInput: () => void;
  clearConversation: () => void;
  conversationHistory: { role: string; content: string }[];
}

export default function InputSection({
  userInput,
  setUserInput,
  isResponding,
  isRecording,
  toggleRecording,
  sendUserInput,
  clearConversation,
  conversationHistory
}: InputSectionProps) {
  return (
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
            <Mic className="w-4 h-4" />
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
  );
} 