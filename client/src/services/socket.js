/**
 * Socket Service
 * Handles real-time communication
 */

import { io } from 'socket.io-client';
import { SOCKET_URL, STORAGE_KEYS, SOCKET_EVENTS, ROUTES } from '../utils/constants';
import { formatError } from '../utils/formatters';
import toast from 'react-hot-toast';

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.eventHandlers = new Map();
    this.messageQueue = [];
    this._initialized = false;
  }

  // ============== Connection Management ==============
  
  connect(token) {
    if (this.socket?.connected) return this.socket;

    this._cleanup();
    
    this.socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      timeout: 10000,
      forceNew: true,
    });

    this._setupEventListeners();
    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this._cleanup();
      this.isConnected = false;
      this._initialized = false;
    }
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

  // ============== Event Listeners Setup ==============
  
  _setupEventListeners() {
    if (!this.socket || this._initialized) return;
    
    this._initialized = true;
    
    // Connection events
    this.socket.on(SOCKET_EVENTS.CONNECT, this._onConnect.bind(this));
    this.socket.on(SOCKET_EVENTS.DISCONNECT, this._onDisconnect.bind(this));
    this.socket.on(SOCKET_EVENTS.CONNECT_ERROR, this._onError.bind(this));
    
    // Message events
    this._setupMessageEvents();
    
    // Presence events
    this._setupPresenceEvents();
    
    // Other events
    this.socket.on(SOCKET_EVENTS.ERROR, this._onError.bind(this));
  }

  _setupMessageEvents() {
    const messageEvents = [
      SOCKET_EVENTS.NEW_MESSAGE,
      SOCKET_EVENTS.MESSAGE_SENT,
      SOCKET_EVENTS.MESSAGE_EDITED,
      SOCKET_EVENTS.MESSAGE_DELETED,
      SOCKET_EVENTS.MESSAGE_READ,
      SOCKET_EVENTS.REACTION_UPDATED,
      SOCKET_EVENTS.USER_TYPING,
      SOCKET_EVENTS.USER_STOP_TYPING,
    ];
    
    messageEvents.forEach(event => {
      this.socket.on(event, (data) => {
        this.emit(event, data);
        if (event === SOCKET_EVENTS.NEW_MESSAGE && !document.hasFocus()) {
          this._showNotification(data.message);
        }
      });
    });
  }

  _setupPresenceEvents() {
    const presenceEvents = [
      SOCKET_EVENTS.USER_ONLINE,
      SOCKET_EVENTS.USER_OFFLINE,
      SOCKET_EVENTS.CURRENT_ONLINE_USERS,
      SOCKET_EVENTS.USER_STATUS_UPDATED,
    ];
    
    presenceEvents.forEach(event => {
      this.socket.on(event, (data) => this.emit(event, data));
    });
  }

  // ============== Event Handlers ==============
  
  _onConnect() {
    this.isConnected = true;
    this.reconnectAttempts = 0;
    this._processMessageQueue();
    this.emit('socket_connected');
    toast.success('Connected to chat server');
  }

  _onDisconnect(reason) {
    this.isConnected = false;
    this._initialized = false;
    this.emit('socket_disconnected', reason);
    
    if (reason !== 'io client disconnect') {
      toast.error('Connection lost. Attempting to reconnect...');
    }
  }

  _onError(error) {
    this.isConnected = false;
    const message = formatError(error);
    
    if (message.includes('Authentication error')) {
      this._handleAuthError();
    } else if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this._attemptReconnect();
    } else {
      toast.error('Unable to connect to chat server');
    }
    
    this.emit('socket_error', { message, error });
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

  _attemptReconnect() {
    this.reconnectAttempts++;
    const delay = 1000 * Math.pow(2, this.reconnectAttempts - 1);
    
    setTimeout(() => {
      const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
      if (token) this.connect(token);
    }, delay);
  }

  // ============== Event System ==============
  
  on(event, handler) {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event).push(handler);
  }

  off(event, handler) {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) handlers.splice(index, 1);
    }
  }

  emit(event, data) {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error(`Error in event handler for ${event}:`, error);
        }
      });
    }
  }

  // ============== Socket Actions ==============
  
  _emitWithQueue(event, data) {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
    } else {
      this.messageQueue.push({ event, data });
    }
  }

  _processMessageQueue() {
    while (this.messageQueue.length > 0) {
      const { event, data } = this.messageQueue.shift();
      if (this.socket?.connected) {
        this.socket.emit(event, data);
      }
    }
  }

  // Conversation actions
  joinConversation(id) {
    this._emitWithQueue(SOCKET_EVENTS.JOIN_CONVERSATION, id);
  }

  leaveConversation(id) {
    if (this.socket?.connected) {
      this.socket.emit(SOCKET_EVENTS.LEAVE_CONVERSATION, id);
    }
  }

  // Message actions
  sendMessage(data) {
    this._emitWithQueue(SOCKET_EVENTS.SEND_MESSAGE, data);
  }

  editMessage(messageId, newContent) {
    this._emitWithQueue('edit_message', { messageId, newContent });
  }

  deleteMessage(messageId) {
    this._emitWithQueue('delete_message', { messageId });
  }

  markMessagesRead(messageIds, conversationId) {
    this._emitWithQueue('mark_message_read', { messageIds, conversationId });
  }

  // Reaction actions
  addReaction(messageId, emoji) {
    this._emitWithQueue(SOCKET_EVENTS.ADD_REACTION, { 
      messageId, 
      emoji, 
      timestamp: new Date().toISOString() 
    });
  }

  removeReaction(messageId, emoji) {
    this._emitWithQueue(SOCKET_EVENTS.REMOVE_REACTION, { 
      messageId, 
      emoji, 
      timestamp: new Date().toISOString() 
    });
  }

  // Typing actions
  startTyping(conversationId) {
    this._emitWithQueue(SOCKET_EVENTS.TYPING_START, { conversationId });
  }

  stopTyping(conversationId) {
    this._emitWithQueue(SOCKET_EVENTS.TYPING_STOP, { conversationId });
  }

  // Other actions
  updateStatus(status) {
    this._emitWithQueue('update_user_status', { status });
  }

  requestConversationInfo(conversationId) {
    this._emitWithQueue('request_conversation_info', { conversationId });
  }

  // ============== Utilities ==============
  
  _showNotification(message) {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    
    new Notification(message.sender?.name || 'Someone', {
      body: message.content,
      icon: message.sender?.avatar || '/favicon.ico',
      tag: message._id,
    });
  }

  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      socketId: this.socket?.id || null,
      reconnectAttempts: this.reconnectAttempts,
    };
  }
}

export default new SocketService();
