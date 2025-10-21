import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Modal, ActivityIndicator } from 'react-native';
import axios from 'axios';
import { useRouter } from 'expo-router';

// Make sure this IP matches your Django server's IP and port
const API_BASE_URL = process.env.API_BASE_URL || "http://192.168.1.37:8000";

// Helper function to parse markdown-like formatting
const parseMarkdown = (text) => {
  if (!text) return [];
  
  // Split by double asterisks (bold headings) and single asterisks (emphasis)
  const parts = text.split(/([*][*].*?[*][*]|[*].*?[*])/g).filter(Boolean);
  
  return parts.map((part, index) => {
    // Check if it's a heading (surrounded by double asterisks)
    const isHeading = part.startsWith('**') && part.endsWith('**');
    // Check if it's emphasized text (surrounded by single asterisk)
    const isEmphasized = part.startsWith('*') && part.endsWith('*') && !isHeading;
    
    if (isHeading) {
      return {
        id: `part-${index}`,
        text: part.replace(/[*][*]/g, ''),
        type: 'heading',
      };
    } else if (isEmphasized) {
      return {
        id: `part-${index}`,
        text: part.replace(/[*]/g, ''),
        type: 'emphasis',
      };
    } else {
      return {
        id: `part-${index}`,
        text: part,
        type: 'normal',
      };
    }
  });
};

