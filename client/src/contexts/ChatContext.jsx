import React, { createContext, useReducer, useCallback, useEffect } from 'react'
import { mockConversations } from '../data/mockConversations'
import { mockMessages } from '../data/mockMessages'
import { generateId } from '../utils/helpers'

const ChatContext = createContext()

const initialState = {
  conversations: [],
  messages: {},
  activeConversation: null,
  typingUsers: {},
  loading: true
}

function chatReducer(state, action) {
  switch (action.type) {
    case 'INITIALIZE_DATA':
      return {
        ...state,
        conversations: action.payload.conversations,
        messages: action.payload.messages,
        loading: false
      }
    
    case 'SET_ACTIVE_CONVERSATION':
      return { ...state, activeConversation: action.payload }
    
    case 'ADD_MESSAGE':
      return {
        ...state,
        messages: {
          ...state.messages,
          [action.payload.conversationId]: [
            ...(state.messages[action.payload.conversationId] || []),
            action.payload.message
          ]
        }
      }
    
    case 'UPDATE_CONVERSATION':
      return {
        ...state,
        conversations: state.conversations.map(conv =>
          conv.id === action.payload.id ? { ...conv, ...action.payload.updates } : conv
        )
      }
    
    case 'MARK_AS_READ':
      return {
        ...state,
        conversations: state.conversations.map(conv =>
          conv.id === action.payload ? { ...conv, unreadCount: 0 } : conv
        )
      }

    case 'SET_TYPING':
      return {
        ...state,
        typingUsers: {
          ...state.typingUsers,
          [action.payload.conversationId]: action.payload.users
        }
      }
    
    default:
      return state
  }
}

/**
 * Chat Provider Component
 */
export function ChatProvider({ children }) {
  const [state, dispatch] = useReducer(chatReducer, initialState)

  useEffect(() => {
    const initializeData = async () => {
      await new Promise(resolve => setTimeout(resolve, 500))
      
      dispatch({
        type: 'INITIALIZE_DATA',
        payload: {
          conversations: mockConversations,
          messages: mockMessages
        }
      })
    }

    initializeData()
  }, [])

  const setActiveConversation = useCallback((conversationId) => {
    const conversation = state.conversations.find(c => c.id === conversationId)
    dispatch({ type: 'SET_ACTIVE_CONVERSATION', payload: conversation })
    if (conversation?.unreadCount > 0) {
      dispatch({ type: 'MARK_AS_READ', payload: conversationId })
    }
  }, [state.conversations])

  const sendMessage = useCallback((conversationId, content, userId) => {
    const message = {
      id: generateId(),
      content,
      senderId: userId,
      timestamp: new Date().toISOString(),
      status: 'sent'
    }

    dispatch({
      type: 'ADD_MESSAGE',
      payload: { conversationId, message }
    })

    dispatch({
      type: 'UPDATE_CONVERSATION',
      payload: {
        id: conversationId,
        updates: {
          lastMessage: content,
          lastActivity: new Date().toISOString()
        }
      }
    })
  }, [])

  const value = {
    ...state,
    setActiveConversation,
    sendMessage,
    dispatch
  }

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  )
}

export { ChatContext }
