// src/components/chat/ChatInterface.tsx
import { useRef, useEffect } from "react";


interface ChatInterfaceProps {
    // Chat state
    chatConversations: any[];
    selectedConversation: any;
    conversationMessages: any[];
    isTyping: boolean;
    newMessage: string;
    staffMembers: any[];
    connected: boolean;

    // Chat functions
    setSelectedConversation: (conv: any) => void;
    setNewMessage: (msg: string) => void;
    handleStartChat: (name: string) => void;
    handleSendMessage: () => void;
    handleTypingStart: () => void;
    handleTypingStop: () => void;
    getUnreadCount: (conv: any) => number;

    // User info
    userRole: "adopter" | "staff";
    currentUser: any;
    onTabChange?: (tab: string) => void; // ✅ FIX: Accept string instead of specific types
}

export default function ChatInterface({
    chatConversations,
    selectedConversation,
    conversationMessages,
    isTyping,
    newMessage,
    staffMembers,
    connected,
    setSelectedConversation,
    setNewMessage,
    handleStartChat,
    handleSendMessage,
    handleTypingStart,
    handleTypingStop,
    getUnreadCount,
    userRole,
    currentUser,
    onTabChange
}: ChatInterfaceProps) {

    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [conversationMessages]);

    if (!selectedConversation) {
        return (
            <div className="pc-card p-5">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold">
                        {userRole === "staff" ? "Chat Conversations" : "Your Conversations"}
                    </h2>
                    <div className="flex items-center gap-4">
                        <div className="text-sm text-gray-500">
                            {connected ? "🟢 Connected" : "🔴 Disconnected"}
                        </div>
                        {userRole === "adopter" && (
                            <button
                                onClick={() => {
                                    if (staffMembers.length > 0) {
                                        handleStartChat(staffMembers[0].name);
                                    }
                                }}
                                className="pc-btn pc-btn-primary text-sm"
                            >
                                + Message Staff
                            </button>
                        )}
                    </div>
                </div>

                {chatConversations.length > 0 ? (
                    <div className="space-y-3">
                        {chatConversations.map((conversation) => {
                            const otherParticipant = conversation.participants?.find(
                                (p: any) => {
                                    const participantId = p._id || p.user?._id;
                                    return participantId !== currentUser?._id;
                                }
                            );

                            const participant = otherParticipant?.user || otherParticipant;
                            const participantName = participant?.name || "Unknown User";
                            const participantRole = participant?.role;

                            return (
                                <div
                                    key={conversation._id}
                                    className="p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                                    onClick={() => setSelectedConversation(conversation)}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${userRole === "staff" ? "bg-green-100" : "bg-indigo-100"
                                                }`}>
                                                <span className={`font-bold ${userRole === "staff" ? "text-green-700" : "text-indigo-700"
                                                    }`}>
                                                    {participantName[0] || "U"}
                                                </span>
                                            </div>
                                            <div>
                                                <p className="font-semibold">{participantName}</p>
                                                <p className="text-sm text-gray-600">
                                                    {conversation.lastMessage|| "No messages yet"}
                                                </p>
                                                {userRole === "staff" && (
                                                    <p className="text-xs text-gray-500">
                                                        {conversation.adoptionRequest?.pet
                                                            ? `Pet: ${conversation.adoptionRequest.pet.name}`
                                                            : conversation.adoptionRequest?.status
                                                                ? `Status: ${conversation.adoptionRequest.status}`
                                                                : 'General Inquiry'
                                                        }
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            {conversation.lastMessage && (
                                                <p className="text-xs text-gray-500">

                                                    {conversation.updatedAt && !isNaN(new Date(conversation.updatedAt).getTime())
                                                        ? new Date(conversation.updatedAt).toLocaleString()
                                                        : 'Recent'
                                                    }
                                                </p>
                                            )}
                                            {(() => {
                                                const unreadCount = getUnreadCount(conversation);
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
                        {userRole === "adopter" ? (
                            <div>
                                <p className="mb-4">No chat conversations yet.</p>
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
                                    <p className="font-semibold text-blue-800 mb-2">How to start chatting with staff:</p>
                                    <ol className="text-sm text-blue-700 text-left list-decimal list-inside space-y-1">
                                        <li>Apply for pet adoption first</li>
                                        <li>Staff will review your application</li>
                                        <li>Chat will be available once you have an active adoption request</li>
                                    </ol>
                                    <button
                                        onClick={() => onTabChange?.('requests')}
                                        className="mt-3 pc-btn pc-btn-primary text-sm"
                                    >
                                        Check Adoption Requests
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <p>No chat conversations yet.</p>
                        )}
                    </div>
                )}
            </div>
        );
    }

    // Active Chat View
    return (
        <div className="pc-card p-5">
            <div className="flex items-center gap-3 mb-4">
                <button
                    onClick={() => setSelectedConversation(null)}
                    className="pc-btn pc-btn-outline text-sm"
                >
                    ← Back {userRole === "staff" ? "to Chats" : ""}
                </button>
                {selectedConversation.participants?.map((participant: any) => {
                    const participantId = participant._id || participant.user?._id;
                    if (participantId !== currentUser?._id) {
                        const participantUser = participant.user || participant;
                        const participantName = participantUser?.name || "Unknown User";
                        const participantRole = participantUser?.role;

                        return (
                            <div key={participantId} className="flex items-center gap-2">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${userRole === "staff" ? "bg-green-100" : "bg-indigo-100"
                                    }`}>
                                    <span className={`font-bold text-sm ${userRole === "staff" ? "text-green-700" : "text-indigo-700"
                                        }`}>
                                        {participantName[0] || "U"}
                                    </span>
                                </div>
                                <h2 className="text-xl font-semibold">{participantName}</h2>
                                {participantRole && (
                                    <span className="text-sm text-gray-500 ml-2">({participantRole})</span>
                                )}
                                {userRole === "staff" && selectedConversation.adoptionRequest?.pet && (
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
                        ({userRole === "staff" ? "adopter" : "staff"} is typing...)
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
                            className={`flex ${message.sender?._id === currentUser?._id ? 'justify-end' : 'justify-start'}`}
                        >
                            <div
                                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${message.sender?._id === currentUser?._id
                                    ? 'bg-indigo-500 text-white rounded-br-none'
                                    : 'bg-white border rounded-bl-none'
                                    }`}
                            >
                                <p className={`text-sm ${message.sender?._id === currentUser?._id ? 'text-white' : 'text-gray-800'}`}>
                                    {message.content}
                                </p>
                                <p
                                    className={`text-xs mt-1 ${message.sender?._id === currentUser?._id ? 'text-indigo-200' : 'text-gray-500'
                                        }`}
                                >
                                    {message.sender?.name} • {new Date(message.createdAt).toLocaleTimeString()}
                                </p>
                            </div>
                        </div>
                    ))
                )}
                <div ref={messagesEndRef} />
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
    );
}