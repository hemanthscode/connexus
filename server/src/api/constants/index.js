// HTTP Status Codes
export const STATUS_CODES = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
};

// Success Messages
export const SUCCESS_MESSAGES = {
  USER_REGISTERED: 'User registered successfully',
  LOGIN_SUCCESSFUL: 'Login successful',
  PASSWORD_CHANGED: 'Password changed successfully',
  LOGGED_OUT: 'Logged out successfully',
  MESSAGE_SENT: 'Message sent',
  MESSAGE_DELETED: 'Message deleted',
  MARKED_AS_READ: 'Marked as read',
  PROFILE_UPDATED: 'Profile updated',
};

// Error Messages
export const ERROR_MESSAGES = {
  EMAIL_EXISTS: 'Email already registered',
  INVALID_CREDENTIALS: 'Invalid credentials',
  USER_NOT_FOUND: 'User not found',
  UNAUTHORIZED: 'Unauthorized',
  UNAUTHORIZED_EDIT: 'Unauthorized to edit message',
  UNAUTHORIZED_DELETE: 'Unauthorized to delete message',
  CONVERSATION_NOT_FOUND: 'Conversation not found',
  MESSAGE_NOT_FOUND: 'Message not found',
  CURRENT_PASSWORD_INCORRECT: 'Current password incorrect',
  EMAIL_IN_USE: 'Email already in use',
  QUERY_TOO_SHORT: 'Query too short',
  NO_TOKEN: 'No token provided',
  INVALID_TOKEN: 'Invalid token',
  SERVER_ERROR_REGISTRATION: 'Server error during registration',
  SERVER_ERROR_LOGIN: 'Server error during login',
  SERVER_ERROR_PASSWORD: 'Server error changing password',
  SERVER_ERROR_LOGOUT: 'Server error during logout',
  FETCHING_CONVERSATIONS_FAILED: 'Fetching conversations failed',
  FETCHING_MESSAGES_FAILED: 'Fetching messages failed',
  SENDING_MESSAGE_FAILED: 'Sending message failed',
  EDITING_MESSAGE_FAILED: 'Editing message failed',
  DELETING_MESSAGE_FAILED: 'Deleting message failed',
  ADDING_REACTION_FAILED: 'Adding reaction failed',
  REMOVING_REACTION_FAILED: 'Removing reaction failed',
  MARK_READ_FAILED: 'Mark as read failed',
  SEARCH_FAILED: 'Search failed',
  PROFILE_RETRIEVAL_ERROR: 'Server error retrieving profile',
  PROFILE_UPDATE_ERROR: 'Server error updating profile',
  AUTHENTICATION_FAILURE: 'Authentication failure',
  UNAUTHORIZED_ARCHIVED: 'Unauthorized or conversation archived',
  BLOCKED_BY_RECIPIENT: 'You are blocked by the recipient',
  GROUP_NAME_REQUIRED: 'Group name required',
  GROUP_NOT_FOUND: 'Group conversation not found',
  NOT_AUTHORIZED_UPDATE: 'Not authorized to update group settings',
  NOT_AUTHORIZED_ADD: 'Not authorized to add participants',
  NOT_AUTHORIZED_REMOVE: 'Not authorized to remove participant',
  ONLY_ADMIN_CHANGE_ROLES: 'Only admin can change roles',
  ARCHIVING_FAILED: 'Archiving failed',
  CREATION_FAILED: 'Creation failed',
  GROUP_CREATION_FAILED: 'Group creation failed',
  GROUP_UPDATE_FAILED: 'Group update failed',
  ADDING_PARTICIPANTS_FAILED: 'Adding participants failed',
  REMOVING_PARTICIPANT_FAILED: 'Removing participant failed',
  CHANGING_ROLE_FAILED: 'Changing role failed',
};

// Database Field Selectors
export const DB_SELECTORS = {
  USER_PUBLIC: 'name email avatar status lastSeen',
  USER_BASIC: 'name email avatar',
  USER_WITH_STATUS: 'name email avatar status',
  MESSAGE_BASIC: 'content sender conversation type createdAt',
  CONVERSATION_BASIC: 'type name participants lastMessage createdAt',
};

// Database Population Patterns
export const DB_POPULATE = {
  SENDER: { path: 'sender', select: 'name email avatar' },
  PARTICIPANTS: { path: 'participants.user', select: 'name email avatar status lastSeen' },
  LAST_MESSAGE_SENDER: { path: 'lastMessage.sender', select: 'name avatar' },
  REACTIONS_USER: { path: 'reactions.user', select: 'name email avatar' },
  REPLY_TO: { path: 'replyTo', select: 'content sender' },
  REPLY_TO_WITH_SENDER: { 
    path: 'replyTo', 
    populate: { path: 'sender', select: 'name email avatar' }
  },
};

export default {
  STATUS_CODES,
  SUCCESS_MESSAGES,
  ERROR_MESSAGES,
  DB_SELECTORS,
  DB_POPULATE,
};
