#!/usr/bin/env npx tsx
/**
 * CLI Script to import EngageNY problems
 *
 * Usage:
 *   npx tsx src/import/scripts/import-engage-ny.ts <file> [options]
 *
 * Examples:
 *   npx tsx src/import/scripts/import-engage-ny.ts data/engage-ny/grade5-problems.csv
 *   npx tsx src/import/scripts/import-engage-ny.ts data/engage-ny/problems.json --dry-run
 *   npx tsx src/import/scripts/import-engage-ny.ts data/engage-ny/*.csv --batch-size=100
 */

import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';
import {
  importFromCSV,
  importFromJSON,
} from '../engage-ny-importer';
import type { ImportConfig, ImportBatchSummary } from '../types';

// Parse command line arguments
function parseArgs(): {
  files: string[];
  dryRun: boolean;
  batchSize: number;
  skipDuplicates: boolean;
} {
  const args = process.argv.slice(2);
  const files: string[] = [];
  let dryRun = false;
  let batchSize = 50;
  let skipDuplicates = true;

  for (const arg of args) {
    if (arg === '--dry-run' || arg === '-d') {
      dryRun = true;
    } else if (arg.startsWith('--batch-size=')) {
      batchSize = parseInt(arg.split('=')[1], 10);
    } else if (arg === '--no-skip-duplicates') {
      skipDuplicates = false;
    } else if (arg === '--help' || arg === '-h') {
      printUsage();
      process.exit(0);
    } else if (!arg.startsWith('-')) {
      files.push(arg);
    }
  }

  return { files, dryRun, batchSize, skipDuplicates };
}

function printUsage(): void {
  console.log(`
EngageNY Problem Importer

Usage:
  npx tsx src/import/scripts/import-engage-ny.ts <file(s)> [options]

Arguments:
  <file(s)>              One or more CSV or JSON files to import (supports glob patterns)

Options:
  --dry-run, -d          Validate without inserting into database
  --batch-size=N         Process N problems at a time (default: 50)
  --no-skip-duplicates   Import duplicates instead of skipping
  --help, -h             Show this help message

CSV Format:
  Required columns: problem_text, answer
  Optional columns: answer_type, standard_code, grade_level, difficulty,
                   hints (pipe-separated), solution_steps (pipe-separated),
                   topic, source_reference, license

JSON Format:
  Array of objects with properties:
  - problemText (required)
  - answer (required)
  - answerType, standardCode, gradeLevel, difficulty, hints[], solutionSteps[],
    topic, sourceReference, license

Examples:
  npx tsx src/import/scripts/import-engage-ny.ts data/engage-ny/grade5.csv
  npx tsx src/import/scripts/import-engage-ny.ts data/engage-ny/*.csv --dry-run
  npx tsx src/import/scripts/import-engage-ny.ts problems.json --batch-size=100
`);
}

async function importFile(
  filePath: string,
  config: Partial<ImportConfig>
): Promise<ImportBatchSummary> {
  const ext = path.extname(filePath).toLowerCase();
  const content = fs.readFileSync(filePath, 'utf-8');

  console.log(`\nImporting: ${filePath}`);

  if (ext === '.csv') {
    return importFromCSV(content, config);
  } else if (ext === '.json') {
    return importFromJSON(content, config);
  } else {
    throw new Error(`Unsupported file format: ${ext}`);
  }
}

async function main(): Promise<void> {
  // Load environment variables
  const dotenvPath = path.resolve(process.cwd(), '.env');
  if (fs.existsSync(dotenvPath)) {
    const envContent = fs.readFileSync(dotenvPath, 'utf-8');
    for (const line of envContent.split('\n')) {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        process.env[key.trim()] = valueParts.join('=').trim();
      }
    }
  }

  const { files, dryRun, batchSize, skipDuplicates } = parseArgs();

  if (files.length === 0) {
    console.error('Error: No input files specified');
    printUsage();
    process.exit(1);
  }

  // Expand glob patterns
  const expandedFiles: string[] = [];
  for (const pattern of files) {
    const matches = await glob(pattern);
    if (matches.length === 0) {
      console.warn(`Warning: No files match pattern: ${pattern}`);
    }
    expandedFiles.push(...matches);
  }

  if (expandedFiles.length === 0) {
    console.error('Error: No files found');
    process.exit(1);
  }

  console.log('='.repeat(60));
  console.log('EngageNY Problem Importer');
  console.log('='.repeat(60));
  console.log(`Files to process: ${expandedFiles.length}`);
  console.log(`Dry run: ${dryRun}`);
  console.log(`Batch size: ${batchSize}`);
  console.log(`Skip duplicates: ${skipDuplicates}`);

  const config: Partial<ImportConfig> = {
    source: 'engage_ny',
    dryRun,
    batchSize,
    skipDuplicates,
  };

  const totalSummary: ImportBatchSummary = {
    total: 0,
    successful: 0,
    failed: 0,
    skipped: 0,
    errors: [],
    importedIds: [],
  };

  for (const file of expandedFiles) {
    try {
      const summary = await importFile(file, config);

      totalSummary.total += summary.total;
      totalSummary.successful += summary.successful;
      totalSummary.failed += summary.failed;
      totalSummary.skipped += summary.skipped;
      totalSummary.errors.push(...summary.errors);
      totalSummary.importedIds.push(...summary.importedIds);

      console.log(`  Total: ${summary.total}`);
      console.log(`  Successful: ${summary.successful}`);
      console.log(`  Skipped: ${summary.skipped}`);
      console.log(`  Failed: ${summary.failed}`);

      if (summary.errors.length > 0 && summary.errors.length <= 5) {
        console.log('  Errors:');
        for (const err of summary.errors) {
          console.log(`    - ${err.sourceId}: ${err.error}`);
        }
      } else if (summary.errors.length > 5) {
        console.log(`  Errors: ${summary.errors.length} (first 5 shown)`);
        for (const err of summary.errors.slice(0, 5)) {
          console.log(`    - ${err.sourceId}: ${err.error}`);
        }
      }
    } catch (error) {
      console.error(`Error processing ${file}:`, error);
      totalSummary.failed++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('TOTAL SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total problems: ${totalSummary.total}`);
  console.log(`Successful: ${totalSummary.successful}`);
  console.log(`Skipped: ${totalSummary.skipped}`);
  console.log(`Failed: ${totalSummary.failed}`);

  if (dryRun) {
    console.log('\n[DRY RUN] No problems were actually imported.');
  } else if (totalSummary.successful > 0) {
    console.log(`\n${totalSummary.successful} problems imported successfully.`);
  }

  process.exit(totalSummary.failed > 0 ? 1 : 0);
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
