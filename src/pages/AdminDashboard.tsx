import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { useAuth } from "../features/auth/useAuth";
import { http } from "../lib/http";
import NavBar from "../components/layout/NavBar";
import Footer from "../components/layout/Footer";

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
const LoadingSpinner: React.FC<{ size?: "sm" | "md" | "lg" }> = ({ size = "md" }) => {
  const sizeClasses = {
    sm: "h-6 w-6",
    md: "h-12 w-12",
    lg: "h-16 w-16"
  };

  return (
    <div className="flex justify-center items-center py-12">
      <div className="relative">
        <AuraEffect intensity={2} size={80} className="top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
        <div className={`animate-spin rounded-full border-b-2 border-orange-600 ${sizeClasses[size]} relative z-10`}></div>
      </div>
    </div>
  );
};

// Types (keep your existing types)
type UserRole = "admin" | "staff" | "vet" | "adopter" | "trainer";

interface User {
  _id: string;
  name?: string;
  email?: string;
  role?: UserRole;
  status?: string;
  createdAt?: string;
}

interface Organization {
  _id: string;
  name?: string;
  type?: string;
  contact?: {
    email?: string;
    phone?: string;
    address?: string;
  };
  status?: string;
  createdAt?: string;
}

interface ActivityLog {
  _id: string;
  user?: {
    name?: string;
    role?: string;
  };
  action: string;
  target?: string;
  details?: string;
  createdAt: string;
  ipAddress?: string;
}

interface Analytics {
  overview: {
    totalUsers: number;
    totalPets: number;
    totalAdoptionRequests: number;
    totalOrganizations: number;
    recentAdoptions: number;
  };
  userDistribution: Array<{
    _id: string;
    count: number;
  }>;
  petDistribution: Array<{
    _id: string;
    count: number;
  }>;
}

interface SystemHealth {
  healthChecks: {
    database: string;
    authentication: string;
    fileStorage: string;
    emailService: string;
  };
  uptime: number;
  totalUsers: number;
  totalPets: number;
  totalOrganizations: number;
  timestamp: string;
}

interface UsersResponse {
  users: User[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

interface ActivityLogsResponse {
  logs: ActivityLog[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

interface UserFilters {
  page: number;
  limit: number;
  search?: string;
  role?: string;
  status?: string;
}

// Props for helper components
interface StatCardProps {
  title: string;
  value: number;
  icon: string;
  color?: string;
  trend?: number;
}

interface RoleBadgeProps {
  role?: string;
}

interface StatusBadgeProps {
  status?: string;
  type?: "user" | "system";
}

interface EmptyStateProps {
  message: string;
  icon?: string;
  action?: React.ReactNode;
}

interface ChartCardProps {
  title: string;
  description: string;
  children: React.ReactNode;
}

// Professional Stat Card with Glass Morphism
const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color = "orange", trend }) => {
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
    },
    blue: {
      bg: 'bg-blue-500/10',
      border: 'border-blue-200',
      text: 'text-blue-600',
      iconBg: 'bg-blue-500'
    }
  };

  const config = colorConfig[color as keyof typeof colorConfig] || colorConfig.orange;

