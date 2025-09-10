export const mockConversations = [
  {
    id: 'conv-1',
    type: 'direct',
    participants: ['1', '2'],
    name: 'Sarah Wilson',
    avatar: null,
    lastMessage: 'Thanks for the help with the project!',
    lastActivity: new Date(Date.now() - 1800000).toISOString(),
    unreadCount: 2,
    isOnline: true
  },
  {
    id: 'conv-2',
    type: 'group',
    participants: ['1', '3', '4', '5'],
    name: 'Dev Team',
    avatar: null,
    lastMessage: 'Mike: Let\'s schedule the code review',
    lastActivity: new Date(Date.now() - 3600000).toISOString(),
    unreadCount: 0,
    isOnline: false
  },
  {
    id: 'conv-3',
    type: 'direct',
    participants: ['1', '4'],
    name: 'Emily Davis',
    avatar: null,
    lastMessage: 'See you tomorrow!',
    lastActivity: new Date(Date.now() - 7200000).toISOString(),
    unreadCount: 0,
    isOnline: false
  },
  {
    id: 'conv-4',
    type: 'direct',
    participants: ['1', '5'],
    name: 'Alex Chen',
    avatar: null,
    lastMessage: 'The new design looks great 👍',
    lastActivity: new Date(Date.now() - 10800000).toISOString(),
    unreadCount: 1,
    isOnline: true
  }
]
