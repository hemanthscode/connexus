import { io } from 'socket.io-client';
import { STORAGE_KEYS } from '../utils/constants';
import toast from 'react-hot-toast';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
    this.eventHandlers = new Map();
    this.messageQueue = [];
    this._storeListenersSetup = false;
    this._socketListenersSetup = false;
  }

  connect(token) {
    if (this.socket?.connected) {
      console.log('🔌 Socket already connected, reusing connection');
      return this.socket;
    }

    if (this.socket) {
      console.log('🔌 Cleaning up existing socket...');
      this.socket.removeAllListeners();
      this.socket.disconnect();
    }

    console.log('🔌 Creating new socket connection...');

    this.socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      timeout: 10000,
      forceNew: true,
      autoConnect: true,
    });

    this._socketListenersSetup = false;
    this.setupEventListeners();
    return this.socket;
  }

  setupEventListeners() {
    if (!this.socket || this._socketListenersSetup) {
      return;
    }

    console.log('🔌 Setting up socket event listeners...');
    this._socketListenersSetup = true;

    // CONNECTION EVENTS
    this.socket.on('connect', () => {
      console.log('🔌 Socket connected:', this.socket?.id);
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.processMessageQueue();
      this.emit('socket_connected');
      toast.success('Connected to chat server');
    });

    this.socket.on('disconnect', (reason) => {
      console.log('🔌 Socket disconnected:', reason);
      this.isConnected = false;
      this._socketListenersSetup = false;
      this.emit('socket_disconnected', reason);
      
      if (reason !== 'io client disconnect') {
        toast.error('Connection lost. Attempting to reconnect...');
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('🔌 Socket connection error:', error);
      this.isConnected = false;
      this.emit('socket_error', error);
      
      if (error.message && error.message.includes('Authentication error')) {
        toast.error('Session expired. Please login again.');
        setTimeout(() => {
          localStorage.removeItem(STORAGE_KEYS.TOKEN);
          localStorage.removeItem(STORAGE_KEYS.USER);
          window.location.href = '/login';
        }, 2000);
      } else {
        this.handleReconnection();
      }
    });

    // USER PRESENCE EVENTS
    this.socket.on('user_online', (data) => {
      console.log('👤 User came online:', data);
      this.emit('user_online', data);
    });

    this.socket.on('user_offline', (data) => {
      console.log('👤 User went offline:', data);
      this.emit('user_offline', data);
    });

    this.socket.on('current_online_users', (users) => {
      console.log('👥 Online users updated:', users?.length || 0);
      this.emit('current_online_users', users);
    });

    this.socket.on('user_status_updated', (data) => {
      console.log('🎯 User status updated:', data);
      this.emit('user_status_updated', data);
    });

    // MESSAGING EVENTS
    this.socket.on('new_message', (data) => {
      console.log('💬 New message received:', data?.message?._id);
      this.emit('new_message', data);
      
      if (data.message && !document.hasFocus()) {
        this.showMessageNotification(data.message);
      }
    });

    // FIXED: Handle message sent confirmation
    this.socket.on('message_sent', (data) => {
      console.log('✅ Message sent confirmation:', data?.message?._id);
      this.emit('message_sent', data);
    });

    this.socket.on('message_edited', (data) => {
      console.log('✏️ Message edited:', data?.messageId);
      this.emit('message_edited', data);
    });

    this.socket.on('message_deleted', (data) => {
      console.log('🗑️ Message deleted:', data?.messageId);
      this.emit('message_deleted', data);
    });

    this.socket.on('message_read', (data) => {
      console.log('👀 Message read:', data?.conversationId);
      this.emit('message_read', data);
    });

    // TYPING EVENTS
    this.socket.on('user_typing', (data) => {
      this.emit('user_typing', data);
    });

    this.socket.on('user_stop_typing', (data) => {
      this.emit('user_stop_typing', data);
    });

    // REACTION EVENTS
    this.socket.on('reaction_updated', (data) => {
      console.log('😀 Reaction updated:', data?.messageId);
      this.emit('reaction_updated', data);
    });

    // GROUP EVENTS
    this.socket.on('user_joined_group', (data) => {
      console.log('👥 User joined group:', data);
      this.emit('user_joined_group', data);
    });

    this.socket.on('user_left_group', (data) => {
      console.log('👥 User left group:', data);
      this.emit('user_left_group', data);
    });

    // CONVERSATION EVENTS
    this.socket.on('conversation_info', (data) => {
      console.log('📋 Conversation info:', data);
      this.emit('conversation_info', data);
    });

    this.socket.on('joined_conversation', (data) => {
      console.log('🏠 Joined conversation:', data);
      this.emit('joined_conversation', data);
    });

    this.socket.on('left_conversation', (data) => {
      console.log('🏠 Left conversation:', data);
      this.emit('left_conversation', data);
    });

    // ERROR HANDLING
    this.socket.on('error', (error) => {
      let errorMessage = 'Unknown error';
      let errorDetails = {};

      if (typeof error === 'string') {
        errorMessage = error;
      } else if (error && typeof error === 'object') {
        errorMessage = error.message || error.error || error.description || 'Socket error occurred';
        errorDetails = {
          type: error.type,
          code: error.code,
          data: error.data,
          stack: error.stack
        };
      }

      console.error('⚠️ Socket error:', {
        message: errorMessage,
        details: errorDetails,
        timestamp: new Date().toISOString()
      });
      
      if (errorMessage.includes('Not authorized') || errorMessage.includes('Unauthorized')) {
        console.log('🚫 Authorization error - but continuing...');
      } else if (errorMessage.includes('Authentication error')) {
        toast.error('Session expired. Please login again.');
        setTimeout(() => {
          localStorage.removeItem(STORAGE_KEYS.TOKEN);
          localStorage.removeItem(STORAGE_KEYS.USER);
          window.location.href = '/login';
        }, 2000);
      } else if (errorMessage.includes('conversation archived')) {
        toast.error('This conversation is archived');
      } else {
        console.warn('Socket error (not critical):', errorMessage);
      }
      
      this.emit('socket_error', { message: errorMessage, details: errorDetails });
    });

    this.socket.on('pong', () => {
      console.log('🏓 Pong received');
    });

    console.log('🔌 Socket event listeners setup complete');
  }

  handleReconnection() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      toast.error('Unable to connect to chat server');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    
    setTimeout(() => {
      console.log(`🔄 Reconnecting... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
      if (token) {
        this.connect(token);
      }
    }, delay);
  }

  processMessageQueue() {
    while (this.messageQueue.length > 0) {
      const { event, data } = this.messageQueue.shift();
      if (this.socket?.connected) {
        this.socket.emit(event, data);
      }
    }
  }

  showMessageNotification(message) {
    if (!('Notification' in window)) return;
    
    if (Notification.permission === 'granted') {
      new Notification(`${message.sender?.name || 'Someone'}`, {
        body: message.content,
        icon: message.sender?.avatar || '/favicon.ico',
        tag: message._id,
      });
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission();
    }
  }

  // Event system
  on(event, handler) {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event).push(handler);
  }

  off(event, handler) {
    if (!this.eventHandlers.has(event)) return;
    const handlers = this.eventHandlers.get(event);
    const index = handlers.indexOf(handler);
    if (index > -1) {
      handlers.splice(index, 1);
    }
  }

  emit(event, data) {
    if (this.eventHandlers.has(event)) {
      this.eventHandlers.get(event).forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error(`Error in event handler for ${event}:`, error);
        }
      });
    }
  }

  // SOCKET ACTIONS
  joinConversation(conversationId) {
    if (!conversationId) return;

    if (this.socket?.connected) {
      console.log('🏠 Joining conversation:', conversationId);
      this.socket.emit('join_conversation', conversationId);
    } else {
      this.messageQueue.push({ event: 'join_conversation', data: conversationId });
    }
  }

  leaveConversation(conversationId) {
    if (!conversationId) return;

    if (this.socket?.connected) {
      console.log('🏠 Leaving conversation:', conversationId);
      this.socket.emit('leave_conversation', conversationId);
    }
  }

  sendMessage(messageData) {
    if (this.socket?.connected) {
      this.socket.emit('send_message', messageData);
    } else {
      this.messageQueue.push({ event: 'send_message', data: messageData });
      toast.error('Message queued - reconnecting...');
    }
  }

  editMessage(messageId, newContent) {
    if (this.socket?.connected) {
      this.socket.emit('edit_message', { messageId, newContent });
    }
  }

  deleteMessage(messageId) {
    if (this.socket?.connected) {
      this.socket.emit('delete_message', { messageId });
    }
  }

  markMessagesRead(messageIds, conversationId) {
    if (this.socket?.connected && messageIds?.length > 0) {
      this.socket.emit('mark_message_read', { messageIds, conversationId });
    }
  }

  startTyping(conversationId) {
    if (this.socket?.connected && conversationId) {
      this.socket.emit('typing_start', { conversationId });
    }
  }

  stopTyping(conversationId) {
    if (this.socket?.connected && conversationId) {
      this.socket.emit('typing_stop', { conversationId });
    }
  }

  addReaction(messageId, emoji) {
    if (this.socket?.connected) {
      this.socket.emit('add_reaction', { messageId, emoji });
    }
  }

  removeReaction(messageId, emoji) {
    if (this.socket?.connected) {
      this.socket.emit('remove_reaction', { messageId, emoji });
    }
  }

  joinGroup(groupId) {
    if (this.socket?.connected) {
      this.socket.emit('join_group', { groupId });
    }
  }

  leaveGroup(groupId) {
    if (this.socket?.connected) {
      this.socket.emit('leave_group', { groupId });
    }
  }

  updateStatus(status) {
    if (this.socket?.connected) {
      this.socket.emit('update_user_status', { status });
    }
  }

  requestConversationInfo(conversationId) {
    if (this.socket?.connected && conversationId) {
      console.log('📋 Requesting conversation info:', conversationId);
      this.socket.emit('request_conversation_info', { conversationId });
    }
  }

  ping() {
    if (this.socket?.connected) {
      this.socket.emit('ping');
    }
  }

  disconnect() {
    if (this.socket) {
      console.log('🔌 Disconnecting socket...');
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.eventHandlers.clear();
      this.messageQueue = [];
      this._storeListenersSetup = false;
      this._socketListenersSetup = false;
    }
  }

  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      socketId: this.socket?.id || null,
      reconnectAttempts: this.reconnectAttempts,
    };
  }
}

const socketService = new SocketService();
export default socketService;
