import { create } from 'zustand';
import { api } from '../services/api';
import { Chat, receiverProfile } from '../interface/interface';
import { Message } from '../interface/interface';
import { Socket } from 'socket.io-client';

interface ChatStore {
  socket: Socket | null;
  messages: Message[];
  users: receiverProfile[];
  selectedUser: receiverProfile | null;
  isUsersLoading: boolean;
  isMessagesLoading: boolean;
  ChatId: string | null;
  Chats: Map<string, Chat>;
  currentUserId: string | null;
  isOnChatPage: boolean;

  clearSelectedUser: () => void;
  setCurrentUserId: (userId: string) => void;
  getUsers: () => void;
  getMessages: (userId: string, currentUserId: string) => void;
  sendMessage: (messageData: { currentUserId?: string; text?: string; image?: string; video?: string }) => void;
  setSelectedUser: (user: receiverProfile | null, currentUserId: string | null, shouldResetUnread?: boolean) => void;
  setIsOnChatPage: (isOnChatPage: boolean) => void;
  subscribeToMessages: () => void;
  unsubscribeFromMessages: () => void;
  setSocketConnect: (userId: string, socket: Socket) => void;
  loadChatMessages: (chatId: string) => void;
  getUnreadCount: (userId: string, currentUserId: string) => number;
  resetUnreadCount: (chatId: string) => void;
  loadPersistedUnreadCounts: () => void;
  persistUnreadCount: (chatId: string, count: number) => void;
  getSortedUsers: (currentUserId: string) => receiverProfile[];
  updateChatActivity: (chatId: string, timestamp: string) => void;
  getTotalUnreadUsersCount: () => number;
}

// Helper functions for persistence
const UNREAD_COUNTS_KEY = 'chat_unread_counts';

const saveUnreadCountsToStorage = (unreadCounts: Record<string, number>) => {
  try {
    localStorage.setItem(UNREAD_COUNTS_KEY, JSON.stringify(unreadCounts));
  } catch (error) {
    console.error('Error saving unread counts to localStorage:', error);
  }
};

