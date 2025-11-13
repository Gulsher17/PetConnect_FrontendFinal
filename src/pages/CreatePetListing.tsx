// src/pages/CreatePetListing.tsx
import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import NavBar from "../components/layout/NavBar";
import Footer from "../components/layout/Footer";
import { http } from "../lib/http";

export default function CreatePetListing() {
  const [formData, setFormData] = useState({
    name: "",
    breed: "",
    age: "",
    gender: "",
    description: "",
    careInstructions: "",
    location: "",
    contactInfo: "",
    duration: ""
  });
  const [images, setImages] = useState<File[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const nav = useNavigate();

  // Your brand colors
  const primaryOrange = '#E76F51';

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [id]: value
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setImages(prev => [...prev, ...files]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files) {
      const files = Array.from(e.dataTransfer.files).filter(file => 
        file.type.startsWith('image/')
      );
      setImages(prev => [...prev, ...files]);
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const validateStep = (step: number): boolean => {
    setErr(null);
    switch (step) {
      case 1:
        if (!formData.name.trim()) {
          setErr("Please enter pet name");
          return false;
        }
        if (!formData.gender) {
          setErr("Please select gender");
          return false;
        }
        if (!formData.duration) {
          setErr("Please select foster duration");
          return false;
        }
        return true;
      case 2:
        if (!formData.description.trim()) {
          setErr("Please enter description");
          return false;
        }
        if (formData.description.trim().length < 50) {
          setErr("Description should be at least 50 characters long");
          return false;
        }
        if (!formData.location.trim()) {
          setErr("Please enter location");
          return false;
        }
        if (!formData.contactInfo.trim()) {
          setErr("Please enter contact information");
          return false;
        }
        return true;
      case 3:
        if (images.length === 0) {
          setErr("Please upload at least one photo");
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => prev - 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErr(null);

    if (!validateStep(3)) {
      setSubmitting(false);
      return;
    }

    try {
      const submitData = new FormData();
      
      // Append form data
      submitData.append('name', formData.name);
      submitData.append('breed', formData.breed || 'Mixed');
      submitData.append('age', formData.age || '0');
      submitData.append('gender', formData.gender);
      submitData.append('description', formData.description);
      submitData.append('careInstructions', formData.careInstructions || 'Standard care required');
      submitData.append('location', formData.location);
      submitData.append('contactInfo', formData.contactInfo);
      submitData.append('duration', formData.duration);

      // Append images
      images.forEach((image) => {
        submitData.append('images', image);
      });

      // Use your existing http library - it should handle auth automatically
      const { data } = await http.post("/pet-files/user-pet/upload", submitData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (data.success) {
        nav("/user-listings", { replace: true });
      } else {
        setErr(data.msg || "Failed to create listing. Please try again.");
      }
    } catch (e: any) {
      console.error('Submission error:', e);
      // Check if it's an authentication error
      if (e.response?.status === 401) {
        setErr("Your session has expired. Please log in again.");
        // Redirect to login after a delay
        setTimeout(() => nav('/login'), 2000);
      } else {
        setErr(e.response?.data?.msg || "Failed to create listing. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const steps = [
    { number: 1, title: 'Pet Details', description: 'Basic information' },
    { number: 2, title: 'Description', description: 'Care & location' },
    { number: 3, title: 'Photos', description: 'Upload images' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white">
      <NavBar />
      
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="text-center mb-12">
          <div 
            className="inline-flex items-center justify-center w-20 h-20 rounded-3xl shadow-2xl mb-6"
            style={{ backgroundColor: primaryOrange }}
          >
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            List Your Pet for Fostering
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Help your furry friend find a temporary loving home while you're away
          </p>
        </div>

        {/* Progress Steps - Orange Style */}
        <div className="mb-12">
          <div className="flex items-center justify-between relative">
            <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-200 -translate-y-1/2 -z-10 rounded-full"></div>
            <div 
              className="absolute top-1/2 left-0 h-1 -translate-y-1/2 -z-10 rounded-full transition-all duration-500"
              style={{ 
                width: `${((currentStep - 1) / (steps.length - 1)) * 100}%`,
                backgroundColor: primaryOrange 
              }}
            ></div>
            
            {steps.map((step, index) => (
              <div key={step.number} className="flex flex-col items-center relative">
                <div 
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                    currentStep > step.number 
                      ? 'shadow-lg' 
                      : currentStep === step.number
                      ? 'shadow-2xl scale-110'
                      : 'bg-white border-2 border-gray-300 shadow-lg'
                  }`}
                  style={{ 
                    backgroundColor: currentStep >= step.number ? primaryOrange : '',
                    borderColor: currentStep === step.number ? primaryOrange : ''
                  }}
                >
                  {currentStep > step.number ? (
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <span className={`text-lg font-semibold ${
                      currentStep >= step.number ? 'text-white' : 'text-gray-400'
                    }`}>
                      {step.number}
                    </span>
                  )}
                </div>
                <div className="mt-3 text-center">
                  <p className={`font-semibold text-sm ${
                    currentStep >= step.number ? 'text-gray-900' : 'text-gray-500'
                  }`}>
                    {step.title}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="p-8">
            {err && (
              <div className="mb-8 bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center space-x-3">
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-red-700 font-medium">{err}</p>
              </div>
            )}

            <form onSubmit={onSubmit} className="space-y-8">
              {/* Step 1: Basic Information */}
              {currentStep === 1 && (
                <div className="space-y-8">
                  <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-gray-900">Tell us about your pet</h2>
                    <p className="text-gray-600 mt-2">Basic information to get started</p>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700">
                        Pet Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200"
                        placeholder="e.g., Max, Luna, Charlie..."
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700">
                        Breed
                      </label>
                      <input
                        type="text"
                        id="breed"
                        value={formData.breed}
                        onChange={handleInputChange}
                        className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200"
                        placeholder="Golden Retriever, Mixed, etc."
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700">
                        Age (years)
                      </label>
                      <input
                        type="number"
                        id="age"
                        value={formData.age}
                        onChange={handleInputChange}
                        min="0"
                        max="30"
                        className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700">
                        Gender <span className="text-red-500">*</span>
                      </label>
                      <select
                        id="gender"
                        value={formData.gender}
                        onChange={handleInputChange}
                        required
                        className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200 appearance-none"
                      >
                        <option value="">Select Gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                      </select>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700">
                        Foster Duration <span className="text-red-500">*</span>
                      </label>
                      <select
                        id="duration"
                        value={formData.duration}
                        onChange={handleInputChange}
                        required
                        className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200 appearance-none"
                      >
                        <option value="">Select Duration</option>
                        <option value="short_term">Short Term (1-2 weeks)</option>
                        <option value="medium_term">Medium Term (3-4 weeks)</option>
                        <option value="long_term">Long Term (1+ months)</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end pt-6">
                    <button
                      type="button"
                      onClick={nextStep}
                      className="px-8 py-4 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-all duration-300 font-semibold transform hover:-translate-y-0.5 shadow-lg hover:shadow-xl"
                    >
                      Continue to Description
                      <svg className="w-5 h-5 ml-2 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}

              {/* Step 2: Description & Location */}
              {currentStep === 2 && (
                <div className="space-y-8">
                  <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-gray-900">Describe your pet's needs</h2>
                    <p className="text-gray-600 mt-2">Help fosters understand your pet better</p>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700">
                        Description <span className="text-red-500">*</span>
                        <span className="text-xs font-normal text-gray-500 ml-2">
                          {formData.description.length}/50 characters minimum
                        </span>
                      </label>
                      <textarea
                        id="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        required
                        rows={4}
                        className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200 resize-none"
                        placeholder="Tell potential fosters about your pet's personality, likes, dislikes, behavior with other pets, and any special characteristics..."
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700">
                        Care Instructions
                      </label>
                      <textarea
                        id="careInstructions"
                        value={formData.careInstructions}
                        onChange={handleInputChange}
                        rows={3}
                        className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200 resize-none"
                        placeholder="Feeding schedule, exercise needs, medication, vet information, special care requirements..."
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4">
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700">
                        Location <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="location"
                        value={formData.location}
                        onChange={handleInputChange}
                        required
                        className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200"
                        placeholder="City, State or Area"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700">
                        Contact Info <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="contactInfo"
                        value={formData.contactInfo}
                        onChange={handleInputChange}
                        required
                        className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200"
                        placeholder="Phone number or email"
                      />
                      <p className="text-xs text-gray-500 mt-2">This will be shared with potential fosters</p>
                    </div>
                  </div>

                  <div className="flex justify-between pt-6">
                    <button
                      type="button"
                      onClick={prevStep}
                      className="px-8 py-4 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-200 font-semibold flex items-center"
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={nextStep}
                      className="px-8 py-4 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-all duration-300 font-semibold transform hover:-translate-y-0.5 shadow-lg hover:shadow-xl"
                    >
                      Continue to Photos
                      <svg className="w-5 h-5 ml-2 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3: Photos */}
              {currentStep === 3 && (
                <div className="space-y-8">
                  <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-gray-900">Add some photos</h2>
                    <p className="text-gray-600 mt-2">Showcase your pet with beautiful images</p>
                  </div>

                  <div className="space-y-6">
                    <div
                      className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300 cursor-pointer ${
                        isDragging 
                          ? 'border-orange-500 bg-orange-50 scale-105' 
                          : 'border-gray-300 hover:border-orange-400 hover:bg-orange-50'
                      }`}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                      
                      <div className="space-y-4">
                        <div className="w-20 h-20 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto">
                          <svg className="w-10 h-10 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-lg font-semibold text-gray-900">
                            {isDragging ? 'Drop images here' : 'Upload photos'}
                          </p>
                          <p className="text-gray-600 mt-2">
                            Drag & drop or click to browse files
                          </p>
                          <p className="text-sm text-gray-500 mt-1">
                            PNG, JPG, GIF up to 15MB each
                          </p>
                        </div>
                      </div>
                    </div>

                    {images.length > 0 && (
                      <div className="space-y-4">
                        <h3 className="font-semibold text-gray-900">Selected Photos ({images.length})</h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                          {images.map((image, index) => (
                            <div key={index} className="relative group">
                              <div className="aspect-square rounded-xl overflow-hidden bg-gray-100 shadow-lg">
                                <img 
                                  src={URL.createObjectURL(image)} 
                                  alt={`Preview ${index + 1}`}
                                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                                />
                              </div>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeImage(index);
                                }}
                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-7 h-7 flex items-center justify-center text-sm opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-lg hover:scale-110"
                              >
                                ×
                              </button>
                              {index === 0 && (
                                <div className="absolute top-2 left-2 bg-orange-500 text-white text-xs px-2 py-1 rounded-full shadow-lg">
                                  Primary
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-between pt-8">
                    <button
                      type="button"
                      onClick={prevStep}
                      className="px-8 py-4 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-200 font-semibold flex items-center"
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-8 py-4 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-all duration-300 font-semibold transform hover:-translate-y-0.5 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:transform-none disabled:hover:shadow-lg"
                    >
                      {submitting ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                          Creating Listing...
                        </>
                      ) : (
                        <>
                          Create Pet Listing
                          <svg className="w-5 h-5 ml-2 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}