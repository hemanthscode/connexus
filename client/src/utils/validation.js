/**
 * Validation Utilities
 * Comprehensive validation rules and helpers
 */

// =============================================================================
// Validation Rules for React Hook Form
// =============================================================================

export const authValidation = {
  email: {
    required: 'Email address is required',
    pattern: {
      value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
      message: 'Please enter a valid email address',
    },
    maxLength: {
      value: 254,
      message: 'Email address is too long',
    },
  },

  password: {
    required: 'Password is required',
    minLength: {
      value: 8,
      message: 'Password must be at least 8 characters long',
    },
    maxLength: {
      value: 128,
      message: 'Password is too long',
    },
    pattern: {
      value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      message: 'Password must contain at least one lowercase letter, one uppercase letter, and one number',
    },
  },

  name: {
    required: 'Full name is required',
    minLength: {
      value: 2,
      message: 'Name must be at least 2 characters long',
    },
    maxLength: {
      value: 50,
      message: 'Name cannot exceed 50 characters',
    },
    pattern: {
      value: /^[a-zA-Z\s'-]+$/,
      message: 'Name can only contain letters, spaces, apostrophes, and hyphens',
    },
  },

  confirmPassword: (password) => ({
    required: 'Please confirm your password',
    validate: (value) => {
      if (!value) return 'Password confirmation is required';
      if (value !== password) return 'Passwords do not match';
      return true;
    },
  }),

  phone: {
    pattern: {
      value: /^[\+]?[1-9][\d]{0,15}$/,
      message: 'Please enter a valid phone number',
    },
  },

  username: {
    required: 'Username is required',
    minLength: {
      value: 3,
      message: 'Username must be at least 3 characters long',
    },
    maxLength: {
      value: 20,
      message: 'Username cannot exceed 20 characters',
    },
    pattern: {
      value: /^[a-zA-Z0-9_-]+$/,
      message: 'Username can only contain letters, numbers, underscores, and hyphens',
    },
  },

  bio: {
    maxLength: {
      value: 250,
      message: 'Bio cannot exceed 250 characters',
    },
  },

  websiteUrl: {
    pattern: {
      value: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/,
      message: 'Please enter a valid URL',
    },
  },
};

// =============================================================================
// Chat & Message Validation
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

  groupName: {
    required: 'Group name is required',
    minLength: {
      value: 2,
      message: 'Group name must be at least 2 characters long',
    },
    maxLength: {
      value: 50,
      message: 'Group name cannot exceed 50 characters',
    },
    pattern: {
      value: /^[a-zA-Z0-9\s'-]+$/,
      message: 'Group name can only contain letters, numbers, spaces, apostrophes, and hyphens',
    },
  },

  groupDescription: {
    maxLength: {
      value: 200,
      message: 'Group description cannot exceed 200 characters',
    },
  },

  searchQuery: {
    minLength: {
      value: 2,
      message: 'Search query must be at least 2 characters long',
    },
    maxLength: {
      value: 100,
      message: 'Search query is too long',
    },
  },
};

// =============================================================================
// File Validation
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
// Validation Helper Functions
// =============================================================================

/**
 * Validate email address
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid
 */
export const validateEmail = (email) => {
  if (!email || typeof email !== 'string') return false;
  return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email.trim());
};

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {Object} Validation result with score and feedback
 */
export const validatePassword = (password) => {
  if (!password || typeof password !== 'string') {
    return { isValid: false, score: 0, feedback: ['Password is required'] };
  }

  const feedback = [];
  let score = 0;

  // Length check
  if (password.length < 8) {
    feedback.push('Password must be at least 8 characters long');
  } else {
    score += 1;
    if (password.length >= 12) score += 1;
  }

  // Lowercase letter
  if (!/[a-z]/.test(password)) {
    feedback.push('Password must contain at least one lowercase letter');
  } else {
    score += 1;
  }

  // Uppercase letter
  if (!/[A-Z]/.test(password)) {
    feedback.push('Password must contain at least one uppercase letter');
  } else {
    score += 1;
  }

  // Number
  if (!/\d/.test(password)) {
    feedback.push('Password must contain at least one number');
  } else {
    score += 1;
  }

  // Special character
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    feedback.push('Consider adding special characters for stronger security');
  } else {
    score += 1;
  }

  // Common patterns
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

  return {
    isValid,
    score: Math.max(0, score),
    strength,
    feedback,
  };
};

/**
 * Validate phone number
 * @param {string} phone - Phone number to validate
 * @returns {boolean} True if valid
 */
export const validatePhone = (phone) => {
  if (!phone || typeof phone !== 'string') return false;
  const cleaned = phone.replace(/\D/g, '');
  return cleaned.length >= 7 && cleaned.length <= 15;
};

/**
 * Validate URL
 * @param {string} url - URL to validate
 * @returns {boolean} True if valid
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
 * Validate file
 * @param {File} file - File to validate
 * @param {Object} rules - Validation rules
 * @returns {Object} Validation result
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
 * Validate multiple files
 * @param {FileList|Array} files - Files to validate
 * @param {Object} rules - Validation rules
 * @param {number} maxFiles - Maximum number of files
 * @returns {Object} Validation result
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
 * Sanitize name (remove extra whitespace, special characters)
 * @param {string} name - Name to sanitize
 * @returns {string} Sanitized name
 */
export const sanitizeName = (name) => {
  if (!name || typeof name !== 'string') return '';
  
  return name
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s'-]/g, '');
};

/**
 * Sanitize message content
 * @param {string} content - Content to sanitize
 * @returns {string} Sanitized content
 */
export const sanitizeMessage = (content) => {
  if (!content || typeof content !== 'string') return '';
  
  return content
    .trim()
    .replace(/\n{3,}/g, '\n\n') // Limit consecutive line breaks
    .slice(0, 2000); // Enforce length limit
};

/**
 * Check if string contains profanity (basic implementation)
 * @param {string} text - Text to check
 * @returns {boolean} True if contains profanity
 */
export const containsProfanity = (text) => {
  if (!text || typeof text !== 'string') return false;
  
  // Basic profanity filter - in production, use a proper service
  const profanityWords = ['spam', 'scam']; // Add actual words as needed
  const lowerText = text.toLowerCase();
  
  return profanityWords.some(word => lowerText.includes(word));
};

/**
 * Validate form data against schema
 * @param {Object} data - Form data to validate
 * @param {Object} schema - Validation schema
 * @returns {Object} Validation result
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
  sanitizeName,
  sanitizeMessage,
  containsProfanity,
  validateFormData,
};
