// src/pages/StaffDashboard.tsx
import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

import NavBar from "../components/layout/NavBar";
import Footer from "../components/layout/Footer";
import ChatInterface from "../components/chat/ChatInterface";
import { useAuth } from "../features/auth/useAuth";
import { http } from "../lib/http";
import { useSocket } from "../hooks/useSocket";
import type { MessageData } from "../types/socket.types";

type AnyObj = Record<string, any>;


const getUnreadCount = (conversation: AnyObj, userId: string | undefined): number => {
  if (!conversation.unreadCounts || !userId) return 0;

  // Get the last message to check if it's from another user
  const lastMessage = conversation.lastMessage;
  if (lastMessage && lastMessage.sender?._id === userId) {
    return 0; 
  }

  if (conversation.unreadCounts instanceof Map) {
    return conversation.unreadCounts.get(userId) || 0;
  } else {
    return conversation.unreadCounts[userId] || 0;
  }
};

/* =========================
   API Calls
   ========================= */
const fetchRequests = async (): Promise<AnyObj[]> => {
  const res = await http.get("/adoptions/requests");
  return res.data ?? [];
};

const patchRequestStatus = async (d: {
  id: string;
  status: string;
  meetingDate?: string;
}) => {
  return http.patch(`/adoptions/${d.id}/status`, d);
};

/* =========================
   Component
   ========================= */
export default function StaffDashboard() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { socket, connected } = useSocket();

  // CHAT STATE
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
  const reqQ = useQuery({ queryKey: ["adoptionRequests"], queryFn: fetchRequests });

  // Socket event listeners for real-time chat
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (message: MessageData) => {
      if (message.chat === selectedConversation?._id) {
        setConversationMessages(prev => [...prev, message]);
      }

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

  //Load staff chats when component mounts
  useEffect(() => {
    if (!user?._id) return;

    const loadStaffChats = async () => {
      try {
        const chatRes = await http.get("/chats");

        let chats = [];
        if (Array.isArray(chatRes.data?.chats)) {
          chats = chatRes.data.chats;
        } else if (Array.isArray(chatRes.data)) {
          chats = chatRes.data;
        } else if (chatRes.data?.success && Array.isArray(chatRes.data.data)) {
          chats = chatRes.data.data;
        }

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

  // Load messages when conversation is selected
  useEffect(() => {
    if (!selectedConversation) {
      setConversationMessages([]);
      return;
    }

    if (socket && connected) {
      socket.emit('join-chat', selectedConversation._id);
    }

    (async () => {
      try {
        const messagesRes = await http.get(`/chats/${selectedConversation._id}/messages`);

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

  // Chat functions for staff
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


    setNewMessage("");
    socket.emit('typing-stop', { chatId: selectedConversation._id });
    setIsTyping(false);
  };

  // Create wrapper function for onTabChange
  const handleTabChange = (tab: string) => {
    setActiveTab(tab as any);
  };

  const requests = useMemo(
    () => (Array.isArray(reqQ.data) ? reqQ.data : []),
    [reqQ.data]
  );

  /* ============ UI bits ============ */
  const Empty = ({ children }: { children: React.ReactNode }) => (
    <div className="text-sm text-gray-500">{children}</div>
  );

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
      <h2 className="text-lg font-semibold mb-4">{title}</h2>
      {children}
    </section>
  );

  const onApprove = (r: AnyObj) =>
    mUpdateReq.mutate({ id: r._id, status: "approved" });

  const onIgnore = (r: AnyObj) =>
    mUpdateReq.mutate({ id: r._id, status: "ignored" });

  const onMeeting = (r: AnyObj) => {
    const v = window.prompt(
      "Enter meeting date & time (ISO or YYYY-MM-DDTHH:mm). Example: 2025-11-05T14:00"
    );
    if (!v) return;
    mUpdateReq.mutate({ id: r._id, status: "meeting", meetingDate: new Date(v).toISOString() });
  };

  const onFinalize = (r: AnyObj) =>
    mUpdateReq.mutate({ id: r._id, status: "finalized" });

  const RequestCard = ({ r }: { r: AnyObj }) => {
    const pet = r.pet;
    const adopter = r.adopter;

    return (
      <div className="rounded-xl border border-gray-100 p-4 hover:shadow-sm transition bg-white">
        <div className="flex gap-3">
          <img
            src={pet?.images?.[0]?.url || "/placeholder.jpg"}
            className="w-20 h-20 object-cover rounded-lg border"
            alt={pet?.name || "Pet"}
          />
          <div className="flex-1">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-semibold">
                {(pet?.name || "Pet") + (pet?.breed ? ` • ${pet.breed}` : "")}
              </h3>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                {r.status}
              </span>
            </div>
            <p className="text-xs text-gray-500">
              Adopter: {adopter?.name || "—"}
              {adopter?.email ? ` • ${adopter.email}` : ""}
              {adopter?.location ? ` • ${adopter.location}` : ""}
            </p>

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

        {/* TABS NAVIGATION */}
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

        {/* CHAT TAB */}
        {activeTab === "chat" && (
          <ChatInterface
            chatConversations={chatConversations}
            selectedConversation={selectedConversation}
            conversationMessages={conversationMessages}
            isTyping={isTyping}
            newMessage={newMessage}
            staffMembers={[]}
            connected={connected}
            setSelectedConversation={setSelectedConversation}
            setNewMessage={setNewMessage}
            handleStartChat={() => {}} 
            handleSendMessage={handleSendMessage}
            handleTypingStart={handleTypingStart}
            handleTypingStop={handleTypingStop}
            getUnreadCount={(conv) => getUnreadCount(conv, user?._id)}
            userRole="staff"
            currentUser={user}
            onTabChange={handleTabChange} 
          />
        )}

        {/* REQUESTS TAB */}
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

        {/* right now PETS TAB - EMPTY SINCE NO API */}
        {activeTab === "pets" && (
          <Section title="My Shelter Pets">
            <Empty>No pets under your organization yet.</Empty>
          </Section>
        )}

        {/* Right now AVAILABILITY TAB - EMPTY SINCE NO API */}
        {activeTab === "availability" && (
          <Section title="My Availability">
            <Empty>No availability set yet.</Empty>
          </Section>
        )}
      </main>
      <Footer />
    </div>
  );
}