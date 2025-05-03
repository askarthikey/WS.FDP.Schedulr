import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function StartPage() {
  const [, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (token) {
      // Redirect to home if already authenticated
      window.location.href = '/home';
      return;
    }
    
    // Get current user from storage
    const user = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || 'null');
    setCurrentUser(user);
    setLoading(false);
  }, []);
  
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-black"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      {/* Enhanced Hero Section with full width */}
      <div className="relative overflow-hidden bg-gradient-to-r from-gray-900 via-black to-gray-900 w-full">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-600/20 mix-blend-multiply"></div>
          {/* Geometric pattern overlay for professional touch */}
          <div className="absolute inset-0 opacity-10" 
               style={{backgroundImage: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%239C92AC" fill-opacity="0.4"%3E%3Cpath d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")'}}></div>
          <div className="absolute bottom-0 left-0 right-0 h-[40%] bg-gradient-to-t from-black/90 to-transparent"></div>
        </div>
        
        <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="py-20 md:py-28 lg:py-32">
            <div className="max-w-3xl relative">
              {/* Decorative element */}
              <div className="absolute -left-6 -top-6 w-20 h-20 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 opacity-20 blur-xl"></div>
              
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight tracking-tight">
                Manage Your Workshops With <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 relative">
                  Schedulr
                  <span className="absolute -bottom-2 left-0 w-full h-1 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full"></span>
                </span>
              </h1>
              <p className="text-xl md:text-2xl text-gray-200 mb-10 leading-relaxed font-light max-w-2xl">
                A comprehensive platform for organizing, managing, and participating in workshops. 
                Streamline your event management with powerful tools and real-time analytics.
              </p>
              
              <div className="flex flex-wrap gap-5">
                <button 
                  onClick={() => navigate('/signin')}
                  className="px-10 py-4 bg-white text-black font-medium rounded-lg hover:bg-gray-100 transition-all duration-300 shadow-lg flex items-center transform hover:-translate-y-1 hover:shadow-xl"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  Explore Platform
                </button>
                <button 
                  onClick={() => navigate('/signup')}
                  className="px-10 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium rounded-lg hover:shadow-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-300 shadow-lg flex items-center transform hover:-translate-y-1"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                  </svg>
                  Join Now
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Features Cards - Consistent with max-width container */}
      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 -mt-20 relative z-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          <div className="bg-white rounded-xl p-6 md:p-8 shadow-xl border border-gray-100 transform transition-all duration-300 hover:scale-105 hover:shadow-2xl group">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-full w-16 h-16 flex items-center justify-center mb-6 group-hover:from-blue-100 group-hover:to-blue-200 transition-all duration-300">
              <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div className="text-4xl font-bold text-gray-800 mb-2">Create</div>
            <div className="text-gray-600">
              Design professional workshops with intuitive tools and templates tailored for success.
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-6 md:p-8 shadow-xl border border-gray-100 transform transition-all duration-300 hover:scale-105 hover:shadow-2xl group">
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-full w-16 h-16 flex items-center justify-center mb-6 group-hover:from-green-100 group-hover:to-green-200 transition-all duration-300">
              <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="text-4xl font-bold text-gray-800 mb-2">Manage</div>
            <div className="text-gray-600">
              Streamline organization with powerful event tracking and coordination tools.
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-6 md:p-8 shadow-xl border border-gray-100 transform transition-all duration-300 hover:scale-105 hover:shadow-2xl group">
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-full w-16 h-16 flex items-center justify-center mb-6 group-hover:from-purple-100 group-hover:to-purple-200 transition-all duration-300">
              <svg className="w-8 h-8 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div className="text-4xl font-bold text-gray-800 mb-2">Analyze</div>
            <div className="text-gray-600">
              Gain actionable insights with comprehensive analytics and detailed reporting.
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-6 md:p-8 shadow-xl border border-gray-100 transform transition-all duration-300 hover:scale-105 hover:shadow-2xl group">
            <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-full w-16 h-16 flex items-center justify-center mb-6 group-hover:from-yellow-100 group-hover:to-yellow-200 transition-all duration-300">
              <svg className="w-8 h-8 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
            </div>
            <div className="text-4xl font-bold text-gray-800 mb-2">Grow</div>
            <div className="text-gray-600">
              Expand your reach and build your professional network through workshop excellence.
            </div>
          </div>
        </div>
      </div>
      
      {/* Feature Section - Consistent with max-width container */}
      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-16 md:mb-20 relative">
          Simplify Workshop Management
          <div className="absolute bottom-[-15px] left-1/2 transform -translate-x-1/2 w-24 h-1 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full"></div>
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-16">
          <div className="flex flex-col items-center text-center group">
            <div className="bg-gradient-to-br from-blue-500 to-purple-600 text-white w-20 h-20 rounded-2xl flex items-center justify-center mb-8 shadow-lg transform rotate-45 group-hover:rotate-0 transition-all duration-500">
              <svg className="w-8 h-8 transform -rotate-45 group-hover:rotate-0 transition-all duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold mb-4">Create & Organize</h3>
            <p className="text-gray-600 leading-relaxed">Easily set up workshops with all necessary details including schedules, registration links, and resource information. Streamline planning with intuitive tools.</p>
          </div>
          
          <div className="flex flex-col items-center text-center group">
            <div className="bg-gradient-to-br from-green-500 to-teal-600 text-white w-20 h-20 rounded-2xl flex items-center justify-center mb-8 shadow-lg transform rotate-45 group-hover:rotate-0 transition-all duration-500">
              <svg className="w-8 h-8 transform -rotate-45 group-hover:rotate-0 transition-all duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold mb-4">Manage Participants</h3>
            <p className="text-gray-600 leading-relaxed">Track participant information, gather feedback, and maintain detailed records of workshop attendance. Create personalized experiences for attendees.</p>
          </div>
          
          <div className="flex flex-col items-center text-center group">
            <div className="bg-gradient-to-br from-yellow-500 to-orange-600 text-white w-20 h-20 rounded-2xl flex items-center justify-center mb-8 shadow-lg transform rotate-45 group-hover:rotate-0 transition-all duration-500">
              <svg className="w-8 h-8 transform -rotate-45 group-hover:rotate-0 transition-all duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold mb-4">Analytics & Reports</h3>
            <p className="text-gray-600 leading-relaxed">Generate comprehensive reports and gain insights with powerful analytics tools for your workshops. Make data-driven decisions to improve future events.</p>
          </div>
        </div>
      </div>
      
      {/* Showcase Section - Full width */}
      <div className="w-full bg-gradient-to-r from-gray-900 via-black to-gray-900 py-24">
        <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white">Discover What's Possible</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl overflow-hidden shadow-2xl backdrop-blur-sm border border-gray-700/50 transform transition-all duration-300 hover:-translate-y-2 hover:shadow-blue-900/20">
              <div className="h-56 bg-gray-700 relative overflow-hidden">
                <img 
                  src="https://media.istockphoto.com/id/1353769234/photo/training-and-skill-development-concept-with-icons-of-online-course-conference-seminar-webinar.jpg?s=612x612&w=0&k=20&c=2YJG1My6Lu1T1FnzIPbimRNORcSbSuz6A8zb7HKNpx4=" 
                  alt="Workshop planning"
                  className="w-full h-full object-cover transform transition-transform duration-700 hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent opacity-60"></div>
              </div>
              
              <div className="p-6 md:p-8">
                <h3 className="text-2xl font-bold text-white mb-3">Workshop Planning</h3>
                <p className="text-gray-300 mb-6 leading-relaxed">Create detailed workshop plans with customizable templates and scheduling tools. Organize resources effectively.</p>
                <div className="flex justify-between items-center">
                  <button
                    onClick={() => navigate('/signin')}
                    className="text-blue-400 font-medium group-hover:text-blue-300 flex items-center hover:underline focus:outline-none"
                  >
                    Sign in to explore
                    <svg className="w-5 h-5 ml-2 transform transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </button>
                  <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl overflow-hidden shadow-2xl backdrop-blur-sm border border-gray-700/50 transform transition-all duration-300 hover:-translate-y-2 hover:shadow-green-900/20">
              <div className="h-56 bg-gray-700 relative overflow-hidden">
                <img 
                  src="https://plus.unsplash.com/premium_photo-1661414415246-3e502e2fb241?fm=jpg&q=60&w=3000&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8bWFuYWdlbWVudHxlbnwwfHwwfHx8MA%3D%3D" 
                  alt="Participant management"
                  className="w-full h-full object-cover transform transition-transform duration-700 hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent opacity-60"></div>
              </div>
              
              <div className="p-6 md:p-8">
                <h3 className="text-2xl font-bold text-white mb-3">Participant Management</h3>
                <p className="text-gray-300 mb-6 leading-relaxed">Handle registrations, track attendance, and communicate with participants. Build engaging experiences.</p>
                <div className="flex justify-between items-center">
                  <button
                    onClick={() => navigate('/signin')}
                    className="text-green-400 font-medium group-hover:text-green-300 flex items-center hover:underline focus:outline-none"
                  >
                    Sign in to explore
                    <svg className="w-5 h-5 ml-2 transform transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </button>
                  <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                    <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl overflow-hidden shadow-2xl backdrop-blur-sm border border-gray-700/50 transform transition-all duration-300 hover:-translate-y-2 hover:shadow-purple-900/20">
              <div className="h-56 bg-gray-700 relative overflow-hidden">
                <img 
                  src="https://media.istockphoto.com/id/1480239219/photo/an-analyst-uses-a-computer-and-dashboard-for-data-business-analysis-and-data-management.jpg?s=612x612&w=0&k=20&c=URv6HYZ8L3NCQnxT8-ITvInMW7mlsTE6EjnXHaqF-H4=" 
                  alt="Analytics dashboard"
                  className="w-full h-full object-cover transform transition-transform duration-700 hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent opacity-60"></div>
              </div>
              
              <div className="p-6 md:p-8">
                <h3 className="text-2xl font-bold text-white mb-3">Analytics Dashboard</h3>
                <p className="text-gray-300 mb-6 leading-relaxed">Gain insights from comprehensive reports and visualization tools. Make data-driven decisions.</p>
                <div className="flex justify-between items-center">
                  <button
                    onClick={() => navigate('/signin')}
                    className="text-purple-400 font-medium group-hover:text-purple-300 flex items-center hover:underline focus:outline-none"
                  >
                    Sign in to explore
                    <svg className="w-5 h-5 ml-2 transform transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </button>
                  <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center">
                    <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Enhanced CTA Section - Full width gradient container with consistent content width */}
      <div className="w-full py-24">
        <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl shadow-2xl overflow-hidden relative">
            <div className="absolute top-0 right-0 w-full h-full opacity-10" 
                 style={{backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'100\' height=\'100\' viewBox=\'0 0 100 100\'%3E%3Cg fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.12\'%3E%3Cpath opacity=\'.5\' d=\'M96 95h4v1h-4v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h4v1h-4v9h4v1h-4v9h4v1h-4v9h4v1h-4v9h4v1h-4v9h4v1h-4v9h4v1h-4v9zm-1 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-9-10h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm9-10v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-9-10h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm9-10v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-9-10h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")'}}></div>
            
            <div className="px-6 py-16 md:px-16 md:py-20 md:w-3/5 relative z-10">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-6 leading-tight">Ready to transform your workshop management?</h2>
              <p className="text-blue-100 text-xl mb-10 leading-relaxed">Join thousands of educators and event organizers who use NexuZ to create, manage, and grow their workshops.</p>
              
              <div className="flex flex-wrap gap-5">
                <button 
                  onClick={() => navigate('/signin')}
                  className="px-10 py-4 bg-white text-blue-600 font-bold rounded-lg hover:bg-blue-50 transition-all duration-300 shadow-lg transform hover:-translate-y-1 hover:shadow-xl"
                >
                  Sign In
                </button>
                <button 
                  onClick={() => navigate('/signup')}
                  className="px-10 py-4 bg-blue-800 text-white border-2 border-white font-bold rounded-lg hover:bg-blue-700 transition-all duration-300 shadow-lg transform hover:-translate-y-1 hover:shadow-xl"
                >
                  Create Account
                </button>
              </div>
              
              {/* Social proof */}
              <div className="mt-12 flex items-center">
                <div className="flex -space-x-2">
                  <div className="w-10 h-10 rounded-full bg-gray-300 border-2 border-white"></div>
                  <div className="w-10 h-10 rounded-full bg-gray-400 border-2 border-white"></div>
                  <div className="w-10 h-10 rounded-full bg-gray-500 border-2 border-white"></div>
                  <div className="w-10 h-10 rounded-full bg-gray-600 border-2 border-white flex items-center justify-center text-white text-xs font-medium">+12</div>
                </div>
                <p className="ml-4 text-white text-sm">Joined this month</p>
              </div>
            </div>
            
            <div className="absolute right-0 top-1/2 transform -translate-y-1/2 hidden lg:block w-2/5 h-full">
              <div className="absolute inset-0 bg-white opacity-10 rounded-l-full"></div>
              <div className="absolute top-1/2 transform -translate-y-1/2 -left-6">
                <div className="w-12 h-12 rounded-full bg-white shadow-xl"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default StartPage;