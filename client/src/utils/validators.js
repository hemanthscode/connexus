import Joi from 'joi'
import { VALIDATION_RULES } from './constants.js'

// Base validation messages
const MESSAGES = {
  'string.empty': 'This field is required',
  'string.min': 'Must be at least {#limit} characters',
  'string.max': 'Must be less than {#limit} characters',
  'string.email': 'Please enter a valid email address',
  'string.uri': 'Please enter a valid URL',
  'any.required': 'This field is required',
  'any.only': 'Invalid value selected',
  'array.min': 'At least {#limit} item(s) required',
  'array.max': 'Maximum {#limit} item(s) allowed',
}

// Common field schemas
const commonFields = {
  email: () => Joi.string()
    .email({ tlds: { allow: false } })
    .max(VALIDATION_RULES.EMAIL.MAX_LENGTH)
    .trim()
    .lowercase(),
    
  password: (minLength = VALIDATION_RULES.PASSWORD.MIN_LENGTH) => Joi.string()
    .min(minLength)
    .max(VALIDATION_RULES.PASSWORD.MAX_LENGTH),
    
  name: () => Joi.string()
    .min(VALIDATION_RULES.USERNAME.MIN_LENGTH)
    .max(VALIDATION_RULES.USERNAME.MAX_LENGTH)
    .trim(),
    
  optionalUrl: () => Joi.string()
    .uri()
    .allow(null, ''),
    
  messageContent: () => Joi.string()
    .min(1)
    .max(VALIDATION_RULES.MESSAGE.MAX_LENGTH)
    .trim(),
}

// Authentication validation schemas
export const authValidation = {
  register: Joi.object({
    name: commonFields.name().required().messages(MESSAGES),
    email: commonFields.email().required().messages(MESSAGES),
    password: commonFields.password().required().messages({
      ...MESSAGES,
      'string.min': 'Password must be at least 6 characters',
    }),
    confirmPassword: Joi.string()
      .valid(Joi.ref('password'))
      .required()
      .messages({
        ...MESSAGES,
        'any.only': 'Passwords do not match',
      }),
  }),

  login: Joi.object({
    email: commonFields.email().required().messages(MESSAGES),
    password: commonFields.password().required().messages(MESSAGES),
  }),

  changePassword: Joi.object({
    currentPassword: Joi.string().required().messages({
      ...MESSAGES,
      'string.empty': 'Current password is required',
    }),
    newPassword: commonFields.password().required().messages({
      ...MESSAGES,
      'string.min': 'New password must be at least 6 characters',
    }),
    confirmNewPassword: Joi.string()
      .valid(Joi.ref('newPassword'))
      .required()
      .messages({
        ...MESSAGES,
        'any.only': 'New passwords do not match',
      }),
  }),
}

// User profile validation schemas
export const userValidation = {
  updateProfile: Joi.object({
    name: commonFields.name().optional().messages(MESSAGES),
    email: commonFields.email().optional().messages(MESSAGES),
    bio: Joi.string()
      .max(VALIDATION_RULES.BIO.MAX_LENGTH)
      .trim()
      .allow('')
      .optional()
      .messages(MESSAGES),
    location: Joi.string()
      .max(VALIDATION_RULES.LOCATION.MAX_LENGTH)
      .trim()
      .allow('')
      .optional()
      .messages(MESSAGES),
    avatar: commonFields.optionalUrl().optional().messages(MESSAGES),
    socialLinks: Joi.object()
      .pattern(Joi.string(), Joi.string().uri())
      .optional()
      .messages(MESSAGES),
  }),

  searchUsers: Joi.object({
    query: Joi.string()
      .min(2)
      .max(100)
      .trim()
      .required()
      .messages({
        ...MESSAGES,
        'string.min': 'Search query must be at least 2 characters',
      }),
    limit: Joi.number()
      .integer()
      .min(1)
      .max(50)
      .default(10)
      .optional(),
  }),
}

