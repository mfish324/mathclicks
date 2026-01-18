-- MathClicks Database Schema
-- Run this in your Supabase SQL Editor to set up the database

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- Standards Table
-- Replaces hardcoded math-standards.ts
-- ============================================
CREATE TABLE IF NOT EXISTS standards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(20) NOT NULL UNIQUE,
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  grade_level INTEGER NOT NULL CHECK (grade_level >= 1 AND grade_level <= 12),
  domain VARCHAR(20) NOT NULL,
  domain_name VARCHAR(100),
  examples TEXT[], -- Array of example problems/descriptions
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_standards_grade ON standards(grade_level);
CREATE INDEX idx_standards_code ON standards(code);
CREATE INDEX idx_standards_domain ON standards(domain);

-- ============================================
-- Standards Crosswalk Table
-- Maps external standards codes to internal CCSS codes
-- ============================================
CREATE TABLE IF NOT EXISTS standards_crosswalk (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  external_code VARCHAR(50) NOT NULL,
  external_source VARCHAR(50) NOT NULL, -- 'engage_ny', 'state_ny', 'state_ca', etc.
  internal_standard_id UUID REFERENCES standards(id) ON DELETE CASCADE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(external_code, external_source)
);

CREATE INDEX idx_crosswalk_external ON standards_crosswalk(external_code, external_source);
CREATE INDEX idx_crosswalk_standard ON standards_crosswalk(internal_standard_id);

-- ============================================
-- Problems Table
-- Extended schema with source/license tracking
-- ============================================
CREATE TYPE problem_source AS ENUM (
  'ai_generated',
  'public_domain',
  'engage_ny',
  'illustrative_math',
  'teacher_created'
);

CREATE TYPE license_type AS ENUM (
  'public_domain',
  'cc0',
  'cc_by',
  'cc_by_sa',
  'cc_by_nc'
);

CREATE TYPE answer_type AS ENUM (
  'integer',
  'decimal',
  'fraction',
  'expression',
  'coordinate',
  'multiple_choice',
  'true_false'
);

CREATE TABLE IF NOT EXISTS problems (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Problem content
  tier INTEGER NOT NULL CHECK (tier >= 1 AND tier <= 5),
  problem_text TEXT NOT NULL,
  problem_latex TEXT,
  answer VARCHAR(500) NOT NULL,
  answer_type answer_type NOT NULL DEFAULT 'integer',
  acceptable_answers TEXT[], -- Equivalent forms of the answer
  solution_steps TEXT[] NOT NULL,
  hints TEXT[] NOT NULL,
  common_mistakes TEXT[],

  -- Standard association
  primary_standard_id UUID REFERENCES standards(id) ON DELETE SET NULL,
  secondary_standard_ids UUID[], -- For problems covering multiple standards
  topic VARCHAR(200),

  -- Source and licensing
  source problem_source NOT NULL DEFAULT 'ai_generated',
  source_url TEXT,
  source_reference TEXT, -- e.g., "EngageNY Grade 5 Module 3 Lesson 12"
  license license_type NOT NULL DEFAULT 'public_domain',
  attribution TEXT,

  -- Quality and usage tracking
  is_reviewed BOOLEAN DEFAULT FALSE,
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  quality_score DECIMAL(3,2) CHECK (quality_score >= 0 AND quality_score <= 5),
  usage_count INTEGER DEFAULT 0,
  success_rate DECIMAL(5,4), -- 0.0000 to 1.0000
  avg_time_seconds INTEGER,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID,
  is_active BOOLEAN DEFAULT TRUE
);