  return (
    <div className={`relative overflow-hidden rounded-2xl border ${config.border} ${config.bg} p-6 backdrop-blur-sm transition-all duration-500 hover:scale-105 hover:shadow-2xl group`}>
      <AuraEffect intensity={0.3} size={120} className="-top-8 -right-8 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-semibold text-gray-600 mb-2">{title}</p>
          <p className={`text-3xl font-bold ${config.text} mb-1`}>{value.toLocaleString()}</p>
          {trend !== undefined && (
            <p className={`text-xs font-medium ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {trend >= 0 ? '↗' : '↘'} {Math.abs(trend)}% from last week
            </p>
          )}
        </div>
        
        <div className={`w-12 h-12 rounded-xl ${config.iconBg} flex items-center justify-center text-white text-lg shadow-lg`}>
          {icon}
        </div>
      </div>
    </div>
  );
};

// Professional Tab Navigation - Fixed to prevent scrollbar
const TabButton = ({ active, onClick, icon, label, count }: { 
  active: boolean; 
  onClick: () => void; 
  icon: string; 
  label: string;
  count?: number;
}) => (
  <button
    onClick={onClick}
    className={`relative flex-1 min-w-0 flex items-center justify-center space-x-3 py-4 px-4 font-semibold border-b-2 transition-all duration-300 group ${
      active 
        ? `border-orange-500 text-orange-600 bg-orange-50/50` 
        : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50/50"
    }`}
  >
    <span className="text-xl transition-transform duration-300 group-hover:scale-110">{icon}</span>
    <span className="text-sm whitespace-nowrap">{label}</span>
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

const RoleBadge: React.FC<RoleBadgeProps> = ({ role }) => {
  const roleConfig: Record<string, { color: string; label: string }> = {
    admin: { color: "bg-purple-100 text-purple-800 border-purple-200", label: "Admin" },
    staff: { color: "bg-blue-100 text-blue-800 border-blue-200", label: "Staff" },
    vet: { color: "bg-green-100 text-green-800 border-green-200", label: "Veterinarian" },
    trainer: { color: "bg-orange-100 text-orange-800 border-orange-200", label: "Trainer" },
    adopter: { color: "bg-gray-100 text-gray-800 border-gray-200", label: "Adopter" }
  };

  const config = role ? roleConfig[role] : roleConfig.adopter;
  
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${config.color}`}>
      {config.label}
    </span>
  );
};

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, type = "user" }) => {
  if (type === "system") {
    const systemConfig: Record<string, { color: string; label: string }> = {
      healthy: { color: "bg-green-100 text-green-800 border-green-200", label: "Healthy" },
      degraded: { color: "bg-yellow-100 text-yellow-800 border-yellow-200", label: "Degraded" },
      unhealthy: { color: "bg-red-100 text-red-800 border-red-200", label: "Unhealthy" }
    };
    
    const config = status ? systemConfig[status] : systemConfig.healthy;
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${config.color}`}>
        {config.label}
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${
      status === 'active' 
        ? 'bg-green-100 text-green-800 border-green-200' 
        : 'bg-red-100 text-red-800 border-red-200'
    }`}>
      {status === 'active' ? 'Active' : 'Inactive'}
    </span>
  );
};

const EmptyState: React.FC<EmptyStateProps> = ({ message, icon = "📊", action }) => (
  <div className="text-center py-12 bg-gradient-to-br from-orange-50 to-white rounded-2xl border-2 border-dashed border-orange-300">
    <div className="text-6xl mb-4">{icon}</div>
    <p className="text-xl font-bold text-gray-900 mb-3 bg-gradient-to-r from-orange-600 to-orange-400 bg-clip-text text-transparent">
      {message}
    </p>
    {action}
  </div>
);

const ChartCard: React.FC<ChartCardProps> = ({ title, description, children }) => (
  <div className="bg-gradient-to-br from-white to-orange-50/30 rounded-2xl border border-orange-200 p-6 shadow-lg">
    <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">{title}</h3>
    <div className="h-80 flex items-center justify-center mb-4">
      {children}
    </div>
    <p className="text-sm text-gray-600 text-center italic border-t border-orange-200 pt-4">
      {description}
    </p>
  </div>
);

