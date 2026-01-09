
export interface RedditPost {
  title: string;
  author: string;
  ups: number;
  permalink: string;
  selftext: string;
  url: string;
  subreddit: string;
}

export type AppType = 'wisdom' | 'clean_mails';

export interface GenerationOptions {
  promotionalLevel: number; // 0 (Value Only) to 100 (High Promo)
  contentLength: 'short' | 'medium' | 'long';
  followSubredditRules: boolean;
  appType: AppType;
}

export interface GeneratedContent {
  originalPost: RedditPost;
  newPostTitle: string;
  newPostBody: string;
  strategyReasoning: string;
  timestamp?: string;
  appType: AppType;
}

export interface HistoryItem extends GeneratedContent {
  id: string;
}

export enum AppStatus {
  IDLE = 'IDLE',
  SEARCHING = 'SEARCHING',
  GENERATING = 'GENERATING',
  ERROR = 'ERROR'
}
