/**
 * Creates a test image with math equations for pipeline testing
 */

import { createCanvas } from 'canvas';
import * as fs from 'fs';
import * as path from 'path';

const WIDTH = 800;
const HEIGHT = 600;

function createMathImage(filename: string, content: string[]) {
  const canvas = createCanvas(WIDTH, HEIGHT);
  const ctx = canvas.getContext('2d');

  // White background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Title style
  ctx.fillStyle = '#333333';
  ctx.font = 'bold 28px Arial';
  ctx.fillText('Two-Step Equations', 50, 50);

  // Equation style
  ctx.font = '32px Arial';
  ctx.fillStyle = '#000000';

  let y = 120;
  for (const line of content) {
    ctx.fillText(line, 50, y);
    y += 60;
  }

  // Save to file
  const outputPath = path.join(__dirname, 'test-images', filename);
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(outputPath, buffer);
  console.log(`Created: ${outputPath}`);
}

// Create test image with two-step equations
createMathImage('equations.png', [
  'Solve for x:',
  '',
  '3x + 5 = 17',
  '',
  '2x - 4 = 10',
  '',
  'Example: 3x + 5 = 17',
  '         3x = 12',
  '         x = 4',
]);

console.log('Test image created successfully!');
