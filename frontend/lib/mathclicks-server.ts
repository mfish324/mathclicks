import * as path from "path";
import * as fs from "fs";
import * as os from "os";
import { execSync } from "child_process";

const BACKEND_DIR = path.resolve(process.cwd(), "..");

// Call backend CLI bridge
function callBackendSync(command: string, args: any): any {
  const input = JSON.stringify({ command, args });
  
  // Write input to temp file
  const tempFile = path.join(os.tmpdir(), `mathclicks-cmd-${Date.now()}.json`);
  fs.writeFileSync(tempFile, input);
  
  try {
    // Use ts-node to run the CLI bridge, piping the temp file as input
    const result = execSync(
      `npx ts-node src/cli-bridge.ts < "${tempFile}"`,
      {
        cwd: BACKEND_DIR,
        encoding: "utf-8",
        maxBuffer: 50 * 1024 * 1024, // 50MB buffer
        env: {
          ...process.env,
          NODE_PATH: path.join(BACKEND_DIR, "node_modules"),
        },
      }
    );
    
    // Find the result marker
    const marker = "___RESULT___";
    const idx = result.indexOf(marker);
    if (idx === -1) {
      throw new Error("No result marker found in output: " + result);
    }
    const jsonStr = result.slice(idx + marker.length).trim();
    return JSON.parse(jsonStr);
  } finally {
    // Clean up temp file
    try {
      fs.unlinkSync(tempFile);
    } catch {}
  }
}

export async function processImage(imagePath: string, options?: { tier?: number; count?: number }) {
  return callBackendSync("processImage", { imagePath, options });
}

export async function checkAnswer(problem: any, studentAnswer: string) {
  return callBackendSync("checkAnswer", { problem, studentAnswer });
}

export async function checkAnswerWithHints(problem: any, studentAnswer: string, attemptNumber: number) {
  return callBackendSync("checkAnswerWithHints", { problem, studentAnswer, attemptNumber });
}

// Utility to save uploaded file temporarily
export async function saveUploadedFile(file: File): Promise<string> {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const tempDir = os.tmpdir();
  const timestamp = new Date().getTime();
  const fileName = "mathclicks-" + timestamp + "-" + file.name;
  const filePath = path.join(tempDir, fileName);
  fs.writeFileSync(filePath, buffer);
  return filePath;
}

// Clean up temp file
export function cleanupFile(filePath: string) {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (e) {
    console.error("Failed to cleanup temp file:", e);
  }
}
