/**
 * Standards Mapper
 * Maps external standard codes (EngageNY, state standards) to internal CCSS codes
 */

import { getSupabaseAdmin, isSupabaseConfigured } from '../lib/supabase';
import { getStandardIdByCode, addCrosswalkMapping } from '../lib/standards-service';
import type { StandardMapping } from './types';

/**
 * EngageNY module to CCSS standard mappings
 * Format: 'G{grade}-M{module}' -> CCSS code
 */
const ENGAGE_NY_MODULE_MAPPINGS: Record<string, string[]> = {
  // Grade 4
  'G4-M1': ['4.NBT.B.4', '4.NBT.B.5'],
  'G4-M2': ['4.NBT.B.4', '4.NBT.B.5'],
  'G4-M3': ['4.OA.A.1', '4.OA.A.2', '4.NBT.B.5'],
  'G4-M4': ['4.NBT.B.4', '4.NBT.B.5'],
  'G4-M5': ['4.NF.A.1', '4.NF.B.3'],
  'G4-M6': ['4.NF.C.6'],
  'G4-M7': ['4.OA.B.4'],

  // Grade 5
  'G5-M1': ['5.NBT.B.5', '5.NBT.B.7'],
  'G5-M2': ['5.NBT.B.5', '5.NBT.B.6', '5.NBT.B.7'],
  'G5-M3': ['5.NF.A.1'],
  'G5-M4': ['5.NF.B.4', '5.NF.B.7'],
  'G5-M5': ['5.G.A.1'],
  'G5-M6': ['5.G.A.1'],

  // Grade 6
  'G6-M1': ['6.RP.A.1', '6.RP.A.2', '6.RP.A.3'],
  'G6-M2': ['6.NS.A.1', '6.NS.B.3'],
  'G6-M3': ['6.NS.C.6'],
  'G6-M4': ['6.EE.A.2', '6.EE.B.7'],
  'G6-M5': ['6.G.A.1', '6.G.A.2'],

  // Grade 7
  'G7-M1': ['7.RP.A.1', '7.RP.A.2'],
  'G7-M2': ['7.NS.A.1', '7.NS.A.2'],
  'G7-M3': ['7.EE.A.1', '7.EE.B.4a'],
  'G7-M4': ['7.RP.A.3'],
  'G7-M5': ['7.G.B.6'],
  'G7-M6': ['7.SP.A.1', '7.SP.A.2'],

  // Grade 8
  'G8-M1': ['8.EE.A.1', '8.EE.A.2'],
  'G8-M2': ['8.G.A.1', '8.G.A.2'],
  'G8-M3': ['8.G.A.3', '8.G.A.4'],
  'G8-M4': ['8.EE.B.5', '8.EE.B.6', '8.EE.C.7'],
  'G8-M5': ['8.F.A.1', '8.F.B.4'],
  'G8-M6': ['8.EE.C.8'],
  'G8-M7': ['8.G.B.7'],
};

/**
 * Topic keywords to CCSS standard mappings
 * Used as fallback when module code is not available
 */
const TOPIC_TO_STANDARD: Record<string, string[]> = {
  // Fractions
  'fraction': ['4.NF.A.1', '4.NF.B.3', '5.NF.A.1', '5.NF.B.4', '6.NS.A.1'],
  'add fraction': ['4.NF.B.3', '5.NF.A.1'],
  'subtract fraction': ['4.NF.B.3', '5.NF.A.1'],
  'multiply fraction': ['5.NF.B.4'],
  'divide fraction': ['5.NF.B.7', '6.NS.A.1'],
  'equivalent fraction': ['4.NF.A.1'],

  // Decimals
  'decimal': ['4.NF.C.6', '5.NBT.B.7', '6.NS.B.3'],
  'add decimal': ['5.NBT.B.7', '6.NS.B.3'],
  'subtract decimal': ['5.NBT.B.7', '6.NS.B.3'],
  'multiply decimal': ['5.NBT.B.7', '6.NS.B.3'],
  'divide decimal': ['5.NBT.B.7', '6.NS.B.3'],

  // Multiplication/Division
  'multiplication': ['4.NBT.B.5', '5.NBT.B.5'],
  'division': ['5.NBT.B.6'],
  'multi-digit': ['4.NBT.B.5', '5.NBT.B.5', '5.NBT.B.6'],

  // Ratios and Proportions
  'ratio': ['6.RP.A.1', '6.RP.A.2', '6.RP.A.3'],
  'rate': ['6.RP.A.2', '6.RP.A.3'],
  'proportion': ['7.RP.A.2', '7.RP.A.3'],
  'percent': ['6.RP.A.3', '7.RP.A.3'],
  'unit rate': ['6.RP.A.2', '7.RP.A.1'],

  // Integers
  'integer': ['6.NS.C.6', '7.NS.A.1', '7.NS.A.2'],
  'negative': ['6.NS.C.6', '7.NS.A.1', '7.NS.A.2'],

  // Expressions and Equations
  'expression': ['6.EE.A.2', '7.EE.A.1'],
  'equation': ['6.EE.B.7', '7.EE.B.4a', '8.EE.C.7'],
  'variable': ['6.EE.A.2', '6.EE.B.7'],
  'solve': ['6.EE.B.7', '7.EE.B.4a', '8.EE.C.7'],
  'linear': ['8.EE.B.6', '8.EE.C.7', '8.F.B.4'],
  'slope': ['8.EE.B.5', '8.EE.B.6'],

  // Exponents and Roots
  'exponent': ['8.EE.A.1'],
  'square root': ['8.EE.A.2'],
  'cube root': ['8.EE.A.2'],

  // Geometry
  'coordinate': ['5.G.A.1', '8.EE.B.5'],
  'area': ['7.G.B.6'],
  'circumference': ['7.G.B.6'],
  'circle': ['7.G.B.6'],
  'pythagorean': ['8.G.B.7'],

  // Functions
  'function': ['8.F.A.1', '8.F.B.4'],

  // Algebra
  'quadratic': ['A.REI.B.4', 'A.SSE.B.3'],
  'factor': ['4.OA.B.4', 'A.SSE.B.3'],
  'factoring': ['A.SSE.B.3'],
};

