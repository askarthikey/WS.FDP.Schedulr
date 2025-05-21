import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
const BackendURL= import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';

function Report() {
  // State variables
  const [workshops, setWorkshops] = useState([]);
  const [filteredWorkshops, setFilteredWorkshops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [yearFilter, setYearFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [availableYears, setAvailableYears] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all'); // Add status filter state
  
  // Fetch workshop data
  useEffect(() => {
    const fetchWorkshops = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        
        const response = await fetch(`${BackendURL}/workshopApi/getwks`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch workshop data');
        }
        
        const data = await response.json();
        
        // Sort workshops by start date (newest first by default)
        const sortedWorkshops = data.Workshops.sort((a, b) => {
          return new Date(b.eventStDate) - new Date(a.eventStDate);
        });
        
        setWorkshops(sortedWorkshops);
        setFilteredWorkshops(sortedWorkshops);
        
        // Extract available years for filtering
        const years = [...new Set(sortedWorkshops.map(workshop => {
          const date = new Date(workshop.eventStDate);
          return date.getFullYear();
        }))].sort((a, b) => b - a); // Sort years in descending order
        
        setAvailableYears(years);
        
      } catch (err) {
        console.error('Error fetching workshops:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchWorkshops();
  }, []);
  
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
  
  // Apply filters when year filter, status filter or search query changes
  useEffect(() => {
    let result = [...workshops];
    
    // Apply year filter
    if (yearFilter !== 'all') {
      result = result.filter(workshop => {
        const workshopYear = new Date(workshop.eventStDate).getFullYear();
        return workshopYear === parseInt(yearFilter);
      });
    }
    
    // Apply status filter
    if (statusFilter !== 'all') {
      result = result.filter(workshop => {
        return getWorkshopStatus(workshop) === statusFilter;
      });
    }
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(workshop => {
        // Search in title
        if (workshop.eventTitle?.toLowerCase().includes(query)) return true;
        
        // Search in organizer
        if (workshop.organizedBy?.toLowerCase().includes(query)) return true;
        
        // Search in organizer details
        if (workshop.eventOrganiserDetails && workshop.eventOrganiserDetails.some(organizer => 
          organizer.name?.toLowerCase().includes(query) ||
          organizer.designation?.toLowerCase().includes(query) ||
          organizer.department?.toLowerCase().includes(query)
        )) return true;
        
        // Search in resource persons
        if (workshop.resourcePersonDetails && workshop.resourcePersonDetails.some(person => 
          person.name?.toLowerCase().includes(query) ||
          person.designation?.toLowerCase().includes(query) ||
          person.department?.toLowerCase().includes(query)
        )) return true;
        
        // Search in category
        if (workshop.category && workshop.category.some(cat => 
          cat.toLowerCase().includes(query)
        )) return true;
        
        // Search in participant info
        if (workshop.participantInfo && workshop.participantInfo.some(info => 
          info.toLowerCase().includes(query)
        )) return true;
        
        // Search in participant count
        if (workshop.participantCount && workshop.participantCount.toString().includes(query)) return true;
        
        // Search in participant type
        if (workshop.participantType?.toLowerCase().includes(query)) return true;
        
        // Search in dates - convert dates to readable format for searching
        const startDateStr = formatDate(workshop.eventStDate)?.toLowerCase();
        const endDateStr = formatDate(workshop.eventEndDate)?.toLowerCase();
        if (startDateStr?.includes(query) || endDateStr?.includes(query)) return true;
        
        // Search in time
        if (workshop.eventStTime?.toLowerCase().includes(query)) return true;
        
        // Search in venue
        if (workshop.venue?.toLowerCase().includes(query)) return true;
        
        // Search in registration link
        if (workshop.registrationLink?.toLowerCase().includes(query)) return true;
        
        return false;
      });
    }
    
    setFilteredWorkshops(result);
  }, [yearFilter, statusFilter, searchQuery, workshops]);
  
  // Format date helper function
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };
  
  // Reset filters
  const resetFilters = () => {
    setYearFilter('all');
    setStatusFilter('all'); // Reset status filter
    setSearchQuery('');
  };
  
  // Generate organizer information display
  const getOrganizerInfo = (workshop) => {
    if (workshop.eventOrganiserDetails && workshop.eventOrganiserDetails.length > 0) {
      return workshop.eventOrganiserDetails.map((organizer, index) => (
        <div key={index} className="mb-1 last:mb-0">
          <div className="font-medium">{organizer.name}</div>
          {organizer.designation && <div className="text-xs text-gray-500">{organizer.designation}</div>}
        </div>
      ));
    } else if (workshop.organizedBy) {
      return <span>{workshop.organizedBy}</span>;
    }
    return '-';
  };
  
  // Generate resource person information display
  const getResourcePersonInfo = (workshop) => {
    if (workshop.resourcePersonDetails && workshop.resourcePersonDetails.length > 0) {
      return workshop.resourcePersonDetails.map((person, index) => (
        <div key={index} className="mb-2 last:mb-0">
          <div className="font-medium">{person.name}</div>
          {person.designation && <div className="text-xs text-gray-500">{person.designation}</div>}
          {person.department && <div className="text-xs text-gray-500">{person.department}</div>}
        </div>
      ));
    }
    return '-';
  };

  // Generate participant information display
  const getParticipantInfo = (workshop) => {
    if (workshop.participantInfo && workshop.participantInfo.length > 0) {
      return (
        <div className="space-y-1">
          {workshop.participantInfo.map((info, index) => (
            <div key={index} className="text-sm">
              {info}
            </div>
          ))}
        </div>
      );
    }
    return workshop.participantCount || '-';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-black"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-50 px-4">
        <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full text-center">
          <svg className="mx-auto h-16 w-16 text-red-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Error</h2>
          <p className="text-red-600 font-medium mb-6">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Enhanced Header */}
        <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl shadow-xl mb-8 overflow-hidden">
          <div className="px-6 py-8 sm:px-10 sm:py-12">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div className="mb-6 md:mb-0">
                <h1 className="text-3xl font-extrabold text-white leading-tight">
                  Workshop Reports
                </h1>
                <p className="mt-2 text-gray-300 max-w-2xl">
                  Comprehensive analytics and details of all workshops organized by the CSE Department
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <div className="flex items-center bg-white bg-opacity-10 rounded-lg px-4 py-2 text-black">
                  <span className="font-medium mr-2">Total:</span>
                  <span className="text-2xl text-green-700 font-bold">{workshops.length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Enhanced Filters Section */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden mb-8 transition-all duration-200 transform hover:shadow-lg">
          <div className="px-6 py-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              Filter Workshops
            </h2>
            
            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 flex-grow">
                {/* Year Filter */}
                <div>
                  <label htmlFor="yearFilter" className="block text-sm font-medium text-gray-700 mb-1">
                    Year
                  </label>
                  <div className="relative">
                    <select
                      id="yearFilter"
                      value={yearFilter}
                      onChange={(e) => setYearFilter(e.target.value)}
                      className="block w-full appearance-none pl-3 pr-12 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-black focus:border-black text-sm"
                    >
                      <option value="all">All Years</option>
                      {availableYears.map(year => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <svg className="h-5 w-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                      </svg>
                    </div>
                  </div>
                </div>
                
                {/* Status Filter - New */}
                <div>
                  <label htmlFor="statusFilter" className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <div className="relative">
                    <select
                      id="statusFilter"
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="block w-full appearance-none pl-3 pr-12 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-black focus:border-black text-sm"
                    >
                      <option value="all">All Statuses</option>
                      <option value="Completed">Completed</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Upcoming">Upcoming</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <svg className="h-5 w-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                      </svg>
                    </div>
                  </div>
                </div>
                
                {/* Search Box */}
                <div>
                  <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
                    Search
                  </label>
                  <div className="relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      id="search"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-black focus:border-black text-sm"
                      placeholder="Search by title, organizer, person..."
                    />
                    {searchQuery && (
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                        <button onClick={() => setSearchQuery('')} className="text-gray-400 hover:text-gray-600">
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Reset Filters Button */}
              <div className="flex justify-end">
                <button
                  onClick={resetFilters}
                  disabled={yearFilter === 'all' && statusFilter === 'all' && !searchQuery}
                  className={`inline-flex items-center px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium 
                    ${yearFilter === 'all' && statusFilter === 'all' && !searchQuery 
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                      : 'bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-colors duration-200'
                    }`}
                >
                  <svg className="mr-2 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Reset
                </button>
              </div>
            </div>
            
            {/* Filter Summary */}
            <div className="mt-4 flex flex-wrap items-center gap-2">
              {yearFilter !== 'all' && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  Year: {yearFilter}
                  <button 
                    onClick={() => setYearFilter('all')} 
                    className="ml-1 text-gray-500 hover:text-gray-700"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </span>
              )}
              
              {statusFilter !== 'all' && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  Status: {statusFilter}
                  <button 
                    onClick={() => setStatusFilter('all')} 
                    className="ml-1 text-gray-500 hover:text-gray-700"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </span>
              )}
              
              {searchQuery && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  Search: "{searchQuery}"
                  <button 
                    onClick={() => setSearchQuery('')} 
                    className="ml-1 text-gray-500 hover:text-gray-700"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </span>
              )}
              
              {(yearFilter !== 'all' || statusFilter !== 'all' || searchQuery) && (
                <span className="text-sm text-gray-500">
                  Showing {filteredWorkshops.length} of {workshops.length} workshops
                </span>
              )}
            </div>
          </div>
        </div>
        
        {/* Enhanced Results Section */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          {filteredWorkshops.length === 0 ? (
            <div className="py-16 px-4 text-center">
              <div className="flex flex-col items-center">
                <div className="bg-gray-100 rounded-full p-5 mb-4">
                  <svg className="h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-1">No matching workshops found</h3>
                <p className="text-gray-500 mb-6">Try changing your search criteria or filters</p>
                <button 
                  onClick={resetFilters} 
                  className="px-4 py-2 bg-black text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors duration-200"
                >
                  Clear all filters
                </button>
              </div>
            </div>
          ) : (
            <div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr className="bg-gray-50">
                      <th scope="col" className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Workshop Title
                      </th>
                      <th scope="col" className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th scope="col" className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Organizer Details
                      </th>
                      <th scope="col" className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Participants
                      </th>
                      <th scope="col" className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Resource Persons
                      </th>
                      <th scope="col" className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {filteredWorkshops.map((workshop) => (
                      <tr key={workshop._id || workshop.eventTitle} className="transition-colors hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900 line-clamp-2 mb-1">
                            {workshop.eventTitle}
                          </div>
                          {workshop.category && workshop.category.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {workshop.category.slice(0, 2).map((cat, idx) => (
                                <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                                  {cat}
                                </span>
                              ))}
                              {workshop.category.length > 2 && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                                  +{workshop.category.length - 2}
                                </span>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <svg className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <div>
                              <div className="text-sm font-medium text-gray-900">{formatDate(workshop.eventStDate)}</div>
                              {workshop.eventEndDate && workshop.eventStDate !== workshop.eventEndDate && (
                                <div className="text-xs text-gray-500">to {formatDate(workshop.eventEndDate)}</div>
                              )}
                            </div>
                          </div>
                          {workshop.eventStTime && (
                            <div className="mt-1 flex items-center text-xs text-gray-500">
                              <svg className="flex-shrink-0 mr-1.5 h-3.5 w-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              {workshop.eventStTime}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">
                            {getOrganizerInfo(workshop)}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <svg className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            <div className="ml-1.5">
                              {getParticipantInfo(workshop)}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">
                            {getResourcePersonInfo(workshop)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Link
                            to={`/workshops/${encodeURIComponent(workshop.eventTitle.toLowerCase().replace(/\s+/g, '-'))}`}
                            state={{ workshop }}
                            className="inline-flex items-center px-3 py-1.5 border border-black text-sm leading-5 font-medium rounded-md text-black bg-white hover:bg-black hover:text-white transition-colors duration-200"
                          >
                            <svg className="mr-1.5 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            View Details
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Enhanced Footer Summary */}
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-sm text-gray-500">
                    <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                    </svg>
                    Showing {filteredWorkshops.length} of {workshops.length} workshops  
                    {yearFilter !== 'all' && (
                      <span> from {yearFilter}</span>
                    )}
                    {statusFilter !== 'all' && (
                      <span> with status "{statusFilter}"</span>
                    )}
                    {searchQuery && (
                      <span> matching "{searchQuery}"</span>
                    )}
                  </div>
                  <div>
                    {(yearFilter !== 'all' || statusFilter !== 'all' || searchQuery) && (
                      <button
                        onClick={resetFilters}
                        className="inline-flex items-center text-sm font-medium text-gray-700 hover:text-black"
                      >
                        <svg className="mr-1.5 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                        </svg>
                        Clear filters
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Export Options (Optional Enhancement) */}
        {/* {filteredWorkshops.length > 0 && (
          <div className="mt-8 flex justify-end">
            <div className="inline-flex rounded-md shadow">
              <button
                type="button"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
              >
                <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export Report
              </button>
            </div>
          </div>
        )} */}
      </div>
    </div>
  );
}

export default Report;