import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import User from '../core/models/User.js';

/**
 * Middleware for Socket.IO to authenticate user by JWT token.
 * Attaches user info to socket if valid.
 */
export const authenticateSocket = async (socket, next) => {
  try {
    let token =
      socket.handshake.auth.token ||
      socket.handshake.headers.authorization ||
      socket.handshake.query.token;

    if (token?.startsWith('Bearer ')) token = token.slice(7);

    if (!token) return next(new Error('Authentication error: No token provided'));

    const decoded = jwt.verify(token, config.JWT_SECRET);

    const user = await User.findById(decoded.userId).select('-password');

    if (!user || !user.isActive) return next(new Error('Authentication error: Invalid user'));

    socket.userId = user._id.toString();
    socket.user = user;

    next();
  } catch (error) {
    next(new Error('Authentication error: ' + error.message));
  }
};

export default { authenticateSocket };
