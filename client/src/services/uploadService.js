import api, { apiHelpers } from './api.js'
import { API_ENDPOINTS, UI_CONFIG } from '@/utils/constants.js'
import { formatFileSize, getFileExtension, isFileTypeAllowed } from '@/utils/helpers.js'

/**
 * Validate file before upload
 * @param {File} file - File to validate
 * @param {object} options - Validation options
 * @returns {object} Validation result
 */
const validateFile = (file, options = {}) => {
  const {
    maxSize = UI_CONFIG.MAX_FILE_SIZE,
    allowedTypes = UI_CONFIG.ALLOWED_FILE_TYPES,
    allowedExtensions = null,
  } = options
  
  const errors = []
  
  // Check if file exists
  if (!file || !(file instanceof File)) {
    errors.push('Please select a valid file')
    return { isValid: false, errors }
  }
  
  // Check file size
  if (file.size > maxSize) {
    errors.push(`File size must be less than ${formatFileSize(maxSize)}`)
  }
  
  // Check file type
  if (allowedTypes && !isFileTypeAllowed(file.type, allowedTypes)) {
    errors.push('File type not supported')
  }
  
  // Check file extension
  if (allowedExtensions) {
    const extension = getFileExtension(file.name)
    const extensions = allowedExtensions.split(',').map(ext => ext.trim().toLowerCase())
    if (!extensions.includes(extension)) {
      errors.push(`File extension must be one of: ${allowedExtensions}`)
    }
  }
  
  // Check file name length
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

/**
 * Upload file with progress tracking
 * @param {File} file - File to upload
 * @param {object} options - Upload options
 * @returns {Promise<object>} Upload result
 */
export const uploadFile = async (file, options = {}) => {
  const {
    endpoint = API_ENDPOINTS.UPLOAD.FILE,
    onProgress = null,
    additionalData = {},
    validateOptions = {},
  } = options
  
  try {
    // Validate file
    const validation = validateFile(file, validateOptions)
    if (!validation.isValid) {
      throw new Error(validation.errors[0])
    }
    
    // Create form data
    const formData = new FormData()
    formData.append('file', file)
    
    // Add additional data
    Object.keys(additionalData).forEach(key => {
      const value = additionalData[key]
      if (value !== null && value !== undefined) {
        formData.append(key, typeof value === 'object' ? JSON.stringify(value) : value)
      }
    })
    
    // Create request config with progress tracking
    const config = {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 300000, // 5 minutes for large files
    }
    
    // Add progress tracking if callback provided
    if (onProgress && typeof onProgress === 'function') {
      config.onUploadProgress = (progressEvent) => {
        const progress = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        )
        onProgress(progress, progressEvent)
      }
    }
    
    const response = await api.post(endpoint, formData, config)
    return apiHelpers.handleSuccess(response)
  } catch (error) {
    throw apiHelpers.handleError(error)
  }
}

/**
 * Upload avatar image
 * @param {File} file - Image file
 * @param {Function} onProgress - Progress callback
 * @returns {Promise<object>} Upload result
 */
export const uploadAvatar = async (file, onProgress = null) => {
  return uploadFile(file, {
    endpoint: API_ENDPOINTS.UPLOAD.AVATAR,
    onProgress,
    validateOptions: {
      maxSize: 5 * 1024 * 1024, // 5MB
      allowedTypes: 'image/*',
      allowedExtensions: 'jpg,jpeg,png,gif,webp',
    },
  })
}

/**
 * Upload chat attachment
 * @param {File} file - Attachment file
 * @param {string} conversationId - Conversation ID
 * @param {Function} onProgress - Progress callback
 * @returns {Promise<object>} Upload result
 */
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

/**
 * Upload multiple files
 * @param {Array<File>} files - Files to upload
 * @param {object} options - Upload options
 * @returns {Promise<Array>} Upload results
 */
