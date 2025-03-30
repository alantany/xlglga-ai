import { Scenario } from "@/types/scenario";

export const scenarios: Scenario[] = [
  {
    id: 1,
    title: "刑事案件",
    description: "刑事案件材料分析与研判",
    subScenarios: [
      {
        id: "criminal_1",
        title: "立案前阶段",
        description: "分析案件立案前的相关材料"
      },
      {
        id: "criminal_2", 
        title: "刑拘前阶段",
        description: "分析案件刑事拘留前的相关材料"
      },
      {
        id: "criminal_3",
        title: "报捕前阶段",
        description: "分析案件报请逮捕前的相关材料"
      },
      {
        id: "criminal_4",
        title: "起诉前阶段", 
        description: "分析案件移送起诉前的相关材料"
      }
    ]
  },
  {
    id: 2,
    title: "交通案件",
    description: "交通事故案件材料分析",
    subScenarios: [
      {
        id: "traffic_1",
        title: "交通事故材料",
        description: "分析交通事故现场勘验笔录、询问笔录等材料，研判事故责任"
      }
    ]
  },
  {
    id: 3,
    title: "治安案件",
    description: "治安案件材料分析",
    subScenarios: [
      {
        id: "civil_1",
        title: "故意伤害案件",
        description: "分析故意伤害案件相关材料"
      }
    ]
  }
]; 