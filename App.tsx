
import React, { useState, useEffect, useRef } from 'react';
import { AppStatus, RedditPost, GeneratedContent, GenerationOptions, HistoryItem } from './types';
import { searchTopPosts, generateInspiredPost } from './services/geminiService';
import PostCard from './components/PostCard';

const App: React.FC = () => {
  const [subreddit, setSubreddit] = useState('');
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [posts, setPosts] = useState<RedditPost[]>([]);
  const [selectedPost, setSelectedPost] = useState<RedditPost | null>(null);
  const [generated, setGenerated] = useState<GeneratedContent | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  
  // Customization Options
  const [options, setOptions] = useState<GenerationOptions>({
    promotionalLevel: 20,
    contentLength: 'medium',
    followSubredditRules: true
  });

  const progressIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('reddit_inspo_history');
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load history", e);
      }
    }
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subreddit.trim()) return;

    setStatus(AppStatus.SEARCHING);
    setError(null);
    setPosts([]);
    setSelectedPost(null);
    setGenerated(null);
    setProgress(0);

    try {
      const results = await searchTopPosts(subreddit.replace('r/', ''));
      if (results.length === 0) {
        setError("No relevant posts found. Try a broader educational subreddit.");
        setStatus(AppStatus.IDLE);
      } else {
        setPosts(results);
        setStatus(AppStatus.IDLE);
      }
    } catch (err) {
      setError("Failed to fetch search results. Check your API connection.");
      setStatus(AppStatus.IDLE);
    }
  };

  const startProgressSimulation = () => {
    setProgress(0);
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    progressIntervalRef.current = window.setInterval(() => {
      setProgress((prev) => {
        if (prev >= 98) {
          if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
          return 98;
        }
        // Snappy simulation for Gemini 3 Flash
        return prev + (prev < 70 ? 12 : prev < 95 ? 5 : 1);
      });
    }, 80);
  };

  const handleGenerate = async () => {
    if (!selectedPost) return;

    setStatus(AppStatus.GENERATING);
    setError(null);
    startProgressSimulation();

    try {
      const result = await generateInspiredPost(selectedPost, options);
      
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      setProgress(100);
      
      setTimeout(() => {
        setGenerated(result);
        setStatus(AppStatus.IDLE);
        setProgress(0);
        
        // Auto-save to history
        const newItem: HistoryItem = { ...result, id: crypto.randomUUID() };
        const updatedHistory = [newItem, ...history];
        setHistory(updatedHistory);
        localStorage.setItem('reddit_inspo_history', JSON.stringify(updatedHistory));
        
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
      }, 400);
    } catch (err) {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      setError("Content generation failed. Please try again.");
      setStatus(AppStatus.IDLE);
      setProgress(0);
    }
  };

  const deleteFromHistory = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = history.filter(h => h.id !== id);
    setHistory(updated);
    localStorage.setItem('reddit_inspo_history', JSON.stringify(updated));
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-12 pb-24">
      {/* Header */}
      <header className="flex flex-col md:flex-row items-center justify-between mb-16 space-y-4 md:space-y-0">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-orange-500/10 rounded-2xl border border-orange-500/20">
            <i className="fa-brands fa-reddit text-4xl text-orange-500"></i>
          </div>
          <div>
            <h1 className="text-4xl font-black bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
              Wisdom is Fun <span className="text-orange-500 text-lg ml-2 font-mono uppercase tracking-widest">Inspo AI</span>
            </h1>
            <div className="flex items-center space-x-2 mt-1">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-tighter bg-gray-900 px-2 py-0.5 rounded border border-gray-800">
                Powered by Gemini 3 Flash
              </span>
            </div>
          </div>
        </div>
        <button 
          onClick={() => setShowHistory(!showHistory)}
          className="px-6 py-2.5 bg-gray-900 hover:bg-gray-800 border border-gray-800 rounded-xl text-sm font-bold transition-all flex items-center space-x-2 shadow-lg group"
        >
          <i className={`fa-solid ${showHistory ? 'fa-arrow-left' : 'fa-clock-rotate-left'} group-hover:scale-110 transition-transform`}></i>
          <span>{showHistory ? 'Back to Generator' : `View History (${history.length})`}</span>
        </button>
      </header>

      {!showHistory ? (
        <>
          {/* Subreddit Search */}
          <section className="bg-gray-900/40 backdrop-blur-md border border-gray-800 p-8 rounded-3xl mb-12 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                <i className="fa-solid fa-graduation-cap text-8xl"></i>
            </div>
            <div className="mb-6 flex items-center space-x-3 text-orange-400 border-b border-gray-800 pb-4">
              <i className="fa-solid fa-brain-circuit"></i>
              <span className="font-bold text-[10px] uppercase tracking-[0.2em]">Context: Wisdom is Fun Study Suite</span>
            </div>
            <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-12 gap-6 relative z-10">
              <div className="md:col-span-10">
                <label className="block text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">Target Subreddit</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 font-bold">r/</span>
                  <input 
                    type="text" 
                    placeholder="e.g. StudyTips, College, GCSE, University..."
                    value={subreddit}
                    onChange={(e) => setSubreddit(e.target.value)}
                    className="w-full bg-gray-950 border border-gray-800 rounded-xl py-4 pl-10 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-orange-500/30 transition-all font-medium"
                  />
                </div>
              </div>
              <div className="md:col-span-2 flex items-end">
                <button 
                  type="submit" 
                  disabled={status === AppStatus.SEARCHING || !subreddit}
                  className="w-full bg-orange-600 hover:bg-orange-500 disabled:bg-gray-800 text-white font-bold py-4 rounded-xl transition-all shadow-lg flex items-center justify-center space-x-2 active:scale-95"
                >
                  {status === AppStatus.SEARCHING ? <i className="fa-solid fa-spinner animate-spin"></i> : <i className="fa-solid fa-bolt"></i>}
                  <span>Find</span>
                </button>
              </div>
            </form>
          </section>

          {error && <div className="mb-8 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-center flex items-center justify-center space-x-2">
            <i className="fa-solid fa-circle-exclamation"></i>
            <span>{error}</span>
          </div>}

          {/* Post Selection */}
          {posts.length > 0 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center space-x-4">
                <h2 className="text-xl font-bold">1. Choose Your Inspiration</h2>
                <div className="h-px flex-1 bg-gray-800"></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {posts.map((post, idx) => (
                  <PostCard key={idx} post={post} isSelected={selectedPost === post} onSelect={setSelectedPost} />
                ))}
              </div>
            </div>
          )}

          {/* Customization Options */}
          {selectedPost && (
            <div className="mt-12 bg-gray-900/60 p-8 rounded-3xl border border-gray-800 shadow-xl space-y-8 animate-in slide-in-from-bottom duration-500 relative overflow-hidden">
               <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
                  <i className="fa-solid fa-sliders text-6xl"></i>
              </div>
              <div className="flex items-center space-x-4">
                <h2 className="text-xl font-bold">2. Fine-Tune Strategy</h2>
                <div className="h-px flex-1 bg-gray-800"></div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <label className="block text-xs font-bold text-gray-500 uppercase">Promotional Tone</label>
                    <span className="text-orange-500 text-xs font-bold px-2 py-0.5 bg-orange-500/10 rounded">{options.promotionalLevel}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" max="100" 
                    value={options.promotionalLevel} 
                    onChange={(e) => setOptions({...options, promotionalLevel: parseInt(e.target.value)})}
                    className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-orange-500"
                  />
                  <div className="flex justify-between text-[10px] text-gray-600 uppercase font-black">
                    <span>Authentic Helper</span>
                    <span>Product Launch</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="block text-xs font-bold text-gray-500 uppercase">Desired Content Length</label>
                  <select 
                    value={options.contentLength}
                    onChange={(e) => setOptions({...options, contentLength: e.target.value as any})}
                    className="w-full bg-gray-950 border border-gray-800 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-1 focus:ring-orange-500/50 appearance-none cursor-pointer"
                  >
                    <option value="short">Short & Punchy (~150 words)</option>
                    <option value="medium">Medium Form (~300 words)</option>
                    <option value="long">Deep Analysis (500+ words)</option>
                  </select>
                </div>

                <div className="space-y-4">
                  <label className="block text-xs font-bold text-gray-500 uppercase">Subreddit Guardrails</label>
                  <div 
                    onClick={() => setOptions({...options, followSubredditRules: !options.followSubredditRules})}
                    className="flex items-center space-x-3 cursor-pointer group bg-gray-950/50 p-3 rounded-xl border border-gray-800/50"
                  >
                    <div className={`w-10 h-5 rounded-full transition-all flex items-center p-1 ${options.followSubredditRules ? 'bg-orange-500' : 'bg-gray-800'}`}>
                      <div className={`w-3 h-3 bg-white rounded-full transition-all ${options.followSubredditRules ? 'translate-x-5' : 'translate-x-0'}`}></div>
                    </div>
                    <span className="text-xs font-bold text-gray-400 group-hover:text-gray-200">Anti-Spam Filter</span>
                  </div>
                </div>
              </div>

              <button 
                onClick={handleGenerate}
                disabled={status === AppStatus.GENERATING}
                className="w-full bg-gradient-to-r from-orange-600 to-orange-400 py-5 rounded-2xl font-black text-lg transition-all hover:scale-[1.01] hover:brightness-110 shadow-xl shadow-orange-900/40 disabled:grayscale relative overflow-hidden group"
              >
                <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 pointer-events-none"></div>
                {status === AppStatus.GENERATING ? (
                  <div className="flex items-center justify-center space-x-3">
                    <i className="fa-solid fa-atom animate-spin"></i>
                    <span>Engine Humming...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center space-x-3">
                    <i className="fa-solid fa-sparkles"></i>
                    <span>Generate Viral Draft</span>
                  </div>
                )}
              </button>
            </div>
          )}

          {/* Loading Progress */}
          {status === AppStatus.GENERATING && (
            <div className="mt-16 max-w-2xl mx-auto space-y-6">
              <div className="flex justify-between items-end">
                <div className="space-y-1">
                   <h3 className="text-lg font-bold text-white tracking-tight">Gemini 3 is Thinking...</h3>
                   <p className="text-[10px] text-gray-500 uppercase tracking-widest font-black">Applying Inspiration Patterns</p>
                </div>
                <span className="text-3xl font-black text-orange-500 font-mono tracking-tighter">{Math.round(progress)}%</span>
              </div>
              <div className="h-3 w-full bg-gray-900 rounded-full overflow-hidden border border-gray-800 p-0.5 shadow-inner">
                <div 
                    className="h-full bg-gradient-to-r from-orange-700 via-orange-500 to-orange-400 transition-all duration-300 shadow-[0_0_20px_rgba(249,115,22,0.4)] rounded-full" 
                    style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Result Display */}
          {generated && status === AppStatus.IDLE && (
            <section className="mt-20 animate-in zoom-in-95 duration-700">
              <div className="flex items-center space-x-4 mb-6">
                 <h2 className="text-2xl font-black">3. Your Final Draft</h2>
                 <div className="h-px flex-1 bg-orange-500/20"></div>
              </div>
              <div className="bg-gray-900 border border-gray-800 rounded-3xl overflow-hidden shadow-2xl">
                <div className="bg-gray-800/50 px-8 py-4 flex justify-between items-center border-b border-gray-800">
                  <div className="flex space-x-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500/50"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500/50"></div>
                  </div>
                  <span className="text-[10px] font-mono text-gray-500 uppercase font-black tracking-widest">wisdom_fun_gen.md</span>
                  <div className="flex items-center space-x-2">
                    <button 
                      onClick={() => { 
                        navigator.clipboard.writeText(`${generated.newPostTitle}\n\n${generated.newPostBody}`); 
                        alert('Copied to clipboard!'); 
                      }} 
                      className="text-[10px] bg-orange-600/20 px-4 py-2 rounded-lg text-orange-400 font-black hover:bg-orange-600/40 transition-all uppercase tracking-tighter flex items-center space-x-2"
                    >
                      <i className="fa-solid fa-copy"></i>
                      <span>Copy All</span>
                    </button>
                  </div>
                </div>
                <div className="p-10 space-y-10">
                  <div className="space-y-4">
                    <h3 className="text-[10px] font-black text-orange-500 uppercase tracking-[0.2em]">Suggested Title</h3>
                    <p className="text-3xl font-black text-white leading-tight">{generated.newPostTitle}</p>
                  </div>
                  <div className="h-px bg-gray-800"></div>
                  <div className="space-y-4">
                    <h3 className="text-[10px] font-black text-orange-500 uppercase tracking-[0.2em]">Post Body</h3>
                    <div className="prose prose-invert max-w-none">
                       <p className="text-gray-300 whitespace-pre-wrap leading-relaxed font-medium text-lg">
                          {generated.newPostBody}
                       </p>
                    </div>
                  </div>
                  <div className="bg-orange-500/[0.03] p-8 rounded-2xl border border-orange-500/10 group">
                    <div className="flex items-center space-x-3 mb-3">
                        <i className="fa-solid fa-lightbulb text-orange-500"></i>
                        <h3 className="text-[10px] font-black text-orange-400 uppercase tracking-[0.2em]">The "Inspo" Strategy Applied</h3>
                    </div>
                    <p className="text-sm text-gray-500 italic leading-relaxed font-medium">
                        {generated.strategyReasoning}
                    </p>
                  </div>
                </div>
              </div>
            </section>
          )}
        </>
      ) : (
        /* History Section */
        <section className="animate-in fade-in slide-in-from-right-4 duration-500 space-y-8">
          <div className="flex items-center space-x-4 mb-4">
            <h2 className="text-2xl font-black">History <span className="text-orange-500 font-mono ml-2">[{history.length}]</span></h2>
            <div className="h-px flex-1 bg-gray-800"></div>
          </div>
          {history.length === 0 ? (
            <div className="text-center py-32 bg-gray-900/20 rounded-3xl border border-dashed border-gray-800">
              <i className="fa-solid fa-inbox text-5xl text-gray-800 mb-6 block"></i>
              <p className="text-gray-600 font-bold">Your generation history is currently empty.</p>
              <button onClick={() => setShowHistory(false)} className="mt-4 text-orange-500 hover:underline font-black text-xs uppercase tracking-widest">Start Crafting</button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {history.map((item) => (
                <div 
                  key={item.id} 
                  onClick={() => { setGenerated(item); setShowHistory(false); window.scrollTo({top: 0}); }}
                  className="bg-gray-900/40 border border-gray-800 rounded-2xl p-6 hover:border-orange-500/50 hover:bg-gray-900/60 transition-all group cursor-pointer relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <i className="fa-solid fa-chevron-right text-orange-500"></i>
                  </div>
                  <div className="flex justify-between items-start mb-4">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-[10px] font-black uppercase tracking-widest text-orange-500 bg-orange-500/10 px-2 py-1 rounded">r/{item.originalPost.subreddit}</span>
                        <span className="text-[10px] text-gray-600 font-bold uppercase tracking-tighter">{new Date(item.timestamp || '').toLocaleDateString()}</span>
                      </div>
                    </div>
                    <button 
                      onClick={(e) => deleteFromHistory(item.id, e)} 
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-700 hover:text-red-500 hover:bg-red-500/10 transition-all"
                    >
                        <i className="fa-solid fa-trash-can text-sm"></i>
                    </button>
                  </div>
                  <h3 className="font-bold text-xl text-white mb-2 line-clamp-1 group-hover:text-orange-400 transition-colors">{item.newPostTitle}</h3>
                  <p className="text-gray-500 text-sm line-clamp-2 mb-4 leading-relaxed">{item.newPostBody}</p>
                  <div className="flex items-center space-x-6 pt-4 border-t border-gray-800/50">
                    <button 
                      onClick={(e) => { 
                        e.stopPropagation();
                        navigator.clipboard.writeText(`${item.newPostTitle}\n\n${item.newPostBody}`); 
                        alert('Copied!'); 
                      }} 
                      className="text-[10px] font-black text-gray-500 hover:text-orange-500 uppercase tracking-widest flex items-center space-x-2"
                    >
                        <i className="fa-solid fa-copy"></i>
                        <span>Copy</span>
                    </button>
                    <span className="text-[10px] font-black text-gray-700 uppercase tracking-widest flex items-center space-x-2">
                        <i className="fa-solid fa-bolt"></i>
                        <span>Gen with Gemini 3</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Footer */}
      <footer className="mt-32 pt-12 border-t border-gray-900 flex flex-col md:flex-row justify-between items-center text-gray-600 text-xs font-bold uppercase tracking-widest space-y-4 md:space-y-0">
        <p>© {new Date().getFullYear()} Wisdom is Fun AI Lab</p>
        <div className="flex space-x-6">
            <span className="hover:text-orange-500 cursor-help transition-colors">Gemini 3 Flash</span>
            <span className="hover:text-orange-500 cursor-help transition-colors">Local History Secure</span>
            <span className="hover:text-orange-500 cursor-help transition-colors">Anti-Spam Tech</span>
        </div>
      </footer>
    </div>
  );
};

export default App;
