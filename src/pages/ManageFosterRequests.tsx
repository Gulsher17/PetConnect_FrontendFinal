// src/pages/ManageFosterRequests.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { http } from '../lib/http';
import toast from 'react-hot-toast';
import NavBar from '../components/layout/NavBar';
import Footer from '../components/layout/Footer';

interface FosterRequest {
  _id: string;
  user: {
    _id: string;
    name: string;
    email: string;
    phone?: string;
    location?: string;
    avatar?: string;
    experience?: string;
    homeEnvironment?: string;
  };
  status: 'pending' | 'in_discussion' | 'approved' | 'rejected' | 'meeting_scheduled';
  message?: string;
  submittedAt: string;
  chatThread?: string;
}

interface PetDetails {
  _id: string;
  name: string;
  breed: string;
  age: number;
  gender: string;
  description: string;
  location: string;
  status: string;
  images: any[];
  fosterRequests?: FosterRequest[] | null;
}

const ManageFosterRequests: React.FC = () => {
  const { petId } = useParams<{ petId: string }>();
  const navigate = useNavigate();
  
  const [pet, setPet] = useState<PetDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
  const [processingAction, setProcessingAction] = useState<string | null>(null);

  useEffect(() => {
    if (petId) {
      loadPetFromMyListings();
    }
  }, [petId]);

  const loadPetFromMyListings = async () => {
    setLoading(true);
    try {
      const response = await http.get('/pet-files/my-listings/detailed');
      if (response.data && response.data.listings) {
        const allListings = response.data.listings;
        const currentPet = allListings.find((listing: any) => listing._id === petId);
        
        if (currentPet) {
          setPet({
            ...currentPet,
            fosterRequests: currentPet.fosterRequests || []
          });
        } else {
          await loadBasicPetInfo();
        }
      } else {
        await loadBasicPetInfo();
      }
    } catch (error: any) {
      console.error('Error loading from my listings:', error);
      await loadBasicPetInfo();
    } finally {
      setLoading(false);
    }
  };

  const loadBasicPetInfo = async () => {
    try {
      const petResponse = await http.get(`/pet-files/${petId}`);
      setPet({
        ...petResponse.data,
        fosterRequests: petResponse.data.fosterRequests || []
      });
    } catch (error: any) {
      console.error('Error loading basic pet info:', error);
      try {
        const petResponse = await http.get(`/pets/${petId}`);
        setPet({
          ...petResponse.data,
          fosterRequests: petResponse.data.fosterRequests || []
        });
      } catch (secondError) {
        console.error('Error loading from pets endpoint:', secondError);
        toast.error('Failed to load pet details');
      }
    }
  };

  const handleFosterRequestAction = async (requestId: string, action: 'approve' | 'reject') => {
    if (!petId || !confirm(`Are you sure you want to ${action} this foster request?`)) return;
    
    setProcessingAction(requestId);
    try {
      let response;
      let success = false;
      
      try {
        response = await http.patch(`/pets/${petId}/foster-requests/${requestId}`, { action });
        success = true;
      } catch (firstError: any) {
        try {
          response = await http.patch(`/pet-files/${petId}/foster-requests/${requestId}`, { action });
          success = true;
        } catch (secondError: any) {
          try {
            response = await http.patch(`/foster-requests/${requestId}`, { 
              status: action === 'approve' ? 'approved' : 'rejected' 
            });
            success = true;
          } catch (thirdError: any) {
            throw new Error(`All API endpoints failed: ${thirdError.message}`);
          }
        }
      }
      
      if (success && response) {
        toast.success(response.data.msg || `Foster request ${action}ed successfully`);
        setTimeout(() => {
          loadPetFromMyListings();
        }, 1000);
      } else {
        throw new Error('No successful response from any endpoint');
      }
      
    } catch (error: any) {
      console.error('Foster request action error:', error);
      const errorMessage = error.response?.data?.msg || error.message || `Failed to ${action} request`;
      toast.error(errorMessage);
      
      if (pet && pet.fosterRequests) {
        const updatedRequests = pet.fosterRequests.map(req => 
          req._id === requestId 
            ? { ...req, status: action === 'approve' ? 'approved' : 'rejected' }
            : req
        );
        setPet({ ...pet, fosterRequests: updatedRequests });
      }
    } finally {
      setProcessingAction(null);
    }
  };

  const startFosterChat = async (requestId: string) => {
    if (!petId) return;
    
    try {
      let response;
      try {
        response = await http.post(`/pet-files/${petId}/foster-requests/${requestId}/start-chat`);
      } catch (firstError) {
        response = await http.post(`/pets/${petId}/foster-requests/${requestId}/start-chat`);
      }
      
      if (response.data.success) {
        toast.success('Chat started successfully!');
        const chatId = response.data.chatThreadId || response.data.chatId;
        if (chatId) {
          window.location.href = `/chat-interface.html?thread=${chatId}&type=foster`;
        }
      }
    } catch (error: any) {
      console.error('Start chat error:', error);
      toast.error(error.response?.data?.msg || 'Failed to start chat');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusClasses = {
      'pending': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'in_discussion': 'bg-blue-100 text-blue-800 border-blue-200',
      'approved': 'bg-green-100 text-green-800 border-green-200',
      'rejected': 'bg-red-100 text-red-800 border-red-200',
      'meeting_scheduled': 'bg-purple-100 text-purple-800 border-purple-200'
    };
    
    return statusClasses[status as keyof typeof statusClasses] || 'bg-gray-100 text-gray-800 border-gray-200';
  };
  
  const getStatusDisplay = (status: string) => {
    const statusMap = {
      'pending': 'Pending Review',
      'in_discussion': 'In Discussion',
      'approved': 'Approved',
      'rejected': 'Rejected',
      'meeting_scheduled': 'Meeting Scheduled'
    };
    
    return statusMap[status as keyof typeof statusMap] || status;
  };
  
  const getFilteredRequests = () => {
    if (!pet?.fosterRequests || !Array.isArray(pet.fosterRequests)) return [];
    
    if (activeTab === 'all') return pet.fosterRequests;
    
    if (activeTab === 'pending') {
      return pet.fosterRequests.filter(req => 
        req.status === 'pending' || req.status === 'in_discussion' || req.status === 'meeting_scheduled'
      );
    }
    
    return pet.fosterRequests.filter(req => req.status === activeTab);
  };
  
  const getRequestCounts = () => {
    const fosterRequests = pet?.fosterRequests || [];
    const pendingCount = fosterRequests.filter(req => 
      req.status === 'pending' || req.status === 'in_discussion' || req.status === 'meeting_scheduled'
    ).length;
    const approvedCount = fosterRequests.filter(req => req.status === 'approved').length;
    const rejectedCount = fosterRequests.filter(req => req.status === 'rejected').length;
    
    return {
      total: fosterRequests.length,
      pending: pendingCount,
      approved: approvedCount,
      rejected: rejectedCount
    };
  };

  const getDaysAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--pc-primary)] mx-auto"></div>
          <p className="mt-3 text-gray-600">Loading foster requests...</p>
        </div>
      </div>
    );
  }

  if (!pet) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Pet Not Found</h2>
          <p className="text-gray-600 mb-4">
            The pet you're looking for doesn't exist in your listings.
          </p>
          <Link to="/dashboard" className="pc-btn pc-btn-primary">
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const filteredRequests = getFilteredRequests();
  const counts = getRequestCounts();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <NavBar />
      
      <main className="flex-grow max-w-7xl mx-auto w-full py-8 px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Link 
                  to="/dashboard" 
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"/>
                  </svg>
                </Link>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                  Foster Requests
                </h1>
              </div>
              <p className="text-gray-600">Manage applications for {pet.name}</p>
            </div>
            <div className="flex gap-3">
              <Link 
                to={`/pet/${pet._id}`}
                className="pc-btn pc-btn-outline"
              >
                View Pet
              </Link>
              <Link 
                to="/dashboard"
                className="pc-btn pc-btn-primary"
              >
                Dashboard
              </Link>
            </div>
          </div>
        </div>

        {/* Pet Card */}
        <div className="pc-card p-6 mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex-shrink-0">
              {pet.images && pet.images.length > 0 && pet.images[0].url ? (
                <img 
                  src={pet.images[0].url} 
                  alt={pet.name}
                  className="w-20 h-20 rounded-xl object-cover shadow-sm"
                />
              ) : (
                <div className="w-20 h-20 bg-gray-200 rounded-xl flex items-center justify-center">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                  </svg>
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-semibold text-gray-900 truncate">{pet.name}</h2>
              <div className="flex flex-wrap gap-2 mt-2">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {pet.breed || 'Mixed Breed'}
                </span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  {pet.age || 'N/A'} years
                </span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                  {pet.gender}
                </span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  {pet.location}
                </span>
              </div>
              <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                {pet.description || 'No description available.'}
              </p>
            </div>
            <div className="flex-shrink-0">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                pet.status === 'available_fostering' ? 'bg-green-100 text-green-800' : 
                pet.status === 'fostered' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {pet.status ? pet.status.replace(/_/g, ' ') : 'Unknown'}
              </span>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="pc-card p-4 text-center">
            <div className="text-2xl font-bold text-gray-900">{counts.total}</div>
            <div className="text-sm text-gray-600 mt-1">Total Requests</div>
          </div>
          <div className="pc-card p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">{counts.pending}</div>
            <div className="text-sm text-gray-600 mt-1">Needs Review</div>
          </div>
          <div className="pc-card p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{counts.approved}</div>
            <div className="text-sm text-gray-600 mt-1">Approved</div>
          </div>
          <div className="pc-card p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{counts.rejected}</div>
            <div className="text-sm text-gray-600 mt-1">Rejected</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            {[
              { key: 'pending', label: `Needs Review (${counts.pending})` },
              { key: 'approved', label: `Approved (${counts.approved})` },
              { key: 'rejected', label: `Rejected (${counts.rejected})` },
              { key: 'all', label: `All Requests (${counts.total})` }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.key
                    ? 'border-[var(--pc-primary)] text-[var(--pc-primary)]'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Requests List */}
        <div className="space-y-4">
          {filteredRequests.length === 0 ? (
            <div className="pc-card text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No {activeTab === 'pending' ? 'requests needing review' : activeTab + ' requests'}
              </h3>
              <p className="text-gray-500 max-w-md mx-auto">
                {activeTab === 'pending' 
                  ? "All foster requests have been reviewed. New applications will appear here."
                  : `There are no ${activeTab} foster requests to display.`
                }
              </p>
            </div>
          ) : (
            filteredRequests.map((request) => (
              <div key={request._id} className="pc-card p-6">
                {/* Header */}
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="flex-shrink-0">
                      {request.user.avatar ? (
                        <img 
                          src={request.user.avatar} 
                          alt={request.user.name}
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center">
                          <span className="text-blue-600 font-semibold text-lg">
                            {request.user.name ? request.user.name.charAt(0).toUpperCase() : 'U'}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-semibold text-gray-900 truncate">
                          {request.user.name || 'Unknown User'}
                        </h3>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusBadge(request.status)}`}>
                          {getStatusDisplay(request.status)}
                        </span>
                      </div>
                      <p className="text-gray-600 text-sm">{request.user.email}</p>
                      {request.user.location && (
                        <p className="text-gray-500 text-sm flex items-center gap-1 mt-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                          </svg>
                          {request.user.location}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-500">
                    <span>Applied {getDaysAgo(request.submittedAt)}</span>
                  </div>
                </div>

                {/* User Details Grid */}
                {(request.user.experience || request.user.homeEnvironment) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    {request.user.experience && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center gap-1">
                          <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                          </svg>
                          Pet Experience
                        </h4>
                        <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
                          {request.user.experience}
                        </p>
                      </div>
                    )}
                    {request.user.homeEnvironment && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center gap-1">
                          <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
                          </svg>
                          Home Environment
                        </h4>
                        <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
                          {request.user.homeEnvironment}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Request Message */}
                {request.message && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center gap-1">
                      <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/>
                      </svg>
                      Applicant's Message
                    </h4>
                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                      <p className="text-gray-700 text-sm leading-relaxed">{request.message}</p>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-4 border-t border-gray-200">
                  <div className="flex gap-2">
                    <button
                      onClick={() => startFosterChat(request._id)}
                      className="pc-btn pc-btn-outline flex items-center gap-2 text-sm"
                      disabled={processingAction === request._id}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
                      </svg>
                      Start Chat
                    </button>
                  </div>

                  {(request.status === 'pending' || request.status === 'in_discussion') && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleFosterRequestAction(request._id, 'approve')}
                        className="pc-btn bg-green-600 hover:bg-green-700 text-white flex items-center gap-2 text-sm disabled:bg-gray-400 disabled:cursor-not-allowed"
                        disabled={processingAction === request._id}
                      >
                        {processingAction === request._id ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            Processing...
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/>
                            </svg>
                            Approve Request
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => handleFosterRequestAction(request._id, 'reject')}
                        className="pc-btn bg-red-600 hover:bg-red-700 text-white flex items-center gap-2 text-sm disabled:bg-gray-400 disabled:cursor-not-allowed"
                        disabled={processingAction === request._id}
                      >
                        {processingAction === request._id ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            Processing...
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
                            </svg>
                            Reject Request
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {request.status === 'approved' && (
                    <div className="flex items-center gap-2 text-green-600 font-medium">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                      </svg>
                      Request Approved
                    </div>
                  )}

                  {request.status === 'rejected' && (
                    <div className="flex items-center gap-2 text-red-600 font-medium">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                      </svg>
                      Request Rejected
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ManageFosterRequests;