import React, { createContext, useReducer, useEffect, useRef, useContext } from 'react'
import { useAuth } from './AuthContext.jsx'
import * as chatService from '../services/chatService.js'
import { initiateSocket, disconnectSocket, emitWithQueue } from '../socket/socketClient.js'
import { SOCKET_EVENTS } from '../utils/constants.js'

const initialState = {
  conversations: [],
  activeConversation: null,
  messages: [],
  typingUsers: [],
  onlineUsers: new Set(),
  userStatuses: {},
  error: null,
}

function chatReducer(state, action) {
  switch(action.type) {
    case 'SET_CONVERSATIONS':
      return { ...state, conversations: action.payload }
    case 'SET_ACTIVE_CONVERSATION':
      return {
        ...state,
        activeConversation: action.payload,
        messages: [],
        typingUsers: [],
        conversations: state.conversations.map(c => (c._id === action.payload?._id ? { ...c, unreadCount: 0 } : c)),
      }
    case 'SET_MESSAGES':
      return { ...state, messages: action.payload }
    case 'ADD_MESSAGE': {
      const isActive = state.activeConversation?._id === action.payload.conversation
      const updatedConvos = state.conversations.map(c => {
        if (c._id === action.payload.conversation) {
          return isActive
            ? { ...c, lastMessage: action.payload, unreadCount: 0 }
            : { ...c, lastMessage: action.payload, unreadCount: (c.unreadCount || 0) + 1 }
        }
        return c
      })
      return {
        ...state,
        messages: [...state.messages, action.payload],
        conversations: updatedConvos,
      }
    }
    case 'MARK_MESSAGES_READ': {
      const { conversationId, userId } = action.payload
      const updatedMessages = state.messages.map(m =>
        m.conversation === conversationId && !m.readBy.find(r => r.user === userId)
          ? { ...m, readBy: [...m.readBy, { user: userId, readAt: new Date().toISOString() }] }
          : m
      )
      const updatedConversations = state.conversations.map(c =>
        c._id === conversationId ? { ...c, unreadCount: 0 } : c
      )
      return {
        ...state,
        messages: updatedMessages,
        conversations: updatedConversations,
      }
    }
    case 'USER_ONLINE': {
      const newOnline = new Set(state.onlineUsers)
      newOnline.add(action.payload.userId)
      return {
        ...state,
        onlineUsers: newOnline,
        userStatuses: {
          ...state.userStatuses,
          [action.payload.userId]: { status: 'online', lastSeen: action.payload.lastSeen || null },
        },
      }
    }
    case 'USER_OFFLINE': {
      const newOnline = new Set(state.onlineUsers)
      newOnline.delete(action.payload.userId)
      return {
        ...state,
        onlineUsers: newOnline,
        userStatuses: {
          ...state.userStatuses,
          [action.payload.userId]: { status: 'offline', lastSeen: action.payload.lastSeen || new Date().toISOString() },
        },
      }
    }
    case 'USER_TYPING': {
      const { userId, userName } = action.payload
      if (state.typingUsers.find(u => u.userId === userId)) return state
      return { ...state, typingUsers: [...state.typingUsers, { userId, userName }] }
    }
    case 'USER_STOP_TYPING': {
      return { ...state, typingUsers: state.typingUsers.filter(u => u.userId !== action.payload) }
    }
    case 'RESET_TYPING_USERS':
      return { ...state, typingUsers: [] }
    case 'SET_ERROR':
      return { ...state, error: action.payload }
    default:
      return state
  }
}

const ChatContext = createContext()

