/**
 * Socket Service - OPTIMIZED WITH UTILITIES
 * Enhanced real-time communication using utility functions
 */
import { io } from 'socket.io-client';
import { 
  SOCKET_URL, 
  STORAGE_KEYS, 
  SOCKET_EVENTS, 
  ROUTES, 
  TIME,
  ERROR_CONFIG 
} from '../utils/constants';
import { formatError, getErrorSeverity } from '../utils/formatters';
import { typingHelpers } from '../utils/chatHelpers';
import toast from 'react-hot-toast';

// ENHANCED: Config using constants
const SOCKET_CONFIG = {
  transports: ['websocket', 'polling'],
  timeout: TIME.CONSTANTS.MINUTE / 6, // 10 seconds
  forceNew: true,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: TIME.CONSTANTS.SECOND,
  reconnectionDelayMax: 5 * TIME.CONSTANTS.SECOND,
};

const RECONNECT_CONFIG = {
  maxAttempts: 5,
  baseDelay: TIME.CONSTANTS.SECOND,
  maxDelay: 10 * TIME.CONSTANTS.SECOND,
};

// ORGANIZED: Event categories for better management
const EVENT_CATEGORIES = {
  CONNECTION: [SOCKET_EVENTS.CONNECT, SOCKET_EVENTS.DISCONNECT, SOCKET_EVENTS.CONNECT_ERROR],
  MESSAGES: [
    SOCKET_EVENTS.NEW_MESSAGE, SOCKET_EVENTS.MESSAGE_SENT, 
    SOCKET_EVENTS.MESSAGE_EDITED, SOCKET_EVENTS.MESSAGE_DELETED, 
    SOCKET_EVENTS.MESSAGE_READ
  ],
  REACTIONS: [SOCKET_EVENTS.REACTION_UPDATED],
  TYPING: [SOCKET_EVENTS.USER_TYPING, SOCKET_EVENTS.USER_STOP_TYPING],
  PRESENCE: [
    SOCKET_EVENTS.USER_ONLINE, SOCKET_EVENTS.USER_OFFLINE,
    SOCKET_EVENTS.CURRENT_ONLINE_USERS, SOCKET_EVENTS.USER_STATUS_UPDATED
  ],
  GROUPS: [
    SOCKET_EVENTS.USER_JOINED_GROUP, SOCKET_EVENTS.USER_LEFT_GROUP,
    'group_deleted', 'group_info_updated', 'participant_role_changed',
    'participant_removed', 'participants_added'
  ]
};

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.eventHandlers = new Map();
    this.messageQueue = [];
    this._initialized = false;
    this._storeListenersSetup = false;
    this.reconnectTimer = null;
    this._lastTyping = {};
  }

  // ENHANCED: Connection with better cleanup
  connect(token) {
    if (this.socket?.connected) return this.socket;

    this._cleanup();
    
    this.socket = io(SOCKET_URL, {
      ...SOCKET_CONFIG,
      auth: { token }
    });

    this._setupEventListeners();
    return this.socket;
  }

  disconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    this._cleanup();
    this.isConnected = false;
    this._initialized = false;
    this._storeListenersSetup = false;
  }

  _cleanup() {
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }
    this.eventHandlers.clear();
    this.messageQueue = [];
  }

  // ENHANCED: Setup with organized event handling
  _setupEventListeners() {
    if (!this.socket || this._initialized) return;
    
    this._initialized = true;
    this._setupConnectionEvents();
    
    Object.entries(EVENT_CATEGORIES).forEach(([category, events]) => {
      this._setupCategoryEvents(category.toLowerCase(), events);
    });
    
    this.socket.on(SOCKET_EVENTS.ERROR, this._onError.bind(this));
  }

  _setupConnectionEvents() {
    this.socket.on(SOCKET_EVENTS.CONNECT, this._onConnect.bind(this));
    this.socket.on(SOCKET_EVENTS.DISCONNECT, this._onDisconnect.bind(this));
    this.socket.on(SOCKET_EVENTS.CONNECT_ERROR, this._onError.bind(this));
  }

  _setupCategoryEvents(category, events) {
    events.forEach(event => {
      this.socket.on(event, (data) => {
        this.emit(event, data);
        
        // Smart notification handling
        if (category === 'messages' && 
            event === SOCKET_EVENTS.NEW_MESSAGE && 
            !document.hasFocus()) {
          this._showNotification(data.message);
        }
      });
    });
  }

  // ENHANCED: Connection handlers with utility-based error formatting
  _onConnect() {
    this.isConnected = true;
    this.reconnectAttempts = 0;
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    this._processMessageQueue();
    this.emit('socket_connected');
    
    if (this.reconnectAttempts > 0) {
      toast.success('Reconnected to chat server');
    }
  }

  _onDisconnect(reason) {
    this.isConnected = false;
    this._initialized = false;
    this.emit('socket_disconnected', reason);
    
    if (reason !== 'io client disconnect') {
      toast.error('Connection lost. Reconnecting...');
      this._scheduleReconnect();
    }
  }

  _onError(error) {
    this.isConnected = false;
    const message = formatError(error);
    const severity = getErrorSeverity(error);
    
    if (message.includes('Authentication') || message.includes('Token')) {
      this._handleAuthError();
    } else if (this.reconnectAttempts < RECONNECT_CONFIG.maxAttempts) {
      this._scheduleReconnect();
    } else {
      toast.error('Unable to connect to chat server');
    }
    
    this.emit('socket_error', { message, error, severity });
  }

  _handleAuthError() {
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER);
    toast.error('Session expired. Please login again.');
    
    setTimeout(() => {
      if (!window.location.pathname.includes(ROUTES.LOGIN)) {
        window.location.href = ROUTES.LOGIN;
      }
    }, 2000);
  }

  _scheduleReconnect() {
    if (this.reconnectTimer) return;
    
    this.reconnectAttempts++;
    const delay = Math.min(
      RECONNECT_CONFIG.baseDelay * Math.pow(2, this.reconnectAttempts - 1),
      RECONNECT_CONFIG.maxDelay
    );
    
    this.reconnectTimer = setTimeout(() => {
      const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
      if (token) {
        this.connect(token);
      }
      this.reconnectTimer = null;
    }, delay);
  }

  // ENHANCED: Event system with better error handling
  on(event, handler) {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event).add(handler);
  }

  off(event, handler) {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      if (handler) {
        handlers.delete(handler);
      } else {
        handlers.clear();
      }
    }
  }

  emit(event, data) {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error(`Error in event handler for ${event}:`, formatError(error));
        }
      });
    }
  }

  // ENHANCED: Message queue with time-based cleanup
  _emitWithQueue(event, data) {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
    } else {
      this.messageQueue.push({ event, data, timestamp: Date.now() });
      
      // Clean old queued messages using TIME constants
      const cutoff = Date.now() - (5 * TIME.CONSTANTS.MINUTE);
      this.messageQueue = this.messageQueue.filter(msg => msg.timestamp > cutoff);
    }
  }

  _processMessageQueue() {
    while (this.messageQueue.length > 0 && this.socket?.connected) {
      const { event, data } = this.messageQueue.shift();
      this.socket.emit(event, data);
    }
  }

  // ENHANCED: Socket actions with better validation
  joinConversation(id) {
    if (id && !id.startsWith('temp_')) {
      this._emitWithQueue(SOCKET_EVENTS.JOIN_CONVERSATION, id);
    }
  }

  leaveConversation(id) {
    if (id && this.socket?.connected) {
      this.socket.emit(SOCKET_EVENTS.LEAVE_CONVERSATION, id);
    }
  }

  sendMessage(data) {
    if (data.content?.trim()) {
      this._emitWithQueue(SOCKET_EVENTS.SEND_MESSAGE, data);
    }
  }

  editMessage(messageId, newContent) {
    if (messageId && newContent?.trim()) {
      this._emitWithQueue('edit_message', { messageId, newContent });
    }
  }

  deleteMessage(messageId) {
    if (messageId) {
      this._emitWithQueue('delete_message', { messageId });
    }
  }

  markMessagesRead(messageIds, conversationId) {
    if (messageIds?.length && conversationId) {
      this._emitWithQueue('mark_message_read', { messageIds, conversationId });
    }
  }

  addReaction(messageId, emoji) {
    if (messageId && emoji) {
      this._emitWithQueue(SOCKET_EVENTS.ADD_REACTION, { 
        messageId, 
        emoji, 
        timestamp: new Date().toISOString() 
      });
    }
  }

  removeReaction(messageId, emoji) {
    if (messageId && emoji) {
      this._emitWithQueue(SOCKET_EVENTS.REMOVE_REACTION, { 
        messageId, 
        emoji, 
        timestamp: new Date().toISOString() 
      });
    }
  }

  // ENHANCED: Typing actions with utility-based throttling
  startTyping(conversationId) {
    if (!conversationId || conversationId.startsWith('temp_')) return;
    
    const now = Date.now();
    const key = `typing_${conversationId}`;
    
    // Use TIME constants for throttling
    if (this._lastTyping[key] && 
        (now - this._lastTyping[key]) < TIME.TYPING_THROTTLE) {
      return;
    }
    
    this._lastTyping[key] = now;
    this._emitWithQueue(SOCKET_EVENTS.TYPING_START, { conversationId });
  }

  stopTyping(conversationId) {
    if (conversationId && !conversationId.startsWith('temp_')) {
      this._emitWithQueue(SOCKET_EVENTS.TYPING_STOP, { conversationId });
    }
  }

  updateStatus(status) {
    if (status) {
      this._emitWithQueue('update_user_status', { status });
    }
  }

  // ENHANCED: Notification with better error handling
  _showNotification(message) {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    
    try {
      const notification = new Notification(message.sender?.name || 'Someone', {
        body: message.content,
        icon: message.sender?.avatar || '/favicon.ico',
        tag: message._id,
        silent: false,
      });

      setTimeout(() => notification.close(), 5 * TIME.CONSTANTS.SECOND);
      
      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    } catch (error) {
      console.warn('Notification failed:', formatError(error));
    }
  }

  // ENHANCED: Utility methods
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      socketId: this.socket?.id || null,
      reconnectAttempts: this.reconnectAttempts,
      hasQueuedMessages: this.messageQueue.length > 0,
      queuedMessageCount: this.messageQueue.length,
      eventHandlerCount: this.eventHandlers.size,
    };
  }

  getEventHandlerCount(event) {
    return this.eventHandlers.get(event)?.size || 0;
  }

  clearEventHandlers(event) {
    if (event) {
      this.eventHandlers.delete(event);
    } else {
      this.eventHandlers.clear();
    }
  }
}

export default new SocketService();
