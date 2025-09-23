import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  useCallback,
} from "react";
import { initSocket, disconnectSocket } from "../services/socketService.js";
import { useAuth } from "./AuthContext.jsx";

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);

  // Online users tracked by userId string in a Set for O(1) membership
  const [onlineUsers, setOnlineUsers] = useState(new Set());

  // Typing users tracked by conversationId -> Set of user names
  const [typingUsers, setTypingUsers] = useState({});

  // Conversations joined by socket (ids)
  const [activeConversations, setActiveConversations] = useState(new Set());

  // Message updates: list of { conversationId, message } objects (can be merged by consumer)
  const [messageUpdates, setMessageUpdates] = useState([]);

  // Socket reference for preserving across re-renders
  const socketRef = useRef(null);

  useEffect(() => {
    if (user && !socketRef.current) {
      const token = localStorage.getItem("connexus_token");
      const newSocket = initSocket(token, import.meta.env.VITE_SOCKET_URL);

      setSocket(newSocket);
      socketRef.current = newSocket;

      // Socket event handlers
      const onConnect = () => setConnected(true);
      const onDisconnect = () => setConnected(false);

      const onCurrentOnlineUsers = (users) => {
        setOnlineUsers(new Set(users.map((u) => u.userId)));
      };

      const onUserOnline = ({ userId }) => {
        setOnlineUsers((prev) => new Set(prev).add(userId));
      };

      const onUserOffline = ({ userId }) => {
        setOnlineUsers((prev) => {
          const newSet = new Set(prev);
          newSet.delete(userId);
          return newSet;
        });
      };

      const onUserTyping = ({ conversationId, user }) => {
        if (!conversationId || !user?.name) return;
        setTypingUsers((prev) => {
          const newTyping = { ...prev };
          if (!newTyping[conversationId]) newTyping[conversationId] = new Set();
          newTyping[conversationId].add(user.name);
          return newTyping;
        });
      };

      const onUserStopTyping = ({ conversationId, user }) => {
        if (!conversationId || !user?.name) return;
        setTypingUsers((prev) => {
          const newTyping = { ...prev };
          if (newTyping[conversationId]) {
            newTyping[conversationId].delete(user.name);
            if (newTyping[conversationId].size === 0)
              delete newTyping[conversationId];
          }
          return newTyping;
        });
      };

      const onJoinedConversation = ({ conversationId }) => {
        setActiveConversations((prev) => new Set(prev).add(conversationId));
      };

      const onLeftConversation = ({ conversationId }) => {
        setActiveConversations((prev) => {
          const newSet = new Set(prev);
          newSet.delete(conversationId);
          return newSet;
        });
      };

      const onNewMessage = ({ conversationId, message }) => {
        setMessageUpdates((prev) => {
          // Replace any existing with same message._id or add new
          const filtered = prev.filter((m) => m.message._id !== message._id);
          return [...filtered, { conversationId, message }];
        });
      };

      const onMessageRead = ({ conversationId, userId }) => {
        // Could update read status UI globally or per conversation here if needed
      };

      const onReactionUpdated = ({ messageId, reactions }) => {
        setMessageUpdates((prev) =>
          prev.map((mu) =>
            mu.message._id === messageId
              ? { ...mu, message: { ...mu.message, reactions } }
              : mu
          )
        );
      };

      // Register all event handlers
      newSocket.on("connect", onConnect);
      newSocket.on("disconnect", onDisconnect);
      newSocket.on("current_online_users", onCurrentOnlineUsers);
      newSocket.on("user_online", onUserOnline);
      newSocket.on("user_offline", onUserOffline);
      newSocket.on("user_typing", onUserTyping);
      newSocket.on("user_stop_typing", onUserStopTyping);
      newSocket.on("joined_conversation", onJoinedConversation);
      newSocket.on("left_conversation", onLeftConversation);
      newSocket.on("new_message", onNewMessage);
      newSocket.on("message_read", onMessageRead);
      newSocket.on("reaction_updated", onReactionUpdated);

      return () => {
        // Cleanup event handlers on unmount or user logout
        newSocket.off("connect", onConnect);
        newSocket.off("disconnect", onDisconnect);
        newSocket.off("current_online_users", onCurrentOnlineUsers);
        newSocket.off("user_online", onUserOnline);
        newSocket.off("user_offline", onUserOffline);
        newSocket.off("user_typing", onUserTyping);
        newSocket.off("user_stop_typing", onUserStopTyping);
        newSocket.off("joined_conversation", onJoinedConversation);
        newSocket.off("left_conversation", onLeftConversation);
        newSocket.off("new_message", onNewMessage);
        newSocket.off("message_read", onMessageRead);
        newSocket.off("reaction_updated", onReactionUpdated);
        disconnectSocket();
        socketRef.current = null;
        setSocket(null);
        setOnlineUsers(new Set());
        setTypingUsers({});
        setActiveConversations(new Set());
        setMessageUpdates([]);
        setConnected(false);
      };
    } else if (!user && socketRef.current) {
      // Cleanup if user logs out
      disconnectSocket();
      socketRef.current = null;
      setSocket(null);
      setOnlineUsers(new Set());
      setTypingUsers({});
      setActiveConversations(new Set());
      setMessageUpdates([]);
      setConnected(false);
    }
  }, [user]);

  // Emit typing start event
  const emitTypingStart = useCallback(
    (conversationId) => {
      if (socket) socket.emit("typing_start", { conversationId });
    },
    [socket]
  );

  // Emit typing stop event
  const emitTypingStop = useCallback(
    (conversationId) => {
      if (socket) socket.emit("typing_stop", { conversationId });
    },
    [socket]
  );

  // Join a conversation room
  const joinConversation = useCallback(
    (conversationId) => {
      if (socket) socket.emit("join_conversation", conversationId);
    },
    [socket]
  );

  // Leave a conversation room
  const leaveConversation = useCallback(
    (conversationId) => {
      if (socket) socket.emit("leave_conversation", conversationId);
    },
    [socket]
  );

  // Emit add reaction event
  const emitAddReaction = useCallback(
    (messageId, emoji) => {
      if (socket) socket.emit("add_reaction", { messageId, emoji });
    },
    [socket]
  );

  // Emit remove reaction event
  const emitRemoveReaction = useCallback(
    (messageId, emoji) => {
      if (socket) socket.emit("remove_reaction", { messageId, emoji });
    },
    [socket]
  );

  return (
    <SocketContext.Provider
      value={{
        socket,
        connected,
        onlineUsers,
        typingUsers,
        activeConversations,
        messageUpdates,
        emitTypingStart,
        emitTypingStop,
        joinConversation,
        leaveConversation,
        emitAddReaction,
        emitRemoveReaction,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
