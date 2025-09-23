import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext.jsx';
import Layout from '@/components/layout/Layout.jsx';
import Sidebar from '@/components/layout/Sidebar.jsx';
import ChatHeader from '@/components/chat/ChatHeader.jsx';
import MessageList from '@/components/chat/MessageList.jsx';
import ChatInput from '@/components/chat/ChatInput.jsx';
import { createDirectConversation, getConversations, sendMessage } from '@/services/chatApi.js';
import { useSocket } from '@/contexts/SocketContext.jsx';
import toast from 'react-hot-toast';

const ChatPage = () => {
  const { user: currentUser } = useAuth();
  const { socket } = useSocket();

  const [selectedConversation, setSelectedConversation] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [pendingDirectUser, setPendingDirectUser] = useState(null);

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const convos = await getConversations();
        setConversations(convos);
      } catch {
        toast.error('Failed to load conversations');
      }
    };
    fetchConversations();
  }, []);

  // Called when selecting a user from search in Sidebar
  const handlePendingDirectUser = (user) => {
    setPendingDirectUser(user);
    setSelectedConversation(null);
  };

  // Optimistic message send using socket if available, otherwise fallback to REST
  const handleSendMessage = async (conversationId, content) => {
    if (!content.trim()) return;

    try {
      if (!conversationId && pendingDirectUser) {
        // Create direct conversation first
        const newConvo = await createDirectConversation(pendingDirectUser._id);
        setConversations(prev => [newConvo, ...prev]);
        setSelectedConversation(newConvo);
        setPendingDirectUser(null);

        if (socket) {
          socket.emit('send_message', { conversationId: newConvo._id, content, type: 'text' });
        } else {
          // Fallback REST send
          await sendMessage({ conversationId: newConvo._id, content });
        }        
      } else {
        if (socket && conversationId) {
          socket.emit('send_message', { conversationId, content, type: 'text' });
        } else {
          await sendMessage({ conversationId, content });
        }
      }
    } catch (err) {
      toast.error('Failed to send message');
      console.error(err);
    }
  };

  const otherUser =
    selectedConversation?.participants.find(p => p.user._id !== currentUser._id)?.user ||
    pendingDirectUser ||
    null;

  return (
    <Layout>
      <div className="flex flex-1 rounded-3xl bg-white shadow-lg h-full overflow-hidden">
        <Sidebar
          selectedConversationId={selectedConversation?._id}
          onSelectConversation={setSelectedConversation}
          onSelectPendingDirectUser={handlePendingDirectUser}
          className="flex-shrink-0 h-full overflow-y-auto"
        />

        <div className="flex flex-col flex-1 min-w-0 h-full">
          {(selectedConversation || pendingDirectUser) ? (
            <>
              <div className="flex-none">
                <ChatHeader otherUser={otherUser} />
              </div>

              <div className="flex-grow overflow-hidden bg-white min-w-0">
                <div className="h-full overflow-y-auto p-4 scroll-smooth">
                  <MessageList conversationId={selectedConversation?._id} />
                </div>
              </div>

              <div className="flex-none border-t border-gray-300 bg-gray-50">
                <ChatInput
                  conversationId={selectedConversation?._id}
                  onSend={(content) => handleSendMessage(selectedConversation?._id, content)}
                />
              </div>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center text-gray-600 text-lg select-none p-8">
              Select a conversation from the sidebar
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default ChatPage;
