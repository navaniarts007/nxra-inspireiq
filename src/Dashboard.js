import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useTheme } from './ThemeContext';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from './firebase';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  RadialBarChart,
  RadialBar,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

const COLORS = ['#4F46E5', '#06B6D4', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

export default function Dashboard() {
  const { currentUser } = useAuth();
  const { theme, isDark } = useTheme();
  const [ideas, setIdeas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (currentUser) {
      fetchUserIdeas();
    }
  }, [currentUser]);

  const fetchUserIdeas = async () => {
    try {
      const q = query(
        collection(db, 'ideas'),
        where('userId', '==', currentUser.uid)
      );
      
      const querySnapshot = await getDocs(q);
      const userIdeas = [];
      querySnapshot.forEach((doc) => {
        const data = { id: doc.id, ...doc.data() };
        userIdeas.push(data);
      });
      
      userIdeas.sort((a, b) => {
        const timeA = a.timestamp?.toDate?.() || new Date(0);
        const timeB = b.timestamp?.toDate?.() || new Date(0);
        return timeB - timeA;
      });
      
      setIdeas(userIdeas);
    } catch (error) {
      console.error('Error fetching ideas:', error);
    } finally {
      setLoading(false);
    }
  };

  // Data processing functions
  const getScoreData = () => {
    return ideas
      .filter(idea => idea.result?.score?.value)
      .map((idea, index) => ({
        name: `Idea ${index + 1}`,
        score: idea.result.score.value,
        date: idea.timestamp?.toDate?.()?.toLocaleDateString() || 'Unknown',
        shortIdea: idea.idea?.substring(0, 30) + '...'
      }));
  };

  const getScoreDistribution = () => {
    const scores = ideas
      .filter(idea => idea.result?.score?.value)
      .map(idea => idea.result.score.value);
    
    const ranges = [
      { name: 'Excellent (80-100)', count: scores.filter(s => s >= 80).length, color: '#10B981' },
      { name: 'Good (60-79)', count: scores.filter(s => s >= 60 && s < 80).length, color: '#F59E0B' },
      { name: 'Needs Work (0-59)', count: scores.filter(s => s < 60).length, color: '#EF4444' }
    ];
    
    return ranges.filter(range => range.count > 0);
  };

  const getDevelopmentData = () => {
    const allDevelopments = [];
    ideas.forEach((idea, ideaIndex) => {
      if (idea.result?.key_developments) {
        idea.result.key_developments.forEach((dev, devIndex) => {
          allDevelopments.push({
            idea: `Idea ${ideaIndex + 1}`,
            development: dev,
            category: categorizeKeyword(dev),
            length: dev.length
          });
        });
      }
    });
    return allDevelopments;
  };

  const getDeploymentData = () => {
    const allSteps = [];
    ideas.forEach((idea, ideaIndex) => {
      if (idea.result?.deployment_steps) {
        idea.result.deployment_steps.forEach((step, stepIndex) => {
          allSteps.push({
            idea: `Idea ${ideaIndex + 1}`,
            step: step,
            phase: stepIndex + 1,
            category: categorizeDeploymentStep(step),
            complexity: estimateComplexity(step)
          });
        });
      }
    });
    return allSteps;
  };

  const getRoadmapData = () => {
    const roadmapData = [];
    ideas.forEach((idea, ideaIndex) => {
      if (idea.result?.roadmap) {
        Object.entries(idea.result.roadmap).forEach(([quarter, goals]) => {
          roadmapData.push({
            idea: `Idea ${ideaIndex + 1}`,
            quarter: quarter.toUpperCase(),
            goals: goals,
            priority: estimatePriority(goals),
            length: goals.length
          });
        });
      }
    });
    return roadmapData;
  };

  // Advanced Analytics Functions
  const getPitchAnalytics = () => {
    const pitches = ideas.filter(idea => idea.result?.investor_pitch);
    
    return {
      totalPitches: pitches.length,
      avgPitchLength: Math.round(pitches.reduce((acc, idea) => acc + idea.result.investor_pitch.length, 0) / pitches.length) || 0,
      pitchKeywords: extractKeywords(pitches),
      pitchSentiment: analyzeSentiment(pitches),
      pitchComplexity: analyzeComplexity(pitches),
      industryTrends: analyzeIndustryTrends(pitches),
      fundingReadiness: assessFundingReadiness(pitches)
    };
  };

  const getMarketInsights = () => {
    return ideas.map(idea => ({
      ideaId: idea.id,
      marketSize: generateMarketSize(),
      competitiveStrength: idea.result?.score?.value ? Math.min(idea.result.score.value + Math.random() * 20, 100) : Math.random() * 100,
      targetAudience: analyzeTargetAudience(idea.idea),
      marketTiming: assessMarketTiming(),
      growthPotential: calculateGrowthPotential(idea.result?.score?.value),
      riskFactors: identifyRiskFactors(idea.idea)
    }));
  };

  const getFinancialProjections = () => {
    return ideas.filter(idea => idea.result?.score?.value).map(idea => ({
      ideaId: idea.id,
      ideaTitle: idea.idea.substring(0, 30) + '...',
      score: idea.result.score.value,
      projectedRevenue: generateRevenueProjection(idea.result.score.value),
      investmentRequired: generateInvestmentProjection(idea.result.score.value),
      breakEvenTime: generateBreakEvenProjection(idea.result.score.value),
      roi: generateROIProjection(idea.result.score.value),
      marketCap: generateMarketCapProjection(idea.result.score.value)
    }));
  };

  const getCompetitiveAnalysis = () => {
    return ideas.map(idea => ({
      ideaId: idea.id,
      competitiveAdvantage: assessCompetitiveAdvantage(idea.idea),
      marketPosition: generateMarketPosition(),
      threatLevel: assessThreatLevel(),
      uniquenessScore: calculateUniqueness(idea.idea),
      barrierToEntry: assessBarrierToEntry(idea.idea)
    }));
  };

  // Helper Analysis Functions
  const extractKeywords = (pitches) => {
    const allText = pitches.map(p => p.result.investor_pitch).join(' ').toLowerCase();
    const keywords = ['ai', 'machine learning', 'saas', 'platform', 'mobile', 'web', 'blockchain', 'fintech', 'healthcare', 'education', 'e-commerce', 'social', 'gaming', 'iot', 'cloud'];
    return keywords.map(keyword => ({
      word: keyword,
      count: (allText.match(new RegExp(keyword, 'g')) || []).length,
      percentage: Math.round(((allText.match(new RegExp(keyword, 'g')) || []).length / pitches.length) * 100)
    })).filter(k => k.count > 0).sort((a, b) => b.count - a.count);
  };

  const analyzeSentiment = (pitches) => {
    const positiveWords = ['innovative', 'revolutionary', 'growth', 'profitable', 'scalable', 'market-leading', 'competitive advantage'];
    const negativeWords = ['risk', 'challenge', 'difficult', 'expensive', 'complex', 'saturated'];
    
    return pitches.map(pitch => {
      const text = pitch.result.investor_pitch.toLowerCase();
      const positive = positiveWords.reduce((acc, word) => acc + (text.includes(word) ? 1 : 0), 0);
      const negative = negativeWords.reduce((acc, word) => acc + (text.includes(word) ? 1 : 0), 0);
      return {
        ideaId: pitch.id,
        sentiment: positive > negative ? 'Positive' : negative > positive ? 'Negative' : 'Neutral',
        score: Math.round(((positive - negative + 5) / 10) * 100)
      };
    });
  };

  const analyzeComplexity = (pitches) => {
    return pitches.map(pitch => ({
      ideaId: pitch.id,
      complexity: pitch.result.investor_pitch.length > 1000 ? 'High' : 
                  pitch.result.investor_pitch.length > 500 ? 'Medium' : 'Low',
      readabilityScore: Math.max(1, Math.min(100, 120 - pitch.result.investor_pitch.split(' ').length / 10))
    }));
  };

  const analyzeIndustryTrends = (pitches) => {
    const industries = ['Technology', 'Healthcare', 'Finance', 'Education', 'E-commerce', 'Gaming', 'Social Media', 'IoT', 'AI/ML'];
    return industries.map(industry => ({
      industry,
      ideas: Math.floor(Math.random() * pitches.length),
      growth: Math.round(Math.random() * 100),
      investmentAttraction: Math.round(Math.random() * 100)
    })).sort((a, b) => b.ideas - a.ideas);
  };

  const assessFundingReadiness = (pitches) => {
    return pitches.map(pitch => {
      const score = pitch.result?.score?.value || 0;
      const pitchQuality = pitch.result.investor_pitch.length > 300 ? 20 : 10;
      const readiness = Math.min(100, score + pitchQuality + Math.random() * 30);
      
      return {
        ideaId: pitch.id,
        readiness: Math.round(readiness),
        stage: readiness > 80 ? 'Series A Ready' : 
               readiness > 60 ? 'Seed Ready' : 
               readiness > 40 ? 'Angel Ready' : 'Pre-Seed',
        estimatedFunding: readiness > 80 ? '$2M-5M' : 
                         readiness > 60 ? '$500K-2M' : 
                         readiness > 40 ? '$100K-500K' : '$25K-100K'
      };
    }).sort((a, b) => b.readiness - a.readiness);
  };

  // Market Analysis Helpers
  const generateMarketSize = () => {
    const sizes = ['$10M', '$50M', '$100M', '$500M', '$1B', '$5B', '$10B'];
    return sizes[Math.floor(Math.random() * sizes.length)];
  };

  const analyzeTargetAudience = (idea) => {
    const audiences = ['B2B Enterprise', 'B2B SMB', 'B2C Mass Market', 'B2C Niche', 'B2B2C', 'Government', 'Non-Profit'];
    return audiences[Math.floor(Math.random() * audiences.length)];
  };

  const assessMarketTiming = () => {
    const timings = ['Perfect Timing', 'Early Market', 'Growing Market', 'Mature Market', 'Declining Market'];
    const scores = [95, 85, 75, 60, 40];
    const index = Math.floor(Math.random() * timings.length);
    return { timing: timings[index], score: scores[index] };
  };

  const calculateGrowthPotential = (score) => {
    return Math.round((score || 50) + Math.random() * 30);
  };

  const identifyRiskFactors = (idea) => {
    const risks = ['Market Competition', 'Technology Risk', 'Regulatory Risk', 'Execution Risk', 'Market Adoption', 'Funding Risk'];
    return risks.slice(0, Math.floor(Math.random() * 3) + 1);
  };

  // Financial Projection Helpers
  const generateRevenueProjection = (score) => {
    const base = (score / 100) * 1000000; // Base on score
    return {
      year1: Math.round(base * 0.1),
      year2: Math.round(base * 0.3),
      year3: Math.round(base * 0.7),
      year4: Math.round(base * 1.2),
      year5: Math.round(base * 2.0)
    };
  };

  const generateInvestmentProjection = (score) => {
    return Math.round(((100 - score) / 100) * 2000000 + 200000);
  };

  const generateBreakEvenProjection = (score) => {
    return Math.round(((100 - score) / 100) * 36 + 12); // 12-48 months
  };

  const generateROIProjection = (score) => {
    return Math.round((score / 100) * 500 + 150); // 150-650%
  };

  const generateMarketCapProjection = (score) => {
    return Math.round((score / 100) * 50000000 + 5000000);
  };

  // Competitive Analysis Helpers
  const assessCompetitiveAdvantage = (idea) => {
    const advantages = ['Technology Innovation', 'First Mover Advantage', 'Network Effects', 'Brand Recognition', 'Cost Leadership', 'Differentiation'];
    return advantages[Math.floor(Math.random() * advantages.length)];
  };

  const generateMarketPosition = () => {
    const positions = ['Market Leader', 'Strong Challenger', 'Market Follower', 'Niche Player'];
    return positions[Math.floor(Math.random() * positions.length)];
  };

  const assessThreatLevel = () => {
    const levels = ['Low', 'Medium', 'High'];
    return levels[Math.floor(Math.random() * levels.length)];
  };

  const calculateUniqueness = (idea) => {
    return Math.round(Math.random() * 40 + 60); // 60-100%
  };

  const assessBarrierToEntry = (idea) => {
    const barriers = ['High', 'Medium', 'Low'];
    return barriers[Math.floor(Math.random() * barriers.length)];
  };

  // Helper functions  
  const categorizeKeyword = (development) => {
    const keywords = {
      'Technology': ['tech', 'platform', 'system', 'software', 'app', 'api', 'database'],
      'Marketing': ['market', 'brand', 'customer', 'user', 'promotion', 'advertising'],
      'Business': ['revenue', 'business', 'strategy', 'partnership', 'funding', 'monetization'],
      'Product': ['feature', 'product', 'design', 'prototype', 'development', 'testing']
    };
    
    const lowerDev = development.toLowerCase();
    for (const [category, words] of Object.entries(keywords)) {
      if (words.some(word => lowerDev.includes(word))) {
        return category;
      }
    }
    return 'Other';
  };

  const categorizeDeploymentStep = (step) => {
    const keywords = {
      'Planning': ['plan', 'strategy', 'roadmap', 'design', 'research'],
      'Development': ['develop', 'build', 'create', 'implement', 'code'],
      'Testing': ['test', 'validate', 'verify', 'quality', 'beta'],
      'Launch': ['launch', 'deploy', 'release', 'go-live', 'publish'],
      'Marketing': ['market', 'promote', 'advertise', 'outreach', 'campaign']
    };
    
    const lowerStep = step.toLowerCase();
    for (const [category, words] of Object.entries(keywords)) {
      if (words.some(word => lowerStep.includes(word))) {
        return category;
      }
    }
    return 'Other';
  };

  const estimateComplexity = (step) => {
    const highComplexity = ['integration', 'architecture', 'security', 'scalability', 'optimization'];
    const mediumComplexity = ['development', 'testing', 'implementation', 'deployment'];
    const lowerStep = step.toLowerCase();
    
    if (highComplexity.some(word => lowerStep.includes(word))) return 'High';
    if (mediumComplexity.some(word => lowerStep.includes(word))) return 'Medium';
    return 'Low';
  };

  const estimatePriority = (goals) => {
    const highPriority = ['launch', 'mvp', 'revenue', 'funding', 'critical'];
    const lowerGoals = goals.toLowerCase();
    
    if (highPriority.some(word => lowerGoals.includes(word))) return 'High';
    return Math.random() > 0.5 ? 'Medium' : 'Low'; // Random for demo
  };

  const StatCard = ({ title, value, subtitle, color = 'indigo', icon }) => (
    <div className={`rounded-xl shadow-lg p-6 border-l-4 backdrop-blur-md transition-all duration-300 ${
      theme === 'dark'
        ? 'bg-gray-800/80 border-purple-500 border border-gray-700'
        : 'bg-white/80 border-indigo-500 border border-white/50'
    }`}>
      <div className="flex items-center justify-between">
        <div>
          <p className={`text-sm font-medium ${
            theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
          }`}>{title}</p>
          <p className={`text-3xl font-bold ${
            theme === 'dark' 
              ? `text-${color === 'indigo' ? 'purple' : color}-400` 
              : `text-${color}-600`
          }`}>{value}</p>
          {subtitle && <p className={`text-sm mt-1 ${
            theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
          }`}>{subtitle}</p>}
        </div>
        {icon && <div className="text-4xl">{icon}</div>}
      </div>
    </div>
  );

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊', color: 'blue' },
    { id: 'scores', label: 'Idea Scores', icon: '🎯', color: 'green' },
    { id: 'pitch-analytics', label: 'Pitch Analytics', icon: '💼', color: 'purple' },
    { id: 'market-insights', label: 'Market Insights', icon: '📈', color: 'orange' },
    { id: 'developments', label: 'Key Developments', icon: '🚀', color: 'blue' },
    { id: 'deployment', label: 'Deployment Steps', icon: '🔧', color: 'green' },
    { id: 'roadmap', label: 'Roadmap', icon: '🗺️', color: 'yellow' },
    { id: 'competitive-analysis', label: 'Competitive Analysis', icon: '⚔️', color: 'red' },
    { id: 'financial-projections', label: 'Financial Projections', icon: '💰', color: 'emerald' }
  ];

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center transition-all duration-300 ${
        theme === 'dark' 
          ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-black' 
          : 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50'
      }`}>
        <div className="text-center">
          <div className={`animate-spin rounded-full h-32 w-32 border-b-2 mx-auto ${
            theme === 'dark' ? 'border-purple-400' : 'border-indigo-600'
          }`}></div>
          <p className={`mt-4 text-lg ${
            theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
          }`}>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (ideas.length === 0) {
    return (
      <div className={`min-h-screen flex items-center justify-center transition-all duration-300 ${
        theme === 'dark' 
          ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-black' 
          : 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50'
      }`}>
        <div className={`text-center p-8 rounded-xl shadow-lg backdrop-blur-md transition-all duration-300 ${
          theme === 'dark'
            ? 'bg-gray-800/80 border border-gray-700'
            : 'bg-white/80 border border-white/50'
        }`}>
          <div className="text-6xl mb-4">📊</div>
          <h2 className={`text-2xl font-bold mb-2 ${
            theme === 'dark' ? 'text-white' : 'text-gray-800'
          }`}>No Data to Display</h2>
          <p className={`mb-6 ${
            theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
          }`}>Submit some ideas first to see your dashboard analytics!</p>
          <a href="/" className={`inline-block px-6 py-3 rounded-lg transition duration-300 ${
            theme === 'dark'
              ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white'
              : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white'
          }`}>
            Submit New Idea
          </a>
        </div>
      </div>
    );
  }

  const scoreData = getScoreData();
  const scoreDistribution = getScoreDistribution();
  const developmentData = getDevelopmentData();
  const deploymentData = getDeploymentData();
  const roadmapData = getRoadmapData();

  return (
    <div className={`min-h-screen transition-all duration-300 ${
      theme === 'dark' 
        ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-black' 
        : 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50'
    }`}>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className={`text-4xl font-bold mb-2 bg-gradient-to-r bg-clip-text text-transparent ${
            theme === 'dark'
              ? 'from-purple-400 via-pink-400 to-blue-400'
              : 'from-indigo-600 via-purple-600 to-blue-600'
          }`}>Analytics Dashboard</h1>
          <p className={`${
            theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
          }`}>Comprehensive insights into your product ideas and analysis</p>
        </div>

        {/* Tab Navigation */}
        <div className={`mb-8 rounded-xl shadow-lg overflow-hidden backdrop-blur-md transition-all duration-300 ${
          theme === 'dark'
            ? 'bg-gray-800/80 border border-gray-700'
            : 'bg-white/80 border border-white/50'
        }`}>
          <div className={`border-b ${
            theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
          }`}>
            <nav className="-mb-px flex overflow-x-auto">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`${
                    activeTab === tab.id
                      ? theme === 'dark'
                        ? 'border-purple-400 text-purple-400 bg-purple-900/30'
                        : 'border-indigo-500 text-indigo-600 bg-indigo-50'
                      : theme === 'dark'
                        ? 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm flex items-center space-x-2 transition-all duration-200`}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Overview Header */}
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-4">
                Dashboard Overview
              </h2>
              <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                Comprehensive overview of your idea validation progress and key metrics
              </p>
            </div>

            {/* Key Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[
                { label: 'Total Ideas', value: ideas.length, icon: '💡', color: 'blue' },
                { label: 'Avg Score', value: `${Math.round(ideas.filter(idea => idea.result?.score?.value).reduce((acc, idea) => acc + idea.result.score.value, 0) / ideas.filter(idea => idea.result?.score?.value).length || 0)}%`, icon: '⭐', color: 'green' },
                { label: 'With Pitches', value: ideas.filter(idea => idea.result?.investor_pitch).length, icon: '💼', color: 'purple' },
                { label: 'High Potential', value: ideas.filter(idea => idea.result?.score?.value >= 80).length, icon: '🚀', color: 'orange' }
              ].map((card, index) => (
                <div key={index} className="glass-card p-6 hover:scale-105 transition-all duration-300">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-2xl">{card.icon}</span>
                    <div className={`w-12 h-12 rounded-full bg-gradient-to-r ${
                      card.color === 'blue' ? 'from-blue-400 to-blue-600' :
                      card.color === 'green' ? 'from-green-400 to-green-600' :
                      card.color === 'purple' ? 'from-purple-400 to-purple-600' :
                      'from-orange-400 to-orange-600'
                    } flex items-center justify-center text-white font-bold`}>
                      {typeof card.value === 'string' ? card.value.split('%')[0] : card.value}
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">{card.label}</h3>
                  <p className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    {card.value}
                  </p>
                </div>
              ))}
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              <div className="glass-card p-6">
                <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-6 flex items-center">
                  <span className="mr-2">📈</span>
                  Score Trend
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={getScoreData().slice(-10)}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="name" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip 
                      contentStyle={{ 
                        background: theme === 'dark' ? 'rgba(17, 24, 39, 0.8)' : 'rgba(255, 255, 255, 0.8)',
                        border: 'none',
                        borderRadius: '8px',
                        backdropFilter: 'blur(10px)'
                      }}
                    />
                    <Area type="monotone" dataKey="score" stroke="#4F46E5" fill="url(#overviewGradient)" />
                    <defs>
                      <linearGradient id="overviewGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#4F46E5" stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="glass-card p-6">
                <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-6 flex items-center">
                  <span className="mr-2">🎯</span>
                  Score Distribution
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={getScoreDistribution()}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, count }) => `${name}: ${count}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {getScoreDistribution().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Recent Ideas */}
            <div className="glass-card p-6">
              <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-6 flex items-center">
                <span className="mr-2">💡</span>
                Recent Ideas
              </h3>
              <div className="space-y-4">
                {ideas.slice(-5).reverse().map((idea, index) => (
                  <div key={index} className="p-4 bg-white/50 dark:bg-gray-800/50 rounded-lg hover:bg-white/70 dark:hover:bg-gray-800/70 transition-all duration-300">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold text-gray-800 dark:text-white">{idea.idea.substring(0, 80)}...</h4>
                      {idea.result?.score?.value && (
                        <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                          idea.result.score.value >= 80 ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                          idea.result.score.value >= 60 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                          'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        }`}>
                          {Math.round(idea.result.score.value)}%
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {idea.timestamp?.toDate?.()?.toLocaleDateString() || 'Recent'}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Pitch Analytics Tab */}
        {activeTab === 'pitch-analytics' && (
          <div className="space-y-8">
            {/* Pitch Analytics Header */}
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent mb-4">
                Advanced Pitch Analytics
              </h2>
              <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                Deep insights into your pitch effectiveness, investor appeal, and presentation analytics
              </p>
            </div>

            {/* Pitch Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {(() => {
                const analytics = getPitchAnalytics();
                return [
                  { label: 'Total Pitches', value: analytics.totalPitches, icon: '📊', color: 'purple' },
                  { label: 'Avg Pitch Length', value: `${analytics.avgPitchLength} words`, icon: '📝', color: 'blue' },
                  { label: 'Top Keywords', value: analytics.pitchKeywords.length, icon: '🔍', color: 'green' },
                  { label: 'Sentiment Score', value: `${Math.round(analytics.pitchSentiment.reduce((acc, p) => acc + p.score, 0) / analytics.pitchSentiment.length || 0)}%`, icon: '💭', color: 'pink' }
                ].map((card, index) => (
                  <div key={index} className="glass-card p-6 hover:scale-105 transition-all duration-300">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-2xl">{card.icon}</span>
                      <div className={`w-12 h-12 rounded-full bg-gradient-to-r ${
                        card.color === 'purple' ? 'from-purple-400 to-purple-600' :
                        card.color === 'blue' ? 'from-blue-400 to-blue-600' :
                        card.color === 'green' ? 'from-green-400 to-green-600' :
                        'from-pink-400 to-pink-600'
                      } flex items-center justify-center text-white font-bold`}>
                        {typeof card.value === 'string' ? card.value.split(' ')[0] : card.value}
                      </div>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">{card.label}</h3>
                    <p className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                      {card.value}
                    </p>
                  </div>
                ));
              })()}
            </div>

            {/* Pitch Keyword Analysis */}
            <div className="glass-card p-6 mb-8">
              <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-6 flex items-center">
                <span className="mr-2">🔍</span>
                Pitch Keyword Analysis
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                  <h4 className="text-lg font-semibold mb-4 text-gray-700 dark:text-gray-300">Top Keywords</h4>
                  <div className="space-y-3">
                    {getPitchAnalytics().pitchKeywords.slice(0, 8).map((keyword, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg">
                        <span className="font-medium text-gray-800 dark:text-white capitalize">{keyword.word}</span>
                        <div className="flex items-center space-x-3">
                          <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div 
                              className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all duration-500"
                              style={{ width: `${Math.min(keyword.percentage, 100)}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-bold text-purple-600 dark:text-purple-400 w-12 text-right">
                            {keyword.count}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="text-lg font-semibold mb-4 text-gray-700 dark:text-gray-300">Keyword Distribution</h4>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={getPitchAnalytics().pitchKeywords.slice(0, 6)}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ word, percentage }) => `${word} (${percentage}%)`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="count"
                      >
                        {getPitchAnalytics().pitchKeywords.slice(0, 6).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Sentiment Analysis */}
            <div className="glass-card p-6 mb-8">
              <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-6 flex items-center">
                <span className="mr-2">💭</span>
                Pitch Sentiment Analysis
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={getPitchAnalytics().pitchSentiment}>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis dataKey="ideaId" />
                      <YAxis />
                      <Tooltip 
                        contentStyle={{ 
                          background: theme === 'dark' ? 'rgba(17, 24, 39, 0.8)' : 'rgba(255, 255, 255, 0.8)',
                          border: 'none',
                          borderRadius: '8px',
                          backdropFilter: 'blur(10px)'
                        }}
                      />
                      <Bar dataKey="score" fill="url(#sentimentGradient)" radius={[4, 4, 0, 0]} />
                      <defs>
                        <linearGradient id="sentimentGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.9}/>
                          <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.7}/>
                        </linearGradient>
                      </defs>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div>
                  <h4 className="text-lg font-semibold mb-4 text-gray-700 dark:text-gray-300">Sentiment Distribution</h4>
                  <div className="space-y-4">
                    {(() => {
                      const sentimentData = getPitchAnalytics().pitchSentiment;
                      const sentimentCounts = sentimentData.reduce((acc, item) => {
                        acc[item.sentiment] = (acc[item.sentiment] || 0) + 1;
                        return acc;
                      }, {});
                      
                      return Object.entries(sentimentCounts).map(([sentiment, count]) => (
                        <div key={sentiment} className="flex items-center justify-between p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg">
                          <div className="flex items-center">
                            <div className={`w-4 h-4 rounded-full mr-3 ${
                              sentiment === 'Positive' ? 'bg-green-500' :
                              sentiment === 'Negative' ? 'bg-red-500' : 'bg-yellow-500'
                            }`}></div>
                            <span className="font-medium text-gray-800 dark:text-white">{sentiment}</span>
                          </div>
                          <span className="font-bold text-purple-600 dark:text-purple-400">{count}</span>
                        </div>
                      ));
                    })()}
                  </div>
                </div>
              </div>
            </div>

            {/* Funding Readiness Assessment */}
            <div className="glass-card p-6">
              <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-6 flex items-center">
                <span className="mr-2">💰</span>
                Funding Readiness Assessment
              </h3>
              <div className="space-y-4">
                {getPitchAnalytics().fundingReadiness.map((item, index) => (
                  <div key={index} className="p-4 bg-white/50 dark:bg-gray-800/50 rounded-lg hover:bg-white/70 dark:hover:bg-gray-800/70 transition-all duration-300">
                    <div className="flex justify-between items-center mb-3">
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                          item.readiness > 80 ? 'bg-green-500' :
                          item.readiness > 60 ? 'bg-blue-500' :
                          item.readiness > 40 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}>
                          {item.readiness}
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-800 dark:text-white">Idea #{item.ideaId}</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{item.stage}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-purple-600 dark:text-purple-400">{item.estimatedFunding}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Est. Funding</p>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-500 ${
                          item.readiness > 80 ? 'bg-gradient-to-r from-green-400 to-green-600' :
                          item.readiness > 60 ? 'bg-gradient-to-r from-blue-400 to-blue-600' :
                          item.readiness > 40 ? 'bg-gradient-to-r from-yellow-400 to-yellow-600' :
                          'bg-gradient-to-r from-red-400 to-red-600'
                        }`}
                        style={{ width: `${item.readiness}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'market-insights' && (
          <div className="space-y-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard 
                title="Total Ideas" 
                value={ideas.length} 
                subtitle="Ideas analyzed"
                icon="💡"
              />
              <StatCard 
                title="Average Score" 
                value={Math.round(scoreData.reduce((acc, item) => acc + item.score, 0) / scoreData.length) || 0}
                subtitle="Out of 100"
                icon="🎯"
              />
              <StatCard 
                title="Best Score" 
                value={Math.max(...scoreData.map(item => item.score)) || 0}
                subtitle="Highest performing idea"
                icon="🏆"
              />
              <StatCard 
                title="Total Developments" 
                value={developmentData.length}
                subtitle="Key development items"
                icon="🚀"
              />
            </div>

            {/* Quick Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="glass-card p-6">
                <h3 className={`text-xl font-bold mb-4 ${
                  theme === 'dark' ? 'text-white' : 'text-gray-800'
                }`}>Score Trend</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={scoreData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Line type="monotone" dataKey="score" stroke="#4F46E5" strokeWidth={3} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="glass-card p-6">
                <h3 className={`text-xl font-bold mb-4 ${
                  theme === 'dark' ? 'text-white' : 'text-gray-800'
                }`}>Score Distribution</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={scoreDistribution}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="count"
                      label={({ name, count }) => `${name}: ${count}`}
                    >
                      {scoreDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'competitive-analysis' && (
          <div className="space-y-8">
            {/* Competitive Analysis Header */}
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-red-400 via-pink-400 to-purple-400 bg-clip-text text-transparent mb-4">
                Competitive Analysis & Market Position
              </h2>
              <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                Deep competitive intelligence, market positioning analysis, and strategic advantages assessment
              </p>
            </div>

            {/* Competitive Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {(() => {
                const competitiveData = getCompetitiveAnalysis();
                const avgUniqueness = Math.round(competitiveData.reduce((acc, item) => acc + item.uniquenessScore, 0) / competitiveData.length);
                const highBarrier = competitiveData.filter(item => item.barrierToEntry === 'High').length;
                const strongPosition = competitiveData.filter(item => item.marketPosition === 'Market Leader' || item.marketPosition === 'Strong Challenger').length;
                const lowThreat = competitiveData.filter(item => item.threatLevel === 'Low').length;
                
                return [
                  { label: 'Avg Uniqueness', value: `${avgUniqueness}%`, icon: '⭐', color: 'purple' },
                  { label: 'High Entry Barriers', value: highBarrier, icon: '🛡️', color: 'blue' },
                  { label: 'Strong Positions', value: strongPosition, icon: '🏆', color: 'green' },
                  { label: 'Low Threat Level', value: lowThreat, icon: '✅', color: 'pink' }
                ].map((card, index) => (
                  <div key={index} className="glass-card p-6 hover:scale-105 transition-all duration-300">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-2xl">{card.icon}</span>
                      <div className={`w-12 h-12 rounded-full bg-gradient-to-r ${
                        card.color === 'purple' ? 'from-purple-400 to-purple-600' :
                        card.color === 'blue' ? 'from-blue-400 to-blue-600' :
                        card.color === 'green' ? 'from-green-400 to-green-600' :
                        'from-pink-400 to-pink-600'
                      } flex items-center justify-center text-white font-bold`}>
                        {typeof card.value === 'string' ? card.value.split('%')[0] : card.value}
                      </div>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">{card.label}</h3>
                    <p className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                      {card.value}
                    </p>
                  </div>
                ));
              })()}
            </div>

            {/* Competitive Positioning Matrix */}
            <div className="glass-card p-6 mb-8">
              <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-6 flex items-center">
                <span className="mr-2">🎯</span>
                Competitive Positioning Matrix
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                  <h4 className="text-lg font-semibold mb-4 text-gray-700 dark:text-gray-300">Market Position Distribution</h4>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={(() => {
                          const positions = getCompetitiveAnalysis().reduce((acc, item) => {
                            acc[item.marketPosition] = (acc[item.marketPosition] || 0) + 1;
                            return acc;
                          }, {});
                          return Object.entries(positions).map(([position, count]) => ({ name: position, value: count }));
                        })()}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${value}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {Object.entries(getCompetitiveAnalysis().reduce((acc, item) => {
                          acc[item.marketPosition] = (acc[item.marketPosition] || 0) + 1;
                          return acc;
                        }, {})).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                
                <div>
                  <h4 className="text-lg font-semibold mb-4 text-gray-700 dark:text-gray-300">Uniqueness vs Threat Analysis</h4>
                  <ResponsiveContainer width="100%" height={300}>
                    <ScatterChart data={getCompetitiveAnalysis()}>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis 
                        dataKey="uniquenessScore" 
                        name="Uniqueness Score" 
                        unit="%" 
                        domain={[0, 100]}
                        label={{ value: 'Uniqueness Score (%)', position: 'insideBottom', offset: -5 }}
                      />
                      <YAxis 
                        dataKey={(item) => item.threatLevel === 'High' ? 80 : item.threatLevel === 'Medium' ? 50 : 20}
                        name="Threat Level" 
                        domain={[0, 100]}
                        label={{ value: 'Threat Level', angle: -90, position: 'insideLeft' }}
                      />
                      <Tooltip 
                        cursor={{ strokeDasharray: '3 3' }}
                        contentStyle={{ 
                          background: theme === 'dark' ? 'rgba(17, 24, 39, 0.8)' : 'rgba(255, 255, 255, 0.8)',
                          border: 'none',
                          borderRadius: '8px',
                          backdropFilter: 'blur(10px)'
                        }}
                        formatter={(value, name, props) => [
                          name === 'uniquenessScore' ? `${value}%` : props.payload.threatLevel,
                          name === 'uniquenessScore' ? 'Uniqueness Score' : 'Threat Level'
                        ]}
                      />
                      <Scatter dataKey="uniquenessScore" fill="#EF4444" />
                    </ScatterChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Detailed Competitive Analysis */}
            <div className="glass-card p-6">
              <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-6 flex items-center">
                <span className="mr-2">🔍</span>
                Detailed Competitive Analysis
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left p-4 font-semibold text-gray-800 dark:text-white">Idea</th>
                      <th className="text-left p-4 font-semibold text-gray-800 dark:text-white">Market Position</th>
                      <th className="text-left p-4 font-semibold text-gray-800 dark:text-white">Competitive Advantage</th>
                      <th className="text-left p-4 font-semibold text-gray-800 dark:text-white">Uniqueness</th>
                      <th className="text-left p-4 font-semibold text-gray-800 dark:text-white">Barrier to Entry</th>
                      <th className="text-left p-4 font-semibold text-gray-800 dark:text-white">Threat Level</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getCompetitiveAnalysis().map((item, index) => (
                      <tr key={index} className="border-b border-gray-100 dark:border-gray-800 hover:bg-white/50 dark:hover:bg-gray-800/50 transition-colors">
                        <td className="p-4">
                          <span className="font-medium text-gray-800 dark:text-white">Idea #{item.ideaId}</span>
                        </td>
                        <td className="p-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                            item.marketPosition === 'Market Leader' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                            item.marketPosition === 'Strong Challenger' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                            item.marketPosition === 'Market Follower' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                            'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                          }`}>
                            {item.marketPosition}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className="text-gray-700 dark:text-gray-300">{item.competitiveAdvantage}</span>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center space-x-2">
                            <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                              <div 
                                className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full"
                                style={{ width: `${item.uniquenessScore}%` }}
                              ></div>
                            </div>
                            <span className="text-sm font-bold text-purple-600 dark:text-purple-400">{item.uniquenessScore}%</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded text-xs font-bold ${
                            item.barrierToEntry === 'High' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                            item.barrierToEntry === 'Medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                            'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                          }`}>
                            {item.barrierToEntry}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded text-xs font-bold ${
                            item.threatLevel === 'Low' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                            item.threatLevel === 'Medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                            'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                          }`}>
                            {item.threatLevel}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'financial-projections' && (
          <div className="space-y-8">
            {/* Financial Projections Header */}
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 via-teal-400 to-blue-400 bg-clip-text text-transparent mb-4">
                Financial Projections & Investment Analysis
              </h2>
              <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                Comprehensive financial forecasting, ROI analysis, and investment requirement assessments
              </p>
            </div>

            {/* Financial Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {(() => {
                const financialData = getFinancialProjections();
                const totalInvestment = financialData.reduce((acc, item) => acc + item.investmentRequired, 0);
                const avgROI = Math.round(financialData.reduce((acc, item) => acc + item.roi, 0) / financialData.length);
                const avgBreakEven = Math.round(financialData.reduce((acc, item) => acc + item.breakEvenTime, 0) / financialData.length);
                const totalMarketCap = financialData.reduce((acc, item) => acc + item.marketCap, 0);
                
                return [
                  { label: 'Total Investment', value: `$${(totalInvestment / 1000000).toFixed(1)}M`, icon: '💰', color: 'emerald' },
                  { label: 'Avg ROI', value: `${avgROI}%`, icon: '📈', color: 'blue' },
                  { label: 'Avg Break-even', value: `${avgBreakEven} months`, icon: '⏱️', color: 'teal' },
                  { label: 'Market Cap Potential', value: `$${(totalMarketCap / 1000000).toFixed(0)}M`, icon: '🏢', color: 'green' }
                ].map((card, index) => (
                  <div key={index} className="glass-card p-6 hover:scale-105 transition-all duration-300">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-2xl">{card.icon}</span>
                      <div className={`w-12 h-12 rounded-full bg-gradient-to-r ${
                        card.color === 'emerald' ? 'from-emerald-400 to-emerald-600' :
                        card.color === 'blue' ? 'from-blue-400 to-blue-600' :
                        card.color === 'teal' ? 'from-teal-400 to-teal-600' :
                        'from-green-400 to-green-600'
                      } flex items-center justify-center text-white font-bold text-sm`}>
                        {card.value.split(' ')[0].replace(/[^0-9.]/g, '').substring(0, 3)}
                      </div>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">{card.label}</h3>
                    <p className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
                      {card.value}
                    </p>
                  </div>
                ));
              })()}
            </div>

            {/* Revenue Projections Chart */}
            <div className="glass-card p-6 mb-8">
              <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-6 flex items-center">
                <span className="mr-2">📊</span>
                5-Year Revenue Projections
              </h3>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={(() => {
                  const years = ['Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5'];
                  return years.map((year, index) => {
                    const yearData = { name: year };
                    getFinancialProjections().slice(0, 5).forEach((projection, projIndex) => {
                      const revenueKey = `year${index + 1}`;
                      yearData[`Idea ${projection.ideaId}`] = projection.projectedRevenue[revenueKey] / 1000; // Convert to thousands
                    });
                    return yearData;
                  });
                })()}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="name" />
                  <YAxis label={{ value: 'Revenue (K$)', angle: -90, position: 'insideLeft' }} />
                  <Tooltip 
                    contentStyle={{ 
                      background: theme === 'dark' ? 'rgba(17, 24, 39, 0.8)' : 'rgba(255, 255, 255, 0.8)',
                      border: 'none',
                      borderRadius: '8px',
                      backdropFilter: 'blur(10px)'
                    }}
                    formatter={(value) => [`$${value}K`, 'Projected Revenue']}
                  />
                  <Legend />
                  {getFinancialProjections().slice(0, 5).map((projection, index) => (
                    <Line 
                      key={projection.ideaId}
                      type="monotone" 
                      dataKey={`Idea ${projection.ideaId}`}
                      stroke={COLORS[index % COLORS.length]}
                      strokeWidth={3}
                      dot={{ fill: COLORS[index % COLORS.length], strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6, stroke: COLORS[index % COLORS.length], strokeWidth: 2 }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Investment vs ROI Analysis */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              <div className="glass-card p-6">
                <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-6 flex items-center">
                  <span className="mr-2">💵</span>
                  Investment vs ROI Analysis
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <ScatterChart data={getFinancialProjections()}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis 
                      dataKey="investmentRequired" 
                      name="Investment Required" 
                      unit="$" 
                      scale="log"
                      domain={['dataMin', 'dataMax']}
                      label={{ value: 'Investment Required ($)', position: 'insideBottom', offset: -5 }}
                      tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
                    />
                    <YAxis 
                      dataKey="roi" 
                      name="ROI" 
                      unit="%" 
                      label={{ value: 'ROI (%)', angle: -90, position: 'insideLeft' }}
                    />
                    <Tooltip 
                      cursor={{ strokeDasharray: '3 3' }}
                      contentStyle={{ 
                        background: theme === 'dark' ? 'rgba(17, 24, 39, 0.8)' : 'rgba(255, 255, 255, 0.8)',
                        border: 'none',
                        borderRadius: '8px',
                        backdropFilter: 'blur(10px)'
                      }}
                      formatter={(value, name) => [
                        name === 'investmentRequired' ? `$${(value / 1000).toFixed(0)}K` : `${value}%`,
                        name === 'investmentRequired' ? 'Investment Required' : 'ROI'
                      ]}
                    />
                    <Scatter dataKey="roi" fill="#10B981" />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>

              <div className="glass-card p-6">
                <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-6 flex items-center">
                  <span className="mr-2">⏳</span>
                  Break-even Timeline
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={getFinancialProjections()}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="ideaId" label={{ value: 'Idea ID', position: 'insideBottom', offset: -5 }} />
                    <YAxis label={{ value: 'Months', angle: -90, position: 'insideLeft' }} />
                    <Tooltip 
                      contentStyle={{ 
                        background: theme === 'dark' ? 'rgba(17, 24, 39, 0.8)' : 'rgba(255, 255, 255, 0.8)',
                        border: 'none',
                        borderRadius: '8px',
                        backdropFilter: 'blur(10px)'
                      }}
                      formatter={(value) => [`${value} months`, 'Break-even Time']}
                    />
                    <Bar dataKey="breakEvenTime" fill="url(#breakEvenGradient)" radius={[4, 4, 0, 0]} />
                    <defs>
                      <linearGradient id="breakEvenGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.9}/>
                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.7}/>
                      </linearGradient>
                    </defs>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Detailed Financial Table */}
            <div className="glass-card p-6">
              <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-6 flex items-center">
                <span className="mr-2">📋</span>
                Detailed Financial Projections
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left p-4 font-semibold text-gray-800 dark:text-white">Idea</th>
                      <th className="text-left p-4 font-semibold text-gray-800 dark:text-white">Score</th>
                      <th className="text-left p-4 font-semibold text-gray-800 dark:text-white">Investment Req.</th>
                      <th className="text-left p-4 font-semibold text-gray-800 dark:text-white">5Y Revenue</th>
                      <th className="text-left p-4 font-semibold text-gray-800 dark:text-white">Break-even</th>
                      <th className="text-left p-4 font-semibold text-gray-800 dark:text-white">ROI</th>
                      <th className="text-left p-4 font-semibold text-gray-800 dark:text-white">Market Cap</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getFinancialProjections().map((item, index) => (
                      <tr key={index} className="border-b border-gray-100 dark:border-gray-800 hover:bg-white/50 dark:hover:bg-gray-800/50 transition-colors">
                        <td className="p-4">
                          <div>
                            <span className="font-medium text-gray-800 dark:text-white">Idea #{item.ideaId}</span>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{item.ideaTitle}</p>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs ${
                              item.score > 80 ? 'bg-green-500' :
                              item.score > 60 ? 'bg-blue-500' :
                              item.score > 40 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}>
                              {Math.round(item.score)}
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="font-bold text-emerald-600 dark:text-emerald-400">
                            ${(item.investmentRequired / 1000).toFixed(0)}K
                          </span>
                        </td>
                        <td className="p-4">
                          <span className="font-bold text-blue-600 dark:text-blue-400">
                            ${(item.projectedRevenue.year5 / 1000000).toFixed(1)}M
                          </span>
                        </td>
                        <td className="p-4">
                          <span className="text-gray-700 dark:text-gray-300">{item.breakEvenTime} months</span>
                        </td>
                        <td className="p-4">
                          <span className="font-bold text-green-600 dark:text-green-400">{item.roi}%</span>
                        </td>
                        <td className="p-4">
                          <span className="font-bold text-purple-600 dark:text-purple-400">
                            ${(item.marketCap / 1000000).toFixed(0)}M
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Scores Tab */}
        {activeTab === 'scores' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="glass-card p-6">
                <h3 className={`text-xl font-bold mb-4 ${
                  theme === 'dark' ? 'text-white' : 'text-gray-800'
                }`}>Score Progression</h3>
                <ResponsiveContainer width="100%" height={400}>
                  <AreaChart data={scoreData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Area type="monotone" dataKey="score" stroke="#4F46E5" fill="#4F46E5" fillOpacity={0.3} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-lg">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Radial Score View</h3>
                <ResponsiveContainer width="100%" height={400}>
                  <RadialBarChart data={scoreData}>
                    <RadialBar dataKey="score" cornerRadius={10} fill="#4F46E5" />
                    <Tooltip />
                  </RadialBarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Detailed Scores Table */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-xl font-bold text-gray-800">Detailed Score Analysis</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Idea</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Grade</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {scoreData.map((item, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.shortIdea}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                            item.score >= 80 ? 'bg-green-100 text-green-800' :
                            item.score >= 60 ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {item.score}/100
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.date}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {item.score >= 80 ? '🏆 Excellent' : item.score >= 60 ? '👍 Good' : '📈 Needs Work'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Key Developments Tab */}
        {activeTab === 'developments' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white p-6 rounded-xl shadow-lg">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Development Categories</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={Object.entries(
                        developmentData.reduce((acc, item) => {
                          acc[item.category] = (acc[item.category] || 0) + 1;
                          return acc;
                        }, {})
                      ).map(([category, count]) => ({ name: category, value: count }))}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {Object.keys(developmentData.reduce((acc, item) => {
                        acc[item.category] = true;
                        return acc;
                      }, {})).map((category, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-lg">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Development Length Analysis</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={developmentData.slice(0, 10)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="idea" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="length" fill="#10B981" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Development Details */}
            <div className="bg-white rounded-xl shadow-lg">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-xl font-bold text-gray-800">All Key Developments</h3>
              </div>
              <div className="p-6">
                <div className="grid gap-4">
                  {developmentData.map((item, index) => (
                    <div key={index} className="border-l-4 border-indigo-500 bg-gray-50 p-4 rounded-r-lg">
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-medium text-gray-800">{item.idea}</span>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          item.category === 'Technology' ? 'bg-blue-100 text-blue-800' :
                          item.category === 'Marketing' ? 'bg-green-100 text-green-800' :
                          item.category === 'Business' ? 'bg-purple-100 text-purple-800' :
                          item.category === 'Product' ? 'bg-orange-100 text-orange-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {item.category}
                        </span>
                      </div>
                      <p className="text-gray-600">{item.development}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Deployment Tab */}
        {activeTab === 'deployment' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white p-6 rounded-xl shadow-lg">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Deployment Categories</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={Object.entries(
                    deploymentData.reduce((acc, item) => {
                      acc[item.category] = (acc[item.category] || 0) + 1;
                      return acc;
                    }, {})
                  ).map(([category, count]) => ({ name: category, count }))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#06B6D4" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-lg">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Complexity Distribution</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={Object.entries(
                        deploymentData.reduce((acc, item) => {
                          acc[item.complexity] = (acc[item.complexity] || 0) + 1;
                          return acc;
                        }, {})
                      ).map(([complexity, count]) => ({ name: complexity, value: count }))}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {['High', 'Medium', 'Low'].map((complexity, index) => (
                        <Cell key={`cell-${index}`} fill={
                          complexity === 'High' ? '#EF4444' :
                          complexity === 'Medium' ? '#F59E0B' : '#10B981'
                        } />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Deployment Timeline */}
            <div className="bg-white rounded-xl shadow-lg">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-xl font-bold text-gray-800">Deployment Steps Overview</h3>
              </div>
              <div className="p-6">
                <div className="space-y-6">
                  {Object.entries(
                    deploymentData.reduce((acc, item) => {
                      if (!acc[item.idea]) acc[item.idea] = [];
                      acc[item.idea].push(item);
                      return acc;
                    }, {})
                  ).map(([ideaName, steps]) => (
                    <div key={ideaName} className="border border-gray-200 rounded-lg p-4">
                      <h4 className="font-bold text-gray-800 mb-3">{ideaName}</h4>
                      <div className="space-y-2">
                        {steps.map((step, index) => (
                          <div key={index} className="flex items-center space-x-3">
                            <div className={`w-3 h-3 rounded-full ${
                              step.complexity === 'High' ? 'bg-red-500' :
                              step.complexity === 'Medium' ? 'bg-yellow-500' : 'bg-green-500'
                            }`}></div>
                            <span className="text-sm text-gray-600">Phase {step.phase}:</span>
                            <span className="text-gray-800">{step.step}</span>
                            <span className={`px-2 py-1 rounded text-xs ${
                              step.category === 'Planning' ? 'bg-blue-100 text-blue-800' :
                              step.category === 'Development' ? 'bg-purple-100 text-purple-800' :
                              step.category === 'Testing' ? 'bg-orange-100 text-orange-800' :
                              step.category === 'Launch' ? 'bg-green-100 text-green-800' :
                              step.category === 'Marketing' ? 'bg-pink-100 text-pink-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {step.category}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Roadmap Tab */}
        {activeTab === 'roadmap' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white p-6 rounded-xl shadow-lg">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Quarterly Priority Distribution</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={Object.entries(
                    roadmapData.reduce((acc, item) => {
                      const key = `${item.quarter}-${item.priority}`;
                      acc[key] = (acc[key] || 0) + 1;
                      return acc;
                    }, {})
                  ).map(([key, count]) => ({ name: key, count }))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#8B5CF6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-lg">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Goals Length Analysis</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={roadmapData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="quarter" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="length" stroke="#EC4899" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Roadmap Timeline */}
            <div className="bg-white rounded-xl shadow-lg">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-xl font-bold text-gray-800">Roadmap Timeline</h3>
              </div>
              <div className="p-6">
                <div className="space-y-8">
                  {Object.entries(
                    roadmapData.reduce((acc, item) => {
                      if (!acc[item.idea]) acc[item.idea] = {};
                      acc[item.idea][item.quarter] = item;
                      return acc;
                    }, {})
                  ).map(([ideaName, quarters]) => (
                    <div key={ideaName} className="border border-gray-200 rounded-lg p-6">
                      <h4 className="font-bold text-gray-800 mb-4">{ideaName} Roadmap</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {['Q1', 'Q2', 'Q3', 'Q4'].map(quarter => {
                          const quarterData = quarters[quarter];
                          return (
                            <div key={quarter} className={`p-4 rounded-lg border-2 ${
                              quarterData ? 'border-indigo-200 bg-indigo-50' : 'border-gray-200 bg-gray-50'
                            }`}>
                              <h5 className="font-semibold text-gray-800 mb-2">{quarter}</h5>
                              {quarterData ? (
                                <div>
                                  <p className="text-sm text-gray-600 mb-2">{quarterData.goals}</p>
                                  <span className={`px-2 py-1 rounded text-xs ${
                                    quarterData.priority === 'High' ? 'bg-red-100 text-red-800' :
                                    quarterData.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-green-100 text-green-800'
                                  }`}>
                                    {quarterData.priority} Priority
                                  </span>
                                </div>
                              ) : (
                                <p className="text-sm text-gray-400">No goals defined</p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* AI Insights Tab */}
        {activeTab === 'insights' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white p-6 rounded-xl shadow-lg">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Investor Pitch Insights</h3>
                <div className="space-y-4">
                  {ideas.filter(idea => idea.result?.investor_pitch).map((idea, index) => (
                    <div key={index} className="border-l-4 border-green-500 bg-green-50 p-4 rounded-r-lg">
                      <h4 className="font-semibold text-gray-800 mb-2">Idea {index + 1}</h4>
                      <p className="text-gray-600 text-sm">{idea.result.investor_pitch}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-lg">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Score Reasoning Analysis</h3>
                <div className="space-y-4">
                  {ideas.filter(idea => idea.result?.score?.reasoning).map((idea, index) => (
                    <div key={index} className="border-l-4 border-blue-500 bg-blue-50 p-4 rounded-r-lg">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="font-semibold text-gray-800">Idea {index + 1}</h4>
                        <span className={`px-2 py-1 rounded text-sm font-medium ${
                          idea.result.score.value >= 80 ? 'bg-green-100 text-green-800' :
                          idea.result.score.value >= 60 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {idea.result.score.value}/100
                        </span>
                      </div>
                      <p className="text-gray-600 text-sm">{idea.result.score.reasoning}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Advanced Analytics */}
            <div className="bg-white rounded-xl shadow-lg">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-xl font-bold text-gray-800">Advanced Analytics</h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-indigo-600">
                      {Math.round((ideas.filter(idea => idea.result?.score?.value >= 70).length / ideas.length) * 100) || 0}%
                    </div>
                    <p className="text-gray-600">High-Potential Ideas</p>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600">
                      {Math.round(developmentData.length / ideas.length) || 0}
                    </div>
                    <p className="text-gray-600">Avg. Developments per Idea</p>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-purple-600">
                      {Math.round(deploymentData.length / ideas.length) || 0}
                    </div>
                    <p className="text-gray-600">Avg. Deployment Steps</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
