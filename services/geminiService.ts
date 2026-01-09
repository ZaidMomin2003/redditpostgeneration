
import { GoogleGenAI, Type } from "@google/genai";
import { RedditPost, GeneratedContent, GenerationOptions, AppType } from "../types";

const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

const WISDOM_IS_FUN_CONTEXT = `
Product: Wisdom is Fun
Core Philosophy: "Topic to Mastery" - replacing passive reading with active engagement.
Key Features:
- WisdomGPT: 24/7 AI academic assistant tailoring "tricky" concepts into simplified, relatable explanations.
- Ultra-Detailed Notes: Instantly structures prompts into scannable notes.
- Interactive Flashcards: Active recall techniques.
- Custom Quizzes: Exam-mimicking assessments.
- Study Roadmaps: Day-by-day schedules built from uploaded syllabi.
- Capture Tool: Image-to-solution (snap photo of textbook page/problem).
- Focus Mode: Built-in Pomodoro sessions.
Subscription: Freemium (Free vs Unlimited Premium).
`;

const CLEAN_MAILS_CONTEXT = `
Product: Verilist (Cleanmails by Talxify)
Category: Email hygiene and deliverability optimization SaaS.
Function: Pre-send quality control layer for email workflows.
Key Features:
- Email Validation: Syntax check, domain/mail server verification, disposable/temporary email detection.
- List Cleaning & Normalization: Restructures messy datasets into campaign-ready lists.
- Email Extractor: Pulls valid emails from unstructured text sources.
- Spam Word Analysis: Refines copy to reduce spam filter triggers and improve inbox placement.
Target Audience: Founders, marketers, agencies, outbound sales teams, and SaaS companies.
Benefit: Protects sender reputation, reduces bounce rates, improves campaign performance.
`;

export const searchTopPosts = async (subreddit: string): Promise<RedditPost[]> => {
  const ai = getAI();
  const prompt = `Find the most popular, high-reach, and high-engagement recent posts from the r/${subreddit} subreddit. 
  Focus on posts where users are discussing challenges relevant to either study productivity or email marketing/deliverability/data hygiene. 
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
  
  const appContext = options.appType === 'wisdom' ? WISDOM_IS_FUN_CONTEXT : CLEAN_MAILS_CONTEXT;

  const prompt = `
    INSPIRATION POST:
    Title: ${originalPost.title}
    Subreddit: r/${originalPost.subreddit}
    Content Summary: ${originalPost.selftext}

    PRODUCT CONTEXT (${options.appType === 'wisdom' ? 'Wisdom is Fun' : 'Clean Mails'}):
    ${appContext}

    GENERATION PARAMETERS:
    - Promotional Level: ${options.promotionalLevel}/100. (0 = purely educational, 100 = direct pitch).
    - Content Length: ${lengthGuideline}.
    - Subreddit Rules Adherence: ${options.followSubredditRules ? 'Strict' : 'Loose'}.

    TASK:
    Write a high-value Reddit post for the r/${originalPost.subreddit} community.
    Apply the viral hook and structure from the inspiration post to solve a problem using the features of the selected product.

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
          strategyReasoning: { type: Type.STRING }
        },
        required: ["newPostTitle", "newPostBody", "strategyReasoning"]
      }
    }
  });

  return {
    originalPost,
    ...JSON.parse(response.text),
    timestamp: new Date().toISOString(),
    appType: options.appType
  };
};