const loadUnreadCountsFromStorage = (): Record<string, number> => {
  try {
    const stored = localStorage.getItem(UNREAD_COUNTS_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch (error) {
    console.error('Error loading unread counts from localStorage:', error);
    return {};
  }
};

const updateStoredUnreadCount = (chatId: string, count: number) => {
  const stored = loadUnreadCountsFromStorage();
  if (count === 0) {
    delete stored[chatId];
  } else {
    stored[chatId] = count;
  }
  saveUnreadCountsToStorage(stored);
};

export const useChatStore = create<ChatStore>((set, get) => ({
  socket: null,
  messages: [],
  users: [],
  selectedUser: null,
  isUsersLoading: false,
  isMessagesLoading: false,
  ChatId: null,
  Chats: new Map<string, Chat>(),
  currentUserId: null,
  isOnChatPage: false,

  setCurrentUserId: (userId) => {
    set({ currentUserId: userId });
    // Load persisted unread counts when current user is set
    get().loadPersistedUnreadCounts();
    // Also trigger users refresh to ensure proper sorting with unread counts
    setTimeout(() => get().getUsers(), 100);
  },

  loadPersistedUnreadCounts: () => {
    const storedCounts = loadUnreadCountsFromStorage();
    const { Chats } = get();
    
    // Update existing chats with stored unread counts
    const newChats = new Map(Chats);
    Object.entries(storedCounts).forEach(([chatId, count]) => {
      const existingChat = newChats.get(chatId);
      if (existingChat) {
        newChats.set(chatId, { ...existingChat, unreadCount: count });
      } else {
        // Create minimal chat entry for unread count tracking
        newChats.set(chatId, {
          id: chatId,
          participants: [],
          messages: [],
          unreadCount: count,
          lastActivity: new Date().toISOString()
        });
      }
    });

    set({ Chats: newChats });
  },

  persistUnreadCount: (chatId: string, count: number) => {
    updateStoredUnreadCount(chatId, count);
  },

  updateChatActivity: (chatId: string, timestamp: string) => {
    set((state) => {
      const newChats = new Map(state.Chats);
      const existingChat = newChats.get(chatId);
      
      if (existingChat) {
        newChats.set(chatId, {
          ...existingChat,
          lastActivity: timestamp
        });
      } else {
        // Create new chat if it doesn't exist
        newChats.set(chatId, {
          id: chatId,
          participants: [],
          messages: [],
          unreadCount: 0,
          lastActivity: timestamp
        });
      }
      
      return { Chats: newChats };
    });
  },

  getSortedUsers: (currentUserId: string) => {
    const { users, Chats } = get();
    
    return [...users].sort((a, b) => {
      // Generate chat IDs for both users
      const chatIdA = [currentUserId, a.user.id.toString()].sort().join('-');
      const chatIdB = [currentUserId, b.user.id.toString()].sort().join('-');
      
      // Get chat data
      const chatA = Chats.get(chatIdA);
      const chatB = Chats.get(chatIdB);
      
      // Get last activity timestamps
      const activityA = chatA?.lastActivity ? new Date(chatA.lastActivity).getTime() : 0;
      const activityB = chatB?.lastActivity ? new Date(chatB.lastActivity).getTime() : 0;
      
      // Sort by most recent activity first
      return activityB - activityA;
    });
  },

  getTotalUnreadUsersCount: () => {
    const { Chats } = get();
    let count = 0;
    
    // Count chats that have unread messages
    Chats.forEach((chat) => {
      if (chat.unreadCount && chat.unreadCount > 0) {
        count++;
      }
    });
    
    // Also check stored counts for any that might not be in current Chats
    const storedCounts = loadUnreadCountsFromStorage();
    Object.entries(storedCounts).forEach(([chatId, unreadCount]) => {
      if (unreadCount > 0 && !Chats.has(chatId)) {
        count++;
      }
    });
    
    return count;
  },

  getUsers: () => {
    set({ isUsersLoading: true });

    api.get('/api/messages/users')
      .then(response => {
        const transformed = response.data.map((user: any) => ({
          user: {
            id: user.id,
            email: user.email,
            username: user.username,
            profile_image: user.profile_image,
          },
          status: ['online', 'offline', 'away'][Math.floor(Math.random() * 3)],
          isVip: Math.random() > 0.5,
          isLive: Math.random() > 0.5,
        }));

        set({ users: transformed, isUsersLoading: false });
        console.log("Users loaded:", transformed.length);
      })
      .catch(error => {
        console.error('Failed to fetch users:', error);
        set({ isUsersLoading: false });
      });
  },

  getMessages: (userId: string, currentUserId: string) => {
    set({ isMessagesLoading: true });

    // First check if we have messages in the chat store
    const chatId = [currentUserId, userId].sort().join('-');
    const { Chats } = get();
    const privateChat = Chats.get(chatId);

    // If no cached messages, fetch from API
    api.get(`/api/messages/${userId}`)
      .then(response => {
        const messages = response.data || [];
        set({ messages, isMessagesLoading: false });

        // Update the chat store with fetched messages but don't update lastActivity
        // unless there are actual messages with timestamps
        if (privateChat) {
          const updatedChat = { ...privateChat, messages };
          
          // Only update lastActivity if there are messages and the last message is newer
          if (messages.length > 0) {
            const lastMessage = messages[messages.length - 1];
            const existingLastActivity = privateChat.lastActivity ? new Date(privateChat.lastActivity).getTime() : 0;
            const messageTime = new Date(lastMessage.created_at).getTime();
            
            // Only update if this message is actually newer than existing activity
            if (messageTime > existingLastActivity) {
              updatedChat.lastActivity = lastMessage.created_at;
            }
          }
          
          set((state) => {
            const newChats = new Map(state.Chats);
            newChats.set(chatId, updatedChat);
            return { Chats: newChats };
          });
        }

        console.log("Loaded messages from API:", messages.length);
      })
      .catch(error => {
        console.error('Failed to fetch messages:', error);
        set({ isMessagesLoading: false });
      });
  },

  sendMessage: (messageData) => {
    const { selectedUser, socket, ChatId, currentUserId } = get();
    if (!selectedUser || !currentUserId) return;

    const timestamp = new Date().toISOString();
    
    const messagePayload = {
      text: messageData.text || null,
      image_url: messageData.image || null,
      video_url: messageData.video || null,
      chatId: ChatId,
      currentUserId: currentUserId,
      receiverId: selectedUser.user.id,
      timestamp: timestamp
    };

    // Update chat activity immediately when sending message
    if (ChatId) {
      get().updateChatActivity(ChatId, timestamp);
    }

    // Send via socket for real-time delivery
    socket?.emit('send_private_message', messagePayload);

    console.log("Message sent via socket:", messagePayload);
  },

  setSelectedUser: (user, currentUserId, shouldResetUnread = true) => {
    if (!user || !currentUserId) return;

    const { socket } = get();
    set({ selectedUser: user });

    const chatId = [currentUserId, user.user.id.toString()].sort().join('-');
    set({ ChatId: chatId });

    // Only reset unread count when explicitly requested (when user actively selects)
    if (shouldResetUnread) {
      get().resetUnreadCount(chatId);
    }

    // Create private chat if it doesn't exist
    socket?.emit('create_private_chat', {
      targetUserId: user.user.id,
      currentUserId: currentUserId
    });

    // Load messages for this chat
    get().getMessages(user.user.id.toString(), currentUserId);
  },

  clearSelectedUser: () => {
    set({ selectedUser: null, ChatId: null });
  },

  setIsOnChatPage: (isOnChatPage: boolean) => {
    set({ isOnChatPage });
  },

  loadChatMessages: (chatId: string) => {
    const { Chats } = get();
    const chat = Chats.get(chatId);
    if (chat) {
      set({ messages: chat.messages });
    }
  },

  getUnreadCount: (userId: string, currentUserId: string) => {
    const { Chats } = get();
    const chatId = [currentUserId, userId].sort().join('-');
    const chat = Chats.get(chatId);
    const count = chat?.unreadCount || 0;
    
    // Also check stored counts as fallback
    if (count === 0) {
      const storedCounts = loadUnreadCountsFromStorage();
      return storedCounts[chatId] || 0;
    }
    
    return count;
  },

  resetUnreadCount: (chatId: string) => {
    set((state) => {
      const newChats = new Map(state.Chats);
      const existingChat = newChats.get(chatId);
      
      if (existingChat) {
        const updatedChat = {
          ...existingChat,
          unreadCount: 0
        };
        newChats.set(chatId, updatedChat);
      }
      
      return { Chats: newChats };
    });

    // Persist the reset count
    get().persistUnreadCount(chatId, 0);
  },

  subscribeToMessages: () => {
    console.log('Subscribed to messages');
  },

  unsubscribeFromMessages: () => {
    console.log('Unsubscribed from messages');
  },

  setSocketConnect: (userId, socket) => {
    socket.emit('join', userId);
    set({ socket, currentUserId: userId });

    // Load persisted unread counts when socket connects
    get().loadPersistedUnreadCounts();

    socket.on('private_chat_created', (chatData: Chat) => {
      console.log('Private chat created:', chatData.id);
      set((state) => {
        const newChats = new Map(state.Chats);
        
        // Preserve existing unread count if it exists
        const existingChat = newChats.get(chatData.id);
        const unreadCount = existingChat?.unreadCount || 0;
        const existingLastActivity = existingChat?.lastActivity;
        
        // NEVER update lastActivity when just creating a chat connection
        // Always preserve existing lastActivity or use minimal default to prevent sorting changes
        newChats.set(chatData.id, {
          id: chatData.id,
          participants: chatData.participants || [],
          messages: chatData.messages || [],
          unreadCount,
          lastActivity: existingLastActivity || '1970-01-01T00:00:00.000Z'
        });
        return { Chats: newChats };
      });
    });

    socket.on('private_message', (data: { message: Message; chatId: string }) => {
      console.log('Received private message:', data.message.text);

      set((state) => {
        const newChats = new Map(state.Chats);
        const existingChat = newChats.get(data.chatId);

        if (existingChat) {
          // Check if message already exists to avoid duplicates
          const messageExists = existingChat.messages.some(msg => msg.id === data.message.id);

          if (!messageExists) {
            // Only increment unread count if this is not the currently selected AND viewed chat
            // The chat must be both selected (ChatId matches) and the user must be on the chat page
            // AND the user must be actively viewing that specific chat
            const isCurrentlyViewingChat = state.ChatId === data.chatId && 
                                         state.isOnChatPage && 
                                         state.selectedUser !== null;
            
            const newUnreadCount = isCurrentlyViewingChat ? 0 : existingChat.unreadCount + 1;
            
            const updatedChat = {
              ...existingChat,
              messages: [...existingChat.messages, data.message],
              unreadCount: newUnreadCount,
              lastActivity: data.message.created_at,
            };
            newChats.set(data.chatId, updatedChat);

            // Persist the updated unread count
            get().persistUnreadCount(data.chatId, newUnreadCount);
          }
        } else {
          // Create new chat if it doesn't exist
          // For new chats, always increment unread count since user hasn't selected it yet
          const newUnreadCount = 1;
          
          const newChat: Chat = {
            id: data.chatId,
            participants: [], // Will be populated when chat is created
            messages: [data.message],
            unreadCount: newUnreadCount,
            lastActivity: data.message.created_at,
          };
          newChats.set(data.chatId, newChat);

          // Persist the unread count for new chat
          get().persistUnreadCount(data.chatId, newUnreadCount);
        }

        // Update current messages if this is the active chat
        const updatedMessages = state.ChatId === data.chatId
          ? [...state.messages.filter(msg => msg.id !== data.message.id), data.message]
          : state.messages;

        console.log("Updated Message:", updatedMessages);
        return {
          Chats: newChats,
          messages: updatedMessages
        };
      });

      get().getUsers();
    });

    socket.on('message_error', (error) => {
      console.error('Socket message error:', error);
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected');
      set({ socket: null });
    });
  }
}));