// Chart Components using Chart.js - Fixed colors for different categories
const UserDistributionChart = ({ userDistribution }: { userDistribution: Array<{_id: string, count: number}> }) => {
  const [chart, setChart] = useState<any>(null);
  
  useEffect(() => {
    const initChart = async () => {
      if (typeof window !== 'undefined') {
        const ChartJS = (await import('chart.js/auto')).default;
        
        const ctx = document.getElementById('userChart') as HTMLCanvasElement;
        if (ctx) {
          if (chart) chart.destroy();
          
          const newChart = new ChartJS(ctx, {
            type: 'doughnut',
            data: {
              labels: userDistribution.map(item => item._id.charAt(0).toUpperCase() + item._id.slice(1)),
              datasets: [{
                data: userDistribution.map(item => item.count),
                backgroundColor: [
                  ORANGE_THEME.primary, // Admin - Orange
                  '#6bb7cc', // Staff - Blue
                  '#10B981', // Vet - Green
                  '#f8b679', // Trainer - Yellow
                  '#8B5CF6'  // Adopter - Purple
                ],
                borderColor: [
                  ORANGE_THEME.primaryDark,
                  '#5aa5b9',
                  '#059669',
                  '#e6a467',
                  '#7C3AED'
                ],
                borderWidth: 2,
              }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  position: 'bottom',
                  labels: {
                    padding: 20,
                    usePointStyle: true,
                    font: {
                      size: 12
                    }
                  }
                }
              }
            }
          });
          setChart(newChart);
        }
      }
    };

    if (userDistribution && userDistribution.length > 0) {
      initChart();
    }

    return () => {
      if (chart) {
        chart.destroy();
      }
    };
  }, [userDistribution]);

  return <canvas id="userChart" width="400" height="200" />;
};

const PetDistributionChart = ({ petDistribution }: { petDistribution: Array<{_id: string, count: number}> }) => {
  const [chart, setChart] = useState<any>(null);
  
  useEffect(() => {
    const initChart = async () => {
      if (typeof window !== 'undefined') {
        const ChartJS = (await import('chart.js/auto')).default;
        
        const ctx = document.getElementById('petChart') as HTMLCanvasElement;
        if (ctx) {
          if (chart) chart.destroy();
          
          const newChart = new ChartJS(ctx, {
            type: 'bar',
            data: {
              labels: petDistribution.map(item => {
                // Map backend status to display names
                const statusMap: Record<string, string> = {
                  'available': 'Available',
                  'adopted': 'Adopted',
                  'pending': 'Pending',
                  'training': 'In Training',
                  'unavailable': 'Unavailable'
                };
                return statusMap[item._id] || item._id.charAt(0).toUpperCase() + item._id.slice(1);
              }),
              datasets: [{
                label: 'Number of Pets',
                data: petDistribution.map(item => item.count),
                backgroundColor: [
                  '#10B981', // Available - Green
                  ORANGE_THEME.primary, // Adopted - Orange
                  '#f8b679', // Pending - Yellow
                  '#6bb7cc', // Training - Blue
                  '#EF4444'  // Unavailable - Red
                ],
                borderColor: [
                  '#059669',
                  ORANGE_THEME.primaryDark,
                  '#e6a467',
                  '#5aa5b9',
                  '#DC2626'
                ],
                borderWidth: 2,
              }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  display: false
                }
              },
              scales: {
                y: {
                  beginAtZero: true,
                  ticks: {
                    stepSize: 5
                  },
                  title: {
                    display: true,
                    text: 'Number of Pets'
                  }
                },
                x: {
                  title: {
                    display: true,
                    text: 'Pet Status'
                  }
                }
              }
            }
          });
          setChart(newChart);
        }
      }
    };

    if (petDistribution && petDistribution.length > 0) {
      initChart();
    }

    return () => {
      if (chart) {
        chart.destroy();
      }
    };
  }, [petDistribution]);

  return <canvas id="petChart" width="400" height="200" />;
};

