/**
 * Validation Utilities - OPTIMIZED
 * Reduced redundancy with shared patterns
 */

// =============================================================================
// Base Validation Patterns
// =============================================================================
const PATTERNS = {
  EMAIL: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  PASSWORD_STRONG: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
  NAME: /^[a-zA-Z\s'-]+$/,
  USERNAME: /^[a-zA-Z0-9_-]+$/,
  PHONE: /^[\+]?[1-9][\d]{0,15}$/,
  URL: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/,
};

const MESSAGES = {
  REQUIRED: (field) => `${field} is required`,
  MIN_LENGTH: (field, min) => `${field} must be at least ${min} characters long`,
  MAX_LENGTH: (field, max) => `${field} cannot exceed ${max} characters`,
  INVALID_FORMAT: (field) => `Please enter a valid ${field.toLowerCase()}`,
  PASSWORD_MATCH: 'Passwords do not match',
  PASSWORD_REQUIREMENTS: 'Password must contain lowercase, uppercase, and number',
};

// =============================================================================
// Validation Rule Builders - REUSABLE
// =============================================================================
const createValidationRule = (field, options = {}) => ({
  required: options.required ? MESSAGES.REQUIRED(field) : false,
  minLength: options.minLength ? {
    value: options.minLength,
    message: MESSAGES.MIN_LENGTH(field, options.minLength)
  } : undefined,
  maxLength: options.maxLength ? {
    value: options.maxLength,
    message: MESSAGES.MAX_LENGTH(field, options.maxLength)
  } : undefined,
  pattern: options.pattern ? {
    value: options.pattern,
    message: options.patternMessage || MESSAGES.INVALID_FORMAT(field)
  } : undefined,
  validate: options.validate,
});

// =============================================================================
// Authentication Validation - OPTIMIZED
// =============================================================================
export const authValidation = {
  email: createValidationRule('Email', {
    required: true,
    pattern: PATTERNS.EMAIL,
    patternMessage: 'Please enter a valid email address'
  }),

  password: createValidationRule('Password', {
    required: true,
    minLength: 8,
    pattern: PATTERNS.PASSWORD_STRONG,
    patternMessage: MESSAGES.PASSWORD_REQUIREMENTS
  }),

  name: createValidationRule('Full name', {
    required: true,
    minLength: 2,
    maxLength: 50,
    pattern: PATTERNS.NAME,
    patternMessage: 'Name can only contain letters, spaces, apostrophes, and hyphens'
  }),

  username: createValidationRule('Username', {
    required: true,
    minLength: 3,
    maxLength: 20,
    pattern: PATTERNS.USERNAME,
    patternMessage: 'Username can only contain letters, numbers, underscores, and hyphens'
  }),

  confirmPassword: (password) => ({
    required: 'Please confirm your password',
    validate: (value) => value === password || MESSAGES.PASSWORD_MATCH,
  }),

  phone: createValidationRule('Phone', {
    pattern: PATTERNS.PHONE,
    patternMessage: 'Please enter a valid phone number'
  }),

  bio: createValidationRule('Bio', {
    maxLength: 250
  }),

  websiteUrl: createValidationRule('URL', {
    pattern: PATTERNS.URL,
    patternMessage: 'Please enter a valid URL'
  }),
};

// =============================================================================
// Chat Validation - OPTIMIZED
// =============================================================================
export const chatValidation = {
  message: {
    required: 'Message cannot be empty',
    maxLength: {
      value: 2000,
      message: 'Message cannot exceed 2000 characters',
    },
    validate: (value) => {
      const trimmed = value?.trim();
      if (!trimmed) return 'Message cannot be empty';
      if (trimmed.length > 2000) return 'Message is too long';
      return true;
    },
  },

  groupName: createValidationRule('Group name', {
    required: true,
    minLength: 2,
    maxLength: 50,
    pattern: PATTERNS.NAME,
    patternMessage: 'Group name can only contain letters, numbers, spaces, apostrophes, and hyphens'
  }),

  groupDescription: createValidationRule('Group description', {
    maxLength: 500
  }),

  searchQuery: createValidationRule('Search query', {
    minLength: 2,
    maxLength: 100
  }),
};

// =============================================================================
// File Validation - CONSOLIDATED
// =============================================================================
export const fileValidation = {
  avatar: {
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    allowedExtensions: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
  },

  image: {
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
    allowedExtensions: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'],
  },

  document: {
    maxSize: 50 * 1024 * 1024, // 50MB
    allowedTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'application/rtf',
    ],
    allowedExtensions: ['pdf', 'doc', 'docx', 'txt', 'rtf'],
  },

  video: {
    maxSize: 100 * 1024 * 1024, // 100MB
    allowedTypes: ['video/mp4', 'video/webm', 'video/ogg', 'video/avi', 'video/quicktime'],
    allowedExtensions: ['mp4', 'webm', 'ogg', 'avi', 'mov'],
  },

  audio: {
    maxSize: 25 * 1024 * 1024, // 25MB
    allowedTypes: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/aac', 'audio/mp4'],
    allowedExtensions: ['mp3', 'wav', 'ogg', 'aac', 'm4a'],
  },
};

// =============================================================================
// Validation Helper Functions - OPTIMIZED
// =============================================================================

/**
 * Validate email address
 */
export const validateEmail = (email) => {
  if (!email || typeof email !== 'string') return false;
  return PATTERNS.EMAIL.test(email.trim());
};

/**
 * Validate password strength - ENHANCED
 */
