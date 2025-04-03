declare module 'react-graph-vis' {
  import { Component } from 'react';
  
  export interface GraphData {
    nodes: Array<{
      id: string;
      label?: string;
      title?: string;
      color?: string | { background?: string; border?: string };
      shape?: string;
      image?: string;
      group?: string;
      [key: string]: any;
    }>;
    edges: Array<{
      from: string;
      to: string;
      label?: string;
      color?: string | { color?: string; highlight?: string; hover?: string };
      arrows?: string | { to?: boolean; from?: boolean };
      dashes?: boolean;
      [key: string]: any;
    }>;
  }

  export interface GraphEvents {
    click?: (params: any) => void;
    doubleClick?: (params: any) => void;
    hoverNode?: (params: any) => void;
    blurNode?: (params: any) => void;
    hoverEdge?: (params: any) => void;
    blurEdge?: (params: any) => void;
    dragStart?: (params: any) => void;
    dragging?: (params: any) => void;
    dragEnd?: (params: any) => void;
    selectNode?: (params: any) => void;
    selectEdge?: (params: any) => void;
    deselectNode?: (params: any) => void;
    deselectEdge?: (params: any) => void;
    select?: (params: any) => void;
    [key: string]: ((params: any) => void) | undefined;
  }

  export interface GraphOptions {
    nodes?: any;
    edges?: any;
    layout?: any;
    interaction?: any;
    manipulation?: any;
    physics?: any;
    groups?: any;
    height?: string;
    width?: string;
    [key: string]: any;
  }

  export interface NetworkGraphProps {
    graph: GraphData;
    options?: GraphOptions;
    events?: GraphEvents;
    style?: React.CSSProperties;
    getNetwork?: (network: any) => void;
    getNodes?: (nodes: any) => void;
    getEdges?: (edges: any) => void;
  }

  export default class Network extends Component<NetworkGraphProps> {}
} 