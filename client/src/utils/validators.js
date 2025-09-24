import Joi from 'joi'
import { VALIDATION_RULES } from './constants.js'

// Custom validation messages
const messages = {
  'string.empty': 'This field is required',
  'string.min': 'Must be at least {#limit} characters',
  'string.max': 'Must be less than {#limit} characters',
  'string.email': 'Please enter a valid email address',
  'any.required': 'This field is required',
  'string.pattern.base': 'Please enter a valid format',
}

// Auth validation schemas
export const authValidation = {
  // Register validation
  register: Joi.object({
    name: Joi.string()
      .min(VALIDATION_RULES.USERNAME.MIN_LENGTH)
      .max(VALIDATION_RULES.USERNAME.MAX_LENGTH)
      .trim()
      .required()
      .messages(messages),
    
    email: Joi.string()
      .email({ tlds: { allow: false } })
      .max(VALIDATION_RULES.EMAIL.MAX_LENGTH)
      .trim()
      .lowercase()
      .required()
      .messages(messages),
    
    password: Joi.string()
      .min(VALIDATION_RULES.PASSWORD.MIN_LENGTH)
      .max(VALIDATION_RULES.PASSWORD.MAX_LENGTH)
      .required()
      .messages({
        ...messages,
        'string.min': 'Password must be at least 6 characters',
      }),
    
    confirmPassword: Joi.string()
      .valid(Joi.ref('password'))
      .required()
      .messages({
        ...messages,
        'any.only': 'Passwords do not match',
      }),
  }),

  // Login validation
  login: Joi.object({
    email: Joi.string()
      .email({ tlds: { allow: false } })
      .trim()
      .lowercase()
      .required()
      .messages(messages),
    
    password: Joi.string()
      .min(VALIDATION_RULES.PASSWORD.MIN_LENGTH)
      .required()
      .messages(messages),
  }),

  // Change password validation
  changePassword: Joi.object({
    currentPassword: Joi.string()
      .required()
      .messages({
        ...messages,
        'string.empty': 'Current password is required',
      }),
    
    newPassword: Joi.string()
      .min(VALIDATION_RULES.PASSWORD.MIN_LENGTH)
      .max(VALIDATION_RULES.PASSWORD.MAX_LENGTH)
      .required()
      .messages({
        ...messages,
        'string.min': 'New password must be at least 6 characters',
      }),
    
    confirmNewPassword: Joi.string()
      .valid(Joi.ref('newPassword'))
      .required()
      .messages({
        ...messages,
        'any.only': 'New passwords do not match',
      }),
  }),
}

// User profile validation schemas
export const userValidation = {
  // Update profile validation
  updateProfile: Joi.object({
    name: Joi.string()
      .min(VALIDATION_RULES.USERNAME.MIN_LENGTH)
      .max(VALIDATION_RULES.USERNAME.MAX_LENGTH)
      .trim()
      .optional()
      .messages(messages),
    
    email: Joi.string()
      .email({ tlds: { allow: false } })
      .max(VALIDATION_RULES.EMAIL.MAX_LENGTH)
      .trim()
      .lowercase()
      .optional()
      .messages(messages),
    
    bio: Joi.string()
      .max(VALIDATION_RULES.BIO.MAX_LENGTH)
      .trim()
      .allow('')
      .optional()
      .messages(messages),
    
    location: Joi.string()
      .max(VALIDATION_RULES.LOCATION.MAX_LENGTH)
      .trim()
      .allow('')
      .optional()
      .messages(messages),
    
    avatar: Joi.string()
      .uri()
      .allow(null, '')
      .optional()
      .messages({
        ...messages,
        'string.uri': 'Please enter a valid URL for avatar',
      }),
    
    socialLinks: Joi.object()
      .pattern(
        Joi.string(),
        Joi.string().uri().messages({
          'string.uri': 'Please enter a valid URL',
        })
      )
      .optional()
      .messages(messages),
  }),

  // Search users validation
  searchUsers: Joi.object({
    query: Joi.string()
      .min(2)
      .max(100)
      .trim()
      .required()
      .messages({
        ...messages,
        'string.min': 'Search query must be at least 2 characters',
      }),
    
    limit: Joi.number()
      .integer()
      .min(1)
      .max(50)
      .default(10)
      .optional()
      .messages(messages),
  }),
}

