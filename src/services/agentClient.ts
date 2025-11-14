import { Message } from '@prisma/client';
import logger from '../utils/logger';
import config from '../config';

/**
 * LLM Agent Client
 *
 * This module handles communication with the LLM backend service.
 * It transforms conversation history to the LLM API format and processes responses.
 */

interface AgentResponse {
  content: string;
  format: 'text' | 'markdown' | 'code';
  metadata?: {
    model: string;
    tokens?: number;
    processingTime?: number;
  };
}

/**
 * LLM API response type
 */
interface LLMResponse {
  response: string;
  tool_calls_made: number;
  iterations: number;
}


/**
 * Detect message format based on content
 */
function detectMessageFormat(content: string): 'text' | 'markdown' | 'code' {
  // Check for markdown patterns (including code blocks)
  const markdownPatterns = [
    new RegExp('```[\\s\\S]*?```'), // Code blocks (triple backticks)
    new RegExp('`[^`]+`'), // Inline code (single backticks)
    /^#{1,6}\s/m, // Headers
    /\*\*.*?\*\*/s, // Bold
    /\*.*?\*/s, // Italic
    /_.*?_/s, // Italic alternative
    /^\s*[-*+]\s/m, // Unordered lists
    /^\s*\d+\.\s/m, // Ordered lists
    /\[.*?\]\(.*?\)/, // Links
    /^\s*>\s/m, // Blockquotes
    /\|.*\|.*\|/m, // Tables
    /^---+$/m, // Horizontal rules
    /~~.*?~~/s, // Strikethrough
  ];

  const hasMarkdown = markdownPatterns.some((pattern) => pattern.test(content));

  return hasMarkdown ? 'markdown' : 'text';
}

/**
 * Transform database messages to LLM format
 */
function transformMessagesToLLMFormat(
  conversationHistory: Message[],
  currentMessage: string
): Array<{ role: 'user' | 'assistant'; content: string }> {
  // Convert conversation history to LLM format
  const messages = conversationHistory.map((msg) => ({
    role: msg.role as 'user' | 'assistant',
    content: msg.content,
  }));

  // Add current user message
  messages.push({
    role: 'user',
    content: currentMessage,
  });

  return messages;
}

/**
 * User context for LLM request
 */
interface UserContext {
  userId: string;
  userName: string;
  userEmail: string;
}

/**
 * Main function to send message to agent service
 *
 * @param message - User's message content
 * @param conversationHistory - Previous messages in the conversation
 * @param userContext - User context for headers
 * @returns Agent's response
 */
export async function sendMessage(
  message: string,
  conversationHistory: Message[] = [],
  userContext: UserContext
): Promise<AgentResponse> {
  try {
    logger.info('LLM agent processing message', {
      userId: userContext.userId,
      userName: userContext.userName,
      messageLength: message.length,
      historyLength: conversationHistory.length,
    });

    // Transform messages to LLM format
    const messages = transformMessagesToLLMFormat(conversationHistory, message);

    // Call LLM backend service with user context headers
    const response = await fetch(config.agent.serviceUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-ID': userContext.userId,
        'X-User-Name': userContext.userName,
        'X-User-Email': userContext.userEmail,
      },
      body: JSON.stringify({ messages }),
      signal: AbortSignal.timeout(config.agent.timeout),
    });

    if (!response.ok) {
      throw new Error(`LLM service returned ${response.status}: ${response.statusText}`);
    }

    const data = (await response.json()) as LLMResponse;

    // Detect format based on content
    const format = detectMessageFormat(data.response);

    logger.info('LLM agent response received', {
      userId: userContext.userId,
      userName: userContext.userName,
      responseLength: data.response?.length || 0,
      format,
      toolCalls: data.tool_calls_made,
      iterations: data.iterations,
    });

    // Return in AgentResponse format
    return {
      content: data.response,
      format,
      metadata: {
        model: 'llm-backend-v1',
        tokens: Math.floor(data.response.length / 4), // Rough approximation
        processingTime: data.iterations * 100, // Rough approximation based on iterations
      },
    };
  } catch (error) {
    logger.error('LLM agent error', {
      error,
      userId: userContext.userId,
      userName: userContext.userName,
    });

    // Return fallback response
    return {
      content: "I'm having trouble processing your message right now. Please try again.",
      format: 'text',
      metadata: {
        model: 'llm-backend-v1',
        tokens: 0,
      },
    };
  }
}

/**
 * Deprecated: Use sendMessage instead
 * This function is kept for backward compatibility
 */
export async function sendMessageToRealAgent(
  message: string,
  conversationHistory: Message[],
  userContext: UserContext
): Promise<AgentResponse> {
  // Delegate to the main sendMessage function
  return sendMessage(message, conversationHistory, userContext);
}

export default {
  sendMessage,
  sendMessageToRealAgent,
};
