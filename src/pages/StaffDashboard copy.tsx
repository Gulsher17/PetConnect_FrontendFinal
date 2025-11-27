// src/pages/StaffDashboard.tsx
import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";

import NavBar from "../components/layout/NavBar";
import Footer from "../components/layout/Footer";
import { useAuth } from "../features/auth/useAuth";
import { http } from "../lib/http";
import { useSocket } from "../hooks/useSocket";
import type { MessageData } from "../types/socket.types";

/* =========================
   Types (defensive, partial)
   ========================= */
type ImageObj = { url?: string; isPrimary?: boolean } | null | undefined;

type AnyObj = Record<string, any>;

export interface Pet {
  _id: string;
  name?: string;
  breed?: string;
  age?: number;
  gender?: string;
  status?: string;
  images?: ImageObj[];
  organization?: { name?: string };
}

export interface MeetingInfo {
  date?: string | Date;
  confirmed?: boolean;
  type?: "virtual" | "in-person";
  status?: "scheduled" | "completed";
  location?: string;
  startTime?: string;
  endTime?: string;
}

export interface Adopter {
  _id?: string;
  name?: string;
  email?: string;
  location?: string;
}

export interface AdoptionReq {
  _id: string;
  status:
  | "pending"
  | "approved"
  | "ignored"
  | "rejected"
  | "on_hold"
  | "finalized"
  | "meeting"
  | "chat"
  | "agreement_sent"
  | "agreement_signed"
  | "payment_pending"
  | "payment_completed"
  | "payment_failed";
  pet?: Pet | null;
  adopter?: Adopter | null;
  meeting?: MeetingInfo;
}

export interface AvailabilitySlot {
  day: string; // "Monday" etc
  startTime: string; // "09:00"
  endTime: string; // "17:00"
  date?: string; // optional ISO
}

/* =========================
   Helpers
   ========================= */
const statusChip = (s?: string) => {
  const base = "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium";
  switch (s) {
    case "pending":
      return base + " bg-yellow-100 text-yellow-800";
    case "approved":
      return base + " bg-blue-100 text-blue-800";
    case "meeting":
      return base + " bg-indigo-100 text-indigo-800";
    case "finalized":
      return base + " bg-green-100 text-green-800";
    case "ignored":
    case "rejected":
      return base + " bg-red-100 text-red-800";
    case "on_hold":
      return base + " bg-gray-200 text-gray-700";
    case "chat":
      return base + " bg-purple-100 text-purple-800";
    case "agreement_sent":
    case "agreement_signed":
      return base + " bg-emerald-100 text-emerald-800";
    case "payment_pending":
      return base + " bg-orange-100 text-orange-800";
    case "payment_completed":
      return base + " bg-green-100 text-green-800";
    case "payment_failed":
      return base + " bg-red-100 text-red-800";
    default:
      return base + " bg-gray-100 text-gray-800";
  }
};

function getPrimaryImage(images?: ImageObj[]): string {
  if (!images || images.length === 0) return "/placeholder.jpg";
  const list = images.filter(Boolean) as { url?: string; isPrimary?: boolean }[];
  const primary = list.find((i) => i?.isPrimary && i?.url);
  return (primary?.url ?? list.find((i) => i?.url)?.url) || "/placeholder.jpg";
}

