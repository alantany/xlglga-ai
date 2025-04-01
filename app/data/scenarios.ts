import { Scenario } from "@/types/scenario";
import scenariosConfig from './scenarios-config.json';

// 将JSON配置转换为应用所需的场景格式
export const scenarios: Scenario[] = scenariosConfig.scenarioCategories.map(category => ({
  id: category.id,
  title: category.title,
  description: category.description,
  subScenarios: category.subScenarios.map(sub => ({
    id: sub.id,
    title: sub.title,
    description: sub.description
  }))
})); 