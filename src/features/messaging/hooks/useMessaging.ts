import { useState, useEffect, useCallback, useRef } from 'react';
import messagingService from '../services/messagingService';
import {
  Message,
  Conversation,
  MessageType,
  MessagePriority,
  SearchFilters,
  ConversationFilters,
  MessageSendOptions,
  UseMessagingReturn,
  MessagingState,
  Poll,
  UserStatus
} from '../types';

export const useMessaging = (): UseMessagingReturn => {
  const [state, setState] = useState<MessagingState>(messagingService.getState());
  const [isConnected, setIsConnected] = useState<boolean>(messagingService.getConnectionStatus());
  const initialized = useRef(false);

  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      initializeMessaging();
    }

    const unsubscribe = messagingService.subscribe((newState) => {
      setState(newState);
      setIsConnected(messagingService.getConnectionStatus());
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const initializeMessaging = async () => {
    try {
      await messagingService.initialize();
    } catch (error) {
      
    }
  };

  const sendMessage = useCallback(async (content: string, options: MessageSendOptions = {}) => {
    if (!state.currentConversationId) {
      throw new Error('No active conversation');
    }
    await messagingService.sendMessage(state.currentConversationId, content, options);
  }, [state.currentConversationId]);

  const createConversation = useCallback(async (data: Partial<Conversation>) => {
    return await messagingService.createConversation(data);
  }, []);

  const markAsRead = useCallback(async (messageId: string) => {
    await messagingService.markAsRead(messageId);
  }, []);

  const deleteMessage = useCallback(async (messageId: string) => {
    await messagingService.deleteMessage(messageId);
  }, []);

  const searchMessages = useCallback(async (query: string, filters: SearchFilters = {}) => {
    return await messagingService.searchMessages(query, filters);
  }, []);

  const loadMoreMessages = useCallback(async () => {
    if (state.currentConversationId) {
      await messagingService.loadMoreMessages(state.currentConversationId);
    }
  }, [state.currentConversationId]);

  const startTyping = useCallback(() => {
    if (state.currentConversationId) {
      messagingService.startTyping(state.currentConversationId);
    }
  }, [state.currentConversationId]);

  const stopTyping = useCallback(() => {
    if (state.currentConversationId) {
      messagingService.stopTyping(state.currentConversationId);
    }
  }, [state.currentConversationId]);

  return {
    messages: state.currentConversationId ? state.messages[state.currentConversationId] || [] : [],
    conversations: state.conversations,
    currentConversation: messagingService.getCurrentConversation(),
    unreadCount: Object.values(state.unreadCounts).reduce((sum, count) => sum + count, 0),
    isLoading: state.isLoading,
    error: state.error,
    sendMessage,
    createConversation,
    markAsRead,
    deleteMessage,
    searchMessages,
    loadMoreMessages,
    startTyping,
    stopTyping,
    isConnected
  };
};

export const useConversations = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadConversations = useCallback(async (filters: ConversationFilters = {}) => {
    try {
      setIsLoading(true);
      setError(null);
      await messagingService.loadConversations(filters);
      setConversations(messagingService.getConversations());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load conversations');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  return {
    conversations,
    isLoading,
    error,
    loadConversations,
    refresh: () => loadConversations()
  };
};

export const useMessages = (conversationId: string | null) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const loadMessages = useCallback(async () => {
    if (!conversationId) return;

    try {
      setIsLoading(true);
      setError(null);
      await messagingService.loadMessages(conversationId);
      setMessages(messagingService.getMessages(conversationId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load messages');
    } finally {
      setIsLoading(false);
    }
  }, [conversationId]);

  const loadMore = useCallback(async () => {
    if (!conversationId || isLoading || !hasMore) return;

    try {
      setIsLoading(true);
      await messagingService.loadMoreMessages(conversationId);
      const newMessages = messagingService.getMessages(conversationId);
      setMessages(newMessages);
      
      // Check if we have more messages to load
      if (newMessages.length < 20) {
        setHasMore(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load more messages');
    } finally {
      setIsLoading(false);
    }
  }, [conversationId, isLoading, hasMore]);

  useEffect(() => {
    if (conversationId) {
      loadMessages();
      setHasMore(true);
    }
  }, [conversationId, loadMessages]);

  return {
    messages,
    isLoading,
    error,
    hasMore,
    loadMore,
    refresh: loadMessages
  };
};

export const useTyping = (conversationId: string | null) => {
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!conversationId) return;

    const checkTypingUsers = () => {
      const users = messagingService.getTypingUsers(conversationId);
      setTypingUsers(users);
    };

    // Check immediately
    checkTypingUsers();

    // Set up interval to check for typing users
    const interval = setInterval(checkTypingUsers, 1000);

    return () => clearInterval(interval);
  }, [conversationId]);

  return typingUsers;
};

export const useUserStatus = (userId: string) => {
  const [status, setStatus] = useState<UserStatus>('offline');

  useEffect(() => {
    const checkStatus = () => {
      const userStatus = messagingService.getUserStatus(userId);
      setStatus(userStatus);
    };

    checkStatus();
    const interval = setInterval(checkStatus, 5000);

    return () => clearInterval(interval);
  }, [userId]);

  return status;
};

export const useSearch = () => {
  const [searchResults, setSearchResults] = useState<Message[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async (query: string, filters: SearchFilters = {}) => {
    try {
      setIsSearching(true);
      setError(null);
      const results = await messagingService.searchMessages(query, filters);
      setSearchResults(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setIsSearching(false);
    }
  }, []);

  const clearSearch = useCallback(() => {
    setSearchResults([]);
    setError(null);
  }, []);

  return {
    searchResults,
    isSearching,
    error,
    search,
    clearSearch
  };
};

export const usePolls = (conversationId: string | null) => {
  const [polls, setPolls] = useState<Poll[]>([]);

  const createPoll = useCallback((pollData: {
    question: string;
    options: string[];
    allowMultiple?: boolean;
    duration?: number;
    isAnonymous?: boolean;
  }) => {
    if (!conversationId) return;

    messagingService.createPoll(conversationId, pollData);
  }, [conversationId]);

  const votePoll = useCallback((pollId: string, optionIds: string[]) => {
    messagingService.votePoll(pollId, optionIds);
  }, []);

  return {
    polls,
    createPoll,
    votePoll
  };
};

export const useFileUpload = (conversationId: string | null) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const uploadFile = useCallback(async (file: File) => {
    if (!conversationId) return;

    try {
      setUploading(true);
      setUploadProgress(0);

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 100);

      // Upload file via WebSocket
      messagingService.uploadFile(file, conversationId);

      setUploadProgress(100);
    } catch (error) {
      
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  }, [conversationId]);

  return {
    uploading,
    uploadProgress,
    uploadFile
  };
};

export const useAI = (conversationId: string | null) => {
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const requestAI = useCallback((type: string, context: string) => {
    if (!conversationId) return;

    setIsLoading(true);
    setAiResponse(null);

    messagingService.requestAI(type, context, conversationId);
  }, [conversationId]);

  useEffect(() => {
    const handleAIResponse = (data: any) => {
      setAiResponse(data.response);
      setIsLoading(false);
    };

    messagingService.on('ai:response', handleAIResponse);

    return () => {
      messagingService.off('ai:response', handleAIResponse);
    };
  }, []);

  return {
    aiResponse,
    isLoading,
    requestAI
  };
};

export const useCalls = (conversationId: string | null) => {
  const [currentCall, setCurrentCall] = useState<any>(null);
  const [incomingCall, setIncomingCall] = useState<any>(null);

  const startCall = useCallback((callType: string = 'AUDIO') => {
    if (!conversationId) return;

    messagingService.startCall(conversationId, callType);
  }, [conversationId]);

  const answerCall = useCallback((callId: string) => {
    messagingService.emit('call:answer', { callId });
    setIncomingCall(null);
  }, []);

  const declineCall = useCallback((callId: string) => {
    messagingService.emit('call:decline', { callId });
    setIncomingCall(null);
  }, []);

  const endCall = useCallback(() => {
    if (currentCall) {
      messagingService.emit('call:end', { callId: currentCall.callId });
      setCurrentCall(null);
    }
  }, [currentCall]);

  useEffect(() => {
    const handleCallStarted = (data: any) => {
      setCurrentCall(data);
    };

    const handleIncomingCall = (data: any) => {
      setIncomingCall(data);
    };

    const handleCallEnded = () => {
      setCurrentCall(null);
      setIncomingCall(null);
    };

    messagingService.on('call:started', handleCallStarted);
    messagingService.on('call:incoming', handleIncomingCall);
    messagingService.on('call:ended', handleCallEnded);

    return () => {
      messagingService.off('call:started', handleCallStarted);
      messagingService.off('call:incoming', handleIncomingCall);
      messagingService.off('call:ended', handleCallEnded);
    };
  }, []);

  return {
    currentCall,
    incomingCall,
    startCall,
    answerCall,
    declineCall,
    endCall
  };
};

export default useMessaging; 
