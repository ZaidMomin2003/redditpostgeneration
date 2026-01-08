
export interface RedditPost {
  title: string;
  author: string;
  ups: number;
  permalink: string;
  selftext: string;
  url: string;
  subreddit: string;
}

export interface GenerationOptions {
  promotionalLevel: number; // 0 (Value Only) to 100 (High Promo)
  contentLength: 'short' | 'medium' | 'long';
  followSubredditRules: boolean;
}

export interface GeneratedContent {
  originalPost: RedditPost;
  newPostTitle: string;
  newPostBody: string;
  strategyReasoning: string;
  timestamp?: string;
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
