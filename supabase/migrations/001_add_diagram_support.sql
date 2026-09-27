-- Migration: Add diagram support to problems table
-- Run this in Supabase SQL Editor to add diagram capabilities

-- Create enum for diagram types (skipped if it already exists, so this is safe to re-run)
DO $$
BEGIN
  CREATE TYPE diagram_type AS ENUM (
    'coordinate_plane',
    'geometry',
    'number_line',
    'bar_model',
    'area_model',
    'tape_diagram',
    'angle',
    'circle_graph'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Add diagram columns to problems table
ALTER TABLE problems
ADD COLUMN IF NOT EXISTS diagram_type diagram_type,
ADD COLUMN IF NOT EXISTS diagram_data JSONB;

-- Add index for querying problems with diagrams
CREATE INDEX IF NOT EXISTS idx_problems_diagram_type
ON problems(diagram_type)
WHERE diagram_type IS NOT NULL;

-- Add comment explaining diagram_data structure
COMMENT ON COLUMN problems.diagram_data IS 'JSON structure for diagram rendering. Schema depends on diagram_type:

coordinate_plane: {
  gridRange: {xMin, xMax, yMin, yMax},
  points: [{x, y, label?, color?}],
  lines: [{start: [x,y], end: [x,y], label?, color?, style?}],
  functions: [{equation: "y=2x+1", color?}],
  segments: [{start: [x,y], end: [x,y]}],
  vectors: [{start: [x,y], end: [x,y], label?}]
}

geometry: {
  shapes: [{
    type: "triangle"|"rectangle"|"circle"|"polygon",
    vertices?: [[x,y], ...],
    center?: [x,y],
    radius?: number,
    width?: number,
    height?: number,
    labels?: {sides?: [], angles?: [], vertices?: []},
    showMeasurements?: boolean
  }],
  angles: [{vertex: [x,y], ray1: [x,y], ray2: [x,y], measure?: number, label?}],
  lines: [{start: [x,y], end: [x,y], label?}]
}

number_line: {
  min: number,
  max: number,
  step: number,
  points: [{value: number, label?, color?, style?}],
  intervals: [{start, end, label?, color?}],
  arrows: [{from, to, label?}]
}

bar_model: {
  total?: number,
  parts: [{value: number, label?, color?}],
  showTotal?: boolean,
  orientation?: "horizontal"|"vertical"
}

area_model: {
  width: number,
  height: number,
  partitionsX: number[],
  partitionsY: number[],
  labels?: {top?: [], side?: []},
  highlightCells?: [[row, col], ...]
}

tape_diagram: {
  tapes: [{
    label?: string,
    segments: [{value: number, label?, color?}]
  }]
}

angle: {
  measure?: number,
  showArc: boolean,
  label?: string,
  rays: [{angle: number, length: number, label?}]
}

circle_graph: {
  sections: [{value: number, label?, color?}],
  showPercents?: boolean
}
';
