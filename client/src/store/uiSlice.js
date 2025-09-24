import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { DEBUG } from '@/utils/constants.js'

// Initial state
const initialState = {
  // Layout
  sidebarOpen: true,
  sidebarCollapsed: false,
  
  // Modals
  modals: {},
  
  // Toasts/Notifications
  toasts: [],
  
  // Loading states
  loadingStates: {},
  
  // Search
  searchOpen: false,
  searchFocused: false,
  
  // Theme
  theme: 'dark',
  
  // Mobile
  isMobile: false,
  
  // Chat UI
  chatSearch: {
    open: false,
    query: '',
    results: [],
    loading: false,
  },
  
  // Message UI
  messageContextMenu: {
    open: false,
    messageId: null,
    position: { x: 0, y: 0 },
  },
  
  // User selection
  userSelectModal: {
    open: false,
    type: null, // 'newChat', 'addToGroup', etc.
    onSelect: null,
    excludeUsers: [],
  },
  
  // Group management
  groupModal: {
    open: false,
    mode: 'create', // 'create', 'edit', 'info'
    groupId: null,
    data: null,
  },
  
  // Profile management
  profileModal: {
    open: false,
    userId: null,
    mode: 'view', // 'view', 'edit'
  },
  
  // Settings
  settingsModal: {
    open: false,
    tab: 'general', // 'general', 'notifications', 'privacy', 'appearance'
  },
  
  // Media viewer
  mediaViewer: {
    open: false,
    media: null,
    playlist: [],
    currentIndex: 0,
  },
  
  // Confirmation dialogs
  confirmDialog: {
    open: false,
    title: '',
    message: '',
    onConfirm: null,
    onCancel: null,
    variant: 'danger',
  },
  
  // Page transitions
  pageTransition: {
    isTransitioning: false,
    direction: 'forward', // 'forward', 'backward'
  },
}

