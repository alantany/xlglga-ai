"use client"

import { useState, useRef, useEffect } from "react"
import Header from "@/app/components/Header"
import ScenarioSelector from "@/app/components/ScenarioSelector"
import FileList from "@/app/components/FileList"
import InputSection from "@/app/components/InputSection"
import ResponseDisplay from "@/app/components/ResponseDisplay"
import { scenarios } from "@/app/data/scenarios"
import { createSpeechRecognition, SpeechRecognitionEvent, SpeechRecognition } from "@/app/utils/speechRecognition"
import { getFileList, getFileContent, sendChatRequest } from "@/app/utils/apiService"
import Link from "next/link"

export default function LargeScreenDisplay() {
  const [currentScenario, setCurrentScenario] = useState<number | null>(0)
  const [isResponding, setIsResponding] = useState(false)
  const [aiResponse, setAiResponse] = useState("")
  const [scenarioContent, setScenarioContent] = useState<string>("")
  const [fileList, setFileList] = useState<string[]>([])
  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  const [isTooltipHovered, setIsTooltipHovered] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [userInput, setUserInput] = useState("")
  const [conversationHistory, setConversationHistory] = useState<{role: string, content: string}[]>([])
  const [isMultiRound, setIsMultiRound] = useState(false)
  const [selectedSubScenario, setSelectedSubScenario] = useState<string | null>(null)
  const [isFileListVisible, setIsFileListVisible] = useState(false)
  const [isLoadingFile, setIsLoadingFile] = useState(false)
  const [fileContentsCache, setFileContentsCache] = useState<{[key: string]: string}>({})
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  
  const tooltipTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const recognitionRef = useRef<SpeechRecognition | null>(null)

  // 初始化语音识别
  useEffect(() => {
    if (typeof window !== 'undefined') {
      recognitionRef.current = createSpeechRecognition();
      
      if (recognitionRef.current) {
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
        
        recognitionRef.current.onerror = (event) => {
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
        const files = await getFileList(subScenarioId);
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

  // 处理文件点击
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
        // 获取文件内容
        const content = await getFileContent(selectedSubScenario!, file);
        
        // 保存到缓存
        setFileContentsCache(prev => ({
          ...prev,
          [cacheKey]: content
        }))
        setScenarioContent(content)
      } catch (error) {
        console.error('获取文件内容失败:', error)
        setScenarioContent(`获取文件内容时发生错误: ${error instanceof Error ? error.message : String(error)}`)
      } finally {
        setIsLoadingFile(false)
      }
    }
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

  // 发送用户输入
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
      const signal = abortControllerRef.current.signal;

      // 获取当前场景的所有文件内容
      const files = await getFileList(selectedSubScenario, signal);
      console.log('当前场景的所有文件:', files);

      // 获取所有文件的内容
      const fileContentsPromises = files.map(async (file: string) => {
        try {
          const content = await getFileContent(selectedSubScenario, file, signal);
          return { filename: file, content };
        } catch (error: any) {
          if (error.name !== 'AbortError') {
            console.error(`处理文件 ${file} 时出错:`, error);
          }
          return null;
        }
      });

      const fileContents = await Promise.all(fileContentsPromises);
      const validFileContents = fileContents.filter(content => content !== null) as { filename: string; content: string }[];
      
      if (validFileContents.length === 0) {
        throw new Error('未能成功读取任何文件内容');
      }

      // 发送AI请求
      const response = await sendChatRequest({
        scenarioId: selectedSubScenario,
        conversationHistory: updatedHistory,
        isMultiRound: true,
        fileContents: validFileContents,
        signal
      });
      
      setAiResponse(response);
      
      // 更新对话历史，添加AI回复
      setConversationHistory([
        ...updatedHistory,
        { role: 'assistant', content: response }
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

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-slate-950 to-blue-950 text-slate-100">
      <Header />

      <main className="min-h-screen flex bg-gray-950 p-2">
        <ScenarioSelector 
          selectedSubScenario={selectedSubScenario} 
          setSelectedSubScenario={setSelectedSubScenario}
          currentScenario={currentScenario}
          setCurrentScenario={setCurrentScenario}
          scenarios={scenarios}
          isCollapsed={isSidebarCollapsed}
          setFileList={setFileList}
          setIsFileListVisible={setIsFileListVisible}
          handleSubScenarioClick={handleSubScenarioClick}
          handleSubScenarioHover={handleSubScenarioHover}
        />
        
        {/* 折叠/展开按钮 */}
        <button
          onClick={toggleSidebar}
          className={`
            fixed left-0 top-1/2 transform -translate-y-1/2 z-10
            px-2 py-3 bg-gray-800 hover:bg-blue-700 text-white rounded-r-md
            transition-all duration-300 ease-in-out
            ${isSidebarCollapsed ? 'ml-0' : 'ml-[20%]'}
            flex flex-col items-center justify-center
            shadow-lg hover:shadow-xl
          `}
          style={{
            boxShadow: '4px 0 10px rgba(0, 0, 0, 0.2)',
            transform: `translateY(-50%)`,
          }}
          title={isSidebarCollapsed ? "展开场景选择面板" : "收起场景选择面板"}
        >
          <span className="text-lg">{isSidebarCollapsed ? '▶' : '◀'}</span>
          <span className="text-xs mt-1 whitespace-nowrap">
            {isSidebarCollapsed ? '展开' : '收起'}
          </span>
        </button>

        {/* 内容区域 */}
        <div 
          className={`
            flex-1 p-4 transition-all duration-300 ease-in-out
            ${isSidebarCollapsed ? 'ml-4' : 'ml-0'}
          `}
        >
          <div 
            className="rounded-lg overflow-hidden h-full border border-gray-700 shadow-2xl flex flex-col"
            style={{ 
              background: 'linear-gradient(135deg, #1e293b, #0f172a)',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5), inset 0 0 60px rgba(30, 64, 175, 0.1)'
            }}
          >
            {/* 顶部标题栏 */}
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
              <FileList 
                selectedSubScenario={selectedSubScenario}
                fileList={fileList}
                isFileListVisible={isFileListVisible}
                selectedFile={selectedFile}
                isLoadingFile={isLoadingFile}
                scenarioContent={scenarioContent}
                handleFileClick={handleFileClick}
              />
              
              {/* AI响应区域 */}
              <div id="ai-response-area" className={`${selectedSubScenario && fileList.length > 0 && isFileListVisible ? 'w-3/4' : 'w-full'} p-4 overflow-auto relative`}>
                {/* 添加文件列表切换按钮 */}
                {selectedSubScenario && fileList.length > 0 && (
                  <button 
                    onClick={() => setIsFileListVisible(prev => !prev)}
                    className="absolute top-2 left-4 z-10 bg-gray-700 hover:bg-gray-600 text-white text-xs px-3 py-1 rounded-full flex items-center shadow-md"
                  >
                    {isFileListVisible ? '隐藏文件列表' : '显示文件列表'} 
                    <span className="ml-1">{isFileListVisible ? '◀' : '▶'}</span>
                  </button>
                )}
                <ResponseDisplay 
                  scenarioId={selectedSubScenario || ''}
                  response={aiResponse} 
                  isResponding={isResponding}
                  conversationHistory={conversationHistory}
                />
              </div>
            </div>
            
            {/* 输入区 */}
            <InputSection
              userInput={userInput}
              setUserInput={setUserInput}
              isResponding={isResponding}
              isRecording={isRecording}
              toggleRecording={toggleRecording}
              sendUserInput={sendUserInput}
              clearConversation={clearConversation}
              conversationHistory={conversationHistory}
            />
          </div>
        </div>
      </main>

      {/* 动态背景装饰 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-500/5 to-purple-500/5"></div>
      </div>

      {/* 管理员链接 */}
      <div className="fixed bottom-2 right-2 text-xs text-gray-500">
        <Link href="/admin" className="hover:text-blue-500 transition-colors">管理员</Link>
      </div>
    </div>
  )
}

