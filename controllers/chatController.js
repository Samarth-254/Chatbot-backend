const { Groq } = require('groq-sdk');
const QA = require('../models/QA');
const DocumentChunk = require('../models/DocumentChunk');
const ChatHistory = require('../models/ChatHistory');
const { normalizeText } = require('../models/QA');

let groq = null;
if (process.env.GROQ_API_KEY && !process.env.GROQ_API_KEY.includes('your_groq_api_key')) {
  groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  console.log('Groq SDK initialized.');
} else {
  console.warn('WARNING: GROQ_API_KEY not configured.');
}

const STOP_WORDS = new Set([
  'a','an','the','is','are','was','were','be','been','being','have','has','had',
  'do','does','did','will','would','could','should','may','might','shall','can',
  'to','of','in','on','at','for','with','by','from','up','about','into','through',
  'i','me','my','we','us','our','you','your','he','him','his','she','her','they',
  'them','their','it','its','this','that','these','those','and','or','but','if',
  'so','as','not','no','yes','all','any','each','more','most','also','just','than',
  'then','now','very','also','how','what','when','where','who','why','which',
]);

const extractKeywords = (text) =>
  text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 2 && !STOP_WORDS.has(w))
      .slice(0, 20)
      .join(' ')
      .trim();


const MASTER_SYSTEM_PROMPT = `You are a smart, friendly, and highly capable customer support AI assistant. 
You speak naturally like a real human support agent — never robotic or overly formal.

═══════════════════════════════════════════════════════════
INFORMATIONAL CUSTOMER SUPPORT ONLY
═══════════════════════════════════════════════════════════
Your purpose is to answer questions ONLY using the provided knowledge base context and custom Q&A data.

IMPORTANT RULES:
1. You cannot perform actions.
2. You cannot place, modify, cancel, refund, ship, track, or manage orders.
3. You cannot access customer accounts.
4. You cannot send emails.
5. You cannot create support tickets.
6. You cannot process payments.
7. You cannot perform any real-world actions.
8. Do not request account details, order numbers, personal information, or payment information unless the uploaded knowledge explicitly requires it. You are informational only.

You may ONLY explain policies, procedures, and information found in the provided context.
If a user requests an action, explain the relevant policy and tell them how to contact support or follow the official process.

═══════════════════════════════════════════════════════════
KNOWLEDGE BASE RULES
═══════════════════════════════════════════════════════════
You will be given retrieved document excerpts (if any) under "KNOWLEDGE BASE CONTEXT" and prior chat history.

Rules for using the knowledge base:
1. If relevant context is provided → answer directly from it, naturally, without quoting or referencing the context explicitly.
2. If the user asks a factual or general knowledge question (e.g., geography, trivia, tech, people) and the information is NOT present in the provided context or chat history, you MUST respond exactly with:
   "I couldn't find enough information in the uploaded knowledge base to answer that question."
3. EXCEPTION TO RULE 2: If the user requests an ACTION (like "track my order", "cancel my subscription", "refund"), DO NOT use the fallback message. Instead, gracefully explain the official policy/process for that action based on the context, and direct them to support.
4. NEVER make up facts, prices, policies, dates, or numbers not present in the context.
5. NEVER rely on your pre-trained knowledge or world knowledge to answer user queries. OUT-OF-DOMAIN KNOWLEDGE IS STRICTLY FORBIDDEN. If it's not in the context, use the exact fallback message.
6. NEVER claim to have performed an action.
7. NEVER imply that an action has been completed.
8. NEVER say "Based on the provided context" or "According to the document" — just answer naturally.
9. NEVER say "I am an AI" unless the user directly asks.

═══════════════════════════════════════════════════════════
HANDLING SPECIFIC SCENARIOS
═══════════════════════════════════════════════════════════
- Vague questions ("help", "yes", "tell me more") → refer to the immediate conversation history. If context exists, answer. If no context, ask a friendly follow-up question.
- Multi-part questions → answer each part clearly.
- Follow-up questions ("what about X?", "and Y?") → treat as continuation of the conversation.
- Out-of-scope questions (general knowledge, trivia, unrelated facts) → ALWAYS fallback to the precise failure message. DO NOT answer them!

Always end with something actionable if you have the knowledge: either the answer, a follow-up question, or an invitation for more questions.`;

