import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { useAuth } from "../features/auth/useAuth";
import { http } from "../lib/http";
import NavBar from "../components/layout/NavBar";
import Footer from "../components/layout/Footer";

// Orange theme with professional gradient matching VetDashboard
const ORANGE_THEME = {
  primary: 'rgb(231, 111, 81)',
  primaryLight: 'rgba(231, 111, 81, 0.15)',
  primaryLighter: 'rgba(231, 111, 81, 0.08)',
  primaryDark: 'rgb(200, 90, 65)',
  white: 'rgb(255, 255, 255)',
  gradient: 'linear-gradient(135deg, rgb(231, 111, 81) 0%, rgb(233, 136, 112) 100%)'
};

// Aura Effect Component matching VetDashboard
const AuraEffect = ({ 
  intensity = 1, 
  size = 200, 
  className = "",
  color = ORANGE_THEME.primaryLight,
  blur = 20 
}) => (
  <div 
    className={`absolute pointer-events-none ${className}`}
    style={{
      width: size,
      height: size,
      background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
      filter: `blur(${intensity * blur}px)`,
      opacity: intensity * 0.4,
    }}
  />
);

// Floating Particles Background matching VetDashboard
const FloatingParticles = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    {[...Array(15)].map((_, i) => (
      <div
        key={i}
        className="absolute rounded-full animate-float"
        style={{
          width: Math.random() * 100 + 50,
          height: Math.random() * 100 + 50,
          background: `rgba(231, 111, 81, ${Math.random() * 0.1 + 0.05})`,
          top: `${Math.random() * 100}%`,
          left: `${Math.random() * 100}%`,
          animationDelay: `${Math.random() * 20}s`,
          animationDuration: `${Math.random() * 30 + 30}s`,
        }}
      />
    ))}
  </div>
);

// Professional Stat Card with Glass Morphism matching VetDashboard
const StatCard: React.FC<{ title: string; value: number | string; icon: string; color?: string }> = ({ 
  title, value, icon, color = "orange" 
}) => {
  const colorConfig = {
    orange: {
      bg: 'bg-orange-500/10',
      border: 'border-orange-200',
      text: 'text-orange-600',
      iconBg: 'bg-orange-500'
    },
    green: {
      bg: 'bg-green-500/10',
      border: 'border-green-200',
      text: 'text-green-600',
      iconBg: 'bg-green-500'
    },
    yellow: {
      bg: 'bg-yellow-500/10',
      border: 'border-yellow-200',
      text: 'text-yellow-600',
      iconBg: 'bg-yellow-500'
    },
    purple: {
      bg: 'bg-purple-500/10',
      border: 'border-purple-200',
      text: 'text-purple-600',
      iconBg: 'bg-purple-500'
    }
  };

  const config = colorConfig[color as keyof typeof colorConfig] || colorConfig.orange;

  return (
    <div className={`relative overflow-hidden rounded-2xl border ${config.border} ${config.bg} p-6 backdrop-blur-sm transition-all duration-500 hover:scale-105 hover:shadow-2xl group`}>
      <AuraEffect intensity={0.3} size={120} className="-top-8 -right-8 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-semibold text-gray-600 mb-2">{title}</p>
          <p className={`text-3xl font-bold ${config.text} mb-1`}>{value}</p>
        </div>
        
        <div className={`w-12 h-12 rounded-xl ${config.iconBg} flex items-center justify-center text-white text-lg shadow-lg`}>
          {icon}
        </div>
      </div>
    </div>
  );
};

