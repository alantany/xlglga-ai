# 公安侦破全阶段AI分析场景数据

本目录包含公安侦破全阶段的案例材料，分为四个阶段：

1. **立案前材料**：包含被害人询问笔录，用于评估是否立案
2. **刑拘前材料**：包含被害人和犯罪嫌疑人询问笔录，用于评估是否刑事拘留
3. **报捕前材料**：包含犯罪嫌疑人讯问笔录，用于评估是否批准逮捕
4. **起诉前材料**：包含全部证据材料，用于评估是否起诉

## 文件转换说明

为了使系统能够正确读取所有材料，需要将docx/wps格式的文件转换为txt格式。我们提供了三种转换方式：

### 1. 使用Python脚本转换（推荐）

```bash
# 给脚本添加执行权限
chmod +x ../convert_docx_to_txt.py

# 运行转换脚本
python3 ../convert_docx_to_txt.py
```

### 2. 使用Shell脚本转换（Linux/macOS）

```bash
# 给脚本添加执行权限
chmod +x ../convert_docx_to_txt.sh

# 运行转换脚本
../convert_docx_to_txt.sh
```

### 3. 使用批处理脚本转换（Windows）

```
# 运行转换脚本
..\convert_docx_to_txt.bat
```

## 注意事项

1. 转换脚本会自动跳过已转换的文件，不会重复转换
2. Python脚本支持两种转换方式：
   - 使用pandoc（如果已安装）
   - 使用python-docx库（如果已安装）
3. 请确保转换后的txt文件使用UTF-8编码，避免中文显示乱码

## 场景文件说明

本目录已包含以下场景文件：

- scenario1.txt：对多名嫌疑人讯问笔录进行内容对比分析
- scenario2.txt：评估讯问笔录内容的准确性和一致性
- scenario3.txt：通过多轮交互深入分析复杂案情
- scenario4.txt：生成案件相关的任务关系图谱
- scenario5.txt：辅助生成规范的移送起诉意见书
- scenario6.txt：法院败诉案例分析
- scenario7.txt：立案前材料案件分析
- scenario8.txt：刑拘前材料证据分析
- scenario9.txt：报捕前材料法律分析
- scenario10.txt：起诉前材料证据审查 