const fs = require('fs');
const path = require('path');

// 读取配置文件
const configPath = path.join(__dirname, '../app/data/scenarios-config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

// 基础数据目录
const baseDir = path.join(__dirname, '../data/scenarios');

// 确保基础目录存在
if (!fs.existsSync(baseDir)) {
  fs.mkdirSync(baseDir, { recursive: true });
}

// 创建场景目录
config.scenarioCategories.forEach(category => {
  // 创建主场景目录
  const categoryPath = path.join(baseDir, category.baseDirectory);
  if (!fs.existsSync(categoryPath)) {
    fs.mkdirSync(categoryPath, { recursive: true });
    console.log(`✅ 创建主场景目录: ${category.baseDirectory}`);
  } else {
    console.log(`⏭️ 主场景目录已存在: ${category.baseDirectory}`);
  }

  // 创建子场景目录
  category.subScenarios.forEach(subScenario => {
    const subScenarioPath = path.join(categoryPath, subScenario.directory);
    if (!fs.existsSync(subScenarioPath)) {
      fs.mkdirSync(subScenarioPath, { recursive: true });
      console.log(`  ✅ 创建子场景目录: ${category.baseDirectory}/${subScenario.directory}`);
    } else {
      console.log(`  ⏭️ 子场景目录已存在: ${category.baseDirectory}/${subScenario.directory}`);
    }
  });
});

console.log('\n✨ 所有场景目录创建完成!');
console.log('如需添加新场景：');
console.log('1. 编辑 app/data/scenarios-config.json 文件');
console.log('2. 运行 node scripts/create-scenario-dirs.js 创建对应目录');
console.log('3. 将相关案例文件复制到对应目录中'); 