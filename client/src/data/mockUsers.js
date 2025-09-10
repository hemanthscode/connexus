export const mockUsers = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    avatar: null,
    status: 'online',
    lastSeen: new Date().toISOString()
  },
  {
    id: '2',
    name: 'Sarah Wilson',
    email: 'sarah@example.com',
    avatar: null,
    status: 'online',
    lastSeen: new Date(Date.now() - 300000).toISOString()
  },
  {
    id: '3',
    name: 'Mike Johnson',
    email: 'mike@example.com',
    avatar: null,
    status: 'away',
    lastSeen: new Date(Date.now() - 3600000).toISOString()
  },
  {
    id: '4',
    name: 'Emily Davis',
    email: 'emily@example.com',
    avatar: null,
    status: 'offline',
    lastSeen: new Date(Date.now() - 86400000).toISOString()
  },
  {
    id: '5',
    name: 'Alex Chen',
    email: 'alex@example.com',
    avatar: null,
    status: 'online',
    lastSeen: new Date().toISOString()
  }
]
