"use client";

import React, { useMemo } from "react";
import type {
  DiagramType,
  DiagramData,
  CoordinatePlaneDiagram,
  GeometryDiagram,
  NumberLineDiagram,
  BarModelDiagram,
  AreaModelDiagram,
  TapeDiagramDiagram,
  AngleDiagram,
  CircleGraphDiagram,
  Point2D,
  LineSegment,
  GeometryShape,
} from "@/lib/types";

interface DiagramRendererProps {
  type: DiagramType;
  data: DiagramData;
  width?: number;
  height?: number;
  className?: string;
}

const DEFAULT_COLORS = [
  "#3b82f6", // blue
  "#ef4444", // red
  "#22c55e", // green
  "#f59e0b", // amber
  "#8b5cf6", // purple
  "#06b6d4", // cyan
  "#ec4899", // pink
  "#84cc16", // lime
];

function getColor(index: number, customColor?: string): string {
  return customColor || DEFAULT_COLORS[index % DEFAULT_COLORS.length];
}

// ============ Coordinate Plane ============
function CoordinatePlaneRenderer({
  data,
  width,
  height,
}: {
  data: CoordinatePlaneDiagram;
  width: number;
  height: number;
}) {
  const range = data.gridRange || { xMin: -10, xMax: 10, yMin: -10, yMax: 10 };
  const padding = 30;
  const innerWidth = width - padding * 2;
  const innerHeight = height - padding * 2;

  const scaleX = (x: number) =>
    padding + ((x - range.xMin) / (range.xMax - range.xMin)) * innerWidth;
  const scaleY = (y: number) =>
    padding + ((range.yMax - y) / (range.yMax - range.yMin)) * innerHeight;

  const gridLines = useMemo(() => {
    if (data.showGrid === false) return null;
    const lines = [];
    for (let x = Math.ceil(range.xMin); x <= range.xMax; x++) {
      lines.push(
        <line
          key={`vgrid-${x}`}
          x1={scaleX(x)}
          y1={padding}
          x2={scaleX(x)}
          y2={height - padding}
          stroke="#e5e7eb"
          strokeWidth={1}
        />
      );
    }
    for (let y = Math.ceil(range.yMin); y <= range.yMax; y++) {
      lines.push(
        <line
          key={`hgrid-${y}`}
          x1={padding}
          y1={scaleY(y)}
          x2={width - padding}
          y2={scaleY(y)}
          stroke="#e5e7eb"
          strokeWidth={1}
        />
      );
    }
    return lines;
  }, [data.showGrid, range, width, height, padding, innerWidth, innerHeight]);

  const axes = useMemo(() => {
    if (data.showAxes === false) return null;
    return (
      <>
        {/* X axis */}
        <line
          x1={padding}
          y1={scaleY(0)}
          x2={width - padding}
          y2={scaleY(0)}
          stroke="#374151"
          strokeWidth={2}
        />
        {/* Y axis */}
        <line
          x1={scaleX(0)}
          y1={padding}
          x2={scaleX(0)}
          y2={height - padding}
          stroke="#374151"
          strokeWidth={2}
        />
        {/* Axis labels */}
        {Array.from({ length: range.xMax - range.xMin + 1 }, (_, i) => range.xMin + i)
          .filter((x) => x !== 0)
          .map((x) => (
            <text
              key={`xlabel-${x}`}
              x={scaleX(x)}
              y={scaleY(0) + 18}
              textAnchor="middle"
              fontSize={14}
              fontWeight="600"
              fill="#374151"
            >
              {x}
            </text>
          ))}
        {Array.from({ length: range.yMax - range.yMin + 1 }, (_, i) => range.yMin + i)
          .filter((y) => y !== 0)
          .map((y) => (
            <text
              key={`ylabel-${y}`}
              x={scaleX(0) - 10}
              y={scaleY(y) + 5}
              textAnchor="end"
              fontSize={14}
              fontWeight="600"
              fill="#374151"
            >
              {y}
            </text>
          ))}
      </>
    );
  }, [data.showAxes, range, width, height, padding]);

  return (
    <svg width={width} height={height} className="bg-white rounded-lg border border-gray-200">
      {gridLines}
      {axes}

      {/* Polygons */}
      {data.polygons?.map((poly, i) => (
        <polygon
          key={`poly-${i}`}
          points={poly.vertices.map(([x, y]) => `${scaleX(x)},${scaleY(y)}`).join(" ")}
          fill={poly.fill || "rgba(59, 130, 246, 0.2)"}
          stroke={poly.stroke || "#3b82f6"}
          strokeWidth={2}
        />
      ))}

      {/* Lines */}
      {data.lines?.map((line, i) => (
        <g key={`line-${i}`}>
          <line
            x1={scaleX(line.start[0])}
            y1={scaleY(line.start[1])}
            x2={scaleX(line.end[0])}
            y2={scaleY(line.end[1])}
            stroke={line.color || "#374151"}
            strokeWidth={2}
            strokeDasharray={line.style === "dashed" ? "5,5" : line.style === "dotted" ? "2,2" : undefined}
          />
          {line.label && (
            <text
              x={(scaleX(line.start[0]) + scaleX(line.end[0])) / 2}
              y={(scaleY(line.start[1]) + scaleY(line.end[1])) / 2 - 10}
              textAnchor="middle"
              fontSize={16}
              fontWeight="bold"
              fill="#374151"
            >
              {line.label}
            </text>
          )}
        </g>
      ))}

      {/* Vectors (with arrowheads) */}
      {data.vectors?.map((vec, i) => {
        const angle = Math.atan2(
          scaleY(vec.end[1]) - scaleY(vec.start[1]),
          scaleX(vec.end[0]) - scaleX(vec.start[0])
        );
        const arrowSize = 10;
        return (
          <g key={`vec-${i}`}>
            <line
              x1={scaleX(vec.start[0])}
              y1={scaleY(vec.start[1])}
              x2={scaleX(vec.end[0])}
              y2={scaleY(vec.end[1])}
              stroke={vec.color || "#ef4444"}
              strokeWidth={2}
            />
            <polygon
              points={`
                ${scaleX(vec.end[0])},${scaleY(vec.end[1])}
                ${scaleX(vec.end[0]) - arrowSize * Math.cos(angle - Math.PI / 6)},${scaleY(vec.end[1]) - arrowSize * Math.sin(angle - Math.PI / 6)}
                ${scaleX(vec.end[0]) - arrowSize * Math.cos(angle + Math.PI / 6)},${scaleY(vec.end[1]) - arrowSize * Math.sin(angle + Math.PI / 6)}
              `}
              fill={vec.color || "#ef4444"}
            />
            {vec.label && (
              <text
                x={(scaleX(vec.start[0]) + scaleX(vec.end[0])) / 2 + 10}
                y={(scaleY(vec.start[1]) + scaleY(vec.end[1])) / 2}
                fontSize={16}
                fontWeight="bold"
                fill={vec.color || "#ef4444"}
              >
                {vec.label}
              </text>
            )}
          </g>
        );
      })}

      {/* Points */}
      {data.points?.map((point, i) => (
        <g key={`point-${i}`}>
          {point.style === "hollow" ? (
            <circle
              cx={scaleX(point.x)}
              cy={scaleY(point.y)}
              r={5}
              fill="white"
              stroke={point.color || "#3b82f6"}
              strokeWidth={2}
            />
          ) : point.style === "cross" ? (
            <>
              <line
                x1={scaleX(point.x) - 4}
                y1={scaleY(point.y) - 4}
                x2={scaleX(point.x) + 4}
                y2={scaleY(point.y) + 4}
                stroke={point.color || "#3b82f6"}
                strokeWidth={2}
              />
              <line
                x1={scaleX(point.x) - 4}
                y1={scaleY(point.y) + 4}
                x2={scaleX(point.x) + 4}
                y2={scaleY(point.y) - 4}
                stroke={point.color || "#3b82f6"}
                strokeWidth={2}
              />
            </>
          ) : (
            <circle
              cx={scaleX(point.x)}
              cy={scaleY(point.y)}
              r={5}
              fill={point.color || "#3b82f6"}
            />
          )}
          {point.label && (
            <text
              x={scaleX(point.x) + 10}
              y={scaleY(point.y) - 10}
              fontSize={16}
              fontWeight="bold"
              fill="#374151"
            >
              {point.label}
            </text>
          )}
        </g>
      ))}
    </svg>
  );
}

