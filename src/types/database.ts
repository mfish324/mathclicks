/**
 * Database types for Supabase
 * These types mirror the schema.sql structure
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type ProblemSource =
  | 'ai_generated'
  | 'public_domain'
  | 'engage_ny'
  | 'illustrative_math'
  | 'teacher_created';

export type LicenseType =
  | 'public_domain'
  | 'cc0'
  | 'cc_by'
  | 'cc_by_sa'
  | 'cc_by_nc';

export type AnswerType =
  | 'integer'
  | 'decimal'
  | 'fraction'
  | 'expression'
  | 'coordinate'
  | 'multiple_choice'
  | 'true_false';

export interface Database {
  public: {
    Tables: {
      standards: {
        Row: {
          id: string;
          code: string;
          title: string;
          description: string;
          grade_level: number;
          domain: string;
          domain_name: string | null;
          examples: string[] | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          code: string;
          title: string;
          description: string;
          grade_level: number;
          domain: string;
          domain_name?: string | null;
          examples?: string[] | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          code?: string;
          title?: string;
          description?: string;
          grade_level?: number;
          domain?: string;
          domain_name?: string | null;
          examples?: string[] | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      standards_crosswalk: {
        Row: {
          id: string;
          external_code: string;
          external_source: string;
          internal_standard_id: string | null;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          external_code: string;
          external_source: string;
          internal_standard_id?: string | null;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          external_code?: string;
          external_source?: string;
          internal_standard_id?: string | null;
          notes?: string | null;
          created_at?: string;
        };
      };
      problems: {
        Row: {
          id: string;
          tier: number;
          problem_text: string;
          problem_latex: string | null;
          answer: string;
          answer_type: AnswerType;
          acceptable_answers: string[] | null;
          solution_steps: string[];
          hints: string[];
          common_mistakes: string[] | null;
          primary_standard_id: string | null;
          secondary_standard_ids: string[] | null;
          topic: string | null;
          source: ProblemSource;
          source_url: string | null;
          source_reference: string | null;
          license: LicenseType;
          attribution: string | null;
          is_reviewed: boolean;
          reviewed_by: string | null;
          reviewed_at: string | null;
          quality_score: number | null;
          usage_count: number;
          success_rate: number | null;
          avg_time_seconds: number | null;
          created_at: string;
          updated_at: string;
          created_by: string | null;
          is_active: boolean;
        };
        Insert: {
          id?: string;
          tier: number;
          problem_text: string;
          problem_latex?: string | null;
          answer: string;
          answer_type?: AnswerType;
          acceptable_answers?: string[] | null;
          solution_steps: string[];
          hints: string[];
          common_mistakes?: string[] | null;
          primary_standard_id?: string | null;
          secondary_standard_ids?: string[] | null;
          topic?: string | null;
          source?: ProblemSource;
          source_url?: string | null;
          source_reference?: string | null;
          license?: LicenseType;
          attribution?: string | null;
          is_reviewed?: boolean;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          quality_score?: number | null;
          usage_count?: number;
          success_rate?: number | null;
          avg_time_seconds?: number | null;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
          is_active?: boolean;
        };
        Update: {
          id?: string;
          tier?: number;
          problem_text?: string;
          problem_latex?: string | null;
          answer?: string;
          answer_type?: AnswerType;
          acceptable_answers?: string[] | null;
          solution_steps?: string[];
          hints?: string[];
          common_mistakes?: string[] | null;
          primary_standard_id?: string | null;
          secondary_standard_ids?: string[] | null;
          topic?: string | null;
          source?: ProblemSource;
          source_url?: string | null;
          source_reference?: string | null;
          license?: LicenseType;
          attribution?: string | null;
          is_reviewed?: boolean;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          quality_score?: number | null;
          usage_count?: number;
          success_rate?: number | null;
          avg_time_seconds?: number | null;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
          is_active?: boolean;
        };
      };
      students: {
        Row: {
          id: string;
          local_id: string | null;
          name: string | null;
          display_name: string | null;
          grade_level: number | null;
          total_xp: number;
          current_level: number;
          current_streak: number;
          longest_streak: number;
          problems_solved: number;
          problems_attempted: number;
          preferred_difficulty: number;
          created_at: string;
          updated_at: string;
          last_activity_at: string;
        };
        Insert: {
          id?: string;
          local_id?: string | null;
          name?: string | null;
          display_name?: string | null;
          grade_level?: number | null;
          total_xp?: number;
          current_level?: number;
          current_streak?: number;
          longest_streak?: number;
          problems_solved?: number;
          problems_attempted?: number;
          preferred_difficulty?: number;
          created_at?: string;
          updated_at?: string;
          last_activity_at?: string;
        };
        Update: {
          id?: string;
          local_id?: string | null;
          name?: string | null;
          display_name?: string | null;
          grade_level?: number | null;
          total_xp?: number;
          current_level?: number;
          current_streak?: number;
          longest_streak?: number;
          problems_solved?: number;
          problems_attempted?: number;
          preferred_difficulty?: number;
          created_at?: string;
          updated_at?: string;
          last_activity_at?: string;
        };
      };
      student_standard_mastery: {
        Row: {
          id: string;
          student_id: string;
          standard_id: string;
          current_tier: number;
          problems_attempted: number;
          problems_correct: number;
          consecutive_correct: number;
          consecutive_incorrect: number;
          last_tier_change_at: string | null;
          times_tier_up: number;
          times_tier_down: number;
          avg_time_seconds: number | null;
          last_practiced_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          student_id: string;
          standard_id: string;
          current_tier?: number;
          problems_attempted?: number;
          problems_correct?: number;
          consecutive_correct?: number;
          consecutive_incorrect?: number;
          last_tier_change_at?: string | null;
          times_tier_up?: number;
          times_tier_down?: number;
          avg_time_seconds?: number | null;
          last_practiced_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          student_id?: string;
          standard_id?: string;
          current_tier?: number;
          problems_attempted?: number;
          problems_correct?: number;
          consecutive_correct?: number;
          consecutive_incorrect?: number;
          last_tier_change_at?: string | null;
          times_tier_up?: number;
          times_tier_down?: number;
          avg_time_seconds?: number | null;
          last_practiced_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      problem_attempts: {
        Row: {
          id: string;
          student_id: string | null;
          problem_id: string | null;
          standard_id: string | null;
          student_answer: string;
          is_correct: boolean;
          time_spent_seconds: number | null;
          hints_used: number;
          tier_at_attempt: number | null;
          session_id: string | null;
          error_type: string | null;
          feedback_given: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          student_id?: string | null;
          problem_id?: string | null;
          standard_id?: string | null;
          student_answer: string;
          is_correct: boolean;
          time_spent_seconds?: number | null;
          hints_used?: number;
          tier_at_attempt?: number | null;
          session_id?: string | null;
          error_type?: string | null;
          feedback_given?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          student_id?: string | null;
          problem_id?: string | null;
          standard_id?: string | null;
          student_answer?: string;
          is_correct?: boolean;
          time_spent_seconds?: number | null;
          hints_used?: number;
          tier_at_attempt?: number | null;
          session_id?: string | null;
          error_type?: string | null;
          feedback_given?: string | null;
          created_at?: string;
        };
      };
      classes: {
        Row: {
          id: string;
          code: string;
          name: string;
          teacher_name: string | null;
          grade_level: number | null;
          default_difficulty: number;
          active_standard_ids: string[] | null;
          created_at: string;
          updated_at: string;
          is_active: boolean;
        };
        Insert: {
          id?: string;
          code: string;
          name: string;
          teacher_name?: string | null;
          grade_level?: number | null;
          default_difficulty?: number;
          active_standard_ids?: string[] | null;
          created_at?: string;
          updated_at?: string;
          is_active?: boolean;
        };
        Update: {
          id?: string;
          code?: string;
          name?: string;
          teacher_name?: string | null;
          grade_level?: number | null;
          default_difficulty?: number;
          active_standard_ids?: string[] | null;
          created_at?: string;
          updated_at?: string;
          is_active?: boolean;
        };
      };
      class_students: {
        Row: {
          id: string;
          class_id: string;
          student_id: string;
          joined_at: string;
          is_active: boolean;
        };
        Insert: {
          id?: string;
          class_id: string;
          student_id: string;
          joined_at?: string;
          is_active?: boolean;
        };
        Update: {
          id?: string;
          class_id?: string;
          student_id?: string;
          joined_at?: string;
          is_active?: boolean;
        };
      };
      class_sessions: {
        Row: {
          id: string;
          class_id: string;
          session_code: string;
          standard_ids: string[] | null;
          difficulty: number | null;
          problem_count: number;
          started_at: string;
          ended_at: string | null;
          is_active: boolean;
        };
        Insert: {
          id?: string;
          class_id: string;
          session_code: string;
          standard_ids?: string[] | null;
          difficulty?: number | null;
          problem_count?: number;
          started_at?: string;
          ended_at?: string | null;
          is_active?: boolean;
        };
        Update: {
          id?: string;
          class_id?: string;
          session_code?: string;
          standard_ids?: string[] | null;
          difficulty?: number | null;
          problem_count?: number;
          started_at?: string;
          ended_at?: string | null;
          is_active?: boolean;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      problem_source: ProblemSource;
      license_type: LicenseType;
      answer_type: AnswerType;
    };
  };
}

// Convenience types for common operations
export type Standard = Database['public']['Tables']['standards']['Row'];
export type StandardInsert = Database['public']['Tables']['standards']['Insert'];
export type Problem = Database['public']['Tables']['problems']['Row'];
export type ProblemInsert = Database['public']['Tables']['problems']['Insert'];
export type Student = Database['public']['Tables']['students']['Row'];
export type StudentInsert = Database['public']['Tables']['students']['Insert'];
export type StudentMastery = Database['public']['Tables']['student_standard_mastery']['Row'];
export type StudentMasteryInsert = Database['public']['Tables']['student_standard_mastery']['Insert'];
export type ProblemAttempt = Database['public']['Tables']['problem_attempts']['Row'];
export type ProblemAttemptInsert = Database['public']['Tables']['problem_attempts']['Insert'];
export type Class = Database['public']['Tables']['classes']['Row'];
export type ClassInsert = Database['public']['Tables']['classes']['Insert'];
