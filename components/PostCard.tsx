
import React from 'react';
import { RedditPost } from '../types';

interface PostCardProps {
  post: RedditPost;
  onSelect: (post: RedditPost) => void;
  isSelected: boolean;
}

const PostCard: React.FC<PostCardProps> = ({ post, onSelect, isSelected }) => {
  return (
    <div 
      onClick={() => onSelect(post)}
      className={`p-5 rounded-xl border transition-all cursor-pointer hover:shadow-lg ${
        isSelected 
          ? 'bg-orange-500/10 border-orange-500 shadow-orange-500/20 ring-1 ring-orange-500' 
          : 'bg-gray-900 border-gray-800 hover:border-gray-700'
      }`}
    >
      <div className="flex justify-between items-start mb-3">
        <span className="text-xs font-semibold px-2 py-1 bg-gray-800 text-orange-400 rounded-full">
          u/{post.author}
        </span>
        <div className="flex items-center text-gray-400 text-xs">
          <i className="fa-solid fa-arrow-up mr-1 text-orange-500"></i>
          {post.ups.toLocaleString()}
        </div>
      </div>
      <h3 className="text-lg font-bold text-gray-100 mb-2 leading-snug">
        {post.title}
      </h3>
      <p className="text-gray-400 text-sm line-clamp-3 mb-4">
        {post.selftext}
      </p>
      <div className="flex items-center justify-between mt-auto">
        <a 
          href={post.permalink} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-xs text-blue-400 hover:underline flex items-center"
          onClick={(e) => e.stopPropagation()}
        >
          View Original <i className="fa-solid fa-external-link ml-1"></i>
        </a>
        {isSelected && (
          <span className="text-xs text-orange-400 font-bold flex items-center">
            <i className="fa-solid fa-check-circle mr-1"></i> Selected
          </span>
        )}
      </div>
    </div>
  );
};

export default PostCard;
