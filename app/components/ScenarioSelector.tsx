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
  handleSubScenarioHover
}: ScenarioSelectorProps) {
  const subScenarioRef = useRef<HTMLDivElement>(null);

  return (
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
  );
} 