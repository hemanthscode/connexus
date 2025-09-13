import React, { createContext, useReducer, useEffect, useRef, useContext } from 'react'
import { useAuth } from './AuthContext.jsx'
import * as chatService from '../services/chatService.js'
import {
  initiateSocket,
  disconnectSocket,
  emitWithQueue,
} from '../socket/socketClient.js'
import { SOCKET_EVENTS } from '../utils/constants.js'

const initialState = {
  conversations: [],
  activeConversation: null,
  messages: [],
  typingUsers: [],
  onlineUsers: new Set(),
  error: null,
}

function chatReducer(state, action) {
  switch (action.type) {
    case 'SET_CONVERSATIONS':
      return { ...state, conversations: action.payload }
    case 'SET_ACTIVE_CONVERSATION':
      return {
        ...state,
        activeConversation: action.payload,
        messages: [],
        typingUsers: [],
      }
    case 'SET_MESSAGES':
      return { ...state, messages: action.payload }
    case 'ADD_MESSAGE':
      return {
        ...state,
        messages: [...state.messages, action.payload],
        conversations: state.conversations.map((c) =>
          c._id === action.payload.conversation
            ? {
                ...c,
                lastMessage: action.payload,
                unreadCount:
                  c._id === state.activeConversation?._id
                    ? 0
                    : (c.unreadCount || 0) + 1,
              }
            : c,
        ),
      }
    case 'UPDATE_MESSAGE':
      return {
        ...state,
        messages: state.messages.map((m) =>
          m._id === action.payload._id ? { ...m, ...action.payload } : m,
        ),
      }
    case 'REMOVE_MESSAGE':
      return {
        ...state,
        messages: state.messages.filter((m) => m._id !== action.payload),
      }
    case 'MARK_MESSAGE_READ': {
      const { messageId, userId } = action.payload
      return {
        ...state,
        messages: state.messages.map((m) =>
          m._id === messageId
            ? {
                ...m,
                readBy: m.readBy.some((r) => r.user === userId)
                  ? m.readBy
                  : [...m.readBy, { user: userId, readAt: new Date().toISOString() }],
              }
            : m,
        ),
        conversations: state.conversations.map((c) =>
          c._id === state.activeConversation?._id ? { ...c, unreadCount: 0 } : c,
        ),
      }
    }
    case 'USER_ONLINE':
      return { ...state, onlineUsers: new Set(state.onlineUsers).add(action.payload) }
    case 'USER_OFFLINE': {
      const newSet = new Set(state.onlineUsers)
      newSet.delete(action.payload)
      return { ...state, onlineUsers: newSet }
    }
    case 'USER_TYPING': {
      const { userId, userName } = action.payload
      if (state.typingUsers.find((u) => u.userId === userId)) return state
      return { ...state, typingUsers: [...state.typingUsers, { userId, userName }] }
    }
    case 'USER_STOP_TYPING': {
      return { ...state, typingUsers: state.typingUsers.filter((u) => u.userId !== action.payload) }
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

const CONV_FETCH_COOLDOWN = 10000

export function ChatProvider({ children }) {
  const { token, user } = useAuth()
  const [state, dispatch] = useReducer(chatReducer, initialState)
  const socketRef = useRef(null)
  const lastConvFetchRef = useRef(0)

  // Initialize socket and attach events
  useEffect(() => {
    if (!token || !user) return
    const socket = initiateSocket(token)
    socketRef.current = socket

    const onUserOnline = ({ userId }) => dispatch({ type: 'USER_ONLINE', payload: userId })
    const onUserOffline = ({ userId }) => dispatch({ type: 'USER_OFFLINE', payload: userId })

    const onNewMessage = ({ message, conversationId }) => {
      dispatch({ type: 'ADD_MESSAGE', payload: message })
      if (state.activeConversation?._id === conversationId) {
        emitWithQueue(SOCKET_EVENTS.MARK_MESSAGE_READ, {
          conversationId,
          messageId: message._id,
        })
      }
    }

    const onMessageRead = ({ messageId, readBy }) => {
      dispatch({ type: 'MARK_MESSAGE_READ', payload: { messageId, userId: readBy } })
    }

    const onUserTyping = ({ userId, user: typingUser }) => {
      if (userId !== user._id) dispatch({ type: 'USER_TYPING', payload: { userId, userName: typingUser.name } })
    }

    const onUserStopTyping = ({ userId }) => {
      dispatch({ type: 'USER_STOP_TYPING', payload: userId })
    }

    const onReconnect = () => {
      const now = Date.now()
      if (now - lastConvFetchRef.current > CONV_FETCH_COOLDOWN) {
        chatService
          .getConversations(token)
          .then((convos) => dispatch({ type: 'SET_CONVERSATIONS', payload: convos }))
          .catch((err) => dispatch({ type: 'SET_ERROR', payload: err.message }))
        lastConvFetchRef.current = now
      }
      dispatch({ type: 'RESET_TYPING_USERS' })
    }

    socket.on('user_online', onUserOnline)
    socket.on('user_offline', onUserOffline)
    socket.on('new_message', onNewMessage)
    socket.on('message_read', onMessageRead)
    socket.on('user_typing', onUserTyping)
    socket.on('user_stop_typing', onUserStopTyping)
    socket.on('connect', onReconnect)

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
  }, [token, user, state.activeConversation?._id])

  // Load conversations with cooldown
  useEffect(() => {
    if (!token) return
    const now = Date.now()
    if (now - lastConvFetchRef.current < CONV_FETCH_COOLDOWN) return
    lastConvFetchRef.current = now

    chatService
      .getConversations(token)
      .then((convos) => dispatch({ type: 'SET_CONVERSATIONS', payload: convos }))
      .catch((err) => {
        if (err.message.includes('429')) {
          dispatch({ type: 'SET_ERROR', payload: 'Too many requests, please wait and try again.' })
        } else {
          dispatch({ type: 'SET_ERROR', payload: err.message })
        }
      })
  }, [token])

  // Load messages when activeConversation changes
  useEffect(() => {
    if (!state.activeConversation || !token) {
      dispatch({ type: 'SET_MESSAGES', payload: [] })
      dispatch({ type: 'RESET_TYPING_USERS' })
      return
    }
    chatService
      .getMessages(state.activeConversation._id, token)
      .then((msgs) => {
        dispatch({ type: 'SET_MESSAGES', payload: msgs })
        dispatch({
          type: 'SET_CONVERSATIONS',
          payload: state.conversations.map((c) =>
            c._id === state.activeConversation._id ? { ...c, unreadCount: 0 } : c,
          ),
        })
      })
      .catch((err) => dispatch({ type: 'SET_ERROR', payload: err.message }))
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
        setActiveConversation: (conv) => dispatch({ type: 'SET_ACTIVE_CONVERSATION', payload: conv }),
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
