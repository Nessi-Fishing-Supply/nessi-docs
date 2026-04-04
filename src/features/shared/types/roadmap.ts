export interface RoadmapItem {
  title: string;
  number: number;
  url: string;
  state: string;
  labels: string[];
  status?: string;
  priority?: string;
  area?: string;
  executor?: string;
  feature?: string;
}
