// src/pages/Dashboard.tsx
import { useEffect, useMemo, useState, useRef } from "react";
import { Link } from "react-router-dom";
import NavBar from "../components/layout/NavBar";
import Footer from "../components/layout/Footer";
import { useAuth } from "../features/auth/useAuth";
import { http } from "../lib/http";
import toast from "react-hot-toast";
import { useSocket } from "../hooks/useSocket";
import type { MessageData } from "../types/socket.types";
import PetCard from "@/components/layout/PetCard";

type AnyObj = Record<string, any>;

export default function Dashboard() {
  const { user: authUser, token } = useAuth();
  const { socket, connected } = useSocket();

  const [loading, setLoading] = useState(true);

  const [me, setMe] = useState<AnyObj | null>(null);
  const [availablePets, setAvailablePets] = useState<AnyObj[]>([]);
  const [requests, setRequests] = useState<AnyObj[]>([]);
  const [favorites, setFavorites] = useState<AnyObj[]>([]);
  const [activity, setActivity] = useState<AnyObj[]>([]);
  const [myListings, setMyListings] = useState<AnyObj[]>([]);

  // CHAT STATE
  const [chatConversations, setChatConversations] = useState<AnyObj[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<AnyObj | null>(null);
  const [conversationMessages, setConversationMessages] = useState<MessageData[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [staffMembers, setStaffMembers] = useState<AnyObj[]>([]);

  const [tab, setTab] = useState<
    "overview" | "favorites" | "requests" | "activity" | "myListings" | "chat"
  >("overview");

 

  // Helper function to safely get unread count
  const getUnreadCount = (conversation: AnyObj, userId: string | undefined): number => {
    if (!conversation.unreadCounts || !userId) return 0;

    // Handle both Map and plain object formats
    if (conversation.unreadCounts instanceof Map) {
      return conversation.unreadCounts.get(userId) || 0;
    } else {
      // Handle plain object format { "userId": count }
      return conversation.unreadCounts[userId] || 0;
    }
  };
  // Chat functions
  const handleStartChat = async (staffName: string) => {
    try {
      if (staffMembers.length === 0) {
        toast.error('No staff members available');
        return;
      }

      // CHECK FOR EXISTING ADOPTION REQUESTS FIRST
      let existingRequests = [];
      try {
        const requestsRes = await http.get("/adoptions/my-requests");
        existingRequests = Array.isArray(requestsRes.data) ? requestsRes.data :
          Array.isArray(requestsRes.data?.requests) ? requestsRes.data.requests : [];
      } catch (error) {
        console.log('Error fetching adoption requests:', error);
        existingRequests = [];
      }

      // ✅ IF NO ADOPTION REQUESTS, SHOW ERROR MESSAGE
      if (existingRequests.length === 0) {
        toast.error(
          <div>
            <p className="font-semibold">Cannot start chat</p>
            <p>You need to apply for adoption first to chat with staff.</p>
            <button
              onClick={() => setTab('requests')}
              className="mt-2 text-blue-600 hover:underline"
            >
              Go to Adoption Requests
            </button>
          </div>,
          { duration: 5000 }
        );
        return;
      }

      // USE EXISTING ADOPTION REQUEST TO CREATE/FIND CHAT
      const adoptionRequestId = existingRequests[0]._id;

      console.log('Creating chat for adoption request:', adoptionRequestId);

      // CREATE/FIND REAL CHAT USING THE ADOPTION REQUEST
      const chatRes = await http.get(`/chats/adoption/${adoptionRequestId}`);

      if (chatRes.data && chatRes.data.chat) {
        const realChat = chatRes.data.chat;

        setChatConversations(prev => [realChat, ...prev]);
        setSelectedConversation(realChat);
        setTab('chat');
        toast.success(`Started chat with staff`);

        // Join the chat room via socket
        if (socket && connected) {
          socket.emit('join-chat', realChat._id);
        }
      } else {
        toast.error('Failed to create chat connection');
      }

    } catch (error: any) {
      console.log('Chat creation failed:', error);

      // More specific error messages
      if (error?.response?.status === 404) {
        toast.error('Adoption request not found. Please apply for adoption first.');
      } else if (error?.response?.status === 403) {
        toast.error('Not authorized to start this chat.');
      } else {
        toast.error('Failed to start chat. Please try again.');
      }
    }
  };


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

    // debugging REMOVE THE DEMO CHAT SIMULATION - ALWAYS USE REAL SOCKET
    // For ALL chats, use the real socket flow

    socket.emit('send-message', {
      chatId: selectedConversation._id,
      content: newMessage.trim(),
      messageType: 'text'
    });

    const optimisticMessage: MessageData = {
      _id: `temp_${Date.now()}`,
      content: newMessage.trim(),
      sender: {
        _id: me?._id,
        name: me?.name || 'You',
        email: me?.email,
        role: me?.role
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
  // Load initial data
  useEffect(() => {
    let mounted = true;

    (async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        // 1) User data
        const meRes = await safeGet(() => http.get("/users/me"))
          .then(r => (r.ok ? r : safeGet(() => http.get("/auth/me"))));
        if (!meRes.ok || !meRes.data) {
          toast.error("Session error. Please sign in again.");
          setLoading(false);
          return;
        }
        const meData: AnyObj = meRes.data || {};
        if (mounted) setMe(meData);

        // 2) Favorites
        const favPets = await resolveFavorites(meData);
        if (mounted) setFavorites(favPets);

        // 3) Shelter/pet catalog
        const petsRes = await safeGet(() => http.get("/pets"));
        if (mounted) {
          const allPets: AnyObj[] = Array.isArray(petsRes.data) ? petsRes.data : [];
          const av = allPets.filter(p =>
            String(p?.status || "").toLowerCase().includes("available")
          );
          setAvailablePets(av);
        }

        // 4) My adoption requests
        const reqRes = await safeGet(() => http.get("/adoptions/my-requests"));
        if (mounted) {
          const reqs: AnyObj[] = Array.isArray(reqRes.data)
            ? reqRes.data
            : Array.isArray(reqRes.data?.requests)
              ? reqRes.data.requests
              : [];
          setRequests(reqs.filter(r => r && (r.pet || r.status)));
        }

        // 5) Activity
        if (meData?._id) {
          const actRes = await safeGet(() => http.get(`/users/activity-logs/${meData._id}`));
          if (mounted) {
            const logs: AnyObj[] = Array.isArray(actRes.data)
              ? actRes.data
              : Array.isArray(actRes.data?.logs)
                ? actRes.data.logs
                : [];
            setActivity(logs);
          }
        }

        // 6) My personal listings
        const myListRes = await safeGet(() => http.get("/pet-files/my-listings"));
        if (mounted) {
          const listPayload = myListRes.data;
          const list = Array.isArray(listPayload?.listings)
            ? listPayload.listings
            : Array.isArray(listPayload)
              ? listPayload
              : [];
          setMyListings(list);
        }

        try {
          const chatRes = await http.get("/chats");
          // console.log('📨 Chat conversations response:', chatRes.data);

          let chats = [];
          if (Array.isArray(chatRes.data?.chats)) {
            chats = chatRes.data.chats;
          } else if (Array.isArray(chatRes.data)) {
            chats = chatRes.data;
          } else if (chatRes.data?.success && Array.isArray(chatRes.data.data)) {
            chats = chatRes.data.data;
          } else {
            console.log('No conversations found in response structure');
            chats = [];
          }

          if (mounted) {
            setChatConversations(chats);


          }
        } catch (error) {
          console.log('Chat endpoint not available:', error);
          if (mounted) {
            setChatConversations([]);
            setStaffMembers([{
              _id: 'support-staff',
              name: 'Support Team',
              email: 'support@shelter.org',
              role: 'staff',
              avatar: null
            }]);
          }
        }

        try {
          let availableStaff = [];

          // Extract staff members from existing chat conversations
          if (chatConversations.length > 0) {
            const staffFromChats = chatConversations.flatMap((conversation: AnyObj) =>
              conversation.participants?.filter((p: any) =>
                p.role === 'staff' && p._id !== meData?._id
              ) || []
            );

            // Remove duplicates
            availableStaff = staffFromChats.filter((staff: any, index: number, self: any[]) =>
              index === self.findIndex(s => s._id === staff._id)
            );
          }

          //Debugging  If no staff found in chats, create demo staff for UI
          if (availableStaff.length === 0) {
            availableStaff = [{
              _id: 'support-staff',
              name: 'Support Team',
              email: 'support@shelter.org',
              role: 'staff',
              avatar: null
            }];
          }

          if (mounted) setStaffMembers(availableStaff);
        } catch (error) {
          console.log('Staff loading failed, using fallback');
          if (mounted) setStaffMembers([{
            _id: 'support-staff',
            name: 'Support Team',
            email: 'support@shelter.org',
            role: 'staff',
            avatar: null
          }]);
        }

      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [token]);

  // Socket event listeners for real-time chat
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (message: MessageData) => {
      console.log('📨 New message received:', message);
      if (message.chat === selectedConversation?._id) {
        setConversationMessages(prev => [...prev, message]);
      }

      // Update conversation list with latest message
      setChatConversations(prev =>
        prev.map(conv =>
          conv._id === message.chat
            ? { ...conv, lastMessage: message }
            : conv
        )
      );
    };

    const handleUserTyping = (data: { userId: string; userName: string; chatId: string }) => {
      if (data.chatId === selectedConversation?._id && data.userId !== me?._id) {
        setIsTyping(true);
      }
    };

    const handleUserStopTyping = (data: { userId: string; userName: string; chatId: string }) => {
      if (data.chatId === selectedConversation?._id && data.userId !== me?._id) {
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
  }, [socket, selectedConversation, me]);

  // Load messages when conversation is selected
  useEffect(() => {
    if (!selectedConversation) {
      setConversationMessages([]);
      return;
    }

    // Join the chat room via socket
    if (socket && connected) {
      socket.emit('join-chat', selectedConversation._id);
    }

    // ✅ REMOVE DEMO MESSAGES - ALWAYS LOAD FROM BACKEND
    (async () => {
      try {
        let messagesRes;

        // Try the main chats endpoint (correct format)
        try {
          messagesRes = await http.get(`/chats/${selectedConversation._id}/messages`);
        } catch (error) {
          // Try foster-chats as fallback
          try {
            messagesRes = await http.get(`/foster-chats/${selectedConversation._id}/messages`);
          } catch (fosterError) {
            console.log('Both message endpoints failed');
            setConversationMessages([]);
            return;
          }
        }

        console.log('📨 Actual messages response:', messagesRes.data);

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
        console.log('Messages loading failed:', error);
        setConversationMessages([]);
      }
    })();
  }, [selectedConversation, socket, connected]);

  const stats = useMemo(() => {
    const favCount = favorites.length;
    const reqCount = requests.length;
    const memberSince = me?.createdAt ? new Date(me.createdAt) : null;

    // Handle unreadCounts as both Map and plain object
    const unreadChats = chatConversations.filter(conv => {
      if (!conv.unreadCounts) return false;

      // Handle both Map and plain object formats
      if (conv.unreadCounts instanceof Map) {
        return conv.unreadCounts.get(me?._id) > 0;
      } else {
        // Handle plain object format { "userId": count }
        return conv.unreadCounts[me?._id] > 0;
      }
    }).length;

    return { favCount, reqCount, memberSince, unreadChats };
  }, [favorites, requests, me, chatConversations]);

  const displayStatus = useMemo(() => {
    if (me?.adoptionStatus) return me.adoptionStatus;
    const statuses = requests.map(r => String(r?.status || "").toLowerCase());
    if (statuses.includes("approved")) return "Approved — next steps";
    if (statuses.includes("meeting")) return "Meeting scheduled";
    if (statuses.length > 0) return "In progress";
    return "Active";
  }, [me, requests]);

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Please sign in…
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading…
      </div>
    );
  }

  const displayName = me?.name || authUser?.name || "Adopter";
  const displayEmail = me?.email || authUser?.email || "";

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <NavBar />

      <main className="max-w-7xl mx-auto w-full flex-grow p-6">
        {/* Header */}
        <header className="mb-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-extrabold" style={{ color: "var(--pc-primary)" }}>
                {displayName}
              </h1>
              {displayEmail && <p className="text-gray-600">{displayEmail}</p>}
              <div className="mt-3 flex items-center gap-2">
                {(me?.role || authUser?.role) && (
                  <span className="px-3 py-1 rounded-full text-sm bg-blue-50 text-blue-700">
                    {me?.role || authUser?.role}
                  </span>
                )}
                <span className="px-3 py-1 rounded-full text-sm bg-green-50 text-green-700">
                  {displayStatus}
                </span>
              </div>
            </div>

            <div className="flex gap-3">
              <Link to="/browse" className="pc-btn pc-btn-outline">
                Browse Pets
              </Link>
              <Link to="/profile-setup" className="pc-btn pc-btn-primary">
                Edit Profile
              </Link>
            </div>
          </div>
        </header>

        {/* Profile completion nudge */}
        {!me?.lifestyle && (
          <div className="bg-yellow-50 border border-yellow-300 text-yellow-900 rounded-xl p-4 mb-6 flex justify-between items-center">
            <span>Complete your profile to get personalized pet recommendations</span>
            <Link to="/profile-setup" className="pc-btn pc-btn-primary text-sm">
              Complete Profile
            </Link>
          </div>
        )}

        {/* Stats */}
        <section className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
          <StatCard title="Favorited Pets" value={stats.favCount} accent="text-indigo-600" />
          <StatCard title="Adoption Requests" value={stats.reqCount} accent="text-green-600" />
          <StatCard
            title="Member Since"
            value={stats.memberSince ? stats.memberSince.toLocaleDateString() : "—"}
          />
          <StatCard
            title="Active Chats"
            value={chatConversations.length}
            accent="text-purple-600"
          />
        </section>

        {/* Tabs */}
        <div className="border-b flex gap-6 text-lg mb-6 flex-wrap">
          {(["overview", "favorites", "requests", "activity", "chat"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`pb-2 capitalize ${tab === t
                ? "border-b-2 border-[var(--pc-primary)] text-[var(--pc-primary)] font-semibold"
                : "text-gray-500 hover:text-gray-700"
                }`}
            >
              {t} {t === 'chat' && stats.unreadChats > 0 && (
                <span className="ml-1 bg-red-500 text-white text-xs rounded-full px-2 py-1">
                  {stats.unreadChats}
                </span>
              )}
            </button>
          ))}

          {/* Only adopters can see "My Listings" */}
          {me?.role === "adopter" && (
            <button
              onClick={() => setTab("myListings")}
              className={`pb-2 capitalize ${tab === "myListings"
                ? "border-b-2 border-[var(--pc-primary)] text-[var(--pc-primary)] font-semibold"
                : "text-gray-500 hover:text-gray-700"
                }`}
            >
              My Listings
            </button>
          )}
        </div>

        {/* ✅ CHAT SECTION */}
        {tab === "chat" && (
          <div className="pc-card p-5">
            {!selectedConversation ? (
              // Conversations List
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold">Your Conversations</h2>
                  <div className="relative">
                    <button
                      onClick={() => {
                        if (staffMembers.length > 0) {
                          handleStartChat(staffMembers[0].name);
                        } else {
                          toast.error('No staff members available');
                        }
                      }}
                      className="pc-btn pc-btn-primary text-sm"
                    >
                      + Message Staff
                    </button>
                  </div>
                </div>

                {chatConversations.length > 0 ? (
                  <div className="space-y-3">
                    {chatConversations.map((conversation) => {
                      const otherParticipant = conversation.participants?.find(
                        (p: any) => p._id !== me?._id
                      );

                      return (
                        <div
                          key={conversation._id}
                          className="p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                          onClick={() => setSelectedConversation(conversation)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                                <span className="text-indigo-700 font-bold">
                                  {otherParticipant?.name?.[0] || "U"}
                                </span>
                              </div>
                              <div>
                                <p className="font-semibold">
                                  {otherParticipant?.name || "Unknown User"}
                                </p>
                                <p className="text-sm text-gray-600">
                                  {conversation.lastMessage?.content || "No messages yet"}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              {conversation.lastMessage && (
                                <p className="text-xs text-gray-500">
                                  {new Date(conversation.lastMessage.createdAt).toLocaleDateString()}
                                </p>
                              )}
                              {(() => {
                                const unreadCount = getUnreadCount(conversation, me?._id);
                                return unreadCount > 0 ? (
                                  <span className="inline-block mt-1 px-2 py-1 bg-red-500 text-white text-xs rounded-full">
                                    {unreadCount}
                                  </span>
                                ) : null;
                              })()}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    <p className="mb-4">No chat conversations yet.</p>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
                      <p className="font-semibold text-blue-800 mb-2">How to start chatting with staff:</p>
                      <ol className="text-sm text-blue-700 text-left list-decimal list-inside space-y-1">
                        <li>Apply for pet adoption first</li>
                        <li>Staff will review your application</li>
                        <li>Chat will be available once you have an active adoption request</li>
                      </ol>
                      <button
                        onClick={() => setTab('requests')}
                        className="mt-3 pc-btn pc-btn-primary text-sm"
                      >
                        Check Adoption Requests
                      </button>
                    </div>
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
                    ← Back
                  </button>
                  {selectedConversation.participants?.map((participant: any) => (
                    participant._id !== me?._id && (
                      <div key={participant._id} className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                          <span className="text-indigo-700 font-bold text-sm">
                            {participant.name?.[0] || "U"}
                          </span>
                        </div>
                        <h2 className="text-xl font-semibold">
                          {participant.name || "Unknown User"}
                        </h2>
                        {participant.role && (
                          <span className="text-sm text-gray-500 ml-2">
                            ({participant.role})
                          </span>
                        )}
                      </div>
                    )
                  ))}
                  {isTyping && (
                    <span className="text-sm text-gray-500 ml-2">
                      (typing...)
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
                        className={`flex ${message.sender?.name === me?.name ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${message.sender?.name === me?.name
                            ? 'bg-indigo-500 text-white rounded-br-none'
                            : 'bg-white border rounded-bl-none'
                            }`}
                        >
                          <p className="text-sm">{message.content}</p>
                          <p
                            className={`text-xs mt-1 ${message.sender?.name === me?.name ? 'text-indigo-200' : 'text-gray-500'
                              }`}
                          >
                            {new Date(message.createdAt).toLocaleTimeString()}
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

        {/* Rest of your existing tabs... */}
        {tab === "myListings" && me?.role === "adopter" && (
          <section className="pc-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">My Listings</h2>
              <Link to="/create-listing" className="pc-btn pc-btn-primary text-sm">
                + Add Listing
              </Link>
            </div>
            {Array.isArray(myListings) && myListings.length > 0 ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {myListings.map((pet) => (
                  <MyListingCard key={pet._id} pet={pet} />
                ))}
              </div>
            ) : (
              <div className="text-gray-500 text-center mt-4">
                You have no pet listings yet.
              </div>
            )}
          </section>
        )}

        {/* Other existing tabs (overview, favorites, requests, activity) remain the same */}
        {tab === "overview" && (
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="pc-card p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold">Available Pets</h2>
                  <Link to="/browse" className="text-sm text-[var(--pc-primary)] hover:underline">
                    See all
                  </Link>
                </div>
                {availablePets.length ? (
                  <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
                    {availablePets.slice(0, 6).map((p) => (
                      <PetCard key={p?._id || p?.id} pet={p} />
                    ))}
                  </div>
                ) : (
                  <Empty text="No pets available right now." />
                )}
              </div>

              <div className="pc-card p-5">
                <h2 className="text-xl font-semibold mb-4">My Adoption Requests</h2>
                {requests.length ? (
                  <div className="grid sm:grid-cols-2 gap-5">
                    {requests.map((r) => (
                      <RequestCard key={r?._id || r?.id} req={r} onStartChat={handleStartChat} />
                    ))}
                  </div>
                ) : (
                  <Empty text="You have no adoption requests yet." />
                )}
              </div>
            </div>

            <aside className="space-y-6">
              <div className="pc-card p-5">
                <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
                {activity.length ? (
                  <ul className="space-y-3">
                    {activity.slice(0, 8).map((a, i) => (
                      <ActivityRow key={a?._id || i} item={a} />
                    ))}
                  </ul>
                ) : (
                  <Empty text="No recent activity to show." />
                )}
              </div>
            </aside>
          </section>
        )}

        {tab === "favorites" && (
          <section className="pc-card p-5">
            <h2 className="text-xl font-semibold mb-4">Your Favorites</h2>
            {favorites.length ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {favorites.map((pet) => (
                  <PetCard key={pet?._id || pet?.id} pet={pet} />
                ))}
              </div>
            ) : (
              <Empty text="No favorites yet." />
            )}
          </section>
        )}

        {tab === "requests" && (
          <section className="pc-card p-5">
            <h2 className="text-xl font-semibold mb-4">Adoption Requests</h2>
            {requests.length ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {requests.map((r) => (
                  <RequestCard key={r?._id || r?.id} req={r} onStartChat={handleStartChat} />
                ))}
              </div>
            ) : (
              <Empty text="You have no adoption requests yet." />
            )}
          </section>
        )}

        {tab === "activity" && (
          <section className="pc-card p-5">
            <h2 className="text-xl font-semibold mb-4">Activity</h2>
            {activity.length ? (
              <ul className="space-y-3">
                {activity.map((a, i) => (
                  <ActivityRow key={a?._id || i} item={a} />
                ))}
              </ul>
            ) : (
              <Empty text="No recent activity to show." />
            )}
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
}

// Update RequestCard to include chat option
function RequestCard({ req, onStartChat }: { req: AnyObj; onStartChat?: (name: string) => void }) {
  const pet = (req && req.pet) || {};
  const img = Array.isArray(pet?.images) && pet.images[0] ? pet.images[0] : "/fallback.jpg";
  const name = pet?.name || "Pet";
  const pid = pet?._id || pet?.id || "";
  const status = String(req?.status || "pending").toLowerCase();

  const badge =
    status === "approved"
      ? "bg-green-100 text-green-800"
      : status === "meeting"
        ? "bg-blue-100 text-blue-800"
        : status === "finalized"
          ? "bg-emerald-100 text-emerald-800"
          : status === "pending"
            ? "bg-yellow-100 text-yellow-800"
            : "bg-gray-100 text-gray-800";

  return (
    <div className="pc-card overflow-hidden">
      <div className="flex gap-4 p-4">
        <img src={img} className="w-20 h-20 rounded-lg object-cover" alt={name} />
        <div className="flex-1">
          <p className="font-semibold">{name}</p>
          <p className="text-sm text-gray-600 capitalize">
            Status: <span className={`px-2 py-0.5 rounded-full text-xs ${badge}`}>{status}</span>
          </p>
          <div className="mt-2 flex gap-2">
            <Link to={`/pet/${pid}`} className="text-[var(--pc-primary)] hover:underline text-sm">
              View pet
            </Link>
            {onStartChat && (
              <button
                onClick={() => onStartChat('Adoption Team')}
                className="text-[var(--pc-primary)] hover:underline text-sm"
              >
                Message Staff
              </button>
            )}
          </div>
        </div>
      </div>

      {status === "finalized" && (
        <div className="px-4 pb-4">
          <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-green-50 text-green-700">
            🎉 Adoption Finalized!
          </span>
        </div>
      )}
    </div>
  );
}

// Rest of your existing components remain exactly the same...
function MyListingCard({ pet }: { pet: AnyObj }) {
  const img = Array.isArray(pet?.images) ? (pet.images[0]?.url || pet.images[0]) : "/fallback.jpg";
  const status = String(pet?.status || "available_fostering");

  const onDelete = async () => {
    if (!confirm("Delete this listing?")) return;
    try {
      await http.delete(`/pet-files/user-pet/${pet._id}`);
      toast.success("Listing deleted!");
      window.location.reload();
    } catch (e: any) {
      toast.error(e?.response?.data?.msg || "Failed to delete listing.");
    }
  };

  return (
    <div className="pc-card p-4 flex flex-col gap-2">
      <img src={img} className="w-full h-40 object-cover rounded-lg" alt={pet?.name || "Pet"} />
      <h3 className="font-bold text-lg">{pet?.name || "Pet"}</h3>
      {pet?.breed && <p className="text-sm text-gray-500">{pet.breed}</p>}
      <p className="text-sm text-gray-600 capitalize">Status: {status}</p>

      <div className="flex gap-2 mt-auto">
        <Link to={`/pet/${pet._id}`} className="pc-btn pc-btn-outline w-1/3 text-center">
          View
        </Link>
        <Link
          to={`/create-listing?edit=${pet._id}`}
          className="pc-btn pc-btn-primary w-1/3 text-center"
        >
          Edit
        </Link>
        <button onClick={onDelete} className="pc-btn pc-btn-danger w-1/3">
          Delete
        </button>
      </div>
    </div>
  );
}

function StatCard({ title, value, accent }: { title: string; value: number | string; accent?: string }) {
  return (
    <div className="pc-card p-5">
      <p className="text-gray-600">{title}</p>
      <p className={`text-3xl font-bold mt-2 ${accent ?? ""}`}>{value}</p>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="text-gray-500">{text}</p>;
}

function ActivityRow({ item }: { item: AnyObj }) {
  const when = item?.createdAt ? new Date(item.createdAt).toLocaleDateString() : "";
  const action = String(item?.action || "");
  const label =
    action === "avatar_upload"
      ? "Uploaded Avatar"
      : action === "profile_update"
        ? "Updated Profile"
        : action === "request_created"
          ? "Created Adoption Request"
          : action || "Activity";

  return (
    <li className="flex items-start justify-between rounded-lg bg-gray-50 p-3">
      <div>
        <p className="font-medium">{label}</p>
        {item?.details && <p className="text-sm text-gray-600">{item.details}</p>}
      </div>
      <div className="text-sm text-gray-500 ml-3 whitespace-nowrap">{when}</div>
    </li>
  );
}

async function safeGet<T = any>(fn: () => Promise<{ data: T }>) {
  try {
    const res = await fn();
    return { ok: true as const, data: res.data as T };
  } catch (_e: any) {
    return { ok: false as const, data: undefined as unknown as T };
  }
}

async function resolveFavorites(me: AnyObj | null): Promise<AnyObj[]> {
  if (!me?.favoritedPets || me.favoritedPets.length === 0) return [];
  const first = me.favoritedPets[0];
  if (first && typeof first === "object") {
    return (me.favoritedPets as AnyObj[]).filter(Boolean);
  }
  const ids: string[] = me.favoritedPets as string[];
  const results = await Promise.all(
    ids.map(async (id) => {
      try {
        const r = await http.get(`/pets/${id}`);
        return r.data;
      } catch {
        return null;
      }
    })
  );
  return results.filter(Boolean) as AnyObj[];
}