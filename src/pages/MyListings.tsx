// src/components/MyListings.tsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { http } from '../lib/http';
import toast from 'react-hot-toast';

interface FosterRequest {
  _id: string;
  user: {
    _id: string;
    name: string;
    email: string;
    phone?: string;
    location?: string;
    avatar?: string;
  };
  status: 'pending' | 'approved' | 'rejected';
  message?: string;
  submittedAt: string;
  chatThread?: string;
}

interface Listing {
  _id: string;
  name: string;
  breed: string;
  age: number;
  gender: string;
  description: string;
  location: string;
  adoptionFee: number;
  status: string;
  images: any[];
  createdAt: string;
  duration?: string;
  currentFoster?: any;
  fosterRequests?: FosterRequest[];
}

interface Analytics {
  total: number;
  available: number;
  pendingRequests: number;
  currentlyFostered: number;
}

interface MyListingsProps {
  listings?: Listing[];
  onListingsUpdate?: () => void;
}

const MyListings: React.FC<MyListingsProps> = ({ listings: propListings, onListingsUpdate }) => {
  const [listings, setListings] = useState<Listing[]>(propListings || []);
  const [analytics, setAnalytics] = useState<Analytics>({
    total: 0,
    available: 0,
    pendingRequests: 0,
    currentlyFostered: 0
  });
  const [loading, setLoading] = useState(!propListings);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [petToDelete, setPetToDelete] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!propListings) {
      loadMyListings();
    } else {
      setListings(propListings);
      calculateAnalytics(propListings);
    }
  }, [propListings]);

  const loadMyListings = async () => {
    setLoading(true);
    try {
      const response = await http.get('/pet-files/my-listings/detailed');
      if (response.data && response.data.listings) {
        const listingsData = response.data.listings;
        setListings(listingsData);
        calculateAnalytics(listingsData);
        
        if (onListingsUpdate) {
          onListingsUpdate();
        }
      }
    } catch (error: any) {
      console.error('Error loading listings:', error);
      toast.error('Failed to load listings');
    } finally {
      setLoading(false);
    }
  };

  const calculateAnalytics = (listingsData: Listing[]) => {
    const analyticsData = {
      total: listingsData.length,
      available: listingsData.filter((p: Listing) => p.status === 'available_fostering').length,
      pendingRequests: listingsData.reduce((acc: number, p: Listing) => 
        acc + (p.fosterRequests?.filter(req => req.status === 'pending').length || 0), 0),
      currentlyFostered: listingsData.filter((p: Listing) => p.status === 'fostered').length
    };
    setAnalytics(analyticsData);
  };

  const handleDeleteListing = async (petId: string) => {
    setPetToDelete(petId);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!petToDelete) return;
    
    try {
      await http.delete(`/pet-files/user-pet/${petToDelete}`);
      toast.success('Listing deleted successfully!');
      await loadMyListings();
    } catch (error: any) {
      console.error('Error deleting listing:', error);
      toast.error(error.response?.data?.msg || 'Failed to delete listing');
    } finally {
      setShowDeleteModal(false);
      setPetToDelete(null);
    }
  };

  const handleFosterRequest = async (petId: string, requestId: string, action: 'approve' | 'reject') => {
    if (!confirm(`Are you sure you want to ${action} this foster request?`)) return;
    
    try {
      const response = await http.patch(`/pets/${petId}/foster-requests/${requestId}`, { action });
      toast.success(response.data.msg || `Foster request ${action}d successfully`);
      await loadMyListings();
    } catch (error: any) {
      console.error('Foster request error:', error);
      toast.error(error.response?.data?.msg || `Failed to ${action} request`);
    }
  };

  const startFosterChat = async (petId: string, requestId: string) => {
    try {
      const response = await http.post(`/pet-files/${petId}/foster-requests/${requestId}/start-chat`);
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

  const viewPetDetails = (petId: string) => {
    navigate(`/pet/${petId}`);
  };

  const manageFosterRequests = (petId: string) => {
    navigate(`/manage-foster-requests/${petId}`);
  };

  const getStatusClass = (status: string) => {
    const statusClasses: { [key: string]: string } = {
      'available_fostering': 'bg-green-100 text-green-800 border-green-200',
      'pending_foster': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'fostered': 'bg-blue-100 text-blue-800 border-blue-200',
      'available': 'bg-green-100 text-green-800 border-green-200',
      'pending': 'bg-yellow-100 text-yellow-800 border-yellow-200'
    };
    return statusClasses[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getStatusDisplay = (status: string) => {
    const statusMap: { [key: string]: string } = {
      'available_fostering': 'Available',
      'pending_foster': 'Pending Review',
      'fostered': 'Fostered',
      'available': 'Available',
      'pending': 'Pending Review'
    };
    return statusMap[status] || status;
  };

  const getDaysAgo = (dateString: string) => {
    try {
      // Handle different date string formats
      const date = new Date(dateString);
      
      // Check if the date is valid
      if (isNaN(date.getTime())) {
        return 'Recently';
      }
      
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - date.getTime());
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
      const diffMinutes = Math.floor(diffTime / (1000 * 60));
      
      if (diffMinutes < 1) return 'Just now';
      if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`;
      if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
      if (diffDays === 0) return 'Today';
      if (diffDays === 1) return 'Yesterday';
      if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
      if (diffDays < 30) {
        const weeks = Math.floor(diffDays / 7);
        return `${weeks} week${weeks === 1 ? '' : 's'} ago`;
      }
      if (diffDays < 365) {
        const months = Math.floor(diffDays / 30);
        return `${months} month${months === 1 ? '' : 's'} ago`;
      }
      
      const years = Math.floor(diffDays / 365);
      return `${years} year${years === 1 ? '' : 's'} ago`;
    } catch (error) {
      console.error('Error parsing date:', error);
      return 'Recently';
    }
  };

  // Helper function to check if a pet has any foster requests
  const hasFosterRequests = (pet: Listing) => {
    return pet.fosterRequests && pet.fosterRequests.length > 0;
  };

  // Helper function to check if a pet has pending foster requests
  const hasPendingRequests = (pet: Listing) => {
    return pet.fosterRequests && pet.fosterRequests.some(req => req.status === 'pending');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--pc-primary)] mx-auto"></div>
          <p className="mt-3 text-gray-600">Loading your listings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto w-full py-8 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">My Pet Listings</h1>
            <p className="text-gray-600 mt-2">Manage your pets listed for fostering</p>
          </div>
          <Link 
            to="/create-listing-new" 
            className="pc-btn pc-btn-primary flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
            </svg>
            List New Pet
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="pc-card p-4 text-center">
          <div className="text-2xl font-bold text-gray-900">{analytics.total}</div>
          <div className="text-sm text-gray-600 mt-1">Total Listings</div>
        </div>
        <div className="pc-card p-4 text-center">
          <div className="text-2xl font-bold text-green-600">{analytics.available}</div>
          <div className="text-sm text-gray-600 mt-1">Available</div>
        </div>
        <div className="pc-card p-4 text-center">
          <div className="text-2xl font-bold text-yellow-600">{analytics.pendingRequests}</div>
          <div className="text-sm text-gray-600 mt-1">Pending Requests</div>
        </div>
        <div className="pc-card p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">{analytics.currentlyFostered}</div>
          <div className="text-sm text-gray-600 mt-1">Fostered</div>
        </div>
      </div>

      {/* Listings Grid */}
      {listings.length === 0 ? (
        <div className="pc-card text-center py-12">
          <div className="max-w-md mx-auto">
            <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No pet listings yet</h3>
            <p className="text-gray-500 mb-6">Start by creating your first pet listing for fostering.</p>
            <Link 
              to="/create-listing-new"
              className="pc-btn pc-btn-primary inline-flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
              </svg>
              Create Your First Listing
            </Link>
          </div>
        </div>
      ) : (
        <>
        {/* Pending Requests Alert */}
          {listings.some(hasPendingRequests) && (
            <div className="pc-card border-l-4 border-l-yellow-400 bg-yellow-50 p-6 mb-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"/>
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      Pending Foster Requests Need Attention
                    </h3>
                    <p className="text-gray-600">
                      You have {listings.filter(hasPendingRequests).length} pets with pending foster requests waiting for review.
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {listings
                    .filter(hasPendingRequests)
                    .slice(0, 2)
                    .map((pet) => (
                      <button 
                        key={pet._id}
                        onClick={() => manageFosterRequests(pet._id)}
                        className="pc-btn bg-yellow-600 hover:bg-yellow-700 text-white text-sm"
                      >
                        Review {pet.name}
                      </button>
                    ))
                  }
                </div>
              </div>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {listings.map((pet) => (
              <div key={pet._id} className="pc-card overflow-hidden hover:shadow-lg transition-all duration-300 flex flex-col h-full">
                {/* Pet Image */}
                <div 
                  className="w-full h-48 bg-gray-200 cursor-pointer relative overflow-hidden flex-shrink-0"
                  onClick={() => viewPetDetails(pet._id)}
                >
                  {pet.images && pet.images.length > 0 && pet.images[0].url ? (
                    <img 
                      src={pet.images[0].url} 
                      alt={pet.name}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                      </svg>
                    </div>
                  )}
                  
                  {/* Status Badge Overlay */}
                  <div className="absolute top-3 right-3 flex flex-col gap-1">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusClass(pet.status)}`}>
                      {getStatusDisplay(pet.status)}
                    </span>
                    {hasPendingRequests(pet) && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200">
                        {pet.fosterRequests!.filter(req => req.status === 'pending').length} pending
                      </span>
                    )}
                    {hasFosterRequests(pet) && !hasPendingRequests(pet) && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                        {pet.fosterRequests!.length} requests
                      </span>
                    )}
                  </div>
                </div>
                
                {/* Pet Info - This section will grow to fill available space */}
                <div className="p-5 flex-1 flex flex-col">
                  <div className="mb-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 truncate">{pet.name}</h3>
                    </div>
                    <div className="flex flex-wrap gap-1 mb-2">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                        {pet.breed || 'Mixed Breed'}
                      </span>
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                        {pet.age || 'N/A'} years
                      </span>
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                        {pet.gender}
                      </span>
                    </div>
                  </div>

                  <p className="text-sm text-gray-600 mb-4 line-clamp-2 flex-1">
                    {pet.description || 'No description available.'}
                  </p>
                  
                  {/* Location - Only show if location exists */}
                  {pet.location && (
                    <div className="flex items-center text-sm text-gray-600 mb-2">
                      <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                      </svg>
                      <span className="truncate">{pet.location}</span>
                    </div>
                  )}

                  {/* Current Foster Info */}
                  {pet.currentFoster && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                      <p className="text-sm text-blue-800 font-medium">
                        Currently with: {pet.currentFoster.name}
                      </p>
                      <p className="text-xs text-blue-600">{pet.currentFoster.email}</p>
                    </div>
                  )}

                  {/* Stats */}
                  <div className="flex justify-between text-sm text-gray-500 mb-4">
                    <span>{getDaysAgo(pet.createdAt)}</span>
                    {hasFosterRequests(pet) && (
                      <span className="text-[var(--pc-primary)] font-medium">
                        {pet.fosterRequests!.length} requests
                      </span>
                    )}
                  </div>
                </div>

                {/* Fixed Actions Section - Always at the bottom */}
                <div className="px-5 pb-5 pt-4 border-t border-gray-200 bg-white">
                  <div className="flex justify-between items-center">
                    <div className="flex gap-3">
                      <button 
                        onClick={() => viewPetDetails(pet._id)}
                        className="text-[var(--pc-primary)] hover:text-[var(--pc-primary-dark)] text-sm font-medium transition-colors duration-200 flex items-center gap-1"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                        </svg>
                        View
                      </button>
                      
                      {/* Always show Manage button, but conditionally style it */}
                      <button 
                        onClick={() => manageFosterRequests(pet._id)}
                        className={`text-sm font-medium transition-colors duration-200 flex items-center gap-1 ${
                          hasFosterRequests(pet) 
                            ? hasPendingRequests(pet)
                              ? 'text-yellow-600 hover:text-yellow-700' 
                              : 'text-green-600 hover:text-green-700'
                            : 'text-gray-400 cursor-not-allowed'
                        }`}
                        disabled={!hasFosterRequests(pet)}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                        </svg>
                        Manage
                      </button>
                    </div>
                    
                    <button 
                      onClick={() => handleDeleteListing(pet._id)}
                      className="text-red-600 hover:text-red-700 text-sm transition-colors duration-200 flex items-center gap-1"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                      </svg>
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="pc-card max-w-md w-full">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"/>
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Listing</h3>
              <p className="text-gray-600 mb-6">Are you sure you want to delete this pet listing? This action cannot be undone.</p>
              <div className="flex gap-3 justify-center">
                <button 
                  onClick={() => setShowDeleteModal(false)}
                  className="pc-btn pc-btn-outline"
                >
                  Cancel
                </button>
                <button 
                  onClick={confirmDelete}
                  className="pc-btn bg-red-600 hover:bg-red-700 text-white"
                >
                  Delete Listing
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyListings;