import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const CreateWorkshop = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  // Form fields
  const [formData, setFormData] = useState({
    eventTitle: '',
    eventPosterLinks: [''],
    brochureLinks: [''],
    circularLinks: [''],
    attendanceSheetLinks: [''],
    eventOrganiserDetails: [{ name: '', designation: '' }],
    category: [''],
    eventStDate: '',
    eventEndDate: '',
    eventStTime: '',
    resourcePersonDetails: [{ name: '', designation: '', department: '' }],
    editAccessUsers: [''],
    thumbnail: '',
    photosLinks: [''],
    participantInfo: ['Total:'],
    scheduleLinks: [''],
    permissionLetterLinks: [''],
    registrationLink: '',
    feedbackLink: ''
  });

  // Get current user on component mount
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || 'null');
    setCurrentUser(user);
    
    if (user && user.username) {
      // Add current user to editAccessUsers by default
      setFormData(prev => ({
        ...prev,
        editAccessUsers: [user.username]
      }));
    }
  }, []);

  // Generic handler for simple input fields
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handler for array fields (simple strings)
  const handleArrayInputChange = (index, field, value) => {
    setFormData(prev => {
      const newArray = [...prev[field]];
      newArray[index] = value;
      return { ...prev, [field]: newArray };
    });
  };

  // Add new item to array field
  const addArrayItem = (field) => {
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field], '']
    }));
  };

  // Remove item from array field
  const removeArrayItem = (field, index) => {
    if (formData[field].length <= 1) return;
    
    setFormData(prev => {
      const newArray = [...prev[field]];
      newArray.splice(index, 1);
      return { ...prev, [field]: newArray };
    });
  };

  // Handler for object array fields (organizers, resource persons)
  const handleObjectArrayChange = (index, field, objField, value) => {
    setFormData(prev => {
      const newArray = [...prev[field]];
      newArray[index] = { ...newArray[index], [objField]: value };
      return { ...prev, [field]: newArray };
    });
  };

  // Add new item to object array
  const addObjectArrayItem = (field, emptyObj) => {
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field], emptyObj]
    }));
  };

  // Remove item from object array
  const removeObjectArrayItem = (field, index) => {
    if (formData[field].length <= 1) return;
    
    setFormData(prev => {
      const newArray = [...prev[field]];
      newArray.splice(index, 1);
      return { ...prev, [field]: newArray };
    });
  };

  // Form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.eventTitle || !formData.eventStDate) {
      setError('Please fill in all required fields');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      
      if (!token) {
        setError('Authentication required. Please sign in again.');
        setLoading(false);
        return;
      }
      
      // Clean up empty array items
      const cleanData = { ...formData };
      Object.keys(cleanData).forEach(key => {
        if (Array.isArray(cleanData[key])) {
          cleanData[key] = cleanData[key].filter(item => {
            if (typeof item === 'string') return item.trim() !== '';
            if (typeof item === 'object') {
              // For object arrays, check if all values are empty
              return Object.values(item).some(val => val.trim() !== '');
            }
            return true;
          });
        }
      });
      
      // Ensure current user is in editAccessUsers
      if (currentUser && currentUser.username) {
        if (!cleanData.editAccessUsers.includes(currentUser.username)) {
          cleanData.editAccessUsers.push(currentUser.username);
        }
      }
      
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/workshopApi/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(cleanData)
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setSuccess(true);
        setTimeout(() => {
          navigate('/workshops');
        }, 2000);
      } else {
        setError(data.message || 'Failed to create workshop');
      }
    } catch (err) {
      console.log(err)
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <h1 className="text-3xl font-bold mb-6">Create New Workshop</h1>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}
      
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-6">
          Workshop created successfully! Redirecting...
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Information */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Basic Information</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Event Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="eventTitle"
                value={formData.eventTitle}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="eventStDate"
                  value={formData.eventStDate}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  name="eventEndDate"
                  value={formData.eventEndDate}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Time
                </label>
                <input
                  type="text"
                  name="eventStTime"
                  placeholder="e.g. 10:00 AM"
                  value={formData.eventStTime}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Thumbnail URL
              </label>
              <input
                type="text"
                name="thumbnail"
                placeholder="https://example.com/image.jpg"
                value={formData.thumbnail}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Categories
              </label>
              <div className="space-y-2">
                {formData.category.map((cat, index) => (
                  <div key={`category-${index}`} className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={cat}
                      onChange={(e) => handleArrayInputChange(index, 'category', e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
                    />
                    <button 
                      type="button" 
                      onClick={() => removeArrayItem('category', index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                ))}
                <button 
                  type="button" 
                  onClick={() => addArrayItem('category')}
                  className="text-black hover:text-gray-700 text-sm font-medium inline-flex items-center"
                >
                  <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Add Category
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Event Organizers */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Event Organizers</h2>
          <div className="space-y-4">
            {formData.eventOrganiserDetails.map((organizer, index) => (
              <div key={`organizer-${index}`} className="p-4 border border-gray-200 rounded-md">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-medium">Organizer {index + 1}</h3>
                  <button 
                    type="button" 
                    onClick={() => removeObjectArrayItem('eventOrganiserDetails', index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                    <input
                      type="text"
                      value={organizer.name}
                      onChange={(e) => handleObjectArrayChange(index, 'eventOrganiserDetails', 'name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Designation</label>
                    <input
                      type="text"
                      value={organizer.designation}
                      onChange={(e) => handleObjectArrayChange(index, 'eventOrganiserDetails', 'designation', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
                    />
                  </div>
                </div>
              </div>
            ))}
            
            <button 
              type="button" 
              onClick={() => addObjectArrayItem('eventOrganiserDetails', { name: '', designation: '' })}
              className="text-black hover:text-gray-700 text-sm font-medium inline-flex items-center"
            >
              <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add Organizer
            </button>
          </div>
        </div>
        
        {/* Resource Persons */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Resource Persons</h2>
          <div className="space-y-4">
            {formData.resourcePersonDetails.map((person, index) => (
              <div key={`resource-${index}`} className="p-4 border border-gray-200 rounded-md">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-medium">Resource Person {index + 1}</h3>
                  <button 
                    type="button" 
                    onClick={() => removeObjectArrayItem('resourcePersonDetails', index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                    <input
                      type="text"
                      value={person.name}
                      onChange={(e) => handleObjectArrayChange(index, 'resourcePersonDetails', 'name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Designation</label>
                    <input
                      type="text"
                      value={person.designation}
                      onChange={(e) => handleObjectArrayChange(index, 'resourcePersonDetails', 'designation', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                    <input
                      type="text"
                      value={person.department}
                      onChange={(e) => handleObjectArrayChange(index, 'resourcePersonDetails', 'department', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
                    />
                  </div>
                </div>
              </div>
            ))}
            
            <button 
              type="button" 
              onClick={() => addObjectArrayItem('resourcePersonDetails', { name: '', designation: '', department: '' })}
              className="text-black hover:text-gray-700 text-sm font-medium inline-flex items-center"
            >
              <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add Resource Person
            </button>
          </div>
        </div>
        
        {/* Workshop Materials */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Workshop Materials</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Event Posters
                </label>
                {formData.eventPosterLinks.map((link, index) => (
                  <div key={`poster-${index}`} className="flex items-center space-x-2 mb-2">
                    <input
                      type="text"
                      placeholder="Poster link"
                      value={link}
                      onChange={(e) => handleArrayInputChange(index, 'eventPosterLinks', e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
                    />
                    <button 
                      type="button" 
                      onClick={() => removeArrayItem('eventPosterLinks', index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
                <button 
                  type="button" 
                  onClick={() => addArrayItem('eventPosterLinks')}
                  className="text-black hover:text-gray-700 text-sm font-medium inline-flex items-center"
                >
                  <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Add Poster Link
                </button>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Brochures
                </label>
                {formData.brochureLinks.map((link, index) => (
                  <div key={`brochure-${index}`} className="flex items-center space-x-2 mb-2">
                    <input
                      type="text"
                      placeholder="Brochure link"
                      value={link}
                      onChange={(e) => handleArrayInputChange(index, 'brochureLinks', e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
                    />
                    <button 
                      type="button" 
                      onClick={() => removeArrayItem('brochureLinks', index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
                <button 
                  type="button" 
                  onClick={() => addArrayItem('brochureLinks')}
                  className="text-black hover:text-gray-700 text-sm font-medium inline-flex items-center"
                >
                  <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Add Brochure Link
                </button>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Circulars
                </label>
                {formData.circularLinks.map((link, index) => (
                  <div key={`circular-${index}`} className="flex items-center space-x-2 mb-2">
                    <input
                      type="text"
                      placeholder="Circular link"
                      value={link}
                      onChange={(e) => handleArrayInputChange(index, 'circularLinks', e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
                    />
                    <button 
                      type="button" 
                      onClick={() => removeArrayItem('circularLinks', index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
                <button 
                  type="button" 
                  onClick={() => addArrayItem('circularLinks')}
                  className="text-black hover:text-gray-700 text-sm font-medium inline-flex items-center"
                >
                  <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Add Circular Link
                </button>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Attendance Sheets
                </label>
                {formData.attendanceSheetLinks.map((link, index) => (
                  <div key={`attendance-${index}`} className="flex items-center space-x-2 mb-2">
                    <input
                      type="text"
                      placeholder="Attendance sheet link"
                      value={link}
                      onChange={(e) => handleArrayInputChange(index, 'attendanceSheetLinks', e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
                    />
                    <button 
                      type="button" 
                      onClick={() => removeArrayItem('attendanceSheetLinks', index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
                <button 
                  type="button" 
                  onClick={() => addArrayItem('attendanceSheetLinks')}
                  className="text-black hover:text-gray-700 text-sm font-medium inline-flex items-center"
                >
                  <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Add Attendance Sheet Link
                </button>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Photos
                </label>
                {formData.photosLinks.map((link, index) => (
                  <div key={`photo-${index}`} className="flex items-center space-x-2 mb-2">
                    <input
                      type="text"
                      placeholder="Photo link"
                      value={link}
                      onChange={(e) => handleArrayInputChange(index, 'photosLinks', e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
                    />
                    <button 
                      type="button" 
                      onClick={() => removeArrayItem('photosLinks', index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
                <button 
                  type="button" 
                  onClick={() => addArrayItem('photosLinks')}
                  className="text-black hover:text-gray-700 text-sm font-medium inline-flex items-center"
                >
                  <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Add Photo Link
                </button>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Schedules
                </label>
                {formData.scheduleLinks.map((link, index) => (
                  <div key={`schedule-${index}`} className="flex items-center space-x-2 mb-2">
                    <input
                      type="text"
                      placeholder="Schedule link"
                      value={link}
                      onChange={(e) => handleArrayInputChange(index, 'scheduleLinks', e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
                    />
                    <button 
                      type="button" 
                      onClick={() => removeArrayItem('scheduleLinks', index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
                <button 
                  type="button" 
                  onClick={() => addArrayItem('scheduleLinks')}
                  className="text-black hover:text-gray-700 text-sm font-medium inline-flex items-center"
                >
                  <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Add Schedule Link
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Additional Information */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Additional Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Registration Link
                </label>
                <input
                  type="text"
                  name="registrationLink"
                  placeholder="https://forms.example.com/register"
                  value={formData.registrationLink}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Feedback Link
                </label>
                <input
                  type="text"
                  name="feedbackLink"
                  placeholder="https://forms.example.com/feedback"
                  value={formData.feedbackLink}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Permission Letters
                </label>
                {formData.permissionLetterLinks.map((link, index) => (
                  <div key={`permission-${index}`} className="flex items-center space-x-2 mb-2">
                    <input
                      type="text"
                      placeholder="Permission letter link"
                      value={link}
                      onChange={(e) => handleArrayInputChange(index, 'permissionLetterLinks', e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
                    />
                    <button 
                      type="button" 
                      onClick={() => removeArrayItem('permissionLetterLinks', index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
                <button 
                  type="button" 
                  onClick={() => addArrayItem('permissionLetterLinks')}
                  className="text-black hover:text-gray-700 text-sm font-medium inline-flex items-center"
                >
                  <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Add Permission Letter Link
                </button>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Participant Information
                </label>
                {formData.participantInfo.map((info, index) => (
                  <div key={`participant-${index}`} className="flex items-center space-x-2 mb-2">
                    <input
                      type="text"
                      placeholder="e.g., Total:150 or CSE:50"
                      value={info}
                      onChange={(e) => handleArrayInputChange(index, 'participantInfo', e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
                    />
                    <button 
                      type="button" 
                      onClick={() => removeArrayItem('participantInfo', index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
                <button 
                  type="button" 
                  onClick={() => addArrayItem('participantInfo')}
                  className="text-black hover:text-gray-700 text-sm font-medium inline-flex items-center"
                >
                  <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Add Participant Information
                </button>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Users with Edit Access
                </label>
                <div className="mb-2 p-2 bg-gray-50 rounded-md text-sm">
                  <div className="flex items-center space-x-2">
                    <svg className="h-4 w-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    <span>You ({currentUser?.username || 'current user'}) have edit access</span>
                  </div>
                </div>
                {formData.editAccessUsers.filter(user => user !== currentUser?.username).map((user, index) => (
                  <div key={`editor-${index}`} className="flex items-center space-x-2 mb-2">
                    <input
                      type="text"
                      placeholder="Username"
                      value={user}
                      onChange={(e) => {
                        const newEditUsers = [...formData.editAccessUsers];
                        const actualIndex = formData.editAccessUsers.findIndex(u => u === user);
                        if (actualIndex !== -1) {
                          newEditUsers[actualIndex] = e.target.value;
                          setFormData(prev => ({
                            ...prev,
                            editAccessUsers: newEditUsers
                          }));
                        }
                      }}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
                    />
                    <button 
                      type="button" 
                      onClick={() => {
                        const newEditUsers = formData.editAccessUsers.filter(u => u !== user);
                        setFormData(prev => ({
                          ...prev,
                          editAccessUsers: newEditUsers
                        }));
                      }}
                      className="text-red-500 hover:text-red-700"
                    >
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
                <button 
                  type="button" 
                  onClick={() => {
                    setFormData(prev => ({
                      ...prev,
                      editAccessUsers: [...prev.editAccessUsers, '']
                    }));
                  }}
                  className="text-black hover:text-gray-700 text-sm font-medium inline-flex items-center"
                >
                  <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Add User with Edit Access
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Form Actions */}
        <div className="flex justify-between items-center">
          <button 
            type="button"
            onClick={() => navigate('/workshops')}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          
          <button 
            type="submit"
            disabled={loading}
            className={`px-6 py-2 bg-black text-white rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 ${loading ? 'opacity-75 cursor-wait' : ''}`}
          >
            {loading ? 'Creating...' : 'Create Workshop'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateWorkshop;