import { useRef } from "react";

interface FileListProps {
  selectedSubScenario: string | null;
  fileList: string[];
  isFileListVisible: boolean;
  selectedFile: string | null;
  isLoadingFile: boolean;
  scenarioContent: string;
  handleFileClick: (file: string) => void;
}

export default function FileList({
  selectedSubScenario,
  fileList,
  isFileListVisible,
  selectedFile,
  isLoadingFile,
  scenarioContent,
  handleFileClick
}: FileListProps) {
  const fileListRef = useRef<HTMLDivElement>(null);

  if (!selectedSubScenario || fileList.length === 0 || !isFileListVisible) {
    return null;
  }

  return (
    <div ref={fileListRef} className="w-1/4 border-r border-gray-700 bg-gray-900 overflow-y-auto">
      <div className="p-3">
        <h3 className="text-base font-semibold mb-3 sticky top-0 bg-gray-900 py-1 text-blue-300">
          文件列表 ({fileList.length})
        </h3>
        <div className="space-y-1">
          {fileList.map((file, fileIndex) => (
            <div key={fileIndex} className="cursor-pointer">
              <div
                className={`p-1.5 rounded hover:bg-gray-700 text-sm ${
                  selectedFile === file ? 'bg-gray-700' : ''
                }`}
                onClick={() => handleFileClick(file)}
              >
                {file}
              </div>
              {selectedFile === file && (
                <div className="mt-1.5 p-1.5 bg-gray-800 rounded max-h-[250px] overflow-y-auto">
                  {isLoadingFile ? (
                    <div className="flex justify-center items-center p-2 text-blue-400 text-sm">
                      <div className="animate-pulse">加载文件内容中...</div>
                    </div>
                  ) : (
                    <pre className="text-xs whitespace-pre-wrap">
                      {scenarioContent || "无文件内容"}
                    </pre>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 