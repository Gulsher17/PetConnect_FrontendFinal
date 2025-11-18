import { useState, useMemo, useCallback, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import NavBar from "../components/layout/NavBar";
import Footer from "../components/layout/Footer";
import { useAuth } from "../features/auth/useAuth";
import { http } from "../lib/http";

// Types
type ImageObj = { url?: string; isPrimary?: boolean } | null | undefined;

export interface Pet {
  _id: string;
  name?: string;
  breed?: string;
  age?: number;
  gender?: string;
  weight?: number;
  medicalHistory?: string;
  allergies?: string[];
  currentMedications?: string[];
  status?: string;
  healthNotes?: string;
  images?: ImageObj[];
  owner?: { name?: string; email?: string; phone?: string };
  vet?: { _id: string; name?: string };
}

export interface MedicalRecord {
  _id: string;
  pet: Pet;
  date: string;
  diagnosis: string;
  treatment?: string;
  medications?: Medication[];
  notes?: string;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  nextCheckup?: string;
  vet: { name: string };
}

export interface Medication {
  name: string;
  dosage?: string;
  frequency?: string;
  duration?: string;
}

export interface Vaccination {
  _id: string;
  pet: Pet;
  vaccineName: string;
  dateAdministered: string;
  nextDueDate: string;
  notes?: string;
  status: 'completed' | 'pending' | 'overdue';
}

// Orange theme with professional gradient
const ORANGE_THEME = {
  primary: 'rgb(231, 111, 81)',
  primaryLight: 'rgba(231, 111, 81, 0.15)',
  primaryLighter: 'rgba(231, 111, 81, 0.08)',
  primaryDark: 'rgb(200, 90, 65)',
  white: 'rgb(255, 255, 255)',
  gradient: 'linear-gradient(135deg, rgb(231, 111, 81) 0%, rgb(233, 136, 112) 100%)'
};

// Enhanced Aura Effect Component
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

// Floating Particles Background
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

// Loading Spinner with Enhanced Aura
const LoadingSpinner = () => (
  <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 backdrop-blur-sm">
    <div className="bg-white/95 p-8 rounded-3xl shadow-2xl relative overflow-hidden border border-orange-200 min-w-[200px]">
      <AuraEffect intensity={3} size={200} className="top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
      <div className="flex flex-col items-center relative z-10">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-orange-200 border-t-orange-500 mb-4"></div>
        <p className="text-gray-700 font-semibold">Loading...</p>
      </div>
    </div>
  </div>
);

// Professional Stat Card with Glass Morphism
const StatCard = ({ title, value, icon, color = "orange", trend }: { 
  title: string; 
  value: string | number; 
  icon: string; 
  color?: string;
  trend?: string;
}) => {
  const colorConfig = {
    orange: {
      bg: 'bg-orange-500/10',
      border: 'border-orange-200',
      text: 'text-orange-600',
      iconBg: 'bg-orange-500'
    },
    red: {
      bg: 'bg-red-500/10',
      border: 'border-red-200',
      text: 'text-red-600',
      iconBg: 'bg-red-500'
    },
    yellow: {
      bg: 'bg-yellow-500/10',
      border: 'border-yellow-200',
      text: 'text-yellow-600',
      iconBg: 'bg-yellow-500'
    },
    blue: {
      bg: 'bg-blue-500/10',
      border: 'border-blue-200',
      text: 'text-blue-600',
      iconBg: 'bg-blue-500'
    }
  };

  const config = colorConfig[color] || colorConfig.orange;

  return (
    <div className={`relative overflow-hidden rounded-2xl border ${config.border} ${config.bg} p-6 backdrop-blur-sm transition-all duration-500 hover:scale-105 hover:shadow-2xl group`}>
      <AuraEffect intensity={0.3} size={120} className="-top-8 -right-8 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-semibold text-gray-600 mb-2">{title}</p>
          <p className={`text-3xl font-bold ${config.text} mb-1`}>{value}</p>
          {trend && (
            <p className="text-xs font-medium text-gray-500">{trend}</p>
          )}
        </div>
        
        <div className={`w-12 h-12 rounded-xl ${config.iconBg} flex items-center justify-center text-white text-lg shadow-lg`}>
          {icon}
        </div>
      </div>
    </div>
  );
};

// Professional Tab Navigation
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

// Medication Field Component
const MedicationField = ({ medication, onUpdate, onRemove, index }: { 
  medication: Medication & { id: number };
  onUpdate: (med: Medication & { id: number }) => void;
  onRemove: () => void;
  index: number;
}) => (
  <div className="border border-gray-200 rounded-xl p-4 bg-white/80 backdrop-blur-sm mb-4 transition-all duration-300 hover:shadow-lg">
    <div className="flex justify-between items-center mb-3">
      <div className="flex items-center space-x-2">
        <span className="text-lg">💊</span>
        <span className="font-semibold text-gray-700">Medication #{index + 1}</span>
      </div>
      <button
        type="button"
        onClick={onRemove}
        className="text-red-500 hover:text-red-700 transition-colors p-2 rounded-lg hover:bg-red-50"
      >
        🗑️ Remove
      </button>
    </div>
    
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Medication Name *</label>
        <input
          type="text"
          placeholder="e.g., Amoxicillin"
          value={medication.name}
          onChange={(e) => onUpdate({ ...medication, name: e.target.value })}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Dosage</label>
        <input
          type="text"
          placeholder="e.g., 10mg"
          value={medication.dosage || ''}
          onChange={(e) => onUpdate({ ...medication, dosage: e.target.value })}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Frequency</label>
        <input
          type="text"
          placeholder="e.g., 2x daily"
          value={medication.frequency || ''}
          onChange={(e) => onUpdate({ ...medication, frequency: e.target.value })}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
        <input
          type="text"
          placeholder="e.g., 7 days"
          value={medication.duration || ''}
          onChange={(e) => onUpdate({ ...medication, duration: e.target.value })}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
        />
      </div>
    </div>
  </div>
);

// Patient Card Component
const PatientCard = ({ patient, onQuickUpdate, onViewHistory }: {
  patient: Pet;
  onQuickUpdate: (petId: string) => void;
  onViewHistory: (petId: string) => void;
}) => {
  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'Available': return 'bg-green-100 text-green-800';
      case 'In Treatment': return 'bg-yellow-100 text-yellow-800';
      case 'Adopted': return 'bg-blue-100 text-blue-800';
      case 'Unavailable': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDefaultAvatar = (name: string) => {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=rgb(231,111,81)&color=fff&size=128&bold=true`;
  };

  return (
    <div className="bg-gradient-to-r from-orange-50 to-white border-2 border-orange-100 rounded-2xl p-6 hover:shadow-xl transition-all duration-300 group">
      <AuraEffect intensity={0.2} size={100} className="opacity-0 group-hover:opacity-100 transition-opacity duration-500 -top-8 -right-8" />
      
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Patient Image */}
        <div className="flex-shrink-0">
          <div className="relative">
            <img 
              src={patient.images?.[0]?.url || getDefaultAvatar(patient.name || 'P')}
              alt={patient.name}
              className="w-24 h-24 rounded-2xl object-cover border-4 border-white shadow-lg"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = getDefaultAvatar(patient.name || 'P');
              }}
            />
            <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-orange-500 rounded-full border-2 border-white flex items-center justify-center text-white text-xs">
              🐾
            </div>
          </div>
        </div>

        {/* Patient Info */}
        <div className="flex-1">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-4">
            <div>
              <h3 className="text-xl font-bold text-orange-700 mb-1">{patient.name}</h3>
              <div className="flex flex-wrap gap-2 text-sm text-gray-600 mb-2">
                <span>{patient.breed || 'Unknown breed'}</span>
                <span>•</span>
                <span>{patient.age || 'Unknown'} years</span>
                <span>•</span>
                <span>{patient.gender || 'Unknown gender'}</span>
              </div>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(patient.status)}`}>
              {patient.status}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-4">
            <div>
              <span className="font-semibold text-gray-700">Weight:</span>
              <span className="text-gray-600 ml-2">{patient.weight ? `${patient.weight} kg` : 'Not set'}</span>
            </div>
            <div>
              <span className="font-semibold text-gray-700">Allergies:</span>
              <span className="text-gray-600 ml-2">
                {patient.allergies && patient.allergies.length > 0 ? patient.allergies.join(', ') : 'None'}
              </span>
            </div>
          </div>

          {patient.healthNotes && (
            <div className="bg-white/50 rounded-xl p-3 border border-orange-200">
              <span className="font-semibold text-gray-700">Health Notes:</span>
              <p className="text-gray-600 text-sm mt-1">{patient.healthNotes}</p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2 min-w-[140px]">
          <button
            onClick={() => onQuickUpdate(patient._id)}
            className="bg-green-600 text-white px-4 py-2 rounded-xl hover:bg-green-700 transition-all duration-300 font-semibold text-sm shadow-lg hover:shadow-xl"
          >
            Quick Update
          </button>
          <button
            onClick={() => onViewHistory(patient._id)}
            className="bg-orange-600 text-white px-4 py-2 rounded-xl hover:bg-orange-700 transition-all duration-300 font-semibold text-sm shadow-lg hover:shadow-xl"
          >
            View History
          </button>
        </div>
      </div>
    </div>
  );
};

// Medical Record Card Component
const MedicalRecordCard = ({ record }: { record: MedicalRecord }) => {
  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white border-2 border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-all duration-300">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h4 className="text-lg font-bold text-orange-700">{record.pet.name}</h4>
          <p className="text-sm text-gray-500">
            {new Date(record.date).toLocaleDateString()} • {record.pet.breed}
          </p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getUrgencyColor(record.urgency)}`}>
          {record.urgency.toUpperCase()}
        </span>
      </div>

      <div className="space-y-3">
        <div>
          <span className="font-semibold text-gray-700">Diagnosis:</span>
          <p className="text-gray-800">{record.diagnosis}</p>
        </div>

        {record.treatment && (
          <div>
            <span className="font-semibold text-gray-700">Treatment:</span>
            <p className="text-gray-800">{record.treatment}</p>
          </div>
        )}

        {record.medications && record.medications.length > 0 && (
          <div>
            <span className="font-semibold text-gray-700 flex items-center">
              <span className="mr-2">💊</span>
              Medications:
            </span>
            <div className="mt-2 space-y-2">
              {record.medications.map((med, index) => (
                <div key={index} className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                  <div className="flex justify-between items-start">
                    <span className="font-semibold text-orange-700">{med.name}</span>
                    {med.dosage && <span className="text-sm text-orange-600">{med.dosage}</span>}
                  </div>
                  {(med.frequency || med.duration) && (
                    <div className="text-sm text-gray-600 mt-1">
                      {med.frequency && <span>Frequency: {med.frequency}</span>}
                      {med.frequency && med.duration && <span> • </span>}
                      {med.duration && <span>Duration: {med.duration}</span>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {record.notes && (
          <div>
            <span className="font-semibold text-gray-700">Notes:</span>
            <p className="text-gray-800">{record.notes}</p>
          </div>
        )}

        {record.nextCheckup && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <span className="font-semibold text-green-700">Next Checkup:</span>
            <p className="text-green-800">{new Date(record.nextCheckup).toLocaleDateString()}</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Vaccination Card Component
const VaccinationCard = ({ vaccination, onRecordBooster }: {
  vaccination: Vaccination;
  onRecordBooster: (vaccination: Vaccination) => void;
}) => {
  const isOverdue = new Date(vaccination.nextDueDate) < new Date();

  return (
    <div className={`bg-white border-2 ${isOverdue ? 'border-red-200 bg-red-50' : 'border-gray-200'} rounded-2xl p-6 hover:shadow-lg transition-all duration-300`}>
      <div className="flex justify-between items-start mb-4">
        <div>
          <h4 className="text-lg font-bold text-gray-800">{vaccination.pet.name}</h4>
          <p className="text-sm text-gray-500">{vaccination.pet.breed}</p>
        </div>
        {isOverdue ? (
          <span className="bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold">
            OVERDUE
          </span>
        ) : (
          <span className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold">
            UP TO DATE
          </span>
        )}
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="font-semibold text-gray-700">Vaccine:</span>
          <span className="text-gray-800">{vaccination.vaccineName}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-semibold text-gray-700">Administered:</span>
          <span className="text-gray-800">{new Date(vaccination.dateAdministered).toLocaleDateString()}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-semibold text-gray-700">Next Due:</span>
          <span className={`${isOverdue ? 'text-red-600 font-bold' : 'text-gray-800'}`}>
            {new Date(vaccination.nextDueDate).toLocaleDateString()}
          </span>
        </div>
        {vaccination.notes && (
          <div>
            <span className="font-semibold text-gray-700">Notes:</span>
            <p className="text-gray-800 mt-1">{vaccination.notes}</p>
          </div>
        )}
      </div>

      {isOverdue && (
        <button
          onClick={() => onRecordBooster(vaccination)}
          className="w-full mt-4 bg-orange-600 text-white py-2 rounded-xl hover:bg-orange-700 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl"
        >
          Record Booster
        </button>
      )}
    </div>
  );
};

// API Calls - Updated to match actual backend routes
const fetchVetPatients = async (): Promise<{ pets: Pet[]; count: number }> => {
  const response = await http.get("/vet/my-patients");
  return { pets: response.data.pets, count: response.data.count };
};

const fetchOverdueVaccinations = async (): Promise<{ overdueVaccinations: Vaccination[]; count: number }> => {
  const response = await http.get("/vet/overdue-vaccinations");
  return { overdueVaccinations: response.data.overdueVaccinations, count: response.data.count };
};

const fetchUpcomingCheckups = async (): Promise<{ count: number }> => {
  const response = await http.get("/vet/upcoming-checkups");
  return { count: response.data.count };
};

// New function to fetch medical history for a specific pet
const fetchPetMedicalHistory = async (petId: string): Promise<{ pet: Pet; medicalRecords: MedicalRecord[]; vaccinations: Vaccination[] }> => {
  const response = await http.get(`/vet/pets/${petId}/medical-history`);
  return response.data;
};

const addMedicalRecord = async (petId: string, data: any) => {
  const response = await http.post(`/vet/pets/${petId}/medical-records`, data);
  return response.data;
};

const addVaccination = async (petId: string, data: any) => {
  const response = await http.post(`/vet/pets/${petId}/vaccinations`, data);
  return response.data;
};

// Default avatar fallback
const getDefaultAvatar = (name: string) => {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=rgb(231,111,81)&color=fff&size=128&bold=true`;
};

export default function VetDashboard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'patients' | 'medical' | 'vaccinations'>('patients');
  const [loading, setLoading] = useState(false);
  const [medications, setMedications] = useState<(Medication & { id: number })[]>([]);
  const [pendingBooster, setPendingBooster] = useState<Vaccination | null>(null);
  const [selectedPetHistory, setSelectedPetHistory] = useState<{
    pet: Pet;
    medicalRecords: MedicalRecord[];
    vaccinations: Vaccination[];
  } | null>(null);
  
  const [medicalRecordForm, setMedicalRecordForm] = useState({
    petId: "",
    diagnosis: "",
    treatment: "",
    notes: "",
    urgency: "medium" as "low" | "medium" | "high" | "critical",
    nextCheckup: ""
  });
  
  const [vaccinationForm, setVaccinationForm] = useState({
    petId: "",
    vaccineName: "",
    dateAdministered: new Date().toISOString().split('T')[0],
    nextDueDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
    notes: ""
  });

  // Queries - Only using existing endpoints
  const patientsQuery = useQuery({
    queryKey: ["vetPatients"],
    queryFn: fetchVetPatients
  });

  const overdueVaccinationsQuery = useQuery({
    queryKey: ["overdueVaccinations"],
    queryFn: fetchOverdueVaccinations
  });

  const upcomingCheckupsQuery = useQuery({
    queryKey: ["upcomingCheckups"],
    queryFn: fetchUpcomingCheckups
  });

  // Mutations
  const addMedicalRecordMutation = useMutation({
    mutationFn: ({ petId, data }: { petId: string; data: any }) => addMedicalRecord(petId, data),
    onSuccess: () => {
      toast.success("🎉 Medical record added successfully!");
      queryClient.invalidateQueries({ queryKey: ["vetPatients"] });
      queryClient.invalidateQueries({ queryKey: ["upcomingCheckups"] });
      setMedicalRecordForm({
        petId: "", diagnosis: "", treatment: "", notes: "", urgency: "medium", nextCheckup: ""
      });
      setMedications([]);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.msg || "❌ Failed to add medical record");
    }
  });

  const addVaccinationMutation = useMutation({
    mutationFn: ({ petId, data }: { petId: string; data: any }) => addVaccination(petId, data),
    onSuccess: () => {
      toast.success("💉 Vaccination recorded successfully!");
      queryClient.invalidateQueries({ queryKey: ["overdueVaccinations"] });
      setVaccinationForm({
        petId: "", vaccineName: "", 
        dateAdministered: new Date().toISOString().split('T')[0],
        nextDueDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
        notes: ""
      });
      setPendingBooster(null);
    },
    onError: (error: any) => {
      if (error.response?.status === 403) {
        toast.error("❌ You are not assigned to this pet. Please select a patient that is assigned to you.");
      } else {
        toast.error(error.response?.data?.msg || "❌ Failed to record vaccination");
      }
    }
  });

  // Medication functions
  const addMedicationField = useCallback(() => {
    setMedications(prev => [...prev, { 
      id: Date.now(), 
      name: "", 
      dosage: "", 
      frequency: "", 
      duration: "" 
    }]);
  }, []);

  const updateMedication = useCallback((id: number, updates: Partial<Medication>) => {
    setMedications(prev => prev.map(med => med.id === id ? { ...med, ...updates } : med));
  }, []);

  const removeMedication = useCallback((id: number) => {
    setMedications(prev => prev.filter(med => med.id !== id));
  }, []);

  // Form handlers
  const handleAddMedicalRecord = useCallback(async () => {
    if (!medicalRecordForm.petId) {
      toast.error("Please select a patient");
      return;
    }
    if (!medicalRecordForm.diagnosis.trim()) {
      toast.error("Please enter a diagnosis");
      document.getElementById('diagnosis')?.focus();
      return;
    }

    const medicationData = medications.filter(med => med.name.trim() !== "");

    setLoading(true);
    try {
      await addMedicalRecordMutation.mutateAsync({
        petId: medicalRecordForm.petId,
        data: {
          ...medicalRecordForm,
          medications: medicationData
        }
      });
    } finally {
      setLoading(false);
    }
  }, [medicalRecordForm, medications]);

  const handleAddVaccination = useCallback(async () => {
    if (!vaccinationForm.petId || !vaccinationForm.vaccineName || !vaccinationForm.dateAdministered || !vaccinationForm.nextDueDate) {
      toast.error("Please fill all required fields");
      return;
    }

    setLoading(true);
    try {
      await addVaccinationMutation.mutateAsync({
        petId: vaccinationForm.petId,
        data: vaccinationForm
      });
    } finally {
      setLoading(false);
    }
  }, [vaccinationForm]);

  // Record booster handler - Fixed to use the correct pet ID
  const handleRecordBooster = useCallback((vaccination: Vaccination) => {
    // Check if the vet is assigned to this pet
    const isAssigned = patientsQuery.data?.pets?.some(pet => pet._id === vaccination.pet._id);
    
    if (!isAssigned) {
      toast.error("❌ You are not assigned to this pet. Cannot record booster.");
      return;
    }

    setPendingBooster(vaccination);
    setVaccinationForm({
      petId: vaccination.pet._id,
      vaccineName: `${vaccination.vaccineName} (Booster)`,
      dateAdministered: new Date().toISOString().split('T')[0],
      nextDueDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
      notes: `Booster vaccination for ${vaccination.vaccineName}`
    });
    setActiveTab('vaccinations');
    toast.success(`Booster prepared for ${vaccination.pet.name}. Please review and submit.`);
  }, [patientsQuery.data]);

  // View history handler - Now displays medical records directly
  const handleViewHistory = useCallback(async (petId: string) => {
    try {
      setLoading(true);
      const history = await fetchPetMedicalHistory(petId);
      setSelectedPetHistory(history);
      setActiveTab('medical');
      toast.success(`Loaded medical history for ${history.pet.name}`);
    } catch (error: any) {
      toast.error(error.response?.data?.msg || "Failed to fetch medical history");
    } finally {
      setLoading(false);
    }
  }, []);

  // Stats data
  const statsData = useMemo(() => ({
    patientsCount: patientsQuery.data?.count || 0,
    overdueVaccinations: overdueVaccinationsQuery.data?.count || 0,
    upcomingCheckups: upcomingCheckupsQuery.data?.count || 0,
    todayDate: new Date().toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
  }), [patientsQuery.data, overdueVaccinationsQuery.data, upcomingCheckupsQuery.data]);

  // Quick update handler
  const handleQuickUpdate = useCallback((petId: string) => {
    const pet = patientsQuery.data?.pets?.find(p => p._id === petId);
    if (pet) {
      const notes = prompt(`Quick health update for ${pet.name}:`, pet.healthNotes || '');
      if (notes !== null) {
        // In a real app, you'd call an API endpoint here
        toast.success(`Health notes updated for ${pet.name}`);
      }
    }
  }, [patientsQuery.data]);

  // Refresh data function
  const refreshData = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["vetPatients"] });
    queryClient.invalidateQueries({ queryKey: ["overdueVaccinations"] });
    queryClient.invalidateQueries({ queryKey: ["upcomingCheckups"] });
    setSelectedPetHistory(null);
    toast.success("Data refreshed!");
  }, [queryClient]);

  if (!user || user.role !== "vet") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-orange-50 relative overflow-hidden">
        <FloatingParticles />
        <AuraEffect intensity={4} size={500} className="top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
        <div className="text-center bg-white/80 backdrop-blur-md rounded-3xl shadow-2xl p-12 max-w-md mx-4 border border-orange-200 relative z-10">
          <div className="text-8xl mb-6">🚫</div>
          <div className="text-3xl font-bold text-gray-900 mb-4">Access Restricted</div>
          <div className="text-gray-600 text-lg">Veterinarian authorization required to access this dashboard.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50 relative overflow-hidden">
      {/* Enhanced Background Effects */}
      <FloatingParticles />
      <AuraEffect intensity={3} size={800} className="-top-64 -left-64" />
      <AuraEffect intensity={2} size={600} className="-bottom-48 -right-48" />
      <AuraEffect intensity={1.5} size={400} className="top-1/4 right-1/4" color="rgba(233, 136, 112, 0.3)" />
      
      <NavBar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        {/* Enhanced Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-12">
          <div className="mb-6 lg:mb-0">
            <div className="flex items-center space-x-4 mb-4">
              <div className="relative">
                <img 
                  src={user.avatar || getDefaultAvatar(user.name || 'V')}
                  alt={user.name}
                  className="w-16 h-16 rounded-2xl border-4 border-white shadow-lg"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = getDefaultAvatar(user.name || 'V');
                  }}
                />
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 border-2 border-white rounded-full"></div>
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-orange-400 bg-clip-text text-transparent">
                  Vet Dashboard
                </h1>
                <p className="text-gray-600 text-lg mt-1">
                  Welcome back, <span className="font-semibold text-gray-800">Dr. {user.name}</span>
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
              onClick={() => window.location.href = '/'}
              className="bg-gray-600 text-white px-6 py-3 rounded-xl hover:bg-gray-700 transition-all duration-300 shadow-lg hover:shadow-xl font-semibold flex items-center space-x-2"
            >
              <span>←</span>
              <span>Main Portal</span>
            </button>
            <button 
              onClick={() => window.location.href = '/profile-setup'}
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
            title="My Patients" 
            value={statsData.patientsCount} 
            icon="🐕" 
            color="orange"
            trend="Active cases"
          />
          <StatCard 
            title="Overdue Vaccinations" 
            value={statsData.overdueVaccinations} 
            icon="💉" 
            color="red"
            trend="Require attention"
          />
          <StatCard 
            title="Upcoming Checkups" 
            value={statsData.upcomingCheckups} 
            icon="📅" 
            color="yellow"
            trend="Scheduled"
          />
          <StatCard 
            title="Today's Date" 
            value={statsData.todayDate} 
            icon="📆" 
            color="blue"
          />
        </div>

        {/* Main Content Container */}
        <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-2xl border border-orange-200 overflow-hidden">
          {/* Tab Navigation */}
          <div className="border-b border-orange-200 bg-orange-50/50">
            <div className="flex overflow-x-auto">
              <TabButton
                active={activeTab === 'patients'}
                onClick={() => setActiveTab('patients')}
                icon="🐕"
                label="My Patients"
                count={statsData.patientsCount}
              />
              <TabButton
                active={activeTab === 'medical'}
                onClick={() => setActiveTab('medical')}
                icon="🏥"
                label="Medical Records"
              />
              <TabButton
                active={activeTab === 'vaccinations'}
                onClick={() => setActiveTab('vaccinations')}
                icon="💉"
                label="Vaccinations"
                count={statsData.overdueVaccinations}
              />
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {/* Patients Tab */}
            {activeTab === 'patients' && (
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800">My Assigned Patients</h2>
                    <p className="text-gray-600 mt-1">Manage and monitor your animal patients</p>
                  </div>
                  <div className="text-sm text-gray-500 mt-2 sm:mt-0">
                    {patientsQuery.isLoading ? "Loading..." : `${statsData.patientsCount} patients`}
                  </div>
                </div>
                
                <div className="space-y-4">
                  {patientsQuery.data?.pets?.map(patient => (
                    <PatientCard
                      key={patient._id}
                      patient={patient}
                      onQuickUpdate={handleQuickUpdate}
                      onViewHistory={handleViewHistory}
                    />
                  ))}
                  
                  {!patientsQuery.data?.pets?.length && (
                    <div className="text-center py-16 bg-gradient-to-br from-orange-50 to-white rounded-2xl border-2 border-dashed border-orange-300">
                      <div className="text-6xl mb-4">🐕</div>
                      <h3 className="text-xl font-semibold text-gray-700 mb-2">No Patients Assigned</h3>
                      <p className="text-gray-500 max-w-md mx-auto">
                        Patients will appear here once they are assigned to you. Check back later or contact administration.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Medical Records Tab */}
            {activeTab === 'medical' && (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                {/* Add Medical Record Form */}
                <div>
                  <h3 className="text-xl font-bold text-gray-800 mb-4">Add Medical Record</h3>
                  <div className="space-y-4 bg-orange-50/50 rounded-2xl p-6 border-2 border-orange-200">
                    <select
                      value={medicalRecordForm.petId}
                      onChange={(e) => setMedicalRecordForm(prev => ({ ...prev, petId: e.target.value }))}
                      className="w-full p-4 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors bg-white"
                    >
                      <option value="">Select a patient</option>
                      {patientsQuery.data?.pets?.map(pet => (
                        <option key={pet._id} value={pet._id}>
                          {pet.name} ({pet.breed})
                        </option>
                      ))}
                    </select>
                    
                    <input
                      type="text"
                      placeholder="Diagnosis *"
                      value={medicalRecordForm.diagnosis}
                      onChange={(e) => setMedicalRecordForm(prev => ({ ...prev, diagnosis: e.target.value }))}
                      className="w-full p-4 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                    />
                    
                    <input
                      type="text"
                      placeholder="Treatment"
                      value={medicalRecordForm.treatment}
                      onChange={(e) => setMedicalRecordForm(prev => ({ ...prev, treatment: e.target.value }))}
                      className="w-full p-4 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                    />

                    {/* Medications Section */}
                    <div className="border-2 border-orange-200 rounded-xl p-4 bg-white">
                      <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                        <span className="text-lg mr-2">💊</span>
                        Medications
                      </h4>
                      <div className="space-y-4">
                        {medications.map((medication, index) => (
                          <MedicationField
                            key={medication.id}
                            medication={medication}
                            onUpdate={(updatedMed) => updateMedication(medication.id, updatedMed)}
                            onRemove={() => removeMedication(medication.id)}
                            index={index}
                          />
                        ))}
                      </div>
                      <button
                        type="button"
                        onClick={addMedicationField}
                        className="mt-4 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors text-sm font-semibold"
                      >
                        + Add Medication
                      </button>
                    </div>

                    <textarea
                      placeholder="Notes"
                      value={medicalRecordForm.notes}
                      onChange={(e) => setMedicalRecordForm(prev => ({ ...prev, notes: e.target.value }))}
                      className="w-full p-4 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors h-24"
                    />

                    <select
                      value={medicalRecordForm.urgency}
                      onChange={(e) => setMedicalRecordForm(prev => ({ ...prev, urgency: e.target.value as any }))}
                      className="w-full p-4 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors bg-white"
                    >
                      <option value="low">Low Urgency</option>
                      <option value="medium">Medium Urgency</option>
                      <option value="high">High Urgency</option>
                      <option value="critical">Critical</option>
                    </select>

                    <input
                      type="date"
                      value={medicalRecordForm.nextCheckup}
                      onChange={(e) => setMedicalRecordForm(prev => ({ ...prev, nextCheckup: e.target.value }))}
                      className="w-full p-4 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                    />

                    <button
                      onClick={handleAddMedicalRecord}
                      disabled={loading}
                      className="w-full bg-orange-600 text-white p-4 rounded-xl hover:bg-orange-700 transition-all duration-300 font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                    >
                      {loading ? (
                        <span className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                          Adding Record...
                        </span>
                      ) : (
                        "Add Medical Record"
                      )}
                    </button>
                  </div>
                </div>

                {/* Medical Records Display */}
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-gray-800">
                      {selectedPetHistory ? `Medical History - ${selectedPetHistory.pet.name}` : 'Medical Records'}
                    </h3>
                    {selectedPetHistory && (
                      <button
                        onClick={() => setSelectedPetHistory(null)}
                        className="text-sm text-orange-600 hover:text-orange-700 font-semibold"
                      >
                        ← Back to all
                      </button>
                    )}
                  </div>

                  {selectedPetHistory ? (
                    <div className="space-y-4 max-h-[600px] overflow-y-auto">
                      {/* Medical Records */}
                      <div>
                        <h4 className="text-lg font-semibold text-gray-700 mb-3 flex items-center">
                          <span className="mr-2">📋</span>
                          Medical Records ({selectedPetHistory.medicalRecords.length})
                        </h4>
                        {selectedPetHistory.medicalRecords.length > 0 ? (
                          selectedPetHistory.medicalRecords.map(record => (
                            <MedicalRecordCard key={record._id} record={record} />
                          ))
                        ) : (
                          <div className="bg-yellow-50 border-2 border-yellow-200 rounded-2xl p-6 text-center">
                            <p className="text-yellow-700">No medical records found for this patient.</p>
                          </div>
                        )}
                      </div>

                      {/* Vaccinations */}
                      <div>
                        <h4 className="text-lg font-semibold text-gray-700 mb-3 flex items-center">
                          <span className="mr-2">💉</span>
                          Vaccinations ({selectedPetHistory.vaccinations.length})
                        </h4>
                        {selectedPetHistory.vaccinations.length > 0 ? (
                          selectedPetHistory.vaccinations.map(vaccination => (
                            <VaccinationCard
                              key={vaccination._id}
                              vaccination={vaccination}
                              onRecordBooster={handleRecordBooster}
                            />
                          ))
                        ) : (
                          <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-6 text-center">
                            <p className="text-blue-700">No vaccination records found for this patient.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-8 text-center">
                      <div className="text-6xl mb-4">📋</div>
                      <h4 className="text-lg font-semibold text-blue-700 mb-2">View Medical Records</h4>
                      <p className="text-blue-600 mb-4">
                        Click "View History" on any patient in the Patients tab to see their complete medical records and vaccination history.
                      </p>
                      <button
                        onClick={() => setActiveTab('patients')}
                        className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-all duration-300 font-semibold"
                      >
                        Go to Patients
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Vaccinations Tab */}
            {activeTab === 'vaccinations' && (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                {/* Record Vaccination Form */}
                <div>
                  <h3 className="text-xl font-bold text-gray-800 mb-4">Record Vaccination</h3>
                  
                  {/* Booster Notice */}
                  {pendingBooster && (
                    <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 mb-4">
                      <div className="flex items-center">
                        <span className="text-blue-500 text-lg mr-2">📝</span>
                        <div>
                          <p className="font-semibold text-blue-700">Booster Prepared</p>
                          <p className="text-blue-600 text-sm">
                            You are recording a booster for {pendingBooster.pet.name}'s {pendingBooster.vaccineName}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="space-y-4 bg-green-50/50 rounded-2xl p-6 border-2 border-green-200">
                    <select
                      value={vaccinationForm.petId}
                      onChange={(e) => setVaccinationForm(prev => ({ ...prev, petId: e.target.value }))}
                      className="w-full p-4 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors bg-white"
                    >
                      <option value="">Select a patient</option>
                      {patientsQuery.data?.pets?.map(pet => (
                        <option key={pet._id} value={pet._id}>
                          {pet.name} ({pet.breed})
                        </option>
                      ))}
                    </select>

                    <input
                      type="text"
                      placeholder="Vaccine Name *"
                      value={vaccinationForm.vaccineName}
                      onChange={(e) => setVaccinationForm(prev => ({ ...prev, vaccineName: e.target.value }))}
                      className="w-full p-4 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                    />

                    <input
                      type="date"
                      placeholder="Date Administered"
                      value={vaccinationForm.dateAdministered}
                      onChange={(e) => setVaccinationForm(prev => ({ ...prev, dateAdministered: e.target.value }))}
                      className="w-full p-4 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                    />

                    <input
                      type="date"
                      placeholder="Next Due Date"
                      value={vaccinationForm.nextDueDate}
                      onChange={(e) => setVaccinationForm(prev => ({ ...prev, nextDueDate: e.target.value }))}
                      className="w-full p-4 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                    />

                    <textarea
                      placeholder="Notes"
                      value={vaccinationForm.notes}
                      onChange={(e) => setVaccinationForm(prev => ({ ...prev, notes: e.target.value }))}
                      className="w-full p-4 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors h-24"
                    />

                    <button
                      onClick={handleAddVaccination}
                      disabled={loading}
                      className="w-full bg-green-600 text-white p-4 rounded-xl hover:bg-green-700 transition-all duration-300 font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                    >
                      {loading ? (
                        <span className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                          Recording...
                        </span>
                      ) : (
                        pendingBooster ? "Record Booster" : "Record Vaccination"
                      )}
                    </button>
                  </div>
                </div>

                {/* Vaccinations Lists */}
                <div className="space-y-8">
                  {/* Overdue Vaccinations */}
                  <div>
                    <h3 className="text-xl font-bold text-gray-800 mb-4">
                      ⚠️ Overdue Vaccinations ({overdueVaccinationsQuery.data?.count || 0})
                    </h3>
                    <div className="space-y-4">
                      {overdueVaccinationsQuery.data?.overdueVaccinations?.map(vaccination => (
                        <VaccinationCard
                          key={vaccination._id}
                          vaccination={vaccination}
                          onRecordBooster={handleRecordBooster}
                        />
                      ))}
                      
                      {!overdueVaccinationsQuery.data?.overdueVaccinations?.length && (
                        <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-8 text-center">
                          <div className="text-5xl mb-3">✅</div>
                          <h4 className="text-lg font-semibold text-green-700 mb-2">All Vaccinations Up to Date!</h4>
                          <p className="text-green-600">No overdue vaccinations found. Great work!</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Vaccination Management Info */}
                  <div>
                    <h3 className="text-xl font-bold text-gray-800 mb-4">
                      📋 Vaccination Management
                    </h3>
                    <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-6 text-center">
                      <div className="text-4xl mb-3">💉</div>
                      <h4 className="text-lg font-semibold text-green-700 mb-2">Vaccination Records</h4>
                      <p className="text-green-600 mb-4">
                        Record new vaccinations using the form. Overdue vaccinations are shown above.
                      </p>
                      <p className="text-sm text-green-500">
                        Individual vaccination records are available through patient medical history.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
      
      {/* Loading Overlay */}
      {loading && <LoadingSpinner />}
    </div>
  );
}