// Create UI store
const useUIStore = create(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        actions: {
          /**
           * Toggle sidebar
           */
          toggleSidebar: () => {
            const currentState = get()
            set({ sidebarOpen: !currentState.sidebarOpen })
          },

          /**
           * Set sidebar state
           */
          setSidebarOpen: (open) => {
            set({ sidebarOpen: open })
          },

          /**
           * Toggle sidebar collapsed state
           */
          toggleSidebarCollapsed: () => {
            const currentState = get()
            set({ sidebarCollapsed: !currentState.sidebarCollapsed })
          },

          /**
           * Set sidebar collapsed state
           */
          setSidebarCollapsed: (collapsed) => {
            set({ sidebarCollapsed: collapsed })
          },

          /**
           * Open modal
           */
          openModal: (modalId, props = {}) => {
            const currentState = get()
            set({
              modals: {
                ...currentState.modals,
                [modalId]: {
                  id: modalId,
                  open: true,
                  props,
                  openedAt: Date.now(),
                }
              }
            })
          },

          /**
           * Close modal
           */
          closeModal: (modalId) => {
            const currentState = get()
            const updatedModals = { ...currentState.modals }
            delete updatedModals[modalId]
            set({ modals: updatedModals })
          },

          /**
           * Close all modals
           */
          closeAllModals: () => {
            set({ modals: {} })
          },

          /**
           * Set loading state
           */
          setLoading: (key, loading) => {
            const currentState = get()
            const updatedLoadingStates = { ...currentState.loadingStates }
            
            if (loading) {
              updatedLoadingStates[key] = {
                loading: true,
                startTime: Date.now(),
              }
            } else {
              delete updatedLoadingStates[key]
            }
            
            set({ loadingStates: updatedLoadingStates })
          },

          /**
           * Set mobile mode
           */
          setMobile: (isMobile) => {
            set({
              isMobile,
              // Auto-close sidebar on mobile
              sidebarOpen: isMobile ? false : get().sidebarOpen
            })
          },

          /**
           * Set theme
           */
          setTheme: (theme) => {
            set({ theme })
          },

          /**
           * Toggle search
           */
          toggleSearch: () => {
            const currentState = get()
            set({
              searchOpen: !currentState.searchOpen,
              searchFocused: !currentState.searchOpen ? false : currentState.searchFocused
            })
          },

          /**
           * Set search state
           */
          setSearchState: (updates) => {
            const currentState = get()
            set({ ...currentState, ...updates })
          },

          /**
           * Open chat search
           */
          openChatSearch: () => {
            const currentState = get()
            set({
              chatSearch: {
                ...currentState.chatSearch,
                open: true
              }
            })
          },

          /**
           * Close chat search
           */
          closeChatSearch: () => {
            const currentState = get()
            set({
              chatSearch: {
                ...currentState.chatSearch,
                open: false,
                query: '',
                results: []
              }
            })
          },

          /**
           * Set chat search query
           */
          setChatSearchQuery: (query) => {
            const currentState = get()
            set({
              chatSearch: {
                ...currentState.chatSearch,
                query
              }
            })
          },

          /**
           * Set chat search results
           */
          setChatSearchResults: (results) => {
            const currentState = get()
            set({
              chatSearch: {
                ...currentState.chatSearch,
                results,
                loading: false
              }
            })
          },

          /**
           * Set chat search loading
           */
          setChatSearchLoading: (loading) => {
            const currentState = get()
            set({
              chatSearch: {
                ...currentState.chatSearch,
                loading
              }
            })
          },

          /**
           * Show message context menu
           */
          showMessageContextMenu: (messageId, position) => {
            set({
              messageContextMenu: {
                open: true,
                messageId,
                position,
              }
            })
          },

          /**
           * Hide message context menu
           */
          hideMessageContextMenu: () => {
            set({
              messageContextMenu: {
                open: false,
                messageId: null,
                position: { x: 0, y: 0 },
              }
            })
          },

          /**
           * Open user select modal
           */
          openUserSelectModal: (type, onSelect, options = {}) => {
            set({
              userSelectModal: {
                open: true,
                type,
                onSelect,
                excludeUsers: options.excludeUsers || [],
                title: options.title || 'Select User',
                multiple: options.multiple || false,
                existingGroup: options.existingGroup || null,
              }
            })
          },

          /**
           * Close user select modal
           */
          closeUserSelectModal: () => {
            set({
              userSelectModal: {
                open: false,
                type: null,
                onSelect: null,
                excludeUsers: [],
                existingGroup: null,
              }
            })
          },

          /**
           * Open group modal
           */
          openGroupModal: (mode = 'create', groupId = null, data = null) => {
            set({
              groupModal: {
                open: true,
                mode,
                groupId,
                data,
              }
            })
          },

          /**
           * Close group modal
           */
          closeGroupModal: () => {
            set({
              groupModal: {
                open: false,
                mode: 'create',
                groupId: null,
                data: null,
              }
            })
          },

          /**
           * Open profile modal
           */
          openProfileModal: (userId, mode = 'view') => {
            set({
              profileModal: {
                open: true,
                userId,
                mode,
              }
            })
          },

          /**
           * Close profile modal
           */
          closeProfileModal: () => {
            set({
              profileModal: {
                open: false,
                userId: null,
                mode: 'view',
              }
            })
          },

          /**
           * Open settings modal
           */
          openSettingsModal: (tab = 'general') => {
            set({
              settingsModal: {
                open: true,
                tab,
              }
            })
          },

          /**
           * Close settings modal
           */
          closeSettingsModal: () => {
            set({
              settingsModal: {
                open: false,
                tab: 'general',
              }
            })
          },

          /**
           * Set settings tab
           */
          setSettingsTab: (tab) => {
            const currentState = get()
            set({
              settingsModal: {
                ...currentState.settingsModal,
                tab,
              }
            })
          },

          /**
           * Open media viewer
           */
          openMediaViewer: (media, playlist = [], currentIndex = 0) => {
            set({
              mediaViewer: {
                open: true,
                media,
                playlist,
                currentIndex,
              }
            })
          },

          /**
           * Close media viewer
           */
          closeMediaViewer: () => {
            set({
              mediaViewer: {
                open: false,
                media: null,
                playlist: [],
                currentIndex: 0,
              }
            })
          },

          /**
           * Navigate media viewer
           */
          navigateMediaViewer: (direction) => {
            const currentState = get()
            const { playlist, currentIndex } = currentState.mediaViewer
            
            if (playlist.length === 0) return
            
            let newIndex = currentIndex
            
            if (direction === 'next') {
              newIndex = (currentIndex + 1) % playlist.length
            } else if (direction === 'prev') {
              newIndex = currentIndex === 0 ? playlist.length - 1 : currentIndex - 1
            }
            
            set({
              mediaViewer: {
                ...currentState.mediaViewer,
                currentIndex: newIndex,
                media: playlist[newIndex]
              }
            })
          },

          /**
           * Show confirmation dialog
           */
          showConfirmDialog: (options) => {
            set({
              confirmDialog: {
                open: true,
                title: options.title || 'Confirm Action',
                message: options.message || 'Are you sure?',
                onConfirm: options.onConfirm || (() => {}),
                onCancel: options.onCancel || (() => {}),
                variant: options.variant || 'danger',
                confirmLabel: options.confirmLabel || 'Confirm',
                cancelLabel: options.cancelLabel || 'Cancel',
              }
            })
          },

          /**
           * Hide confirmation dialog
           */
          hideConfirmDialog: () => {
            set({
              confirmDialog: {
                open: false,
                title: '',
                message: '',
                onConfirm: null,
                onCancel: null,
                variant: 'danger',
              }
            })
          },

          /**
           * Start page transition
           */
          startPageTransition: (direction = 'forward') => {
            set({
              pageTransition: {
                isTransitioning: true,
                direction,
              }
            })
          },

          /**
           * End page transition
           */
          endPageTransition: () => {
            set({
              pageTransition: {
                isTransitioning: false,
                direction: 'forward',
              }
            })
          },

          /**
           * Add toast notification
           */
          addToast: (toast) => {
            const toastId = `toast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
            const currentState = get()
            
            set({
              toasts: [
                ...currentState.toasts,
                {
                  id: toastId,
                  ...toast,
                  createdAt: Date.now(),
                }
              ]
            })

            // Auto-remove toast after duration
            if (toast.duration !== 0) {
              setTimeout(() => {
                get().actions.removeToast(toastId)
              }, toast.duration || 4000)
            }

            return toastId
          },

          /**
           * Remove toast notification
           */
          removeToast: (toastId) => {
            const currentState = get()
            set({
              toasts: currentState.toasts.filter(t => t.id !== toastId)
            })
          },

          /**
           * Clear all toasts
           */
          clearAllToasts: () => {
            set({ toasts: [] })
          },

          /**
           * Reset UI state
           */
          resetUI: () => {
            const currentState = get()
            // Keep only persistent settings
            const { theme, sidebarCollapsed } = currentState
            
            set({
              ...initialState,
              theme,
              sidebarCollapsed,
            })
          },
        },

        // Computed values (selectors)
        computed: {
          /**
           * Check if modal is open
           */
          isModalOpen: (modalId) => {
            const state = get()
            return !!state.modals[modalId]
          },

          /**
           * Get modal props
           */
          getModalProps: (modalId) => {
            const state = get()
            const modal = state.modals[modalId]
            return modal?.props || {}
          },

          /**
           * Check if loading
           */
          isLoading: (key) => {
            const state = get()
            return !!state.loadingStates[key]
          },

          /**
           * Get loading duration
           */
          getLoadingDuration: (key) => {
            const state = get()
            const loadingState = state.loadingStates[key]
            return loadingState ? Date.now() - loadingState.startTime : 0
          },

          /**
           * Check if any modal is open
           */
          hasOpenModals: () => {
            const state = get()
            return Object.keys(state.modals).length > 0
          },

          /**
           * Get active toasts
           */
          getActiveToasts: () => {
            const state = get()
            return state.toasts.filter(t => {
              const age = Date.now() - t.createdAt
              return t.duration === 0 || age < (t.duration || 4000)
            })
          },
        },
      }),
      {
        name: 'ui-store',
        // Only persist UI preferences
        partialize: (state) => ({
          theme: state.theme,
          sidebarCollapsed: state.sidebarCollapsed,
        }),
      }
    ),
    {
      name: 'ui-store',
      enabled: DEBUG.ENABLED,
    }
  )
)

// Export selectors
export const useUI = () => useUIStore()
export const useUIActions = () => useUIStore(state => state.actions)
export const useUIComputed = () => useUIStore(state => state.computed)

// Export individual selectors
export const useSidebarOpen = () => useUIStore(state => state.sidebarOpen)
export const useTheme = () => useUIStore(state => state.theme)
export const useIsMobile = () => useUIStore(state => state.isMobile)
export const useToasts = () => useUIStore(state => state.toasts)

// Named export
export { useUIStore }

export default useUIStore
