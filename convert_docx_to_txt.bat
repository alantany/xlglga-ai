@echo off
setlocal enabledelayedexpansion

echo ====== 开始转换文档 ======
echo 注意：此脚本需要安装pandoc

:: 检查是否安装了pandoc
where pandoc >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo 错误：未安装pandoc！
    echo 请先安装pandoc，可以从 https://pandoc.org/installing.html 下载
    echo 安装后确保将pandoc添加到PATH环境变量中
    exit /b 1
)

:: 定义所有阶段目录
set "STAGE_DIRS=data\scenarios\1、立案前材料 data\scenarios\2、刑拘前材料 data\scenarios\3、报捕前材料 data\scenarios\4、起诉前材料"

:: 处理所有目录
for %%d in (%STAGE_DIRS%) do (
    echo 处理目录: %%d
    
    :: 确保目录存在
    if not exist "%%d" (
        echo 警告：目录不存在: %%d
        goto :continue
    )
    
    :: 处理目录中的所有docx和wps文件
    for %%f in ("%%d\*.docx" "%%d\*.wps") do (
        :: 检查文件是否存在（通配符可能不匹配任何文件）
        if exist "%%f" (
            :: 获取输出文件名（替换扩展名为.txt）
            set "output=%%~dpnf.txt"
            
            :: 跳过已经存在的txt文件
            if exist "!output!" (
                echo 已存在，跳过: !output!
            ) else (
                echo 转换: %%f -^> !output!
                pandoc "%%f" -o "!output!"
            )
        )
    )
    
    :continue
)

echo ====== 文档转换完成 ====== 