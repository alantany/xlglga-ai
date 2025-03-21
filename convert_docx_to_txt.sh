#!/bin/bash

# 转换脚本：将所有docx和wps文件转换为txt文件
# 作者：AI辅助系统

echo "====== 开始转换文档 ======"
echo "注意：此脚本需要安装pandoc"

# 检查是否安装了pandoc
if ! command -v pandoc &> /dev/null; then
    echo "错误：未安装pandoc！"
    echo "请先安装pandoc，在Ubuntu/Debian上可以使用："
    echo "sudo apt-get install pandoc"
    echo "在macOS上可以使用："
    echo "brew install pandoc"
    exit 1
fi

# 定义所有阶段目录
STAGE_DIRS=(
    "data/scenarios/1、立案前材料"
    "data/scenarios/2、刑拘前材料"
    "data/scenarios/3、报捕前材料"
    "data/scenarios/4、起诉前材料"
)

# 转换函数
convert_file() {
    local file="$1"
    local output="${file%.*}.txt"
    
    # 跳过已经存在的txt文件
    if [ -f "$output" ]; then
        echo "已存在，跳过: $output"
        return
    fi
    
    # 检查文件扩展名
    if [[ "$file" == *.docx ]]; then
        echo "转换: $file -> $output"
        pandoc "$file" -o "$output"
    elif [[ "$file" == *.wps ]]; then
        echo "尝试转换WPS文件: $file -> $output"
        pandoc "$file" -o "$output"
    fi
}

# 处理所有目录
for dir in "${STAGE_DIRS[@]}"; do
    echo "处理目录: $dir"
    
    # 确保目录存在
    if [ ! -d "$dir" ]; then
        echo "警告：目录不存在: $dir"
        continue
    fi
    
    # 处理目录中的所有docx和wps文件
    find "$dir" -type f \( -name "*.docx" -o -name "*.wps" \) | while read file; do
        convert_file "$file"
    done
done

echo "====== 文档转换完成 ======" 