import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
const BackendURL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';

function CreateAccess() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [processingUsers, setProcessingUsers] = useState(new Set());
  const [showAccessModal, setShowAccessModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [accessExpiry, setAccessExpiry] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      // Get token from localStorage
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      
      if (!token) {
        setError('Authentication token not found. Please login again.');
        toast.error('Authentication required');
        return;
      }

      const response = await fetch(`${BackendURL}/userApi/allUsers`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      // Parse JSON response
      const data = await response.json();
      
      // The API returns { users: [...] } so we need to access the users property
      const usersList = data.users || [];
      
      // Filter out admin users
      const nonAdminUsers = usersList.filter(user => user.isAdmin !== "true");
      setUsers(nonAdminUsers);
      setError(null);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(`Failed to fetch users. ${err.message}`);
      toast.error(`Error loading users: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const openAccessModal = (user) => {
    setSelectedUser(user);
    // Default to 30 days from now
    const defaultDate = new Date();
    defaultDate.setDate(defaultDate.getDate() + 30);
    setAccessExpiry(defaultDate.toISOString().split('T')[0]);
    setShowAccessModal(true);
  };

  const closeAccessModal = () => {
    setSelectedUser(null);
    setAccessExpiry('');
    setShowAccessModal(false);
  };

  const handleGrantCreateAccess = async () => {
    if (!selectedUser || !accessExpiry) return;
    
    try {
      setProcessingUsers(prev => new Set(prev).add(selectedUser._id));
      // Get token from localStorage
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      
      if (!token) {
        toast.error('Authentication required');
        return;
      }

      // Use consistent API pattern with BackendURL
      await axios.post(`${BackendURL}/userApi/grant-create-access/${selectedUser._id}`, 
        { expiryDate: accessExpiry }, 
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      setUsers(users.map(user => 
        user._id === selectedUser._id ? {
          ...user, 
          hasCreateAccess: true,
          createAccessExpiry: accessExpiry
        } : user
      ));
      
      toast.success(`Create access granted to ${selectedUser.username} until ${new Date(accessExpiry).toLocaleDateString()}`);
      closeAccessModal();
    } catch (err) {
      toast.error(`Failed to grant access to ${selectedUser.username}: ${err.message}`);
    } finally {
      setProcessingUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(selectedUser?._id);
        return newSet;
      });
    }
  };

  const handleRevokeCreateAccess = async (userId, username) => {
    try {
      setProcessingUsers(prev => new Set(prev).add(userId));
      // Get token from localStorage
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      
      if (!token) {
        toast.error('Authentication required');
        return;
      }

      // Use consistent API pattern with BackendURL
      await axios.post(`${BackendURL}/userApi/revoke-create-access/${userId}`, {}, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      setUsers(users.map(user => 
        user._id === userId ? {
          ...user, 
          hasCreateAccess: false,
          createAccessExpiry: null
        } : user
      ));
      toast.success(`Create access revoked from ${username}`);
    } catch (err) {
      toast.error(`Failed to revoke access from ${username}: ${err.message}`);
    } finally {
      setProcessingUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    }
  };

  const filteredUsers = users.filter(user => 
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Format date helper function
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (err) {
      console.log("Error: ",err);
      return dateString;
    }
  };

  // Check if access has expired
  const checkAccessStatus = (user) => {
    if (!user.hasCreateAccess) return { status: 'No Access', class: 'bg-gray-100 text-gray-800' };
    
    if (!user.createAccessExpiry) return { 
      status: 'Permanent Access', 
      class: 'bg-green-100 text-green-800'
    };
    
    const expiryDate = new Date(user.createAccessExpiry);
    const currentDate = new Date();
    
    if (currentDate > expiryDate) {
      return { status: 'Expired', class: 'bg-red-100 text-red-800' };
    }
    
    return { 
      status: `Access until ${formatDate(user.createAccessExpiry)}`, 
      class: 'bg-green-100 text-green-800'
    };
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 bg-white shadow-md rounded-lg overflow-hidden">
        <div className="p-4">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-4">
            <div className="w-full md:w-1/3">
              <div className="relative">
                <input
                  type="text"
                  className="w-full p-2 pl-10 border border-gray-300 rounded-md"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
            </div>
            
            <div className="w-full md:w-auto">
              <button 
                onClick={fetchUsers}
                className="w-full md:w-auto flex items-center justify-center px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
              >
                <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </button>
            </div>
          </div>
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
          </div>
        ) : error ? (
          <div className="p-4 text-center text-red-600">
            {error}
            <button 
              className="ml-2 text-blue-500 hover:underline"
              onClick={fetchUsers}
            >
              Try again
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Username</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Access Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="px-6 py-4 text-center text-gray-500">
                      No users found
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map(user => {
                    const accessStatus = checkAccessStatus(user);
                    return (
                      <tr key={user._id} className="border-b border-gray-200 hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-gray-900">{user.username}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-gray-700">{user.email || 'No email'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${accessStatus.class}`}>
                            {accessStatus.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          {user.hasCreateAccess ? (
                            <button
                              onClick={() => handleRevokeCreateAccess(user._id, user.username)}
                              disabled={processingUsers.has(user._id)}
                              className={`${
                                processingUsers.has(user._id) 
                                  ? 'bg-red-300 cursor-not-allowed' 
                                  : 'bg-red-100 hover:bg-red-200'
                              } text-red-800 py-1 px-3 rounded-md flex items-center`}
                            >
                              {processingUsers.has(user._id) ? (
                                <>
                                  <span className="animate-pulse mr-2">●</span>
                                  Processing...
                                </>
                              ) : (
                                <>
                                  <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                  Revoke Access
                                </>
                              )}
                            </button>
                          ) : (
                            <button
                              onClick={() => openAccessModal(user)}
                              disabled={processingUsers.has(user._id)}
                              className={`${
                                processingUsers.has(user._id) 
                                  ? 'bg-green-300 cursor-not-allowed' 
                                  : 'bg-green-100 hover:bg-green-200'
                              } text-green-800 py-1 px-3 rounded-md flex items-center`}
                            >
                              {processingUsers.has(user._id) ? (
                                <>
                                  <span className="animate-pulse mr-2">●</span>
                                  Processing...
                                </>
                              ) : (
                                <>
                                  <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                  </svg>
                                  Grant Access
                                </>
                              )}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Access Modal */}
      {showAccessModal && selectedUser && (
        <div className="fixed inset-0 z-50 overflow-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-bold text-green-600">Grant Create Access</h2>
              <button 
                onClick={closeAccessModal}
                className="text-gray-500 hover:text-black p-2 rounded-md hover:bg-gray-100"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <p className="mb-2">
                    Grant workshop creation access to <span className="font-semibold">{selectedUser.username}</span>
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Access Expiry Date
                  </label>
                  <input
                    type="date"
                    value={accessExpiry}
                    onChange={(e) => setAccessExpiry(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    The user will have access to create workshops until this date.
                  </p>
                </div>
                
                <div className="border-t border-gray-200 pt-4 mt-6">
                  <div className="flex justify-end space-x-3">
                    <button
                      onClick={closeAccessModal}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleGrantCreateAccess}
                      disabled={!accessExpiry}
                      className={`px-4 py-2 bg-green-600 text-white rounded-md ${
                        !accessExpiry
                          ? 'opacity-50 cursor-not-allowed' 
                          : 'hover:bg-green-700'
                      }`}
                    >
                      Grant Access
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CreateAccess;