// ============ Geometry ============
function GeometryRenderer({
  data,
  width,
  height,
}: {
  data: GeometryDiagram;
  width: number;
  height: number;
}) {
  const padding = 20;

  // Simple scaling: assume coordinates are in a reasonable range (0-100 default)
  const scaleX = (x: number) => padding + (x / 100) * (width - padding * 2);
  const scaleY = (y: number) => padding + (y / 100) * (height - padding * 2);

  const renderShape = (shape: GeometryShape, index: number) => {
    const fill = shape.fill || "rgba(59, 130, 246, 0.1)";
    const stroke = shape.stroke || "#3b82f6";

    if (shape.type === "circle" && shape.center && shape.radius) {
      return (
        <circle
          key={`shape-${index}`}
          cx={scaleX(shape.center[0])}
          cy={scaleY(shape.center[1])}
          r={(shape.radius / 100) * (width - padding * 2)}
          fill={fill}
          stroke={stroke}
          strokeWidth={2}
        />
      );
    }

    if (shape.vertices) {
      const points = shape.vertices.map(([x, y]) => `${scaleX(x)},${scaleY(y)}`).join(" ");
      return (
        <g key={`shape-${index}`}>
          <polygon points={points} fill={fill} stroke={stroke} strokeWidth={2} />
          {/* Vertex labels */}
          {shape.vertexLabels?.map((label, i) => {
            const [x, y] = shape.vertices![i];
            return (
              <text
                key={`vlabel-${i}`}
                x={scaleX(x)}
                y={scaleY(y) - 10}
                textAnchor="middle"
                fontSize={18}
                fontWeight="bold"
                fill="#374151"
              >
                {label}
              </text>
            );
          })}
          {/* Side labels */}
          {shape.sideLabels?.map((label, i) => {
            const v1 = shape.vertices![i];
            const v2 = shape.vertices![(i + 1) % shape.vertices!.length];
            const midX = (scaleX(v1[0]) + scaleX(v2[0])) / 2;
            const midY = (scaleY(v1[1]) + scaleY(v2[1])) / 2;
            return (
              <text
                key={`slabel-${i}`}
                x={midX}
                y={midY - 10}
                textAnchor="middle"
                fontSize={18}
                fontWeight="bold"
                fill="#374151"
              >
                {label}
              </text>
            );
          })}
        </g>
      );
    }

    return null;
  };

  return (
    <svg width={width} height={height} className="bg-white rounded-lg border border-gray-200">
      {data.shapes?.map(renderShape)}

      {/* Lines */}
      {data.lines?.map((line, i) => (
        <line
          key={`line-${i}`}
          x1={scaleX(line.start[0])}
          y1={scaleY(line.start[1])}
          x2={scaleX(line.end[0])}
          y2={scaleY(line.end[1])}
          stroke={line.color || "#374151"}
          strokeWidth={2}
          strokeDasharray={line.style === "dashed" ? "5,5" : undefined}
        />
      ))}

      {/* Points */}
      {data.points?.map((point, i) => (
        <g key={`point-${i}`}>
          <circle
            cx={scaleX(point.x)}
            cy={scaleY(point.y)}
            r={4}
            fill={point.color || "#374151"}
          />
          {point.label && (
            <text
              x={scaleX(point.x) + 10}
              y={scaleY(point.y) + 5}
              fontSize={16}
              fontWeight="bold"
              fill="#374151"
            >
              {point.label}
            </text>
          )}
        </g>
      ))}

      {/* Labels */}
      {data.labels?.map((label, i) => (
        <text
          key={`label-${i}`}
          x={scaleX(label.position[0])}
          y={scaleY(label.position[1])}
          textAnchor="middle"
          fontSize={16}
          fontWeight="bold"
          fill="#374151"
        >
          {label.text}
        </text>
      ))}

      {/* Angle arcs */}
      {data.angles?.map((angle, i) => {
        const [vx, vy] = angle.vertex;
        const arcRadius = 15;
        const angle1 = Math.atan2(
          angle.ray1End[1] - vy,
          angle.ray1End[0] - vx
        );
        const angle2 = Math.atan2(
          angle.ray2End[1] - vy,
          angle.ray2End[0] - vx
        );

        if (angle.showArc !== false) {
          const startX = scaleX(vx) + arcRadius * Math.cos(angle1);
          const startY = scaleY(vy) + arcRadius * Math.sin(angle1);
          const endX = scaleX(vx) + arcRadius * Math.cos(angle2);
          const endY = scaleY(vy) + arcRadius * Math.sin(angle2);
          const largeArc = Math.abs(angle2 - angle1) > Math.PI ? 1 : 0;

          return (
            <g key={`angle-${i}`}>
              <path
                d={`M ${startX} ${startY} A ${arcRadius} ${arcRadius} 0 ${largeArc} 1 ${endX} ${endY}`}
                fill="none"
                stroke="#ef4444"
                strokeWidth={1.5}
              />
              {angle.label && (
                <text
                  x={scaleX(vx) + 30 * Math.cos((angle1 + angle2) / 2)}
                  y={scaleY(vy) + 30 * Math.sin((angle1 + angle2) / 2)}
                  fontSize={16}
                  fontWeight="bold"
                  fill="#ef4444"
                >
                  {angle.measure ? `${angle.measure}°` : angle.label}
                </text>
              )}
            </g>
          );
        }
        return null;
      })}
    </svg>
  );
}

