import ollama from 'ollama';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

// Boilerplate to get the current directory in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const generateFlyer = async (req, res) => {
  try {
    const { requirement } = req.body;

    if (!requirement || requirement.trim() === "") {
      return res.status(400).json({ error: "User requirement is missing." });
    }

    // 1. Construct the absolute path to your text file safely
    const promptPath = path.join(__dirname, '../utils/prompts.txt');

    // 2. Read the file asynchronously
    const allPrompts = await fs.readFile(promptPath, 'utf8');

    // 3. Extract the specific prompt
    const flyerPromptRegex = /### FLYER_PROMPT_START ###([\s\S]*?)### FLYER_PROMPT_END ###/;
    const match = allPrompts.match(flyerPromptRegex);

    if (!match || !match[1]) {
        return res.status(500).json({ error: "Internal Configuration Error: Flyer prompt not found." });
    }
    const systemPrompt = match[1].trim();

    // 4. Inject the file content into the Ollama call
    const response = await ollama.chat({
      model: 'mistral',
      messages: [
        {
          role: 'system',
          content: systemPrompt // Injected from flyer-prompt.txt
        },
        {
          role: 'user',
          content: `Here are the requirements for the flyer: ${requirement}`
        }
      ],
      stream: false,
    });

    return res.status(200).json({
      success: true,
      data: response.message.content
    });

  } catch (error) {
    console.error("Flyer Generation Error:", error);
    // Add specific error handling for missing files
    if (error.code === 'ENOENT') {
      return res.status(500).json({ error: "Internal Configuration Error: Prompt file missing." });
    }
    return res.status(500).json({ error: "Failed to generate flyer." });
  }
};

// Enhance text: correct grammar and improve description
export const enhanceText = async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || text.trim() === "") {
      return res.status(400).json({ error: "Text is required for enhancement." });
    }

    // 1. Construct the absolute path to the prompts file
    const promptPath = path.join(__dirname, '../utils/prompts.txt');

    // 2. Read the file asynchronously
    const allPrompts = await fs.readFile(promptPath, 'utf8');

    // 3. Extract the text enhancement prompt
    const textEnhanceRegex = /### TEXT_ENHANCE_PROMPT_START ###([\s\S]*?)### TEXT_ENHANCE_PROMPT_END ###/;
    const match = allPrompts.match(textEnhanceRegex);

    if (!match || !match[1]) {
      return res.status(500).json({ error: "Internal Configuration Error: Text enhancement prompt not found." });
    }
    const systemPrompt = match[1].trim();

    // 4. Call Ollama to enhance the text
    const response = await ollama.chat({
      model: 'mistral',
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: text
        }
      ],
      stream: false,
    });

    return res.status(200).json({
      success: true,
      data: response.message.content
    });

  } catch (error) {
    console.error("Text Enhancement Error:", error.message || error);
    if (error.code === 'ENOENT') {
      return res.status(500).json({ error: "Internal Configuration Error: Prompt file missing." });
    }
    if (error.message?.includes('ECONNREFUSED') || error.cause?.code === 'ECONNREFUSED') {
      return res.status(500).json({ error: "Ollama service is not running. Please start Ollama." });
    }
    return res.status(500).json({ error: error.message || "Failed to enhance text." });
  }
};

// Generate email content using AI
export const generateEmail = async (req, res) => {
  try {
    const {
      alumniName,
      department,
      batch,
      senderName,
      collegeName,
      purpose,
      eventDetails,
      additionalContext
    } = req.body;

    // Basic validation
    if (!alumniName || !senderName) {
      return res.status(400).json({
        error: "Alumni name and sender name are required."
      });
    }

    // 1. Construct the absolute path to the prompts file
    const promptPath = path.join(__dirname, '../utils/prompts.txt');

    // 2. Read the file asynchronously
    const allPrompts = await fs.readFile(promptPath, 'utf8');

    // 3. Extract the email generation prompt
    const emailPromptRegex = /### EMAIL_GENERATION_PROMPT_START ###([\s\S]*?)### EMAIL_GENERATION_PROMPT_END ###/;
    const match = allPrompts.match(emailPromptRegex);

    if (!match || !match[1]) {
      return res.status(500).json({
        error: "Internal Configuration Error: Email generation prompt not found."
      });
    }
    const systemPrompt = match[1].trim();

    // 4. Construct the user prompt with context
    let userPrompt = `Generate a professional email with the following details:

Alumni Information:
- Name: ${alumniName}
- Department: ${department || 'Not specified'}
- Batch: ${batch || 'Not specified'}

Sender Information:
- Name: ${senderName}
- Institution: ${collegeName || 'K.S.R. College of Engineering'}

Purpose: ${purpose || 'General communication and outreach'}`;

    // Add event details if provided
    if (eventDetails && eventDetails.eventName) {
      userPrompt += `

Event Information:
- Event Name: ${eventDetails.eventName}
- Date: ${eventDetails.eventDate || 'To be announced'}
- Venue: ${eventDetails.eventVenue || 'To be announced'}
- Time: ${eventDetails.eventTime || 'To be announced'}`;
    }

    // Add additional context if provided
    if (additionalContext) {
      userPrompt += `

Additional Context: ${additionalContext}`;
    }

    // 5. Call Ollama to generate the email
    const response = await ollama.chat({
      model: 'mistral',
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: userPrompt
        }
      ],
      stream: false,
    });

    return res.status(200).json({
      success: true,
      data: response.message.content
    });

  } catch (error) {
    console.error("Email Generation Error:", error.message || error);
    if (error.code === 'ENOENT') {
      return res.status(500).json({
        error: "Internal Configuration Error: Prompt file missing."
      });
    }
    if (error.message?.includes('ECONNREFUSED') || error.cause?.code === 'ECONNREFUSED') {
      return res.status(500).json({
        error: "Ollama service is not running. Please start Ollama."
      });
    }
    return res.status(500).json({
      error: error.message || "Failed to generate email."
    });
  }
};
