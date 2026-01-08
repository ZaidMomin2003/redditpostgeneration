
import { GoogleGenAI, Type } from "@google/genai";
import { RedditPost, GeneratedContent, GenerationOptions } from "../types";

const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

const WISDOM_IS_FUN_CONTEXT = `
Product: Wisdom is Fun
Core Philosophy: "Topic to Mastery" - replacing passive reading with active engagement.
Key Features:
- WisdomGPT: 24/7 AI academic assistant tailoring "tricky" concepts into simplified, relatable explanations (e.g., humorous or laser-focused).
- Ultra-Detailed Notes: Instantly structures prompts into scannable notes with definitions.
- Interactive Flashcards: Active recall techniques from key concepts.
- Custom Quizzes: Exam-mimicking assessments to highlight knowledge gaps.
- Study Roadmaps: Day-by-day schedules built from uploaded syllabi/topics.
- Capture Tool: Image-to-solution feature (snap a photo of a textbook page/problem).
- Focus Mode: Built-in Pomodoro sessions for deep work.
Subscription Model: Freemium (Free vs Unlimited Premium).
`;

export const searchTopPosts = async (subreddit: string): Promise<RedditPost[]> => {
  const ai = getAI();
  const prompt = `Find the most popular, high-reach, and high-engagement recent posts from the r/${subreddit} subreddit. 
  Focus on posts where students or lifelong learners are struggling with concepts, looking for study tools, or sharing productivity hacks. 
  Return exactly 5 posts with their details.`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      tools: [{ googleSearch: {} }],
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            author: { type: Type.STRING },
            ups: { type: Type.NUMBER },
            permalink: { type: Type.STRING },
            selftext: { type: Type.STRING },
            url: { type: Type.STRING },
            subreddit: { type: Type.STRING }
          },
          required: ["title", "author", "ups", "permalink", "selftext", "subreddit"]
        }
      }
    }
  });

  try {
    return JSON.parse(response.text);
  } catch (e) {
    console.error("Failed to parse search results", e);
    return [];
  }
};

export const generateInspiredPost = async (
  originalPost: RedditPost,
  options: GenerationOptions
): Promise<GeneratedContent> => {
  const ai = getAI();
  const lengthGuideline = options.contentLength === 'short' ? 'under 150 words' : options.contentLength === 'medium' ? 'around 300 words' : 'detailed, over 500 words';
  
  const prompt = `
    INSPIRATION POST:
    Title: ${originalPost.title}
    Subreddit: r/${originalPost.subreddit}
    Content Summary: ${originalPost.selftext}

    FIXED PRODUCT CONTEXT (Wisdom is Fun):
    ${WISDOM_IS_FUN_CONTEXT}

    GENERATION PARAMETERS:
    - Promotional Level: ${options.promotionalLevel}/100. (0 = purely educational/helpful with zero mention or a tiny organic mention. 100 = clear product pitch).
    - Content Length: ${lengthGuideline}.
    - Subreddit Rules Adherence: ${options.followSubredditRules ? 'Strict - avoid spam, prioritize community guidelines' : 'Loose'}.

    TASK:
    Write a high-value Reddit post for the r/${originalPost.subreddit} community.
    Analyze the inspiration post for its "hook" and why it went viral (vulnerability, controversy, listicle, hack). 
    Apply that same structure to solve a problem using the "Wisdom is Fun" feature set, but make it feel like a helpful community member posting.

    OUTPUT FORMAT:
    JSON only.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          newPostTitle: { type: Type.STRING },
          newPostBody: { type: Type.STRING },
          strategyReasoning: { type: Type.STRING, description: "Detailed explanation of why this post will likely go viral based on the inspiration." }
        },
        required: ["newPostTitle", "newPostBody", "strategyReasoning"]
      }
    }
  });

  return {
    originalPost,
    ...JSON.parse(response.text),
    timestamp: new Date().toISOString()
  };
};
