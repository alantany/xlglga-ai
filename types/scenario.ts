export interface SubScenario {
  id: string;
  title: string;
  description: string;
}

export interface Scenario {
  id: number;
  title: string;
  description: string;
  subScenarios: SubScenario[];
} 