// Professional Tab Navigation matching VetDashboard
const TabButton = ({ active, onClick, icon, label, count }: { 
  active: boolean; 
  onClick: () => void; 
  icon: string; 
  label: string;
  count?: number;
}) => (
  <button
    onClick={onClick}
    className={`relative flex items-center space-x-3 py-4 px-6 font-semibold border-b-2 transition-all duration-300 group ${
      active 
        ? `border-orange-500 text-orange-600 bg-orange-50/50` 
        : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50/50"
    }`}
  >
    <span className="text-xl transition-transform duration-300 group-hover:scale-110">{icon}</span>
    <span className="text-sm">{label}</span>
    {count !== undefined && (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
        active ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-600'
      }`}>
        {count}
      </span>
    )}
    {active && (
      <AuraEffect intensity={0.5} size={80} className="-bottom-4 left-1/2 transform -translate-x-1/2" />
    )}
  </button>
);

// Loading Spinner with Enhanced Aura matching VetDashboard
const LoadingSpinner: React.FC = () => (
  <div className="flex justify-center items-center py-12">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
  </div>
);

// Enhanced Empty State with Glass Morphism
const EmptyState: React.FC<{ message: string; icon?: string; action?: React.ReactNode }> = ({ 
  message, icon = "📊", action 
}) => (
  <div className="text-center py-12 bg-gradient-to-br from-orange-50/50 to-white rounded-2xl border-2 border-dashed border-orange-300">
    <div className="text-6xl mb-4">{icon}</div>
    <p className="text-xl font-bold text-gray-900 mb-3 bg-gradient-to-r from-orange-600 to-orange-400 bg-clip-text text-transparent">
      {message}
    </p>
    {action}
  </div>
);

// Enhanced Status Badge with Orange Theme
const StatusBadge: React.FC<{ status: string; type?: "pet" | "request" }> = ({ status, type = "pet" }) => {
  const base = "inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold transition-all duration-200";
  
  if (type === "request") {
    switch (status) {
      case "pending": return <span className={`${base} bg-yellow-100 text-yellow-800 border border-yellow-200 shadow-sm`}>Pending</span>;
      case "approved": return <span className={`${base} bg-green-100 text-green-800 border border-green-200 shadow-sm`}>Approved</span>;
      case "rejected": return <span className={`${base} bg-red-100 text-red-800 border border-red-200 shadow-sm`}>Rejected</span>;
      case "completed": return <span className={`${base} bg-blue-100 text-blue-800 border border-blue-200 shadow-sm`}>Completed</span>;
      default: return <span className={`${base} bg-gray-100 text-gray-700 border border-gray-200 shadow-sm`}>{status}</span>;
    }
  }

  switch (status) {
    case "available": return <span className={`${base} bg-green-100 text-green-800 border border-green-200 shadow-sm`}>Available</span>;
    case "training": return <span className={`${base} bg-orange-100 text-orange-800 border border-orange-200 shadow-sm`}>Training</span>;
    case "adopted": return <span className={`${base} bg-blue-100 text-blue-800 border border-blue-200 shadow-sm`}>Adopted</span>;
    case "unavailable": return <span className={`${base} bg-gray-100 text-gray-800 border border-gray-200 shadow-sm`}>Unavailable</span>;
    default: return <span className={`${base} bg-gray-100 text-gray-700 border border-gray-200 shadow-sm`}>{status}</span>;
  }
};

// Default avatar function matching VetDashboard
const getDefaultAvatar = (name: string) => {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=rgb(231,111,81)&color=fff&size=128&bold=true`;
};

// Rest of your interfaces remain exactly the same
interface Pet {
  _id: string;
  name: string;
  breed: string;
  age: number;
  gender: string;
  status: string;
  images: string[];
  trainingNotes?: string;
  organization?: {
    name: string;
  };
  trainer?: string;
}

interface TrainingRequest {
  _id: string;
  pet: Pet | null;
  adopter: {
    name: string;
    email: string;
  };
  sessionType: string;
  duration: number;
  price: number;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  notes?: string;
  specialInstructions?: string;
  preferredDates: Array<{
    date: string;
    timeSlot: string;
  }>;
  createdAt: string;
  trainerResponse?: {
    responseDate: string;
    message: string;
  };
}

interface BehaviorAssessment {
  _id: string;
  pet: Pet;
  trainer: {
    name: string;
    email: string;
  };
  behaviorProfile: {
    energyLevel: string;
    socialBehavior: {
      withAdults: string;
      withChildren: string;
      withStrangers: string;
      withOtherPets: string;
    };
    trainability: {
      intelligence: string;
      obedience: string;
      trainingProgress: string;
    };
    environmentNeeds: {
      spaceRequired: string;
      exerciseNeeds: string;
    };
  };
  trainerNotes: string;
  assessmentDate: string;
  followUpRequired: boolean;
  nextAssessmentDate?: string;
  recommendations: string[];
  compatibilityScores: {
    withFamilies: number;
    withSingles: number;
    withSeniors: number;
    withExperiencedOwners: number;
    withFirstTimeOwners: number;
  };
  createdAt: string;
}

interface TrainingSession {
  _id: string;
  pet: Pet;
  trainer: {
    name: string;
    email: string;
  };
  behaviorAssessment?: string;
  sessionDetails: {
    sessionDate: string;
    duration: number;
    sessionType: string;
    focusAreas: string[];
  };
  progressMetrics: {
    commandPerformance: {
      sit: number;
      stay: number;
      come: number;
      heel: number;
      down: number;
    };
    behaviorScores: {
      attentionSpan: number;
      impulseControl: number;
      socialConfidence: number;
      stressTolerance: number;
      overallProgress: number;
    };
    challengesEncountered: string[];
    breakthroughs: string[];
    milestones: string[];
  };
  trainerObservations: {
    strengthsNoted: string[];
    areasForImprovement: string[];
    sessionSummary: string;
    homework: string[];
    nextSessionFocus: string[];
  };
  progressFromPrevious: string;
  recommendations: {
    nextSessionDate?: string;
    suggestedSessionType: string;
    priorityLevel: string;
  };
  status: string;
  createdAt: string;
}

// API calls remain exactly the same
const trainerAPI = {
  getMyTrainees: (): Promise<{ success: boolean; pets: Pet[]; count?: number }> => 
    http.get("/trainer/my-trainees").then(res => res.data),
  
  getTrainingRequests: (): Promise<{ success: boolean; requests: TrainingRequest[]; count?: number }> => 
    http.get("/training-requests/trainer/requests").then(res => res.data),
  
  getBehaviorAssessments: (petId: string): Promise<{ success: boolean; assessments: BehaviorAssessment[]; pet?: Pet }> => 
    http.get(`/trainer/pets/${petId}/behavior-assessments`).then(res => res.data),
  
  getUpcomingSessions: (): Promise<{ success: boolean; upcomingSessions: TrainingSession[]; count?: number }> => 
    http.get("/trainer/upcoming-sessions").then(res => res.data),
  
  getPetsNeedingFollowup: (): Promise<{ success: boolean; needsFollowup: BehaviorAssessment[]; count?: number }> => 
    http.get("/trainer/needs-followup").then(res => res.data),
  
  createBehaviorAssessment: (petId: string, data: any): Promise<{ success: boolean; assessment: BehaviorAssessment; message?: string }> => 
    http.post(`/trainer/pets/${petId}/behavior-assessments`, data).then(res => res.data),
  
  createTrainingSession: (petId: string, data: any): Promise<{ success: boolean; session: TrainingSession; message?: string }> => 
    http.post(`/trainer/pets/${petId}/training-sessions`, data).then(res => res.data),
  
  approveTrainingRequest: (requestId: string, data: any): Promise<{ success: boolean; message?: string }> => 
    http.patch(`/training-requests/requests/${requestId}/approve`, data).then(res => res.data),
  
  rejectTrainingRequest: (requestId: string, data: any): Promise<{ success: boolean; message?: string }> => 
    http.patch(`/training-requests/requests/${requestId}/reject`, data).then(res => res.data)
};

// Enhanced Assessment Form with Glass Morphism
const AssessmentForm: React.FC<{
  pets: Pet[];
  selectedPet: string;
  onSubmit: (data: { petId: string; data: any }) => void;
  isLoading: boolean;
  onReset: () => void;
}> = ({ pets, selectedPet, onSubmit, isLoading, onReset }) => {
  const [formData, setFormData] = useState({
    petId: selectedPet || "",
    energyLevel: "moderate" as "very_low" | "low" | "moderate" | "high" | "very_high",
    socialAdults: "friendly" as "shy" | "cautious" | "friendly" | "very_friendly" | "overly_excited",
    socialChildren: "good" as "not_recommended" | "supervised_only" | "good" | "excellent",
    socialStrangers: "cautious" as "fearful" | "cautious" | "neutral" | "friendly",
    socialOtherPets: "selective" as "not_recommended" | "selective" | "good" | "excellent",
    intelligence: "average" as "low" | "average" | "high" | "very_high",
    obedience: "selective" as "stubborn" | "selective" | "obedient" | "eager_to_please",
    trainingProgress: "beginner" as "beginner" | "intermediate" | "advanced" | "expert",
    spaceRequired: "small_yard" as "apartment_ok" | "small_yard" | "large_yard" | "rural",
    exerciseNeeds: "moderate" as "low" | "moderate" | "high" | "very_high",
    trainerNotes: "",
    followUpRequired: false,
    nextAssessmentDate: ""
  });

  useEffect(() => {
    if (selectedPet) {
      setFormData(prev => ({ ...prev, petId: selectedPet }));
    }
  }, [selectedPet]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.petId) {
      toast.error("Please select a pet");
      return;
    }

    // Structure data to match backend BehaviorAssessmentSchema
    const assessmentData = {
      behaviorProfile: {
        energyLevel: formData.energyLevel,
        socialBehavior: {
          withAdults: formData.socialAdults,
          withChildren: formData.socialChildren,
          withStrangers: formData.socialStrangers,
          withOtherPets: formData.socialOtherPets
        },
        trainability: {
          intelligence: formData.intelligence,
          obedience: formData.obedience,
          trainingProgress: formData.trainingProgress
        },
        environmentNeeds: {
          spaceRequired: formData.spaceRequired,
          exerciseNeeds: formData.exerciseNeeds,
          climateTolerance: "any" as const
        }
      },
      trainerNotes: formData.trainerNotes,
      followUpRequired: formData.followUpRequired,
      nextAssessmentDate: formData.followUpRequired && formData.nextAssessmentDate ? 
        new Date(formData.nextAssessmentDate).toISOString() : undefined,
      recommendations: []
    };

    console.log('📝 Submitting assessment:', assessmentData);
    onSubmit({
      petId: formData.petId,
      data: assessmentData
    });
  };

  const handleReset = () => {
    setFormData({
      petId: selectedPet || "",
      energyLevel: "moderate",
      socialAdults: "friendly",
      socialChildren: "good",
      socialStrangers: "cautious",
      socialOtherPets: "selective",
      intelligence: "average",
      obedience: "selective",
      trainingProgress: "beginner",
      spaceRequired: "small_yard",
      exerciseNeeds: "moderate",
      trainerNotes: "",
      followUpRequired: false,
      nextAssessmentDate: ""
    });
    onReset();
  };

  return (
    <div className="bg-gradient-to-br from-white to-orange-50/30 rounded-2xl border border-orange-100 p-6 shadow-lg">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-orange-400 rounded-xl flex items-center justify-center text-white text-lg">
          🧠
        </div>
        <div>
          <h3 className="font-bold text-xl text-gray-900">New Behavior Assessment</h3>
          <p className="text-sm text-gray-600">Comprehensive behavior evaluation</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2 group">
          <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
            <span className="text-orange-600">🐕</span>
            Select Pet <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.petId}
            onChange={(e) => setFormData(prev => ({ ...prev, petId: e.target.value }))}
            className="w-full bg-gradient-to-br from-white to-orange-50/50 border-2 border-orange-200 rounded-xl p-4 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-300 shadow-sm hover:shadow-md hover:border-orange-300 appearance-none cursor-pointer"
            required
          >
            <option value="" className="text-gray-400">Choose a pet...</option>
            {pets.map(pet => (
              <option key={pet._id} value={pet._id}>{pet.name} - {pet.breed}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2 group">
            <label className="block text-sm font-semibold text-gray-700">Energy Level</label>
            <select
              value={formData.energyLevel}
              onChange={(e) => setFormData(prev => ({ ...prev, energyLevel: e.target.value as any }))}
              className="w-full bg-gradient-to-br from-white to-orange-50/50 border-2 border-orange-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-300 shadow-sm hover:shadow-md hover:border-orange-300"
            >
              <option value="very_low">😴 Very Low</option>
              <option value="low">😊 Low</option>
              <option value="moderate">😄 Moderate</option>
              <option value="high">⚡ High</option>
              <option value="very_high">🔥 Very High</option>
            </select>
          </div>

          <div className="space-y-2 group">
            <label className="block text-sm font-semibold text-gray-700">Intelligence</label>
            <select
              value={formData.intelligence}
              onChange={(e) => setFormData(prev => ({ ...prev, intelligence: e.target.value as any }))}
              className="w-full bg-gradient-to-br from-white to-blue-50/50 border-2 border-blue-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 shadow-sm hover:shadow-md hover:border-blue-300"
            >
              <option value="low">🌟 Low</option>
              <option value="average">🧠 Average</option>
              <option value="high">💡 High</option>
              <option value="very_high">🎯 Very High</option>
            </select>
          </div>

          <div className="space-y-2 group">
            <label className="block text-sm font-semibold text-gray-700">Obedience</label>
            <select
              value={formData.obedience}
              onChange={(e) => setFormData(prev => ({ ...prev, obedience: e.target.value as any }))}
              className="w-full bg-gradient-to-br from-white to-green-50/50 border-2 border-green-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-300 shadow-sm hover:shadow-md hover:border-green-300"
            >
              <option value="stubborn">😤 Stubborn</option>
              <option value="selective">🤔 Selective</option>
              <option value="obedient">👍 Obedient</option>
              <option value="eager_to_please">⭐ Eager to Please</option>
            </select>
          </div>

          <div className="space-y-2 group">
            <label className="block text-sm font-semibold text-gray-700">Training Progress</label>
            <select
              value={formData.trainingProgress}
              onChange={(e) => setFormData(prev => ({ ...prev, trainingProgress: e.target.value as any }))}
              className="w-full bg-gradient-to-br from-white to-purple-50/50 border-2 border-purple-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-300 shadow-sm hover:shadow-md hover:border-purple-300"
            >
              <option value="beginner">🆕 Beginner</option>
              <option value="intermediate">📈 Intermediate</option>
              <option value="advanced">🏆 Advanced</option>
              <option value="expert">💎 Expert</option>
            </select>
          </div>
        </div>

        <div className="space-y-2 group">
          <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
            <span className="text-orange-600">📝</span>
            Trainer Notes <span className="text-red-500">*</span>
          </label>
          <textarea
            value={formData.trainerNotes}
            onChange={(e) => setFormData(prev => ({ ...prev, trainerNotes: e.target.value }))}
            rows={4}
            className="w-full bg-gradient-to-br from-white to-orange-50/50 border-2 border-orange-200 rounded-xl p-4 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-300 shadow-sm hover:shadow-md hover:border-orange-300 resize-vertical"
            placeholder="Enter detailed assessment notes, observations, and recommendations..."
            required
          />
        </div>

        <div className="flex items-center gap-4 p-4 bg-gradient-to-br from-gray-50 to-orange-50 rounded-xl border border-orange-200">
          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={formData.followUpRequired}
              onChange={(e) => setFormData(prev => ({ ...prev, followUpRequired: e.target.checked }))}
              className="w-5 h-5 text-orange-600 border-2 border-gray-300 rounded focus:ring-orange-500"
            />
            <span className="text-sm font-semibold text-gray-700">Follow-up Required</span>
          </label>

          {formData.followUpRequired && (
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Next Assessment Date</label>
              <input
                type="date"
                value={formData.nextAssessmentDate}
                onChange={(e) => setFormData(prev => ({ ...prev, nextAssessmentDate: e.target.value }))}
                className="w-full p-3 border-2 border-orange-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all bg-white"
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
          )}
        </div>

        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={handleReset}
            className="flex-1 bg-gradient-to-r from-gray-100 to-gray-50 text-gray-700 px-6 py-4 rounded-xl hover:from-gray-200 hover:to-gray-100 transition-all duration-200 font-semibold border-2 border-gray-300 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            disabled={isLoading}
          >
            <span>🗑️</span>
            Reset Form
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="flex-1 bg-gradient-to-r from-orange-600 to-orange-500 text-white px-6 py-4 rounded-xl hover:from-orange-700 hover:to-orange-600 transition-all duration-200 font-semibold shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transform hover:scale-[1.02]"
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Creating Assessment...
              </>
            ) : (
              <>
                <span className="text-lg">✨</span>
                Create Behavior Assessment
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

// Enhanced Session Form with Glass Morphism
const SessionForm: React.FC<{
  pets: Pet[];
  selectedPet: string;
  onSubmit: (data: { petId: string; data: any }) => void;
  isLoading: boolean;
  onReset: () => void;
}> = ({ pets, selectedPet, onSubmit, isLoading, onReset }) => {
  const [formData, setFormData] = useState({
    petId: selectedPet || "",
    sessionDate: new Date().toISOString().split('T')[0],
    duration: 60,
    sessionType: "obedience_basic" as "obedience_basic" | "obedience_advanced" | "behavior_modification" | "socialization" | "aggression_management" | "anxiety_reduction" | "special_skills" | "therapy_prep" | "service_training",
    focusAreas: [] as string[],
    sessionSummary: "",
    strengthsNoted: [] as string[],
    areasForImprovement: [] as string[],
    progressFromPrevious: "slight_improvement" as "significant_regression" | "slight_regression" | "no_change" | "slight_improvement" | "significant_improvement"
  });

  useEffect(() => {
    if (selectedPet) {
      setFormData(prev => ({ ...prev, petId: selectedPet }));
    }
  }, [selectedPet]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.petId) {
      toast.error("Please select a pet");
      return;
    }

    // Structure data to match backend TrainingSession schema with CORRECT enum values
    const sessionData = {
      sessionDetails: {
        sessionDate: new Date(formData.sessionDate).toISOString(),
        duration: formData.duration,
        sessionType: formData.sessionType, // Now uses correct enum values
        focusAreas: formData.focusAreas
      },
      trainerObservations: {
        sessionSummary: formData.sessionSummary,
        strengthsNoted: formData.strengthsNoted,
        areasForImprovement: formData.areasForImprovement,
        homework: [],
        nextSessionFocus: []
      },
      progressFromPrevious: formData.progressFromPrevious
    };

    console.log('🎯 Submitting session:', sessionData);
    onSubmit({
      petId: formData.petId,
      data: sessionData
    });
  };

  const handleReset = () => {
    setFormData({
      petId: selectedPet || "",
      sessionDate: new Date().toISOString().split('T')[0],
      duration: 60,
      sessionType: "obedience_basic",
      focusAreas: [],
      sessionSummary: "",
      strengthsNoted: [],
      areasForImprovement: [],
      progressFromPrevious: "slight_improvement"
    });
    onReset();
  };

  const addFocusArea = () => {
    const area = prompt("Enter focus area:");
    if (area && !formData.focusAreas.includes(area)) {
      setFormData(prev => ({
        ...prev,
        focusAreas: [...prev.focusAreas, area]
      }));
    }
  };

  const removeFocusArea = (area: string) => {
    setFormData(prev => ({
      ...prev,
      focusAreas: prev.focusAreas.filter(a => a !== area)
    }));
  };

  return (
    <div className="bg-gradient-to-br from-white to-green-50/30 rounded-2xl border border-green-100 p-6 shadow-lg">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center text-white text-lg">
          🎯
        </div>
        <div>
          <h3 className="font-bold text-xl text-gray-900">Record Training Session</h3>
          <p className="text-sm text-gray-600">Track training progress and outcomes</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2 group">
          <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
            <span className="text-orange-600">🐕</span>
            Select Pet <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.petId}
            onChange={(e) => setFormData(prev => ({ ...prev, petId: e.target.value }))}
            className="w-full bg-gradient-to-br from-white to-orange-50/50 border-2 border-orange-200 rounded-xl p-4 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-300 shadow-sm hover:shadow-md hover:border-orange-300 appearance-none cursor-pointer"
            required
          >
            <option value="" className="text-gray-400">Choose a pet...</option>
            {pets.map(pet => (
              <option key={pet._id} value={pet._id}>{pet.name} - {pet.breed}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2 group">
            <label className="block text-sm font-semibold text-gray-700">Session Date *</label>
            <input
              type="date"
              value={formData.sessionDate}
              onChange={(e) => setFormData(prev => ({ ...prev, sessionDate: e.target.value }))}
              className="w-full bg-gradient-to-br from-white to-orange-50/50 border-2 border-orange-200 rounded-xl p-4 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-300 shadow-sm hover:shadow-md hover:border-orange-300"
              required
            />
          </div>

          <div className="space-y-2 group">
            <label className="block text-sm font-semibold text-gray-700">Duration (minutes) *</label>
            <input
              type="number"
              value={formData.duration}
              onChange={(e) => setFormData(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
              className="w-full bg-gradient-to-br from-white to-green-50/50 border-2 border-green-200 rounded-xl p-4 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-300 shadow-sm hover:shadow-md hover:border-green-300"
              min="15"
              max="180"
              required
            />
          </div>
        </div>

        <div className="space-y-2 group">
          <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
            <span className="text-orange-600">📝</span>
            Session Summary <span className="text-red-500">*</span>
          </label>
          <textarea
            value={formData.sessionSummary}
            onChange={(e) => setFormData(prev => ({ ...prev, sessionSummary: e.target.value }))}
            rows={4}
            className="w-full bg-gradient-to-br from-white to-orange-50/50 border-2 border-orange-200 rounded-xl p-4 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-300 shadow-sm hover:shadow-md hover:border-orange-300 resize-vertical"
            placeholder="Describe the session activities, pet's response, techniques used, and overall outcomes..."
            required
          />
        </div>

        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={handleReset}
            className="flex-1 bg-gradient-to-r from-gray-100 to-gray-50 text-gray-700 px-6 py-4 rounded-xl hover:from-gray-200 hover:to-gray-100 transition-all duration-200 font-semibold border-2 border-gray-300 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            disabled={isLoading}
          >
            <span>🗑️</span>
            Reset Form
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-4 rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-200 font-semibold shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transform hover:scale-[1.02]"
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Recording Session...
              </>
            ) : (
              <>
                <span className="text-lg">✨</span>
                Record Training Session
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

// Enhanced Trainee Card Component
const TraineeCard = ({ pet, onAddAssessment, onAddSession }: {
  pet: Pet;
  onAddAssessment: (petId: string) => void;
  onAddSession: (petId: string) => void;
}) => {
  return (
    <div className="bg-gradient-to-r from-orange-50 to-white border-2 border-orange-100 rounded-2xl p-6 hover:shadow-xl transition-all duration-300 group">
      <AuraEffect intensity={0.2} size={100} className="opacity-0 group-hover:opacity-100 transition-opacity duration-500 -top-8 -right-8" />
      
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Pet Image */}
        <div className="flex-shrink-0">
          <div className="relative">
            <img 
              src={pet.images?.[0] || getDefaultAvatar(pet.name || 'P')}
              alt={pet.name}
              className="w-24 h-24 rounded-2xl object-cover border-4 border-white shadow-lg"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = getDefaultAvatar(pet.name || 'P');
              }}
            />
            <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-orange-500 rounded-full border-2 border-white flex items-center justify-center text-white text-xs">
              🐾
            </div>
          </div>
        </div>

        {/* Pet Info */}
        <div className="flex-1">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-4">
            <div>
              <h3 className="text-xl font-bold text-orange-700 mb-1">{pet.name}</h3>
              <div className="flex flex-wrap gap-2 text-sm text-gray-600 mb-2">
                <span>{pet.breed || 'Unknown breed'}</span>
                <span>•</span>
                <span>{pet.age || 'Unknown'} years</span>
                <span>•</span>
                <span>{pet.gender || 'Unknown gender'}</span>
              </div>
            </div>
            <StatusBadge status={pet.status} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-4">
            <div>
              <span className="font-semibold text-gray-700">Organization:</span>
              <span className="text-gray-600 ml-2">{pet.organization?.name || "Unknown"}</span>
            </div>
          </div>

          {pet.trainingNotes && (
            <div className="bg-white/50 rounded-xl p-3 border border-orange-200">
              <span className="font-semibold text-gray-700">Training Notes:</span>
              <p className="text-gray-600 text-sm mt-1">{pet.trainingNotes}</p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2 min-w-[140px]">
          <button
            onClick={() => onAddAssessment(pet._id)}
            className="bg-gradient-to-r from-orange-500 to-orange-400 text-white px-4 py-2 rounded-xl hover:from-orange-600 hover:to-orange-500 transition-all duration-300 font-semibold text-sm shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
          >
            <span>🧠</span>
            Add Assessment
          </button>
          <button
            onClick={() => onAddSession(pet._id)}
            className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-2 rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all duration-300 font-semibold text-sm shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
          >
            <span>🎯</span>
            Add Session
          </button>
        </div>
      </div>
    </div>
  );
};

// Enhanced Training Request Card
const TrainingRequestCard = ({ request, onApprove, onReject }: {
  request: TrainingRequest;
  onApprove: (requestId: string) => void;
  onReject: (requestId: string) => void;
}) => {
  return (
    <div className="bg-gradient-to-br from-white to-orange-50/30 rounded-2xl border border-orange-200 p-6 hover:shadow-xl transition-all duration-300 group">
      <AuraEffect intensity={0.2} size={100} className="opacity-0 group-hover:opacity-100 transition-opacity duration-500 -top-8 -right-8" />
      
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
        <div>
          <h3 className="text-xl font-bold text-orange-700 group-hover:text-orange-800 transition-colors">
            {request.pet?.name || "Unknown Pet"}
          </h3>
          <p className="text-gray-600">
            Requested by: {request.adopter?.name || "Unknown"} ({request.adopter?.email || "No email"})
          </p>
        </div>
        <StatusBadge status={request.status} type="request" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
        <div className="space-y-3">
          <div className="bg-white rounded-xl p-4 border border-blue-200 shadow-sm">
            <div className="text-sm font-semibold text-gray-900 mb-1">Session Details</div>
            <div className="text-sm text-gray-600">
              <div>Type: {request.sessionType}</div>
              <div>Duration: {request.duration} minutes</div>
              <div>Price: ${request.price}</div>
            </div>
          </div>
        </div>
        
        <div className="space-y-3">
          <div className="bg-white rounded-xl p-4 border border-green-200 shadow-sm">
            <div className="text-sm font-semibold text-gray-900 mb-1">Preferred Dates</div>
            {request.preferredDates && request.preferredDates.map((date, index) => (
              <div key={index} className="text-sm text-gray-600">
                {new Date(date.date).toLocaleDateString()} - {date.timeSlot}
              </div>
            ))}
          </div>
        </div>
      </div>

      {request.notes && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200 mb-4">
          <div className="text-sm font-semibold text-blue-700 mb-1 flex items-center gap-1">
            <span>💬</span>
            Adopter Notes
          </div>
          <p className="text-blue-800 text-sm">{request.notes}</p>
        </div>
      )}

      {request.specialInstructions && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-200 mb-4">
          <div className="text-sm font-semibold text-amber-700 mb-1 flex items-center gap-1">
            <span>⚠️</span>
            Special Instructions
          </div>
          <p className="text-amber-800 text-sm">{request.specialInstructions}</p>
        </div>
      )}

      <div className="text-sm text-gray-500 mb-4 flex items-center gap-1">
        <span>📅</span>
        Requested: {new Date(request.createdAt).toLocaleDateString()}
      </div>

      {request.status === 'pending' && (
        <div className="flex gap-3">
          <button
            onClick={() => onApprove(request._id)}
            className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-2 rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all duration-300 font-semibold shadow-sm hover:shadow-md disabled:opacity-50 flex items-center gap-2 transform hover:scale-105"
          >
            ✅ Approve
          </button>
          <button
            onClick={() => onReject(request._id)}
            className="bg-gradient-to-r from-red-500 to-pink-500 text-white px-4 py-2 rounded-xl hover:from-red-600 hover:to-pink-600 transition-all duration-300 font-semibold shadow-sm hover:shadow-md disabled:opacity-50 flex items-center gap-2 transform hover:scale-105"
          >
            ❌ Reject
          </button>
        </div>
      )}
    </div>
  );
};

// Enhanced Follow-up Assessment Card
const FollowUpCard = ({ assessment }: { assessment: BehaviorAssessment }) => {
  return (
    <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl border border-yellow-200 p-6 hover:shadow-lg transition-all duration-300 group">
      <AuraEffect intensity={0.2} size={80} className="opacity-0 group-hover:opacity-100 transition-opacity duration-500 -top-4 -right-4" />
      
      <div className="flex justify-between items-start mb-4">
        <div>
          <h4 className="text-lg font-bold text-orange-700 group-hover:text-orange-800 transition-colors">
            {assessment.pet?.name || "Unknown Pet"}
          </h4>
          <p className="text-sm text-gray-600">
            Last Assessment: {new Date(assessment.assessmentDate).toLocaleDateString()}
          </p>
        </div>
        <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs font-semibold">
          🔔 Follow-up Needed
        </span>
      </div>

      <p className="text-gray-700 text-sm mb-3">{assessment.trainerNotes}</p>
      
      {assessment.nextAssessmentDate && (
        <div className="bg-white/50 rounded-xl p-3 border border-yellow-200">
          <span className="text-sm font-semibold text-yellow-700">Next Assessment:</span>
          <p className="text-yellow-800 text-sm">{new Date(assessment.nextAssessmentDate).toLocaleDateString()}</p>
        </div>
      )}
    </div>
  );
};

// Enhanced Session Card
const SessionCard = ({ session }: { session: TrainingSession }) => {
  return (
    <div className="bg-gradient-to-br from-white to-blue-50/30 rounded-2xl border border-blue-200 p-6 hover:shadow-lg transition-all duration-300 group">
      <AuraEffect intensity={0.2} size={80} className="opacity-0 group-hover:opacity-100 transition-opacity duration-500 -top-4 -right-4" />
      
      <div className="flex justify-between items-start mb-4">
        <div>
          <h4 className="text-lg font-bold text-blue-700 group-hover:text-blue-800 transition-colors">
            {session.pet?.name || "Unknown Pet"}
          </h4>
          <p className="text-sm text-gray-600">
            {session.sessionDetails.sessionType} • {session.sessionDetails.duration} mins
          </p>
        </div>
        <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-semibold">
          {session.status || 'scheduled'}
        </span>
      </div>

      <p className="text-gray-700 text-sm mb-3">{session.trainerObservations.sessionSummary}</p>
      
      <div className="text-xs text-blue-600 flex items-center gap-1">
        <span>📅</span>
        {new Date(session.sessionDetails.sessionDate).toLocaleDateString()} at {' '}
        {new Date(session.sessionDetails.sessionDate).toLocaleTimeString()}
      </div>
    </div>
  );
};

// Main TrainerDashboard Component with Enhanced UI
export default function TrainerDashboard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"trainees" | "requests" | "assessments" | "sessions">("trainees");
  const [selectedPet, setSelectedPet] = useState<string>("");
  const [formResetKey, setFormResetKey] = useState(0);

  if (!user || user.role !== "trainer") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-orange-50 relative overflow-hidden">
        <FloatingParticles />
        <AuraEffect intensity={4} size={500} className="top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
        <div className="text-center bg-white/80 backdrop-blur-md rounded-3xl shadow-2xl p-12 max-w-md mx-4 border border-orange-200 relative z-10">
          <div className="text-8xl mb-6">🚫</div>
          <div className="text-3xl font-bold text-gray-900 mb-4">Access Restricted</div>
          <div className="text-gray-600 text-lg">Trainer authorization required to access this dashboard.</div>
        </div>
      </div>
    );
  }

  // All your existing queries, mutations, and logic remain exactly the same
  const { 
    data: traineesData, 
    isLoading: traineesLoading, 
    error: traineesError,
    refetch: refetchTrainees 
  } = useQuery({
    queryKey: ['trainer-trainees'],
    queryFn: trainerAPI.getMyTrainees,
    retry: 2
  });

  const { 
    data: requestsData, 
    isLoading: requestsLoading, 
    error: requestsError,
    refetch: refetchRequests 
  } = useQuery({
    queryKey: ['trainer-requests'],
    queryFn: trainerAPI.getTrainingRequests,
    retry: 2
  });

  const { 
    data: followupData, 
    isLoading: followupLoading, 
    error: followupError,
    refetch: refetchFollowup 
  } = useQuery({
    queryKey: ['trainer-followup'],
    queryFn: trainerAPI.getPetsNeedingFollowup,
    retry: 2
  });

  const { 
    data: sessionsData, 
    isLoading: sessionsLoading, 
    error: sessionsError,
    refetch: refetchSessions 
  } = useQuery({
    queryKey: ['trainer-sessions'],
    queryFn: trainerAPI.getUpcomingSessions,
    retry: 2
  });

  // Mutations remain exactly the same
  const createAssessmentMutation = useMutation({
    mutationFn: ({ petId, data }: { petId: string; data: any }) => 
      trainerAPI.createBehaviorAssessment(petId, data),
    onSuccess: (data, variables) => {
      if (data.success) {
        toast.success(data.message || "Behavior assessment created successfully!");
        queryClient.invalidateQueries({ queryKey: ['trainer-followup'] });
        queryClient.invalidateQueries({ queryKey: ['trainer-trainees'] });
        setFormResetKey(prev => prev + 1);
        setSelectedPet("");
      } else {
        toast.error(data.message || "Failed to create assessment");
      }
    },
    onError: (error: any) => {
      console.error('Assessment creation error:', error);
      toast.error(error.response?.data?.message || "Failed to create assessment. Please try again.");
    }
  });

  const createSessionMutation = useMutation({
    mutationFn: ({ petId, data }: { petId: string; data: any }) => 
      trainerAPI.createTrainingSession(petId, data),
    onSuccess: (data, variables) => {
      if (data.success) {
        toast.success(data.message || "Training session recorded successfully!");
        queryClient.invalidateQueries({ queryKey: ['trainer-sessions'] });
        queryClient.invalidateQueries({ queryKey: ['trainer-trainees'] });
        setFormResetKey(prev => prev + 1);
        setSelectedPet("");
      } else {
        toast.error(data.message || "Failed to record session");
      }
    },
    onError: (error: any) => {
      console.error('Session creation error:', error);
      toast.error(error.response?.data?.message || "Failed to record session. Please try again.");
    }
  });

  const approveRequestMutation = useMutation({
    mutationFn: ({ requestId, data }: { requestId: string; data: any }) => 
      trainerAPI.approveTrainingRequest(requestId, data),
    onSuccess: (data) => {
      if (data.success) {
        toast.success(data.message || "Training request approved!");
        queryClient.invalidateQueries({ queryKey: ['trainer-requests'] });
      } else {
        toast.error(data.message || "Failed to approve request");
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to approve request");
    }
  });

  const rejectRequestMutation = useMutation({
    mutationFn: ({ requestId, data }: { requestId: string; data: any }) => 
      trainerAPI.rejectTrainingRequest(requestId, data),
    onSuccess: (data) => {
      if (data.success) {
        toast.success(data.message || "Training request rejected");
        queryClient.invalidateQueries({ queryKey: ['trainer-requests'] });
      } else {
        toast.error(data.message || "Failed to reject request");
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to reject request");
    }
  });

  const trainees = traineesData?.success ? traineesData.pets || [] : [];
  const requests = requestsData?.success ? requestsData.requests || [] : [];
  const followupPets = followupData?.success ? followupData.needsFollowup || [] : [];
  const sessions = sessionsData?.success ? sessionsData.upcomingSessions || [] : [];

  useEffect(() => {
    if (traineesError) {
      toast.error('Failed to load trainees');
    }
    if (requestsError) {
      toast.error('Failed to load training requests');
    }
    if (sessionsError) {
      toast.error('Failed to load upcoming sessions');
    }
  }, [traineesError, requestsError, sessionsError]);

  const handleApproveRequest = (requestId: string) => {
    if (window.confirm('Are you sure you want to approve this training request?')) {
      approveRequestMutation.mutate({
        requestId,
        data: {
          message: 'Training request approved! Please contact me to schedule the session.',
          proposedDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          proposedTime: '10:00 AM'
        }
      });
    }
  };

  const handleRejectRequest = (requestId: string) => {
    const reason = prompt('Please provide a reason for rejecting this request:');
    if (reason === null) return;

    rejectRequestMutation.mutate({
      requestId,
      data: { message: reason }
    });
  };

  const formatSessionType = (sessionType: string) => {
    const typeMap: Record<string, string> = {
      'basic_obedience': 'Basic Obedience',
      'leash_training': 'Leash Training',
      'socialization': 'Socialization',
      'advanced_obedience': 'Advanced Obedience',
      'behavior_modification': 'Behavior Modification',
      'therapy_prep': 'Therapy Preparation',
      'obedience_basic': 'Basic Obedience',
      'obedience_advanced': 'Advanced Obedience',
      'aggression_management': 'Aggression Management'
    };
    return typeMap[sessionType] || sessionType;
  };

  const refreshData = () => {
    refetchTrainees();
    refetchRequests();
    refetchFollowup();
    refetchSessions();
    toast.success('Data refreshed successfully!');
  };

  const handleFormReset = () => {
    setFormResetKey(prev => prev + 1);
    toast.success('Form reset successfully!');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50 relative overflow-hidden">
      {/* Enhanced Background Effects */}
      <FloatingParticles />
      <AuraEffect intensity={3} size={800} className="-top-64 -left-64" />
      <AuraEffect intensity={2} size={600} className="-bottom-48 -right-48" />
      <AuraEffect intensity={1.5} size={400} className="top-1/4 right-1/4" color="rgba(233, 136, 112, 0.3)" />
      
      <NavBar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        {/* Enhanced Header matching VetDashboard */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-12">
          <div className="mb-6 lg:mb-0">
            <div className="flex items-center space-x-4 mb-4">
              <div className="relative">
                <img 
src={typeof user.avatar === 'string' ? user.avatar : user.avatar?.url || getDefaultAvatar(user.name || 'T')}                  alt={user.name}
                  className="w-16 h-16 rounded-2xl border-4 border-white shadow-lg"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = getDefaultAvatar(user.name || 'T');
                  }}
                />
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 border-2 border-white rounded-full"></div>
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-orange-400 bg-clip-text text-transparent">
                  🎯 Trainer Dashboard
                </h1>
                <p className="text-gray-600 text-lg mt-1">
                  Welcome back, <span className="font-semibold text-gray-800">{user.name}</span>!
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <button 
              onClick={refreshData}
              className="bg-green-600 text-white px-6 py-3 rounded-xl hover:bg-green-700 transition-all duration-300 shadow-lg hover:shadow-xl font-semibold flex items-center space-x-2"
            >
              <span>🔄</span>
              <span>Refresh Data</span>
            </button>
            <button 
              onClick={() => window.location.href = '/profile'}
              className="bg-gradient-to-r from-orange-500 to-orange-400 text-white px-6 py-3 rounded-xl hover:from-orange-600 hover:to-orange-500 transition-all duration-300 shadow-lg hover:shadow-xl font-semibold flex items-center space-x-2"
            >
              <span>👤</span>
              <span>My Profile</span>
            </button>
          </div>
        </div>

        {/* Enhanced Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard 
            title="My Trainees" 
            value={traineesLoading ? "..." : trainees.length} 
            icon="🐕"
            color="orange"
          />
          <StatCard 
            title="Training Requests" 
            value={requestsLoading ? "..." : requests.length} 
            icon="📋"
            color="green"
          />
          <StatCard 
            title="Upcoming Sessions" 
            value={sessionsLoading ? "..." : sessions.length} 
            icon="🎯"
            color="yellow"
          />
          <StatCard 
            title="Need Follow-up" 
            value={followupLoading ? "..." : followupPets.length} 
            icon="🔔"
            color="purple"
          />
        </div>

        {/* Main Content Container with Glass Morphism */}
        <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-2xl border border-orange-200 overflow-hidden">
          {/* Tab Navigation */}
          <div className="border-b border-orange-200 bg-orange-50/50">
            <div className="flex overflow-x-auto">
              <TabButton
                active={activeTab === 'trainees'}
                onClick={() => setActiveTab('trainees')}
                icon="🐕"
                label="My Trainees"
                count={trainees.length}
              />
              <TabButton
                active={activeTab === 'requests'}
                onClick={() => setActiveTab('requests')}
                icon="📋"
                label="Training Requests"
                count={requests.length}
              />
              <TabButton
                active={activeTab === 'assessments'}
                onClick={() => setActiveTab('assessments')}
                icon="🧠"
                label="Behavior Assessments"
              />
              <TabButton
                active={activeTab === 'sessions'}
                onClick={() => setActiveTab('sessions')}
                icon="🎯"
                label="Training Sessions"
              />
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {/* Trainees Tab */}
            {activeTab === "trainees" && (
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800">My Assigned Pets</h2>
                    <p className="text-gray-600 mt-1">Manage and monitor your animal trainees</p>
                  </div>
                  <div className="text-sm text-gray-500 mt-2 sm:mt-0">
                    {traineesLoading ? "Loading..." : `${trainees.length} assigned pets`}
                  </div>
                </div>

                {traineesLoading ? (
                  <LoadingSpinner />
                ) : trainees.length > 0 ? (
                  <div className="space-y-6">
                    {trainees.map((pet) => (
                      <TraineeCard
                        key={pet._id}
                        pet={pet}
                        onAddAssessment={(petId) => {
                          setSelectedPet(petId);
                          setActiveTab("assessments");
                        }}
                        onAddSession={(petId) => {
                          setSelectedPet(petId);
                          setActiveTab("sessions");
                        }}
                      />
                    ))}
                  </div>
                ) : (
                  <EmptyState 
                    message="No pets assigned to you for training yet."
                    icon="🐕"
                  />
                )}
              </div>
            )}

            {/* Requests Tab */}
            {activeTab === "requests" && (
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-800">Training Requests from Adopters</h2>
                  <div className="text-sm text-gray-500 mt-2 sm:mt-0">
                    {requestsLoading ? "Loading..." : `${requests.length} training requests`}
                  </div>
                </div>

                {requestsLoading ? (
                  <LoadingSpinner />
                ) : requests.length > 0 ? (
                  <div className="space-y-6">
                    {requests.filter(req => req.pet !== null).map((request) => (
                      <TrainingRequestCard
                        key={request._id}
                        request={request}
                        onApprove={handleApproveRequest}
                        onReject={handleRejectRequest}
                      />
                    ))}
                  </div>
                ) : (
                  <EmptyState 
                    message="No training requests received yet."
                    icon="📋"
                  />
                )}
              </div>
            )}

            {/* Assessments Tab */}
            {activeTab === "assessments" && (
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Behavior Assessments</h2>
                
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                  <div>
                    <AssessmentForm 
                      key={`assessment-${formResetKey}`}
                      pets={trainees}
                      selectedPet={selectedPet}
                      onSubmit={createAssessmentMutation.mutate}
                      isLoading={createAssessmentMutation.isPending}
                      onReset={handleFormReset}
                    />
                  </div>

                  <div>
                    <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl border border-yellow-200 p-6 shadow-lg h-fit">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center text-white text-lg">
                          🔔
                        </div>
                        <div>
                          <h3 className="font-bold text-xl text-gray-900">Pets Needing Follow-up</h3>
                          <p className="text-sm text-gray-600">Require additional assessment</p>
                        </div>
                      </div>

                      {followupLoading ? (
                        <LoadingSpinner />
                      ) : followupPets.length > 0 ? (
                        <div className="space-y-4 max-h-[600px] overflow-y-auto">
                          {followupPets.filter(assessment => assessment.pet !== null).map((assessment) => (
                            <FollowUpCard key={assessment._id} assessment={assessment} />
                          ))}
                        </div>
                      ) : (
                        <EmptyState 
                          message="No pets currently need follow-up assessments."
                          icon="✅"
                        />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Sessions Tab */}
            {activeTab === "sessions" && (
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Training Sessions</h2>
                
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                  <div>
                    <SessionForm 
                      key={`session-${formResetKey}`}
                      pets={trainees}
                      selectedPet={selectedPet}
                      onSubmit={createSessionMutation.mutate}
                      isLoading={createSessionMutation.isPending}
                      onReset={handleFormReset}
                    />
                  </div>

                  <div>
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-200 p-6 shadow-lg h-fit">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center text-white text-lg">
                          🎯
                        </div>
                        <div>
                          <h3 className="font-bold text-xl text-gray-900">Upcoming Sessions</h3>
                          <p className="text-sm text-gray-600">Scheduled training sessions</p>
                        </div>
                      </div>

                      {sessionsLoading ? (
                        <LoadingSpinner />
                      ) : sessions.length > 0 ? (
                        <div className="space-y-4">
                          {sessions.map((session) => (
                            <SessionCard key={session._id} session={session} />
                          ))}
                        </div>
                      ) : (
                        <EmptyState 
                          message="No upcoming sessions scheduled."
                          icon="🎯"
                        />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}