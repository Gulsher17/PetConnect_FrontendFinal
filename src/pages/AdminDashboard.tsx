import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import NavBar from "../components/layout/NavBar";
import Footer from "../components/layout/Footer";
import { useAuth } from "../features/auth/useAuth";
import { http } from "../lib/http";

/* =========================
   Defensive Types
   ========================= */
type UserRole = "admin" | "staff" | "vet" | "adopter" | "trainer";

export interface User {
  _id: string;
  name?: string;
  email?: string;
  role?: UserRole;
  isActive?: boolean;
}

export interface Organization {
  _id: string;
  name?: string;
  address?: string;
  contactEmail?: string;
}

export interface Pet {
  _id: string;
  name?: string;
  breed?: string;
  age?: number;
  gender?: string;
  status?: string;
  organization?: { name?: string };
}

export interface ActivityLog {
  _id: string;
  user?: { name?: string; role?: string };
  action: string;
  target?: string;
  details?: string;
  createdAt: string;
}

/* =========================
   Helper Functions
   ========================= */
const roleChip = (role?: string) => {
  const base = "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium";
  switch (role) {
    case "admin": return base + " bg-blue-100 text-blue-800";
    case "staff": return base + " bg-green-100 text-green-800";
    case "vet": return base + " bg-purple-100 text-purple-800";
    case "adopter": return base + " bg-yellow-100 text-yellow-800";
    case "trainer": return base + " bg-pink-100 text-pink-800";
    default: return base + " bg-gray-100 text-gray-800";
  }
};

const statusChip = (active: boolean) => (
  active
    ? "bg-green-100 text-green-800 px-2 py-0.5 rounded text-xs"
    : "bg-red-100 text-red-800 px-2 py-0.5 rounded text-xs"
);

/* =========================
   API Calls (use http instance)
   ========================= */
const fetchUsers = async (): Promise<User[]> => (await http.get("/users")).data ?? [];
const fetchOrgs = async (): Promise<Organization[]> => (await http.get("/organizations")).data ?? [];
const fetchPets = async (): Promise<Pet[]> => (await http.get("/pets")).data ?? [];
const fetchLogs = async (): Promise<ActivityLog[]> => (await http.get("/admin/activity-logs")).data ?? [];

const patchUserRole = async (d: { id: string; role: UserRole }) =>
  http.patch(`/users/${d.id}/role`, { role: d.role });

const patchUserStatus = async (d: { id: string; isActive: boolean }) =>
  http.patch(`/users/${d.id}/status`, { isActive: d.isActive });

const deleteUser = async (id: string) =>
  http.delete(`/users/${id}`);

/* =========================
   Main Component
   ========================= */
