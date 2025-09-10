export const mockMessages = {
  'conv-1': [
    {
      id: 'msg-1',
      content: 'Hey! How\'s the project coming along?',
      senderId: '2',
      timestamp: new Date(Date.now() - 7200000).toISOString(),
      status: 'read'
    },
    {
      id: 'msg-2',
      content: 'It\'s going well! Just finished the authentication module.',
      senderId: '1',
      timestamp: new Date(Date.now() - 7000000).toISOString(),
      status: 'read'
    },
    {
      id: 'msg-3',
      content: 'That\'s awesome! Need any help with testing?',
      senderId: '2',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      status: 'read'
    },
    {
      id: 'msg-4',
      content: 'Actually, yes! Could you review the login flow?',
      senderId: '1',
      timestamp: new Date(Date.now() - 3500000).toISOString(),
      status: 'read'
    },
    {
      id: 'msg-5',
      content: 'Thanks for the help with the project!',
      senderId: '2',
      timestamp: new Date(Date.now() - 1800000).toISOString(),
      status: 'delivered'
    }
  ],
  'conv-2': [
    {
      id: 'msg-6',
      content: 'Morning team! Ready for the sprint planning?',
      senderId: '3',
      timestamp: new Date(Date.now() - 14400000).toISOString(),
      status: 'read'
    },
    {
      id: 'msg-7',
      content: 'Yes! I have the user stories ready.',
      senderId: '1',
      timestamp: new Date(Date.now() - 14000000).toISOString(),
      status: 'read'
    },
    {
      id: 'msg-8',
      content: 'Great! I\'ll share the updated mockups.',
      senderId: '4',
      timestamp: new Date(Date.now() - 10800000).toISOString(),
      status: 'read'
    },
    {
      id: 'msg-9',
      content: 'Let\'s schedule the code review for Friday.',
      senderId: '3',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      status: 'sent'
    }
  ],
  'conv-3': [
    {
      id: 'msg-10',
      content: 'Are we still on for lunch tomorrow?',
      senderId: '4',
      timestamp: new Date(Date.now() - 21600000).toISOString(),
      status: 'read'
    },
    {
      id: 'msg-11',
      content: 'Absolutely! 12:30 at the usual place?',
      senderId: '1',
      timestamp: new Date(Date.now() - 18000000).toISOString(),
      status: 'read'
    },
    {
      id: 'msg-12',
      content: 'Perfect! See you tomorrow!',
      senderId: '4',
      timestamp: new Date(Date.now() - 7200000).toISOString(),
      status: 'read'
    }
  ],
  'conv-4': [
    {
      id: 'msg-13',
      content: 'Check out the new dashboard design I just pushed',
      senderId: '1',
      timestamp: new Date(Date.now() - 14400000).toISOString(),
      status: 'read'
    },
    {
      id: 'msg-14',
      content: 'The new design looks great 👍',
      senderId: '5',
      timestamp: new Date(Date.now() - 10800000).toISOString(),
      status: 'delivered'
    }
  ]
}
