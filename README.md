# 公安办案AI辅助系统

## 项目概述

公安办案AI辅助系统是一个专为公安部门设计的智能辅助工具，旨在通过大模型AI技术提升案件分析、文书处理和法律咨询的效率与质量。系统支持多种办案场景，包括讯问笔录分析、案件关系图谱构建、复杂案情深入分析等，并提供多轮对话功能，使办案人员能够与AI进行深入交流，获取专业建议。

## 功能特点

### 1. 多场景支持
- **讯问笔录分析**：对比多名嫌疑人的讯问笔录，发现矛盾点和关键信息
- **笔录质量评估**：评估讯问笔录的准确性和一致性
- **复杂案情分析**：通过多轮交互深入分析复杂案情
- **关系图谱生成**：构建案件相关的人物关系图谱
- **法律文书辅助**：辅助生成规范的移送起诉意见书等法律文书

### 2. 交互功能
- **多轮对话**：支持与AI进行连续对话，深入探讨案件细节
- **语音输入**：支持语音识别，便于快速输入问题
- **打字机效果**：AI回答以打字机效果呈现，提升用户体验
- **对话历史**：保存完整对话历史，便于回顾和参考

### 3. 用户界面
- **现代化界面**：采用现代化设计，界面美观直观
- **场景选择**：提供多种预设场景，一键切换
- **悬停提示**：鼠标悬停显示场景详情，便于快速了解
- **响应式设计**：适配不同屏幕尺寸，支持大屏展示

## 技术栈

- **前端框架**：Next.js 15.1.0 (React)
- **样式**：Tailwind CSS
- **UI组件**：自定义组件 + Lucide React 图标
- **API**：Next.js API Routes
- **AI模型**：DeepSeek-R1 (通过OpenRouter API)
- **语音识别**：Web Speech API
- **部署**：可部署在任何支持Node.js的环境

## 部署步骤

### 方法一：使用自动部署脚本（推荐）

项目提供了自动部署脚本，可以简化部署过程：

#### Linux/macOS 用户：

```bash
# 赋予脚本执行权限
chmod +x deploy.sh

# 运行部署脚本
./deploy.sh
```

#### Windows 用户：

```bash
# 运行部署脚本
deploy.bat
```

部署脚本会自动：
- 检查环境依赖（Node.js、npm）
- 创建必要的配置文件模板
- 检查场景文件是否存在
- 安装依赖项
- 构建项目
- 提供启动选项

### 方法二：手动部署

#### 前提条件

- Node.js 18.0.0 或更高版本
- npm 或 yarn 包管理器
- OpenRouter API 密钥 (用于访问DeepSeek模型)

#### 1. 克隆项目

```bash
git clone <项目仓库URL>
cd 公安DS项目
```

#### 2. 安装依赖

```bash
npm install
# 或
yarn install
```

#### 3. 配置环境变量

创建 `.env` 文件，添加以下内容：

```
OPENROUTER_API_KEY=你的OpenRouter_API密钥
OPENROUTER_API_URL=https://openrouter.ai/api/v1
OPENROUTER_MODEL=deepseek/deepseek-r1:free
```

#### 4. 准备场景数据

确保 `data/scenarios/` 目录下包含所有场景文件：
- scenario1.txt
- scenario2.txt
- scenario3.txt
- scenario4.txt
- scenario5.txt
- scenario6.txt

#### 5. 构建和启动项目

开发环境：

```bash
npm run dev
# 或
yarn dev
```

生产环境：

```bash
npm run build
npm run start
# 或
yarn build
yarn start
```

#### 6. 访问系统

开发环境默认访问地址：http://localhost:3000

## 使用说明

1. **选择场景**：在左侧面板选择需要分析的场景
2. **开始对话**：点击"开始回答"按钮，AI将根据选定场景生成初始回答
3. **继续对话**：
   - 在文本框中输入问题，或点击麦克风图标使用语音输入
   - 点击"发送问题"按钮将问题发送给AI
4. **查看场景详情**：将鼠标悬停在场景按钮上可查看场景详细描述
5. **停止生成**：如需停止AI回答生成，点击"停止回答"按钮

## 系统架构

### 前端组件
- `app/page.tsx`：主页面组件，包含场景选择和对话功能
- `components/response-display.tsx`：AI回答显示组件，实现打字机效果和对话历史展示

### 后端API
- `app/api/chat/route.ts`：处理与AI模型的通信
- `app/api/scenario-content/route.ts`：提供场景内容
- `lib/openrouter.ts`：封装与OpenRouter API的交互逻辑

## 常见问题解答

### 1. 语音识别不工作
- 确保您的浏览器支持Web Speech API（Chrome、Edge、Safari等现代浏览器支持）
- 确保您已授予浏览器麦克风访问权限
- 检查您的麦克风是否正常工作

### 2. AI回答生成速度慢
- 检查您的网络连接
- 确保OpenRouter API密钥有效且有足够的配额
- 大型复杂问题可能需要更长的处理时间

### 3. 场景内容无法加载
- 确保场景文件存在于正确的目录中
- 检查文件编码是否为UTF-8
- 重启开发服务器

## 注意事项

- 确保OpenRouter API密钥有效且有足够的配额
- 语音识别功能需要浏览器支持Web Speech API
- 系统设计适合在大屏幕上展示，效果最佳

## 许可证

[添加许可证信息]

## 联系方式

[添加联系方式] 