export function ChatProvider({ children }) {
  const { token, user } = useAuth()
  const [state, dispatch] = useReducer(chatReducer, initialState)
  const socketRef = useRef(null)

  useEffect(() => {
    if (!token || !user) return

    const socket = initiateSocket(token)
    socketRef.current = socket

    const onUserOnline = ({ userId, lastSeen }) => dispatch({ type: 'USER_ONLINE', payload: { userId, lastSeen } })
    const onUserOffline = ({ userId, lastSeen }) => dispatch({ type: 'USER_OFFLINE', payload: { userId, lastSeen } })

    const onNewMessage = ({ message }) => {
      dispatch({ type: 'ADD_MESSAGE', payload: message })
      if (state.activeConversation?._id === message.conversation) {
        dispatch({
          type: 'MARK_MESSAGES_READ',
          payload: { conversationId: message.conversation, userId: user._id },
        })
        emitWithQueue(SOCKET_EVENTS.MARK_MESSAGE_READ, {
          conversationId: message.conversation,
          userId: user._id,
          messageIds: [message._id],
        })
      }
    }

    const onMessageRead = ({ conversationId, userId }) => {
      dispatch({ type: 'MARK_MESSAGES_READ', payload: { conversationId, userId } })
    }

    const onUserTyping = ({ userId, user }) => {
      if (userId !== user._id) dispatch({ type: 'USER_TYPING', payload: { userId, userName: user.name } })
    }
    const onUserStopTyping = ({ userId }) => {
      dispatch({ type: 'USER_STOP_TYPING', payload: userId })
    }

    const onReconnect = () => {
      chatService.getConversations(token).then(convos => dispatch({ type: 'SET_CONVERSATIONS', payload: convos })).catch(console.error)
      dispatch({ type: 'RESET_TYPING_USERS' })
    }

    socket.on('user_online', onUserOnline)
    socket.on('user_offline', onUserOffline)
    socket.on('new_message', onNewMessage)
    socket.on('message_read', onMessageRead)
    socket.on('user_typing', onUserTyping)
    socket.on('user_stop_typing', onUserStopTyping)
    socket.on('connect', onReconnect)

    // Initial load
    chatService.getConversations(token).then(convos => dispatch({ type: 'SET_CONVERSATIONS', payload: convos })).catch(console.error)

    return () => {
      socket.off('user_online', onUserOnline)
      socket.off('user_offline', onUserOffline)
      socket.off('new_message', onNewMessage)
      socket.off('message_read', onMessageRead)
      socket.off('user_typing', onUserTyping)
      socket.off('user_stop_typing', onUserStopTyping)
      socket.off('connect', onReconnect)
      disconnectSocket()
    }
  }, [token, user])

  useEffect(() => {
    if (!state.activeConversation || !token) return
    chatService.getMessages(state.activeConversation._id, token).then(msgs => {
      dispatch({ type: 'SET_MESSAGES', payload: msgs })
      dispatch({
        type: 'SET_CONVERSATIONS',
        payload: state.conversations.map(c =>
          c._id === state.activeConversation._id ? { ...c, unreadCount: 0 } : c
        )
      })
      // Mark all messages visible as read on backend and frontend
      const messageIds = msgs.map(m => m._id)
      dispatch({ type: 'MARK_MESSAGES_READ', payload: { conversationId: state.activeConversation._id, userId: user._id } })
      emitWithQueue(SOCKET_EVENTS.MARK_MESSAGE_READ, {
        conversationId: state.activeConversation._id,
        userId: user._id,
        messageIds,
      })
    }).catch(console.error)
  }, [state.activeConversation, token])

  const sendMessage = (content, type = 'text') => {
    if (!socketRef.current || !state.activeConversation) return
    emitWithQueue('send_message', {
      conversationId: state.activeConversation._id,
      content,
      type,
    })
  }

  const markTyping = (isTyping) => {
    if (!socketRef.current || !state.activeConversation) return
    emitWithQueue(isTyping ? 'typing_start' : 'typing_stop', { conversationId: state.activeConversation._id })
  }

  return (
    <ChatContext.Provider
      value={{
        ...state,
        setActiveConversation: conv => dispatch({ type: 'SET_ACTIVE_CONVERSATION', payload: conv }),
        sendMessage,
        markTyping,
        socket: socketRef.current,
      }}
    >
      {children}
    </ChatContext.Provider>
  )
}

export function useChat() {
  return useContext(ChatContext)
}
