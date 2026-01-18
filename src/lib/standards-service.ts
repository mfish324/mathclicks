/**
 * Database-backed standards service
 * Replaces hardcoded math-standards.ts with Supabase queries
 * Falls back to hardcoded standards if Supabase is not configured
 */

import { getSupabaseAdmin, isSupabaseConfigured } from './supabase';
import type { Standard } from '../types/database';
import {
  STANDARDS_BY_GRADE,
  getStandardsForGrade as getHardcodedStandards,
  getStandardByCode as getHardcodedStandardByCode,
  searchStandards as searchHardcodedStandards,
  getAvailableGrades as getHardcodedGrades,
  type MathStandard,
  type StandardCategory,
} from './math-standards';

// Cache for standards to avoid repeated DB calls
let standardsCache: Map<number, Standard[]> | null = null;
let cacheTimestamp: number = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// Domain name mappings
const DOMAIN_NAMES: Record<string, string> = {
  'OA': 'Operations & Algebraic Thinking',
  'NBT': 'Number & Operations in Base Ten',
  'NF': 'Number & Operations - Fractions',
  'G': 'Geometry',
  'RP': 'Ratios & Proportional Relationships',
  'NS': 'The Number System',
  'EE': 'Expressions & Equations',
  'F': 'Functions',
  'A-SSE': 'Seeing Structure in Expressions',
  'A-REI': 'Reasoning with Equations & Inequalities',
  'A-CED': 'Creating Equations',
  'F-IF': 'Interpreting Functions',
  'F-BF': 'Building Functions',
};

/**
 * Convert database Standard to MathStandard format for compatibility
 */
function dbStandardToMathStandard(std: Standard): MathStandard {
  return {
    code: std.code,
    title: std.title,
    description: std.description,
    gradeLevel: std.grade_level,
    domain: std.domain,
    examples: std.examples || undefined,
  };
}

/**
 * Check if cache is still valid
 */
function isCacheValid(): boolean {
  return standardsCache !== null && Date.now() - cacheTimestamp < CACHE_TTL_MS;
}

/**
 * Clear the standards cache
 */
export function clearStandardsCache(): void {
  standardsCache = null;
  cacheTimestamp = 0;
}

/**
 * Fetch all standards from database and cache them
 */
async function fetchAndCacheStandards(): Promise<Map<number, Standard[]>> {
  if (isCacheValid() && standardsCache) {
    return standardsCache;
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('standards')
    .select('*')
    .order('grade_level')
    .order('code');

  if (error) {
    console.error('Failed to fetch standards from database:', error);
    throw error;
  }

  // Group by grade level
  const byGrade = new Map<number, Standard[]>();
  for (const std of data || []) {
    const grade = std.grade_level;
    if (!byGrade.has(grade)) {
      byGrade.set(grade, []);
    }
    byGrade.get(grade)!.push(std);
  }

  standardsCache = byGrade;
  cacheTimestamp = Date.now();
  return byGrade;
}

/**
 * Get all standards for a specific grade level
 * Falls back to hardcoded if Supabase not configured
 */
export async function getStandardsForGrade(grade: number): Promise<MathStandard[]> {
  if (!isSupabaseConfigured()) {
    return getHardcodedStandards(grade);
  }

  try {
    const cache = await fetchAndCacheStandards();
    const dbStandards = cache.get(grade) || [];
    return dbStandards.map(dbStandardToMathStandard);
  } catch (error) {
    console.warn('Falling back to hardcoded standards:', error);
    return getHardcodedStandards(grade);
  }
}

/**
 * Get standards organized by domain for a grade
 */
export async function getStandardsByDomain(grade: number): Promise<StandardCategory[]> {
  const standards = await getStandardsForGrade(grade);
  const domains = new Map<string, MathStandard[]>();

  for (const std of standards) {
    if (!domains.has(std.domain)) {
      domains.set(std.domain, []);
    }
    domains.get(std.domain)!.push(std);
  }

  return Array.from(domains.entries()).map(([domain, stds]) => ({
    domain,
    domainName: DOMAIN_NAMES[domain] || domain,
    standards: stds,
  }));
}

/**
 * Get a specific standard by code
 */
export async function getStandardByCode(code: string): Promise<MathStandard | null> {
  if (!isSupabaseConfigured()) {
    return getHardcodedStandardByCode(code);
  }

  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('standards')
      .select('*')
      .eq('code', code)
      .single();

    if (error || !data) {
      return getHardcodedStandardByCode(code);
    }

    return dbStandardToMathStandard(data);
  } catch (error) {
    console.warn('Falling back to hardcoded standard:', error);
    return getHardcodedStandardByCode(code);
  }
}