// ============ Number Line ============
function NumberLineRenderer({
  data,
  width,
  height,
}: {
  data: NumberLineDiagram;
  width: number;
  height: number;
}) {
  const padding = 40;
  const lineY = height / 2;
  const tickHeight = 10;

  const scaleX = (val: number) =>
    padding + ((val - data.min) / (data.max - data.min)) * (width - padding * 2);

  const step = data.step || 1;
  const ticks = [];
  for (let v = data.min; v <= data.max; v += step) {
    ticks.push(v);
  }

  return (
    <svg width={width} height={height} className="bg-white rounded-lg border border-gray-200">
      {/* Main line */}
      <line
        x1={padding - 10}
        y1={lineY}
        x2={width - padding + 10}
        y2={lineY}
        stroke="#374151"
        strokeWidth={2}
      />
      {/* Arrowheads */}
      <polygon
        points={`${width - padding + 10},${lineY} ${width - padding},${lineY - 5} ${width - padding},${lineY + 5}`}
        fill="#374151"
      />

      {/* Tick marks and labels */}
      {data.showTicks !== false &&
        ticks.map((v) => (
          <g key={`tick-${v}`}>
            <line
              x1={scaleX(v)}
              y1={lineY - tickHeight / 2}
              x2={scaleX(v)}
              y2={lineY + tickHeight / 2}
              stroke="#374151"
              strokeWidth={1.5}
            />
            <text
              x={scaleX(v)}
              y={lineY + tickHeight + 18}
              textAnchor="middle"
              fontSize={16}
              fontWeight="600"
              fill="#374151"
            >
              {v}
            </text>
          </g>
        ))}

      {/* Intervals */}
      {data.intervals?.map((interval, i) => {
        const x1 = scaleX(interval.start);
        const x2 = scaleX(interval.end);
        const open = interval.open || [false, false];
        return (
          <g key={`interval-${i}`}>
            <line
              x1={x1}
              y1={lineY}
              x2={x2}
              y2={lineY}
              stroke={interval.color || "#3b82f6"}
              strokeWidth={4}
            />
            <circle
              cx={x1}
              cy={lineY}
              r={5}
              fill={open[0] ? "white" : interval.color || "#3b82f6"}
              stroke={interval.color || "#3b82f6"}
              strokeWidth={2}
            />
            <circle
              cx={x2}
              cy={lineY}
              r={5}
              fill={open[1] ? "white" : interval.color || "#3b82f6"}
              stroke={interval.color || "#3b82f6"}
              strokeWidth={2}
            />
            {interval.label && (
              <text
                x={(x1 + x2) / 2}
                y={lineY - 18}
                textAnchor="middle"
                fontSize={16}
                fontWeight="bold"
                fill={interval.color || "#3b82f6"}
              >
                {interval.label}
              </text>
            )}
          </g>
        );
      })}

      {/* Points */}
      {data.points?.map((point, i) => (
        <g key={`point-${i}`}>
          <circle
            cx={scaleX(point.value)}
            cy={lineY}
            r={6}
            fill={point.style === "hollow" ? "white" : point.color || "#ef4444"}
            stroke={point.color || "#ef4444"}
            strokeWidth={2}
          />
          {point.label && (
            <text
              x={scaleX(point.value)}
              y={lineY - 18}
              textAnchor="middle"
              fontSize={16}
              fontWeight="bold"
              fill={point.color || "#ef4444"}
            >
              {point.label}
            </text>
          )}
        </g>
      ))}

      {/* Arrows (jumps) */}
      {data.arrows?.map((arrow, i) => {
        const x1 = scaleX(arrow.from);
        const x2 = scaleX(arrow.to);
        const midX = (x1 + x2) / 2;
        const arcHeight = 25;
        return (
          <g key={`arrow-${i}`}>
            <path
              d={`M ${x1} ${lineY - 8} Q ${midX} ${lineY - arcHeight - 8} ${x2} ${lineY - 8}`}
              fill="none"
              stroke={arrow.color || "#22c55e"}
              strokeWidth={2}
            />
            <polygon
              points={`${x2},${lineY - 8} ${x2 - 6},${lineY - 14} ${x2 - 6},${lineY - 2}`}
              fill={arrow.color || "#22c55e"}
            />
            {arrow.label && (
              <text
                x={midX}
                y={lineY - arcHeight - 15}
                textAnchor="middle"
                fontSize={14}
                fontWeight="bold"
                fill={arrow.color || "#22c55e"}
              >
                {arrow.label}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

// ============ Bar Model ============
function BarModelRenderer({
  data,
  width,
  height,
}: {
  data: BarModelDiagram;
  width: number;
  height: number;
}) {
  const padding = 20;
  const barHeight = 50;
  const isVertical = data.orientation === "vertical";

  const total = data.total || data.parts.reduce((sum, p) => sum + p.value, 0);
  const barWidth = width - padding * 2;
  const barTop = (height - barHeight) / 2;

  if (isVertical) {
    // Vertical orientation
    const unitHeight = (height - padding * 2 - 30) / total;
    let currentY = padding + 15;

    return (
      <svg width={width} height={height} className="bg-white rounded-lg border border-gray-200">
        {data.parts.map((part, i) => {
          const segHeight = part.value * unitHeight;
          const segY = currentY;
          currentY += segHeight;
          return (
            <g key={`part-${i}`}>
              <rect
                x={padding}
                y={segY}
                width={barWidth}
                height={segHeight}
                fill={part.unknown ? "#f3f4f6" : getColor(i, part.color)}
                stroke="#374151"
                strokeWidth={1.5}
              />
              <text
                x={padding + barWidth / 2}
                y={segY + segHeight / 2 + 6}
                textAnchor="middle"
                fontSize={18}
                fill={part.unknown ? "#374151" : "white"}
                fontWeight="bold"
              >
                {part.unknown ? "?" : part.label || part.value}
              </text>
            </g>
          );
        })}
        {data.showTotal && (
          <text
            x={padding + barWidth / 2}
            y={height - 5}
            textAnchor="middle"
            fontSize={16}
            fontWeight="bold"
            fill="#374151"
          >
            Total: {total}
          </text>
        )}
      </svg>
    );
  }

  // Horizontal orientation (default)
  const unitWidth = barWidth / total;
  let currentX = padding;

  return (
    <svg width={width} height={height} className="bg-white rounded-lg border border-gray-200">
      {data.parts.map((part, i) => {
        const segWidth = part.value * unitWidth;
        const segX = currentX;
        currentX += segWidth;
        return (
          <g key={`part-${i}`}>
            <rect
              x={segX}
              y={barTop}
              width={segWidth}
              height={barHeight}
              fill={part.unknown ? "#f3f4f6" : getColor(i, part.color)}
              stroke="#374151"
              strokeWidth={1.5}
            />
            <text
              x={segX + segWidth / 2}
              y={barTop + barHeight / 2 + 6}
              textAnchor="middle"
              fontSize={18}
              fill={part.unknown ? "#374151" : "white"}
              fontWeight="bold"
            >
              {part.unknown ? "?" : part.label || part.value}
            </text>
          </g>
        );
      })}
      {data.showTotal && (
        <>
          <line
            x1={padding}
            y1={barTop + barHeight + 10}
            x2={padding + barWidth}
            y2={barTop + barHeight + 10}
            stroke="#374151"
            strokeWidth={1}
          />
          <text
            x={padding + barWidth / 2}
            y={barTop + barHeight + 28}
            textAnchor="middle"
            fontSize={16}
            fontWeight="bold"
            fill="#374151"
          >
            {total}
          </text>
        </>
      )}
    </svg>
  );
}

// ============ Area Model ============
function AreaModelRenderer({
  data,
  width,
  height,
}: {
  data: AreaModelDiagram;
  width: number;
  height: number;
}) {
  const padding = 50;
  const modelWidth = width - padding * 2;
  const modelHeight = height - padding * 2;

  const colWidths = data.partitionsX || [data.width];
  const rowHeights = data.partitionsY || [data.height];
  const totalWidth = colWidths.reduce((a, b) => a + b, 0);
  const totalHeight = rowHeights.reduce((a, b) => a + b, 0);

  const scaleX = (w: number) => (w / totalWidth) * modelWidth;
  const scaleY = (h: number) => (h / totalHeight) * modelHeight;

  let xOffset = padding;
  const cols = colWidths.map((w) => {
    const x = xOffset;
    xOffset += scaleX(w);
    return { x, width: scaleX(w) };
  });

  let yOffset = padding;
  const rows = rowHeights.map((h) => {
    const y = yOffset;
    yOffset += scaleY(h);
    return { y, height: scaleY(h) };
  });

  const highlightSet = new Set(
    (data.highlightCells || []).map(([r, c]) => `${r}-${c}`)
  );

  return (
    <svg width={width} height={height} className="bg-white rounded-lg border border-gray-200">
      {/* Grid cells */}
      {rows.map((row, ri) =>
        cols.map((col, ci) => (
          <rect
            key={`cell-${ri}-${ci}`}
            x={col.x}
            y={row.y}
            width={col.width}
            height={row.height}
            fill={highlightSet.has(`${ri}-${ci}`) ? "rgba(59, 130, 246, 0.2)" : "white"}
            stroke="#374151"
            strokeWidth={1.5}
          />
        ))
      )}

      {/* Top labels */}
      {data.labelsTop?.map((label, i) => (
        <text
          key={`top-${i}`}
          x={cols[i].x + cols[i].width / 2}
          y={padding - 12}
          textAnchor="middle"
          fontSize={18}
          fontWeight="bold"
          fill="#374151"
        >
          {label}
        </text>
      ))}

      {/* Side labels */}
      {data.labelsSide?.map((label, i) => (
        <text
          key={`side-${i}`}
          x={padding - 12}
          y={rows[i].y + rows[i].height / 2 + 6}
          textAnchor="end"
          fontSize={18}
          fontWeight="bold"
          fill="#374151"
        >
          {label}
        </text>
      ))}

      {/* Cell labels */}
      {data.cellLabels?.map((cell, i) => (
        <text
          key={`clabel-${i}`}
          x={cols[cell.col].x + cols[cell.col].width / 2}
          y={rows[cell.row].y + rows[cell.row].height / 2 + 6}
          textAnchor="middle"
          fontSize={18}
          fontWeight="bold"
          fill="#374151"
        >
          {cell.label}
        </text>
      ))}
    </svg>
  );
}

// ============ Tape Diagram ============
function TapeDiagramRenderer({
  data,
  width,
  height,
}: {
  data: TapeDiagramDiagram;
  width: number;
  height: number;
}) {
  const padding = 30;
  const tapeHeight = 40;
  const tapeGap = 20;
  const labelWidth = 60;

  const tapeWidth = width - padding * 2 - labelWidth;
  const totalHeight = data.tapes.length * (tapeHeight + tapeGap) - tapeGap;
  const startY = (height - totalHeight) / 2;

  return (
    <svg width={width} height={height} className="bg-white rounded-lg border border-gray-200">
      {data.tapes.map((tape, ti) => {
        const tapeY = startY + ti * (tapeHeight + tapeGap);
        const total = tape.segments.reduce((sum, s) => sum + s.value, 0);
        const unitWidth = tapeWidth / total;
        let segX = padding + labelWidth;

        return (
          <g key={`tape-${ti}`}>
            {/* Tape label */}
            {tape.label && (
              <text
                x={padding + labelWidth - 10}
                y={tapeY + tapeHeight / 2 + 6}
                textAnchor="end"
                fontSize={18}
                fontWeight="bold"
                fill="#374151"
              >
                {tape.label}
              </text>
            )}

            {/* Segments */}
            {tape.segments.map((seg, si) => {
              const segWidth = seg.value * unitWidth;
              const x = segX;
              segX += segWidth;
              return (
                <g key={`seg-${ti}-${si}`}>
                  <rect
                    x={x}
                    y={tapeY}
                    width={segWidth}
                    height={tapeHeight}
                    fill={seg.unknown ? "#f3f4f6" : getColor(si, seg.color)}
                    stroke="#374151"
                    strokeWidth={1.5}
                  />
                  <text
                    x={x + segWidth / 2}
                    y={tapeY + tapeHeight / 2 + 6}
                    textAnchor="middle"
                    fontSize={18}
                    fill={seg.unknown ? "#374151" : "white"}
                    fontWeight="bold"
                  >
                    {seg.unknown ? "?" : seg.label || seg.value}
                  </text>
                </g>
              );
            })}
          </g>
        );
      })}

      {/* Braces for comparison */}
      {data.showBraces && data.tapes.length >= 2 && (
        <path
          d={`M ${width - padding - 5} ${startY}
              Q ${width - padding + 10} ${startY + totalHeight / 2}
              ${width - padding - 5} ${startY + totalHeight}`}
          fill="none"
          stroke="#374151"
          strokeWidth={2}
        />
      )}
    </svg>
  );
}

// ============ Angle ============
function AngleRenderer({
  data,
  width,
  height,
}: {
  data: AngleDiagram;
  width: number;
  height: number;
}) {
  const cx = width / 2;
  const cy = height / 2 + 20;
  const scale = Math.min(width, height) * 0.35;

  return (
    <svg width={width} height={height} className="bg-white rounded-lg border border-gray-200">
      {/* Rays */}
      {data.rays.map((ray, i) => {
        const rad = (ray.angle * Math.PI) / 180;
        const endX = cx + ray.length * scale * 0.01 * Math.cos(rad);
        const endY = cy - ray.length * scale * 0.01 * Math.sin(rad);
        return (
          <g key={`ray-${i}`}>
            <line
              x1={cx}
              y1={cy}
              x2={endX}
              y2={endY}
              stroke="#374151"
              strokeWidth={2}
            />
            {ray.label && (
              <text
                x={endX + 12 * Math.cos(rad)}
                y={endY - 12 * Math.sin(rad)}
                fontSize={16}
                fontWeight="bold"
                fill="#374151"
              >
                {ray.label}
              </text>
            )}
          </g>
        );
      })}

      {/* Angle arc */}
      {data.showArc && data.rays.length >= 2 && (
        <path
          d={(() => {
            const r = 30;
            const a1 = (data.rays[0].angle * Math.PI) / 180;
            const a2 = (data.rays[1].angle * Math.PI) / 180;
            const x1 = cx + r * Math.cos(a1);
            const y1 = cy - r * Math.sin(a1);
            const x2 = cx + r * Math.cos(a2);
            const y2 = cy - r * Math.sin(a2);
            const sweep = a2 > a1 ? 0 : 1;
            return `M ${x1} ${y1} A ${r} ${r} 0 0 ${sweep} ${x2} ${y2}`;
          })()}
          fill="none"
          stroke="#ef4444"
          strokeWidth={2}
        />
      )}

      {/* Angle measure label */}
      {data.measure && (
        <text
          x={cx + 50}
          y={cy - 18}
          fontSize={18}
          fill="#ef4444"
          fontWeight="bold"
        >
          {data.measure}°
        </text>
      )}

      {/* Vertex point */}
      <circle cx={cx} cy={cy} r={3} fill="#374151" />

      {/* Custom label */}
      {data.label && (
        <text
          x={cx}
          y={height - 15}
          textAnchor="middle"
          fontSize={18}
          fontWeight="bold"
          fill="#374151"
        >
          {data.label}
        </text>
      )}
    </svg>
  );
}

// ============ Circle Graph (Pie Chart) ============
function CircleGraphRenderer({
  data,
  width,
  height,
}: {
  data: CircleGraphDiagram;
  width: number;
  height: number;
}) {
  const cx = width / 2;
  const cy = height / 2 + (data.title ? 10 : 0);
  const radius = Math.min(width, height) * 0.35;
  const total = data.sections.reduce((sum, s) => sum + s.value, 0);

  let startAngle = -90; // Start from top

  const sections = data.sections.map((section, i) => {
    const angle = (section.value / total) * 360;
    const endAngle = startAngle + angle;
    const largeArc = angle > 180 ? 1 : 0;

    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;

    const x1 = cx + radius * Math.cos(startRad);
    const y1 = cy + radius * Math.sin(startRad);
    const x2 = cx + radius * Math.cos(endRad);
    const y2 = cy + radius * Math.sin(endRad);

    const midRad = ((startAngle + endAngle) / 2 * Math.PI) / 180;
    const labelX = cx + radius * 0.7 * Math.cos(midRad);
    const labelY = cy + radius * 0.7 * Math.sin(midRad);

    const path = `M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;

    startAngle = endAngle;

    return {
      path,
      color: getColor(i, section.color),
      label: section.label,
      value: section.value,
      percent: ((section.value / total) * 100).toFixed(1),
      labelX,
      labelY,
    };
  });

  return (
    <svg width={width} height={height} className="bg-white rounded-lg border border-gray-200">
      {/* Title */}
      {data.title && (
        <text
          x={cx}
          y={28}
          textAnchor="middle"
          fontSize={20}
          fontWeight="bold"
          fill="#374151"
        >
          {data.title}
        </text>
      )}

      {/* Pie sections */}
      {sections.map((section, i) => (
        <g key={`section-${i}`}>
          <path d={section.path} fill={section.color} stroke="white" strokeWidth={2} />
          {/* Labels */}
          {(section.label || data.showPercents || data.showValues) && (
            <text
              x={section.labelX}
              y={section.labelY}
              textAnchor="middle"
              fontSize={14}
              fill="white"
              fontWeight="bold"
            >
              {data.showPercents
                ? `${section.percent}%`
                : data.showValues
                ? section.value
                : section.label}
            </text>
          )}
        </g>
      ))}

      {/* Legend */}
      {sections.some((s) => s.label) && (
        <g transform={`translate(${width - 110}, ${cy - sections.length * 12})`}>
          {sections.map((section, i) => (
            <g key={`legend-${i}`} transform={`translate(0, ${i * 24})`}>
              <rect width={14} height={14} fill={section.color} />
              <text x={18} y={12} fontSize={14} fontWeight="600" fill="#374151">
                {section.label}
              </text>
            </g>
          ))}
        </g>
      )}
    </svg>
  );
}

// ============ Main Renderer ============
export function DiagramRenderer({
  type,
  data,
  width = 400,
  height = 300,
  className = "",
}: DiagramRendererProps) {
  const rendererMap: Record<DiagramType, React.ReactElement> = {
    coordinate_plane: (
      <CoordinatePlaneRenderer
        data={data as CoordinatePlaneDiagram}
        width={width}
        height={height}
      />
    ),
    geometry: (
      <GeometryRenderer
        data={data as GeometryDiagram}
        width={width}
        height={height}
      />
    ),
    number_line: (
      <NumberLineRenderer
        data={data as NumberLineDiagram}
        width={width}
        height={height}
      />
    ),
    bar_model: (
      <BarModelRenderer
        data={data as BarModelDiagram}
        width={width}
        height={height}
      />
    ),
    area_model: (
      <AreaModelRenderer
        data={data as AreaModelDiagram}
        width={width}
        height={height}
      />
    ),
    tape_diagram: (
      <TapeDiagramRenderer
        data={data as TapeDiagramDiagram}
        width={width}
        height={height}
      />
    ),
    angle: (
      <AngleRenderer data={data as AngleDiagram} width={width} height={height} />
    ),
    circle_graph: (
      <CircleGraphRenderer
        data={data as CircleGraphDiagram}
        width={width}
        height={height}
      />
    ),
  };

  return (
    <div className={`diagram-container inline-block ${className}`}>
      {rendererMap[type] || (
        <div className="text-red-500">Unknown diagram type: {type}</div>
      )}
    </div>
  );
}