// Default avatar function
const getDefaultAvatar = (name: string) => {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=rgb(231,111,81)&color=fff&size=128&bold=true`;
};

// API calls - UPDATED based on your backend (keep your existing API calls)
const adminAPI = {
  getAnalytics: (): Promise<Analytics> => 
    http.get("/admin/analytics").then(res => res.data.analytics),
  
  getUsers: (params: UserFilters): Promise<UsersResponse> => 
    http.get("/admin/users", { params }).then(res => ({
      users: res.data.users || [],
      pagination: res.data.pagination || { page: 1, limit: 10, total: 0, pages: 0 }
    })),
  
  updateUserRole: (userId: string, role: UserRole): Promise<any> => 
    http.patch(`/admin/users/${userId}/role`, { role }).then(res => res.data),
  
  deleteUser: (userId: string): Promise<any> => 
    http.delete(`/admin/users/${userId}`).then(res => res.data),
  
  getOrganizations: (): Promise<Organization[]> => 
    http.get("/admin/organizations").then(res => res.data.organizations || []),
  
  getActivityLogs: (params: { limit: number; page?: number }): Promise<ActivityLogsResponse> => 
    http.get("/admin/activity-logs", { params }).then(res => ({
      logs: res.data.logs || [],
      pagination: res.data.pagination || { page: 1, limit: 50, total: 0, pages: 0 }
    })),
  
  getSystemHealth: (): Promise<SystemHealth> => 
    http.get("/admin/system-health").then(res => res.data),
  
  updateOrganization: (orgId: string, data: Partial<Organization>): Promise<any> => 
    http.patch(`/admin/organizations/${orgId}`, data).then(res => res.data),
  
  deleteOrganization: (orgId: string): Promise<any> => 
    http.delete(`/admin/organizations/${orgId}`).then(res => res.data)
};

// Main Component
export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"analytics" | "users" | "organizations" | "activity" | "system">("analytics");
  const [userFilters, setUserFilters] = useState<UserFilters>({ 
    page: 1, 
    limit: 10, 
    search: "",
    role: "all",
    status: "all"
  });

  // Access control
  if (!user || user.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-orange-50 relative overflow-hidden">
        <FloatingParticles />
        <AuraEffect intensity={4} size={500} className="top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
        <div className="text-center bg-white/80 backdrop-blur-md rounded-3xl shadow-2xl p-12 max-w-md mx-4 border border-orange-200 relative z-10">
          <div className="text-8xl mb-6">🚫</div>
          <div className="text-3xl font-bold text-gray-900 mb-4">Access Restricted</div>
          <div className="text-gray-600 text-lg">Admin authorization required to access this dashboard.</div>
        </div>
      </div>
    );
  }

  // Queries - UPDATED to handle backend response structure (keep your existing queries)
  const { data: analytics, isLoading: analyticsLoading, error: analyticsError } = useQuery({
    queryKey: ['admin-analytics'],
    queryFn: adminAPI.getAnalytics,
    refetchInterval: 30000
  });

  const { data: usersData, isLoading: usersLoading, error: usersError } = useQuery({
    queryKey: ['admin-users', userFilters],
    queryFn: () => adminAPI.getUsers(userFilters)
  });

  const { data: organizations, isLoading: orgsLoading, error: orgsError } = useQuery({
    queryKey: ['admin-organizations'],
    queryFn: adminAPI.getOrganizations
  });

  const { data: activityLogs, isLoading: logsLoading, error: logsError } = useQuery({
    queryKey: ['admin-logs'],
    queryFn: () => adminAPI.getActivityLogs({ limit: 50 })
  });

  const { data: systemHealth, isLoading: healthLoading, error: healthError } = useQuery({
    queryKey: ['admin-system-health'],
    queryFn: adminAPI.getSystemHealth,
    refetchInterval: 60000
  });

  // Log errors for debugging
  useEffect(() => {
    if (analyticsError) console.error('Analytics Error:', analyticsError);
    if (usersError) console.error('Users Error:', usersError);
    if (orgsError) console.error('Organizations Error:', orgsError);
    if (logsError) console.error('Logs Error:', logsError);
    if (healthError) console.error('Health Error:', healthError);
  }, [analyticsError, usersError, orgsError, logsError, healthError]);

  // Mutations (keep your existing mutations)
  const updateRoleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: UserRole }) => 
      adminAPI.updateUserRole(userId, role),
    onSuccess: () => {
      toast.success("User role updated successfully");
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-analytics'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to update role");
    }
  });

  const deleteUserMutation = useMutation({
    mutationFn: (userId: string) => adminAPI.deleteUser(userId),
    onSuccess: () => {
      toast.success("User deleted successfully");
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-analytics'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to delete user");
    }
  });

  const updateOrganizationMutation = useMutation({
    mutationFn: ({ orgId, data }: { orgId: string; data: Partial<Organization> }) => 
      adminAPI.updateOrganization(orgId, data),
    onSuccess: () => {
      toast.success("Organization updated successfully");
      queryClient.invalidateQueries({ queryKey: ['admin-organizations'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to update organization");
    }
  });

  const deleteOrganizationMutation = useMutation({
    mutationFn: (orgId: string) => adminAPI.deleteOrganization(orgId),
    onSuccess: () => {
      toast.success("Organization deleted successfully");
      queryClient.invalidateQueries({ queryKey: ['admin-organizations'] });
      queryClient.invalidateQueries({ queryKey: ['admin-analytics'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to delete organization");
    }
  });

  // Data
  const users = usersData?.users || [];
  const logs = activityLogs?.logs || [];
  const orgs = organizations || [];

  const handleRoleUpdate = (userId: string, newRole: UserRole) => {
    updateRoleMutation.mutate({ userId, role: newRole });
  };

  const handleDeleteUser = (userId: string, userName: string) => {
    if (window.confirm(`Are you sure you want to delete ${userName}? This action cannot be undone.`)) {
      deleteUserMutation.mutate(userId);
    }
  };

  const handleDeleteOrganization = (orgId: string, orgName: string) => {
    if (window.confirm(`Are you sure you want to delete ${orgName}? This action cannot be undone.`)) {
      deleteOrganizationMutation.mutate(orgId);
    }
  };

  const handleStatusToggle = (orgId: string, orgName: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    updateOrganizationMutation.mutate({ 
      orgId, 
      data: { status: newStatus } 
    });
  };

  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const refreshData = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-analytics'] });
    queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    queryClient.invalidateQueries({ queryKey: ['admin-organizations'] });
    queryClient.invalidateQueries({ queryKey: ['admin-logs'] });
    queryClient.invalidateQueries({ queryKey: ['admin-system-health'] });
    toast.success('Data refreshed successfully!');
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
        {/* Enhanced Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-12">
          <div className="mb-6 lg:mb-0">
            <div className="flex items-center space-x-4 mb-4">
              <div className="relative">
                <img 
                  src={typeof user.avatar === 'string' ? user.avatar : user.avatar?.url || getDefaultAvatar(user.name || 'A')}
                  alt={user.name}
                  className="w-16 h-16 rounded-2xl border-4 border-white shadow-lg"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = getDefaultAvatar(user.name || 'A');
                  }}
                />
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 border-2 border-white rounded-full"></div>
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-orange-400 bg-clip-text text-transparent">
                  Admin Dashboard
                </h1>
                <p className="text-gray-600 text-lg mt-1">
                  Welcome back, <span className="font-semibold text-gray-800">{user.name}</span>! Here's your system overview.
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
            title="Total Users" 
            value={analytics?.overview?.totalUsers || 0} 
            icon="👥"
            color="orange"
            trend={5.2}
          />
          <StatCard 
            title="Total Pets" 
            value={analytics?.overview?.totalPets || 0} 
            icon="🐾"
            color="green"
            trend={12.7}
          />
          <StatCard 
            title="Adoption Requests" 
            value={analytics?.overview?.totalAdoptionRequests || 0} 
            icon="🏠"
            color="yellow"
            trend={8.3}
          />
          <StatCard 
            title="Organizations" 
            value={analytics?.overview?.totalOrganizations || 0} 
            icon="🏢"
            color="purple"
            trend={3.1}
          />
        </div>

        {/* Main Content Container with Glass Morphism */}
        <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-2xl border border-orange-200 overflow-hidden">
          {/* Tab Navigation - Fixed to prevent scrollbar and take full width */}
          <div className="border-b border-orange-200 bg-orange-50/50">
            <div className="flex w-full">
              <TabButton
                active={activeTab === 'analytics'}
                onClick={() => setActiveTab('analytics')}
                icon="📊"
                label="Analytics"
              />
              <TabButton
                active={activeTab === 'users'}
                onClick={() => setActiveTab('users')}
                icon="👥"
                label="User Management"
                count={users.length}
              />
              <TabButton
                active={activeTab === 'organizations'}
                onClick={() => setActiveTab('organizations')}
                icon="🏢"
                label="Organizations"
                count={orgs.length}
              />
              <TabButton
                active={activeTab === 'activity'}
                onClick={() => setActiveTab('activity')}
                icon="📋"
                label="Activity Logs"
                count={logs.length}
              />
              <TabButton
                active={activeTab === 'system'}
                onClick={() => setActiveTab('system')}
                icon="🔧"
                label="System Health"
              />
            </div>
          </div>

          {/* Tab Content - Fixed to fill remaining space */}
          <div className="p-6 min-h-[600px]">
            {/* Analytics Tab */}
            {activeTab === "analytics" && (
              <div className="h-full">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">System Analytics</h2>
                
                {analyticsLoading ? (
                  <LoadingSpinner />
                ) : analytics ? (
                  <div className="space-y-8">
                    {/* Charts Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      <ChartCard 
                        title="User Distribution by Role" 
                        description="Breakdown of users by their roles in the PetConnect platform."
                      >
                        <UserDistributionChart userDistribution={analytics.userDistribution || []} />
                      </ChartCard>

                      <ChartCard 
                        title="Pet Status Distribution" 
                        description="Current status of all pets in the system (available, adopted, or pending)."
                      >
                        <PetDistributionChart petDistribution={analytics.petDistribution || []} />
                      </ChartCard>
                    </div>

                    {/* Additional Metrics */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="bg-gradient-to-br from-orange-50 to-white rounded-2xl border border-orange-200 p-6 text-center">
                        <div className="text-2xl font-bold text-orange-600 mb-2">
                          {analytics.overview?.recentAdoptions || 0}
                        </div>
                        <p className="text-sm text-gray-600">Recent Adoptions (7 days)</p>
                      </div>
                      <div className="bg-gradient-to-br from-green-50 to-white rounded-2xl border border-green-200 p-6 text-center">
                        <div className="text-2xl font-bold text-green-600 mb-2">
                          {Math.round((analytics.overview?.recentAdoptions || 0) / (analytics.overview?.totalAdoptionRequests || 1) * 100)}%
                        </div>
                        <p className="text-sm text-gray-600">Adoption Success Rate</p>
                      </div>
                      <div className="bg-gradient-to-br from-purple-50 to-white rounded-2xl border border-purple-200 p-6 text-center">
                        <div className="text-2xl font-bold text-purple-600 mb-2">
                          {orgs.length}
                        </div>
                        <p className="text-sm text-gray-600">Active Organizations</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <EmptyState message="No analytics data available" />
                )}
              </div>
            )}

            {/* Users Tab */}
            {activeTab === "users" && (
              <div className="h-full">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
                  <h2 className="text-2xl font-bold text-gray-800">User Management</h2>
                  <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
                    <input
                      type="text"
                      placeholder="Search users by name or email..."
                      className="px-4 py-3 border-2 border-orange-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all bg-white/80 backdrop-blur-sm w-full lg:w-80"
                      value={userFilters.search}
                      onChange={(e) => setUserFilters(prev => ({ ...prev, search: e.target.value }))}
                    />
                    <select
                      value={userFilters.role}
                      onChange={(e) => setUserFilters(prev => ({ ...prev, role: e.target.value }))}
                      className="px-4 py-3 border-2 border-orange-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all bg-white/80 backdrop-blur-sm"
                    >
                      <option value="all">All Roles</option>
                      <option value="adopter">Adopter</option>
                      <option value="staff">Staff</option>
                      <option value="vet">Vet</option>
                      <option value="trainer">Trainer</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                </div>

                {usersLoading ? (
                  <LoadingSpinner />
                ) : users.length > 0 ? (
                  <div className="space-y-4">
                    {users.map((userItem) => (
                      <div key={userItem._id} className="bg-gradient-to-r from-orange-50 to-white border-2 border-orange-100 rounded-2xl p-6 hover:shadow-xl transition-all duration-300 group">
                        <AuraEffect intensity={0.2} size={100} className="opacity-0 group-hover:opacity-100 transition-opacity duration-500 -top-8 -right-8" />
                        
                        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center">
                          <div className="flex-1 mb-4 lg:mb-0">
                            <h3 className="text-lg font-bold text-orange-700 mb-1">{userItem.name || 'No Name'}</h3>
                            <p className="text-gray-600 mb-2">{userItem.email}</p>
                            <div className="flex flex-wrap gap-2">
                              <RoleBadge role={userItem.role} />
                              <StatusBadge status={userItem.status} />
                            </div>
                          </div>
                          <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
                            <select
                              value={userItem.role}
                              onChange={(e) => handleRoleUpdate(userItem._id, e.target.value as UserRole)}
                              disabled={updateRoleMutation.isPending}
                              className="px-3 py-2 border-2 border-orange-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all bg-white text-sm"
                            >
                              {["adopter", "staff", "vet", "trainer", "admin"].map((role) => (
                                <option key={role} value={role}>
                                  {role.charAt(0).toUpperCase() + role.slice(1)}
                                </option>
                              ))}
                            </select>
                            {userItem._id !== user._id && (
                              <button
                                onClick={() => handleDeleteUser(userItem._id, userItem.name || 'User')}
                                disabled={deleteUserMutation.isPending}
                                className="bg-red-600 text-white px-4 py-2 rounded-xl hover:bg-red-700 transition-all duration-300 font-semibold text-sm shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {deleteUserMutation.isPending ? "Deleting..." : "Delete User"}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState message="No users found" icon="👥" />
                )}
              </div>
            )}

            {/* Organizations Tab */}
            {activeTab === "organizations" && (
              <div className="h-full">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Partner Organizations</h2>
                <p className="text-gray-600 mb-6">
                  Manage shelters, rescue groups, and other partner organizations in the PetConnect network.
                </p>
                
                {orgsLoading ? (
                  <LoadingSpinner />
                ) : orgs.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {orgs.map((org) => (
                      <div key={org._id} className="bg-gradient-to-br from-white to-orange-50/30 rounded-2xl border border-orange-200 p-6 hover:shadow-xl transition-all duration-300 group">
                        <AuraEffect intensity={0.2} size={80} className="opacity-0 group-hover:opacity-100 transition-opacity duration-500 -top-4 -right-4" />
                        
                        <h3 className="text-xl font-bold text-orange-700 mb-2">{org.name}</h3>
                        <p className="text-gray-600 mb-4">Type: {org.type}</p>
                        
                        {org.contact && (
                          <div className="space-y-2 mb-4">
                            {org.contact.email && (
                              <p className="text-sm text-gray-600">📧 {org.contact.email}</p>
                            )}
                            {org.contact.phone && (
                              <p className="text-sm text-gray-600">📞 {org.contact.phone}</p>
                            )}
                            {org.contact.address && (
                              <p className="text-sm text-gray-600">📍 {org.contact.address}</p>
                            )}
                          </div>
                        )}
                        
                        <div className="flex items-center justify-between mt-4">
                          <StatusBadge status={org.status} />
                          <div className="flex gap-2">
                            <button 
                              onClick={() => handleStatusToggle(org._id, org.name || 'Organization', org.status || 'active')}
                              disabled={updateOrganizationMutation.isPending}
                              className={`px-3 py-2 rounded-xl text-sm font-semibold transition-all duration-300 ${
                                org.status === 'active' 
                                  ? 'bg-red-600 hover:bg-red-700 text-white'
                                  : 'bg-green-600 hover:bg-green-700 text-white'
                              } ${updateOrganizationMutation.isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                              {updateOrganizationMutation.isPending ? "Updating..." : (org.status === 'active' ? 'Deactivate' : 'Activate')}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState message="No organizations found" icon="🏢" />
                )}
              </div>
            )}

            {/* Activity Logs Tab */}
            {activeTab === "activity" && (
              <div className="h-full">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">System Activity Logs</h2>
                <p className="text-gray-600 mb-6">
                  Recent system activities and user actions across the PetConnect platform.
                </p>
                
                {logsLoading ? (
                  <LoadingSpinner />
                ) : logs.length > 0 ? (
                  <div className="border-2 border-orange-200 rounded-2xl overflow-hidden">
                    <table className="min-w-full divide-y divide-orange-200">
                      <thead className="bg-orange-50">
                        <tr>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-orange-700 uppercase tracking-wider">
                            User
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-orange-700 uppercase tracking-wider">
                            Role
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-orange-700 uppercase tracking-wider">
                            Action
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-orange-700 uppercase tracking-wider">
                            Target
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-orange-700 uppercase tracking-wider">
                            Details
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-orange-700 uppercase tracking-wider">
                            Timestamp
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-orange-200">
                        {logs.map((log) => (
                          <tr key={log._id} className="hover:bg-orange-50/50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                              {log.user?.name || "System"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                              {log.user?.role || "N/A"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-orange-600">
                              {log.action}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                              {log.target || "-"}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600">
                              {log.details || "-"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                              {new Date(log.createdAt).toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <EmptyState message="No activity logs found" icon="📋" />
                )}
              </div>
            )}

            {/* System Health Tab */}
            {activeTab === "system" && (
              <div className="h-full">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">System Health & Status</h2>
                <p className="text-gray-600 mb-6">
                  Current status of PetConnect platform services and components.
                </p>
                
                {healthLoading ? (
                  <LoadingSpinner />
                ) : systemHealth ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Service Status */}
                    <div className="bg-gradient-to-br from-white to-orange-50/30 rounded-2xl border border-orange-200 p-6 shadow-lg">
                      <h3 className="text-xl font-bold text-gray-900 mb-4 border-b border-orange-200 pb-3">
                        Service Status
                      </h3>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center py-3 border-b border-orange-200">
                          <span className="text-gray-700">Database Connection:</span>
                          <StatusBadge status={systemHealth.healthChecks.database} type="system" />
                        </div>
                        <div className="flex justify-between items-center py-3 border-b border-orange-200">
                          <span className="text-gray-700">Authentication Service:</span>
                          <StatusBadge status={systemHealth.healthChecks.authentication} type="system" />
                        </div>
                        <div className="flex justify-between items-center py-3 border-b border-orange-200">
                          <span className="text-gray-700">File Storage:</span>
                          <StatusBadge status={systemHealth.healthChecks.fileStorage} type="system" />
                        </div>
                        <div className="flex justify-between items-center py-3 border-b border-orange-200">
                          <span className="text-gray-700">Email Service:</span>
                          <StatusBadge status={systemHealth.healthChecks.emailService} type="system" />
                        </div>
                        <div className="flex justify-between items-center py-3 border-b border-orange-200">
                          <span className="text-gray-700">Server Uptime:</span>
                          <span className="font-semibold">{formatUptime(systemHealth.uptime)}</span>
                        </div>
                        <div className="flex justify-between items-center py-3">
                          <span className="text-gray-700">Last Health Check:</span>
                          <span className="text-sm text-gray-500">
                            {new Date(systemHealth.timestamp).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* System Information */}
                    <div className="bg-gradient-to-br from-white to-green-50/30 rounded-2xl border border-green-200 p-6 shadow-lg">
                      <h3 className="text-xl font-bold text-gray-900 mb-4 border-b border-green-200 pb-3">
                        System Information
                      </h3>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center py-3 border-b border-green-200">
                          <span className="text-gray-700">Platform Version:</span>
                          <span className="font-semibold">PetConnect v2.1.0</span>
                        </div>
                        <div className="flex justify-between items-center py-3 border-b border-green-200">
                          <span className="text-gray-700">Total Users:</span>
                          <span className="font-semibold">{systemHealth.totalUsers} registered</span>
                        </div>
                        <div className="flex justify-between items-center py-3 border-b border-green-200">
                          <span className="text-gray-700">Active Pets:</span>
                          <span className="font-semibold">{systemHealth.totalPets} in system</span>
                        </div>
                        <div className="flex justify-between items-center py-3">
                          <span className="text-gray-700">Partner Organizations:</span>
                          <span className="font-semibold">{systemHealth.totalOrganizations} partners</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <EmptyState message="System health data unavailable" icon="🔧" />
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}