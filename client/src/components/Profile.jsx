import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function Profile() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('overview');
  const [editMode, setEditMode] = useState(false);
  const [userStats, setUserStats] = useState(null);
  const [editData, setEditData] = useState({});
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [notification, setNotification] = useState(null);
  const navigate = useNavigate();

  // Add these new states for account deletion
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Fetch user data on component mount
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || 'null');
    if (!user) {
      navigate('/signin');
      return;
    }
    
    setCurrentUser(user);
    setEditData({
      fullName: user.fullName || '',
      email: user.email || '',
      department: user.department || '',
      designation: user.designation || '',
      bio: user.bio || ''
    });
    fetchUserStats(user.username);
  }, [navigate]);

  // Fetch user statistics - workshops created, edited, etc.
  const fetchUserStats = async (username) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      
      // Fetch workshops
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/workshopApi/getwks`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const data = await response.json();
      
      if (response.ok && data.Workshops) {
        // Calculate statistics
        const allWorkshops = data.Workshops;
        // Workshops where the user is the creator or has edit access
        const userWorkshops = allWorkshops.filter(w => 
          w.editAccessUsers && w.editAccessUsers.includes(username)
        );
        
        const now = new Date();
        
        // Status-based filtering
        const upcomingWorkshops = userWorkshops.filter(w => {
          const startDate = new Date(w.eventStDate);
          return now < startDate;
        });
        
        const ongoingWorkshops = userWorkshops.filter(w => {
          const startDate = new Date(w.eventStDate);
          const endDate = w.eventEndDate ? new Date(w.eventEndDate) : new Date(startDate);
          endDate.setHours(23, 59, 59); // End of the day
          return now >= startDate && now <= endDate;
        });
        
        const completedWorkshops = userWorkshops.filter(w => {
          const endDate = w.eventEndDate ? new Date(w.eventEndDate) : new Date(w.eventStDate);
          endDate.setHours(23, 59, 59); // End of the day
          return now > endDate;
        });
        
        setUserStats({
          totalCreated: userWorkshops.filter(w => w.editAccessUsers[0] === username).length,
          upcoming: upcomingWorkshops.length,
          ongoing: ongoingWorkshops.length,
          completed: completedWorkshops.length,
          createdWorkshops: userWorkshops.filter(w => w.editAccessUsers[0] === username),
          contributedWorkshops: userWorkshops.filter(w => w.editAccessUsers[0] !== username)
        });
      }
    } catch (err) {
      console.error("Error fetching user statistics:", err);
    } finally {
      setLoading(false);
    }
  };

  // Handle profile update
  const handleProfileUpdate = async () => {
    try {
      // Validate inputs
      if (!editData.fullName || !editData.email) {
        setNotification({
          type: 'error',
          message: 'Name and email are required'
        });
        return;
      }
      
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/userApi/updateProfile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          username: currentUser.username,
          ...editData
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        // Update local storage/session storage
        const updatedUser = { ...currentUser, ...editData };
        if (localStorage.getItem('user')) {
          localStorage.setItem('user', JSON.stringify(updatedUser));
        }
        if (sessionStorage.getItem('user')) {
          sessionStorage.setItem('user', JSON.stringify(updatedUser));
        }
        
        setCurrentUser(updatedUser);
        setEditMode(false);
        setNotification({
          type: 'success',
          message: 'Profile updated successfully'
        });
      } else {
        setNotification({
          type: 'error',
          message: data.message || 'Failed to update profile'
        });
      }
    } catch (err) {
      console.error("Error updating profile:", err);
      setNotification({
        type: 'error',
        message: 'An error occurred while updating profile'
      });
    }
  };

  // Handle password change
  const handlePasswordChange = async () => {
    try {
      // Validate inputs
      if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
        setNotification({
          type: 'error',
          message: 'All password fields are required'
        });
        return;
      }
      
      if (passwordData.newPassword !== passwordData.confirmPassword) {
        setNotification({
          type: 'error',
          message: 'New passwords do not match'
        });
        return;
      }
      
      if (passwordData.newPassword.length < 6) {
        setNotification({
          type: 'error',
          message: 'Password must be at least 6 characters long'
        });
        return;
      }
      
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/userApi/changePassword`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          username: currentUser.username,
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        
        setNotification({
          type: 'success',
          message: 'Password changed successfully'
        });
      } else {
        setNotification({
          type: 'error',
          message: data.message || 'Failed to change password'
        });
      }
    } catch (err) {
      console.error("Error changing password:", err);
      setNotification({
        type: 'error',
        message: 'An error occurred while changing password'
      });
    }
  };

  // Handle account deletion
  const handleAccountDeletion = async () => {
    if (!deletePassword) {
      setNotification({
        type: 'error',
        message: 'Please enter your password to confirm deletion'
      });
      return;
    }

    try {
      setDeleteLoading(true);
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/userApi/deleteAccount`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          username: currentUser.username,
          password: deletePassword
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        // Clear user data from storage
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        sessionStorage.removeItem('user');
        sessionStorage.removeItem('token');
        
        // Show success message and redirect
        alert('Your account has been deleted successfully.');
        navigate('/signin');
      } else {
        setNotification({
          type: 'error',
          message: data.message || 'Failed to delete account'
        });
        setDeleteConfirmOpen(false);
      }
    } catch (err) {
      console.error("Error deleting account:", err);
      setNotification({
        type: 'error',
        message: 'An error occurred while deleting your account'
      });
    } finally {
      setDeleteLoading(false);
      setDeletePassword('');
    }
  };

  // Handle notification dismissal
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (err) {
      console.log("Error: ",err)
      return dateString;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-black"></div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="container mx-auto px-6 py-16">
        <div className="text-center p-12 bg-white rounded-xl shadow-md max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold mb-6">Authentication Required</h2>
          <p className="mb-8 text-lg text-gray-600">Please sign in to view your profile.</p>
          <button 
            onClick={() => navigate('/signin')}
            className="px-8 py-3 text-lg bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-10">
      {/* Notification */}
      {notification && (
        <div className={`fixed top-20 right-4 z-50 p-5 rounded-lg shadow-lg max-w-md ${
          notification.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 
          'bg-red-50 text-red-800 border border-red-200'
        }`}>
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              {notification.type === 'success' ? (
                <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
              <p className="text-lg">{notification.message}</p>
            </div>
            <button 
              onClick={() => setNotification(null)}
              className="ml-4 text-gray-500 hover:text-gray-800"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
      
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar */}
        <div className="lg:w-1/3 xl:w-1/4">
          <div className="bg-white rounded-xl shadow-md p-8 sticky top-24">
            {/* Profile Header */}
            <div className="flex flex-col items-center mb-8">
              <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center mb-4 shadow-md">
                <span className="text-4xl font-medium text-gray-600">
                  {currentUser.fullName?.charAt(0) || currentUser.username?.charAt(0) || 'U'}
                </span>
              </div>
              <h2 className="text-2xl font-bold">{currentUser.fullName || currentUser.username}</h2>
              <p className="text-gray-600 text-lg mt-1">@{currentUser.username}</p>
              {currentUser.designation && currentUser.department && (
                <p className="mt-2 text-gray-500 text-lg">{currentUser.designation}, {currentUser.department}</p>
              )}
            </div>
            
            {/* Navigation */}
            <nav className="mb-8">
              <ul className="space-y-3">
                <li>
                  <button
                    onClick={() => setActiveSection('overview')}
                    className={`w-full flex items-center p-4 rounded-lg transition-colors text-lg ${
                      activeSection === 'overview' ? 'bg-black text-white' : 'hover:bg-gray-100'
                    }`}
                  >
                    <svg className="w-6 h-6 mr-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    </svg>
                    Overview
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setActiveSection('workshops')}
                    className={`w-full flex items-center p-4 rounded-lg transition-colors text-lg ${
                      activeSection === 'workshops' ? 'bg-black text-white' : 'hover:bg-gray-100'
                    }`}
                  >
                    <svg className="w-6 h-6 mr-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    My Workshops
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setActiveSection('account')}
                    className={`w-full flex items-center p-4 rounded-lg transition-colors text-lg ${
                      activeSection === 'account' ? 'bg-black text-white' : 'hover:bg-gray-100'
                    }`}
                  >
                    <svg className="w-6 h-6 mr-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Account Settings
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setActiveSection('security')}
                    className={`w-full flex items-center p-4 rounded-lg transition-colors text-lg ${
                      activeSection === 'security' ? 'bg-black text-white' : 'hover:bg-gray-100'
                    }`}
                  >
                    <svg className="w-6 h-6 mr-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    Security
                  </button>
                </li>
              </ul>
            </nav>
            
            {/* Quick Stats */}
            <div className="bg-gray-50 p-6 rounded-xl">
              <h3 className="text-lg font-medium text-gray-700 mb-4">Workshop Statistics</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                  <p className="text-3xl font-bold">{userStats?.totalCreated || 0}</p>
                  <p className="text-sm text-gray-500 mt-1">Created</p>
                </div>
                <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                  <p className="text-3xl font-bold">{userStats?.upcoming || 0}</p>
                  <p className="text-sm text-gray-500 mt-1">Upcoming</p>
                </div>
                <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                  <p className="text-3xl font-bold">{userStats?.ongoing || 0}</p>
                  <p className="text-sm text-gray-500 mt-1">Ongoing</p>
                </div>
                <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                  <p className="text-3xl font-bold">{userStats?.completed || 0}</p>
                  <p className="text-sm text-gray-500 mt-1">Completed</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Main Content */}
        <div className="lg:w-2/3 xl:w-3/4">
          {/* Overview Section */}
          {activeSection === 'overview' && (
            <div className="bg-white rounded-xl shadow-md p-8">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-3xl font-bold">Profile Overview</h2>
                <button
                  onClick={() => setEditMode(!editMode)}
                  className="flex items-center text-base font-medium px-6 py-3 rounded-lg border border-gray-300 hover:bg-gray-50"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  {editMode ? 'Cancel' : 'Edit Profile'}
                </button>
              </div>
              
              {editMode ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-base font-medium text-gray-700 mb-2">Full Name</label>
                      <input
                        type="text"
                        value={editData.fullName}
                        onChange={(e) => setEditData({...editData, fullName: e.target.value})}
                        className="w-full p-3 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-base font-medium text-gray-700 mb-2">Email</label>
                      <input
                        type="email"
                        value={editData.email}
                        onChange={(e) => setEditData({...editData, email: e.target.value})}
                        className="w-full p-3 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-base font-medium text-gray-700 mb-2">Department</label>
                      <input
                        type="text"
                        value={editData.department}
                        onChange={(e) => setEditData({...editData, department: e.target.value})}
                        className="w-full p-3 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-base font-medium text-gray-700 mb-2">Designation</label>
                      <input
                        type="text"
                        value={editData.designation}
                        onChange={(e) => setEditData({...editData, designation: e.target.value})}
                        className="w-full p-3 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-base font-medium text-gray-700 mb-2">Bio</label>
                    <textarea
                      value={editData.bio}
                      onChange={(e) => setEditData({...editData, bio: e.target.value})}
                      rows={5}
                      className="w-full p-3 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                      placeholder="Tell something about yourself"
                    />
                  </div>
                  
                  <div className="flex justify-end pt-4">
                    <button
                      onClick={handleProfileUpdate}
                      className="px-8 py-3 bg-black text-white text-lg rounded-lg hover:bg-gray-800"
                    >
                      Save Changes
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-8">
                  {/* Basic Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="bg-gray-50 rounded-xl p-6">
                      <h3 className="text-base font-medium text-gray-500">Full Name</h3>
                      <p className="mt-2 text-xl">{currentUser.fullName || 'Not set'}</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-6">
                      <h3 className="text-base font-medium text-gray-500">Username</h3>
                      <p className="mt-2 text-xl">{currentUser.username}</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-6">
                      <h3 className="text-base font-medium text-gray-500">Email</h3>
                      <p className="mt-2 text-xl">{currentUser.email || 'Not set'}</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-6">
                      <h3 className="text-base font-medium text-gray-500">Account Status</h3>
                      <div className="mt-2">
                        <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${
                          currentUser.isBlocked === "true" ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                        }`}>
                          {currentUser.isBlocked === "true" ? 'Blocked' : 'Active'}
                        </span>
                      </div>
                    </div>
                    {(currentUser.department || currentUser.designation) && (
                      <>
                        <div className="bg-gray-50 rounded-xl p-6">
                          <h3 className="text-base font-medium text-gray-500">Department</h3>
                          <p className="mt-2 text-xl">{currentUser.department || 'Not set'}</p>
                        </div>
                        <div className="bg-gray-50 rounded-xl p-6">
                          <h3 className="text-base font-medium text-gray-500">Designation</h3>
                          <p className="mt-2 text-xl">{currentUser.designation || 'Not set'}</p>
                        </div>
                      </>
                    )}
                  </div>
                  
                  {/* Bio */}
                  {currentUser.bio && (
                    <div className="bg-gray-50 rounded-xl p-6">
                      <h3 className="text-base font-medium text-gray-500">About</h3>
                      <p className="mt-3 text-lg text-gray-800 leading-relaxed">{currentUser.bio}</p>
                    </div>
                  )}
                  
                  {/* Recent Activity */}
                  <div>
                    <h3 className="text-xl font-semibold mb-4">Recent Workshops</h3>
                    {userStats?.createdWorkshops && userStats.createdWorkshops.length > 0 ? (
                      <div className="overflow-hidden rounded-xl border border-gray-200 shadow-sm">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th scope="col" className="px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                                Workshop
                              </th>
                              <th scope="col" className="px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                                Date
                              </th>
                              <th scope="col" className="px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                                Status
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {userStats.createdWorkshops.slice(0, 5).map((workshop, index) => {
                              const now = new Date();
                              const startDate = new Date(workshop.eventStDate);
                              const endDate = workshop.eventEndDate ? new Date(workshop.eventEndDate) : new Date(startDate);
                              
                              let status, statusClass;
                              if (now < startDate) {
                                status = "Upcoming";
                                statusClass = "bg-blue-100 text-blue-800";
                              } else if (now <= endDate) {
                                status = "In Progress";
                                statusClass = "bg-green-100 text-green-800";
                              } else {
                                status = "Completed";
                                statusClass = "bg-gray-100 text-gray-800";
                              }
                              
                              return (
                                <tr key={index} className="hover:bg-gray-50">
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <a 
                                      href={`/workshops/${encodeURIComponent(workshop.eventTitle)}`}
                                      className="text-black hover:underline text-lg font-medium"
                                    >
                                      {workshop.eventTitle}
                                    </a>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-base text-gray-500">
                                    {formatDate(workshop.eventStDate)}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${statusClass}`}>
                                      {status}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                        {userStats.createdWorkshops.length > 5 && (
                          <div className="px-6 py-4 bg-gray-50 text-center">
                            <button 
                              onClick={() => setActiveSection('workshops')}
                              className="text-base text-gray-700 hover:text-black font-medium"
                            >
                              View all workshops
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-16 bg-gray-50 rounded-xl">
                        <p className="text-gray-500 text-lg mb-4">No workshops created yet</p>
                        <a 
                          href="/create-workshop" 
                          className="inline-flex items-center px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors text-base"
                        >
                          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                          </svg>
                          Create your first workshop
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Workshops Section */}
          {activeSection === 'workshops' && (
            <div className="space-y-8">
              {/* All Workshops */}
              <div className="bg-white rounded-xl shadow-md p-8">
                <h2 className="text-3xl font-bold mb-6">My Workshops</h2>
                
                {userStats?.createdWorkshops?.length > 0 || userStats?.contributedWorkshops?.length > 0 ? (
                  <div className="overflow-hidden rounded-xl border border-gray-200 shadow-sm">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                            Workshop
                          </th>
                          <th scope="col" className="hidden md:table-cell px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                            Date
                          </th>
                          <th scope="col" className="hidden sm:table-cell px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                            Categories
                          </th>
                          <th scope="col" className="px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th scope="col" className="px-6 py-4 text-right text-sm font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {[...(userStats.createdWorkshops || []), ...(userStats.contributedWorkshops || [])].map((workshop, index) => {
                          const now = new Date();
                          const startDate = new Date(workshop.eventStDate);
                          const endDate = workshop.eventEndDate ? new Date(workshop.eventEndDate) : new Date(startDate);
                          
                          let status, statusClass;
                          if (now < startDate) {
                            status = "Upcoming";
                            statusClass = "bg-blue-100 text-blue-800";
                          } else if (now <= endDate) {
                            status = "In Progress";
                            statusClass = "bg-green-100 text-green-800";
                          } else {
                            status = "Completed";
                            statusClass = "bg-gray-100 text-gray-800";
                          }
                          
                          const isCreator = workshop.editAccessUsers?.[0] === currentUser.username;
                          
                          return (
                            <tr key={index} className="hover:bg-gray-50">
                              <td className="px-6 py-5 whitespace-nowrap">
                                <div>
                                  <a 
                                    href={`/workshops/${encodeURIComponent(workshop.eventTitle)}`}
                                    className="text-black hover:underline text-lg font-medium"
                                  >
                                    {workshop.eventTitle}
                                  </a>
                                  {isCreator && (
                                    <span className="ml-2 px-2 py-0.5 bg-gray-100 text-xs font-medium text-gray-600 rounded-full">
                                      Creator
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="hidden md:table-cell px-6 py-5 whitespace-nowrap text-base text-gray-500">
                                {formatDate(workshop.eventStDate)}
                              </td>
                              <td className="hidden sm:table-cell px-6 py-5 whitespace-nowrap">
                                <div className="flex flex-wrap gap-2">
                                  {workshop.category?.slice(0, 2).map((cat, idx) => (
                                    <span 
                                      key={idx}
                                      className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-100 text-gray-800"
                                    >
                                      {cat}
                                    </span>
                                  ))}
                                  {(workshop.category?.length || 0) > 2 && (
                                    <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-100 text-gray-800">
                                      +{workshop.category.length - 2}
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-5 whitespace-nowrap">
                                <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${statusClass}`}>
                                  {status}
                                </span>
                              </td>
                              <td className="px-6 py-5 whitespace-nowrap text-right">
                                <div className="flex items-center justify-end space-x-4">
                                  {/* <a 
                                    href={`/edit-workshop/${workshop._id}`}
                                    className="inline-flex items-center px-3 py-1.5 bg-gray-100 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                                  >
                                    <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                    Edit
                                  </a> */}
                                  <button 
                                    onClick={() => {
                                      const titleSlug = encodeURIComponent(workshop.eventTitle.toLowerCase().replace(/\s+/g, '-'));
                                      navigate(`/workshops/${titleSlug}`, { state: { workshop } });
                                    }}
                                    className="inline-flex items-center px-3 py-1.5 bg-black text-sm font-medium text-white rounded-md hover:bg-gray-800 transition-colors"
                                  >
                                    <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                    View
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-16 bg-gray-50 rounded-xl">
                    <p className="text-gray-500 text-lg mb-4">No workshops available</p>
                    <a 
                      href="/create-workshop" 
                      className="inline-flex items-center px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors text-base"
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                      </svg>
                      Create your first workshop
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Account Settings Section */}
          {activeSection === 'account' && (
            <div className="bg-white rounded-xl shadow-md p-8">
              <h2 className="text-3xl font-bold mb-8">Account Settings</h2>
              
              <div className="space-y-10">
                {/* Profile Information */}
                <div>
                  <h3 className="text-2xl font-medium mb-6">Profile Information</h3>
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-base font-medium text-gray-700 mb-2">Full Name</label>
                        <input
                          type="text"
                          value={editData.fullName}
                          onChange={(e) => setEditData({...editData, fullName: e.target.value})}
                          className="w-full p-3 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-base font-medium text-gray-700 mb-2">Email</label>
                        <input
                          type="email"
                          value={editData.email}
                          onChange={(e) => setEditData({...editData, email: e.target.value})}
                          className="w-full p-3 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-base font-medium text-gray-700 mb-2">Department</label>
                        <input
                          type="text"
                          value={editData.department}
                          onChange={(e) => setEditData({...editData, department: e.target.value})}
                          className="w-full p-3 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-base font-medium text-gray-700 mb-2">Designation</label>
                        <input
                          type="text"
                          value={editData.designation}
                          onChange={(e) => setEditData({...editData, designation: e.target.value})}
                          className="w-full p-3 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-base font-medium text-gray-700 mb-2">Bio</label>
                      <textarea
                        value={editData.bio}
                        onChange={(e) => setEditData({...editData, bio: e.target.value})}
                        rows={5}
                        className="w-full p-3 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                        placeholder="Tell something about yourself"
                      />
                    </div>
                    
                    <div className="flex justify-end">
                      <button
                        onClick={handleProfileUpdate}
                        className="px-8 py-3 bg-black text-white text-lg rounded-lg hover:bg-gray-800"
                      >
                        Save Profile
                      </button>
                    </div>
                  </div>
                </div>
                
                <hr className="border-gray-200" />
                
                {/* Account Management */}
                <div>
                  <h3 className="text-2xl font-medium mb-6">Account Management</h3>
                  <div className="space-y-4">
                    <div className="flex items-start p-6 bg-yellow-50 border-l-4 border-yellow-400 rounded-xl">
                      <svg className="w-8 h-8 text-yellow-600 mr-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <div>
                        <h4 className="font-medium text-yellow-700 text-lg">Account Deletion</h4>
                        <p className="text-base text-yellow-600 mt-2">
                          Once you delete your account, there is no going back. Please be certain.
                        </p>
                        <button
                          className="mt-4 px-6 py-3 bg-red-100 text-red-800 rounded-lg hover:bg-red-200 text-base font-medium"
                          onClick={() => setDeleteConfirmOpen(true)}
                        >
                          Delete Account
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Deletion Confirmation Modal */}
          {deleteConfirmOpen && (
            <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl">
                <h3 className="text-xl font-bold text-red-600 mb-4">Confirm Account Deletion</h3>
                <p className="mb-6 text-gray-700">
                  This action <span className="font-bold">cannot be undone</span>. All your data, including workshops you've created and contributions, will be permanently deleted.
                </p>
                
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Enter your password to confirm
                  </label>
                  <input
                    type="password"
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="Your current password"
                  />
                </div>
                
                <div className="flex justify-end space-x-4">
                  <button
                    onClick={() => {
                      setDeleteConfirmOpen(false);
                      setDeletePassword('');
                    }}
                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                    disabled={deleteLoading}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAccountDeletion}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center"
                    disabled={deleteLoading}
                  >
                    {deleteLoading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Deleting...
                      </>
                    ) : (
                      'Permanently Delete Account'
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {/* Security Section */}
          {activeSection === 'security' && (
            <div className="bg-white rounded-xl shadow-md p-8">
              <h2 className="text-3xl font-bold mb-8">Security Settings</h2>
              
              <div className="space-y-10">
                {/* Password Change */}
                <div>
                  <h3 className="text-2xl font-medium mb-6">Change Password</h3>
                  <div className="space-y-6 max-w-2xl">
                    <div>
                      <label className="block text-base font-medium text-gray-700 mb-2">Current Password</label>
                      <input
                        type="password"
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                        className="w-full p-3 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-base font-medium text-gray-700 mb-2">New Password</label>
                      <input
                        type="password"
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                        className="w-full p-3 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-base font-medium text-gray-700 mb-2">Confirm New Password</label>
                      <input
                        type="password"
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                        className="w-full p-3 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                      />
                    </div>
                    
                    <div className="flex justify-end pt-2">
                      <button
                        onClick={handlePasswordChange}
                        className="px-8 py-3 bg-black text-white text-lg rounded-lg hover:bg-gray-800"
                      >
                        Update Password
                      </button>
                    </div>
                  </div>
                </div>
                
                <hr className="border-gray-200" />
                
                {/* Login History */}
                <div>
                  <h3 className="text-2xl font-medium mb-6">Login History</h3>
                  <p className="text-lg text-gray-600 mb-6">
                    Below is your recent login activity. If you see any suspicious activity, please change your password immediately.
                  </p>
                  <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                            Date & Time
                          </th>
                          <th scope="col" className="px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                            IP Address
                          </th>
                          <th scope="col" className="px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                            Location
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        <tr>
                          <td className="px-6 py-5 whitespace-nowrap text-base text-gray-500">
                            {new Date().toLocaleString()}
                          </td>
                          <td className="px-6 py-5 whitespace-nowrap text-base text-gray-500">
                            127.0.0.1
                          </td>
                          <td className="px-6 py-5 whitespace-nowrap text-base text-gray-500">
                            <span className="inline-flex items-center">
                              <span className="h-3 w-3 rounded-full bg-green-400 mr-2"></span>
                              Current Session
                            </span>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Profile;