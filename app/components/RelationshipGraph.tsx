"use client";

import React, { useEffect, useState, useRef } from "react";

// 测试组件
export function TestComponent() {
  console.log("⭐️ 测试组件被渲染");
  return (
    <div className="bg-blue-100 p-4 rounded my-4">
      <h3 className="font-bold">关系图测试组件</h3>
      <p>如果你能看到这段文字，说明组件渲染正常。</p>
    </div>
  );
}

// 原始数据接口
interface SourceGraphData {
  nodes: Array<{
    id: string;
    label: string;
    group: string;
  }>;
  links: Array<{
    source: string;
    target: string;
    relation: string;
  }>;
}

// 新增拖拽状态接口
interface DragState {
  isDragging: boolean;
  nodeId: string | null;
  offset: { x: number; y: number };
}

export default function RelationshipGraph() {
  console.log("⭐️ RelationshipGraph组件被渲染");
  const [graphData, setGraphData] = useState<SourceGraphData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hoveredLink, setHoveredLink] = useState<number | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [scale, setScale] = useState(1); // 缩放比例
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    nodeId: null,
    offset: { x: 0, y: 0 }
  });
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const nodePositionsRef = useRef<Record<string, {x: number, y: number}>>({});
  
  // 添加浏览器环境检测
  useEffect(() => {
    console.log("⭐️ 浏览器环境:", typeof window !== 'undefined' ? '可用' : '不可用');
    console.log("⭐️ 当前容器宽度:", containerRef.current?.clientWidth);
    console.log("⭐️ 文档可见性状态:", document?.visibilityState);
  }, []);

  useEffect(() => {
    console.log("⭐️ RelationshipGraph组件已加载 - useEffect执行");
    
    async function fetchGraphData() {
      try {
        console.log("⭐️ 正在获取图谱数据...");
        const response = await fetch("/docs/graph.json");
        if (!response.ok) {
          throw new Error(`获取图谱数据失败: ${response.status}`);
        }
        const data = await response.json() as SourceGraphData;
        console.log("⭐️ 图谱数据获取成功:", data);
        setGraphData(data);
      } catch (error) {
        console.error("⭐️ 加载图谱数据时出错:", error);
        setError(error instanceof Error ? error.message : "未知错误");
      } finally {
        setIsLoading(false);
      }
    }

    fetchGraphData();
    
    // 添加鼠标移动和抬起事件监听器用于拖拽功能
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    // 添加窗口大小变化监听器，用于重新绘制图谱
    window.addEventListener('resize', handleResize);
    
    // 添加可见性变化监听器，用于处理标签页切换
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // 组件卸载时清理事件监听器
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);
  
  // 处理窗口大小变化，重新渲染图谱
  const handleResize = () => {
    console.log("⭐️ 窗口大小变化，容器宽度:", containerRef.current?.clientWidth);
    if (graphData && containerRef.current) {
      // 延迟重新渲染，确保DOM已更新
      setTimeout(() => {
        renderGraph(graphData);
      }, 300);
    }
  };
  
  // 处理文档可见性变化
  const handleVisibilityChange = () => {
    console.log("⭐️ 文档可见性变化:", document.visibilityState);
    if (document.visibilityState === 'visible' && graphData && containerRef.current) {
      // 当标签页变为可见时，重新渲染图谱
      setTimeout(() => {
        renderGraph(graphData);
      }, 300);
    }
  };
  
  // 提取渲染图谱的逻辑为单独函数，便于重用
  const renderGraph = (data: SourceGraphData) => {
    if (!svgRef.current || !containerRef.current) return;
    
    console.log("⭐️ 开始渲染图谱，容器宽度:", containerRef.current.clientWidth);

    // 获取容器尺寸
    const containerWidth = containerRef.current.clientWidth || 600; // 提供默认值
    const containerHeight = 600; // 固定高度
    
    // 清除之前的内容
    while (svgRef.current.firstChild) {
      svgRef.current.removeChild(svgRef.current.firstChild);
    }
    
    // 创建SVG元素
    const svg = svgRef.current;
    
    // 添加白色背景作为整个SVG的底层
    const background = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    background.setAttribute("width", String(containerWidth));
    background.setAttribute("height", String(containerHeight));
    background.setAttribute("fill", "white");
    svg.appendChild(background);
    
    // 创建分组以便后续操作
    const linksGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    const nodesGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    linksGroup.setAttribute("class", "links-group");
    nodesGroup.setAttribute("class", "nodes-group");
    svg.appendChild(linksGroup);
    svg.appendChild(nodesGroup);
    
    // 计算节点布局 - 采用环形布局提高空间利用率
    const nodePositions: Record<string, {x: number, y: number}> = {};
    
    // 官员节点放在上半圆
    const officialNodes = data.nodes.filter(node => node.group === "官员");
    const centerX = containerWidth / 2;
    const centerY = containerHeight / 2 - 50; // 稍微上移中心点
    const officialRadius = Math.min(containerWidth, containerHeight * 1.5) * 0.35;
    
    officialNodes.forEach((node, index) => {
      // 计算在圆上的角度，分布在180度范围内
      const angle = (Math.PI / (officialNodes.length + 1)) * (index + 1);
      nodePositions[node.id] = {
        x: centerX + officialRadius * Math.sin(angle),
        y: centerY - officialRadius * Math.cos(angle)
      };
    });
    
    // 企业节点放在下半圆
    const businessNodes = data.nodes.filter(node => node.group === "企业");
    const businessRadius = Math.min(containerWidth, containerHeight * 1.5) * 0.35;
    
    businessNodes.forEach((node, index) => {
      // 计算在圆上的角度，分布在180度范围内
      const angle = (Math.PI / (businessNodes.length + 1)) * (index + 1) + Math.PI;
      nodePositions[node.id] = {
        x: centerX + businessRadius * Math.sin(angle),
        y: centerY - businessRadius * Math.cos(angle)
      };
    });
    
    // 保存节点位置供拖拽使用
    nodePositionsRef.current = nodePositions;
    
    // 创建箭头标记
    const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
    const marker = document.createElementNS("http://www.w3.org/2000/svg", "marker");
    marker.setAttribute("id", "arrowhead");
    marker.setAttribute("markerWidth", "8");
    marker.setAttribute("markerHeight", "6");
    marker.setAttribute("refX", "7");
    marker.setAttribute("refY", "3");
    marker.setAttribute("orient", "auto");
    
    const arrowPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
    arrowPath.setAttribute("d", "M0,0 L8,3 L0,6 Z");
    arrowPath.setAttribute("fill", "#64748b");
    
    marker.appendChild(arrowPath);
    defs.appendChild(marker);
    
    // 创建节点阴影滤镜
    const nodeShadow = document.createElementNS("http://www.w3.org/2000/svg", "filter");
    nodeShadow.setAttribute("id", "node-shadow");
    nodeShadow.setAttribute("x", "-50%");
    nodeShadow.setAttribute("y", "-50%");
    nodeShadow.setAttribute("width", "200%");
    nodeShadow.setAttribute("height", "200%");
    
    const feDropShadow = document.createElementNS("http://www.w3.org/2000/svg", "feDropShadow");
    feDropShadow.setAttribute("dx", "0");
    feDropShadow.setAttribute("dy", "2");
    feDropShadow.setAttribute("stdDeviation", "3");
    feDropShadow.setAttribute("flood-color", "rgba(0, 0, 0, 0.35)");
    feDropShadow.setAttribute("flood-opacity", "0.8");
    
    nodeShadow.appendChild(feDropShadow);
    defs.appendChild(nodeShadow);
    
    // 创建高亮效果滤镜
    const glowFilter = document.createElementNS("http://www.w3.org/2000/svg", "filter");
    glowFilter.setAttribute("id", "glow-effect");
    glowFilter.setAttribute("x", "-50%");
    glowFilter.setAttribute("y", "-50%");
    glowFilter.setAttribute("width", "200%");
    glowFilter.setAttribute("height", "200%");
    
    const feGaussianBlur = document.createElementNS("http://www.w3.org/2000/svg", "feGaussianBlur");
    feGaussianBlur.setAttribute("stdDeviation", "2.5");
    feGaussianBlur.setAttribute("result", "coloredBlur");
    
    const feMerge = document.createElementNS("http://www.w3.org/2000/svg", "feMerge");
    const feMergeNode1 = document.createElementNS("http://www.w3.org/2000/svg", "feMergeNode");
    feMergeNode1.setAttribute("in", "coloredBlur");
    const feMergeNode2 = document.createElementNS("http://www.w3.org/2000/svg", "feMergeNode");
    feMergeNode2.setAttribute("in", "SourceGraphic");
    
    feMerge.appendChild(feMergeNode1);
    feMerge.appendChild(feMergeNode2);
    glowFilter.appendChild(feGaussianBlur);
    glowFilter.appendChild(feMerge);
    defs.appendChild(glowFilter);
    
    svg.appendChild(defs);
    
    // 先绘制连线
    data.links.forEach((link, index) => {
      if (!nodePositions[link.source] || !nodePositions[link.target]) return;
      
      const sourcePos = nodePositions[link.source];
      const targetPos = nodePositions[link.target];
      
      // 计算两点间距离和角度
      const dx = targetPos.x - sourcePos.x;
      const dy = targetPos.y - sourcePos.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const angle = Math.atan2(dy, dx);
      
      // 调整起点和终点，让线不要从圆心开始，而是从圆的边缘开始
      const nodeRadius = 22; // 节点圆形半径
      const adjustedSource = {
        x: sourcePos.x + nodeRadius * Math.cos(angle),
        y: sourcePos.y + nodeRadius * Math.sin(angle)
      };
      
      const adjustedTarget = {
        x: targetPos.x - nodeRadius * Math.cos(angle),
        y: targetPos.y - nodeRadius * Math.sin(angle)
      };
      
      // 创建路径元素
      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      
      // 计算曲线控制点
      // 调整曲线程度，使得线条更平滑
      const curveOffset = distance * 0.15; // 减少曲率
      const controlPoint = {
        x: (adjustedSource.x + adjustedTarget.x) / 2 - curveOffset * Math.sin(angle),
        y: (adjustedSource.y + adjustedTarget.y) / 2 + curveOffset * Math.cos(angle)
      };
      
      // 创建路径数据
      const pathData = `M ${adjustedSource.x} ${adjustedSource.y} Q ${controlPoint.x} ${controlPoint.y}, ${adjustedTarget.x} ${adjustedTarget.y}`;
      
      // 设置路径属性
      path.setAttribute("d", pathData);
      path.setAttribute("fill", "none");
      path.setAttribute("stroke", "#606060"); // 更深的线条颜色
      path.setAttribute("stroke-width", "1.8"); // 更粗的线条
      path.setAttribute("stroke-opacity", "0.85"); // 更高的不透明度
      path.setAttribute("marker-end", "url(#arrowhead)");
      path.setAttribute("data-link-index", index.toString());
      path.setAttribute("data-source", link.source);
      path.setAttribute("data-target", link.target);
      
      // 添加鼠标交互事件
      path.addEventListener("mouseenter", () => {
        path.setAttribute("stroke", "#08875d"); // 更深的高亮颜色
        path.setAttribute("stroke-width", "3");
        path.setAttribute("stroke-opacity", "1");
        path.setAttribute("filter", "url(#glow-effect)");
        setHoveredLink(index);
      });
      
      path.addEventListener("mouseleave", () => {
        path.setAttribute("stroke", "#606060"); // 恢复默认颜色
        path.setAttribute("stroke-width", "1.8");
        path.setAttribute("stroke-opacity", "0.85");
        path.removeAttribute("filter");
        setHoveredLink(null);
      });
      
      // 关系文本
      const textBg = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      textBg.setAttribute("rx", "8");
      textBg.setAttribute("ry", "8");
      textBg.setAttribute("fill", "#f0f9ff"); // 浅蓝色背景
      textBg.setAttribute("stroke", "#90cdf4"); // 蓝色边框
      textBg.setAttribute("stroke-width", "1");
      textBg.setAttribute("opacity", "0");
      
      const textElement = document.createElementNS("http://www.w3.org/2000/svg", "text");
      textElement.setAttribute("fill", "#1e40af"); // 深蓝色文字
      textElement.setAttribute("font-size", "12"); // 增大字号
      textElement.setAttribute("font-weight", "600");
      textElement.setAttribute("text-anchor", "middle");
      textElement.setAttribute("opacity", "0");
      textElement.setAttribute("data-link-index", index.toString());
      textElement.textContent = link.relation;
      
      // 放置文本在曲线中点
      const midpoint = {
        x: (adjustedSource.x + adjustedTarget.x) / 2,
        y: (adjustedSource.y + adjustedTarget.y) / 2
      };
      
      textElement.setAttribute("x", String(midpoint.x));
      textElement.setAttribute("y", String(midpoint.y));
      
      // 悬停时才显示文本
      path.addEventListener("mouseenter", () => {
        textBg.setAttribute("opacity", "0.9");
        textElement.setAttribute("opacity", "1");
        
        // 调整背景大小和位置
        const bbox = textElement.getBBox();
        textBg.setAttribute("x", String(bbox.x - 6));
        textBg.setAttribute("y", String(bbox.y - 2));
        textBg.setAttribute("width", String(bbox.width + 12));
        textBg.setAttribute("height", String(bbox.height + 4));
      });
      
      path.addEventListener("mouseleave", () => {
        textBg.setAttribute("opacity", "0");
        textElement.setAttribute("opacity", "0");
      });
      
      // 将元素添加到SVG中
      linksGroup.appendChild(path);
      linksGroup.appendChild(textBg);
      linksGroup.appendChild(textElement);
    });
    
    // 然后绘制节点
    data.nodes.forEach(node => {
      if (!nodePositions[node.id]) return;
      
      const position = nodePositions[node.id];
      
      // 创建节点组
      const nodeGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
      nodeGroup.setAttribute("transform", `translate(${position.x}, ${position.y})`);
      nodeGroup.setAttribute("data-node-id", node.id);
      nodeGroup.setAttribute("style", "cursor: move"); // 添加拖拽光标样式
      
      // 为节点组添加鼠标按下事件以实现拖拽
      nodeGroup.addEventListener('mousedown', (e) => {
        e.preventDefault(); // 防止选择文本或其他默认行为
        const svgRect = svgRef.current?.getBoundingClientRect();
        if (!svgRect) return;
        
        // 计算鼠标位置相对于SVG的坐标
        const mouseX = (e.clientX - svgRect.left) / scale;
        const mouseY = (e.clientY - svgRect.top) / scale;
        
        // 计算偏移量
        const offsetX = mouseX - position.x;
        const offsetY = mouseY - position.y;
        
        setDragState({
          isDragging: true,
          nodeId: node.id,
          offset: { x: offsetX, y: offsetY }
        });
      });
      
      // 首先添加阴影圆圈（slightly larger）
      const shadowCircle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      shadowCircle.setAttribute("r", "24");
      shadowCircle.setAttribute("fill", "rgba(0,0,0,0.3)");
      shadowCircle.setAttribute("filter", "url(#node-shadow)");
      shadowCircle.setAttribute("opacity", "0.6");
      
      // 创建节点圆形
      const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      circle.setAttribute("r", "22");
      
      const nodeColor = node.group === "官员" ? {
        fill: "#ff5757", // 更亮的红色
        stroke: "#ffffff" // 白色边框
      } : {
        fill: "#4b80ff", // 更亮的蓝色
        stroke: "#ffffff" // 白色边框
      };
      
      circle.setAttribute("fill", nodeColor.fill);
      circle.setAttribute("stroke", nodeColor.stroke);
      circle.setAttribute("stroke-width", "2");
      
      // 内部渐变效果
      const gradientId = `gradient-${node.id.replace(/\s+/g, '-')}`;
      const gradient = document.createElementNS("http://www.w3.org/2000/svg", "radialGradient");
      gradient.setAttribute("id", gradientId);
      gradient.setAttribute("cx", "0.3");
      gradient.setAttribute("cy", "0.3");
      gradient.setAttribute("r", "0.8");
      
      const stop1 = document.createElementNS("http://www.w3.org/2000/svg", "stop");
      stop1.setAttribute("offset", "10%");
      stop1.setAttribute("stop-color", nodeColor.stroke);
      
      const stop2 = document.createElementNS("http://www.w3.org/2000/svg", "stop");
      stop2.setAttribute("offset", "90%");
      stop2.setAttribute("stop-color", nodeColor.fill);
      
      gradient.appendChild(stop1);
      gradient.appendChild(stop2);
      defs.appendChild(gradient);
      
      circle.setAttribute("fill", `url(#${gradientId})`);
      
      // 创建节点文本标签 - ID
      const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
      text.setAttribute("text-anchor", "middle");
      text.setAttribute("dominant-baseline", "central");
      text.setAttribute("fill", "black"); // 保持白色文字
      //text.setAttribute("font-weight", "bold");
      text.setAttribute("font-size", "14"); // 更大的字号
      //text.setAttribute("stroke", "black"); // 黑色描边
      //text.setAttribute("stroke-width", "1.5"); // 增加描边宽度，使轮廓更加明显
      text.textContent = node.id;
      
      // 外部标签 - 放置职位信息
      const labelBg = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      labelBg.setAttribute("x", "-50");
      labelBg.setAttribute("y", "26");
      labelBg.setAttribute("width", "100");
      labelBg.setAttribute("height", "20"); // 增加高度，让文字有更多空间
      labelBg.setAttribute("rx", "10"); // 增加圆角
      labelBg.setAttribute("ry", "10");
      labelBg.setAttribute("fill", "#f0f9ff"); // 淡蓝色背景，与关系文本一致
      labelBg.setAttribute("stroke", "#90cdf4"); // 蓝色边框
      labelBg.setAttribute("stroke-width", "1");
      labelBg.setAttribute("opacity", "0");
      
      const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
      label.setAttribute("x", "0");
      label.setAttribute("y", "36"); // 调整垂直位置
      label.setAttribute("text-anchor", "middle");
      label.setAttribute("fill", "#1e40af"); // 深蓝色文字，与关系文本一致
      label.setAttribute("font-size", "12"); // 增大字号
      label.setAttribute("font-weight", "600"); // 加粗
      label.setAttribute("opacity", "0");
      label.textContent = node.label;
      
      // 悬停效果
      nodeGroup.addEventListener("mouseenter", () => {
        circle.setAttribute("r", "24"); // 放大节点
        text.setAttribute("font-size", "16"); // 更大的文字
        text.setAttribute("stroke-width", "2"); // 更粗的描边
        labelBg.setAttribute("opacity", "0.95");
        label.setAttribute("opacity", "1");
        shadowCircle.setAttribute("opacity", "0.8");
        
        // 添加到hover状态
        setHoveredNode(node.id);
        
        // 调整标签背景大小
        const labelWidth = label.textContent!.length * 6 + 20;
        labelBg.setAttribute("width", String(labelWidth));
        labelBg.setAttribute("x", String(-labelWidth / 2));
      });
      
      nodeGroup.addEventListener("mouseleave", () => {
        circle.setAttribute("r", "22"); // 恢复原始大小
        text.setAttribute("font-size", "14"); // 恢复原始字号
        text.setAttribute("stroke-width", "1.5"); // 恢复原始描边宽度
        labelBg.setAttribute("opacity", "0");
        label.setAttribute("opacity", "0");
        shadowCircle.setAttribute("opacity", "0.6");
        
        // 移除hover状态
        setHoveredNode(null);
      });
      
      // 将元素添加到节点组中
      nodeGroup.appendChild(shadowCircle);
      nodeGroup.appendChild(circle);
      nodeGroup.appendChild(text);
      nodeGroup.appendChild(labelBg);
      nodeGroup.appendChild(label);
      
      // 将节点组添加到SVG中
      nodesGroup.appendChild(nodeGroup);
    });
    
    // 添加图例
    const legend = document.createElementNS("http://www.w3.org/2000/svg", "g");
    legend.setAttribute("transform", "translate(30, 30)");
    
    // 官员图例背景
    const legendBg = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    legendBg.setAttribute("x", "0");
    legendBg.setAttribute("y", "0");
    legendBg.setAttribute("width", "150");
    legendBg.setAttribute("height", "24");
    legendBg.setAttribute("rx", "12");
    legendBg.setAttribute("fill", "rgba(255, 255, 255, 0.85)");
    legendBg.setAttribute("stroke", "#d1d5db");
    legendBg.setAttribute("stroke-width", "1");
    
    // 官员图例
    const officialLegendCircle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    officialLegendCircle.setAttribute("cx", "15");
    officialLegendCircle.setAttribute("cy", "12");
    officialLegendCircle.setAttribute("r", "8");
    officialLegendCircle.setAttribute("fill", "#ff5757");
    
    const officialLegendText = document.createElementNS("http://www.w3.org/2000/svg", "text");
    officialLegendText.setAttribute("x", "30");
    officialLegendText.setAttribute("y", "16");
    officialLegendText.setAttribute("font-size", "12");
    officialLegendText.setAttribute("fill", "#111827"); // 深灰色，几乎黑色
    officialLegendText.setAttribute("font-weight", "600");
    officialLegendText.textContent = "官员";
    
    // 企业图例
    const businessLegendCircle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    businessLegendCircle.setAttribute("cx", "75");
    businessLegendCircle.setAttribute("cy", "12");
    businessLegendCircle.setAttribute("r", "8");
    businessLegendCircle.setAttribute("fill", "#4b80ff");
    
    const businessLegendText = document.createElementNS("http://www.w3.org/2000/svg", "text");
    businessLegendText.setAttribute("x", "90");
    businessLegendText.setAttribute("y", "16");
    businessLegendText.setAttribute("font-size", "12");
    businessLegendText.setAttribute("fill", "#111827"); // 深灰色，几乎黑色
    businessLegendText.setAttribute("font-weight", "600");
    businessLegendText.textContent = "企业";
    
    legend.appendChild(legendBg);
    legend.appendChild(officialLegendCircle);
    legend.appendChild(officialLegendText);
    legend.appendChild(businessLegendCircle);
    legend.appendChild(businessLegendText);
    
    svg.appendChild(legend);
    
    // 添加操作提示文本
    const instructionBg = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    instructionBg.setAttribute("x", String(containerWidth - 175));
    instructionBg.setAttribute("y", "10");
    instructionBg.setAttribute("width", "165");
    instructionBg.setAttribute("height", "24");
    instructionBg.setAttribute("rx", "12");
    instructionBg.setAttribute("fill", "rgba(255, 255, 255, 0.85)");
    instructionBg.setAttribute("stroke", "#d1d5db");
    instructionBg.setAttribute("stroke-width", "1");
    svg.appendChild(instructionBg);
    
    const instructionText = document.createElementNS("http://www.w3.org/2000/svg", "text");
    instructionText.setAttribute("x", String(containerWidth - 85));
    instructionText.setAttribute("y", "26");
    instructionText.setAttribute("text-anchor", "middle");
    instructionText.setAttribute("font-size", "12");
    instructionText.setAttribute("fill", "#111827"); // 深灰色，几乎黑色
    instructionText.setAttribute("font-weight", "600");
    instructionText.textContent = "拖拽节点可调整位置";
    svg.appendChild(instructionText);
    
    // 最后添加调试信息
    const debugText = document.createElementNS("http://www.w3.org/2000/svg", "text");
    debugText.setAttribute("x", "10");
    debugText.setAttribute("y", String(containerHeight - 10));
    debugText.setAttribute("font-size", "10");
    debugText.setAttribute("fill", "#333333");
    debugText.textContent = `容器宽度: ${containerWidth}px, 渲染时间: ${new Date().toLocaleTimeString()}`;
    svg.appendChild(debugText);
    
    console.log("⭐️ 图谱渲染完成");
  };
  
  // 处理鼠标移动（拖拽节点）
  const handleMouseMove = (event: MouseEvent) => {
    if (dragState.isDragging && dragState.nodeId && svgRef.current) {
      // 获取SVG坐标系统
      const svgElement = svgRef.current;
      const svgRect = svgElement.getBoundingClientRect();
      
      // 计算鼠标位置相对于SVG的坐标
      const mouseX = (event.clientX - svgRect.left) / scale;
      const mouseY = (event.clientY - svgRect.top) / scale;
      
      // 考虑到拖拽起始点的偏移量
      const newX = mouseX - dragState.offset.x;
      const newY = mouseY - dragState.offset.y;
      
      // 更新节点位置
      if (nodePositionsRef.current[dragState.nodeId]) {
        nodePositionsRef.current[dragState.nodeId] = {
          x: newX,
          y: newY
        };
        
        // 找到正在拖拽的节点元素并更新其位置
        const nodeGroup = svgElement.querySelector(`g[data-node-id="${dragState.nodeId}"]`);
        if (nodeGroup) {
          nodeGroup.setAttribute('transform', `translate(${newX}, ${newY})`);
          
          // 更新与该节点连接的所有边
          updateConnectedLinks(dragState.nodeId, newX, newY);
        }
      }
    }
  };
  
  // 更新与节点相连的边
  const updateConnectedLinks = (nodeId: string, newX: number, newY: number) => {
    if (!graphData || !svgRef.current) return;
    
    // 查找与该节点相关的所有连接
    graphData.links.forEach((link, index) => {
      if (link.source === nodeId || link.target === nodeId) {
        // 获取连接的两个端点
        const sourcePos = link.source === nodeId 
          ? { x: newX, y: newY } 
          : nodePositionsRef.current[link.source];
        
        const targetPos = link.target === nodeId 
          ? { x: newX, y: newY } 
          : nodePositionsRef.current[link.target];
        
        if (!sourcePos || !targetPos) return;
        
        // 更新连接线
        updateLinkPath(index, sourcePos, targetPos);
      }
    });
  };
  
  // 更新连接线路径
  const updateLinkPath = (linkIndex: number, sourcePos: {x: number, y: number}, targetPos: {x: number, y: number}) => {
    if (!svgRef.current) return;
    
    // 计算两点间距离和角度
    const dx = targetPos.x - sourcePos.x;
    const dy = targetPos.y - sourcePos.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx);
    
    // 调整起点和终点，让线不要从圆心开始，而是从圆的边缘开始
    const nodeRadius = 22; // 节点圆形半径
    const adjustedSource = {
      x: sourcePos.x + nodeRadius * Math.cos(angle),
      y: sourcePos.y + nodeRadius * Math.sin(angle)
    };
    
    const adjustedTarget = {
      x: targetPos.x - nodeRadius * Math.cos(angle),
      y: targetPos.y - nodeRadius * Math.sin(angle)
    };
    
    // 计算曲线控制点
    const curveOffset = distance * 0.15; // 减少曲率
    const controlPoint = {
      x: (adjustedSource.x + adjustedTarget.x) / 2 - curveOffset * Math.sin(angle),
      y: (adjustedSource.y + adjustedTarget.y) / 2 + curveOffset * Math.cos(angle)
    };
    
    // 创建路径数据
    const pathData = `M ${adjustedSource.x} ${adjustedSource.y} Q ${controlPoint.x} ${controlPoint.y}, ${adjustedTarget.x} ${adjustedTarget.y}`;
    
    // 更新路径
    const path = svgRef.current.querySelector(`path[data-link-index="${linkIndex}"]`);
    if (path) {
      path.setAttribute("d", pathData);
    }
    
    // 更新文本位置
    const midpoint = {
      x: (adjustedSource.x + adjustedTarget.x) / 2,
      y: (adjustedSource.y + adjustedTarget.y) / 2
    };
    
    // 文本元素通常是路径后面的第二个和第三个元素
    const textElements = svgRef.current.querySelectorAll(`text`);
    textElements.forEach(textEl => {
      if (textEl.getAttribute('data-link-index') === linkIndex.toString()) {
        textEl.setAttribute("x", String(midpoint.x));
        textEl.setAttribute("y", String(midpoint.y));
        
        // 更新背景矩形位置
        const textBg = textEl.previousElementSibling;
        if (textBg && textBg.tagName === 'rect') {
          const bbox = textEl.getBBox();
          textBg.setAttribute("x", String(bbox.x - 6));
          textBg.setAttribute("y", String(bbox.y - 2));
          textBg.setAttribute("width", String(bbox.width + 12));
          textBg.setAttribute("height", String(bbox.height + 4));
        }
      }
    });
  };
  
  // 处理鼠标抬起（结束拖拽）
  const handleMouseUp = () => {
    if (dragState.isDragging) {
      setDragState({
        isDragging: false,
        nodeId: null,
        offset: { x: 0, y: 0 }
      });
    }
  };
  
  // 当数据加载完成后，设置图谱布局
  useEffect(() => {
    if (!graphData) return;
    console.log("⭐️ 图谱数据已加载，准备渲染");
    
    // 延迟渲染以确保组件完全挂载
    const timer = setTimeout(() => {
      renderGraph(graphData);
    }, 100);
    
    return () => clearTimeout(timer);
  }, [graphData]);
  
  // 处理缩放功能
  const handleWheel = (event: React.WheelEvent) => {
    event.preventDefault();
    
    // 计算新的缩放比例
    const delta = event.deltaY > 0 ? -0.1 : 0.1;
    const newScale = Math.max(0.5, Math.min(2, scale + delta));
    
    if (svgRef.current && containerRef.current) {
      // 保存当前的滚动位置
      const rect = containerRef.current.getBoundingClientRect();
      const mouseX = event.clientX - rect.left;
      const mouseY = event.clientY - rect.top;
      
      // 应用缩放
      setScale(newScale);
      
      // 对SVG进行变换
      const svg = svgRef.current;
      svg.style.transform = `scale(${newScale})`;
      svg.style.transformOrigin = `${mouseX}px ${mouseY}px`;
    }
  };
  
  if (isLoading) {
    return (
      <div className="w-full h-60 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
        <span className="ml-3 text-gray-600">加载关系图...</span>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="w-full p-4 bg-red-50 text-red-500 rounded-lg">
        <p>加载关系图出错: {error}</p>
      </div>
    );
  }
  
  if (!graphData || graphData.nodes.length === 0) {
    return (
      <div className="w-full p-4 bg-blue-50 text-blue-500 rounded-lg">
        <p>没有可用的关系图数据</p>
      </div>
    );
  }
  
  return (
    <div className="w-full bg-white rounded-lg shadow-xl p-6 mt-4 border border-gray-300">
      <div className="flex items-center mb-4">
        <div className="w-4 h-8 bg-gradient-to-r from-teal-500 to-emerald-500 rounded mr-3"></div>
        <h3 className="text-xl font-bold text-gray-800">人物关系图谱</h3>
      </div>
      <div 
        ref={containerRef} 
        className="relative w-full overflow-hidden rounded-lg"
        style={{ 
          height: '600px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08), inset 0 0 0 1px rgba(63, 63, 68, 0.1)',
          background: 'white'
        }}
        onWheel={handleWheel}
      >
        <svg 
          ref={svgRef} 
          className="w-full h-full transition-transform duration-150"
          style={{ transform: `scale(${scale})`, transformOrigin: 'center center' }}
        ></svg>
        
        {/* 缩放控制器 */}
        <div className="absolute bottom-4 right-4 flex bg-white rounded-full shadow-lg border border-gray-200 overflow-hidden">
          <button 
            className="px-4 py-2 text-lg border-r border-gray-200 hover:bg-gray-100 text-gray-700 transition-colors"
            onClick={() => setScale(prev => Math.min(2, prev + 0.1))}
          >
            +
          </button>
          <button 
            className="px-4 py-2 text-lg hover:bg-gray-100 text-gray-700 transition-colors"
            onClick={() => setScale(prev => Math.max(0.5, prev - 0.1))}
          >
            -
          </button>
        </div>
      </div>
      
      <div className="mt-4 flex items-center justify-between">
        <div className="text-sm text-gray-700 bg-blue-50 px-3 py-1.5 rounded-full border border-blue-100">
          <span className="font-medium text-blue-700 mr-1">提示:</span> 
          鼠标悬停查看详情，滚轮缩放图谱，拖拽节点调整布局
        </div>
        <div className="text-xs text-amber-700 italic">
          可打开或收起文件列表以获得更佳显示效果
        </div>
      </div>
      
      {/* 添加图谱加载状态提示 */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/90 z-10 rounded-lg">
          <div className="flex flex-col items-center bg-white p-6 rounded-lg shadow-lg border border-gray-200">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
            <div className="mt-3 text-emerald-700 font-medium">正在加载关系图谱...</div>
          </div>
        </div>
      )}
    </div>
  );
} 