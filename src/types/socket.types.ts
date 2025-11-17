// src/types/socket.types.ts
export interface WelcomeData {
  message: string;
  userId: string;
  timestamp: string;
}

export interface PongData {
  message: string;
  timestamp: string;
  userId: string;
}

export interface MessageData {
  _id: string;
  content: string;
  sender: {
    name: string;
    email?: string;
    avatar?: string;
    role?: string;
  };
  createdAt: string;
  chat: string;
  messageType?: string;
  attachments?: any[];
  metadata?: any;
}

export interface MessageSentData {
  messageId: string;
  timestamp: string;
}

export interface MessageErrorData {
  message: string;
  error?: string;
  timestamp: string;
}

export interface UserPresenceData {
  userId: string;
  userName: string;
  chatId: string;
  isActive: boolean;
  timestamp: string;
}

export interface SocketEvents {
  // Client to Server events
  'join-chat': (chatId: string) => void;
  'leave-chat': (chatId: string) => void;
  'send-message': (data: {
    chatId: string;
    content: string;
    messageType?: string;
  }) => void;
  'validate-chat-access': (data: { chatId: string }, callback: (response: any) => void) => void;
  'typing-start': (data: { chatId: string }) => void;
  'typing-stop': (data: { chatId: string }) => void;
  'mark-messages-read': (data: { chatId: string }) => void;
  'ping': (data: any) => void;

  // Server to Client events
  'connect': () => void;
  'disconnect': () => void;
  'connect_error': (error: Error) => void;
  'welcome': (data: WelcomeData) => void;
  'pong': (data: PongData) => void;
  'new-message': (message: MessageData) => void;
  'message-sent': (data: MessageSentData) => void;
  'message-error': (error: MessageErrorData) => void;
  'user-presence': (data: UserPresenceData) => void;
  'user-typing': (data: { userId: string; userName: string; chatId: string; timestamp: string }) => void;
  'user-stop-typing': (data: { userId: string; userName: string; chatId: string; timestamp: string }) => void;
  'messages-read': (data: { userId: string; chatId: string; timestamp: string }) => void;
  'user-joined-chat': (data: { userId: string; chatId: string; timestamp: string }) => void;
  'new-chat-notification': (data: { chatId: string; message: string; sender: string; petName: string; timestamp: string }) => void;
}