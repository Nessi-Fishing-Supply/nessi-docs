export interface ArchNode {
  id: string;
  label: string;
  sublabel?: string;
  icon?: string;
  url?: string;
  tooltip?: string;
}

export interface ArchLayer {
  id: string;
  label: string;
  color?: string;
  nodes: ArchNode[];
}

export interface ArchConnection {
  from: string;
  to: string;
  label?: string;
  style?: 'solid' | 'dashed';
}

export interface ArchDiagram {
  slug: string;
  category: 'stack' | 'flow' | 'pipeline';
  title: string;
  description: string;
  layers: ArchLayer[];
  connections: ArchConnection[];
}