export default function AdminDashboard() {
  const { user } = useAuth();
  const qc = useQueryClient();

  // Access control
  if (!user || user.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-gray-600">
        Unauthorized
      </div>
    );
  }

  // Tab state
  const [activeTab, setActiveTab] = useState<"analytics" | "users" | "orgs" | "logs">("analytics");

  // Queries
  const usersQ = useQuery({ queryKey: ["users"], queryFn: fetchUsers });
  const orgsQ = useQuery({ queryKey: ["organizations"], queryFn: fetchOrgs });
  const petsQ = useQuery({ queryKey: ["pets"], queryFn: fetchPets });
  const logsQ = useQuery({ queryKey: ["logs"], queryFn: fetchLogs });

  // Mutations
  const mUserRole = useMutation({
    mutationFn: patchUserRole,
    onSuccess: () => {
      toast.success("User role updated");
      qc.invalidateQueries({ queryKey: ["users"] });
    }
  });

  const mUserStatus = useMutation({
    mutationFn: patchUserStatus,
    onSuccess: () => {
      toast.success("User status updated");
      qc.invalidateQueries({ queryKey: ["users"] });
    }
  });

  const mDeleteUser = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      toast.success("User deleted");
      qc.invalidateQueries({ queryKey: ["users"] });
    }
  });

  // Data
  const users = useMemo(() => Array.isArray(usersQ.data) ? usersQ.data : [], [usersQ.data]);
  const orgs = useMemo(() => Array.isArray(orgsQ.data) ? orgsQ.data : [], [orgsQ.data]);
  const pets = useMemo(() => Array.isArray(petsQ.data) ? petsQ.data : [], [petsQ.data]);
  const logs = useMemo(() => Array.isArray(logsQ.data) ? logsQ.data : [], [logsQ.data]);

  // Section helpers
  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-8">
      <h2 className="text-lg font-semibold mb-4">{title}</h2>
      {children}
    </section>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <NavBar />
      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        <header className="flex items-center justify-between mb-10">
          <h1 className="text-2xl sm:text-3xl font-bold text-indigo-700">Admin Dashboard</h1>
          <div className="text-sm text-gray-600">
            Signed in as <span className="font-medium">{user.name}</span> · Role: {" "}
            <span className="font-medium">{user.role}</span>
          </div>
        </header>

        {/* Tab Navigation */}
        <div className="flex mb-6 gap-2 border-b">
          {[
            { key: "analytics", label: "📊 Analytics" },
            { key: "users", label: "👥 User Management" },
            { key: "orgs", label: "🏢 Organizations" },
            { key: "logs", label: "📋 Activity Logs" },
          ].map(tab => (
            <button
              key={tab.key}
              className={`py-3 px-6 font-medium border-b-2 transition ${
                activeTab === tab.key
                  ? "border-indigo-600 text-indigo-600"
                  : "text-gray-500 hover:text-gray-700 border-transparent"
              }`}
              onClick={() => setActiveTab(tab.key as typeof activeTab)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === "analytics" && (
            <>
              <Section title="Stats Overview">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-white p-6 rounded-lg shadow border">
                    <h3 className="text-lg font-semibold text-gray-700">Total Users</h3>
                    <p className="text-3xl font-bold text-indigo-600">{users.length}</p>
                  </div>
                  <div className="bg-white p-6 rounded-lg shadow border">
                    <h3 className="text-lg font-semibold text-gray-700">Total Pets</h3>
                    <p className="text-3xl font-bold text-green-600">{pets.length}</p>
                  </div>
                  <div className="bg-white p-6 rounded-lg shadow border">
                    <h3 className="text-lg font-semibold text-gray-700">Organizations</h3>
                    <p className="text-3xl font-bold text-purple-600">{orgs.length}</p>
                  </div>
                  {/* You can add more cards here */}
                </div>
              </Section>
            </>
          )}
          {activeTab === "users" && (
            <Section title="User Management">
              <div className="overflow-x-auto">
                <table className="min-w-full border divide-y divide-gray-200 text-xs md:text-sm">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u._id}>
                        <td>{u.name}</td>
                        <td>{u.email}</td>
                        <td><span className={roleChip(u.role)}>{u.role}</span></td>
                        <td><span className={statusChip(u.isActive ?? false)}>{u.isActive ? "Active" : "Inactive"}</span></td>
                        <td className="space-x-1">
                          <select
                            value={u.role}
                            onChange={e => mUserRole.mutate({ id: u._id, role: e.target.value as UserRole })}
                            className="rounded border px-1 py-1"
                          >
                            {["admin", "staff", "vet", "adopter", "trainer"].map(role => (
                              <option key={role} value={role}>{role}</option>
                            ))}
                          </select>
                          <button
                            className="px-2 py-1 rounded bg-gray-200 text-xs"
                            onClick={() => mUserStatus.mutate({ id: u._id, isActive: !u.isActive })}
                          >
                            {u.isActive ? "Deactivate" : "Activate"}
                          </button>
                          {u._id !== user._id && (
                            <button
                              className="px-2 py-1 rounded bg-red-200 text-red-700 text-xs"
                              onClick={() => mDeleteUser.mutate(u._id)}
                            >
                              Delete
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Section>
          )}
          {activeTab === "orgs" && (
            <Section title="Organizations">
              <div className="overflow-x-auto">
                <table className="min-w-full border divide-y divide-gray-200 text-xs md:text-sm">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Address</th>
                      <th>Contact Email</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orgs.map(org => (
                      <tr key={org._id}>
                        <td>{org.name}</td>
                        <td>{org.address}</td>
                        <td>{org.contactEmail}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Section>
          )}
          {activeTab === "logs" && (
            <Section title="Activity Logs">
              <div className="overflow-x-auto">
                <table className="min-w-full border divide-y divide-gray-200 text-xs md:text-sm">
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Role</th>
                      <th>Action</th>
                      <th>Target</th>
                      <th>Details</th>
                      <th>Timestamp</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.length === 0 ? (
                      <tr><td colSpan={6} className="text-center py-4 text-gray-500">No activity logs found.</td></tr>
                    ) : logs.map(log => (
                      <tr key={log._id}>
                        <td>{log.user?.name || "Unknown"}</td>
                        <td>{log.user?.role || "N/A"}</td>
                        <td className="font-medium text-indigo-700">{log.action}</td>
                        <td>{log.target ?? "-"}</td>
                        <td>{log.details ?? "-"}</td>
                        <td className="text-gray-500">{new Date(log.createdAt).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Section>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