export const uploadMultipleFiles = async (files, options = {}) => {
  const {
    maxConcurrent = 3,
    onFileProgress = null,
    onOverallProgress = null,
  } = options
  
  if (!Array.isArray(files) || files.length === 0) {
    throw new Error('Please select at least one file')
  }
  
  const results = []
  const totalFiles = files.length
  let completedFiles = 0
  
  // Process files in batches to limit concurrent uploads
  for (let i = 0; i < files.length; i += maxConcurrent) {
    const batch = files.slice(i, i + maxConcurrent)
    
    const batchPromises = batch.map(async (file, index) => {
      try {
        const globalIndex = i + index
        
        const result = await uploadFile(file, {
          ...options,
          onProgress: onFileProgress ? (progress, event) => {
            onFileProgress(progress, event, globalIndex, file)
          } : null,
        })
        
        completedFiles++
        
        // Report overall progress
        if (onOverallProgress) {
          const overallProgress = Math.round((completedFiles / totalFiles) * 100)
          onOverallProgress(overallProgress, completedFiles, totalFiles)
        }
        
        return { success: true, data: result, file, index: globalIndex }
      } catch (error) {
        completedFiles++
        
        // Report overall progress even on error
        if (onOverallProgress) {
          const overallProgress = Math.round((completedFiles / totalFiles) * 100)
          onOverallProgress(overallProgress, completedFiles, totalFiles)
        }
        
        return { success: false, error, file, index: globalIndex }
      }
    })
    
    const batchResults = await Promise.all(batchPromises)
    results.push(...batchResults)
  }
  
  return results
}

/**
 * Create file preview URL
 * @param {File} file - File to preview
 * @returns {string|null} Preview URL
 */
export const createFilePreview = (file) => {
  if (!file || !(file instanceof File)) return null
  
  // Only create preview for images
  if (!file.type.startsWith('image/')) return null
  
  try {
    return URL.createObjectURL(file)
  } catch (error) {
    console.error('Failed to create file preview:', error)
    return null
  }
}

/**
 * Revoke file preview URL
 * @param {string} url - Preview URL to revoke
 */
export const revokeFilePreview = (url) => {
  if (url) {
    try {
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Failed to revoke file preview:', error)
    }
  }
}

/**
 * Get file type category
 * @param {string} mimeType - File MIME type
 * @returns {string} File category
 */
export const getFileCategory = (mimeType) => {
  if (!mimeType) return 'unknown'
  
  if (mimeType.startsWith('image/')) return 'image'
  if (mimeType.startsWith('video/')) return 'video'
  if (mimeType.startsWith('audio/')) return 'audio'
  if (mimeType.includes('pdf')) return 'pdf'
  if (mimeType.includes('document') || mimeType.includes('word')) return 'document'
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return 'spreadsheet'
  if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return 'presentation'
  if (mimeType.includes('text')) return 'text'
  if (mimeType.includes('zip') || mimeType.includes('archive')) return 'archive'
  
  return 'file'
}

/**
 * Format file for display
 * @param {File|object} file - File object
 * @returns {object} Formatted file info
 */
export const formatFileInfo = (file) => {
  if (!file) return null
  
  const name = file.name || 'Unknown file'
  const size = file.size || 0
  const type = file.type || 'application/octet-stream'
  
  return {
    name,
    size,
    sizeFormatted: formatFileSize(size),
    type,
    extension: getFileExtension(name),
    category: getFileCategory(type),
    isImage: type.startsWith('image/'),
    isVideo: type.startsWith('video/'),
    isAudio: type.startsWith('audio/'),
    isPdf: type.includes('pdf'),
    lastModified: file.lastModified ? new Date(file.lastModified) : null,
  }
}

/**
 * Download file from URL
 * @param {string} url - File URL
 * @param {string} filename - Desired filename
 */
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
    // Fallback: open in new tab
    window.open(url, '_blank')
  }
}

// Export upload service object
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
