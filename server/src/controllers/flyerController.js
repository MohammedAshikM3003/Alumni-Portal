import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import { getGridFSBucket } from '../config/db.js';
import Flyer from '../models/flyer.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);

// Helper function to save image to GridFS
const saveImageToGridFS = (bucket, buffer, filename, mimeType, metadata = {}) => {
  return new Promise((resolve, reject) => {
    const uploadStream = bucket.openUploadStream(filename, {
      contentType: mimeType,
      metadata,
    });

    uploadStream.on('finish', () => {
      resolve(uploadStream.id.toString());
    });

    uploadStream.on('error', (error) => {
      reject(error);
    });

    uploadStream.end(buffer);
  });
};

// Helper function to analyze template image and generate visual description
const analyzeTemplateImage = (templateMimeType) => {
  return `The flyer template is a ${templateMimeType} image.
    Analyze its visual style (colors, layout, typography, spacing) and generate
    a flyer that matches this visual DNA exactly. The template serves as the design reference.`;
};

export const generateFlyer = async (req, res) => {
  try {
    // 1. Extract form data
    const { eventName, guestName, guestImage, date, venue, hostedBy, organizer, eventDescription } = req.body;

    // 2. Validate required fields
    if (!eventName || !eventName.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Event name is required',
      });
    }

    if (!guestName || !guestName.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Guest name is required',
      });
    }

    // 3. Check if template file was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Template image file is required',
      });
    }

    // 4. Validate file is an image
    if (!req.file.mimetype.startsWith('image/')) {
      return res.status(400).json({
        success: false,
        message: 'Only image files are allowed',
      });
    }

    // 5. Get GridFS bucket
    const bucket = getGridFSBucket();
    if (!bucket) {
      return res.status(500).json({
        success: false,
        message: 'Database storage service not initialized',
      });
    }

    // 6. Save template image to GridFS
    const templateFilename = `flyer_template_${req.user._id}_${Date.now()}`;
    const templateImageId = await saveImageToGridFS(
      bucket,
      req.file.buffer,
      templateFilename,
      req.file.mimetype,
      {
        userId: req.user._id,
        type: 'flyer_template',
        originalName: req.file.originalname,
      }
    );

    // 7. Check API key
    if (!process.env.GOOGLE_AI_API_KEY) {
      return res.status(500).json({
        success: false,
        message: 'AI service not configured',
        error: 'Missing GOOGLE_AI_API_KEY',
      });
    }

    // 8. Load and extract the Gemini prompt from prompts.txt
    const promptPath = path.join(__dirname, '../utils/prompts.txt');
    const allPrompts = await fs.readFile(promptPath, 'utf8');

    const geminiPromptRegex = /### FLYER_GENERATION_GEMINI_START ###([\s\S]*?)### FLYER_GENERATION_GEMINI_END ###/;
    const promptMatch = allPrompts.match(geminiPromptRegex);

    if (!promptMatch || !promptMatch[1]) {
      return res.status(500).json({
        success: false,
        message: 'Internal configuration error',
        error: 'Flyer generation prompt not found',
      });
    }

    let systemPrompt = promptMatch[1].trim();

    // 9. Inject template visual analysis into prompt
    const templateAnalysis = analyzeTemplateImage(req.file.mimetype);
    systemPrompt = systemPrompt.replace(
      '[VISUAL_TEMPLATE_DESCRIPTION]',
      templateAnalysis
    );

    // 10. Build the Gemini prompt with event data
    const userPrompt = `Generate a professional event flyer with the following details:

Event Name: ${eventName}
Chief Guest: ${guestName}
${guestImage ? `Chief Guest Image/Photo URL: ${guestImage}` : ''}
Organizer (Department): ${organizer || 'K.S.R. College of Engineering'}
Date: ${date || 'TBA'}
Venue: ${venue || 'TBA'}
Hosted By: ${hostedBy || 'K.S.R. College of Engineering'}
${eventDescription ? `\nEvent Context/Description: ${eventDescription}` : ''}

Requirements:
- Portrait format (3:4 aspect ratio, approximately 600x800 pixels)
- Match the exact color scheme and visual style of the provided template
- High resolution, print-ready quality
- No watermarks
- All text must be clearly legible
- Professional design quality
${guestImage ? `- Include the chief guest\'s photo/image in an appropriate location (e.g., top or centered)` : ''}`;

    // 11. Call Gemini API with image generation
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    const response = await model.generateContent([
      {
        inlineData: {
          mimeType: req.file.mimetype,
          data: req.file.buffer.toString('base64'),
        },
      },
      {
        text: systemPrompt,
      },
      {
        text: userPrompt,
      },
    ]);

    // 12. Extract image from response
    const candidates = response.response.candidates;
    if (!candidates || !candidates[0]) {
      return res.status(500).json({
        success: false,
        message: 'Failed to generate flyer - no response from AI',
      });
    }

    const content = candidates[0].content;
    if (!content || !content.parts) {
      return res.status(500).json({
        success: false,
        message: 'Failed to generate flyer - invalid response format',
      });
    }

    // Find image part in response
    let generatedImageBuffer = null;
    let generatedMimeType = 'image/png';

    for (const part of content.parts) {
      if (part.inlineData) {
        // Convert base64 from Gemini response to Buffer
        generatedImageBuffer = Buffer.from(part.inlineData.data, 'base64');
        generatedMimeType = part.inlineData.mimeType;
        break;
      }
    }

    if (!generatedImageBuffer) {
      return res.status(500).json({
        success: false,
        message: 'Failed to generate flyer - no image in response',
      });
    }

    // 13. Save generated image to GridFS
    const generatedFilename = `flyer_generated_${req.user._id}_${Date.now()}`;
    const generatedImageId = await saveImageToGridFS(
      bucket,
      generatedImageBuffer,
      generatedFilename,
      generatedMimeType,
      {
        userId: req.user._id,
        type: 'flyer_generated',
        eventName,
        guestName,
      }
    );

    // 14. Save flyer to database
    const flyer = new Flyer({
      eventName: eventName.trim(),
      guestName: guestName.trim(),
      guestImage: guestImage ? guestImage.trim() : '',
      date: date || '',
      venue: venue ? venue.trim() : '',
      hostedBy: hostedBy ? hostedBy.trim() : '',
      tagline: organizer ? organizer.trim() : '',
      eventDescription: eventDescription ? eventDescription.trim() : '',
      templateImageId,
      generatedImageId,
      geminiPrompt: userPrompt,
      createdBy: req.user._id,
    });

    const savedFlyer = await flyer.save();

    // 15. Return response with image ID
    return res.status(201).json({
      success: true,
      message: 'Flyer generated successfully',
      data: {
        flyerId: savedFlyer._id,
        imageId: generatedImageId,
      },
    });

  } catch (error) {
    console.error('Flyer Generation Error:', error);

    // Handle specific error types
    if (error.code === 'ENOENT') {
      return res.status(500).json({
        success: false,
        message: 'Internal configuration error',
        error: 'Prompt file not found',
      });
    }

    if (error.message?.includes('API key') || error.message?.includes('authentication')) {
      return res.status(500).json({
        success: false,
        message: 'AI service authentication failed',
        error: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to generate flyer',
      error: error.message || 'Unknown error',
    });
  }
};
