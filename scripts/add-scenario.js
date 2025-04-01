const fs = require('fs');
const path = require('path');
const readline = require('readline');

// 创建readline接口
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// 配置文件路径
const configPath = path.join(__dirname, '../app/data/scenarios-config.json');

// 加载当前配置
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

// 获取当前最大ID
const getMaxId = () => {
  return Math.max(...config.scenarioCategories.map(category => category.id), 0);
};

// 提示用户输入
const question = (query) => new Promise(resolve => rl.question(query, resolve));

// 添加新的主场景
const addMainScenario = async () => {
  console.log('\n==== 添加新场景 ====');
  
  const title = await question('请输入场景标题: ');
  const description = await question('请输入场景描述: ');
  const baseDirectory = await question('请输入场景基础目录名称: ');

  const newId = getMaxId() + 1;
  
  const newScenario = {
    id: newId,
    title,
    description,
    baseDirectory,
    subScenarios: []
  };

  // 添加子场景
  let addMore = true;
  while (addMore) {
    await addSubScenario(newScenario);
    
    const answer = await question('是否继续添加子场景? (y/n): ');
    addMore = answer.toLowerCase() === 'y';
  }
  
  // 添加到配置中
  config.scenarioCategories.push(newScenario);
  
  // 保存配置
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
  
  console.log(`\n✅ 场景 "${title}" 已添加到配置文件`);
  console.log('现在你可以运行 node scripts/create-scenario-dirs.js 来创建对应的目录结构');
  
  rl.close();
};

// 添加子场景
const addSubScenario = async (mainScenario) => {
  console.log(`\n-- 添加 "${mainScenario.title}" 的子场景 --`);
  
  const title = await question('请输入子场景标题: ');
  const description = await question('请输入子场景描述: ');
  const directory = await question('请输入子场景目录名称: ');
  
  // 生成ID
  const idPrefix = mainScenario.title.match(/[\u4e00-\u9fa5]+/) ? 
                  pinyin(mainScenario.title).substring(0, 8) : 
                  mainScenario.title.toLowerCase().substring(0, 8);
                  
  const idSuffix = mainScenario.subScenarios.length + 1;
  const id = `${idPrefix}_${idSuffix}`;
  
  const subScenario = {
    id,
    title,
    description,
    directory
  };
  
  mainScenario.subScenarios.push(subScenario);
  console.log(`✅ 子场景 "${title}" 已添加`);
  return subScenario;
};

// 简单的拼音转换函数 (实际使用中可能需要更完善的库)
function pinyin(chinese) {
  // 这里只是一个简单示例，实际应用中应该使用专业的拼音转换库
  return chinese.replace(/[\u4e00-\u9fa5]/g, char => {
    // 简单映射一些常见字的拼音
    const map = {
      '刑': 'xing',
      '事': 'shi',
      '交': 'jiao',
      '通': 'tong',
      '治': 'zhi',
      '安': 'an',
      '福': 'fu',
      '尔': 'er',
      '摩': 'mo',
      '斯': 'si',
      '关': 'guan',
      '系': 'xi',
      '图': 'tu',
      '谱': 'pu',
      // 可以根据需要扩展
    };
    return map[char] || 'x';
  }).replace(/\s/g, '');
}

// 主函数
async function main() {
  console.log('================================================');
  console.log('欢迎使用场景添加工具');
  console.log('此工具将帮助你向配置文件添加新的场景');
  console.log('================================================\n');

  await addMainScenario();
}

// 运行主函数
main().catch(error => {
  console.error('发生错误:', error);
  rl.close();
}); 