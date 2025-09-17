import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, Send, User, Settings, Users } from 'lucide-react';

const Chat = () => {
  const [messages, setMessages] = useState([]);
  const [username, setUsername] = useState('');
  const [message, setMessage] = useState('');
  const [isUsernameSet, setIsUsernameSet] = useState(false);
  const messagesEndRef = useRef(null);
  const lastMessageTimestamp = useRef(null);
  const API_URL = import.meta.env.VITE_API_URL;
  

  const XYZ_URL = `${API_URL}/api/chat`;

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Load initial messages
  const loadMessages = async () => {
    try {
      const response = await fetch(`${XYZ_URL}/messages/`);
      const data = await response.json();
      setMessages(data);
      if (data.length > 0) {
        lastMessageTimestamp.current = data[data.length - 1].timestamp;
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  // Check for new messages
  const checkForNewMessages = async () => {
    if (!lastMessageTimestamp.current) return;
    
    try {
      const response = await fetch(
        `${XYZ_URL}/messages/recent/?timestamp=${lastMessageTimestamp.current}`
      );
      const data = await response.json();
      
      if (data.length > 0) {
        setMessages(prev => [...prev, ...data]);
        lastMessageTimestamp.current = data[data.length - 1].timestamp;
      }
    } catch (error) {
      console.error('Error checking for new messages:', error);
    }
  };

  // Send message
  const sendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim() || !username.trim()) return;

    try {
      const response = await fetch(`${XYZ_URL}/messages/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: username.trim(),
          content: message.trim()
        })
      });
      
      const data = await response.json();
      setMessages(prev => [...prev, data]);
      setMessage('');
      lastMessageTimestamp.current = data.timestamp;
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Error sending message. Please try again.');
    }
  };

  // Set username
  const handleUsernameSubmit = (e) => {
    e.preventDefault();
    if (username.trim()) {
      setIsUsernameSet(true);
      loadMessages();
    }
  };

  // Auto-scroll and polling effect
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Polling for new messages
  useEffect(() => {
    if (!isUsernameSet) return;

    const interval = setInterval(checkForNewMessages, 2000); // Check every 2 seconds
    return () => clearInterval(interval);
  }, [isUsernameSet, lastMessageTimestamp.current]);

  // Format timestamp
  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (!isUsernameSet) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-blue-950 to-black flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent mb-3 drop-shadow-[0_0_10px_cyan]">
              Join Chat Room
            </h1>
            <p className="text-gray-400 text-sm sm:text-base">
              Connect with others in real-time conversations
            </p>
          </div>

          {/* Form */}
          <div className="bg-slate-900 rounded-xl sm:rounded-2xl p-6 sm:p-8 border border-cyan-500 transition-all duration-300 hover:shadow-[0_0_20px_cyan]">
            <div className="space-y-6">
              <div className="relative">
                <label className="text-gray-300 text-sm font-medium mb-2 block">
                  <User className="w-4 h-4 inline-block mr-2 text-cyan-400" />
                  Your Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleUsernameSubmit(e)}
                  className="w-full bg-slate-800 text-gray-100 px-4 py-3 rounded-xl border border-slate-700 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)] transition-all duration-200"
                  placeholder="Enter your username..."
                  maxLength={100}
                />
              </div>
              
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleUsernameSubmit}
                className="w-full py-3 sm:py-4 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-xl font-medium shadow-lg hover:shadow-cyan-500/20 transition-all duration-200 flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-5 h-5" />
                Join Chat
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-blue-950 to-black">
      <div className="container mx-auto px-4 py-6 sm:py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto"
        >
          <div className="bg-slate-900 rounded-xl sm:rounded-2xl border border-cyan-500 transition-all duration-300 hover:shadow-[0_0_20px_cyan] overflow-hidden">
            
            {/* Chat Header */}
            <div className="bg-gradient-to-r from-cyan-600 via-blue-600 to-purple-600 p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-white">Chat Room</h2>
                    <p className="text-blue-100 text-sm">Real-time conversations</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-white text-sm">
                    Welcome, <span className="font-medium text-cyan-200">{username}</span>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setIsUsernameSet(false);
                      setUsername('');
                      setMessages([]);
                    }}
                    className="flex items-center gap-2 text-xs bg-white/20 hover:bg-white/30 px-3 py-2 rounded-lg backdrop-blur-sm transition-all duration-200 text-white"
                  >
                    <Settings className="w-3 h-3" />
                    Change Username
                  </motion.button>
                </div>
              </div>
            </div>

            {/* Messages Area */}
            <div className="h-96 overflow-y-auto bg-slate-800/50 backdrop-blur-sm">
              <div className="p-4 space-y-4">
                {messages.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center text-gray-400 mt-8 py-8"
                  >
                    <MessageCircle className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                    <p className="text-lg font-medium mb-2">No messages yet</p>
                    <p className="text-sm">Start the conversation!</p>
                  </motion.div>
                ) : (
                  messages.map((msg, index) => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`flex ${msg.username === username ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl backdrop-blur-sm border ${
                          msg.username === username
                            ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white border-cyan-400/50 shadow-lg shadow-cyan-500/20'
                            : 'bg-slate-700/80 text-gray-100 border-slate-600/50 shadow-lg'
                        }`}
                      >
                        {msg.username !== username && (
                          <div className="text-xs font-medium mb-1 text-cyan-400">
                            {msg.username}
                          </div>
                        )}
                        <div className="break-words text-sm sm:text-base">{msg.content}</div>
                        <div
                          className={`text-xs mt-1 ${
                            msg.username === username ? 'text-cyan-100' : 'text-gray-400'
                          }`}
                        >
                          {formatTime(msg.timestamp)}
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Message Input */}
            <div className="border-t border-slate-700 bg-slate-800/80 backdrop-blur-sm p-4">
              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage(e)}
                    className="w-full bg-slate-700 text-gray-100 px-4 py-3 rounded-xl border border-slate-600 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)] transition-all duration-200"
                    placeholder="Type your message..."
                    maxLength={1000}
                  />
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={sendMessage}
                  disabled={!message.trim()}
                  className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-6 py-3 rounded-xl font-medium shadow-lg hover:shadow-cyan-500/20 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  <span className="hidden sm:inline">Send</span>
                </motion.button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Chat;