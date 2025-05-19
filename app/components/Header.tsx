export default function Header() {
  return (
    <header className="p-6 border-b border-blue-900/30 relative">
      {/* Logo放置在左上角 */}
      <div className="absolute top-4 left-6">
        <img src="/images/gajlogo.png" alt="锡林郭勒盟公安局logo" className="h-12 w-auto" />
      </div>
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-center items-center">
          <div className="flex flex-col items-center">
            <h1 className="text-5xl font-bold text-white text-center">
              <div>公安办案</div>
              <div className="mt-2">AI辅助分析系统</div>
            </h1>
            <div className="text-emerald-400 mt-2 text-lg">北京联通</div>
          </div>
        </div>
      </div>
    </header>
  );
} 