export const validatePassword = (password) => {
  if (!password || typeof password !== 'string') {
    return { isValid: false, score: 0, feedback: ['Password is required'] };
  }

  const feedback = [];
  let score = 0;

  const checks = [
    { test: password.length >= 8, message: 'Password must be at least 8 characters long', points: 1 },
    { test: password.length >= 12, message: '', points: 1 },
    { test: /[a-z]/.test(password), message: 'Password must contain at least one lowercase letter', points: 1 },
    { test: /[A-Z]/.test(password), message: 'Password must contain at least one uppercase letter', points: 1 },
    { test: /\d/.test(password), message: 'Password must contain at least one number', points: 1 },
    { test: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password), message: 'Consider adding special characters for stronger security', points: 1 },
  ];

  checks.forEach(({ test, message, points }) => {
    if (test) {
      score += points;
    } else if (message) {
      feedback.push(message);
    }
  });

  // Penalty checks
  if (/(.)\1{2,}/.test(password)) {
    feedback.push('Avoid repeated characters');
    score -= 1;
  }
  if (/123|abc|qwe/i.test(password)) {
    feedback.push('Avoid common patterns');
    score -= 1;
  }

  const isValid = feedback.length === 0 && score >= 4;
  const strength = score <= 2 ? 'weak' : score <= 4 ? 'medium' : 'strong';

  return { isValid, score: Math.max(0, score), strength, feedback };
};

/**
 * Validate phone number
 */
export const validatePhone = (phone) => {
  if (!phone || typeof phone !== 'string') return false;
  const cleaned = phone.replace(/\D/g, '');
  return cleaned.length >= 7 && cleaned.length <= 15;
};

/**
 * Validate URL
 */
export const validateUrl = (url) => {
  if (!url || typeof url !== 'string') return false;
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * Validate file - OPTIMIZED
 */
export const validateFile = (file, rules = {}) => {
  if (!file) {
    return { isValid: false, errors: ['File is required'] };
  }

  const errors = [];

  // Size validation
  if (rules.maxSize && file.size > rules.maxSize) {
    const maxSizeMB = (rules.maxSize / (1024 * 1024)).toFixed(1);
    errors.push(`File size must be less than ${maxSizeMB}MB`);
  }

  // Type validation
  if (rules.allowedTypes && !rules.allowedTypes.includes(file.type)) {
    errors.push(`File type ${file.type} is not allowed`);
  }

  // Extension validation
  if (rules.allowedExtensions) {
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (!extension || !rules.allowedExtensions.includes(extension)) {
      errors.push(`File extension .${extension} is not allowed`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    file: {
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: file.lastModified,
    },
  };
};

/**
 * Validate multiple files - OPTIMIZED
 */
export const validateFiles = (files, rules = {}, maxFiles = 10) => {
  if (!files || files.length === 0) {
    return { isValid: false, errors: ['At least one file is required'], validFiles: [] };
  }

  const errors = [];
  const validFiles = [];
  const fileArray = Array.from(files);

  if (fileArray.length > maxFiles) {
    errors.push(`Maximum ${maxFiles} files allowed`);
  }

  fileArray.forEach((file, index) => {
    const validation = validateFile(file, rules);
    if (validation.isValid) {
      validFiles.push(file);
    } else {
      errors.push(`File ${index + 1}: ${validation.errors.join(', ')}`);
    }
  });

  return {
    isValid: errors.length === 0 && validFiles.length > 0,
    errors,
    validFiles,
  };
};

/**
 * Sanitization helpers - OPTIMIZED
 */
export const sanitizers = {
  name: (name) => {
    if (!name || typeof name !== 'string') return '';
    return name.trim().replace(/\s+/g, ' ').replace(/[^\w\s'-]/g, '');
  },

  message: (content) => {
    if (!content || typeof content !== 'string') return '';
    return content.trim().replace(/\n{3,}/g, '\n\n').slice(0, 2000);
  },

  searchQuery: (query) => {
    if (!query || typeof query !== 'string') return '';
    return query.trim().slice(0, 100);
  }
};

/**
 * Check profanity - Basic implementation
 */
export const containsProfanity = (text) => {
  if (!text || typeof text !== 'string') return false;
  const profanityWords = ['spam', 'scam']; // Add actual words as needed
  const lowerText = text.toLowerCase();
  return profanityWords.some(word => lowerText.includes(word));
};

/**
 * Validate form data against schema - OPTIMIZED
 */
export const validateFormData = (data, schema) => {
  const errors = {};
  let isValid = true;

  Object.keys(schema).forEach(field => {
    const rules = schema[field];
    const value = data[field];

    // Required field validation
    if (rules.required && (!value || (typeof value === 'string' && !value.trim()))) {
      errors[field] = typeof rules.required === 'string' ? rules.required : `${field} is required`;
      isValid = false;
      return;
    }

    // Skip other validations if field is empty and not required
    if (!value || (typeof value === 'string' && !value.trim())) return;

    // Pattern validation
    if (rules.pattern && !rules.pattern.value.test(value)) {
      errors[field] = rules.pattern.message;
      isValid = false;
    }

    // Min length validation
    if (rules.minLength && value.length < rules.minLength.value) {
      errors[field] = rules.minLength.message;
      isValid = false;
    }

    // Max length validation
    if (rules.maxLength && value.length > rules.maxLength.value) {
      errors[field] = rules.maxLength.message;
      isValid = false;
    }

    // Custom validation function
    if (rules.validate) {
      const result = rules.validate(value);
      if (result !== true) {
        errors[field] = result;
        isValid = false;
      }
    }
  });

  return { isValid, errors };
};

// =============================================================================
// Export All
// =============================================================================
export default {
  // Validation rules
  authValidation,
  chatValidation,
  fileValidation,
  
  // Helper functions
  validateEmail,
  validatePassword,
  validatePhone,
  validateUrl,
  validateFile,
  validateFiles,
  sanitizers,
  containsProfanity,
  validateFormData,
  
  // Patterns for custom validation
  PATTERNS,
  MESSAGES,
  createValidationRule,
};
