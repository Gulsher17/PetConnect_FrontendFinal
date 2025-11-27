// src/components/SocketTest.tsx
import { useState, useEffect } from 'react';
import { useSocket } from '../hooks/useSocket';
import type { 
  MessageData, 
  MessageSentData, 
  MessageErrorData, 
  UserPresenceData,
  PongData 
} from '../types/socket.types';

export const SocketTest = () => {
  const { socket, connected } = useSocket();
  const [messages, setMessages] = useState<MessageData[]>([]);
  const [testChatId, setTestChatId] = useState('your-chat-id-here');
  const [messageInput, setMessageInput] = useState('');

  useEffect(() => {
    if (!socket) return;

    // Type-safe event listeners with explicit parameter types
    const handleNewMessage = (message: MessageData) => {
      console.log('📨 New message received:', message);
      setMessages(prev => [...prev, message]);
    };

    const handleMessageSent = (data: MessageSentData) => {
      console.log('✅ Message sent confirmation:', data);
    };

    const handleMessageError = (error: MessageErrorData) => {
      console.error('❌ Message error:', error);
    };

    const handleUserPresence = (data: UserPresenceData) => {
      console.log('👤 User presence:', data);
    };

    const handlePong = (data: PongData) => {
      console.log('🏓 Pong received:', data);
    };

    // Register event listeners
    socket.on('new-message', handleNewMessage);
    socket.on('message-sent', handleMessageSent);
    socket.on('message-error', handleMessageError);
    socket.on('user-presence', handleUserPresence);
    socket.on('pong', handlePong);

    // Cleanup function
    return () => {
      socket.off('new-message', handleNewMessage);
      socket.off('message-sent', handleMessageSent);
      socket.off('message-error', handleMessageError);
      socket.off('user-presence', handleUserPresence);
      socket.off('pong', handlePong);
    };
  }, [socket]);

  const joinChat = () => {
    if (socket && testChatId) {
      socket.emit('join-chat', testChatId);
      console.log(`🚀 Joining chat: ${testChatId}`);
      
      // Validate chat access with callback
      socket.emit('validate-chat-access', { chatId: testChatId }, (response: any) => {
        console.log('🔍 Chat access validation:', response);
      });
    }
  };

  const sendTestMessage = () => {
    if (socket && testChatId && messageInput.trim()) {
      socket.emit('send-message', {
        chatId: testChatId,
        content: messageInput,
        messageType: 'text'
      });
      setMessageInput('');
    }
  };

  const testTyping = () => {
    if (socket && testChatId) {
      // Start typing
      socket.emit('typing-start', { chatId: testChatId });
      
      // Stop typing after 2 seconds
      setTimeout(() => {
        socket.emit('typing-stop', { chatId: testChatId });
      }, 2000);
    }
  };

  const markAsRead = () => {
    if (socket && testChatId) {
      socket.emit('mark-messages-read', { chatId: testChatId });
    }
  };

  const sendPing = () => {
    if (socket) {
      socket.emit('ping', { test: 'ping data' });
    }
  };

  if (!connected) {
    return (
      <div className="p-4 border rounded-lg bg-yellow-100">
        <h2 className="text-lg font-bold mb-2">🔌 WebSocket Connection</h2>
        <p>Connecting to server...</p>
        <p className="mt-2 font-semibold">Make sure:</p>
        <ul className="list-disc ml-4 mt-1">
          <li>Backend is running on port 3001</li>
          <li>You have a valid JWT token in localStorage</li>
          <li>CORS is configured properly</li>
        </ul>
      </div>
    );
  }

  return (
    <div className="p-4 border rounded-lg bg-green-100 max-w-2xl mx-auto">
      <h2 className="text-lg font-bold mb-4">✅ WebSocket Connected - Chat Test</h2>
      
      <div className="space-y-4">
        {/* Chat ID Input */}
        <div>
          <label className="block text-sm font-medium mb-1">Chat ID to test:</label>
          <input
            type="text"
            value={testChatId}
            onChange={(e) => setTestChatId(e.target.value)}
            className="border p-2 rounded w-full"
            placeholder="Enter actual chat ID from your database"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 flex-wrap">
          <button 
            onClick={joinChat}
            className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 text-sm"
          >
            Join Chat
          </button>
          <button 
            onClick={testTyping}
            className="bg-purple-500 text-white px-3 py-1 rounded hover:bg-purple-600 text-sm"
          >
            Test Typing
          </button>
          <button 
            onClick={markAsRead}
            className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 text-sm"
          >
            Mark as Read
          </button>
          <button 
            onClick={sendPing}
            className="bg-orange-500 text-white px-3 py-1 rounded hover:bg-orange-600 text-sm"
          >
            Ping Test
          </button>
        </div>

        {/* Message Input */}
        <div className="flex gap-2">
          <input
            type="text"
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            placeholder="Type a test message..."
            className="border p-2 rounded flex-1"
            onKeyPress={(e) => e.key === 'Enter' && sendTestMessage()}
          />
          <button 
            onClick={sendTestMessage}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          >
            Send
          </button>
        </div>

        {/* Messages Display */}
        <div className="border rounded p-2 bg-white max-h-60 overflow-y-auto">
          <h3 className="font-bold mb-2">Messages ({messages.length}):</h3>
          {messages.length === 0 ? (
            <p className="text-gray-500 text-sm">No messages yet. Send one!</p>
          ) : (
            messages.map((msg, index) => (
              <div key={index} className="border-b py-2 last:border-b-0">
                <p className="font-semibold text-blue-600">{msg.sender?.name}:</p>
                <p className="ml-2">{msg.content}</p>
                <small className="text-gray-500 text-xs ml-2">
                  {new Date(msg.createdAt).toLocaleTimeString()}
                </small>
              </div>
            ))
          )}
        </div>

        {/* Connection Status */}
        <div className="text-sm bg-white p-2 rounded border">
          <p><strong>Status:</strong> <span className="text-green-600">✅ Connected</span></p>
          <p><strong>Socket ID:</strong> {socket?.id}</p>
          <p><strong>Events listening:</strong> new-message, message-sent, message-error, user-presence, pong</p>
        </div>
      </div>
    </div>
  );
};