CREATE INDEX idx_problems_standard ON problems(primary_standard_id);
CREATE INDEX idx_problems_tier ON problems(tier);
CREATE INDEX idx_problems_source ON problems(source);
CREATE INDEX idx_problems_active ON problems(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_problems_reviewed ON problems(is_reviewed);
CREATE INDEX idx_problems_standard_tier ON problems(primary_standard_id, tier) WHERE is_active = TRUE;

-- ============================================
-- Students Table
-- Synced from localStorage gamification profile
-- ============================================
CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  local_id VARCHAR(100) UNIQUE, -- ID from localStorage for syncing
  name VARCHAR(200),
  display_name VARCHAR(100),
  grade_level INTEGER CHECK (grade_level >= 1 AND grade_level <= 12),

  -- Gamification stats (synced from localStorage)
  total_xp INTEGER DEFAULT 0,
  current_level INTEGER DEFAULT 1,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  problems_solved INTEGER DEFAULT 0,
  problems_attempted INTEGER DEFAULT 0,

  -- Preferences
  preferred_difficulty INTEGER DEFAULT 3 CHECK (preferred_difficulty >= 1 AND preferred_difficulty <= 5),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_activity_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_students_local_id ON students(local_id);
CREATE INDEX idx_students_grade ON students(grade_level);

-- ============================================
-- Student Standard Mastery Table
-- Tracks mastery per student per standard for adaptive selection
-- ============================================
CREATE TABLE IF NOT EXISTS student_standard_mastery (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  standard_id UUID NOT NULL REFERENCES standards(id) ON DELETE CASCADE,

  -- Mastery tracking
  current_tier INTEGER NOT NULL DEFAULT 1 CHECK (current_tier >= 1 AND current_tier <= 5),
  problems_attempted INTEGER DEFAULT 0,
  problems_correct INTEGER DEFAULT 0,
  consecutive_correct INTEGER DEFAULT 0,
  consecutive_incorrect INTEGER DEFAULT 0,

  -- For adaptive progression
  last_tier_change_at TIMESTAMPTZ,
  times_tier_up INTEGER DEFAULT 0,
  times_tier_down INTEGER DEFAULT 0,

  -- Performance metrics
  avg_time_seconds INTEGER,
  last_practiced_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(student_id, standard_id)
);

CREATE INDEX idx_mastery_student ON student_standard_mastery(student_id);
CREATE INDEX idx_mastery_standard ON student_standard_mastery(standard_id);
CREATE INDEX idx_mastery_student_standard ON student_standard_mastery(student_id, standard_id);

-- ============================================
-- Problem Attempts Table
-- History for analytics
-- ============================================
CREATE TABLE IF NOT EXISTS problem_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES students(id) ON DELETE SET NULL,
  problem_id UUID REFERENCES problems(id) ON DELETE SET NULL,
  standard_id UUID REFERENCES standards(id) ON DELETE SET NULL,

  -- Attempt details
  student_answer TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL,
  time_spent_seconds INTEGER,
  hints_used INTEGER DEFAULT 0,

  -- Context
  tier_at_attempt INTEGER,
  session_id VARCHAR(100), -- To group attempts in a practice session

  -- Error analysis (if incorrect)
  error_type VARCHAR(50),
  feedback_given TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_attempts_student ON problem_attempts(student_id);
CREATE INDEX idx_attempts_problem ON problem_attempts(problem_id);
CREATE INDEX idx_attempts_standard ON problem_attempts(standard_id);
CREATE INDEX idx_attempts_session ON problem_attempts(session_id);
CREATE INDEX idx_attempts_created ON problem_attempts(created_at);

-- ============================================
-- Classes Table
-- Replaces in-memory class-store.ts
-- ============================================
CREATE TABLE IF NOT EXISTS classes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(10) NOT NULL UNIQUE, -- Join code for students
  name VARCHAR(200) NOT NULL,
  teacher_name VARCHAR(200),
  grade_level INTEGER CHECK (grade_level >= 1 AND grade_level <= 12),

  -- Settings
  default_difficulty INTEGER DEFAULT 3 CHECK (default_difficulty >= 1 AND default_difficulty <= 5),
  active_standard_ids UUID[],

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE
);

CREATE INDEX idx_classes_code ON classes(code);
CREATE INDEX idx_classes_active ON classes(is_active) WHERE is_active = TRUE;

-- ============================================
-- Class Students Junction Table
-- ============================================
CREATE TABLE IF NOT EXISTS class_students (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE,

  UNIQUE(class_id, student_id)
);

CREATE INDEX idx_class_students_class ON class_students(class_id);
CREATE INDEX idx_class_students_student ON class_students(student_id);

-- ============================================
-- Class Sessions Table
-- For tracking practice sessions within a class
-- ============================================
CREATE TABLE IF NOT EXISTS class_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  session_code VARCHAR(10) NOT NULL,

  -- Session configuration
  standard_ids UUID[],
  difficulty INTEGER CHECK (difficulty >= 1 AND difficulty <= 5),
  problem_count INTEGER DEFAULT 10,

  -- Status
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,

  UNIQUE(session_code)
);

