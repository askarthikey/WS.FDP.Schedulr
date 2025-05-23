import { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import FileUploadField from './FileUploadField';
import { ensureStorageBucket } from '../utils/supabaseClient';
const BackendURL= import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';

function EventDetails() {
  const { eventTitle } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [workshop, setWorkshop] = useState(location.state?.workshop || null);
  const [loading, setLoading] = useState(!location.state?.workshop);
  const [error, setError] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  // New state variables for edit mode
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  // Get current user
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || 'null');
    setCurrentUser(user);
    
    // Initialize Supabase storage
    ensureStorageBucket();
  }, []);

  // Fetch workshop details if not passed through navigation state
  useEffect(() => {
    if (!workshop) {
      const fetchWorkshopDetails = async () => {
        try {
          setLoading(true);
          // Decode the URL parameter to get the original title
          const decodedTitle = decodeURIComponent(eventTitle);
          const token = localStorage.getItem('token') || sessionStorage.getItem('token');
          
          const response = await fetch(`${BackendURL}/workshopApi/workshop/${encodeURIComponent(decodedTitle)}`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          const data = await response.json();
          
          if (response.ok) {
            setWorkshop(data.Workshop);
          } else {
            setError(data.message || 'Failed to fetch workshop details');
          }
        } catch (err) {
          setError('Network error. Please try again later.');
          console.error(err);
        } finally {
          setLoading(false);
        }
      };
      
      fetchWorkshopDetails();
    }
  }, [eventTitle, workshop]);

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
      console.log("Error :",err)
      return dateString;
    }
  };

  // Check if current user has edit access
  const hasEditAccess = (workshop) => {
    if (!currentUser || !workshop) return false;
    return workshop.editAccessUsers?.includes(currentUser.username);
  };

  // Get workshop status
  const getWorkshopStatus = (workshop) => {
    if (!workshop?.eventStDate) return "Unknown";
    
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

  // Open edit modal
  const openEditModal = () => {
    setIsEditing(true);
    setEditData({});
    setShowModal(true);
  };

  // Close modal
  const closeModal = () => {
    setIsEditing(false);
    setShowModal(false);
    setEditData({});
    setDeleteConfirm(false);
  };

  // Handle edit submission
  const handleEditSubmit = async () => {
    if (!workshop) return;
    
    try {
      // Check if there are any changes
      if (Object.keys(editData).length === 0) {
        alert('No changes to save.');
        return;
      }
      
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      
      // Only send the modified data, not the entire merged object
      const response = await fetch(`${BackendURL}/workshopApi/editwks/${encodeURIComponent(workshop.eventTitle)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        // Send only the changed fields instead of the entire merged object
        body: JSON.stringify(editData)
      });

      const data = await response.json();
      
      if (response.ok) {
        // Update the workshop data locally with the new data
        setWorkshop(prev => ({ ...prev, ...editData }));
        setIsEditing(false);
        setShowModal(false);
        setEditData({});
        alert('Workshop updated successfully!');
      } else {
        console.error('Update error:', data);
        alert(data.message || 'Failed to update workshop');
      }
    } catch (err) {
      console.error('Network error:', err);
      alert('Network error. Please try again.');
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!workshop) return;
    
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      
      // Log the URL that's being requested
      console.log(`Deleting workshop: ${workshop.eventTitle}`);
      
      const response = await fetch(`${BackendURL}/workshopApi/delwks/${encodeURIComponent(workshop.eventTitle)}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      // Try to parse response as JSON, but handle non-JSON responses too
      let data;
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        try {
          data = await response.json();
        } catch (err) {
          console.error('Error parsing JSON response:', err);
        }
      } else {
        // For non-JSON responses like HTML error pages
        const textResponse = await response.text();
        console.log('Non-JSON response:', textResponse);
      }

      if (response.ok) {
        alert('Workshop deleted successfully!');
        navigate('/workshops');
      } else {
        console.error('Delete error:', data || response.statusText);
        alert(data?.message || `Failed to delete workshop (${response.status})`);
      }
    } catch (err) {
      console.error('Network error:', err);
      alert(`Network error: ${err.message}. Please try again.`);
    } finally {
      setDeleteConfirm(false);
    }
  };

  // Helper function to determine grid layout based on content
  const determineGridLayout = (workshop) => {
    // Count how many resource types are available
    const resourceCount = [
      workshop.eventPosterLinks?.length > 0 && workshop.eventPosterLinks[0],
      workshop.brochureLinks?.length > 0 && workshop.brochureLinks[0],
      workshop.scheduleLinks?.length > 0 && workshop.scheduleLinks[0],
      workshop.photosLinks?.length > 0 && workshop.photosLinks[0],
      workshop.permissionLetterLinks?.length > 0 && workshop.permissionLetterLinks[0],
      workshop.circularLinks?.length > 0 && workshop.circularLinks[0], // Add this line
      workshop.budgetDataLinks?.length > 0 && workshop.budgetDataLinks[0],
      workshop.participantsLinks?.length > 0 && workshop.participantsLinks[0],
      workshop.certificateLinks?.length > 0 && workshop.certificateLinks[0],
      workshop.resourcePersonDocLinks?.length > 0 && workshop.resourcePersonDocLinks[0],
      workshop.attendanceSheetLinks?.length > 0 && workshop.attendanceSheetLinks[0],
    ].filter(Boolean).length;
    
    // Dynamic grid layout based on content amount
    if (resourceCount <= 1) {
      return 'grid-cols-1'; // Single column for 1 resource type
    } else if (resourceCount === 2) {
      return 'grid-cols-1 md:grid-cols-2'; // 1 column mobile, 2 columns on md+
    } else if (resourceCount >= 3 && resourceCount <= 4) {
      return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-2'; // 1-2-2 columns
    } else {
      // Many resource types - adapt based on screen size
      return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'; // 1-2-3 columns
    }
  };

  // Add this function before handleEditSubmit
  const handleFileUploadComplete = (field, index, url) => {
    if (Array.isArray(editData[field])) {
      const newArray = [...(editData[field] || workshop[field] || [])];
      newArray[index] = url;
      setEditData({ ...editData, [field]: newArray });
    } else {
      setEditData({ ...editData, [field]: url });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-black"></div>
      </div>
    );
  }

  if (error || !workshop) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold text-red-600 mb-4">
          {error || "Workshop not found"}
        </h2>
        <p className="text-gray-600 mb-8">The workshop you're looking for couldn't be found or you may not have access to it.</p>
        <button 
          onClick={() => navigate('/workshops')}
          className="px-6 py-2 bg-black text-white rounded-md hover:bg-gray-800"
        >
          Back to Workshops
        </button>
      </div>
    );
  }

  const status = getWorkshopStatus(workshop);
  const statusClass = getStatusClass(status);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Workshop Header Section */}
      <div className="mb-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold mb-3">{workshop.eventTitle}</h1>
            <div className="flex items-center space-x-4 mb-4">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusClass}`}>
                {status}
              </span>
              <span className="text-gray-600">
                {formatDate(workshop.eventStDate)}
                {workshop.eventEndDate && workshop.eventStDate !== workshop.eventEndDate && 
                  ` - ${formatDate(workshop.eventEndDate)}`
                }
              </span>
              {workshop.eventStTime && (
                <span className="text-gray-600">at {workshop.eventStTime}</span>
              )}
            </div>
            
            {workshop.category && workshop.category.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {workshop.category.map((cat, idx) => (
                  <span 
                    key={idx}
                    className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full"
                  >
                    {cat}
                  </span>
                ))}
              </div>
            )}
          </div>
          
          <div className="flex space-x-3">
            {hasEditAccess(workshop) && (
              <>
                <button
                  onClick={openEditModal}
                  className="flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-md"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit
                </button>
                <button
                  onClick={() => setDeleteConfirm(true)}
                  className="flex items-center px-4 py-2 bg-red-100 hover:bg-red-200 text-red-800 rounded-md"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Delete
                </button>
              </>
            )}
            <button
              onClick={() => navigate('/workshops')}
              className="flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-md"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Workshops
            </button>
          </div>
        </div>
      </div>
      
      {/* Workshop Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Image and Basic Info */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
            <img 
              src={workshop.thumbnail || "https://via.placeholder.com/800x450?text=Workshop"} 
              alt={workshop.eventTitle}
              className="w-full h-auto object-cover aspect-video"
            />
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md mb-6">
            <h2 className="text-xl font-bold mb-4">Workshop Details</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="font-medium">Start Date:</span>
                <span>{formatDate(workshop.eventStDate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">End Date:</span>
                <span>{formatDate(workshop.eventEndDate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Time:</span>
                <span>{workshop.eventStTime}</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md mb-6">
            <h2 className="text-xl font-bold mb-4">Categories</h2>
            <div className="flex flex-wrap gap-2">
              {workshop.category?.map((cat, index) => (
                <span 
                  key={index} 
                  className="px-3 py-1.5 bg-gray-100 text-gray-800 rounded-full"
                >
                  {cat}
                </span>
              ))}
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-bold mb-4">Participation</h2>
            <ul className="space-y-2">
              {workshop.participantInfo?.map((info, index) => (
                <li key={index} className="flex items-center text-gray-700">
                  <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  {info}
                </li>
              ))}
            </ul>
          </div>
        </div>
        
        {/* Right Column - Resources, People, etc. */}
        <div className="lg:col-span-2">
          {/* Action Buttons */}
          <div className="bg-white p-6 rounded-lg shadow-md mb-6">
            <div className="flex flex-col sm:flex-row sm:justify-center gap-4">
              {/* <a 
                href={workshop.registrationLink} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex-1 bg-black text-white text-center py-3 rounded-md hover:bg-gray-800 transition-colors font-medium flex items-center justify-center"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
                Register Now
              </a> */}
              
              <a 
                href={workshop.feedbackLink} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex-1 border border-black text-black text-center py-3 rounded-md hover:bg-gray-100 transition-colors font-medium flex items-center justify-center"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
                Provide Feedback
              </a>
            </div>
          </div>
          
          {/* People Section */}
          <div className="bg-white p-6 rounded-lg shadow-md mb-6">
            <h2 className="text-xl font-bold mb-6">People</h2>
            
            {/* Resource Persons */}
            {workshop.resourcePersonDetails?.length > 0 && (
              <div className="mb-8">
                <h3 className="text-lg font-semibold mb-4">Resource Persons</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {workshop.resourcePersonDetails.map((person, index) => (
                    <div key={index} className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0 h-12 w-12 rounded-full bg-gray-300 flex items-center justify-center">
                          <span className="text-gray-600 font-medium text-lg">
                            {person.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <h4 className="font-medium text-lg">{person.name}</h4>
                          <p className="text-gray-600">{person.designation}</p>
                          {person.department && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 mt-1">
                              {person.department}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Organizers */}
            {workshop.eventOrganiserDetails?.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Workshop Organizers</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {workshop.eventOrganiserDetails.map((organizer, index) => (
                    <div key={index} className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0 h-12 w-12 rounded-full bg-gray-300 flex items-center justify-center">
                          <span className="text-gray-600 font-medium text-lg">
                            {organizer.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <h4 className="font-medium text-lg">{organizer.name}</h4>
                          <p className="text-gray-600">{organizer.designation}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          {/* Resources Section */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-bold mb-6">Resources</h2>
            
            {/* Dynamic grid that adjusts based on content */}
            <div className={`grid gap-6 ${determineGridLayout(workshop)}`}>
              {/* Posters */}
              {workshop.eventPosterLinks?.length > 0 && workshop.eventPosterLinks[0] && (
                <div className="resource-card">
                  <h3 className="font-medium text-lg mb-3 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Posters
                  </h3>
                  <div className="space-y-2">
                    {workshop.eventPosterLinks.map((link, index) => (
                      link && <a 
                        key={index}
                        href={link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center p-3 bg-gray-50 border border-gray-200 rounded-md hover:bg-gray-100"
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
              {workshop.brochureLinks?.length > 0 && (
                <div className="resource-card">
                  <h3 className="font-medium text-lg mb-3 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    Brochures
                  </h3>
                  <div className="space-y-2">
                    {workshop.brochureLinks.map((link, index) => (
                      <a 
                        key={index}
                        href={link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center p-3 bg-gray-50 border border-gray-200 rounded-md hover:bg-gray-100"
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
              
              {/* Circulars */}
              {workshop.circularLinks?.length > 0 && workshop.circularLinks[0] && (
                <div className="resource-card">
                  <h3 className="font-medium text-lg mb-3 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                    </svg>
                    Circulars
                  </h3>
                  <div className="space-y-2">
                    {workshop.circularLinks.map((link, index) => (
                      <a 
                        key={index}
                        href={link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center p-3 bg-gray-50 border border-gray-200 rounded-md hover:bg-gray-100"
                      >
                        <svg className="w-5 h-5 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Circular {index + 1}
                      </a>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Schedules */}
              {workshop.scheduleLinks?.length > 0 && (
                <div className="resource-card">
                  <h3 className="font-medium text-lg mb-3 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 01-2 2z" />
                    </svg>
                    Schedules
                  </h3>
                  <div className="space-y-2">
                    {workshop.scheduleLinks.map((link, index) => (
                      <a 
                        key={index}
                        href={link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center p-3 bg-gray-50 border border-gray-200 rounded-md hover:bg-gray-100"
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
              
              {/* Photos */}
              {workshop.photosLinks?.length > 0 && (
                <div className="resource-card">
                  <h3 className="font-medium text-lg mb-3 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Workshop Photos
                  </h3>
                  <div className="space-y-2">
                    {workshop.photosLinks.map((link, index) => (
                      <a 
                        key={index}
                        href={link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center p-3 bg-gray-50 border border-gray-200 rounded-md hover:bg-gray-100"
                      >
                        <svg className="w-5 h-5 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        Photo {index + 1}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Permission Letters */}
              {workshop.permissionLetterLinks?.length > 0 && (
                <div className="resource-card">
                  <h3 className="font-medium text-lg mb-3 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Permission Letters
                  </h3>
                  <div className="space-y-2">
                    {workshop.permissionLetterLinks.map((link, index) => (
                      <a 
                        key={index}
                        href={link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center p-3 bg-gray-50 border border-gray-200 rounded-md hover:bg-gray-100"
                      >
                        <svg className="w-5 h-5 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                        </svg>
                        Permission Letter {index + 1}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Budget Data */}
              {workshop.budgetDataLinks?.length > 0 && workshop.budgetDataLinks[0] && (
                <div className="resource-card">
                  <h3 className="font-medium text-lg mb-3 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2z" />
                    </svg>
                    Budget Documents
                  </h3>
                  <div className="space-y-2">
                    {workshop.budgetDataLinks.map((link, index) => (
                      link && <a 
                        key={index}
                        href={link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center p-3 bg-gray-50 border border-gray-200 rounded-md hover:bg-gray-100"
                      >
                        <svg className="w-5 h-5 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Budget Document {index + 1}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Participants Lists */}
              {workshop.participantsLinks?.length > 0 && workshop.participantsLinks[0] && (
                <div className="resource-card">
                  <h3 className="font-medium text-lg mb-3 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    Participants Lists
                  </h3>
                  <div className="space-y-2">
                    {workshop.participantsLinks.map((link, index) => (
                      link && <a 
                        key={index}
                        href={link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center p-3 bg-gray-50 border border-gray-200 rounded-md hover:bg-gray-100"
                      >
                        <svg className="w-5 h-5 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Participants List {index + 1}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Certificate Templates */}
              {workshop.certificateLinks?.length > 0 && workshop.certificateLinks[0] && (
                <div className="resource-card">
                  <h3 className="font-medium text-lg mb-3 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                    </svg>
                    Certificate Templates
                  </h3>
                  <div className="space-y-2">
                    {workshop.certificateLinks.map((link, index) => (
                      <a 
                        key={index}
                        href={link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center p-3 bg-gray-50 border border-gray-200 rounded-md hover:bg-gray-100"
                      >
                        <svg className="w-5 h-5 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        Certificate Template {index + 1}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Resource Person Documents */}
              {workshop.resourcePersonDocLinks?.length > 0 && workshop.resourcePersonDocLinks[0] && (
                <div className="resource-card">
                  <h3 className="font-medium text-lg mb-3 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Resource Person Documents
                  </h3>
                  <div className="space-y-2">
                    {workshop.resourcePersonDocLinks.map((link, index) => (
                      <a 
                        key={index}
                        href={link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center p-3 bg-gray-50 border border-gray-200 rounded-md hover:bg-gray-100"
                      >
                        <svg className="w-5 h-5 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Resource Person Document {index + 1}
                      </a>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Attendance Sheets */}
              {workshop.attendanceSheetLinks?.length > 0 && workshop.attendanceSheetLinks[0] && (
                <div className="resource-card">
                  <h3 className="font-medium text-lg mb-3 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                    </svg>
                    Attendance Sheets
                  </h3>
                  <div className="space-y-2">
                    {workshop.attendanceSheetLinks.map((link, index) => (
                      <a 
                        key={index}
                        href={link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center p-3 bg-gray-50 border border-gray-200 rounded-md hover:bg-gray-100"
                      >
                        <svg className="w-5 h-5 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Attendance Sheet {index + 1}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {showModal && isEditing && (
        <div className="fixed inset-0 z-50 overflow-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-2xl font-bold">Edit Workshop</h2>
              <button 
                onClick={closeModal}
                className="text-gray-500 hover:text-black p-2 rounded-md hover:bg-gray-100"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Modal Body */}
            <div className="overflow-y-auto flex-grow p-6">
              <div className="space-y-6">
                {/* Basic Information */}
                <div className="bg-gray-50 p-5 rounded-lg">
                  <h4 className="font-medium text-lg mb-4">Basic Information</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Title (Read Only)</label>
                      <input
                        type="text"
                        value={workshop.eventTitle}
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
                          value={editData.eventStDate || workshop.eventStDate}
                          onChange={(e) => setEditData({...editData, eventStDate: e.target.value})}
                          className="w-full p-2 border border-gray-300 rounded-md"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                        <input
                          type="date"
                          value={editData.eventEndDate || workshop.eventEndDate}
                          onChange={(e) => setEditData({...editData, eventEndDate: e.target.value})}
                          className="w-full p-2 border border-gray-300 rounded-md"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                        <input
                          type="text"
                          placeholder="e.g. 10:00 AM"
                          value={editData.eventStTime || workshop.eventStTime}
                          onChange={(e) => setEditData({...editData, eventStTime: e.target.value})}
                          className="w-full p-2 border border-gray-300 rounded-md"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Thumbnail Image</label>
                      <div className="p-3 border border-gray-100 rounded-md">
                        <div className="flex items-center space-x-2 mb-2">
                          <input
                            type="text"
                            value={editData.thumbnail || workshop.thumbnail || ''}
                            onChange={(e) => setEditData({...editData, thumbnail: e.target.value})}
                            className="flex-1 p-2 border border-gray-300 rounded-md"
                            placeholder="Thumbnail URL"
                          />
                        </div>
                        
                        <div className="mt-2">
                          <div className="text-sm text-gray-500 mb-1">OR</div>
                          <FileUploadField 
                            onUploadComplete={(url) => handleFileUploadComplete('thumbnail', null, url)} 
                            fieldName="thumbnails"
                          />
                        </div>
                        
                        {(editData.thumbnail || workshop.thumbnail) && (editData.thumbnail || workshop.thumbnail).startsWith('http') && (
                          <div className="mt-4">
                            <div className="text-sm font-medium text-gray-700 mb-2">Current Thumbnail:</div>
                            <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-3 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                              <div className="w-full h-48 bg-white rounded overflow-hidden mb-3 shadow-inner relative">
                                <img 
                                  src={editData.thumbnail || workshop.thumbnail} 
                                  alt="Thumbnail preview" 
                                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                                />
                                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent p-3 opacity-0 hover:opacity-100 transition-opacity">
                                  <span className="text-white text-sm font-medium truncate block">{(editData.thumbnail || workshop.thumbnail).split('/').pop()}</span>
                                </div>
                              </div>
                              <a href={editData.thumbnail || workshop.thumbnail} 
                                 target="_blank" 
                                 rel="noopener noreferrer" 
                                 className="text-sm text-blue-600 hover:text-blue-800 truncate hover:underline flex items-center justify-center py-1.5 px-3 bg-white rounded-full shadow-sm border border-gray-100 hover:shadow transition-all">
                                <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                                View full image
                              </a>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Categories</label>
                      {(editData.category || workshop.category || []).map((category, index) => (
                        <div key={`category-${index}`} className="flex items-center mb-2">
                          <input
                            type="text"
                            value={category}
                            onChange={(e) => {
                              const newCategories = [...(editData.category || workshop.category)];
                              newCategories[index] = e.target.value;
                              setEditData({...editData, category: newCategories});
                            }}
                            className="flex-1 p-2 border border-gray-300 rounded-md mr-2"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const newCategories = [...(editData.category || workshop.category)];
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
                          const currentCategories = editData.category || workshop.category || [];
                          setEditData({...editData, category: [...currentCategories, '']});
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
                    {(editData.eventOrganiserDetails || workshop.eventOrganiserDetails || []).map((organizer, index) => (
                      <div key={`organizer-${index}`} className="p-4 border border-gray-200 rounded-md bg-white">
                        <div className="flex justify-between items-center mb-2">
                          <h5 className="font-medium">Organizer {index + 1}</h5>
                          <button
                            type="button"
                            onClick={() => {
                              const newOrganizers = [...(editData.eventOrganiserDetails || workshop.eventOrganiserDetails)];
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
                                const newOrganizers = [...(editData.eventOrganiserDetails || workshop.eventOrganiserDetails)];
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
                                const newOrganizers = [...(editData.eventOrganiserDetails || workshop.eventOrganiserDetails)];
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
                        const currentOrganizers = editData.eventOrganiserDetails || workshop.eventOrganiserDetails || [];
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
                    {(editData.resourcePersonDetails || workshop.resourcePersonDetails || []).map((person, index) => (
                      <div key={`resource-${index}`} className="p-4 border border-gray-200 rounded-md bg-white">
                        <div className="flex justify-between items-center mb-2">
                          <h5 className="font-medium">Resource Person {index + 1}</h5>
                          <button
                            type="button"
                            onClick={() => {
                              const newPersons = [...(editData.resourcePersonDetails || workshop.resourcePersonDetails)];
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
                                const newPersons = [...(editData.resourcePersonDetails || workshop.resourcePersonDetails)];
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
                                const newPersons = [...(editData.resourcePersonDetails || workshop.resourcePersonDetails)];
                                newPersons[index] = {...newPersons[index], designation: e.target.value};
                                setEditData({...editData, resourcePersonDetails: newPersons});
                              }}
                              className="w-full p-2 border border-gray-300 rounded-md"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Organisation</label>
                            <input
                              type="text"
                              value={person.department || ''}
                              onChange={(e) => {
                                const newPersons = [...(editData.resourcePersonDetails || workshop.resourcePersonDetails)];
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
                        const currentPersons = editData.resourcePersonDetails || workshop.resourcePersonDetails || [];
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
                  
                  <div className="grid grid-cols-1 gap-4">
                    {/* Event Posters */}
                    <div className="bg-white p-4 rounded-md">
                      <h5 className="font-medium mb-3">Event Posters</h5>
                      <div className="space-y-4">
                        {(editData.eventPosterLinks || workshop.eventPosterLinks || []).map((link, index) => (
                          <div key={`poster-${index}`} className="p-3 border border-gray-100 rounded-md">
                            <div className="flex items-center space-x-2 mb-2">
                              <input
                                type="text"
                                value={link}
                                onChange={(e) => {
                                  const newLinks = [...(editData.eventPosterLinks || workshop.eventPosterLinks)];
                                  newLinks[index] = e.target.value;
                                  setEditData({...editData, eventPosterLinks: newLinks});
                                }}
                                className="flex-1 p-2 border border-gray-300 rounded-md"
                                placeholder="Poster link"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const newLinks = [...(editData.eventPosterLinks || workshop.eventPosterLinks)];
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
                            
                            <div className="mt-2">
                              <div className="text-sm text-gray-500 mb-1">OR</div>
                              <FileUploadField 
                                onUploadComplete={(url) => handleFileUploadComplete('eventPosterLinks', index, url)} 
                                fieldName="posters"
                              />
                            </div>
                            
                            {link && link.startsWith('http') && (
                              <div className="mt-2 bg-gray-50 p-2 rounded flex items-center">
                                <svg className="h-5 w-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                </svg>
                                <a href={link} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 truncate hover:underline">
                                  {link.split('/').pop() || 'View file'}
                                </a>
                              </div>
                            )}
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => {
                            const currentLinks = editData.eventPosterLinks || workshop.eventPosterLinks || [];
                            setEditData({...editData, eventPosterLinks: [...currentLinks, '']});
                          }}
                          className="flex items-center text-sm text-gray-700 hover:text-black"
                        >
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                          Add Poster
                        </button>
                      </div>
                    </div>
                    
                    {/* Brochures */}
                    <div className="bg-white p-4 rounded-md">
                      <h5 className="font-medium mb-3">Brochures</h5>
                      <div className="space-y-4">
                        {(editData.brochureLinks || workshop.brochureLinks || []).map((link, index) => (
                          <div key={`brochure-${index}`} className="p-3 border border-gray-100 rounded-md">
                            <div className="flex items-center space-x-2 mb-2">
                              <input
                                type="text"
                                value={link}
                                onChange={(e) => {
                                  const newLinks = [...(editData.brochureLinks || workshop.brochureLinks)];
                                  newLinks[index] = e.target.value;
                                  setEditData({...editData, brochureLinks: newLinks});
                                }}
                                className="flex-1 p-2 border border-gray-300 rounded-md"
                                placeholder="Brochure link"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const newLinks = [...(editData.brochureLinks || workshop.brochureLinks)];
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
                            
                            <div className="mt-2">
                              <div className="text-sm text-gray-500 mb-1">OR</div>
                              <FileUploadField 
                                onUploadComplete={(url) => handleFileUploadComplete('brochureLinks', index, url)} 
                                fieldName="brochures"
                              />
                            </div>
                            
                            {link && link.startsWith('http') && (
                              <div className="mt-2 bg-gray-50 p-2 rounded flex items-center">
                                <svg className="h-5 w-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                </svg>
                                <a href={link} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 truncate hover:underline">
                                  {link.split('/').pop() || 'View file'}
                                </a>
                              </div>
                            )}
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => {
                            const currentLinks = editData.brochureLinks || workshop.brochureLinks || [];
                            setEditData({...editData, brochureLinks: [...currentLinks, '']});
                          }}
                          className="flex items-center text-sm text-gray-700 hover:text-black"
                        >
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                          Add Brochure
                        </button>
                      </div>
                    </div>
                    
                    {/* Circulars */}
                    <div className="bg-white p-4 rounded-md">
                      <h5 className="font-medium mb-3">Circulars</h5>
                      <div className="space-y-4">
                        {(editData.circularLinks || workshop.circularLinks || []).map((link, index) => (
                          <div key={`circular-${index}`} className="p-3 border border-gray-100 rounded-md">
                            <div className="flex items-center space-x-2 mb-2">
                              <input
                                type="text"
                                value={link}
                                onChange={(e) => {
                                  const newLinks = [...(editData.circularLinks || workshop.circularLinks)];
                                  newLinks[index] = e.target.value;
                                  setEditData({...editData, circularLinks: newLinks});
                                }}
                                className="flex-1 p-2 border border-gray-300 rounded-md"
                                placeholder="Circular link"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const newLinks = [...(editData.circularLinks || workshop.circularLinks)];
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
                            
                            <div className="mt-2">
                              <div className="text-sm text-gray-500 mb-1">OR</div>
                              <FileUploadField 
                                onUploadComplete={(url) => handleFileUploadComplete('circularLinks', index, url)} 
                                fieldName="circulars"
                              />
                            </div>
                            
                            {link && link.startsWith('http') && (
                              <div className="mt-2 bg-gray-50 p-2 rounded flex items-center">
                                <svg className="h-5 w-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                </svg>
                                <a href={link} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 truncate hover:underline">
                                  {link.split('/').pop() || 'View file'}
                                </a>
                              </div>
                            )}
                          </div>
                        ))}
                       
                        <button
                          type="button"
                          onClick={() => {
                            const currentLinks = editData.circularLinks || workshop.circularLinks || [];
                            setEditData({...editData, circularLinks: [...currentLinks, '']});
                          }}
                          className="flex items-center text-sm text-gray-700 hover:text-black"
                        >
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                          Add Circular
                        </button>
                      </div>
                    </div>
                    
                    {/* Schedules */}
                    <div className="bg-white p-4 rounded-md">
                      <h5 className="font-medium mb-3">Schedules</h5>
                      <div className="space-y-4">
                        {(editData.scheduleLinks || workshop.scheduleLinks || []).map((link, index) => (
                          <div key={`schedule-${index}`} className="p-3 border border-gray-100 rounded-md">
                            <div className="flex items-center space-x-2 mb-2">
                              <input
                                type="text"
                                value={link}
                                onChange={(e) => {
                                  const newLinks = [...(editData.scheduleLinks || workshop.scheduleLinks)];
                                  newLinks[index] = e.target.value;
                                  setEditData({...editData, scheduleLinks: newLinks});
                                }}
                                className="flex-1 p-2 border border-gray-300 rounded-md"
                                placeholder="Schedule link"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const newLinks = [...(editData.scheduleLinks || workshop.scheduleLinks)];
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
                            
                            <div className="mt-2">
                              <div className="text-sm text-gray-500 mb-1">OR</div>
                              <FileUploadField 
                                onUploadComplete={(url) => handleFileUploadComplete('scheduleLinks', index, url)} 
                                fieldName="schedules"
                              />
                            </div>
                            
                            {link && link.startsWith('http') && (
                              <div className="mt-2 bg-gray-50 p-2 rounded flex items-center">
                                <svg className="h-5 w-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                </svg>
                                <a href={link} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 truncate hover:underline">
                                  {link.split('/').pop() || 'View file'}
                                </a>
                              </div>
                            )}
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => {
                            const currentLinks = editData.scheduleLinks || workshop.scheduleLinks || [];
                            setEditData({...editData, scheduleLinks: [...currentLinks, '']});
                          }}
                          className="flex items-center text-sm text-gray-700 hover:text-black"
                        >
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                          Add Schedule
                        </button>
                      </div>
                    </div>
                    
                    {/* Photos */}
                    <div className="bg-white p-4 rounded-md">
                      <h5 className="font-medium mb-3">Photos</h5>
                      <div className="space-y-4">
                        {(editData.photosLinks || workshop.photosLinks || []).map((link, index) => (
                          <div key={`photo-${index}`} className="p-3 border border-gray-100 rounded-md">
                            <div className="flex items-center space-x-2 mb-2">
                              <input
                                type="text"
                                value={link}
                                onChange={(e) => {
                                  const newLinks = [...(editData.photosLinks || workshop.photosLinks)];
                                  newLinks[index] = e.target.value;
                                  setEditData({...editData, photosLinks: newLinks});
                                }}
                                className="flex-1 p-2 border border-gray-300 rounded-md"
                                placeholder="Photo link"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const newLinks = [...(editData.photosLinks || workshop.photosLinks)];
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
                            
                            <div className="mt-2">
                              <div className="text-sm text-gray-500 mb-1">OR</div>
                              <FileUploadField 
                                onUploadComplete={(url) => handleFileUploadComplete('photosLinks', index, url)} 
                                fieldName="photos"
                              />
                            </div>
                            
                            {link && link.startsWith('http') && (
                              <div className="mt-2 bg-gray-50 p-2 rounded flex items-center">
                                <svg className="h-5 w-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                </svg>
                                <a href={link} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 truncate hover:underline">
                                  {link.split('/').pop() || 'View file'}
                                </a>
                              </div>
                            )}
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => {
                            const currentLinks = editData.photosLinks || workshop.photosLinks || [];
                            setEditData({...editData, photosLinks: [...currentLinks, '']});
                          }}
                          className="flex items-center text-sm text-gray-700 hover:text-black"
                        >
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                          Add Photo
                        </button>
                      </div>
                    </div>
                    
                    {/* Permission Letters */}
                    <div className="bg-white p-4 rounded-md">
                      <h5 className="font-medium mb-3">Permission Letters</h5>
                      <div className="space-y-4">
                        {(editData.permissionLetterLinks || workshop.permissionLetterLinks || []).map((link, index) => (
                          <div key={`permission-${index}`} className="p-3 border border-gray-100 rounded-md">
                            <div className="flex items-center space-x-2 mb-2">
                              <input
                                type="text"
                                value={link}
                                onChange={(e) => {
                                  const newLinks = [...(editData.permissionLetterLinks || workshop.permissionLetterLinks)];
                                  newLinks[index] = e.target.value;
                                  setEditData({...editData, permissionLetterLinks: newLinks});
                                }}
                                className="flex-1 p-2 border border-gray-300 rounded-md"
                                placeholder="Permission letter link"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const newLinks = [...(editData.permissionLetterLinks || workshop.permissionLetterLinks)];
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
                            
                            <div className="mt-2">
                              <div className="text-sm text-gray-500 mb-1">OR</div>
                              <FileUploadField 
                                onUploadComplete={(url) => handleFileUploadComplete('permissionLetterLinks', index, url)} 
                                fieldName="permission-letters"
                              />
                            </div>
                            
                            {link && link.startsWith('http') && (
                              <div className="mt-2 bg-gray-50 p-2 rounded flex items-center">
                                <svg className="h-5 w-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                </svg>
                                <a href={link} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 truncate hover:underline">
                                  {link.split('/').pop() || 'View file'}
                                </a>
                              </div>
                            )}
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => {
                            const currentLinks = editData.permissionLetterLinks || workshop.permissionLetterLinks || [];
                            setEditData({...editData, permissionLetterLinks: [...currentLinks, '']});
                          }}
                          className="flex items-center text-sm text-gray-700 hover:text-black"
                        >
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                          Add Permission Letter
                        </button>
                      </div>
                    </div>
                    
                    {/* Budget Data */}
                    <div className="bg-white p-4 rounded-md">
                      <h5 className="font-medium mb-3">Budget Data</h5>
                      <div className="space-y-4">
                        {(editData.budgetDataLinks || workshop.budgetDataLinks || []).map((link, index) => (
                          <div key={`budget-${index}`} className="p-3 border border-gray-100 rounded-md">
                            <div className="flex items-center space-x-2 mb-2">
                              <input
                                type="text"
                                value={link}
                                onChange={(e) => {
                                  const newLinks = [...(editData.budgetDataLinks || workshop.budgetDataLinks)];
                                  newLinks[index] = e.target.value;
                                  setEditData({...editData, budgetDataLinks: newLinks});
                                }}
                                className="flex-1 p-2 border border-gray-300 rounded-md"
                                placeholder="Budget data link"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const newLinks = [...(editData.budgetDataLinks || workshop.budgetDataLinks)];
                                  newLinks.splice(index, 1);
                                  setEditData({...editData, budgetDataLinks: newLinks});
                                }}
                                className="p-1 text-red-500 hover:bg-red-50 rounded"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                            
                            <div className="mt-2">
                              <div className="text-sm text-gray-500 mb-1">OR</div>
                              <FileUploadField 
                                onUploadComplete={(url) => handleFileUploadComplete('budgetDataLinks', index, url)} 
                                fieldName="budget-data"
                              />
                            </div>
                            
                            {link && link.startsWith('http') && (
                              <div className="mt-2 bg-gray-50 p-2 rounded flex items-center">
                                <svg className="h-5 w-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                </svg>
                                <a href={link} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 truncate hover:underline">
                                  {link.split('/').pop() || 'View file'}
                                </a>
                              </div>
                            )}
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => {
                            const currentLinks = editData.budgetDataLinks || workshop.budgetDataLinks || [];
                            setEditData({...editData, budgetDataLinks: [...currentLinks, '']});
                          }}
                          className="flex items-center text-sm text-gray-700 hover:text-black"
                        >
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                          Add Budget Data
                        </button>
                      </div>
                    </div>
                    
                    {/* Participants Lists */}
                    <div className="bg-white p-4 rounded-md">
                      <h5 className="font-medium mb-3">Participants Lists</h5>
                      <div className="space-y-4">
                        {(editData.participantsLinks || workshop.participantsLinks || []).map((link, index) => (
                          <div key={`participants-${index}`} className="p-3 border border-gray-100 rounded-md">
                            <div className="flex items-center space-x-2 mb-2">
                              <input
                                type="text"
                                value={link}
                                onChange={(e) => {
                                  const newLinks = [...(editData.participantsLinks || workshop.participantsLinks)];
                                  newLinks[index] = e.target.value;
                                  setEditData({...editData, participantsLinks: newLinks});
                                }}
                                className="flex-1 p-2 border border-gray-300 rounded-md"
                                placeholder="Participants list link"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const newLinks = [...(editData.participantsLinks || workshop.participantsLinks)];
                                  newLinks.splice(index, 1);
                                  setEditData({...editData, participantsLinks: newLinks});
                                }}
                                className="p-1 text-red-500 hover:bg-red-50 rounded"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                            
                            <div className="mt-2">
                              <div className="text-sm text-gray-500 mb-1">OR</div>
                              <FileUploadField 
                                onUploadComplete={(url) => handleFileUploadComplete('participantsLinks', index, url)} 
                                fieldName="participants-lists"
                              />
                            </div>
                            
                            {link && link.startsWith('http') && (
                              <div className="mt-2 bg-gray-50 p-2 rounded flex items-center">
                                <svg className="h-5 w-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                </svg>
                                <a href={link} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 truncate hover:underline">
                                  {link.split('/').pop() || 'View file'}
                                </a>
                              </div>
                            )}
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => {
                            const currentLinks = editData.participantsLinks || workshop.participantsLinks || [];
                            setEditData({...editData, participantsLinks: [...currentLinks, '']});
                          }}
                          className="flex items-center text-sm text-gray-700 hover:text-black"
                        >
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                          Add Participants List
                        </button>
                      </div>
                    </div>
                    
                    {/* Certificate Templates */}
                    <div className="bg-white p-4 rounded-md">
                      <h5 className="font-medium mb-3">Certificate Templates</h5>
                      <div className="space-y-4">
                        {(editData.certificateLinks || workshop.certificateLinks || []).map((link, index) => (
                          <div key={`certificate-${index}`} className="p-3 border border-gray-100 rounded-md">
                            <div className="flex items-center space-x-2 mb-2">
                              <input
                                type="text"
                                value={link}
                                onChange={(e) => {
                                  const newLinks = [...(editData.certificateLinks || workshop.certificateLinks)];
                                  newLinks[index] = e.target.value;
                                  setEditData({...editData, certificateLinks: newLinks});
                                }}
                                className="flex-1 p-2 border border-gray-300 rounded-md"
                                placeholder="Certificate template link"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const newLinks = [...(editData.certificateLinks || workshop.certificateLinks)];
                                  newLinks.splice(index, 1);
                                  setEditData({...editData, certificateLinks: newLinks});
                                }}
                                className="p-1 text-red-500 hover:bg-red-50 rounded"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                            
                            <div className="mt-2">
                              <div className="text-sm text-gray-500 mb-1">OR</div>
                              <FileUploadField 
                                onUploadComplete={(url) => handleFileUploadComplete('certificateLinks', index, url)} 
                                fieldName="certificates"
                              />
                            </div>
                            
                            {link && link.startsWith('http') && (
                              <div className="mt-2 bg-gray-50 p-2 rounded flex items-center">
                                <svg className="h-5 w-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                </svg>
                                <a href={link} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 truncate hover:underline">
                                  {link.split('/').pop() || 'View file'}
                                </a>
                              </div>
                            )}
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => {
                            const currentLinks = editData.certificateLinks || workshop.certificateLinks || [];
                            setEditData({...editData, certificateLinks: [...currentLinks, '']});
                          }}
                          className="flex items-center text-sm text-gray-700 hover:text-black"
                        >
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                          Add Certificate Template
                        </button>
                      </div>
                    </div>
                    
                    {/* Resource Person Documents */}
                    <div className="bg-white p-4 rounded-md">
                      <h5 className="font-medium mb-3">Resource Person Documents</h5>
                      <div className="space-y-4">
                        {(editData.resourcePersonDocLinks || workshop.resourcePersonDocLinks || []).map((link, index) => (
                          <div key={`resource-doc-${index}`} className="p-3 border border-gray-100 rounded-md">
                            <div className="flex items-center space-x-2 mb-2">
                              <input
                                type="text"
                                value={link}
                                onChange={(e) => {
                                  const newLinks = [...(editData.resourcePersonDocLinks || workshop.resourcePersonDocLinks)];
                                  newLinks[index] = e.target.value;
                                  setEditData({...editData, resourcePersonDocLinks: newLinks});
                                }}
                                className="flex-1 p-2 border border-gray-300 rounded-md"
                                placeholder="Resource person document link"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const newLinks = [...(editData.resourcePersonDocLinks || workshop.resourcePersonDocLinks)];
                                  newLinks.splice(index, 1);
                                  setEditData({...editData, resourcePersonDocLinks: newLinks});
                                }}
                                className="p-1 text-red-500 hover:bg-red-50 rounded"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                            
                            <div className="mt-2">
                              <div className="text-sm text-gray-500 mb-1">OR</div>
                              <FileUploadField 
                                onUploadComplete={(url) => handleFileUploadComplete('resourcePersonDocLinks', index, url)} 
                                fieldName="resource-person-docs"
                              />
                            </div>
                            
                            {link && link.startsWith('http') && (
                              <div className="mt-2 bg-gray-50 p-2 rounded flex items-center">
                                <svg className="h-5 w-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                </svg>
                                <a href={link} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 truncate hover:underline">
                                  {link.split('/').pop() || 'View file'}
                                </a>
                              </div>
                            )}
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => {
                            const currentLinks = editData.resourcePersonDocLinks || workshop.resourcePersonDocLinks || [];
                            setEditData({...editData, resourcePersonDocLinks: [...currentLinks, '']});
                          }}
                          className="flex items-center text-sm text-gray-700 hover:text-black"
                        >
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                          Add Resource Person Document
                        </button>
                      </div>
                    </div>
                    
                    {/* Attendance Sheets */}
                    <div className="bg-white p-4 rounded-md">
                      <h5 className="font-medium mb-3">Attendance Sheets</h5>
                      <div className="space-y-4">
                        {(editData.attendanceSheetLinks || workshop.attendanceSheetLinks || []).map((link, index) => (
                          <div key={`attendance-${index}`} className="p-3 border border-gray-100 rounded-md">
                            <div className="flex items-center space-x-2 mb-2">
                              <input
                                type="text"
                                value={link}
                                onChange={(e) => {
                                  const newLinks = [...(editData.attendanceSheetLinks || workshop.attendanceSheetLinks)];
                                  newLinks[index] = e.target.value;
                                  setEditData({...editData, attendanceSheetLinks: newLinks});
                                }}
                                className="flex-1 p-2 border border-gray-300 rounded-md"
                                placeholder="Attendance sheet link"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const newLinks = [...(editData.attendanceSheetLinks || workshop.attendanceSheetLinks)];
                                  newLinks.splice(index, 1);
                                  setEditData({...editData, attendanceSheetLinks: newLinks});
                                }}
                                className="p-1 text-red-500 hover:bg-red-50 rounded"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                              </button>
                            </div>
                            
                            <div className="mt-2">
                              <div className="text-sm text-gray-500 mb-1">OR</div>
                              <FileUploadField 
                                onUploadComplete={(url) => handleFileUploadComplete('attendanceSheetLinks', index, url)} 
                                fieldName="attendance-sheets"
                              />
                            </div>
                            
                            {link && link.startsWith('http') && (
                              <div className="mt-2 bg-gray-50 p-2 rounded flex items-center">
                                <svg className="h-5 w-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <a href={link} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 truncate hover:underline">
                                  {link.split('/').pop() || 'View file'}
                                </a>
                              </div>
                            )}
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => {
                            const currentLinks = editData.attendanceSheetLinks || workshop.attendanceSheetLinks || [];
                            setEditData({...editData, attendanceSheetLinks: [...currentLinks, '']});
                          }}
                          className="flex items-center text-sm text-gray-700 hover:text-black"
                        >
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                          Add Attendance Sheet
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="flex justify-end space-x-4 pt-4">
                  <button
                    onClick={closeModal}
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
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 overflow-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-bold text-red-600">Delete Workshop</h2>
              <button 
                onClick={() => setDeleteConfirm(false)}
                className="text-gray-500 hover:text-black p-2 rounded-md hover:bg-gray-100"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-6">
              <p className="mb-4 text-gray-700">
                Are you sure you want to delete <span className="font-semibold">{workshop?.eventTitle}</span>? This action cannot be undone.
              </p>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setDeleteConfirm(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  Delete Workshop
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default EventDetails;