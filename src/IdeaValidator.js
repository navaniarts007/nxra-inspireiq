import React from 'react';
import { useAuth } from './AuthContext';
import { useTheme } from './ThemeContext';
import { saveIdeaToFirestore } from './firebaseUtils';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';

// IdeaValidator Component (previously the main App logic)
export default function IdeaValidator() {
  console.log('🎨 IdeaValidator component rendering...');
  
  const { currentUser } = useAuth();
  const { isDark } = useTheme();
  
  console.log('👤 Current user:', currentUser ? 'Logged in' : 'Not logged in');
  console.log('🌙 Dark mode:', isDark);
  
  // --- STATE VARIABLES ---
  const [name, setName] = React.useState(currentUser?.displayName || '');
  const [phone, setPhone] = React.useState('');
  const [email, setEmail] = React.useState(currentUser?.email || '');
  
  const [idea, setIdea] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [result, setResult] = React.useState(null);
  const [error, setError] = React.useState(null);
  const [activeTab, setActiveTab] = React.useState('score');
  const [showTermsModal, setShowTermsModal] = React.useState(false);

  // Check if user has accepted terms
  React.useEffect(() => {
    const hasAcceptedTerms = localStorage.getItem('termsAccepted');
    if (!hasAcceptedTerms) {
      setShowTermsModal(true);
    }
  }, []);

  // Handle terms acceptance
  const handleAcceptTerms = () => {
    localStorage.setItem('termsAccepted', 'true');
    setShowTermsModal(false);
  };

  // Update name/email when user logs in
  React.useEffect(() => {
    if (currentUser) {
      setName(currentUser.displayName || name);
      setEmail(currentUser.email || email);
    }
  }, [currentUser]);

  // --- IMPORTANT ---
  // Replace this with the URL you get after deploying your Google Apps Script
  const GOOGLE_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxDzLqxWFS8mJcKmWnooIR6vUv-TNj6oK-wZbPKS2ybP2zffNMWdTcbhaIQVHEHcALX5w/exec';

  // --- FUNCTIONS ---

  // Function to save data to Google Sheets via Apps Script
  const saveDataToSheet = async (dataToSave) => {
    if (GOOGLE_APPS_SCRIPT_URL === 'YOUR_GOOGLE_APPS_SCRIPT_URL_HERE') {
      console.warn("Google Apps Script URL is not set. Data will not be saved.");
      return;
    }
    try {
      await fetch(GOOGLE_APPS_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSave),
      });
    } catch (err) {
      console.error("Error saving data to Google Sheet:", err);
    }
  };

  // Main function to handle validation
  const handleValidate = async () => {
    // Basic validation
    if (!name || !email || !idea) {
      setError('Please fill in your name, email, and product idea.');
      return;
    }
    if (GOOGLE_APPS_SCRIPT_URL === 'YOUR_GOOGLE_APPS_SCRIPT_URL_HERE') {
        setError('The application is not fully configured. Please contact the administrator.');
        return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    // Prompt for the AI model
    const prompt = `
      Analyze the following product idea and provide a detailed evaluation.
      Product Idea Abstract: "${idea}"

      Provide the output in the following JSON format:
      {
        "score": {
          "value": <A score out of 100>,
          "reasoning": "<A brief explanation for the score>"
        },
        "key_developments": [
          "<Development step 1>",
          "<Development step 2>",
          "<Development step 3>"
        ],
        "deployment_steps": [
          "<Deployment step 1>",
          "<Deployment step 2>",
          "<Deployment step 3>"
        ],
        "roadmap": {
          "q1": "<First quarter goals>",
          "q2": "<Second quarter goals>",
          "q3": "<Third quarter goals>",
          "q4": "<Fourth quarter goals>"
        },
        "investor_pitch": "<A compelling investor pitch>"
      }
    `;

    try {
      // 1. Get AI Analysis
      const payload = {
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json" },
      };
      
      const apiKey = "AIzaSyAxTZMljkFoHmSbBdfDmeZuZf2C74Ikkww"; 
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error(`AI API error! status: ${response.status}`);

      const responseData = await response.json();
      
      if (responseData.candidates && responseData.candidates.length > 0 && responseData.candidates[0].content.parts.length > 0) {
        const rawJson = responseData.candidates[0].content.parts[0].text;
        const parsedResult = JSON.parse(rawJson);
        setResult(parsedResult);

        // 2. Save data to Google Sheet
        const dataForSheet = {
          timestamp: new Date().toLocaleString(),
          name: name,
          phone: phone,
          email: email,
          idea: idea,
          score: parsedResult.score.value,
          remarks: parsedResult.score.reasoning,
        };
        await saveDataToSheet(dataForSheet);

        // 3. Save to Firestore (if user is logged in)
        if (currentUser) {
          try {
            await saveIdeaToFirestore({
              name,
              phone,
              email,
              idea,
              result: parsedResult
            }, currentUser);
          } catch (firestoreError) {
            console.error('Error saving to Firestore:', firestoreError);
            // Don't show this error to user since the main functionality worked
          }
        }

      } else {
        throw new Error("No content was generated by the AI.");
      }

    } catch (err) {
      setError(`An error occurred: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // --- UI RENDERING ---

  const renderResult = () => {
    if (!result) return null;
    
    const tabs = [
      { id: 'score', label: 'Idea Score', icon: '🎯', color: 'blue' },
      { id: 'developments', label: 'Key Developments', icon: '🚀', color: 'purple' },
      { id: 'deployment', label: 'Deployment Steps', icon: '🔧', color: 'green' },
      { id: 'roadmap', label: 'Roadmap', icon: '🗺️', color: 'orange' },
      { id: 'pitch', label: 'Investor Pitch', icon: '💼', color: 'pink' },
    ];

    return (
      <div className="mt-12 space-y-8 animate-slide-up">
        {/* Tab Navigation */}
        <div className="glass rounded-2xl p-2 border border-slate-200/50 dark:border-slate-700/50">
          <div className="flex flex-wrap gap-2">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                } flex items-center space-x-2 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-200 hover:scale-105`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="glass rounded-3xl p-8 border border-slate-200/50 dark:border-slate-700/50">
          {activeTab === 'score' && (
            <div className="space-y-8">
              <div className="text-center">
                <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                  Analysis Complete! 
                </h2>
                <p className="text-slate-600 dark:text-slate-400">Your idea has been thoroughly evaluated by our AI</p>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl p-6 border border-blue-200/50 dark:border-blue-800/50">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                        <span className="text-white font-bold text-lg">{result.score.value}</span>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">Overall Score</h3>
                        <p className="text-slate-600 dark:text-slate-400">Out of 100 points</p>
                      </div>
                    </div>
                    
                    <div className="mb-4">
                      <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                          <Pie
                            data={[
                              { name: 'Score', value: result.score.value, fill: '#4F46E5' },
                              { name: 'Remaining', value: 100 - result.score.value, fill: '#E5E7EB' }
                            ]}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            dataKey="value"
                          >
                            <Cell key="score" fill={
                              result.score.value >= 80 ? '#10B981' :
                              result.score.value >= 60 ? '#F59E0B' : '#EF4444'
                            } />
                            <Cell key="remaining" fill={isDark ? '#374151' : '#E5E7EB'} />
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    
                    <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed">
                      {result.score.reasoning}
                    </p>
                  </div>
                </div>
                
                <div className="space-y-6">
                  <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800/50 dark:to-slate-700/50 rounded-2xl p-6 border border-slate-200/50 dark:border-slate-700/50">
                    <h4 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center space-x-2">
                      <span>Performance Grade</span>
                    </h4>
                    <div className="text-center py-8">
                      <div className={`text-6xl mb-4 ${
                        result.score.value >= 80 ? 'text-green-500' :
                        result.score.value >= 60 ? 'text-yellow-500' : 'text-red-500'
                      }`}>
                        {result.score.value >= 80 ? '🏆' : result.score.value >= 60 ? '👍' : '📈'}
                      </div>
                      <h3 className={`text-2xl font-bold mb-2 ${
                        result.score.value >= 80 ? 'text-green-600 dark:text-green-400' :
                        result.score.value >= 60 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'
                      }`}>
                        {result.score.value >= 80 ? 'Excellent' : result.score.value >= 60 ? 'Good' : 'Needs Work'}
                      </h3>
                      <p className="text-slate-600 dark:text-slate-400 text-sm">
                        {result.score.value >= 80 ? 'Outstanding potential! Ready for investment and development.' :
                         result.score.value >= 60 ? 'Good foundation with some areas for improvement.' :
                         'Requires significant development and refinement before launch.'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'developments' && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Key Development Areas</h2>
                <p className="text-slate-600 dark:text-slate-400">Strategic focus points for your product development</p>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-4">
                  {result.key_developments.map((item, index) => (
                    <div key={index} className="group bg-gradient-to-r from-slate-50 to-blue-50 dark:from-slate-800 dark:to-blue-900/30 rounded-xl p-4 border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-all duration-200">
                      <div className="flex items-start space-x-4">
                        <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white text-sm font-bold group-hover:scale-110 transition-transform duration-200">
                          {index + 1}
                        </div>
                        <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{item}</p>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800/50 dark:to-slate-700/50 rounded-2xl p-6 border border-slate-200/50 dark:border-slate-700/50">
                  <h4 className="font-bold text-slate-900 dark:text-white mb-4">Development Progress Simulation</h4>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={result.key_developments.map((item, index) => ({
                      name: `Dev ${index + 1}`,
                      progress: Math.floor(Math.random() * 100) + 1
                    }))}>
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="progress" fill="#4F46E5" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'deployment' && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Deployment Strategy</h2>
                <p className="text-slate-600 dark:text-slate-400">Step-by-step implementation roadmap</p>
              </div>
              
              <div className="space-y-4">
                {result.deployment_steps.map((item, index) => (
                  <div key={index} className="group bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-6 border border-green-200 dark:border-green-800 hover:shadow-lg transition-all duration-200">
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl flex items-center justify-center text-white font-bold group-hover:scale-110 transition-transform duration-200">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-slate-900 dark:text-white mb-2">Step {index + 1}</h4>
                        <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{item}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'roadmap' && (
            <div className="space-y-8">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Product Roadmap</h2>
                <p className="text-slate-600 dark:text-slate-400">Quarterly development timeline</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {Object.entries(result.roadmap).map(([quarter, goals], index) => (
                  <div key={quarter} className={`bg-gradient-to-br ${
                    index === 0 ? 'from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800' :
                    index === 1 ? 'from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-blue-200 dark:border-blue-800' :
                    index === 2 ? 'from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-yellow-200 dark:border-yellow-800' :
                    'from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-purple-200 dark:border-purple-800'
                  } rounded-2xl p-6 border`}>
                    <div className="flex items-center space-x-3 mb-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg ${
                        index === 0 ? 'bg-gradient-to-r from-green-500 to-emerald-600' :
                        index === 1 ? 'bg-gradient-to-r from-blue-500 to-cyan-600' :
                        index === 2 ? 'bg-gradient-to-r from-yellow-500 to-orange-600' :
                        'bg-gradient-to-r from-purple-500 to-pink-600'
                      }`}>
                        {index + 1}
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">{quarter.toUpperCase()}</h3>
                        <p className="text-slate-600 dark:text-slate-400 text-sm">Quarter {index + 1}</p>
                      </div>
                    </div>
                    <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{goals}</p>
                    
                    <div className="mt-4">
                      <div className={`w-full h-2 rounded-full ${
                        index === 0 ? 'bg-green-200 dark:bg-green-800' :
                        index === 1 ? 'bg-blue-200 dark:bg-blue-800' :
                        index === 2 ? 'bg-yellow-200 dark:bg-yellow-800' :
                        'bg-purple-200 dark:bg-purple-800'
                      }`}>
                        <div className={`h-full rounded-full transition-all duration-1000 ${
                          index === 0 ? 'bg-gradient-to-r from-green-500 to-emerald-600 w-3/4' :
                          index === 1 ? 'bg-gradient-to-r from-blue-500 to-cyan-600 w-1/2' :
                          index === 2 ? 'bg-gradient-to-r from-yellow-500 to-orange-600 w-1/4' :
                          'bg-gradient-to-r from-purple-500 to-pink-600 w-1/6'
                        }`}></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'pitch' && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Investor Pitch</h2>
                <p className="text-slate-600 dark:text-slate-400">AI-generated presentation summary</p>
              </div>
              
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl p-8 border border-purple-200 dark:border-purple-800">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">Executive Summary</h3>
                </div>
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap text-lg">
                  {result.investor_pitch}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Dashboard Call-to-Action */}
        {currentUser && (
          <div className="glass rounded-2xl border border-slate-200/50 dark:border-slate-700/50 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 p-6">
              <div className="flex items-center justify-between">
                <div className="text-white">
                  <h4 className="text-xl font-bold mb-2">� Ready for deeper insights?</h4>
                  <p className="text-blue-100">Explore comprehensive analytics, charts, and track your idea evolution in our advanced dashboard.</p>
                </div>
                <a
                  href="/dashboard"
                  className="bg-white text-blue-600 px-6 py-3 rounded-xl font-semibold hover:bg-blue-50 transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-xl"
                >
                  View Dashboard
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-5xl mx-auto">
        {/* Hero Section */}
        <div className="text-center mb-12 animate-fade-in">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <img 
              src={`${process.env.PUBLIC_URL}/logo.jpg`} 
              alt="NXRA insights Pvt. Ltd. Logo" 
              className="h-24 w-auto object-contain dark:hidden"
              onError={(e) => {
                console.log('Logo failed to load:', e.target.src);
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'block';
              }}
            />
            <img 
              src={`${process.env.PUBLIC_URL}/logo.jpg`} 
              alt="NXRA insights Pvt. Ltd" 
              className="h-24 w-auto object-contain hidden dark:block"
              onError={(e) => {
                console.log('Logo failed to load:', e.target.src);
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'block';
              }}
            />
            <div className="hidden">
              <div className="w-20 h-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
            </div>
          </div>
          
          <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-500/10 to-purple-600/10 border border-blue-500/20 dark:border-blue-400/20 rounded-full px-4 py-2 mb-6">
            <img 
              src={`${process.env.PUBLIC_URL}/logo.jpg`} 
              alt="NXRA insights Pvt. Ltd." 
              className="w-5 h-5 object-contain text-blue-600 dark:text-blue-400"
              onError={(e) => {
                console.log('Small logo failed to load:', e.target.src);
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'block';
              }}
            />
            <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full animate-pulse hidden">
            </div>
            <span className="text-sm font-medium text-blue-700 dark:text-blue-300">AI-Powered Analysis</span>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-slate-900 via-blue-900 to-purple-900 dark:from-white dark:via-blue-100 dark:to-purple-100 bg-clip-text text-transparent mb-6 leading-tight">
            Validate Your 
            <span className="block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Innovation Ideas
            </span>
          </h1>
          
        
          
          <p className="text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto leading-relaxed">
            Transform your concepts into data-driven insights with our advanced AI validation platform. 
            Get comprehensive analysis, roadmaps, and investor-ready presentations.
          </p>

          {!currentUser && (
            <div className="mt-8 glass rounded-2xl p-6 max-w-2xl mx-auto border border-amber-200 dark:border-amber-800/50">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-r from-amber-400 to-orange-500 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-slate-900 dark:text-white">🚀 Pro Tip</h3>
                  <p className="text-slate-600 dark:text-slate-300 text-sm">
                    Sign in with Google to save your analyses, access detailed dashboards, and track your idea evolution over time.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Main Form */}
        <div className="glass rounded-3xl p-8 border border-slate-200/50 dark:border-slate-700/50 animate-slide-up">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Full Name</label>
              <input
                type="text"
                placeholder="Enter your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all duration-200 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400"
                disabled={currentUser && currentUser.displayName}
              />
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Email Address</label>
              <input
                type="email"
                placeholder="your.email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all duration-200 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400"
                disabled={currentUser && currentUser.email}
              />
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Phone Number</label>
              <input
                type="tel"
                placeholder="+91 9442608026"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all duration-200 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400"
              />
            </div>
          </div>
          
          <div className="space-y-2 mb-6">
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Product Idea Description</label>
            <div className="relative">
              <textarea
                className="w-full px-4 py-4 pr-14 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all duration-200 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 resize-none"
                rows="6"
                placeholder="Describe your product idea in detail... What problem does it solve? Who is your target audience? What makes it unique?"
                value={idea}
                onChange={(e) => setIdea(e.target.value)}
              ></textarea>
              
              {/* Up Arrow Submit Button */}
              <button
                onClick={handleValidate}
                disabled={loading || !name || !email || !idea}
                className={`absolute bottom-3 right-3 p-2 rounded-full transition-all duration-200 hover:scale-110 focus:ring-2 focus:ring-blue-500/25 ${
                  loading || !name || !email || !idea
                    ? 'bg-slate-300 dark:bg-slate-600 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 hover:shadow-lg cursor-pointer'
                }`}
                title={loading ? "Analyzing..." : "Validate & Analyze Idea"}
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <svg 
                    className="w-5 h-5 text-white" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="m5 12 7-7 7 7" 
                    />
                  </svg>
                )}
              </button>
            </div>
            
            <div className="flex justify-between items-center text-sm text-slate-500 dark:text-slate-400">
             
              <span>{idea.length} characters</span>
            </div>
            
            {/* Disclaimer */}
            <div className="text-center text-xs text-slate-500 dark:text-slate-400 mt-2">
              <strong>Disclaimer: NXRA InspireIQ can make mistakes. Check important info. See{' '}
         </strong>     <button
                onClick={() => setShowTermsModal(true)}
                className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 underline transition-colors duration-200"
              >
                Terms and Conditions
              </button>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mt-6 glass rounded-2xl p-6 border border-red-200 dark:border-red-800/50 bg-red-50/50 dark:bg-red-900/10 animate-slide-up">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-red-500 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-red-900 dark:text-red-100">Analysis Error</h3>
                <p className="text-red-700 dark:text-red-300">{error}</p>
              </div>
            </div>
          </div>
        )}
        
        {/* Loading State */}
        {loading && (
          <div className="mt-8 text-center animate-fade-in">
            <div className="glass rounded-3xl p-12 border border-slate-200/50 dark:border-slate-700/50">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl mx-auto mb-6 flex items-center justify-center animate-pulse-slow">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3
                  m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">Analyzing Your Idea</h3>
              <p className="text-slate-600 dark:text-slate-400 mb-4">Our AI is processing your product concept and generating comprehensive insights...</p>
              <div className="flex justify-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                <div className="w-2 h-2 bg-pink-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
              </div>
            </div>
          </div>
        )}

        {renderResult()}

        {/* Terms & Conditions Modal */}
        {showTermsModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="glass-card max-w-2xl w-full max-h-[80vh] overflow-y-auto border border-slate-200/50 dark:border-slate-700/50 animate-modal-in">
              <div className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Terms & Conditions</h2>
                  <button
                    onClick={() => setShowTermsModal(false)}
                    className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <div className="prose prose-slate dark:prose-invert max-w-none text-sm space-y-4">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Welcome to NXRA insights Pvt. Ltd.</h3>
                  
                  <p className="text-slate-600 dark:text-slate-400">
                    By using our AI-powered innovation validation platform, you agree to the following terms and conditions:
                  </p>
                  
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-slate-900 dark:text-white mb-2">1. Service Description</h4>
                      <p className="text-slate-600 dark:text-slate-400">
                        NXRA insights Pvt. Ltd. provides AI-powered analysis and insights for innovation ideas and concepts. Our platform offers market validation, competitive analysis, and strategic recommendations for forward-thinking technologies.
                      </p>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold text-slate-900 dark:text-white mb-2">2. Data Privacy</h4>
                      <p className="text-slate-600 dark:text-slate-400">
                        We respect your privacy and protect your ideas. All submitted content is processed securely and is not shared with third parties. Your data is used solely to provide our analysis services.
                      </p>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold text-slate-900 dark:text-white mb-2">3. AI Analysis Disclaimer</h4>
                      <p className="text-slate-600 dark:text-slate-400">
                        Our AI analysis is for informational purposes only and should not replace professional business advice. Results are generated using AI models and may not be 100% accurate.
                      </p>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold text-slate-900 dark:text-white mb-2">4. User Responsibilities</h4>
                      <p className="text-slate-600 dark:text-slate-400">
                        Users are responsible for the content they submit and must ensure it does not violate any laws or third-party rights. Do not submit confidential or proprietary information you're not authorized to share.
                      </p>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold text-slate-900 dark:text-white mb-2">5. Intellectual Property</h4>
                      <p className="text-slate-600 dark:text-slate-400">
                        You retain full ownership of your ideas and submitted content. Our analysis and insights are provided as a service, and you maintain all rights to your intellectual property.
                      </p>
                    </div>
                  </div>
                  
                  <p className="text-xs text-slate-500 dark:text-slate-500 mt-6 pt-4 border-t border-slate-200/50 dark:border-slate-700/50">
                    Last updated: {new Date().toLocaleDateString()}
                  </p>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3 mt-8 pt-6 border-t border-slate-200/50 dark:border-slate-700/50">
                  <button
                    onClick={handleAcceptTerms}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 transform hover:scale-[1.02] shadow-lg hover:shadow-xl"
                  >
                    Accept & Continue
                  </button>
                  <button
                    onClick={() => setShowTermsModal(false)}
                    className="flex-1 sm:flex-none px-6 py-3 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 border border-slate-300 dark:border-slate-600 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all duration-300"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