// Chat validation schemas
export const chatValidation = {
  // Send message validation
  sendMessage: Joi.object({
    conversationId: Joi.string()
      .required()
      .messages({
        ...messages,
        'string.empty': 'Conversation ID is required',
      }),
    
    content: Joi.string()
      .min(1)
      .max(VALIDATION_RULES.MESSAGE.MAX_LENGTH)
      .trim()
      .required()
      .messages({
        ...messages,
        'string.min': 'Message cannot be empty',
        'string.max': `Message must be less than ${VALIDATION_RULES.MESSAGE.MAX_LENGTH} characters`,
      }),
    
    type: Joi.string()
      .valid('text', 'image', 'file')
      .default('text')
      .optional()
      .messages(messages),
    
    replyTo: Joi.string()
      .allow(null)
      .optional()
      .messages(messages),
    
    attachments: Joi.array()
      .items(Joi.object({
        name: Joi.string().required(),
        url: Joi.string().uri().required(),
        size: Joi.number().integer().min(0).required(),
        mimeType: Joi.string().required(),
      }))
      .max(5)
      .default([])
      .optional()
      .messages({
        ...messages,
        'array.max': 'Maximum 5 attachments allowed',
      }),
  }),

  // Edit message validation
  editMessage: Joi.object({
    messageId: Joi.string()
      .required()
      .messages({
        ...messages,
        'string.empty': 'Message ID is required',
      }),
    
    newContent: Joi.string()
      .min(1)
      .max(VALIDATION_RULES.MESSAGE.MAX_LENGTH)
      .trim()
      .required()
      .messages({
        ...messages,
        'string.min': 'Message cannot be empty',
        'string.max': `Message must be less than ${VALIDATION_RULES.MESSAGE.MAX_LENGTH} characters`,
      }),
  }),

  // Create group validation
  createGroup: Joi.object({
    name: Joi.string()
      .min(VALIDATION_RULES.GROUP_NAME.MIN_LENGTH)
      .max(VALIDATION_RULES.GROUP_NAME.MAX_LENGTH)
      .trim()
      .required()
      .messages({
        ...messages,
        'string.min': 'Group name is required',
      }),
    
    description: Joi.string()
      .max(VALIDATION_RULES.GROUP_DESCRIPTION.MAX_LENGTH)
      .trim()
      .allow('')
      .optional()
      .messages(messages),
    
    participants: Joi.array()
      .items(Joi.string())
      .min(1)
      .max(100)
      .default([])
      .optional()
      .messages({
        ...messages,
        'array.min': 'At least one participant is required',
        'array.max': 'Maximum 100 participants allowed',
      }),
    
    avatar: Joi.string()
      .uri()
      .allow(null, '')
      .optional()
      .messages({
        ...messages,
        'string.uri': 'Please enter a valid URL for group avatar',
      }),
  }),

  // Update group validation
  updateGroup: Joi.object({
    name: Joi.string()
      .min(VALIDATION_RULES.GROUP_NAME.MIN_LENGTH)
      .max(VALIDATION_RULES.GROUP_NAME.MAX_LENGTH)
      .trim()
      .optional()
      .messages(messages),
    
    description: Joi.string()
      .max(VALIDATION_RULES.GROUP_DESCRIPTION.MAX_LENGTH)
      .trim()
      .allow('')
      .optional()
      .messages(messages),
    
    avatar: Joi.string()
      .uri()
      .allow(null, '')
      .optional()
      .messages({
        ...messages,
        'string.uri': 'Please enter a valid URL for group avatar',
      }),
  }),

  // Add participants validation
  addParticipants: Joi.object({
    participants: Joi.array()
      .items(Joi.string())
      .min(1)
      .max(20)
      .required()
      .messages({
        ...messages,
        'array.min': 'At least one participant is required',
        'array.max': 'Maximum 20 participants can be added at once',
      }),
  }),

  // Change role validation
  changeRole: Joi.object({
    participantId: Joi.string()
      .required()
      .messages({
        ...messages,
        'string.empty': 'Participant ID is required',
      }),
    
    role: Joi.string()
      .valid('admin', 'moderator', 'member')
      .required()
      .messages({
        ...messages,
        'any.only': 'Invalid role specified',
      }),
  }),

  // Direct conversation validation
  createDirectConversation: Joi.object({
    participantId: Joi.string()
      .required()
      .messages({
        ...messages,
        'string.empty': 'Participant ID is required',
      }),
  }),
}

// File upload validation schemas
export const fileValidation = {
  // File upload validation
  uploadFile: Joi.object({
    file: Joi.object({
      name: Joi.string().required(),
      size: Joi.number().integer().min(1).max(10 * 1024 * 1024).required(), // 10MB max
      type: Joi.string().required(),
    }).required().messages({
      ...messages,
      'object.base': 'File is required',
      'number.max': 'File size must be less than 10MB',
    }),
  }),
}

// Generic validation function
export const validateData = (schema, data) => {
  const { error, value } = schema.validate(data, {
    abortEarly: false,
    allowUnknown: false,
    stripUnknown: true,
  })
  
  if (error) {
    const validationErrors = {}
    error.details.forEach(detail => {
      const field = detail.path.join('.')
      validationErrors[field] = detail.message
    })
    return { isValid: false, errors: validationErrors, data: null }
  }
  
  return { isValid: true, errors: null, data: value }
}

// Validate email format only
export const isValidEmail = (email) => {
  const emailSchema = Joi.string().email({ tlds: { allow: false } })
  const { error } = emailSchema.validate(email)
  return !error
}

// Validate password strength
export const validatePasswordStrength = (password) => {
  if (!password || password.length < 6) {
    return { isStrong: false, message: 'Password must be at least 6 characters' }
  }
  
  const hasUppercase = /[A-Z]/.test(password)
  const hasLowercase = /[a-z]/.test(password)
  const hasNumbers = /\d/.test(password)
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password)
  
  let strength = 0
  let suggestions = []
  
  if (hasLowercase) strength++
  else suggestions.push('lowercase letters')
  
  if (hasUppercase) strength++
  else suggestions.push('uppercase letters')
  
  if (hasNumbers) strength++
  else suggestions.push('numbers')
  
  if (hasSpecialChar) strength++
  else suggestions.push('special characters')
  
  if (password.length >= 8) strength++
  else suggestions.push('at least 8 characters')
  
  const strengthLevels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong']
  const level = strengthLevels[Math.min(strength, 4)]
  
  return {
    isStrong: strength >= 3,
    strength: level,
    score: strength,
    suggestions: suggestions.length > 0 ? `Include ${suggestions.join(', ')}` : null
  }
}

// Validate URL format
export const isValidURL = (url) => {
  const urlSchema = Joi.string().uri()
  const { error } = urlSchema.validate(url)
  return !error
}

// Validate file type
export const isValidFileType = (fileType, allowedTypes) => {
  if (!fileType || !allowedTypes) return false
  
  const types = allowedTypes.split(',').map(type => type.trim())
  return types.some(type => {
    if (type.endsWith('/*')) {
      const baseType = type.slice(0, -2)
      return fileType.startsWith(baseType)
    }
    return fileType === type
  })
}