function title(s?: string) {
  if (!s) return "";
  return s
    .toLowerCase()
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/* =========================
   API Calls (exact endpoints)
   ========================= */
const fetchOrgPets = async (): Promise<Pet[]> => {
  const res = await http.get("/pets/organization");
  return res.data ?? [];
};

const fetchRequests = async (): Promise<AdoptionReq[]> => {
  const res = await http.get("/adoptions/requests");
  return res.data ?? [];
};

const fetchAvailability = async (): Promise<AvailabilitySlot[]> => {
  const res = await http.get("/auth/staff/availability");
  // Backend returns [] if none
  return res.data ?? [];
};

const postAvailability = async (slots: AvailabilitySlot[]) => {
  // availabilityService.setWeeklyAvailability expects array overwrite
  return http.post("/auth/staff/availability", { slots });
};

const patchRequestStatus = async (d: {
  id: string;
  status: AdoptionReq["status"];
  meetingDate?: string;
}) => {
  return http.patch(`/adoptions/${d.id}/status`, d);
};

const patchPetStatus = async (d: { id: string; status: string }) => {
  return http.patch(`/pets/${d.id}/status`, { status: d.status });
};

/* =========================
   Component
   ========================= */
export default function StaffDashboard() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { socket, connected } = useSocket();

  // ✅ ADD CHAT STATE 
  const [chatConversations, setChatConversations] = useState<AnyObj[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<AnyObj | null>(null);
  const [conversationMessages, setConversationMessages] = useState<MessageData[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [activeTab, setActiveTab] = useState<"requests" | "pets" | "availability" | "chat">("requests");

  if (!user || user.role !== "staff") {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-gray-600">
        Unauthorized
      </div>
    );
  }

  // Queries
  const petsQ = useQuery({ queryKey: ["orgPets"], queryFn: fetchOrgPets });
  const reqQ = useQuery({ queryKey: ["adoptionRequests"], queryFn: fetchRequests });
  const availQ = useQuery({ queryKey: ["staffAvailability"], queryFn: fetchAvailability });

  // Socket event listeners for real-time chat 
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (message: MessageData) => {
      // console.log('📨 Staff received new message:', message);

      // If this message is for the currently open chat, add it
      if (message.chat === selectedConversation?._id) {
        setConversationMessages(prev => [...prev, message]);
      }

      // Update conversation list with latest message
      setChatConversations(prev =>
        prev.map(conv =>
          conv._id === message.chat
            ? {
              ...conv,
              lastMessage: message,
              lastMessageAt: message.createdAt
            }
            : conv
        )
      );

      // Show notification for new messages in other chats
      if (message.chat !== selectedConversation?._id) {
        toast.success(`New message from ${message.sender.name}`);
      }
    };

    const handleUserTyping = (data: { userId: string; userName: string; chatId: string }) => {
      if (data.chatId === selectedConversation?._id && data.userId !== user?._id) {
        setIsTyping(true);
      }
    };

    const handleUserStopTyping = (data: { userId: string; userName: string; chatId: string }) => {
      if (data.chatId === selectedConversation?._id && data.userId !== user?._id) {
        setIsTyping(false);
      }
    };

    socket.on('new-message', handleNewMessage);
    socket.on('user-typing', handleUserTyping);
    socket.on('user-stop-typing', handleUserStopTyping);

    return () => {
      socket.off('new-message', handleNewMessage);
      socket.off('user-typing', handleUserTyping);
      socket.off('user-stop-typing', handleUserStopTyping);
    };
  }, [socket, selectedConversation, user]);

  // Load staff chats when component mounts - ADD THIS EFFECT
  useEffect(() => {
    if (!user?._id) return;

    const loadStaffChats = async () => {
      try {
        const chatRes = await http.get("/chats");
        // console.log('📨 Staff chat conversations:', chatRes.data);

        let chats = [];
        if (Array.isArray(chatRes.data?.chats)) {
          chats = chatRes.data.chats;
        } else if (Array.isArray(chatRes.data)) {
          chats = chatRes.data;
        } else if (chatRes.data?.success && Array.isArray(chatRes.data.data)) {
          chats = chatRes.data.data;
        }

        // Filter chats where staff is a participant
        const staffChats = chats.filter((chat: AnyObj) =>
          chat.participants?.some((p: any) => p.user?._id === user._id || p._id === user._id)
        );

        setChatConversations(staffChats);
      } catch (error) {
        console.log('Staff chats loading failed:', error);
        setChatConversations([]);
      }
    };

    loadStaffChats();
  }, [user]);

  // Load messages when conversation is selected - ADD THIS EFFECT
  useEffect(() => {
    if (!selectedConversation) {
      setConversationMessages([]);
      return;
    }

    // Join the chat room via socket
    if (socket && connected) {
      socket.emit('join-chat', selectedConversation._id);
    }

    // Load messages for the selected conversation
    (async () => {
      try {
        const messagesRes = await http.get(`/chats/${selectedConversation._id}/messages`);
        console.log('📨 Staff messages response:', messagesRes.data);

        if (Array.isArray(messagesRes.data)) {
          setConversationMessages(messagesRes.data);
        } else if (Array.isArray(messagesRes.data?.messages)) {
          setConversationMessages(messagesRes.data.messages);
        } else if (messagesRes.data?.success && Array.isArray(messagesRes.data.data)) {
          setConversationMessages(messagesRes.data.data);
        } else {
          setConversationMessages([]);
        }
      } catch (error) {
        console.log('Staff messages loading failed:', error);
        setConversationMessages([]);
      }
    })();
  }, [selectedConversation, socket, connected]);

  // Mutations
  const mUpdateReq = useMutation({
    mutationFn: patchRequestStatus,
    onSuccess: () => {
      toast.success("Request updated");
      qc.invalidateQueries({ queryKey: ["adoptionRequests"] });
    },
    onError: (e: any) => toast.error(e?.response?.data?.msg ?? "Failed to update request"),
  });

  const mPetStatus = useMutation({
    mutationFn: patchPetStatus,
    onSuccess: () => {
      toast.success("Pet status updated");
      qc.invalidateQueries({ queryKey: ["orgPets"] });
    },
    onError: (e: any) => toast.error(e?.response?.data?.msg ?? "Failed to update pet"),
  });

  const mAvailability = useMutation({
    mutationFn: (newSlot: AvailabilitySlot) => {
      const current = (availQ.data ?? []) as AvailabilitySlot[];
      const merged = [...current, newSlot];
      return postAvailability(merged);
    },
    onSuccess: () => {
      toast.success("Availability saved");
      qc.invalidateQueries({ queryKey: ["staffAvailability"] });
    },
    onError: (e: any) => toast.error(e?.response?.data?.msg ?? "Failed to save availability"),
  });

  // Chat functions for staff - ADD THESE FUNCTIONS
  const handleTypingStart = () => {
    if (selectedConversation && socket && !isTyping) {
      socket.emit('typing-start', { chatId: selectedConversation._id });
    }
  };

  const handleTypingStop = () => {
    if (selectedConversation && socket && isTyping) {
      socket.emit('typing-stop', { chatId: selectedConversation._id });
      setIsTyping(false);
    }
  };

  const handleSendMessage = () => {
    if (!selectedConversation || !newMessage.trim() || !socket) return;

    socket.emit('send-message', {
      chatId: selectedConversation._id,
      content: newMessage.trim(),
      messageType: 'text'
    });

    const optimisticMessage: MessageData = {
      _id: `temp_${Date.now()}`,
      content: newMessage.trim(),
      sender: {
        _id: user?._id,
        name: user?.name || 'Staff',
        email: user?.email,
        role: user?.role
      },
      createdAt: new Date().toISOString(),
      chat: selectedConversation._id,
      messageType: 'text'
    };

    setConversationMessages(prev => [...prev, optimisticMessage]);
    setNewMessage("");

    // Stop typing
    socket.emit('typing-stop', { chatId: selectedConversation._id });
    setIsTyping(false);
  };

  // Local state for slot form
  const [slot, setSlot] = useState<AvailabilitySlot>({
    day: "Monday",
    startTime: "09:00",
    endTime: "17:00",
  });

  const pets = useMemo(() => (Array.isArray(petsQ.data) ? petsQ.data : []), [petsQ.data]);
  const requests = useMemo(
    () => (Array.isArray(reqQ.data) ? reqQ.data : []),
    [reqQ.data]
  );
  const availability = useMemo(
    () => (Array.isArray(availQ.data) ? availQ.data : []),
    [availQ.data]
  );

  /* ============ UI bits ============ */
  const Empty = ({ children }: { children: React.ReactNode }) => (
    <div className="text-sm text-gray-500">{children}</div>
  );

  const Section = ({ title, action, children }: any) => (
    <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );

  const onApprove = (r: AdoptionReq) =>
    mUpdateReq.mutate({ id: r._id, status: "approved" });

  const onIgnore = (r: AdoptionReq) =>
    mUpdateReq.mutate({ id: r._id, status: "ignored" });

  const onMeeting = (r: AdoptionReq) => {
    const v = window.prompt(
      "Enter meeting date & time (ISO or YYYY-MM-DDTHH:mm). Example: 2025-11-05T14:00"
    );
    if (!v) return;
    // Backend expects meetingDate in body with status=meeting
    mUpdateReq.mutate({ id: r._id, status: "meeting", meetingDate: new Date(v).toISOString() });
  };

  const onFinalize = (r: AdoptionReq) =>
    mUpdateReq.mutate({ id: r._id, status: "finalized" });

  const RequestCard = ({ r }: { r: AdoptionReq }) => {
    const pet = r.pet;
    const adopter = r.adopter;

    return (
      <div className="rounded-xl border border-gray-100 p-4 hover:shadow-sm transition bg-white">
        <div className="flex gap-3">
          <img
            src={getPrimaryImage(pet?.images)}
            className="w-20 h-20 object-cover rounded-lg border"
          />
          <div className="flex-1">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-semibold">
                {(pet?.name || "Pet") + (pet?.breed ? ` • ${pet.breed}` : "")}
              </h3>
              <span className={statusChip(r.status)}>{r.status}</span>
            </div>
            <p className="text-xs text-gray-500">
              Adopter: {adopter?.name || "—"}
              {adopter?.email ? ` • ${adopter.email}` : ""}
              {adopter?.location ? ` • ${adopter.location}` : ""}
            </p>
            {r.meeting?.date && (
              <p className="text-xs text-indigo-700 mt-1">
                Meeting: {new Date(r.meeting.date).toLocaleString()}{" "}
                {r.meeting?.type ? `(${r.meeting.type})` : ""}
                {r.meeting?.confirmed ? " • Confirmed" : ""}
              </p>
            )}

            <div className="flex flex-wrap gap-2 mt-3">
              {r.status === "pending" && (
                <>
                  <button
                    onClick={() => onApprove(r)}
                    className="px-3 py-1.5 rounded-md bg-green-600 text-white text-xs"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => onIgnore(r)}
                    className="px-3 py-1.5 rounded-md border text-red-600 border-red-200 text-xs"
                  >
                    Ignore
                  </button>
                </>
              )}

              {["approved", "meeting"].includes(r.status) && (
                <button
                  onClick={() => onMeeting(r)}
                  className="px-3 py-1.5 rounded-md bg-yellow-500 text-white text-xs"
                >
                  Request Meeting
                </button>
              )}

              {r.status === "meeting" && (
                <button
                  onClick={() => onFinalize(r)}
                  className="px-3 py-1.5 rounded-md bg-indigo-600 text-white text-xs"
                >
                  Finalize Adoption
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const PetCard = ({ p }: { p: Pet }) => {
    return (
      <div className="rounded-xl border border-gray-100 p-3 hover:shadow-sm transition bg-white">
        <img
          src={getPrimaryImage(p.images)}
          className="w-full h-36 object-cover rounded-lg border"
        />
        <div className="mt-2">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold">{p.name || "Unnamed"}</h4>
            <span className="text-[11px] px-2 py-0.5 rounded bg-gray-100 text-gray-700">
              {p.status || "—"}
            </span>
          </div>
          <p className="text-xs text-gray-500">
            {p.breed ? title(p.breed) : "—"}
            {p.organization?.name ? ` • ${p.organization.name}` : ""}
          </p>

          <select
            className="mt-3 w-full border rounded-md text-sm p-2"
            defaultValue=""
            onChange={(e) =>
              e.target.value &&
              mPetStatus.mutate({ id: p._id, status: e.target.value })
            }
          >
            <option value="">Update Status…</option>
            <option value="Available">Available</option>
            <option value="Ready for Treatment">Ready for Treatment</option>
            <option value="In Treatment">In Treatment</option>
            <option value="Ready for Adoption">Ready for Adoption</option>
            <option value="In Training">In Training</option>
            <option value="Training Complete">Training Complete</option>
            <option value="Unavailable">Unavailable</option>
          </select>

          <Link
            to={`/pets/${p._id}`}
            className="mt-2 inline-flex text-xs text-indigo-600 hover:underline"
          >
            View profile →
          </Link>
        </div>
      </div>
    );
  };

  const handleAddSlot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!slot.day || !slot.startTime || !slot.endTime) return;
    if (slot.startTime >= slot.endTime) {
      toast.error("Start time must be before end time");
      return;
    }
    mAvailability.mutate(slot);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <NavBar />
      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <header className="flex items-center justify-between">
          <h1 className="text-2xl sm:text-3xl font-bold">Staff Dashboard</h1>
          <div className="text-sm text-gray-600">
            Signed in as <span className="font-medium">{user.name}</span> · Role:{" "}
            <span className="font-medium">{user.role}</span>
          </div>
        </header>

        {/* ADD TABS NAVIGATION - ADD THIS SECTION */}
        <div className="border-b flex gap-6 text-lg mb-6 flex-wrap">
          {(["requests", "pets", "availability", "chat"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`pb-2 capitalize ${activeTab === t
                ? "border-b-2 border-indigo-600 text-indigo-600 font-semibold"
                : "text-gray-500 hover:text-gray-700"
                }`}
            >
              {t} {t === 'chat' && chatConversations.length > 0 && (
                <span className="ml-1 bg-red-500 text-white text-xs rounded-full px-2 py-1">
                  {chatConversations.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ADD CHAT TAB */}
        {activeTab === "chat" && (
          <div className="pc-card p-5">
            {!selectedConversation ? (
              // Conversations List
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold">Chat Conversations</h2>
                  <div className="text-sm text-gray-500">
                    {connected ? "🟢 Connected" : "🔴 Disconnected"}
                  </div>
                </div>

                {chatConversations.length > 0 ? (
                  <div className="space-y-3">
                    {chatConversations.map((conversation) => {
                      const adopterParticipant = conversation.participants?.find(
                        (p: any) => p.role === 'adopter' || p.user?.role === 'adopter'
                      );
                      const adopter = adopterParticipant?.user || adopterParticipant;

                      return (
                        <div
                          key={conversation._id}
                          className="p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                          onClick={() => setSelectedConversation(conversation)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                                <span className="text-green-700 font-bold">
                                  {adopter?.name?.[0] || "A"}
                                </span>
                              </div>
                              <div>
                                <p className="font-semibold">
                                  {adopter?.name || "Adopter"}
                                </p>
                                <p className="text-sm text-gray-600">
                                  {conversation.lastMessage?.content || "No messages yet"}
                                </p>
                                {conversation.adoptionRequest?.pet && (
                                  <p className="text-xs text-gray-500">
                                    Pet: {conversation.adoptionRequest.pet.name}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              {conversation.lastMessage && (
                                <p className="text-xs text-gray-500">
                                  {new Date(conversation.lastMessage.createdAt).toLocaleDateString()}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    No chat conversations yet.
                  </div>
                )}
              </div>
            ) : (
              // Active Chat
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <button
                    onClick={() => setSelectedConversation(null)}
                    className="pc-btn pc-btn-outline text-sm"
                  >
                    ← Back to Chats
                  </button>
                  {selectedConversation.participants?.map((participant: any) => {
                    const userObj = participant.user || participant;
                    if (userObj._id !== user?._id && userObj.role === 'adopter') {
                      return (
                        <div key={userObj._id} className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                            <span className="text-green-700 font-bold text-sm">
                              {userObj.name?.[0] || "A"}
                            </span>
                          </div>
                          <h2 className="text-xl font-semibold">
                            {userObj.name || "Adopter"}
                          </h2>
                          {selectedConversation.adoptionRequest?.pet && (
                            <span className="text-sm text-gray-500 ml-2">
                              (About: {selectedConversation.adoptionRequest.pet.name})
                            </span>
                          )}
                        </div>
                      );
                    }
                    return null;
                  })}
                  {isTyping && (
                    <span className="text-sm text-gray-500 ml-2">
                      (adopter is typing...)
                    </span>
                  )}
                </div>

                {/* Messages */}
                <div className="h-96 overflow-y-auto border rounded-lg p-4 mb-4 bg-gray-50 space-y-3">
                  {conversationMessages.length === 0 ? (
                    <div className="text-center text-gray-500 mt-20">
                      No messages yet. Start the conversation!
                    </div>
                  ) : (
                    conversationMessages.map((message) => (
                      <div
                        key={message._id}
                        className={`flex ${message.sender?._id === user?._id ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${message.sender?._id === user?._id
                            ? 'bg-indigo-500 text-white rounded-br-none'
                            : 'bg-white border rounded-bl-none'
                            }`}
                        >
                          <p className="text-sm">{message.content}</p>
                          <p
                            className={`text-xs mt-1 ${message.sender?._id === user?._id ? 'text-indigo-200' : 'text-gray-500'
                              }`}
                          >
                            {message.sender?.name} • {new Date(message.createdAt).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Message Input */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => {
                      setNewMessage(e.target.value);
                      if (e.target.value.length > 0) {
                        handleTypingStart();
                      } else {
                        handleTypingStop();
                      }
                    }}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Type your message..."
                    className="flex-1 pc-input"
                  />
                  <button
                    onClick={handleSendMessage}
                    className="pc-btn pc-btn-primary"
                    disabled={!newMessage.trim()}
                  >
                    Send
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* WRAP EXISTING SECTIONS IN CONDITIONAL RENDERING */}
        {activeTab === "requests" && (
          <Section title="Adoption Requests">
            {requests.length === 0 ? (
              <Empty>No adoption requests for your organization.</Empty>
            ) : (
              <div className="space-y-3">
                {requests.map((r) => (
                  <RequestCard key={r._id} r={r} />
                ))}
              </div>
            )}
          </Section>
        )}

        {activeTab === "pets" && (
          <Section title="My Shelter Pets">
            {pets.length === 0 ? (
              <Empty>No pets under your organization yet.</Empty>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {pets.map((p) => (
                  <PetCard key={p._id} p={p} />
                ))}
              </div>
            )}
          </Section>
        )}

        {activeTab === "availability" && (
          <Section
            title="My Availability"
            action={
              <form onSubmit={handleAddSlot} className="flex items-center gap-2">
                <select
                  className="border rounded-md text-sm p-2"
                  value={slot.day}
                  onChange={(e) => setSlot((s) => ({ ...s, day: e.target.value }))}
                >
                  {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
                <input
                  type="time"
                  className="border rounded-md text-sm p-2"
                  value={slot.startTime}
                  onChange={(e) => setSlot((s) => ({ ...s, startTime: e.target.value }))}
                  required
                />
                <input
                  type="time"
                  className="border rounded-md text-sm p-2"
                  value={slot.endTime}
                  onChange={(e) => setSlot((s) => ({ ...s, endTime: e.target.value }))}
                  required
                />
                <button
                  type="submit"
                  className="px-3 py-2 rounded-md bg-indigo-600 text-white text-sm"
                >
                  Add Slot
                </button>
              </form>
            }
          >
            {availability.length === 0 ? (
              <Empty>No availability set yet.</Empty>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {availability.map((a, idx) => (
                  <div
                    key={`${a.day}-${a.startTime}-${a.endTime}-${idx}`}
                    className="rounded-lg border border-gray-100 p-3 text-sm bg-white"
                  >
                    <div className="font-medium">{a.day}</div>
                    <div className="text-gray-600">
                      {a.startTime} – {a.endTime}
                      {a.date ? ` • ${new Date(a.date).toLocaleDateString()}` : ""}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Section>
        )}

        {/* Availability */}
        <Section
          title="My Availability"
          action={
            <form onSubmit={handleAddSlot} className="flex items-center gap-2">
              <select
                className="border rounded-md text-sm p-2"
                value={slot.day}
                onChange={(e) => setSlot((s) => ({ ...s, day: e.target.value }))}
              >
                {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
              <input
                type="time"
                className="border rounded-md text-sm p-2"
                value={slot.startTime}
                onChange={(e) => setSlot((s) => ({ ...s, startTime: e.target.value }))}
                required
              />
              <input
                type="time"
                className="border rounded-md text-sm p-2"
                value={slot.endTime}
                onChange={(e) => setSlot((s) => ({ ...s, endTime: e.target.value }))}
                required
              />
              <button
                type="submit"
                className="px-3 py-2 rounded-md bg-indigo-600 text-white text-sm"
              >
                Add Slot
              </button>
            </form>
          }
        >
          {availability.length === 0 ? (
            <Empty>No availability set yet.</Empty>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {availability.map((a, idx) => (
                <div
                  key={`${a.day}-${a.startTime}-${a.endTime}-${idx}`}
                  className="rounded-lg border border-gray-100 p-3 text-sm bg-white"
                >
                  <div className="font-medium">{a.day}</div>
                  <div className="text-gray-600">
                    {a.startTime} – {a.endTime}
                    {a.date ? ` • ${new Date(a.date).toLocaleDateString()}` : ""}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* Adoption Requests */}
        <Section title="Adoption Requests">
          {requests.length === 0 ? (
            <Empty>No adoption requests for your organization.</Empty>
          ) : (
            <div className="space-y-3">
              {requests.map((r) => (
                <RequestCard key={r._id} r={r} />
              ))}
            </div>
          )}
        </Section>

        {/* Pets */}
        <Section title="My Shelter Pets">
          {pets.length === 0 ? (
            <Empty>No pets under your organization yet.</Empty>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {pets.map((p) => (
                <PetCard key={p._id} p={p} />
              ))}
            </div>
          )}
        </Section>
      </main>
      <Footer />
    </div>
  );
}