export default function ChatBotScreen() {
  const router = useRouter();
  const [messages, setMessages] = useState([
    { id: 0, text: 'Hi! I am your assistant. How can I help you?', sender: 'bot' },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const flatListRef = useRef();
  
  // New state variables for incidents
  const [recentIncidents, setRecentIncidents] = useState([]);
  const [loadingIncidents, setLoadingIncidents] = useState(false);
  const [showIncidentsModal, setShowIncidentsModal] = useState(false);

  // Auto scroll to the bottom when messages change
  useEffect(() => {
    if (flatListRef.current && messages.length > 0) {
      flatListRef.current.scrollToEnd({ animated: true });
    }
  }, [messages]);
  
  // Fetch recent incidents
  useEffect(() => {
    const fetchRecentIncidents = async () => {
      try {
        const token = await (await import("@react-native-async-storage/async-storage")).default.getItem("accessToken");
        setLoadingIncidents(true);
        const response = await axios.get(`${API_BASE_URL}/api/latest-incidents/`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        
        if (response.data) {
          setRecentIncidents(response.data);
        }
      } catch (err) {
        console.error('Error fetching recent incidents:', err);
      } finally {
        setLoadingIncidents(false);
      }
    };
    
    fetchRecentIncidents();
  }, []);

  const sendMessage = async () => {
    if (!input.trim()) return;
    
    // Add user message to chat
    const userMsg = { id: messages.length, text: input, sender: 'user' };
    const userInput = input; // Save input before clearing
    setMessages([...messages, userMsg]);
    setInput('');
    setLoading(true);
    
    try {
      // Format chat history like the web version
      const formattedChatHistory = messages
        .filter(msg => msg.sender === 'user')
        .map(msg => msg.text);
      
      const token = await (await import("@react-native-async-storage/async-storage")).default.getItem("accessToken");
      
      // Use the exact same payload structure as the web version
      const response = await axios.post(`${API_BASE_URL}/api/chat-t/`, {
        user_input: userInput,
        chat_history: formattedChatHistory
      }, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      
      console.log('Chatbot API response:', response.data);
      
      if (response.data && response.data.bot_response) {
        const botText = response.data.bot_response;
        setMessages(msgs => [...msgs, { 
          id: msgs.length, 
          text: botText,
          sender: 'bot' 
        }]);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      console.error('Chatbot API error:', err);
      
      let errorMessage = 'Error connecting to chatbot.';
      if (err.response) {
        errorMessage += ` Server responded with ${err.response.status}: ${JSON.stringify(err.response.data || {})}`;
      } else if (err.request) {
        errorMessage += ' No response received from server.';
      } else {
        errorMessage += ` ${err.message}`;
      }
      
      setMessages(msgs => [...msgs, { 
        id: msgs.length, 
        text: errorMessage, 
        sender: 'bot' 
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {/* Recent Incidents Button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.recentIncidentsBtn}
          onPress={() => router.push('/(tabs)/recentincident1')}
        >
          <Text style={styles.recentIncidentsBtnText}>View Recent Incidents</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.recentIncidentsBtn, { backgroundColor: '#0bf', marginTop: 8 }]}
          onPress={() => setShowIncidentsModal(true)}
        >
          <Text style={styles.recentIncidentsBtnText}>Browse Incident Details</Text>
        </TouchableOpacity>
      </View>
      
      {/* Incidents Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showIncidentsModal}
        onRequestClose={() => setShowIncidentsModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select an Incident</Text>
              <TouchableOpacity onPress={() => setShowIncidentsModal(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            
            {loadingIncidents ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#0bf" />
                <Text style={styles.loadingText}>Loading incidents...</Text>
              </View>
            ) : recentIncidents.length === 0 ? (
              <Text style={styles.noIncidentsText}>No incidents found.</Text>
            ) : (
              <FlatList
                data={recentIncidents}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                  <TouchableOpacity 
                    style={styles.incidentItem}
                    onPress={() => {
                      setShowIncidentsModal(false);
                      router.push({
                        pathname: '/(tabs)/incident-detail',
                        params: { id: item.id }
                      });
                    }}
                  >
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text style={styles.incidentType}>{item.incidentType}</Text>
                      <Text style={[
                        styles.incidentSeverity, 
                        { color: item.severity === 'high' ? '#ff5252' : 
                                 item.severity === 'medium' ? '#fde047' : '#4ade80' }
                      ]}>
                        {item.severity}
                      </Text>
                    </View>
                    <Text style={styles.incidentDesc} numberOfLines={2}>{item.description}</Text>
                    <Text style={styles.incidentDate}>
                      {new Date(item.reported_at).toLocaleDateString()}
                    </Text>
                  </TouchableOpacity>
                )}
                contentContainerStyle={{ padding: 8 }}
              />
            )}
          </View>
        </View>
      </Modal>
      
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={item => item.id.toString()}
        renderItem={({ item }) => {
          if (item.sender === 'user') {
            return (
              <View style={[styles.message, styles.userMsg]}>
                <Text style={{ color: '#fff' }}>{item.text}</Text>
              </View>
            );
          } else {
            // Parse markdown for bot messages
            const parts = parseMarkdown(item.text);
            return (
              <View style={[styles.message, styles.botMsg]}>
                {parts.map((part) => {
                  if (part.type === 'heading') {
                    return (
                      <Text key={part.id} style={styles.heading}>{part.text}</Text>
                    );
                  } else if (part.type === 'emphasis') {
                    return (
                      <Text key={part.id} style={styles.emphasis}>{part.text}</Text>
                    );
                  } else {
                    return (
                      <Text key={part.id} style={styles.normalText}>{part.text}</Text>
                    );
                  }
                })}
              </View>
            );
          }
        }}
        contentContainerStyle={{ padding: 16, paddingBottom: 20 }}
        onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Type your message..."
          editable={!loading}
        />
        <TouchableOpacity style={styles.sendBtn} onPress={sendMessage} disabled={loading}>
          <Text style={{ color: '#fff', fontWeight: 'bold' }}>{loading ? '...' : 'Send'}</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f8ff',
  },
  message: {
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
    maxWidth: '80%',
  },
  userMsg: {
    backgroundColor: '#0bf',
    alignSelf: 'flex-end',
  },
  botMsg: {
    backgroundColor: '#e3f0ff',
    alignSelf: 'flex-start',
  },
  heading: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0b2340',
    marginBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(11, 35, 64, 0.2)',
    paddingBottom: 4,
  },
  emphasis: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0b2340',
    marginVertical: 2,
  },
  normalText: {
    fontSize: 14,
    color: '#0b2340',
    marginVertical: 2,
  },
  inputRow: {
    flexDirection: 'row',
    padding: 12,
    borderTopWidth: 1,
    borderColor: '#e3f0ff',
    backgroundColor: '#fff',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#0bf',
    borderRadius: 8,
    padding: 10,
    marginRight: 8,
    backgroundColor: '#f5f8ff',
  },
  sendBtn: {
    backgroundColor: '#0bf',
    borderRadius: 8,
    paddingHorizontal: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonContainer: {
    padding: 12,
    backgroundColor: '#f5f8ff',
    borderBottomWidth: 1,
    borderBottomColor: '#e3f0ff',
  },
  recentIncidentsBtn: {
    backgroundColor: '#ff5252',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
  },
  recentIncidentsBtnText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 15,
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxHeight: '80%',
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e3f0ff',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0b2340',
  },
  modalClose: {
    fontSize: 20,
    color: '#888',
    padding: 5,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#0bf',
  },
  noIncidentsText: {
    padding: 20,
    textAlign: 'center',
    color: '#888',
    fontStyle: 'italic',
  },
  incidentItem: {
    backgroundColor: '#f5f8ff',
    padding: 12,
    marginVertical: 4,
    marginHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e3f0ff',
  },
  incidentType: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0b2340',
  },
  incidentSeverity: {
    fontSize: 14,
    fontWeight: '600',
  },
  incidentDesc: {
    fontSize: 14,
    color: '#555',
    marginVertical: 4,
  },
  incidentDate: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },
});
