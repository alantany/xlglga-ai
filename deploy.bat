@echo off
setlocal enabledelayedexpansion

echo ===== 公安办案AI辅助系统部署脚本 =====
echo 正在检查环境...

:: 检查Node.js是否安装
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo 错误: 未找到Node.js，请先安装Node.js 18.0.0或更高版本
    exit /b 1
)

:: 检查Node.js版本
for /f "tokens=1,2,3 delims=." %%a in ('node -v') do (
    set NODE_MAJOR=%%a
    set NODE_MAJOR=!NODE_MAJOR:~1!
)

if !NODE_MAJOR! lss 18 (
    echo 错误: Node.js版本过低，当前版本: !NODE_MAJOR!，需要18.0.0或更高版本
    exit /b 1
)

echo Node.js已安装 (符合要求)

:: 检查npm是否安装
where npm >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo 错误: 未找到npm，请确保npm已正确安装
    exit /b 1
)

echo npm已安装

:: 检查环境变量文件
if not exist .env (
    echo 警告: 未找到.env文件，正在创建模板...
    (
        echo # OpenRouter API配置
        echo OPENROUTER_API_KEY=你的OpenRouter_API密钥
        echo OPENROUTER_API_URL=https://openrouter.ai/api/v1
        echo OPENROUTER_MODEL=deepseek/deepseek-r1:free
    ) > .env
    echo 已创建.env模板文件，请编辑该文件并填入正确的API密钥
    echo 请在编辑完成后重新运行此脚本
    exit /b 1
)

:: 检查场景文件
set SCENARIOS_DIR=data\scenarios
if not exist %SCENARIOS_DIR% (
    echo 错误: 未找到场景目录 %SCENARIOS_DIR%
    echo 正在创建场景目录...
    mkdir %SCENARIOS_DIR%
)

:: 检查场景文件是否存在
set MISSING_SCENARIOS=false
for /l %%i in (1, 1, 6) do (
    if not exist "%SCENARIOS_DIR%\scenario%%i.txt" (
        echo 警告: 未找到场景文件 scenario%%i.txt
        set MISSING_SCENARIOS=true
    )
)

if "%MISSING_SCENARIOS%"=="true" (
    echo 请确保所有场景文件都存在于 %SCENARIOS_DIR% 目录中
    echo 继续安装依赖项...
)

:: 安装依赖
echo 正在安装依赖项...
call npm install

:: 构建项目
echo 正在构建项目...
call npm run build

if %ERRORLEVEL% neq 0 (
    echo 错误: 项目构建失败
    exit /b 1
)

echo 项目构建成功

:: 启动项目
set /p START_PROJECT=是否要立即启动项目? (y/n): 

if /i "%START_PROJECT%"=="y" (
    echo 正在启动项目...
    call npm run start
) else (
    echo 部署完成。您可以使用以下命令启动项目:
    echo   npm run start
    echo 或在开发模式下启动:
    echo   npm run dev
)

echo ===== 部署脚本执行完毕 ===== 