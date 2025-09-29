import api, { apiHelpers } from './api.js'
import { API_ENDPOINTS, UI_CONFIG } from '@/utils/constants.js'
import { formatFileSize, getFileExtension, isFileTypeAllowed } from '@/utils/helpers.js'

// Configuration constants
const UPLOAD_CONFIG = {
  DEFAULT_TIMEOUT: 300000, // 5 minutes
  MAX_CONCURRENT: 3,
  CHUNK_SIZE: 1024 * 1024, // 1MB chunks for progress
  ALLOWED_EXTENSIONS: {
    AVATAR: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    GENERAL: null // Use UI_CONFIG.ALLOWED_FILE_TYPES
  }
}

const FILE_CATEGORIES = {
  image: (type) => type.startsWith('image/'),
  video: (type) => type.startsWith('video/'),
  audio: (type) => type.startsWith('audio/'),
  pdf: (type) => type.includes('pdf'),
  document: (type) => type.includes('document') || type.includes('word') || type.includes('text'),
  spreadsheet: (type) => type.includes('spreadsheet') || type.includes('excel'),
  presentation: (type) => type.includes('presentation') || type.includes('powerpoint'),
  archive: (type) => type.includes('zip') || type.includes('archive'),
  default: () => 'file'
}

// Utility functions
const validateFile = (file, options = {}) => {
  const {
    maxSize = UI_CONFIG.MAX_FILE_SIZE,
    allowedTypes = UI_CONFIG.ALLOWED_FILE_TYPES,
    allowedExtensions = null,
  } = options
  
  const errors = []
  
  if (!file || !(file instanceof File)) {
    errors.push('Please select a valid file')
    return { isValid: false, errors }
  }
  
  if (file.size > maxSize) {
    errors.push(`File size must be less than ${formatFileSize(maxSize)}`)
  }
  
  if (allowedTypes && !isFileTypeAllowed(file.type, allowedTypes)) {
    errors.push('File type not supported')
  }
  
  if (allowedExtensions) {
    const extension = getFileExtension(file.name).toLowerCase()
    const extensions = allowedExtensions.map(ext => ext.toLowerCase())
    if (!extensions.includes(extension)) {
      errors.push(`File extension must be one of: ${allowedExtensions.join(', ')}`)
    }
  }
  
  if (file.name.length > 255) {
    errors.push('File name is too long')
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    fileInfo: {
      name: file.name,
      size: file.size,
      type: file.type,
      extension: getFileExtension(file.name),
      sizeFormatted: formatFileSize(file.size),
    }
  }
}

const getFileCategory = (mimeType) => {
  if (!mimeType) return 'unknown'
  
  for (const [category, checkFn] of Object.entries(FILE_CATEGORIES)) {
    if (category !== 'default' && checkFn(mimeType)) {
      return category
    }
  }
  
  return FILE_CATEGORIES.default()
}

// Core upload function
export const uploadFile = async (file, options = {}) => {
  const {
    endpoint = API_ENDPOINTS.UPLOAD.FILE,
    onProgress = null,
    additionalData = {},
    validateOptions = {},
  } = options
  
  try {
    const validation = validateFile(file, validateOptions)
    if (!validation.isValid) {
      throw new Error(validation.errors[0])
    }
    
    const formData = new FormData()
    formData.append('file', file)
    
    // Add additional data
    Object.entries(additionalData).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        formData.append(key, typeof value === 'object' ? JSON.stringify(value) : value)
      }
    })
    
    const config = {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: UPLOAD_CONFIG.DEFAULT_TIMEOUT,
    }
    
    if (onProgress && typeof onProgress === 'function') {
      config.onUploadProgress = (progressEvent) => {
        const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total)
        onProgress(progress, progressEvent)
      }
    }
    
    const response = await api.post(endpoint, formData, config)
    return apiHelpers.handleSuccess(response)
  } catch (error) {
    throw apiHelpers.handleError(error)
  }
}

