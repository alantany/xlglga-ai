import { useState, useRef } from "react";
import { Scenario, SubScenario } from "@/types/scenario";

interface ScenarioSelectorProps {
  scenarios: Scenario[];
  currentScenario: number | null;
  setCurrentScenario: (index: number | null) => void;
  selectedSubScenario: string | null;
  setSelectedSubScenario: (id: string | null) => void;
  setFileList: (files: string[]) => void;
  setIsFileListVisible: (visible: boolean) => void;
  handleSubScenarioClick: (subScenarioId: string) => void;
  handleSubScenarioHover: (show: boolean, event?: React.MouseEvent) => void;
  isCollapsed?: boolean;
}

export default function ScenarioSelector({
  scenarios,
  currentScenario,
  setCurrentScenario,
  selectedSubScenario,
  setSelectedSubScenario,
  setFileList,
  setIsFileListVisible,
  handleSubScenarioClick,
  handleSubScenarioHover,
  isCollapsed = false
}: ScenarioSelectorProps) {
  const subScenarioRef = useRef<HTMLDivElement>(null);

  // 折叠时显示的简化视图
  if (isCollapsed) {
    return (
      <div className="w-0 overflow-hidden flex-shrink-0 opacity-0 transition-all duration-300 ease-in-out">
        {/* 保留DOM结构但不显示，这样可以保持平滑过渡 */}
        <div className="invisible">
          <div className="grid gap-4">
            {scenarios.map((scenario, index) => (
              <div key={scenario.id} className="space-y-2">
                <div className="font-bold text-blue-300 uppercase tracking-wider pl-1 mb-3 py-1">
                  <span className="text-xl">{scenario.title}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // 正常显示的完整视图
  return (
    <div 
      id="left-menu" 
      className="w-1/5 bg-gray-900 p-4 h-full flex flex-col transition-all duration-300 ease-in-out overflow-auto border-r border-gray-800 rounded-lg shadow-lg"
      style={{ boxShadow: '0 0 15px rgba(0, 0, 0, 0.2)' }}
    >
      <div className="grid gap-4 relative">
        {/* 头部标题 */}
        <div className="sticky top-0 bg-gray-900 pb-2 pt-1 z-10">
          <h2 className="text-emerald-400 text-xl font-bold flex items-center">
            <span className="mr-2">📁</span>
            案件场景选择
          </h2>
          <div className="h-px bg-gradient-to-r from-transparent via-blue-500 to-transparent mt-2" />
        </div>
        
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
              <span className="text-xl">{scenario.title}</span>
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
                <div 
                  ref={index === 0 ? subScenarioRef : null} 
                  className="grid gap-2 pl-2"
                >
                  {scenario.subScenarios.map((subScenario) => (
                    <div
                      key={subScenario.id}
                      className={`
                        p-3 rounded-lg cursor-pointer transition-all duration-200
                        ${selectedSubScenario === subScenario.id 
                          ? 'bg-gradient-to-r from-blue-900 to-blue-800 shadow-lg transform scale-105 border-l-4 border-blue-400' 
                          : 'hover:bg-gray-800 border-l-2 border-transparent'}
                      `}
                      onClick={() => handleSubScenarioClick(subScenario.id)}
                    >
                      <div className="flex items-center">
                        <div className={`w-2 h-2 rounded-full mr-2 ${selectedSubScenario === subScenario.id ? 'bg-blue-400' : 'bg-gray-600'}`}></div>
                        <div className="font-medium text-gray-100">{subScenario.title}</div>
                      </div>
                      <div className="mt-1 text-xs text-gray-400 pl-4">{subScenario.description}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
} 