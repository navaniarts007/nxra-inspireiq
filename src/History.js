import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useTheme } from './ThemeContext';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from './firebase';

export default function History() {
  const { currentUser } = useAuth();
  const { isDark } = useTheme();
  const [ideas, setIdeas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIdea, setSelectedIdea] = useState(null);

  useEffect(() => {
    if (currentUser) {
      fetchUserIdeas();
    }
  }, [currentUser]);

  const fetchUserIdeas = async () => {
    console.log('📚 Fetching user ideas for:', currentUser.uid);
    try {
      // First try simple query without orderBy to avoid index issues
      const q = query(
        collection(db, 'ideas'),
        where('userId', '==', currentUser.uid)
      );
      
      console.log('🔍 Query created, executing...');
      const querySnapshot = await getDocs(q);
      console.log('📊 Query result size:', querySnapshot.size);
      
      const userIdeas = [];
      querySnapshot.forEach((doc) => {
        const data = { id: doc.id, ...doc.data() };
        console.log('📄 Found idea:', data);
        userIdeas.push(data);
      });
      
      // Sort manually by timestamp (newest first)
      userIdeas.sort((a, b) => {
        const timeA = a.timestamp?.toDate?.() || new Date(0);
        const timeB = b.timestamp?.toDate?.() || new Date(0);
        return timeB - timeA;
      });
      
      console.log('✅ Total ideas fetched and sorted:', userIdeas.length);
      setIdeas(userIdeas);
    } catch (error) {
      console.error('❌ Error fetching ideas:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Unknown date';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen px-4 py-8 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl mx-auto mb-6 flex items-center justify-center animate-pulse-slow">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">Loading Your Ideas</h3>
          <p className="text-slate-600 dark:text-slate-400">Fetching your idea history from the database...</p>
          <div className="flex justify-center space-x-2 mt-4">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
            <div className="w-2 h-2 bg-pink-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-12 text-center animate-fade-in">
          <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-purple-500/10 to-pink-600/10 border border-purple-500/20 dark:border-purple-400/20 rounded-full px-4 py-2 mb-6">
            <div className="w-2 h-2 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-purple-700 dark:text-purple-300">Idea Archive</span>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-slate-900 via-purple-900 to-pink-900 dark:from-white dark:via-purple-100 dark:to-pink-100 bg-clip-text text-transparent mb-4 leading-tight">
            Your Idea History
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
            Track your innovation journey and see how your ideas evolve over time
          </p>
        </div>

        {ideas.length === 0 ? (
          <div className="glass rounded-3xl p-12 text-center border border-slate-200/50 dark:border-slate-700/50 animate-slide-up">
            <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-600 rounded-3xl mx-auto mb-6 flex items-center justify-center">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">No Ideas Yet</h2>
            <p className="text-slate-600 dark:text-slate-400 mb-8 text-lg max-w-md mx-auto">
              Start your innovation journey by submitting your first product idea for AI analysis!
            </p>
            <a
              href="/"
              className="inline-flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 rounded-2xl hover:from-purple-700 hover:to-pink-700 transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-xl font-semibold"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span>Submit Your First Idea</span>
            </a>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="glass rounded-2xl p-6 border border-slate-200/50 dark:border-slate-700/50">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center">
                    <span className="text-white font-bold">{ideas.length}</span>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Total Ideas</p>
                    <p className="font-semibold text-slate-900 dark:text-white">Submitted</p>
                  </div>
                </div>
              </div>
              
              <div className="glass rounded-2xl p-6 border border-slate-200/50 dark:border-slate-700/50">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                    <span className="text-white font-bold text-sm">
                      {Math.round(ideas.filter(idea => idea.result?.score?.value).reduce((acc, idea) => acc + idea.result.score.value, 0) / ideas.filter(idea => idea.result?.score?.value).length) || 0}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Avg Score</p>
                    <p className="font-semibold text-slate-900 dark:text-white">Out of 100</p>
                  </div>
                </div>
              </div>
              
              <div className="glass rounded-2xl p-6 border border-slate-200/50 dark:border-slate-700/50">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-yellow-500 to-orange-600 rounded-xl flex items-center justify-center">
                    <span className="text-white font-bold text-sm">
                      {Math.max(...ideas.filter(idea => idea.result?.score?.value).map(idea => idea.result.score.value)) || 0}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Best Score</p>
                    <p className="font-semibold text-slate-900 dark:text-white">Highest</p>
                  </div>
                </div>
              </div>
              
              <div className="glass rounded-2xl p-6 border border-slate-200/50 dark:border-slate-700/50">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
                    <span className="text-white font-bold text-sm">
                      {ideas.filter(idea => idea.result?.score?.value >= 70).length}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">High Potential</p>
                    <p className="font-semibold text-slate-900 dark:text-white">Ideas (70+)</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Ideas Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {ideas.map((idea, index) => (
                <div
                  key={idea.id}
                  className="group glass rounded-2xl p-6 border border-slate-200/50 dark:border-slate-700/50 cursor-pointer hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 animate-slide-up"
                  style={{animationDelay: `${index * 0.1}s`}}
                  onClick={() => setSelectedIdea(idea)}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="font-bold text-slate-900 dark:text-white mb-2 line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200">
                        {idea.idea?.substring(0, 80)}...
                      </h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center space-x-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{formatDate(idea.timestamp)}</span>
                      </p>
                    </div>
                    {idea.result?.score?.value && (
                      <div className="ml-4">
                        <div className={`inline-flex items-center px-3 py-2 rounded-xl text-sm font-bold shadow-lg ${
                          idea.result.score.value >= 80 ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white' :
                          idea.result.score.value >= 60 ? 'bg-gradient-to-r from-yellow-500 to-orange-600 text-white' :
                          'bg-gradient-to-r from-red-500 to-pink-600 text-white'
                        }`}>
                          {idea.result.score.value}/100
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600 dark:text-slate-400">Status</span>
                      <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                        idea.result ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' : 
                        'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
                      }`}>
                        {idea.result ? '✅ Analyzed' : '⏳ Pending'}
                      </span>
                    </div>
                    
                    {idea.result?.score?.value && (
                      <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all duration-1000 ${
                            idea.result.score.value >= 80 ? 'bg-gradient-to-r from-green-500 to-emerald-600' :
                            idea.result.score.value >= 60 ? 'bg-gradient-to-r from-yellow-500 to-orange-600' :
                            'bg-gradient-to-r from-red-500 to-pink-600'
                          }`}
                          style={{width: `${idea.result.score.value}%`}}
                        ></div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Enhanced Modal */}
        {selectedIdea && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className="glass rounded-3xl shadow-2xl p-8 max-w-5xl w-full max-h-[90vh] overflow-y-auto border border-slate-200/50 dark:border-slate-700/50">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Idea Analysis Details</h2>
                  <p className="text-slate-600 dark:text-slate-400">Comprehensive breakdown of your product concept</p>
                </div>
                <button
                  onClick={() => setSelectedIdea(null)}
                  className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all duration-200"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="glass rounded-2xl p-6 border border-slate-200/50 dark:border-slate-700/50">
                    <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center space-x-2">
                      <span>💡</span>
                      <span>Original Idea</span>
                    </h3>
                    <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{selectedIdea.idea}</p>
                  </div>

                  <div className="glass rounded-2xl p-6 border border-slate-200/50 dark:border-slate-700/50">
                    <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center space-x-2">
                      <span>👤</span>
                      <span>Submission Details</span>
                    </h3>
                    <div className="space-y-3">
                      <p className="text-slate-700 dark:text-slate-300">
                        <span className="font-medium">Name:</span> {selectedIdea.name}
                      </p>
                      <p className="text-slate-700 dark:text-slate-300">
                        <span className="font-medium">Email:</span> {selectedIdea.email}
                      </p>
                      <p className="text-slate-700 dark:text-slate-300">
                        <span className="font-medium">Submitted:</span> {formatDate(selectedIdea.timestamp)}
                      </p>
                    </div>
                  </div>
                </div>

                {selectedIdea.result && (
                  <div className="glass rounded-2xl p-8 border border-slate-200/50 dark:border-slate-700/50">
                    <h3 className="font-bold text-slate-900 dark:text-white mb-6 flex items-center space-x-2 text-xl">
                      <span>🎯</span>
                      <span>AI Analysis Results</span>
                    </h3>
                    
                    <div className="grid gap-6">
                      {selectedIdea.result.score?.value && (
                        <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-6 border border-blue-200/50 dark:border-blue-800/50">
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="font-bold text-slate-900 dark:text-white text-lg">Overall Score</h4>
                            <span className={`px-4 py-2 rounded-xl font-bold text-lg ${
                              selectedIdea.result.score.value >= 80 ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white' :
                              selectedIdea.result.score.value >= 60 ? 'bg-gradient-to-r from-yellow-500 to-orange-600 text-white' :
                              'bg-gradient-to-r from-red-500 to-pink-600 text-white'
                            }`}>
                              {selectedIdea.result.score.value}/100
                            </span>
                          </div>
                          {selectedIdea.result.score.reasoning && (
                            <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{selectedIdea.result.score.reasoning}</p>
                          )}
                        </div>
                      )}
                      
                      {Object.entries(selectedIdea.result).map(([key, value]) => {
                        if (key === 'score' || !value) return null;
                        return (
                          <div key={key} className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
                            <h4 className="font-bold text-slate-900 dark:text-white mb-4 text-lg capitalize">
                              {key.replace(/([A-Z])/g, ' $1').trim()}
                            </h4>
                            {Array.isArray(value) ? (
                              <ul className="space-y-2">
                                {value.map((item, index) => (
                                  <li key={index} className="flex items-start space-x-3">
                                    <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white text-xs font-bold mt-0.5">
                                      {index + 1}
                                    </div>
                                    <span className="text-slate-700 dark:text-slate-300 leading-relaxed">{item}</span>
                                  </li>
                                ))}
                              </ul>
                            ) : typeof value === 'object' ? (
                              <div className="space-y-3">
                                {Object.entries(value).map(([subKey, subValue]) => (
                                  <div key={subKey} className="bg-white dark:bg-slate-900/50 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                                    <span className="font-semibold text-slate-900 dark:text-white capitalize block mb-2">{subKey}:</span>
                                    <span className="text-slate-700 dark:text-slate-300">{subValue}</span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">{value}</p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