// Specialized upload functions
export const uploadAvatar = async (file, onProgress = null) => {
  return uploadFile(file, {
    endpoint: API_ENDPOINTS.UPLOAD.AVATAR,
    onProgress,
    validateOptions: {
      maxSize: 5 * 1024 * 1024, // 5MB
      allowedTypes: 'image/*',
      allowedExtensions: UPLOAD_CONFIG.ALLOWED_EXTENSIONS.AVATAR,
    },
  })
}

export const uploadAttachment = async (file, conversationId, onProgress = null) => {
  return uploadFile(file, {
    endpoint: API_ENDPOINTS.UPLOAD.ATTACHMENT,
    onProgress,
    additionalData: { conversationId },
    validateOptions: {
      maxSize: UI_CONFIG.MAX_FILE_SIZE,
      allowedTypes: UI_CONFIG.ALLOWED_FILE_TYPES,
    },
  })
}

// Multiple file upload with concurrency control
export const uploadMultipleFiles = async (files, options = {}) => {
  const {
    maxConcurrent = UPLOAD_CONFIG.MAX_CONCURRENT,
    onFileProgress = null,
    onOverallProgress = null,
  } = options
  
  if (!Array.isArray(files) || files.length === 0) {
    throw new Error('Please select at least one file')
  }
  
  const results = []
  const totalFiles = files.length
  let completedFiles = 0
  
  // Process files in batches
  for (let i = 0; i < files.length; i += maxConcurrent) {
    const batch = files.slice(i, i + maxConcurrent)
    
    const batchPromises = batch.map(async (file, index) => {
      const globalIndex = i + index
      
      try {
        const result = await uploadFile(file, {
          ...options,
          onProgress: onFileProgress ? (progress, event) => {
            onFileProgress(progress, event, globalIndex, file)
          } : null,
        })
        
        completedFiles++
        onOverallProgress?.(Math.round((completedFiles / totalFiles) * 100), completedFiles, totalFiles)
        
        return { success: true, data: result, file, index: globalIndex }
      } catch (error) {
        completedFiles++
        onOverallProgress?.(Math.round((completedFiles / totalFiles) * 100), completedFiles, totalFiles)
        
        return { success: false, error, file, index: globalIndex }
      }
    })
    
    const batchResults = await Promise.all(batchPromises)
    results.push(...batchResults)
  }
  
  return results
}

// File management utilities
export const createFilePreview = (file) => {
  if (!file || !(file instanceof File) || !file.type.startsWith('image/')) {
    return null
  }
  
  try {
    return URL.createObjectURL(file)
  } catch (error) {
    console.error('Failed to create file preview:', error)
    return null
  }
}

export const revokeFilePreview = (url) => {
  if (url) {
    try {
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Failed to revoke file preview:', error)
    }
  }
}

export const formatFileInfo = (file) => {
  if (!file) return null
  
  const name = file.name || 'Unknown file'
  const size = file.size || 0
  const type = file.type || 'application/octet-stream'
  const category = getFileCategory(type)
  
  return {
    name,
    size,
    sizeFormatted: formatFileSize(size),
    type,
    extension: getFileExtension(name),
    category,
    isImage: category === 'image',
    isVideo: category === 'video',
    isAudio: category === 'audio',
    isPdf: category === 'pdf',
    lastModified: file.lastModified ? new Date(file.lastModified) : null,
  }
}

export const downloadFile = (url, filename) => {
  try {
    const link = document.createElement('a')
    link.href = url
    link.download = filename || 'download'
    link.target = '_blank'
    
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  } catch (error) {
    console.error('Failed to download file:', error)
    window.open(url, '_blank')
  }
}

// Export consolidated service
export default {
  uploadFile,
  uploadAvatar,
  uploadAttachment,
  uploadMultipleFiles,
  createFilePreview,
  revokeFilePreview,
  getFileCategory,
  formatFileInfo,
  downloadFile,
  validateFile,
}
