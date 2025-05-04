import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function Workshops() {
  const [workshops, setWorkshops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedWorkshop, setSelectedWorkshop] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState('newest'); // 'newest', 'oldest'
  const [yearFilter, setYearFilter] = useState('all'); // Default to "all"
  const [statusFilter, setStatusFilter] = useState('all'); 
  const navigate = useNavigate();

  // Get current user
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || 'null');
    setCurrentUser(user);
  }, []);

  // Fetch workshops
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
          setWorkshops(data.Workshops || []);
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

  // Add this utility function to get unique years from workshops
  const getUniqueYears = () => {
    const years = workshops
      .map(workshop => {
        if (!workshop.eventStDate) return null;
        return new Date(workshop.eventStDate).getFullYear();
      })
      .filter(Boolean); // Remove null values
    
    // Remove duplicates and sort in descending order
    return [...new Set(years)].sort((a, b) => b - a);
  };

  // Filter and sort workshops based on search query, year filter, and sort order
  const filteredAndSortedWorkshops = () => {
    let filtered = [...workshops];
    
    // Apply year filter if not set to "all"
    if (yearFilter !== 'all') {
      const year = parseInt(yearFilter);
      filtered = filtered.filter(workshop => {
        if (!workshop.eventStDate) return false;
        return new Date(workshop.eventStDate).getFullYear() === year;
      });
    }
    if (statusFilter !== 'all') {
      filtered = filtered.filter(workshop => getWorkshopStatus(workshop) === statusFilter);
    }
    
    // Apply search filter if query exists
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(workshop => 
        workshop.eventTitle?.toLowerCase().includes(query) || 
        workshop.category?.some(cat => cat.toLowerCase().includes(query))
      );
    }
    
    // Sort workshops
    switch (sortOrder) {
      case 'newest':
        return filtered.sort((a, b) => new Date(b.eventStDate) - new Date(a.eventStDate));
      case 'oldest':
        return filtered.sort((a, b) => new Date(a.eventStDate) - new Date(b.eventStDate));
      default:
        return filtered.sort((a, b) => new Date(b.eventStDate) - new Date(a.eventStDate));
    }
  };

  // Calculate workshop status
  const getWorkshopStatus = (workshop) => {
    if (!workshop.eventStDate) return "Unknown";
    
    const now = new Date();
    const startDate = new Date(workshop.eventStDate);
    const endDate = workshop.eventEndDate ? new Date(workshop.eventEndDate) : new Date(startDate);
    
    if (now < startDate) return "Upcoming";
    if (now <= endDate) return "In Progress";
    return "Completed";
  };
  
  // Get status class for background color
  const getStatusClass = (status) => {
    switch(status) {
      case "Upcoming": return "bg-blue-100 text-blue-800";
      case "In Progress": return "bg-green-100 text-green-800";
      case "Completed": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const openModal = (workshop) => {
    setSelectedWorkshop(workshop);
    setShowModal(true);
    setActiveTab('overview');
    setDeleteConfirm(false);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedWorkshop(null);
    setIsEditing(false);
    setEditData({});
    setDeleteConfirm(false);
  };

  const formatDate = (dateString) => {
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

  // Check if current user has edit access
  const hasEditAccess = (workshop) => {
    if (!currentUser || !workshop) return false;
    return workshop.editAccessUsers?.includes(currentUser.username);
  };

  // Handle edit submission
  const handleEditSubmit = async () => {
    if (!selectedWorkshop) return;
    
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/workshopApi/editwks/${encodeURIComponent(selectedWorkshop.eventTitle)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(editData)
      });
      
      const data = await response.json();
      
      if (response.ok) {
        // Update local workshop data
        const updatedWorkshops = workshops.map(w => 
          w.eventTitle === selectedWorkshop.eventTitle ? { ...w, ...editData } : w
        );
        setWorkshops(updatedWorkshops);
        setSelectedWorkshop({ ...selectedWorkshop, ...editData });
        setIsEditing(false);
        setEditData({});
      } else {
        alert(data.message || 'Failed to update workshop');
      }
    } catch (err) {
      alert('Network error. Please try again.');
      console.error(err);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!selectedWorkshop) return;
    
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/workshopApi/delwks/${encodeURIComponent(selectedWorkshop.eventTitle)}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        // Remove from local state
        const updatedWorkshops = workshops.filter(w => w.eventTitle !== selectedWorkshop.eventTitle);
        setWorkshops(updatedWorkshops);
        closeModal();
      } else {
        const data = await response.json();
        alert(data.message || 'Failed to delete workshop');
      }
    } catch (err) {
      alert('Network error. Please try again.');
      console.error(err);
    }
  };

  // Navigate to create workshop page
  const handleCreateWorkshop = () => {
    navigate('/create-workshop');
  };

  // Navigate to event details page
  const navigateToEventDetails = (workshop) => {
    // Create a URL-friendly version of the workshop title
    const titleSlug = encodeURIComponent(workshop.eventTitle.toLowerCase().replace(/\s+/g, '-'));
    navigate(`/workshops/${titleSlug}`, { state: { workshop } });
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
      {/* Header with search and actions */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center space-y-4 md:space-y-0 mb-8">
        <h1 className="text-3xl font-bold">Workshops</h1>
        
        <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
          {/* Search Input */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search workshops..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
            />
            <svg 
              className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          
          {/* Year Filter Dropdown */}
          <select 
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
            className="pl-4 pr-8 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
          >
            <option value="all">All Years</option>
            {getUniqueYears().map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>

          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="pl-4 pr-8 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
          >
            <option value="all">All Statuses</option>
            <option value="Upcoming">Upcoming</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
          </select>

          {/* Sort Dropdown */}
          <select 
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="pl-4 pr-8 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
          </select>
          
          {/* Create Workshop Button */}
          <button 
            onClick={handleCreateWorkshop}
            className="bg-black text-white py-2 px-4 rounded-md hover:bg-gray-800 transition-colors flex items-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            Create Workshop
          </button>
        </div>
      </div>
      
      {/* Display filtered results count if searching or filtering by year */}
      {(searchQuery.trim() || yearFilter !== 'all' || statusFilter !== 'all') && (
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between">
          <div className="text-base text-gray-700 mb-2 sm:mb-0">
            Found <span className="font-medium">{filteredAndSortedWorkshops().length}</span> workshop(s)
            {searchQuery.trim() && <> matching "<span className="font-medium">{searchQuery}</span>"</>}
            {yearFilter !== 'all' && <> from <span className="font-medium">{yearFilter}</span></>}
            {statusFilter !== 'all' && <> with status "<span className="font-medium">{statusFilter}</span>"</>}
          </div>
          
          <button
            onClick={() => {
              setSearchQuery('');
              setYearFilter('all');
              setStatusFilter('all');
            }}
            className="flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium rounded-md border border-gray-300 transition-colors self-start"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
            Clear Filters
          </button>
        </div>
      )}
      
      {/* Workshop listings */}
      {workshops.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-lg shadow">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
          </svg>
          <p className="mt-2 text-gray-600 text-lg">No workshops found</p>
          <p className="text-gray-500">Workshops you create or have access to will appear here.</p>
          <button 
            onClick={handleCreateWorkshop}
            className="mt-4 bg-black text-white py-2 px-4 rounded-md hover:bg-gray-800 transition-colors"
          >
            Create Your First Workshop
          </button>
        </div>
      ) : filteredAndSortedWorkshops().length === 0 ? (
        <div className="text-center py-16 bg-white rounded-lg shadow">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
          </svg>
          <p className="mt-2 text-gray-600 text-lg">No matching workshops found</p>
          <p className="text-gray-500">
            {yearFilter !== 'all' || statusFilter !== 'all' ? 
              `No workshops found${yearFilter !== 'all' ? ` for the year ${yearFilter}` : ''}${statusFilter !== 'all' ? ` with status "${statusFilter}"` : ''}${searchQuery ? ` matching "${searchQuery}"` : ''}` : 
              'Try adjusting your search or filters.'}
          </p>
          <button 
            onClick={() => {
              setSearchQuery('');
              setYearFilter('all');
              setStatusFilter('all');
            }}
            className="mt-4 bg-black text-white py-2 px-4 rounded-md hover:bg-gray-800 transition-colors"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredAndSortedWorkshops().map((workshop) => {
            const status = getWorkshopStatus(workshop);
            const statusClass = getStatusClass(status);
            
            return (
              <div 
                key={workshop._id || workshop.eventTitle}
                className="bg-white rounded-lg overflow-hidden shadow-md transition-transform hover:shadow-lg hover:-translate-y-1"
              >
                <div className="relative pb-[65%]">
                  <img 
                    src={workshop.thumbnail || "https://via.placeholder.com/600x350?text=Workshop"}
                    alt={workshop.eventTitle}
                    className="absolute h-full w-full object-cover cursor-pointer"
                    // onClick={() => openModal(workshop)}
                    onClick={() => navigateToEventDetails(workshop)}
                  />
                  {/* Workshop date badge */}
                  <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-md text-sm font-medium">
                    <span className={new Date(workshop.eventStDate) > new Date() ? "text-green-700" : ""}>
                      {formatDate(workshop.eventStDate)}
                    </span>
                  </div>
                  
                  {/* Status badge */}
                  <div className="absolute top-3 right-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusClass}`}>
                      {status}
                    </span>
                  </div>
                  
                  {/* Edit button moved below */}
                  {hasEditAccess(workshop) && (
                    <div className="absolute top-12 right-3 flex space-x-1">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedWorkshop(workshop);
                          setIsEditing(true);
                          setEditData({});
                          setShowModal(true);
                        }}
                        className="p-2 bg-white rounded-full shadow hover:bg-gray-100"
                        title="Edit workshop"
                      >
                        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
                
                <div className="p-6">
                  <h3 
                    className="text-2xl font-semibold mb-3 cursor-pointer hover:text-gray-700"
                    // onClick={() => openModal(workshop)}
                    onClick={() => navigateToEventDetails(workshop)}
                  >
                    {workshop.eventTitle}
                  </h3>
                  
                  {/* Categories */}
                  {workshop.category && workshop.category.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {workshop.category.slice(0, 3).map((cat, idx) => (
                        <span 
                          key={idx}
                          className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full"
                        >
                          {cat}
                        </span>
                      ))}
                      {workshop.category.length > 3 && (
                        <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full">
                          +{workshop.category.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                  
                  <div className="flex justify-between space-x-4 mt-4">
                    {/* <a 
                      href={workshop.registrationLink} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex-1 bg-black text-white text-center py-3 rounded-md hover:bg-gray-800 transition-colors font-medium"
                    >
                      Register
                    </a> */}
                    
                    <a 
                      href={workshop.feedbackLink} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex-1 border border-black text-black text-center py-3 rounded-md hover:bg-gray-100 transition-colors font-medium"
                    >
                      Feedback
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Enhanced Workshop Details Modal */}
      {showModal && selectedWorkshop && (
        <div className="fixed inset-0 z-50 overflow-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <div className="flex items-center">
                <h2 className="text-2xl font-bold">{selectedWorkshop.eventTitle}</h2>
                <div className="flex items-center ml-3 space-x-2">
                  {/* Status badge in modal */}
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusClass(getWorkshopStatus(selectedWorkshop))}`}>
                    {getWorkshopStatus(selectedWorkshop)}
                  </span>
                  
                  {hasEditAccess(selectedWorkshop) && !isEditing && (
                    <span className="px-2 py-1 bg-gray-100 text-xs font-medium text-gray-800 rounded-full">
                      Editor Access
                    </span>
                  )}
                </div>
              </div>
              
              {/* Rest of the modal header */}
              <div className="flex items-center space-x-2">
                {!isEditing && !deleteConfirm && (
                  <button
                    onClick={() => navigateToEventDetails(selectedWorkshop)}
                    className="p-2 bg-black text-white rounded-md hover:bg-gray-800 flex items-center"
                  >
                    <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    View Full Page
                  </button>
                )}
                {hasEditAccess(selectedWorkshop) && !isEditing && !deleteConfirm && (
                  <>
                    <button
                      onClick={() => {
                        setIsEditing(true);
                        setEditData({});
                      }}
                      className="p-2 text-gray-700 hover:bg-gray-100 rounded-md flex items-center"
                    >
                      <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Edit
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(true)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-md flex items-center"
                    >
                      <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Delete
                    </button>
                  </>
                )}
                <button 
                  onClick={closeModal}
                  className="text-gray-500 hover:text-black p-2 rounded-md hover:bg-gray-100"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Delete Confirmation */}
            {deleteConfirm && (
              <div className="p-6 bg-red-50">
                <h3 className="text-lg font-bold text-red-700 mb-2">Confirm Deletion</h3>
                <p className="text-gray-700 mb-4">
                  Are you sure you want to delete "{selectedWorkshop.eventTitle}"? This action cannot be undone.
                </p>
                <div className="flex space-x-4">
                  <button
                    onClick={handleDelete}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                  >
                    Yes, Delete Workshop
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(false)}
                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Edit Mode */}
            {isEditing ? (
              <div className="overflow-y-auto flex-grow p-6">
                <h3 className="text-xl font-bold mb-4">Edit Workshop</h3>
                <div className="space-y-6">
                  {/* Basic Information */}
                  <div className="bg-gray-50 p-5 rounded-lg">
                    <h4 className="font-medium text-lg mb-4">Basic Information</h4>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Title (Read Only)</label>
                        <input
                          type="text"
                          value={selectedWorkshop.eventTitle}
                          disabled
                          className="w-full p-2 border border-gray-300 rounded-md bg-gray-100"
                        />
                        <p className="mt-1 text-xs text-gray-500">Workshop title cannot be changed</p>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                          <input
                            type="date"
                            value={editData.eventStDate || selectedWorkshop.eventStDate}
                            onChange={(e) => setEditData({...editData, eventStDate: e.target.value})}
                            className="w-full p-2 border border-gray-300 rounded-md"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                          <input
                            type="date"
                            value={editData.eventEndDate || selectedWorkshop.eventEndDate}
                            onChange={(e) => setEditData({...editData, eventEndDate: e.target.value})}
                            className="w-full p-2 border border-gray-300 rounded-md"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                          <input
                            type="text"
                            placeholder="e.g. 10:00 AM"
                            value={editData.eventStTime || selectedWorkshop.eventStTime}
                            onChange={(e) => setEditData({...editData, eventStTime: e.target.value})}
                            className="w-full p-2 border border-gray-300 rounded-md"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Thumbnail URL</label>
                        <input
                          type="text"
                          value={editData.thumbnail || selectedWorkshop.thumbnail || ''}
                          onChange={(e) => setEditData({...editData, thumbnail: e.target.value})}
                          className="w-full p-2 border border-gray-300 rounded-md"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Categories</label>
                        {(editData.category || selectedWorkshop.category || []).map((category, index) => (
                          <div key={`category-${index}`} className="flex items-center mb-2">
                            <input
                              type="text"
                              value={category}
                              onChange={(e) => {
                                const newCategories = [...(editData.category || selectedWorkshop.category)];
                                newCategories[index] = e.target.value;
                                setEditData({...editData, category: newCategories});
                              }}
                              className="flex-1 p-2 border border-gray-300 rounded-md mr-2"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const newCategories = [...(editData.category || selectedWorkshop.category)];
                                newCategories.splice(index, 1);
                                setEditData({...editData, category: newCategories});
                              }}
                              className="p-1 text-red-500 hover:bg-red-50 rounded"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => {
                            const currentCategories = editData.category || selectedWorkshop.category || [];
                            setEditData({
                              ...editData,
                              category: [...currentCategories, '']
                            });
                          }}
                          className="mt-2 flex items-center text-sm text-gray-700 hover:text-black"
                        >
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                          Add Category
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Event Organizers */}
                  <div className="bg-gray-50 p-5 rounded-lg">
                    <h4 className="font-medium text-lg mb-4">Event Organizers</h4>
                    <div className="space-y-3">
                      {(editData.eventOrganiserDetails || selectedWorkshop.eventOrganiserDetails || []).map((organizer, index) => (
                        <div key={`organizer-${index}`} className="p-4 border border-gray-200 rounded-md bg-white">
                          <div className="flex justify-between items-center mb-2">
                            <h5 className="font-medium">Organizer {index + 1}</h5>
                            <button
                              type="button"
                              onClick={() => {
                                const newOrganizers = [...(editData.eventOrganiserDetails || selectedWorkshop.eventOrganiserDetails)];
                                newOrganizers.splice(index, 1);
                                setEditData({...editData, eventOrganiserDetails: newOrganizers});
                              }}
                              className="p-1 text-red-500 hover:bg-red-50 rounded"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                              <input
                                type="text"
                                value={organizer.name || ''}
                                onChange={(e) => {
                                  const newOrganizers = [...(editData.eventOrganiserDetails || selectedWorkshop.eventOrganiserDetails)];
                                  newOrganizers[index] = {...newOrganizers[index], name: e.target.value};
                                  setEditData({...editData, eventOrganiserDetails: newOrganizers});
                                }}
                                className="w-full p-2 border border-gray-300 rounded-md"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Designation</label>
                              <input
                                type="text"
                                value={organizer.designation || ''}
                                onChange={(e) => {
                                  const newOrganizers = [...(editData.eventOrganiserDetails || selectedWorkshop.eventOrganiserDetails)];
                                  newOrganizers[index] = {...newOrganizers[index], designation: e.target.value};
                                  setEditData({...editData, eventOrganiserDetails: newOrganizers});
                                }}
                                className="w-full p-2 border border-gray-300 rounded-md"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => {
                          const currentOrganizers = editData.eventOrganiserDetails || selectedWorkshop.eventOrganiserDetails || [];
                          setEditData({
                            ...editData,
                            eventOrganiserDetails: [...currentOrganizers, { name: '', designation: '' }]
                          });
                        }}
                        className="mt-2 flex items-center text-sm text-gray-700 hover:text-black"
                      >
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Add Organizer
                      </button>
                    </div>
                  </div>
                  
                  {/* Resource Persons */}
                  <div className="bg-gray-50 p-5 rounded-lg">
                    <h4 className="font-medium text-lg mb-4">Resource Persons</h4>
                    <div className="space-y-3">
                      {(editData.resourcePersonDetails || selectedWorkshop.resourcePersonDetails || []).map((person, index) => (
                        <div key={`resource-${index}`} className="p-4 border border-gray-200 rounded-md bg-white">
                          <div className="flex justify-between items-center mb-2">
                            <h5 className="font-medium">Resource Person {index + 1}</h5>
                            <button
                              type="button"
                              onClick={() => {
                                const newPersons = [...(editData.resourcePersonDetails || selectedWorkshop.resourcePersonDetails)];
                                newPersons.splice(index, 1);
                                setEditData({...editData, resourcePersonDetails: newPersons});
                              }}
                              className="p-1 text-red-500 hover:bg-red-50 rounded"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                              <input
                                type="text"
                                value={person.name || ''}
                                onChange={(e) => {
                                  const newPersons = [...(editData.resourcePersonDetails || selectedWorkshop.resourcePersonDetails)];
                                  newPersons[index] = {...newPersons[index], name: e.target.value};
                                  setEditData({...editData, resourcePersonDetails: newPersons});
                                }}
                                className="w-full p-2 border border-gray-300 rounded-md"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Designation</label>
                              <input
                                type="text"
                                value={person.designation || ''}
                                onChange={(e) => {
                                  const newPersons = [...(editData.resourcePersonDetails || selectedWorkshop.resourcePersonDetails)];
                                  newPersons[index] = {...newPersons[index], designation: e.target.value};
                                  setEditData({...editData, resourcePersonDetails: newPersons});
                                }}
                                className="w-full p-2 border border-gray-300 rounded-md"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                              <input
                                type="text"
                                value={person.department || ''}
                                onChange={(e) => {
                                  const newPersons = [...(editData.resourcePersonDetails || selectedWorkshop.resourcePersonDetails)];
                                  newPersons[index] = {...newPersons[index], department: e.target.value};
                                  setEditData({...editData, resourcePersonDetails: newPersons});
                                }}
                                className="w-full p-2 border border-gray-300 rounded-md"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => {
                          const currentPersons = editData.resourcePersonDetails || selectedWorkshop.resourcePersonDetails || [];
                          setEditData({
                            ...editData,
                            resourcePersonDetails: [...currentPersons, { name: '', designation: '', department: '' }]
                          });
                        }}
                        className="mt-2 flex items-center text-sm text-gray-700 hover:text-black"
                      >
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Add Resource Person
                      </button>
                    </div>
                  </div>
                  
                  {/* Workshop Materials */}
                  <div className="bg-gray-50 p-5 rounded-lg">
                    <h4 className="font-medium text-lg mb-4">Workshop Materials</h4>
                    
                    <div className="space-y-4">
                      {/* Event Posters */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Event Posters</label>
                        {(editData.eventPosterLinks || selectedWorkshop.eventPosterLinks || []).map((link, index) => (
                          <div key={`poster-${index}`} className="flex items-center mb-2">
                            <input
                              type="text"
                              value={link}
                              onChange={(e) => {
                                const newLinks = [...(editData.eventPosterLinks || selectedWorkshop.eventPosterLinks)];
                                newLinks[index] = e.target.value;
                                setEditData({...editData, eventPosterLinks: newLinks});
                              }}
                              className="flex-1 p-2 border border-gray-300 rounded-md mr-2"
                              placeholder="Poster link"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const newLinks = [...(editData.eventPosterLinks || selectedWorkshop.eventPosterLinks)];
                                newLinks.splice(index, 1);
                                setEditData({...editData, eventPosterLinks: newLinks});
                              }}
                              className="p-1 text-red-500 hover:bg-red-50 rounded"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => {
                            const currentLinks = editData.eventPosterLinks || selectedWorkshop.eventPosterLinks || [];
                            setEditData({...editData, eventPosterLinks: [...currentLinks, '']});
                          }}
                          className="mt-1 flex items-center text-sm text-gray-700 hover:text-black"
                        >
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                          Add Poster Link
                        </button>
                      </div>
                      
                      {/* Brochures */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Brochures</label>
                        {(editData.brochureLinks || selectedWorkshop.brochureLinks || []).map((link, index) => (
                          <div key={`brochure-${index}`} className="flex items-center mb-2">
                            <input
                              type="text"
                              value={link}
                              onChange={(e) => {
                                const newLinks = [...(editData.brochureLinks || selectedWorkshop.brochureLinks)];
                                newLinks[index] = e.target.value;
                                setEditData({...editData, brochureLinks: newLinks});
                              }}
                              className="flex-1 p-2 border border-gray-300 rounded-md mr-2"
                              placeholder="Brochure link"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const newLinks = [...(editData.brochureLinks || selectedWorkshop.brochureLinks)];
                                newLinks.splice(index, 1);
                                setEditData({...editData, brochureLinks: newLinks});
                              }}
                              className="p-1 text-red-500 hover:bg-red-50 rounded"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => {
                            const currentLinks = editData.brochureLinks || selectedWorkshop.brochureLinks || [];
                            setEditData({...editData, brochureLinks: [...currentLinks, '']});
                          }}
                          className="mt-1 flex items-center text-sm text-gray-700 hover:text-black"
                        >
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                          Add Brochure Link
                        </button>
                      </div>
                      
                      {/* Circulars */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Circulars</label>
                        {(editData.circularLinks || selectedWorkshop.circularLinks || []).map((link, index) => (
                          <div key={`circular-${index}`} className="flex items-center mb-2">
                            <input
                              type="text"
                              value={link}
                              onChange={(e) => {
                                const newLinks = [...(editData.circularLinks || selectedWorkshop.circularLinks)];
                                newLinks[index] = e.target.value;
                                setEditData({...editData, circularLinks: newLinks});
                              }}
                              className="flex-1 p-2 border border-gray-300 rounded-md mr-2"
                              placeholder="Circular link"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const newLinks = [...(editData.circularLinks || selectedWorkshop.circularLinks)];
                                newLinks.splice(index, 1);
                                setEditData({...editData, circularLinks: newLinks});
                              }}
                              className="p-1 text-red-500 hover:bg-red-50 rounded"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => {
                            const currentLinks = editData.circularLinks || selectedWorkshop.circularLinks || [];
                            setEditData({...editData, circularLinks: [...currentLinks, '']});
                          }}
                          className="mt-1 flex items-center text-sm text-gray-700 hover:text-black"
                        >
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                          Add Circular Link
                        </button>
                      </div>
                      
                      {/* Photos */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Photos</label>
                        {(editData.photosLinks || selectedWorkshop.photosLinks || []).map((link, index) => (
                          <div key={`photo-${index}`} className="flex items-center mb-2">
                            <input
                              type="text"
                              value={link}
                              onChange={(e) => {
                                const newLinks = [...(editData.photosLinks || selectedWorkshop.photosLinks)];
                                newLinks[index] = e.target.value;
                                setEditData({...editData, photosLinks: newLinks});
                              }}
                              className="flex-1 p-2 border border-gray-300 rounded-md mr-2"
                              placeholder="Photo link"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const newLinks = [...(editData.photosLinks || selectedWorkshop.photosLinks)];
                                newLinks.splice(index, 1);
                                setEditData({...editData, photosLinks: newLinks});
                              }}
                              className="p-1 text-red-500 hover:bg-red-50 rounded"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => {
                            const currentLinks = editData.photosLinks || selectedWorkshop.photosLinks || [];
                            setEditData({...editData, photosLinks: [...currentLinks, '']});
                          }}
                          className="mt-1 flex items-center text-sm text-gray-700 hover:text-black"
                        >
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                          Add Photo Link
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Schedule & Participants */}
                  <div className="bg-gray-50 p-5 rounded-lg">
                    <h4 className="font-medium text-lg mb-4">Schedule & Participants</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Schedule Links</label>
                        {(editData.scheduleLinks || selectedWorkshop.scheduleLinks || []).map((link, index) => (
                          <div key={`schedule-${index}`} className="flex items-center mb-2">
                            <input
                              type="text"
                              value={link}
                              onChange={(e) => {
                                const newLinks = [...(editData.scheduleLinks || selectedWorkshop.scheduleLinks)];
                                newLinks[index] = e.target.value;
                                setEditData({...editData, scheduleLinks: newLinks});
                              }}
                              className="flex-1 p-2 border border-gray-300 rounded-md mr-2"
                              placeholder="Schedule link"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const newLinks = [...(editData.scheduleLinks || selectedWorkshop.scheduleLinks)];
                                newLinks.splice(index, 1);
                                setEditData({...editData, scheduleLinks: newLinks});
                              }}
                              className="p-1 text-red-500 hover:bg-red-50 rounded"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => {
                            const currentLinks = editData.scheduleLinks || selectedWorkshop.scheduleLinks || [];
                            setEditData({...editData, scheduleLinks: [...currentLinks, '']});
                          }}
                          className="mt-1 flex items-center text-sm text-gray-700 hover:text-black"
                        >
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                          Add Schedule Link
                        </button>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Participant Information</label>
                        {(editData.participantInfo || selectedWorkshop.participantInfo || []).map((info, index) => (
                          <div key={`participant-${index}`} className="flex items-center mb-2">
                            <input
                              type="text"
                              value={info}
                              onChange={(e) => {
                                const newInfo = [...(editData.participantInfo || selectedWorkshop.participantInfo)];
                                newInfo[index] = e.target.value;
                                setEditData({...editData, participantInfo: newInfo});
                              }}
                              className="flex-1 p-2 border border-gray-300 rounded-md mr-2"
                              placeholder="e.g. Total:150 or CSE:50"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const newInfo = [...(editData.participantInfo || selectedWorkshop.participantInfo)];
                                newInfo.splice(index, 1);
                                setEditData({...editData, participantInfo: newInfo});
                              }}
                              className="p-1 text-red-500 hover:bg-red-50 rounded"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => {
                            const currentInfo = editData.participantInfo || selectedWorkshop.participantInfo || [];
                            setEditData({...editData, participantInfo: [...currentInfo, '']});
                          }}
                          className="mt-1 flex items-center text-sm text-gray-700 hover:text-black"
                        >
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                          Add Participant Information
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Additional Information */}
                  <div className="bg-gray-50 p-5 rounded-lg">
                    <h4 className="font-medium text-lg mb-4">Additional Information</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Permission Letters</label>
                        {(editData.permissionLetterLinks || selectedWorkshop.permissionLetterLinks || []).map((link, index) => (
                          <div key={`permission-${index}`} className="flex items-center mb-2">
                            <input
                              type="text"
                              value={link}
                              onChange={(e) => {
                                const newLinks = [...(editData.permissionLetterLinks || selectedWorkshop.permissionLetterLinks)];
                                newLinks[index] = e.target.value;
                                setEditData({...editData, permissionLetterLinks: newLinks});
                              }}
                              className="flex-1 p-2 border border-gray-300 rounded-md mr-2"
                              placeholder="Permission letter link"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const newLinks = [...(editData.permissionLetterLinks || selectedWorkshop.permissionLetterLinks)];
                                newLinks.splice(index, 1);
                                setEditData({...editData, permissionLetterLinks: newLinks});
                              }}
                              className="p-1 text-red-500 hover:bg-red-50 rounded"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => {
                            const currentLinks = editData.permissionLetterLinks || selectedWorkshop.permissionLetterLinks || [];
                            setEditData({...editData, permissionLetterLinks: [...currentLinks, '']});
                          }}
                          className="mt-1 flex items-center text-sm text-gray-700 hover:text-black"
                        >
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                          Add Permission Letter Link
                        </button>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Users with Edit Access</label>
                        <div className="mb-2 p-2 bg-gray-100 rounded-md text-sm">
                          <div className="flex items-center space-x-2">
                            <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                            </svg>
                            <span>Creator ({selectedWorkshop.editAccessUsers?.[0] || 'unknown'}) has permanent access</span>
                          </div>
                        </div>
                        
                        {(editData.editAccessUsers || selectedWorkshop.editAccessUsers || [])
                          .filter((user, idx) => idx > 0) // Skip the first user (creator)
                          .map((user, index) => {
                            // We adjust the index to account for the filtered first user
                            const actualIndex = index + 1;
                            return (
                              <div key={`editor-${index}`} className="flex items-center mb-2">
                                <input
                                  type="text"
                                  value={user}
                                  onChange={(e) => {
                                    const newUsers = [...(editData.editAccessUsers || selectedWorkshop.editAccessUsers)];
                                    newUsers[actualIndex] = e.target.value;
                                    setEditData({...editData, editAccessUsers: newUsers});
                                  }}
                                  className="flex-1 p-2 border border-gray-300 rounded-md mr-2"
                                  placeholder="Username"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newUsers = [...(editData.editAccessUsers || selectedWorkshop.editAccessUsers)];
                                    newUsers.splice(actualIndex, 1);
                                    setEditData({...editData, editAccessUsers: newUsers});
                                  }}
                                  className="p-1 text-red-500 hover:bg-red-50 rounded"
                                >
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              </div>
                            );
                          })}
                        <button
                          type="button"
                          onClick={() => {
                            const currentUsers = editData.editAccessUsers || selectedWorkshop.editAccessUsers || [];
                            setEditData({...editData, editAccessUsers: [...currentUsers, '']});
                          }}
                          className="mt-1 flex items-center text-sm text-gray-700 hover:text-black"
                        >
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                          Add User with Edit Access
                        </button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Registration Link</label>
                        <input
                          type="text"
                          value={editData.registrationLink || selectedWorkshop.registrationLink || ''}
                          onChange={(e) => setEditData({...editData, registrationLink: e.target.value})}
                          className="w-full p-2 border border-gray-300 rounded-md"
                          placeholder="https://forms.example.com/register"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Feedback Link</label>
                        <input
                          type="text"
                          value={editData.feedbackLink || selectedWorkshop.feedbackLink || ''}
                          onChange={(e) => setEditData({...editData, feedbackLink: e.target.value})}
                          className="w-full p-2 border border-gray-300 rounded-md"
                          placeholder="https://forms.example.com/feedback"
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex justify-end space-x-4 pt-4">
                    <button
                      onClick={() => {
                        setIsEditing(false);
                        setEditData({});
                      }}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleEditSubmit}
                      className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800"
                    >
                      Save Changes
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {/* Tabs Navigation */}
                <div className="border-b border-gray-200">
                  <nav className="flex px-6">
                    <button 
                      className={`py-3 px-4 border-b-2 font-medium text-sm ${activeTab === 'overview' ? 'border-black text-black' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                      onClick={() => setActiveTab('overview')}
                    >
                      Overview
                    </button>
                    <button
                      className={`py-3 px-4 border-b-2 font-medium text-sm ${activeTab === 'resources' ? 'border-black text-black' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                      onClick={() => setActiveTab('resources')}
                    >
                      Resources
                    </button>
                    <button
                      className={`py-3 px-4 border-b-2 font-medium text-sm ${activeTab === 'people' ? 'border-black text-black' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                      onClick={() => setActiveTab('people')}
                    >
                      People
                    </button>
                    <button
                      className={`py-3 px-4 border-b-2 font-medium text-sm ${activeTab === 'details' ? 'border-black text-black' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                      onClick={() => setActiveTab('details')}
                    >
                      Details
                    </button>
                  </nav>
                </div>
                
                {/* Modal Content - Overview Tab */}
                <div className="overflow-y-auto flex-grow">
                  {activeTab === 'overview' && (
                    <div className="p-6">
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-1">
                          <img 
                            src={selectedWorkshop.thumbnail || "https://via.placeholder.com/400x300?text=Workshop"} 
                            alt={selectedWorkshop.eventTitle}
                            className="w-full h-auto rounded-lg shadow-md"
                          />
                          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                            <h3 className="text-lg font-semibold mb-2">Workshop Details</h3>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="font-medium">Start Date:</span>
                                <span>{formatDate(selectedWorkshop.eventStDate)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="font-medium">End Date:</span>
                                <span>{formatDate(selectedWorkshop.eventEndDate)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="font-medium">Time:</span>
                                <span>{selectedWorkshop.eventStTime}</span>
                              </div>
                              <div className="pt-2">
                                <span className="font-medium block mb-1">Categories:</span>
                                <div className="flex flex-wrap gap-2">
                                  {selectedWorkshop.category?.map((cat, index) => (
                                    <span 
                                      key={index} 
                                      className="px-3 py-1 bg-gray-200 text-gray-800 text-xs font-medium rounded-full"
                                    >
                                      {cat}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="lg:col-span-2 space-y-6">
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <h3 className="text-lg font-semibold mb-3">Participation</h3>
                            <ul className="space-y-2">
                              {selectedWorkshop.participantInfo?.map((info, index) => (
                                <li key={index} className="flex items-center">
                                  <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                  </svg>
                                  {info}
                                </li>
                              ))}
                            </ul>
                          </div>
                          
                          <div>
                            <h3 className="text-lg font-semibold mb-3">Quick Resources</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <a 
                                href={selectedWorkshop.registrationLink} 
                                target="_blank"
                                rel="noopener noreferrer" 
                                className="flex items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100"
                              >
                                <svg className="w-6 h-6 mr-3 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                                </svg>
                                <div>
                                  <span className="block font-medium">Registration</span>
                                  <span className="text-sm text-gray-600">Register for this workshop</span>
                                </div>
                              </a>
                              
                              <a 
                                href={selectedWorkshop.feedbackLink}
                                target="_blank"
                                rel="noopener noreferrer"  
                                className="flex items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100"
                              >
                                <svg className="w-6 h-6 mr-3 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                                </svg>
                                <div>
                                  <span className="block font-medium">Feedback</span>
                                  <span className="text-sm text-gray-600">Provide workshop feedback</span>
                                </div>
                              </a>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Resources Tab */}
                  {activeTab === 'resources' && (
                    <div className="p-6 space-y-6">
                      <div className="bg-gray-50 p-5 rounded-lg">
                        <h3 className="text-lg font-semibold mb-4">Workshop Materials</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Posters */}
                          {selectedWorkshop.eventPosterLinks?.length > 0 && (
                            <div>
                              <h4 className="font-medium text-gray-700 mb-2 flex items-center">
                                <svg className="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                Posters
                              </h4>
                              <div className="space-y-2">
                                {selectedWorkshop.eventPosterLinks.map((link, index) => (
                                  <a 
                                    key={index}
                                    href={link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center p-2 bg-white border border-gray-200 rounded hover:bg-gray-50"
                                  >
                                    <svg className="w-5 h-5 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                    Poster {index + 1}
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {/* Brochures */}
                          {selectedWorkshop.brochureLinks?.length > 0 && (
                            <div>
                              <h4 className="font-medium text-gray-700 mb-2 flex items-center">
                                <svg className="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                </svg>
                                Brochures
                              </h4>
                              <div className="space-y-2">
                                {selectedWorkshop.brochureLinks.map((link, index) => (
                                  <a 
                                    key={index}
                                    href={link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center p-2 bg-white border border-gray-200 rounded hover:bg-gray-50"
                                  >
                                    <svg className="w-5 h-5 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                                    </svg>
                                    Brochure {index + 1}
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {/* Schedules */}
                          {selectedWorkshop.scheduleLinks?.length > 0 && (
                            <div>
                              <h4 className="font-medium text-gray-700 mb-2 flex items-center">
                                <svg className="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                Schedules
                              </h4>
                              <div className="space-y-2">
                                {selectedWorkshop.scheduleLinks.map((link, index) => (
                                  <a 
                                    key={index}
                                    href={link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center p-2 bg-white border border-gray-200 rounded hover:bg-gray-50"
                                  >
                                    <svg className="w-5 h-5 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    Schedule {index + 1}
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {/* Permission Letters */}
                          {selectedWorkshop.permissionLetterLinks?.length > 0 && (
                            <div>
                              <h4 className="font-medium text-gray-700 mb-2 flex items-center">
                                <svg className="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                Permission Letters
                              </h4>
                              <div className="space-y-2">
                                {selectedWorkshop.permissionLetterLinks.map((link, index) => (
                                  <a 
                                    key={index}
                                    href={link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center p-2 bg-white border border-gray-200 rounded hover:bg-gray-50"
                                  >
                                    <svg className="w-5 h-5 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    Permission Letter {index + 1}
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Photos Gallery */}
                      {selectedWorkshop.photosLinks?.length > 0 && (
                        <div className="bg-gray-50 p-5 rounded-lg">
                          <h4 className="font-medium text-gray-700 mb-2 flex items-center">
                            <svg className="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            Workshop Photos
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {selectedWorkshop.photosLinks.map((link, index) => (
                              <a 
                                key={index}
                                href={link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center px-5 py-3 bg-white border border-gray-200 rounded hover:bg-gray-50 text-sm"
                              >
                                <svg className="w-4 h-4 mr-1.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                Photo Link {index + 1}
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* People Tab */}
                  {activeTab === 'people' && (
                    <div className="p-6 space-y-6">
                      {/* Resource Persons */}
                      {selectedWorkshop.resourcePersonDetails?.length > 0 && (
                        <div>
                          <h3 className="text-lg font-semibold mb-4">Resource Persons</h3>
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                            {selectedWorkshop.resourcePersonDetails.map((person, index) => (
                              <div key={index} className="bg-gray-50 p-4 rounded-lg">
                                <div className="flex items-center space-x-3">
                                  <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                                    <span className="text-gray-600 font-medium text-lg">
                                      {person.name.charAt(0).toUpperCase()}
                                    </span>
                                  </div>
                                  <div>
                                    <h4 className="font-medium">{person.name}</h4>
                                    <p className="text-sm text-gray-500">{person.designation}</p>
                                  </div>
                                </div>
                                {person.department && (
                                  <div className="mt-2 pl-13">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                      {person.department}
                                    </span>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Organizers */}
                      {selectedWorkshop.eventOrganiserDetails?.length > 0 && (
                        <div>
                          <h3 className="text-lg font-semibold mb-4">Workshop Organizers</h3>
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                            {selectedWorkshop.eventOrganiserDetails.map((organizer, index) => (
                              <div key={index} className="bg-gray-50 p-4 rounded-lg">
                                <div className="flex items-center space-x-3">
                                  <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                                    <span className="text-gray-600 font-medium text-lg">
                                      {organizer.name.charAt(0).toUpperCase()}
                                    </span>
                                  </div>
                                  <div>
                                    <h4 className="font-medium">{organizer.name}</h4>
                                    <p className="text-sm text-gray-500">{organizer.designation}</p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Users with Edit Access */}
                      {hasEditAccess(selectedWorkshop) && selectedWorkshop.editAccessUsers?.length > 0 && (
                        <div>
                          <h3 className="text-lg font-semibold mb-4">Users with Edit Access</h3>
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <ul className="space-y-2">
                              {selectedWorkshop.editAccessUsers.map((username, index) => (
                                <li key={index} className="flex items-center">
                                  <svg className="w-5 h-5 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                  </svg>
                                  {username} {username === currentUser?.username && "(You)"}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Details Tab */}
                  {activeTab === 'details' && (
                    <div className="p-6">
                      <div className="bg-gray-50 p-5 rounded-lg mb-6">
                        <h3 className="text-lg font-semibold mb-4">Workshop Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
                          <div>
                            <h4 className="font-medium text-sm text-gray-500">Title</h4>
                            <p>{selectedWorkshop.eventTitle}</p>
                          </div>
                          <div>
                            <h4 className="font-medium text-sm text-gray-500">Categories</h4>
                            <div className="flex flex-wrap gap-2 mt-1">
                              {selectedWorkshop.category?.map((cat, index) => (
                                <span key={index} className="px-2 py-1 bg-gray-200 text-xs rounded-full">
                                  {cat}
                                </span>
                              ))}
                            </div>
                          </div>
                          <div>
                            <h4 className="font-medium text-sm text-gray-500">Start Date</h4>
                            <p>{formatDate(selectedWorkshop.eventStDate)}</p>
                          </div>
                          <div>
                            <h4 className="font-medium text-sm text-gray-500">End Date</h4>
                            <p>{formatDate(selectedWorkshop.eventEndDate)}</p>
                          </div>
                          <div>
                            <h4 className="font-medium text-sm text-gray-500">Start Time</h4>
                            <p>{selectedWorkshop.eventStTime}</p>
                          </div>
                          <div>
                            <h4 className="font-medium text-sm text-gray-500">Registration Link</h4>
                            <a 
                              href={selectedWorkshop.registrationLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline"
                            >
                              {selectedWorkshop.registrationLink}
                            </a>
                          </div>
                          <div>
                            <h4 className="font-medium text-sm text-gray-500">Feedback Link</h4>
                            <a 
                              href={selectedWorkshop.feedbackLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline"
                            >
                              {selectedWorkshop.feedbackLink}
                            </a>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex justify-center">
                        <div className="flex space-x-4">
                          <a 
                            href={selectedWorkshop.registrationLink} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="px-6 py-2 bg-black text-white font-medium rounded-md hover:bg-gray-800 transition-colors"
                          >
                            Register Now
                          </a>
                          
                          <a 
                            href={selectedWorkshop.feedbackLink} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="px-6 py-2 border border-black text-black font-medium rounded-md hover:bg-gray-100 transition-colors"
                          >
                            Provide Feedback
                          </a>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Workshops;