/**
 * CLI Bridge for MathClicks
 * Accepts JSON commands via stdin, outputs JSON results to stdout
 * 
 * Usage: echo '{"command":"processImage","args":{"imagePath":"path/to/image"}}' | ts-node cli-bridge.ts
 */

import { createPipeline } from "./index";
import * as fs from "fs";
import * as readline from "readline";

async function main() {
  // Read input from stdin
  const rl = readline.createInterface({
    input: process.stdin,
    terminal: false,
  });

  let input = "";
  for await (const line of rl) {
    input += line;
  }

  if (!input.trim()) {
    console.error("No input provided");
    process.exit(1);
  }

  let command;
  try {
    command = JSON.parse(input);
  } catch (e) {
    console.error("Invalid JSON input");
    process.exit(1);
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error("ANTHROPIC_API_KEY not set");
    process.exit(1);
  }

  const pipeline = createPipeline(apiKey, process.env.NODE_ENV === "development");

  try {
    let result;
    switch (command.command) {
      case "processImage":
        result = await pipeline.processImage(command.args.imagePath, command.args.options);
        break;
      case "checkAnswer":
        result = await pipeline.checkAnswer(command.args.problem, command.args.studentAnswer);
        break;
      case "checkAnswerWithHints":
        result = await pipeline.checkAnswerWithHints(
          command.args.problem,
          command.args.studentAnswer,
          command.args.attemptNumber
        );
        break;
      default:
        throw new Error(`Unknown command: ${command.command}`);
    }
    // Output result
    console.log("___RESULT___" + JSON.stringify(result));
  } catch (e: any) {
    console.error(e.message || e);
    process.exit(1);
  }
}

main();
