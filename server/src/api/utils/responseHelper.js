import { STATUS_CODES } from '../constants/index.js';

/**
 * Send standardized success response
 */
export const sendSuccess = (res, message, data = null, statusCode = STATUS_CODES.OK) => {
  const response = { success: true, message };
  if (data !== null) response.data = data;
  return res.status(statusCode).json(response);
};

/**
 * Send standardized error response
 */
export const sendError = (res, message, statusCode = STATUS_CODES.INTERNAL_SERVER_ERROR) => {
  return res.status(statusCode).json({ success: false, message });
};

/**
 * Handle validation error response
 */
export const sendValidationError = (res, error) => {
  return sendError(res, error.details[0].message, STATUS_CODES.BAD_REQUEST);
};

/**
 * Handle service error response with proper status code handling
 */
export const sendServiceError = (res, error, defaultMessage, defaultStatus = STATUS_CODES.INTERNAL_SERVER_ERROR) => {
  console.error(error);
  
  if (error.statusCode) {
    return sendError(res, error.message, error.statusCode);
  }
  
  return sendError(res, defaultMessage, defaultStatus);
};

export default {
  sendSuccess,
  sendError,
  sendValidationError,
  sendServiceError,
};