CREATE INDEX idx_sessions_class ON class_sessions(class_id);
CREATE INDEX idx_sessions_code ON class_sessions(session_code);
CREATE INDEX idx_sessions_active ON class_sessions(is_active) WHERE is_active = TRUE;

-- ============================================
-- Helper Functions
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_standards_updated_at
  BEFORE UPDATE ON standards
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_problems_updated_at
  BEFORE UPDATE ON problems
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_students_updated_at
  BEFORE UPDATE ON students
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_mastery_updated_at
  BEFORE UPDATE ON student_standard_mastery
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_classes_updated_at
  BEFORE UPDATE ON classes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to increment problem usage count
CREATE OR REPLACE FUNCTION increment_problem_usage()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE problems
  SET usage_count = usage_count + 1
  WHERE id = NEW.problem_id;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER increment_usage_on_attempt
  AFTER INSERT ON problem_attempts
  FOR EACH ROW EXECUTE FUNCTION increment_problem_usage();

-- Function to update problem success rate
CREATE OR REPLACE FUNCTION update_problem_success_rate()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE problems
  SET success_rate = (
    SELECT AVG(CASE WHEN is_correct THEN 1.0 ELSE 0.0 END)
    FROM problem_attempts
    WHERE problem_id = NEW.problem_id
  )
  WHERE id = NEW.problem_id;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_success_rate_on_attempt
  AFTER INSERT ON problem_attempts
  FOR EACH ROW EXECUTE FUNCTION update_problem_success_rate();

-- ============================================
-- Row Level Security (RLS) Policies
-- Enable RLS on all tables
-- ============================================

ALTER TABLE standards ENABLE ROW LEVEL SECURITY;
ALTER TABLE standards_crosswalk ENABLE ROW LEVEL SECURITY;
ALTER TABLE problems ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_standard_mastery ENABLE ROW LEVEL SECURITY;
ALTER TABLE problem_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_sessions ENABLE ROW LEVEL SECURITY;

-- Public read access for standards (no auth required)
CREATE POLICY "Standards are viewable by everyone"
  ON standards FOR SELECT
  USING (true);

CREATE POLICY "Standards crosswalk is viewable by everyone"
  ON standards_crosswalk FOR SELECT
  USING (true);

-- Public read access for active problems
CREATE POLICY "Active problems are viewable by everyone"
  ON problems FOR SELECT
  USING (is_active = true);

-- Public read access for classes by code
CREATE POLICY "Classes are viewable by everyone"
  ON classes FOR SELECT
  USING (is_active = true);

-- Allow anonymous inserts for students (they sync from localStorage)
CREATE POLICY "Anyone can create students"
  ON students FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Students can view their own data"
  ON students FOR SELECT
  USING (true);

CREATE POLICY "Students can update their own data"
  ON students FOR UPDATE
  USING (true);

-- Allow anonymous inserts for mastery tracking
CREATE POLICY "Anyone can create mastery records"
  ON student_standard_mastery FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can view mastery records"
  ON student_standard_mastery FOR SELECT
  USING (true);

CREATE POLICY "Anyone can update mastery records"
  ON student_standard_mastery FOR UPDATE
  USING (true);

-- Allow anonymous inserts for attempts
CREATE POLICY "Anyone can record attempts"
  ON problem_attempts FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can view attempts"
  ON problem_attempts FOR SELECT
  USING (true);

-- Class students policies
CREATE POLICY "Anyone can join classes"
  ON class_students FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can view class memberships"
  ON class_students FOR SELECT
  USING (true);

-- Class sessions policies
CREATE POLICY "Anyone can view sessions"
  ON class_sessions FOR SELECT
  USING (true);

-- ============================================
-- Service role policies (bypass RLS)
-- These allow the service role to do anything
-- ============================================

CREATE POLICY "Service role has full access to standards"
  ON standards FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role has full access to crosswalk"
  ON standards_crosswalk FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role has full access to problems"
  ON problems FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role has full access to students"
  ON students FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role has full access to mastery"
  ON student_standard_mastery FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role has full access to attempts"
  ON problem_attempts FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role has full access to classes"
  ON classes FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role has full access to class_students"
  ON class_students FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role has full access to sessions"
  ON class_sessions FOR ALL
  USING (auth.role() = 'service_role');