/**
 * Parse EngageNY module code from various formats
 * Examples: "G5-M3", "Grade 5 Module 3", "5.M3", "Module 3 Grade 5"
 */
export function parseEngageNYCode(input: string): { grade: number; module: number } | null {
  const normalized = input.toUpperCase().replace(/\s+/g, '');

  // Try G{grade}-M{module} format
  let match = normalized.match(/G(\d+)-?M(\d+)/);
  if (match) {
    return { grade: parseInt(match[1]), module: parseInt(match[2]) };
  }

  // Try Grade{grade}Module{module} format
  match = normalized.match(/GRADE(\d+)MODULE(\d+)/);
  if (match) {
    return { grade: parseInt(match[1]), module: parseInt(match[2]) };
  }

  // Try {grade}.M{module} format
  match = normalized.match(/(\d+)\.?M(\d+)/);
  if (match) {
    return { grade: parseInt(match[1]), module: parseInt(match[2]) };
  }

  return null;
}

/**
 * Map EngageNY module code to CCSS standards
 */
export function mapEngageNYModule(moduleCode: string): string[] {
  const parsed = parseEngageNYCode(moduleCode);
  if (!parsed) return [];

  const key = `G${parsed.grade}-M${parsed.module}`;
  return ENGAGE_NY_MODULE_MAPPINGS[key] || [];
}

/**
 * Infer CCSS standard from topic keywords
 */
export function inferStandardFromTopic(topic: string, gradeLevel?: number): string[] {
  const normalizedTopic = topic.toLowerCase();
  const matches: string[] = [];

  for (const [keyword, standards] of Object.entries(TOPIC_TO_STANDARD)) {
    if (normalizedTopic.includes(keyword)) {
      matches.push(...standards);
    }
  }

  // Filter by grade level if provided
  if (gradeLevel && matches.length > 0) {
    const gradeFiltered = matches.filter((code) => {
      const gradeMatch = code.match(/^(\d+)\./);
      if (gradeMatch) {
        return parseInt(gradeMatch[1]) === gradeLevel;
      }
      // High school standards (A., F.) typically grade 9
      if (/^[AF]\./.test(code)) {
        return gradeLevel >= 8;
      }
      return true;
    });

    if (gradeFiltered.length > 0) {
      return [...new Set(gradeFiltered)];
    }
  }

  return [...new Set(matches)];
}

/**
 * Map an external standard code to internal CCSS
 */
export async function mapExternalStandard(
  externalCode: string,
  source: string,
  options: {
    topic?: string;
    gradeLevel?: number;
  } = {}
): Promise<StandardMapping> {
  const result: StandardMapping = {
    externalCode,
    ccssCode: null,
    standardId: null,
    confidence: 'none',
  };

  // First, check if it's already a CCSS code
  if (/^\d+\.[A-Z]+\./.test(externalCode) || /^[AF]\.[A-Z]+\./.test(externalCode)) {
    result.ccssCode = externalCode;
    result.confidence = 'exact';

    // Try to get the database ID
    const id = await getStandardIdByCode(externalCode);
    if (id) {
      result.standardId = id;
    }

    return result;
  }

  // Check database crosswalk if Supabase is configured
  if (isSupabaseConfigured()) {
    const supabase = getSupabaseAdmin();
    const { data } = await supabase
      .from('standards_crosswalk')
      .select('internal_standard_id, standards(code)')
      .eq('external_code', externalCode)
      .eq('external_source', source)
      .single();

    if (data && data.internal_standard_id) {
      result.standardId = data.internal_standard_id;
      // @ts-ignore - nested join type
      result.ccssCode = data.standards?.code || null;
      result.confidence = 'exact';
      return result;
    }
  }

  // Try EngageNY mapping
  if (source === 'engage_ny' || source === 'engageny') {
    const ccssStandards = mapEngageNYModule(externalCode);
    if (ccssStandards.length > 0) {
      // Use the first (primary) standard
      result.ccssCode = ccssStandards[0];
      result.confidence = 'exact';

      const id = await getStandardIdByCode(result.ccssCode);
      if (id) {
        result.standardId = id;
      }

      return result;
    }
  }

  // Try topic inference as fallback
  if (options.topic) {
    const inferred = inferStandardFromTopic(options.topic, options.gradeLevel);
    if (inferred.length > 0) {
      result.ccssCode = inferred[0];
      result.confidence = 'inferred';

      const id = await getStandardIdByCode(result.ccssCode);
      if (id) {
        result.standardId = id;
      }

      return result;
    }
  }

  return result;
}

/**
 * Batch map multiple external codes
 */
export async function batchMapStandards(
  codes: Array<{ externalCode: string; source: string; topic?: string; gradeLevel?: number }>
): Promise<Map<string, StandardMapping>> {
  const results = new Map<string, StandardMapping>();

  for (const item of codes) {
    const mapping = await mapExternalStandard(item.externalCode, item.source, {
      topic: item.topic,
      gradeLevel: item.gradeLevel,
    });
    results.set(item.externalCode, mapping);
  }

  return results;
}

/**
 * Register a new crosswalk mapping in the database
 */
export async function registerCrosswalkMapping(
  externalCode: string,
  source: string,
  ccssCode: string,
  notes?: string
): Promise<boolean> {
  return addCrosswalkMapping(externalCode, source, ccssCode, notes);
}