/**
 * Get standard by database ID
 */
export async function getStandardById(id: string): Promise<Standard | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('standards')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) {
    return null;
  }

  return data;
}

/**
 * Get standard ID by code
 */
export async function getStandardIdByCode(code: string): Promise<string | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('standards')
    .select('id')
    .eq('code', code)
    .single();

  if (error || !data) {
    return null;
  }

  return data.id;
}

/**
 * Search standards by keyword
 */
export async function searchStandards(
  query: string,
  gradeFilter?: number
): Promise<MathStandard[]> {
  if (!isSupabaseConfigured()) {
    return searchHardcodedStandards(query, gradeFilter);
  }

  try {
    const supabase = getSupabaseAdmin();
    let queryBuilder = supabase
      .from('standards')
      .select('*')
      .or(`code.ilike.%${query}%,title.ilike.%${query}%,description.ilike.%${query}%`);

    if (gradeFilter) {
      queryBuilder = queryBuilder.eq('grade_level', gradeFilter);
    }

    const { data, error } = await queryBuilder.order('grade_level').order('code');

    if (error) {
      console.warn('Search failed, falling back to hardcoded:', error);
      return searchHardcodedStandards(query, gradeFilter);
    }

    return (data || []).map(dbStandardToMathStandard);
  } catch (error) {
    console.warn('Falling back to hardcoded search:', error);
    return searchHardcodedStandards(query, gradeFilter);
  }
}

/**
 * Get all available grade levels
 */
export async function getAvailableGrades(): Promise<number[]> {
  if (!isSupabaseConfigured()) {
    return getHardcodedGrades();
  }

  try {
    const cache = await fetchAndCacheStandards();
    return Array.from(cache.keys()).sort((a, b) => a - b);
  } catch (error) {
    console.warn('Falling back to hardcoded grades:', error);
    return getHardcodedGrades();
  }
}

/**
 * Map external standard code to internal CCSS standard
 */
export async function mapExternalStandard(
  externalCode: string,
  source: string
): Promise<MathStandard | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('standards_crosswalk')
    .select('internal_standard_id')
    .eq('external_code', externalCode)
    .eq('external_source', source)
    .single();

  if (error || !data || !data.internal_standard_id) {
    return null;
  }

  const standard = await getStandardById(data.internal_standard_id);
  return standard ? dbStandardToMathStandard(standard) : null;
}

/**
 * Add a crosswalk mapping
 */
export async function addCrosswalkMapping(
  externalCode: string,
  source: string,
  internalStandardCode: string,
  notes?: string
): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    return false;
  }

  const standardId = await getStandardIdByCode(internalStandardCode);
  if (!standardId) {
    console.error(`Standard not found: ${internalStandardCode}`);
    return false;
  }

  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from('standards_crosswalk').upsert(
    {
      external_code: externalCode,
      external_source: source,
      internal_standard_id: standardId,
      notes,
    },
    {
      onConflict: 'external_code,external_source',
    }
  );

  if (error) {
    console.error('Failed to add crosswalk mapping:', error);
    return false;
  }

  return true;
}

/**
 * Get all standards (for listing/export)
 */
export async function getAllStandards(): Promise<MathStandard[]> {
  if (!isSupabaseConfigured()) {
    return Object.values(STANDARDS_BY_GRADE).flat();
  }

  try {
    const cache = await fetchAndCacheStandards();
    const allStandards: MathStandard[] = [];
    for (const standards of cache.values()) {
      allStandards.push(...standards.map(dbStandardToMathStandard));
    }
    return allStandards;
  } catch (error) {
    console.warn('Falling back to hardcoded standards:', error);
    return Object.values(STANDARDS_BY_GRADE).flat();
  }
}
