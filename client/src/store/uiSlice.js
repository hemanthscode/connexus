import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { DEBUG } from '@/utils/constants.js'

// Initial state
const initialState = {
  // Layout
  sidebarOpen: true,
  sidebarCollapsed: false,
  isMobile: false,
  
  // Modals & Dialogs
  modals: {},
  confirmDialog: null,
  
  // Theme & Appearance
  theme: 'dark',
  
  // Search
  searchOpen: false,
  chatSearch: {
    open: false,
    query: '',
    results: [],
    loading: false,
  },
  
  // Context Menus
  messageContextMenu: null,
  
  // Loading states
  loadingStates: {},
  
  // Specialized modals
  userSelectModal: null,
  groupModal: null,
  profileModal: null,
  settingsModal: null,
  mediaViewer: null,
  
  // Page transitions
  pageTransition: {
    isTransitioning: false,
    direction: 'forward',
  },
}

const useUIStore = create(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        // Layout actions
        toggleSidebar: () => {
          set({ sidebarOpen: !get().sidebarOpen })
        },

        setSidebarOpen: (open) => {
          set({ sidebarOpen: open })
        },

        setSidebarCollapsed: (collapsed) => {
          set({ sidebarCollapsed: collapsed })
        },

        setMobile: (isMobile) => {
          set({
            isMobile,
            sidebarOpen: isMobile ? false : get().sidebarOpen
          })
        },

        // Theme
        setTheme: (theme) => {
          set({ theme })
          document.documentElement.setAttribute('data-theme', theme)
        },

        // Modal management
        openModal: (modalId, props = {}) => {
          const { modals } = get()
          set({
            modals: {
              ...modals,
              [modalId]: {
                id: modalId,
                open: true,
                props,
                openedAt: Date.now(),
              }
            }
          })
        },

        closeModal: (modalId) => {
          const { modals } = get()
          const updatedModals = { ...modals }
          delete updatedModals[modalId]
          set({ modals: updatedModals })
        },

        closeAllModals: () => {
          set({ modals: {} })
        },

        // Loading states
        setLoading: (key, loading) => {
          const { loadingStates } = get()
          const updatedStates = { ...loadingStates }
          
          if (loading) {
            updatedStates[key] = {
              loading: true,
              startTime: Date.now(),
            }
          } else {
            delete updatedStates[key]
          }
          
          set({ loadingStates: updatedStates })
        },

        isLoading: (key) => {
          return !!get().loadingStates[key]
        },

        // Search
        toggleSearch: () => {
          set({ searchOpen: !get().searchOpen })
        },

        setSearchOpen: (open) => {
          set({ searchOpen: open })
        },

        // Chat search
        setChatSearch: (updates) => {
          const { chatSearch } = get()
          set({
            chatSearch: { ...chatSearch, ...updates }
          })
        },

        openChatSearch: () => {
          set({
            chatSearch: { ...get().chatSearch, open: true }
          })
        },

        closeChatSearch: () => {
          set({
            chatSearch: {
              open: false,
              query: '',
              results: [],
              loading: false,
            }
          })
        },

        // Context menus
        showMessageContextMenu: (messageId, position) => {
          set({
            messageContextMenu: {
              open: true,
              messageId,
              position,
            }
          })
        },

        hideMessageContextMenu: () => {
          set({ messageContextMenu: null })
        },

        // Specialized modals
        openUserSelectModal: (options) => {
          set({
            userSelectModal: {
              open: true,
              ...options,
            }
          })
        },

        closeUserSelectModal: () => {
          set({ userSelectModal: null })
        },

        openGroupModal: (mode, groupId = null, data = null) => {
          set({
            groupModal: {
              open: true,
              mode, // 'create', 'edit', 'info'
              groupId,
              data,
            }
          })
        },

        closeGroupModal: () => {
          set({ groupModal: null })
        },

        openProfileModal: (userId, mode = 'view') => {
          set({
            profileModal: {
              open: true,
              userId,
              mode, // 'view', 'edit'
            }
          })
        },

        closeProfileModal: () => {
          set({ profileModal: null })
        },

        openSettingsModal: (tab = 'general') => {
          set({
            settingsModal: {
              open: true,
              tab, // 'general', 'notifications', 'privacy', 'appearance'
            }
          })
        },

        closeSettingsModal: () => {
          set({ settingsModal: null })
        },

        openMediaViewer: (media, playlist = []) => {
          const currentIndex = playlist.findIndex(item => item.id === media.id) || 0
          
          set({
            mediaViewer: {
              open: true,
              media,
              playlist,
              currentIndex,
            }
          })
        },

        closeMediaViewer: () => {
          set({ mediaViewer: null })
        },

        // Confirmation dialog
        showConfirmDialog: (options) => {
          set({
            confirmDialog: {
              open: true,
              title: options.title || 'Confirm',
              message: options.message || 'Are you sure?',
              variant: options.variant || 'danger',
              onConfirm: options.onConfirm,
              onCancel: options.onCancel,
            }
          })
        },

        hideConfirmDialog: () => {
          set({ confirmDialog: null })
        },

        // Page transitions
        startPageTransition: (direction = 'forward') => {
          set({
            pageTransition: {
              isTransitioning: true,
              direction,
            }
          })
        },

        endPageTransition: () => {
          set({
            pageTransition: {
              isTransitioning: false,
              direction: 'forward',
            }
          })
        },

        // Selectors
        getModal: (modalId) => {
          return get().modals[modalId] || null
        },

        isModalOpen: (modalId) => {
          return !!get().modals[modalId]?.open
        },
      }),
      {
        name: 'ui-store',
        partialize: (state) => ({
          theme: state.theme,
          sidebarOpen: state.sidebarOpen,
          sidebarCollapsed: state.sidebarCollapsed,
        }),
      }
    ),
    { name: 'ui-store', enabled: DEBUG.ENABLED }
  )
)

// Selectors
export const useUI = () => useUIStore()
export const useTheme = () => useUIStore(state => state.theme)
export const useSidebar = () => useUIStore(state => ({
  open: state.sidebarOpen,
  collapsed: state.sidebarCollapsed,
}))
export const useModals = () => useUIStore(state => state.modals)

export default useUIStore
// Add this to the bottom of your uiSlice.js file
export const useUIActions = () => {
  const store = useUIStore()
  
  return {
    openUserSelectModal: store.openUserSelectModal,
    closeUserSelectModal: store.closeUserSelectModal,
    openSettingsModal: store.openSettingsModal,
    closeSettingsModal: store.closeSettingsModal,
    openProfileModal: store.openProfileModal,
    closeProfileModal: store.closeProfileModal,
    openGroupModal: store.openGroupModal,
    closeGroupModal: store.closeGroupModal,
    openModal: store.openModal,
    closeModal: store.closeModal,
    closeAllModals: store.closeAllModals,
    showConfirmDialog: store.showConfirmDialog,
    hideConfirmDialog: store.hideConfirmDialog
  }
}
