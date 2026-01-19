
import { GoogleGenAI, Type } from "@google/genai";
import { RedditPost, GeneratedContent, GenerationOptions, AppType } from "../types";

const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

const WISDOM_IS_FUN_CONTEXT = `
Product: Wisdom is Fun
Core Philosophy: "Topic to Mastery" - replacing passive reading with active engagement.
Key Features:
- WisdomGPT: 24/7 AI academic assistant tailoring "tricky" concepts into simplified, relatable explanations (e.g., humorous or laser-focused).
- Ultra-Detailed Notes: Instantly structures a single prompt into scannable notes with definitions for key terms.
- Interactive Flashcards: Uses active recall techniques by converting key concepts into digital cards.
- Custom Quizzes: Generates assessments that mimic real exam conditions to highlight knowledge gaps.
- Study Roadmaps: A powerful planning tool where users can upload a syllabus or topic, and the AI builds a day-by-day schedule.
- Capture Tool: An image-to-solution feature for snapping photos of textbooks/problems.
- Focus Mode: Includes built-in Pomodoro sessions.
Subscription Tiers: Freemium model (Free Plan vs Premium Plan with unlimited generations, roadmaps, and priority support).
`;

const CLEAN_MAILS_CONTEXT = `
Product: Verilist (Cleanmails by Talxify)
Core Function: A comprehensive email hygiene and deliverability optimization SaaS designed as a pre-send quality control layer.
Key Features:
- Email Validation: Checks syntax accuracy, verifies domain and mail server existence, and identifies disposable, temporary, or invalid emails.
- List Cleaning & Normalization: Restructures messy or unformatted datasets into clean, campaign-ready lists organized at scale.
- Email Extractor: Pulls valid email addresses from unstructured text sources.
- Spam Word Analysis: Refines email copy to reduce spam filter triggers and improve inbox placement.
Target Audience: Founders, marketers, agencies, outbound sales teams, and SaaS companies.
Core Value: Streamlines email data management, protects email infrastructure (sender reputation), and improves campaign performance by ensuring only high-quality data is used.
`;

export const searchTopPosts = async (subreddit: string): Promise<RedditPost[]> => {
  const ai = getAI();
  const prompt = `Find the most popular, high-reach, and high-engagement recent posts from the r/${subreddit} subreddit. 
  Focus on posts where users are discussing challenges relevant to study productivity, academic success, email marketing, sender reputation, or lead generation. 
  Return exactly 5 posts with their details in JSON format.`;

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
  const appName = options.appType === 'wisdom' ? 'Wisdom is Fun' : 'Verilist (Cleanmails by Talxify)';

  const prompt = `
    INSPIRATION POST:
    Title: ${originalPost.title}
    Subreddit: r/${originalPost.subreddit}
    Content Summary: ${originalPost.selftext}

    PRODUCT CONTEXT (${appName}):
    ${appContext}

    GENERATION PARAMETERS:
    - Promotional Level: ${options.promotionalLevel}/100.
    - Content Length: ${lengthGuideline}.
    - Subreddit Rules Adherence: ${options.followSubredditRules ? 'Strict (Community First)' : 'Moderate'}.

    TASK:
    Write a high-value Reddit post for the r/${originalPost.subreddit} community.
    Mirror the viral structure of the inspiration post. If it was a "mistake I made," write a "mistake I made" regarding the product's domain.
    Deliver real value so the post doesn't get removed.

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
