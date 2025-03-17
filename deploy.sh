#!/bin/bash

# 公安办案AI辅助系统部署脚本

echo "===== 公安办案AI辅助系统部署脚本 ====="
echo "正在检查环境..."

# 检查Node.js是否安装
if ! command -v node &> /dev/null; then
    echo "错误: 未找到Node.js，请先安装Node.js 18.0.0或更高版本"
    exit 1
fi

# 检查Node.js版本
NODE_VERSION=$(node -v | cut -d 'v' -f 2)
NODE_MAJOR_VERSION=$(echo $NODE_VERSION | cut -d '.' -f 1)
if [ $NODE_MAJOR_VERSION -lt 18 ]; then
    echo "错误: Node.js版本过低，当前版本: $NODE_VERSION，需要18.0.0或更高版本"
    exit 1
fi

echo "Node.js版本: $NODE_VERSION (符合要求)"

# 检查npm是否安装
if ! command -v npm &> /dev/null; then
    echo "错误: 未找到npm，请确保npm已正确安装"
    exit 1
fi

echo "npm已安装"

# 检查环境变量文件
if [ ! -f .env ]; then
    echo "警告: 未找到.env文件，正在创建模板..."
    cat > .env << EOL
# OpenRouter API配置
OPENROUTER_API_KEY=你的OpenRouter_API密钥
OPENROUTER_API_URL=https://openrouter.ai/api/v1
OPENROUTER_MODEL=deepseek/deepseek-r1:free
EOL
    echo "已创建.env模板文件，请编辑该文件并填入正确的API密钥"
    echo "请在编辑完成后重新运行此脚本"
    exit 1
fi

# 检查场景文件
SCENARIOS_DIR="data/scenarios"
if [ ! -d "$SCENARIOS_DIR" ]; then
    echo "错误: 未找到场景目录 $SCENARIOS_DIR"
    echo "正在创建场景目录..."
    mkdir -p "$SCENARIOS_DIR"
fi

# 检查场景文件是否存在
MISSING_SCENARIOS=false
for i in {1..6}; do
    if [ ! -f "$SCENARIOS_DIR/scenario$i.txt" ]; then
        echo "警告: 未找到场景文件 scenario$i.txt"
        MISSING_SCENARIOS=true
    fi
done

if [ "$MISSING_SCENARIOS" = true ]; then
    echo "请确保所有场景文件都存在于 $SCENARIOS_DIR 目录中"
    echo "继续安装依赖项..."
fi

# 安装依赖
echo "正在安装依赖项..."
npm install

# 构建项目
echo "正在构建项目..."
npm run build

if [ $? -ne 0 ]; then
    echo "错误: 项目构建失败"
    exit 1
fi

echo "项目构建成功"

# 启动项目
echo "是否要立即启动项目? (y/n)"
read -r START_PROJECT

if [ "$START_PROJECT" = "y" ] || [ "$START_PROJECT" = "Y" ]; then
    echo "正在启动项目..."
    npm run start
else
    echo "部署完成。您可以使用以下命令启动项目:"
    echo "  npm run start"
    echo "或在开发模式下启动:"
    echo "  npm run dev"
fi

echo "===== 部署脚本执行完毕 =====" 