const searchChunks = async (question) => {
  const keywords = extractKeywords(question);
  let chunks = [];

  if (keywords) {
    try {
      chunks = await DocumentChunk.find(
        { $text: { $search: keywords } },
        { score: { $meta: 'textScore' }, text: 1 }
      )
      .sort({ score: { $meta: 'textScore' } })
      .limit(6)
      .lean();
    } catch (err) {
      console.error('Text search error:', err.message);
    }
  }

  if (chunks.length === 0 && question.length > 4) {
    const firstWords = question.split(/\s+/).slice(0, 5).join(' ');
    const escaped = firstWords.replace(/[/\-\\^$*+?.()|[\]{}]/g, '\\$&');
    chunks = await DocumentChunk.find(
      { text: { $regex: new RegExp(escaped, 'i') } },
      { text: 1 }
    ).limit(5).lean();
  }

  return chunks;
};

const queryChatbot = async (req, res) => {
  const { question, sessionId } = req.body;

  try {
    if (!question || typeof question !== 'string' || !question.trim()) {
      return res.status(400).json({ success: false, message: 'Please provide a question.' });
    }

    const trimmed = question.trim();

    let previousMessages = [];
    if (sessionId) {
      const history = await ChatHistory.find({ sessionId }).sort({ createdAt: 1 }).lean();
      history.forEach(h => {
        previousMessages.push({ role: 'user', content: h.question });
        previousMessages.push({ role: 'assistant', content: h.answer });
      });
    }

    const normalizedQ = normalizeText(trimmed);
    let matchedQA = await QA.findOne({ normalizedQuestion: normalizedQ }).lean();

    if (!matchedQA) {
      const escaped = trimmed.replace(/[/\-\\^$*+?.()|[\]{}]/g, '\\$&');
      matchedQA = await QA.findOne(
        { question: { $regex: new RegExp(escaped, 'i') } }
      ).lean();
    }

    if (matchedQA) {
      const log = await ChatHistory.create({
        question: trimmed,
        answer: matchedQA.answer,
        source: 'qa',
        sessionId: sessionId || null,
        userId: req.user?._id || null
      });
      return res.json({ success: true, answer: matchedQA.answer, source: 'qa', chatId: log._id });
    }

    const wordCount = trimmed.split(/\s+/).length;
    const isShortFollowUp = wordCount <= 6;
    const isGreeting = /^(hi|hello|hey|greetings|good morning|good afternoon|good evening)\b/i.test(trimmed);

    let searchStr = trimmed;
    
    if (isShortFollowUp && previousMessages.length > 0 && groq) {
      try {
        const minContext = previousMessages.slice(-2).map(m => `${m.role === 'user' ? 'User' : 'Bot'}: ${m.content}`).join('\n');
        
        const reformulatePrompt = `You are a search query generator. Based on this short conversation context, rewrite the final user message into a standalone search query to find the relevant document in our database. Do not answer the question. Only output the search terms.\n\nContext:\n${minContext}\n\nFinal User message: ${trimmed}\n\nStandalone Search query:`;

        const reformulateCompletion = await groq.chat.completions.create({
          model: 'llama-3.3-70b-versatile',
          temperature: 0,
          max_tokens: 30, 
          messages: [{ role: 'user', content: reformulatePrompt }]
        });
        
        searchStr = reformulateCompletion.choices[0]?.message?.content?.trim() || trimmed;
        searchStr = searchStr.replace(/^["']|["']$/g, ''); // Strip accidental quotes outputted by LLM
        
        console.log(`[Reformulated Query] Original: "${trimmed}" -> New: "${searchStr}"`);
      } catch (err) {
        console.error('Reformulation error:', err.message);
        searchStr = previousMessages[previousMessages.length - 1].content.slice(-100) + " " + trimmed; // Fallback
      }
    } else if (isShortFollowUp && previousMessages.length > 0) {
      searchStr = previousMessages[previousMessages.length - 1].content.slice(-100) + " " + trimmed;
    }

    const chunks = await searchChunks(searchStr);
    let answer = '';
    let source = '';

    if (isGreeting && chunks.length === 0) {
      answer = "Hello! How can I help you today?";
      source = 'documents';
    } else if (chunks.length > 0 || (previousMessages.length > 0 && isShortFollowUp)) {
      const contextBlock = chunks.length > 0
        ? chunks.map((c, i) => `[Excerpt ${i + 1}]\n${c.text.trim()}`).join('\n\n')
        : '(no direct text match found for this reply)';
        
      let userMessage = `KNOWLEDGE BASE CONTEXT:\n${contextBlock}\n\n───────────────────\nCustomer message: ${trimmed}`;
      userMessage += `\n\nCRITICAL INSTRUCTION: If the customer asks for facts, numbers, trivia, geography, or general knowledge that is NOT explicitly written in the KNOWLEDGE BASE CONTEXT above, you MUST say EXACTLY: "I couldn't find enough information in the uploaded knowledge base to answer that question." OUTSIDE KNOWLEDGE IS FORBIDDEN. ` +
        (chunks.length === 0 
          ? `You have 0 documents to reference. If they are just replying conversationally (e.g. "yes", "thank you"), respond naturally.` 
          : `Base your answer ONLY on the provided excerpts.`);
      if (groq) {
        try {
          const completion = await groq.chat.completions.create({
            model: 'llama-3.3-70b-versatile',
            temperature: 0.0,
            max_tokens: 700,
            messages: [
              { role: 'system', content: MASTER_SYSTEM_PROMPT },
              ...previousMessages,
              { role: 'user', content: userMessage }
            ]
          });
          answer = completion.choices[0]?.message?.content?.trim() || '';
          
          const isFallback = answer === "I couldn't find enough information in the uploaded knowledge base to answer that question.";
            
          source = isFallback ? 'fallback' : 'documents';

        } catch (groqErr) {
          console.error('Groq error:', groqErr.message);
          answer = chunks.length > 0 ? `Here's what I found:\n\n${chunks[0].text}` : "I couldn't find enough information in the uploaded knowledge base to answer that question.";
          source = 'documents';
        }
      } else {
        answer = chunks.length > 0 ? `Here's the closest info I found:\n\n${chunks[0].text}` : "I couldn't find enough information in the uploaded knowledge base to answer that question.";
        source = 'documents';
      }
    } else {
      answer = "I couldn't find enough information in the uploaded knowledge base to answer that question.";
      source = 'fallback';
    }

    const log = await ChatHistory.create({
      question: trimmed,
      answer,
      source,
      sessionId: sessionId || null,
      userId: req.user?._id || null
    });

    res.json({
      success: true,
      answer,
      source,
      chatId: log._id,
    });

  } catch (err) {
    console.error('Chat query error:', err.message);
    res.status(500).json({ success: false, message: 'Something went wrong. Please try again.' });
  }
};

const getChatHistory = async (req, res) => {
  try {
    const history = await ChatHistory.find().sort({ createdAt: -1 }).limit(2000).lean();
    res.json({ success: true, count: history.length, data: history });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error retrieving chat history' });
  }
};

const getUserChatHistory = async (req, res) => {
  try {
    const history = await ChatHistory.find({ userId: req.user._id }).sort({ createdAt: -1 }).lean();
    res.json({ success: true, count: history.length, data: history });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error retrieving user chat history' });
  }
};

const clearChatHistory = async (req, res) => {
  try {
    await ChatHistory.deleteMany();
    res.json({ success: true, message: 'Chat history cleared.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error clearing history' });
  }
};

module.exports = { queryChatbot, getChatHistory, clearChatHistory, getUserChatHistory };
