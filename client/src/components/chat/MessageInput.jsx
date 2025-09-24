import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Send, 
  Paperclip, 
  Smile, 
  X, 
  Image, 
  File, 
  Mic,
  MicOff,
  Square
} from 'lucide-react'
import { clsx } from 'clsx'
import Button from '../ui/Button.jsx'
import { useMessageOperations } from '@/hooks/useChat.jsx'
import { useTyping } from '@/hooks/useTyping.jsx'
import { useAuth } from '@/hooks/useAuth.jsx'
import uploadService from '@/services/uploadService.js'
import { useToast } from '../ui/Toast.jsx'
import { EMOJI_REACTIONS, UI_CONFIG } from '@/utils/constants.js'
import { formatFileSize, getFileExtension } from '@/utils/helpers.js'

const MessageInput = ({
  conversationId,
  replyToMessage = null,
  onCancelReply = null,
  disabled = false,
  placeholder = 'Type a message...',
  className = '',
  ...props
}) => {
  const { sendMessage, sending } = useMessageOperations(conversationId)
  const { startTyping, stopTyping } = useTyping(conversationId)
  const { user } = useAuth()
  const toast = useToast()

  // Input state
  const [message, setMessage] = useState('')
  const [attachments, setAttachments] = useState([])
  const [uploadingFiles, setUploadingFiles] = useState([])
  
  // UI state
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [recordingDuration, setRecordingDuration] = useState(0)
  
  // Refs
  const textareaRef = useRef(null)
  const fileInputRef = useRef(null)
  const mediaRecorderRef = useRef(null)
  const recordingTimerRef = useRef(null)
  const emojiPickerRef = useRef(null)

  // Focus textarea on mount
  useEffect(() => {
    if (textareaRef.current && !disabled) {
      textareaRef.current.focus()
    }
  }, [disabled])

  // Handle textarea auto-resize
  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px'
    }
  }, [message])

  // Handle typing indicators
  const handleInputChange = useCallback((value) => {
    setMessage(value)
    
    if (value.trim() && !disabled) {
      startTyping()
    } else {
      stopTyping()
    }
  }, [startTyping, stopTyping, disabled])

  // Handle key press
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }, [])

  // Send message
  const handleSendMessage = useCallback(async () => {
    if (disabled || sending) return

    const trimmedMessage = message.trim()
    if (!trimmedMessage && attachments.length === 0) return

    const messageData = {
      content: trimmedMessage,
      type: 'text',
      replyTo: replyToMessage?._id || null,
      attachments: attachments.map(att => ({
        url: att.url,
        type: att.type,
        name: att.name,
        size: att.size
      }))
    }

    try {
      const result = await sendMessage(messageData)
      
      if (result.success) {
        setMessage('')
        setAttachments([])
        stopTyping()
        onCancelReply?.()
        
        // Focus back to textarea
        setTimeout(() => {
          textareaRef.current?.focus()
        }, 100)
      }
    } catch (error) {
      console.error('Failed to send message:', error)
    }
  }, [message, attachments, replyToMessage, sendMessage, stopTyping, onCancelReply, disabled, sending])

  // Handle file selection
  const handleFileSelect = useCallback(async (files) => {
    const fileArray = Array.from(files)
    
    // Validate files
    const validFiles = []
    for (const file of fileArray) {
      if (file.size > UI_CONFIG.MAX_FILE_SIZE) {
        toast.error(`File "${file.name}" is too large. Maximum size is ${formatFileSize(UI_CONFIG.MAX_FILE_SIZE)}`)
        continue
      }
      
      validFiles.push(file)
    }

    if (validFiles.length === 0) return

    // Upload files
    setUploadingFiles(prev => [...prev, ...validFiles.map(f => ({ file: f, progress: 0 }))])

    try {
      const uploadPromises = validFiles.map(async (file) => {
        const result = await uploadService.uploadAttachment(
          file,
          conversationId,
          (progress) => {
            setUploadingFiles(prev => prev.map(item => 
              item.file === file ? { ...item, progress } : item
            ))
          }
        )

        if (result.success) {
          return {
            url: result.data.url,
            type: file.type.startsWith('image/') ? 'image' : 'file',
            name: file.name,
            size: file.size,
            extension: getFileExtension(file.name)
          }
        }
        
        throw new Error(result.error || 'Upload failed')
      })

      const uploadedFiles = await Promise.all(uploadPromises)
      
      setAttachments(prev => [...prev, ...uploadedFiles])
      toast.success(`${uploadedFiles.length} file(s) uploaded successfully`)
      
    } catch (error) {
      console.error('File upload failed:', error)
      toast.error('Failed to upload some files')
    } finally {
      setUploadingFiles([])
    }
  }, [conversationId, toast])

  // Remove attachment
  const removeAttachment = useCallback((index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index))
  }, [])

  // Handle emoji selection
  const handleEmojiSelect = useCallback((emoji) => {
    const textarea = textareaRef.current
    if (textarea) {
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const newMessage = message.slice(0, start) + emoji + message.slice(end)
      
      setMessage(newMessage)
      
      // Restore cursor position
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + emoji.length
        textarea.focus()
      }, 0)
    }
    
    setShowEmojiPicker(false)
  }, [message])

  // Start voice recording
  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      
      mediaRecorderRef.current = mediaRecorder
      setIsRecording(true)
      setRecordingDuration(0)
      
      // Start recording timer
      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1)
      }, 1000)
      
      const audioChunks = []
      
      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data)
      }
      
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' })
        const audioFile = new File([audioBlob], `voice-message-${Date.now()}.wav`, {
          type: 'audio/wav'
        })
        
        await handleFileSelect([audioFile])
        
        // Cleanup
        stream.getTracks().forEach(track => track.stop())
      }
      
      mediaRecorder.start()
    } catch (error) {
      console.error('Failed to start recording:', error)
      toast.error('Failed to access microphone')
    }
  }, [handleFileSelect, toast])

  // Stop recording
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop()
      mediaRecorderRef.current = null
    }
    
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current)
      recordingTimerRef.current = null
    }
    
    setIsRecording(false)
    setRecordingDuration(0)
  }, [])

  // Cancel recording
  const cancelRecording = useCallback(() => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current = null
    }
    
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current)
      recordingTimerRef.current = null
    }
    
    setIsRecording(false)
    setRecordingDuration(0)
  }, [])

  // Close emoji picker on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
        setShowEmojiPicker(false)
      }
    }

    if (showEmojiPicker) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showEmojiPicker])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopTyping()
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current)
      }
    }
  }, [stopTyping])

  const canSend = (message.trim() || attachments.length > 0) && !disabled && !sending
  const hasContent = message.trim() || attachments.length > 0

  return (
    <div className={clsx('flex flex-col', className)} {...props}>
      {/* Reply Preview */}
      <AnimatePresence>
        {replyToMessage && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="px-4 py-2 bg-gray-800/50 border-l-2 border-cyan-400 mx-4 rounded-t-lg"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-cyan-400 font-medium mb-1">
                  Replying to {replyToMessage.sender.name || 'Unknown'}
                </p>
                <p className="text-sm text-gray-300 truncate">
                  {replyToMessage.content}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onCancelReply}
                className="ml-2 w-6 h-6"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Attachments Preview */}
      <AnimatePresence>
        {attachments.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="px-4 py-2 bg-gray-800/30"
          >
            <div className="flex flex-wrap gap-2">
              {attachments.map((attachment, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 bg-gray-700 rounded-lg p-2 max-w-xs"
                >
                  {attachment.type === 'image' ? (
                    <Image className="w-4 h-4 text-green-400" />
                  ) : (
                    <File className="w-4 h-4 text-blue-400" />
                  )}
                  <span className="text-sm text-gray-300 truncate flex-1">
                    {attachment.name}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeAttachment(index)}
                    className="w-5 h-5"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Uploading Files */}
      <AnimatePresence>
        {uploadingFiles.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="px-4 py-2 bg-gray-800/30"
          >
            <div className="space-y-2">
              {uploadingFiles.map((item, index) => (
                <div key={index} className="flex items-center gap-3">
                  <File className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-300 flex-1 truncate">
                    {item.file.name}
                  </span>
                  <div className="w-24 h-2 bg-gray-600 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-cyan-400 transition-all duration-300"
                      style={{ width: `${item.progress}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-400 w-8">
                    {item.progress}%
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Input Area */}
      <div className="flex items-end gap-2 p-4">
        {/* Attachment Button */}
        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            disabled={disabled || uploadingFiles.length > 0}
            onClick={() => fileInputRef.current?.click()}
            className="w-10 h-10"
          >
            <Paperclip className="w-5 h-5" />
          </Button>
          
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => handleFileSelect(e.target.files)}
            accept={UI_CONFIG.ALLOWED_FILE_TYPES}
          />
        </div>

        {/* Text Input */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={disabled ? 'Cannot send messages' : placeholder}
            disabled={disabled}
            className={clsx(
              'w-full resize-none rounded-lg px-4 py-3 pr-12',
              'glass border border-gray-600/50 text-white placeholder-gray-400',
              'focus:border-cyan-400/70 focus:ring-2 focus:ring-cyan-400/30',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'transition-all duration-200'
            )}
            style={{ minHeight: '48px', maxHeight: '120px' }}
          />
          
          {/* Emoji Button */}
          <div className="absolute right-2 bottom-2">
            <Button
              variant="ghost"
              size="icon"
              disabled={disabled}
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="w-8 h-8"
            >
              <Smile className="w-4 h-4" />
            </Button>
          </div>

          {/* Emoji Picker */}
          <AnimatePresence>
            {showEmojiPicker && (
              <motion.div
                ref={emojiPickerRef}
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="absolute bottom-full right-0 mb-2 glass rounded-lg p-3 border border-gray-600/50 z-50"
              >
                <div className="grid grid-cols-6 gap-2">
                  {EMOJI_REACTIONS.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => handleEmojiSelect(emoji)}
                      className="w-8 h-8 flex items-center justify-center rounded hover:bg-white/10 transition-colors"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Voice/Send Button */}
        <div className="flex gap-2">
          {/* Voice Recording */}
          {!hasContent && !isRecording && (
            <Button
              variant="ghost"
              size="icon"
              disabled={disabled}
              onClick={startRecording}
              className="w-10 h-10"
            >
              <Mic className="w-5 h-5" />
            </Button>
          )}

          {/* Recording Controls */}
          {isRecording && (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 text-red-400">
                <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse" />
                <span className="text-sm font-mono">
                  {Math.floor(recordingDuration / 60)}:{(recordingDuration % 60).toString().padStart(2, '0')}
                </span>
              </div>
              
              <Button
                variant="ghost"
                size="icon"
                onClick={cancelRecording}
                className="w-8 h-8 text-gray-400"
              >
                <X className="w-4 h-4" />
              </Button>
              
              <Button
                variant="primary"
                size="icon"
                onClick={stopRecording}
                className="w-10 h-10"
              >
                <Square className="w-4 h-4" />
              </Button>
            </div>
          )}

          {/* Send Button */}
          {hasContent && !isRecording && (
            <Button
              variant="primary"
              size="icon"
              disabled={!canSend}
              onClick={handleSendMessage}
              loading={sending}
              className="w-10 h-10"
            >
              <Send className="w-5 h-5" />
            </Button>
          )}
        </div>
      </div>

      {/* Recording Indicator */}
      <AnimatePresence>
        {isRecording && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="px-4 pb-2"
          >
            <div className="glass rounded-lg p-3 border border-red-500/30 bg-red-500/10">
              <div className="flex items-center justify-center gap-3 text-red-400">
                <MicOff className="w-4 h-4 animate-pulse" />
                <span className="text-sm font-medium">Recording voice message...</span>
                <span className="text-sm font-mono">
                  {Math.floor(recordingDuration / 60)}:{(recordingDuration % 60).toString().padStart(2, '0')}
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default MessageInput