// Chat validation schemas
export const chatValidation = {
  sendMessage: Joi.object({
    conversationId: Joi.string().required().messages({
      ...MESSAGES,
      'string.empty': 'Conversation ID is required',
    }),
    content: commonFields.messageContent().required().messages({
      ...MESSAGES,
      'string.min': 'Message cannot be empty',
      'string.max': `Message must be less than ${VALIDATION_RULES.MESSAGE.MAX_LENGTH} characters`,
    }),
    type: Joi.string()
      .valid('text', 'image', 'file')
      .default('text')
      .optional(),
    replyTo: Joi.string().allow(null).optional(),
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
        ...MESSAGES,
        'array.max': 'Maximum 5 attachments allowed',
      }),
  }),

  editMessage: Joi.object({
    messageId: Joi.string().required().messages({
      ...MESSAGES,
      'string.empty': 'Message ID is required',
    }),
    newContent: commonFields.messageContent().required().messages({
      ...MESSAGES,
      'string.min': 'Message cannot be empty',
    }),
  }),

  createGroup: Joi.object({
    name: Joi.string()
      .min(VALIDATION_RULES.GROUP_NAME.MIN_LENGTH)
      .max(VALIDATION_RULES.GROUP_NAME.MAX_LENGTH)
      .trim()
      .required()
      .messages({
        ...MESSAGES,
        'string.min': 'Group name is required',
      }),
    description: Joi.string()
      .max(VALIDATION_RULES.GROUP_DESCRIPTION.MAX_LENGTH)
      .trim()
      .allow('')
      .optional()
      .messages(MESSAGES),
    participants: Joi.array()
      .items(Joi.string())
      .min(1)
      .max(100)
      .default([])
      .optional()
      .messages(MESSAGES),
    avatar: commonFields.optionalUrl().optional().messages(MESSAGES),
  }),

  updateGroup: Joi.object({
    name: Joi.string()
      .min(VALIDATION_RULES.GROUP_NAME.MIN_LENGTH)
      .max(VALIDATION_RULES.GROUP_NAME.MAX_LENGTH)
      .trim()
      .optional()
      .messages(MESSAGES),
    description: Joi.string()
      .max(VALIDATION_RULES.GROUP_DESCRIPTION.MAX_LENGTH)
      .trim()
      .allow('')
      .optional()
      .messages(MESSAGES),
    avatar: commonFields.optionalUrl().optional().messages(MESSAGES),
  }),

  addParticipants: Joi.object({
    participants: Joi.array()
      .items(Joi.string())
      .min(1)
      .max(20)
      .required()
      .messages({
        ...MESSAGES,
        'array.min': 'At least one participant is required',
        'array.max': 'Maximum 20 participants can be added at once',
      }),
  }),

  changeRole: Joi.object({
    participantId: Joi.string().required().messages({
      ...MESSAGES,
      'string.empty': 'Participant ID is required',
    }),
    role: Joi.string()
      .valid('admin', 'moderator', 'member')
      .required()
      .messages({
        ...MESSAGES,
        'any.only': 'Invalid role specified',
      }),
  }),

  createDirectConversation: Joi.object({
    participantId: Joi.string().required().messages({
      ...MESSAGES,
      'string.empty': 'Participant ID is required',
    }),
  }),
}

// File validation schemas
export const fileValidation = {
  uploadFile: Joi.object({
    file: Joi.object({
      name: Joi.string().required(),
      size: Joi.number()
        .integer()
        .min(1)
        .max(10 * 1024 * 1024) // 10MB
        .required(),
      type: Joi.string().required(),
    }).required().messages({
      ...MESSAGES,
      'object.base': 'File is required',
      'number.max': 'File size must be less than 10MB',
    }),
  }),
}

// Main validation function
export const validateData = (schema, data) => {
  const { error, value } = schema.validate(data, {
    abortEarly: false,
    allowUnknown: false,
    stripUnknown: true,
  })
  
  if (error) {
    const errors = {}
    error.details.forEach(detail => {
      errors[detail.path.join('.')] = detail.message
    })
    return { isValid: false, errors, data: null }
  }
  
  return { isValid: true, errors: null, data: value }
}

// Quick validation helpers
export const isValidEmail = (email) => {
  const { error } = commonFields.email().validate(email)
  return !error
}

export const isValidURL = (url) => {
  const { error } = Joi.string().uri().validate(url)
  return !error
}

export const isValidFileType = (fileType, allowedTypes) => {
  if (!fileType || !allowedTypes) return false
  const types = allowedTypes.split(',').map(t => t.trim())
  return types.some(type => 
    type.endsWith('/*') ? fileType.startsWith(type.slice(0, -2)) : fileType === type
  )
}

// Password strength validation
export const validatePasswordStrength = (password) => {
  if (!password || password.length < 6) {
    return { isStrong: false, message: 'Password must be at least 6 characters' }
  }
  
  const checks = [
    { test: /[a-z]/, name: 'lowercase letters' },
    { test: /[A-Z]/, name: 'uppercase letters' },
    { test: /\d/, name: 'numbers' },
    { test: /[!@#$%^&*(),.?":{}|<>]/, name: 'special characters' },
    { test: /.{8,}/, name: 'at least 8 characters' },
  ]
  
  const passed = checks.filter(check => check.test.test(password))
  const failed = checks.filter(check => !check.test.test(password))
  
  const strengthLevels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong']
  const level = strengthLevels[Math.min(passed.length, 4)]
  
  return {
    isStrong: passed.length >= 3,
    strength: level,
    score: passed.length,
    suggestions: failed.length > 0 ? `Include ${failed.map(f => f.name).join(', ')}` : null
  }
}
