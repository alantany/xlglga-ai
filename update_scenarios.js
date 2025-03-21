#!/usr/bin/env node

/**
 * 更新app/page.tsx中的场景选项
 * 作者：AI辅助系统
 */

const fs = require('fs');
const path = require('path');

// 定义新场景
const newScenarios = [
  {
    id: 7,
    title: "立案前材料案件分析",
    description: "分析立案前收集的被害人询问笔录，帮助确定是否立案以及确定案件性质。"
  },
  {
    id: 8, 
    title: "刑拘前材料证据分析",
    description: "分析刑拘前收集的被害人询问笔录和犯罪嫌疑人询问笔录，评估是否符合刑事拘留条件。"
  },
  {
    id: 9,
    title: "报捕前材料法律分析",
    description: "分析报捕前收集的嫌疑人讯问笔录和其他证据，评估是否符合逮捕条件并提供法律依据。"
  },
  {
    id: 10,
    title: "起诉前材料证据审查",
    description: "分析起诉前的全部材料，包括鉴定报告、认定犯罪事实的证据和嫌疑人讯问笔录，评估是否符合起诉条件。"
  }
];

// 读取app/page.tsx文件
const pageFilePath = path.join(process.cwd(), 'app', 'page.tsx');

try {
  console.log('正在读取app/page.tsx文件...');
  let content = fs.readFileSync(pageFilePath, 'utf8');
  
  // 找到场景数组定义的位置
  const scenariosPattern = /const\s+scenarios\s*=\s*\[([\s\S]*?)\]\s*$/m;
  const scenariosMatch = content.match(scenariosPattern);
  
  if (!scenariosMatch) {
    console.error('无法找到scenarios数组定义！');
    process.exit(1);
  }
  
  // 解析现有场景
  const existingScenarios = scenariosMatch[1]
    .trim()
    .split(/},\s*{/)
    .map(scenarioStr => {
      return scenarioStr.replace(/^\s*{/, '{').replace(/}\s*$/, '}');
    });
  
  // 检查现有场景的数量
  console.log(`找到${existingScenarios.length}个现有场景`);
  
  // 准备新场景的字符串表示
  const newScenariosStr = newScenarios.map(scenario => {
    return `    {
      id: ${scenario.id},
      title: "${scenario.title}",
      description: "${scenario.description}"
    }`;
  }).join(',\n');
  
  // 更新场景数组
  const lastExistingScenario = existingScenarios[existingScenarios.length - 1];
  const updatedScenariosStr = scenariosMatch[1] + ',\n' + newScenariosStr;
  
  // 替换content中的场景数组
  const updatedContent = content.replace(scenariosPattern, `const scenarios = [\n${updatedScenariosStr}\n  ]`);
  
  // 写入更新后的文件
  fs.writeFileSync(pageFilePath, updatedContent, 'utf8');
  console.log('成功更新app/page.tsx文件，添加了新的场景选项！');
  
} catch (error) {
  console.error('更新场景选项时出错:', error);
  process.exit(1);
} 