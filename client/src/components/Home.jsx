import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Chart as ChartJS, 
  ArcElement, 
  CategoryScale, 
  LinearScale, 
  BarElement,
  PointElement, 
  LineElement, 
  Title, 
  Tooltip, 
  Legend 
} from 'chart.js';
import { Doughnut, Bar, Line } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  ArcElement, 
  CategoryScale, 
  LinearScale, 
  BarElement,
  PointElement, 
  LineElement, 
  Title, 
  Tooltip, 
  Legend
);

const Home = () => {
  const navigate = useNavigate();
  const [workshops, setWorkshops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [stats, setStats] = useState({
    totalWorkshops: 0,
    upcomingWorkshops: 0,
    ongoingWorkshops: 0,
    totalParticipants: 0,
    categoryCount: {},
    monthlyWorkshops: []
  });
  
  // Load current user
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || 'null');
    setCurrentUser(user);
  }, []);

  // Fetch workshops data
  useEffect(() => {
    const fetchWorkshops = async () => {
      try {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/workshopApi/getwks`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await response.json();
        
        if (response.ok) {
          const workshopData = data.Workshops || [];
          setWorkshops(workshopData);
          
          // Calculate dashboard statistics
          calculateStats(workshopData);
        } else {
          setError(data.message || 'Failed to fetch workshops');
        }
      } catch (err) {
        setError('Network error. Please try again later.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchWorkshops();
  }, []);

  // Calculate statistics from workshop data
  const calculateStats = (workshopData) => {
    const today = new Date();
    const upcomingWks = workshopData.filter(w => new Date(w.eventStDate) > today);
    
    // Calculate ongoing workshops
    const ongoingWks = workshopData.filter(w => {
      const startDate = new Date(w.eventStDate);
      const endDate = w.eventEndDate ? new Date(w.eventEndDate) : new Date(w.eventStDate);
      return startDate <= today && today <= endDate;
    });
    
    // Aggregate category data
    const categories = {};
    workshopData.forEach(workshop => {
      workshop.category?.forEach(cat => {
        categories[cat] = (categories[cat] || 0) + 1;
      });
    });
    
    // Calculate total participants (estimated from participantInfo)
    let totalParticipants = 0;
    workshopData.forEach(workshop => {
      const totalInfo = workshop.participantInfo?.find(info => info.startsWith('Total:'));
      if (totalInfo) {
        const count = parseInt(totalInfo.split(':')[1].trim());
        if (!isNaN(count)) totalParticipants += count;
      }
    });
    
    // Prepare monthly workshop data
    const last6Months = Array.from({ length: 6 }, (_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      return d.toLocaleString('default', { month: 'short' });
    }).reverse();
    
    const monthlyData = last6Months.map(month => {
      return {
        month,
        count: workshopData.filter(w => {
          const date = new Date(w.eventStDate);
          return date.toLocaleString('default', { month: 'short' }) === month;
        }).length
      };
    });
    
    setStats({
      totalWorkshops: workshopData.length,
      upcomingWorkshops: upcomingWks.length,
      ongoingWorkshops: ongoingWks.length,  // Add ongoing workshops to stats
      totalParticipants,
      categoryCount: categories,
      monthlyWorkshops: monthlyData
    });
  };
  
  // Format date
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (err) {
      console.log("Error: ", err)
      return dateString;
    }
  };
  
  // Check if user has edit access for a workshop
  const hasEditAccess = (workshop) => {
    if (!currentUser || !workshop) return false;
    return workshop.editAccessUsers?.includes(currentUser.username);
  };
  
  // Sort workshops by date (most recent first)
  const sortedWorkshops = [...workshops].sort((a, b) => 
    new Date(b.eventStDate) - new Date(a.eventStDate)
  );
  
  // Get upcoming workshops
  const upcomingWorkshops = sortedWorkshops.filter(
    w => new Date(w.eventStDate) > new Date()
  ).slice(0, 5);
  
  // Prepare chart data
  const categoryChartData = {
    labels: Object.keys(stats.categoryCount),
    datasets: [
      {
        label: 'Workshops by Category',
        data: Object.values(stats.categoryCount),
        backgroundColor: [
          'rgba(255, 99, 132, 0.8)',
          'rgba(54, 162, 235, 0.8)',
          'rgba(255, 206, 86, 0.8)',
          'rgba(75, 192, 192, 0.8)',
          'rgba(153, 102, 255, 0.8)',
          'rgba(255, 159, 64, 0.8)',
        ],
        borderWidth: 1,
      },
    ],
  };
  
  const monthlyChartData = {
    labels: stats.monthlyWorkshops.map(item => item.month),
    datasets: [
      {
        label: 'Workshops',
        data: stats.monthlyWorkshops.map(item => item.count),
        backgroundColor: 'rgba(54, 162, 235, 0.5)',
        borderColor: 'rgb(54, 162, 235)',
        borderWidth: 2,
      },
    ],
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-black"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-10">
        <p className="text-red-600 font-medium">Error: {error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-4 px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Welcome Banner with Quick Stats */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white rounded-xl p-6 mb-6 shadow-lg">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-2">
            <h1 className="text-3xl font-bold mb-2">Welcome{currentUser ? `, ${currentUser.fullName}` : ''}!</h1>
            <p className="text-gray-300 mb-4">Here's your Schedulr workshop dashboard overview</p>
            
            <div className="mt-6 flex space-x-4">
              <button 
                onClick={() => navigate('/workshops')}
                className="px-5 py-2 bg-white text-gray-800 font-medium rounded-md hover:bg-gray-100 transition-colors flex items-center"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                Browse Workshops
              </button>
              
              <button 
                onClick={() => navigate('/create-workshop')}
                className="px-5 py-2 bg-transparent border border-white text-white font-medium rounded-md hover:bg-white hover:text-gray-800 transition-colors flex items-center"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
                Create New
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 lg:col-span-2">
            <div className="bg-gray-800 bg-opacity-50 p-4 rounded-lg">
              <div className="text-4xl font-bold">{stats.totalWorkshops}</div>
              <div className="text-gray-300 text-sm">Total Workshops</div>
            </div>
            
            <div className="bg-gray-800 bg-opacity-50 p-4 rounded-lg">
              <div className="text-4xl font-bold">{stats.upcomingWorkshops}</div>
              <div className="text-gray-300 text-sm">Upcoming Events</div>
            </div>
            
            <div className="bg-gray-800 bg-opacity-50 p-4 rounded-lg">
              <div className="text-4xl font-bold">{stats.ongoingWorkshops}</div>
              <div className="text-gray-300 text-sm">Ongoing Events</div>
            </div>
            
            <div className="bg-gray-800 bg-opacity-50 p-4 rounded-lg">
              <div className="text-4xl font-bold">{Object.keys(stats.categoryCount).length}</div>
              <div className="text-gray-300 text-sm">Workshop Categories</div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Workshop Categories Distribution */}
        <div className="bg-white p-5 rounded-xl shadow-md">
          <h2 className="text-xl font-semibold mb-4">Workshop Categories</h2>
          <div className="h-64">
            <Doughnut 
              data={categoryChartData} 
              options={{
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'right',
                  },
                },
              }}
            />
          </div>
        </div>
        
        {/* Workshop Trend Over Time */}
        <div className="bg-white p-5 rounded-xl shadow-md lg:col-span-2">
          <h2 className="text-xl font-semibold mb-4">Workshops Trend (Last 6 Months)</h2>
          <div className="h-64">
            <Line 
              data={monthlyChartData} 
              options={{
                maintainAspectRatio: false,
                scales: {
                  y: {
                    beginAtZero: true,
                    ticks: {
                      precision: 0
                    }
                  }
                },
                plugins: {
                  legend: {
                    display: false
                  }
                }
              }}
            />
          </div>
        </div>
      </div>
      
      {/* Recently Added Workshops & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Recently Added Workshops - Now in the 2-column position */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-md overflow-hidden">
          <div className="bg-gray-50 px-5 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold">Recently Added Workshops</h2>
          </div>
          
          <div className="p-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {sortedWorkshops.slice(0, 2).map((workshop) => (
                <div 
                  key={workshop._id || workshop.eventTitle}
                  className="bg-gray-50 rounded-lg overflow-hidden shadow transition-transform hover:shadow-md hover:-translate-y-1"
                >
                  <div className="relative pb-[60%]">
                    <img 
                      src={workshop.thumbnail || "https://via.placeholder.com/300x180?text=Workshop"}
                      alt={workshop.eventTitle}
                      className="absolute h-full w-full object-cover"
                    />
                  </div>
                  
                  <div className="p-4">
                    <h3 className="text-base font-semibold mb-2 truncate">{workshop.eventTitle}</h3>
                    
                    <div className="flex items-center mb-3 text-xs text-gray-500">
                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {formatDate(workshop.eventStDate)}
                    </div>
                    
                    <Link 
                      to={`/workshops/${encodeURIComponent(workshop.eventTitle.toLowerCase().replace(/\s+/g, '-'))}`}
                      state={{ workshop }}
                      className="w-full block text-center py-1.5 bg-black text-white text-sm rounded hover:bg-gray-800 transition-colors"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="px-5 py-4 bg-gray-50 text-center">
            <Link 
              to="/workshops" 
              className="inline-flex items-center text-sm font-medium text-gray-700 hover:text-black"
            >
              View all workshops
              <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>
        </div>
      
        {/* Quick Access & Resources - Keep this section where it is */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="bg-gray-50 px-5 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold">Quick Actions</h2>
          </div>
          
          <div className="p-6">
            <div className="space-y-5">
              <button 
                onClick={() => navigate('/create-workshop')}
                className="w-full flex items-center p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <div className="rounded-full bg-black p-2 mr-3">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <div className="text-left">
                  <div className="font-medium">New Workshop</div>
                  <div className="text-sm text-gray-500">Create a new workshop event</div>
                </div>
              </button>
              
              <button 
                onClick={() => navigate('/workshops')}
                className="w-full flex items-center p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <div className="rounded-full bg-black p-2 mr-3">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <div className="text-left">
                  <div className="font-medium">My Workshops</div>
                  <div className="text-sm text-gray-500">Manage your workshop events</div>
                </div>
              </button>
              
              <button 
                onClick={() => navigate('/workshops')}
                className="w-full flex items-center p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <div className="rounded-full bg-black p-2 mr-3">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                </div>
                <div className="text-left">
                  <div className="font-medium">Categories</div>
                  <div className="text-sm text-gray-500">Browse workshops by category</div>
                </div>
              </button>
              
              <button 
                onClick={() => navigate('/report')}
                className="w-full flex items-center p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <div className="rounded-full bg-black p-2 mr-3">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div className="text-left">
                  <div className="font-medium">Reports</div>
                  <div className="text-sm text-gray-500">View detailed workshop analytics</div>
                </div>
              </button>
              <button 
                onClick={() => navigate('/profile')}
                className="w-full flex items-center p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <div className="rounded-full bg-black p-2 mr-3">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div className="text-left">
                  <div className="font-medium">Profile</div>
                  <div className="text-sm text-gray-500">View and Update your profile</div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Upcoming Workshops - Now moved to the bottom */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="bg-gray-50 px-5 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold">Upcoming Workshops</h2>
        </div>
        
        <div className="divide-y divide-gray-200">
          {upcomingWorkshops.length === 0 ? (
            <div className="p-5 text-center text-gray-500">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="mt-2">No upcoming workshops found</p>
            </div>
          ) : (
            upcomingWorkshops.map((workshop) => (
              <div key={workshop._id || workshop.eventTitle} className="p-5 hover:bg-gray-50">
                <div className="flex items-start">
                  <div className="flex-shrink-0 h-10 w-10 bg-gray-200 rounded-lg mr-4 overflow-hidden">
                    {workshop.thumbnail ? (
                      <img 
                        src={workshop.thumbnail} 
                        alt={workshop.eventTitle}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center bg-gray-300 text-gray-600">
                        <span>{workshop.eventTitle.charAt(0)}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <Link 
                      to={`/workshops/${encodeURIComponent(workshop.eventTitle.toLowerCase().replace(/\s+/g, '-'))}`}
                      state={{ workshop }}
                      className="text-lg font-medium text-gray-900 hover:text-gray-600"
                    >
                      {workshop.eventTitle}
                    </Link>
                    
                    <div className="flex items-center mt-1">
                      <svg className="w-4 h-4 text-gray-500 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="text-sm text-gray-500">
                        {formatDate(workshop.eventStDate)}
                        {workshop.eventEndDate && workshop.eventEndDate !== workshop.eventStDate && 
                          ` - ${formatDate(workshop.eventEndDate)}`
                        }
                      </span>
                    </div>
                    
                    <div className="flex items-center mt-1">
                      <svg className="w-4 h-4 text-gray-500 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-sm text-gray-500">{workshop.eventStTime}</span>
                    </div>
                  </div>
                  
                  <div className="ml-4 flex-shrink-0 self-center flex">
                    <Link 
                      to={`/workshops/${encodeURIComponent(workshop.eventTitle.toLowerCase().replace(/\s+/g, '-'))}`}
                      state={{ workshop }}
                      className="px-3 py-1 bg-black text-white text-sm rounded-md hover:bg-gray-800 flex items-center"
                    >
                      View
                    </Link>
                    
                    {hasEditAccess(workshop) && (
                      <button
                        onClick={() => navigate(`/edit-workshop/${encodeURIComponent(workshop.eventTitle)}`)}
                        className="ml-2 text-gray-400 hover:text-gray-600"
                        aria-label="Edit workshop"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
          
          <div className="px-5 py-4 bg-gray-50 text-right">
            <Link 
              to="/workshops" 
              className="inline-flex items-center text-sm font-medium text-gray-700 hover:text-black"
            >
              View all workshops
              <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;