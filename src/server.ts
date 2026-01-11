/**
 * MathClicks API Server
 * Express server providing REST API for image processing and answer validation
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { createPipeline, MathClicksPipeline } from './index';
import { Problem, GenerationOptions } from './types';
import { analyzeStudentWork, evaluateStudentResponse, analyzeIncorrectWork } from './lib/socratic-dialogue';
import {
  generateClassCode,
  getOrCreateClass,
  updateStudentSession,
  getClassStudents,
  getClassSummary,
  getStudentSession,
  addAchievement,
  classExists,
  type StudentSession,
} from './lib/class-store';
import Anthropic from '@anthropic-ai/sdk';

// Load environment variables
import 'dotenv/config';

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize pipeline and Anthropic client
let pipeline: MathClicksPipeline | null = null;
let anthropicClient: Anthropic | null = null;

function getPipeline(): MathClicksPipeline {
  if (!pipeline) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY environment variable is not set');
    }
    pipeline = createPipeline(apiKey, process.env.NODE_ENV === 'development');
  }
  return pipeline;
}

function getAnthropicClient(): Anthropic {
  if (!anthropicClient) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY environment variable is not set');
    }
    anthropicClient = new Anthropic({ apiKey });
  }
  return anthropicClient;
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.'));
    }
  },
});

// Middleware - CORS configuration for multiple origins
const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:3000')
  .split(',')
  .map(origin => origin.trim());

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));
app.use(express.json());

// Request logging in development
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
    next();
  });
}

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Process image and generate problems
app.post('/api/process-image', upload.single('image'), async (req: Request, res: Response) => {
  const startTime = Date.now();

  try {
    if (!req.file) {
      res.status(400).json({ success: false, error: 'No image file provided' });
      return;
    }

    console.log(`Processing image: ${req.file.filename}`);

    const options: Partial<GenerationOptions> = {};
    if (req.body.tier) {
      options.tier = parseInt(req.body.tier, 10);
    }
    if (req.body.count) {
      options.count = parseInt(req.body.count, 10);
    }

    const result = await getPipeline().processImage(req.file.path, options);

    // Clean up uploaded file
    fs.unlink(req.file.path, (err) => {
      if (err) console.error('Failed to delete temp file:', err);
    });

    if (!result.success) {
      res.status(422).json({ success: false, error: result.error });
      return;
    }

    console.log(`Image processed in ${Date.now() - startTime}ms`);

    res.json({
      success: true,
      data: {
        extraction: result.extraction,
        problems: result.problems,
      },
    });
  } catch (error) {
    console.error('Error processing image:', error);

    // Clean up uploaded file on error
    if (req.file) {
      fs.unlink(req.file.path, () => {});
    }

    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to process image',
    });
  }
});

// Check answer
app.post('/api/check-answer', (req: Request, res: Response) => {
  try {
    const { problem, studentAnswer, attemptNumber } = req.body;

    if (!problem || typeof studentAnswer !== 'string') {
      res.status(400).json({ error: 'Missing required fields: problem, studentAnswer' });
      return;
    }

    const result = attemptNumber
      ? getPipeline().checkAnswerWithHints(problem as Problem, studentAnswer, attemptNumber)
      : getPipeline().checkAnswer(problem as Problem, studentAnswer);

    // Include hint text if there's a hint to show
    let hintText: string | undefined;
    if (result.hint_to_show !== undefined && problem.hints && problem.hints[result.hint_to_show]) {
      hintText = problem.hints[result.hint_to_show];
    }

    res.json({
      correct: result.correct,
      feedback: result.feedback,
      error_type: result.error_type,
      hint_to_show: result.hint_to_show,
      hint_text: hintText,
    });
  } catch (error) {
    console.error('Error checking answer:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to check answer',
    });
  }
});

// Generate more problems for existing extraction
app.post('/api/generate-problems', async (req: Request, res: Response) => {
  try {
    const { extraction, options } = req.body;

    if (!extraction) {
      res.status(400).json({ error: 'Missing required field: extraction' });
      return;
    }

    const { generateProblems, generateAdaptiveProblems } = await import('./lib/problem-generation');

    let problems;
    if (options?.tier) {
      problems = await generateProblems(extraction, {
        tier: options.tier,
        count: options.count || 5,
        includeHints: true,
        includeCommonMistakes: true,
      });
    } else {
      problems = await generateAdaptiveProblems(extraction, options?.count || 3);
    }

    res.json({
      success: true,
      data: { problems },
    });
  } catch (error) {
    console.error('Error generating problems:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate problems',
    });
  }
});

// Analyze student work (Socratic questioning)
app.post('/api/analyze-work', async (req: Request, res: Response) => {
  try {
    const { problem, canvasImage, previousQuestions } = req.body;

    if (!problem || !canvasImage) {
      res.status(400).json({
        success: false,
        error: 'Missing required fields: problem, canvasImage',
      });
      return;
    }

    const result = await analyzeStudentWork(getAnthropicClient(), {
      problem: problem as Problem,
      canvasImage,
      previousQuestions,
    });

    res.json(result);
  } catch (error) {
    console.error('Error analyzing work:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to analyze work',
    });
  }
});

// Analyze incorrect work (after student gets answer wrong)
app.post('/api/analyze-incorrect-work', async (req: Request, res: Response) => {
  try {
    const { problem, workImage, studentAnswer, attemptNumber } = req.body;

    if (!problem || !workImage || !studentAnswer) {
      res.status(400).json({
        success: false,
        error: 'Missing required fields: problem, workImage, studentAnswer',
      });
      return;
    }

    const result = await analyzeIncorrectWork(getAnthropicClient(), {
      problem: problem as Problem,
      workImage,
      studentAnswer,
      attemptNumber: attemptNumber || 1,
    });

    res.json(result);
  } catch (error) {
    console.error('Error analyzing incorrect work:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to analyze work',
    });
  }
});

// Evaluate student response to Socratic question
app.post('/api/evaluate-response', async (req: Request, res: Response) => {
  try {
    const { problem, canvasImage, aiQuestion, studentResponse } = req.body;

    if (!problem || !canvasImage || !aiQuestion || !studentResponse) {
      res.status(400).json({
        success: false,
        error: 'Missing required fields: problem, canvasImage, aiQuestion, studentResponse',
      });
      return;
    }

    const result = await evaluateStudentResponse(getAnthropicClient(), {
      problem: problem as Problem,
      canvasImage,
      aiQuestion,
      studentResponse,
    });

    res.json(result);
  } catch (error) {
    console.error('Error evaluating response:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to evaluate response',
    });
  }
});

// ============ Teacher Dashboard API ============

// Create a new class code
app.post('/api/class/create', (req: Request, res: Response) => {
  const classCode = generateClassCode();
  getOrCreateClass(classCode); // Initialize the class
  res.json({ success: true, classCode });
});

// Join a class (student updates their session)
app.post('/api/class/join', (req: Request, res: Response) => {
  try {
    const { classCode, session } = req.body;

    if (!classCode || !session) {
      res.status(400).json({ success: false, error: 'Missing classCode or session' });
      return;
    }

    // Validate class code format
    if (!/^[A-Z0-9]{6}$/.test(classCode)) {
      res.status(400).json({ success: false, error: 'Invalid class code format' });
      return;
    }

    // Create class if it doesn't exist (teacher may not have created it yet)
    getOrCreateClass(classCode);

    updateStudentSession(classCode, session as StudentSession);
    res.json({ success: true });
  } catch (error) {
    console.error('Error joining class:', error);
    res.status(500).json({ success: false, error: 'Failed to join class' });
  }
});

// Update student session (periodic updates)
app.post('/api/class/update', (req: Request, res: Response) => {
  try {
    const { classCode, session } = req.body;

    if (!classCode || !session) {
      res.status(400).json({ success: false, error: 'Missing classCode or session' });
      return;
    }

    if (!classExists(classCode)) {
      res.status(404).json({ success: false, error: 'Class not found' });
      return;
    }

    updateStudentSession(classCode, session as StudentSession);
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating session:', error);
    res.status(500).json({ success: false, error: 'Failed to update session' });
  }
});

// Report achievement to class
app.post('/api/class/achievement', (req: Request, res: Response) => {
  try {
    const { classCode, studentName, achievementName, achievementIcon } = req.body;

    if (!classCode || !studentName || !achievementName) {
      res.status(400).json({ success: false, error: 'Missing required fields' });
      return;
    }

    addAchievement(classCode, studentName, achievementName, achievementIcon || '🏆');
    res.json({ success: true });
  } catch (error) {
    console.error('Error reporting achievement:', error);
    res.status(500).json({ success: false, error: 'Failed to report achievement' });
  }
});

// Get class summary (for teacher dashboard)
app.get('/api/class/:classCode/summary', (req: Request, res: Response) => {
  try {
    const { classCode } = req.params;

    if (!classExists(classCode)) {
      // Return empty summary for new classes
      res.json({
        success: true,
        data: {
          classCode,
          activeStudents: 0,
          totalStudents: 0,
          studentsNeedingHelp: 0,
          recentAchievements: [],
        },
      });
      return;
    }

    const summary = getClassSummary(classCode);
    res.json({ success: true, data: summary });
  } catch (error) {
    console.error('Error getting class summary:', error);
    res.status(500).json({ success: false, error: 'Failed to get class summary' });
  }
});

// Get all students in a class (for teacher dashboard)
app.get('/api/class/:classCode/students', (req: Request, res: Response) => {
  try {
    const { classCode } = req.params;

    const students = getClassStudents(classCode);
    res.json({ success: true, data: students });
  } catch (error) {
    console.error('Error getting students:', error);
    res.status(500).json({ success: false, error: 'Failed to get students' });
  }
});

// Get specific student details (for teacher drill-down)
app.get('/api/class/:classCode/student/:studentId', (req: Request, res: Response) => {
  try {
    const { classCode, studentId } = req.params;

    const student = getStudentSession(classCode, studentId);
    if (!student) {
      res.status(404).json({ success: false, error: 'Student not found' });
      return;
    }

    res.json({ success: true, data: student });
  } catch (error) {
    console.error('Error getting student:', error);
    res.status(500).json({ success: false, error: 'Failed to get student' });
  }
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled error:', err);

  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      res.status(400).json({ error: 'File too large. Maximum size is 10MB.' });
      return;
    }
    res.status(400).json({ error: err.message });
    return;
  }

  res.status(500).json({
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error',
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║                    MathClicks API Server                   ║
╠════════════════════════════════════════════════════════════╣
║  Server running at: http://localhost:${PORT}                  ║
║  Environment: ${(process.env.NODE_ENV || 'development').padEnd(42)}║
╚════════════════════════════════════════════════════════════╝
  `);
});

export default app;
