import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ActivityIndicator, 
  ScrollView, 
  TouchableOpacity, 
  Linking, 
  TextInput,
  Image,
  Alert
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';

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

export default function IncidentDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [incident, setIncident] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [sendingComment, setSendingComment] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    { id: 0, text: 'Hi! I am your assistant. How can I help you with this incident?', sender: 'bot' },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [sendingChat, setSendingChat] = useState(false);
  const [activeTab, setActiveTab] = useState('details'); // 'details' or 'chat'
  const scrollViewRef = useRef();
  
  // Fetch incident details
  useEffect(() => {
    const fetchIncidentDetails = async () => {
      try {
        const token = await (await import("@react-native-async-storage/async-storage")).default.getItem("accessToken");
        const response = await axios.get(`${API_BASE_URL}/api/incident/${id}/`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        
        setIncident(response.data);
        
        // Also fetch comments
        const commentsResponse = await axios.get(`${API_BASE_URL}/api/incidents/${id}/comments/`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        
        if (commentsResponse.data) {
          setComments(commentsResponse.data);
        }
      } catch (err) {
        console.error('Error fetching incident details:', err);
        setError('Failed to load incident details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchIncidentDetails();
  }, [id]);
  
  // Function to submit a new comment
  const submitComment = async () => {
    if (!newComment.trim()) return;
    
    setSendingComment(true);
    try {
      const token = await (await import("@react-native-async-storage/async-storage")).default.getItem("accessToken");
      const response = await axios.post(`${API_BASE_URL}/api/incidents/${id}/comments/`, 
        { comment: newComment },
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      
      if (response.data) {
        setComments(prevComments => [...prevComments, response.data]);
        setNewComment('');
      }
    } catch (err) {
      console.error('Error submitting comment:', err);
      Alert.alert('Error', 'Failed to submit your comment. Please try again.');
    } finally {
      setSendingComment(false);
    }
  };
  
  // Function to handle chat message
  const sendChatMessage = async () => {
    if (!chatInput.trim()) return;
    
    // Add user message to chat
    const userMsg = { id: chatMessages.length, text: chatInput, sender: 'user' };
    setChatMessages([...chatMessages, userMsg]);
    const userInput = chatInput;
    setChatInput('');
    setSendingChat(true);
    
    try {
      // Format chat history
      const formattedChatHistory = chatMessages
        .filter(msg => msg.sender === 'user')
        .map(msg => msg.text);
      
      const token = await (await import("@react-native-async-storage/async-storage")).default.getItem("accessToken");
      
      // Send incident context with the chat request
      const response = await axios.post(`${API_BASE_URL}/api/chat-t/`, {
        user_input: `Regarding incident #${id}: ${userInput}`,
        chat_history: formattedChatHistory,
        incident_id: id // Pass the incident ID to provide context
      }, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      
      if (response.data && response.data.bot_response) {
        const botText = response.data.bot_response;
        setChatMessages(msgs => [...msgs, { 
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
        errorMessage += ` Server responded with ${err.response.status}.`;
      } else if (err.request) {
        errorMessage += ' No response received from server.';
      } else {
        errorMessage += ` ${err.message}`;
      }
      
      setChatMessages(msgs => [...msgs, { 
        id: msgs.length, 
        text: errorMessage, 
        sender: 'bot' 
      }]);
    } finally {
      setSendingChat(false);
    }
  };

  // Function to get severity color
  const getSeverityColor = (severity) => {
    if (severity === "low") return "#4ade80";
    if (severity === "medium") return "#fde047";
    if (severity === "high") return "#ff5252";
    return "#4ade80";
  };
  
  // Function to get status color and text
  const getStatusInfo = (status) => {
    if (status === "resolved") {
      return { color: "#4ade80", step: 2, text: "Resolved" };
    } else if (status === "under investigation") {
      return { color: "#fde047", step: 1, text: "Under Investigation" };
    } else {
      return { color: "#0bf", step: 0, text: "Submitted" };
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#0bf" />
        <Text style={styles.loadingText}>Loading incident details...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Ionicons name="alert-circle" size={40} color="#ff5252" />
        <Text style={styles.error}>{error}</Text>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!incident) {
    return (
      <View style={styles.centered}>
        <Text style={styles.error}>Incident not found</Text>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const statusInfo = getStatusInfo(incident.status ? incident.status.toLowerCase() : 'submitted');

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#0bf" />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Incident #{id}</Text>
      </View>
      
      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[
            styles.tab, 
            activeTab === 'details' && styles.activeTab
          ]}
          onPress={() => setActiveTab('details')}
        >
          <Text style={[
            styles.tabText, 
            activeTab === 'details' && styles.activeTabText
          ]}>Details</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[
            styles.tab, 
            activeTab === 'chat' && styles.activeTab
          ]}
          onPress={() => setActiveTab('chat')}
        >
          <Text style={[
            styles.tabText, 
            activeTab === 'chat' && styles.activeTabText
          ]}>Chat</Text>
        </TouchableOpacity>
      </View>
      
      {activeTab === 'details' ? (
        <ScrollView 
          style={styles.content} 
          contentContainerStyle={styles.contentContainer}
          ref={scrollViewRef}
        >
          {/* Incident Type */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Incident Type</Text>
            <Text style={styles.incidentType}>{incident.incidentType}</Text>
          </View>
          
          {/* Severity and Status */}
          <View style={styles.rowSection}>
            <View style={styles.halfSection}>
              <Text style={styles.sectionTitle}>Severity</Text>
              <View style={[styles.severityBadge, { backgroundColor: getSeverityColor(incident.severity) + '20', borderColor: getSeverityColor(incident.severity) }]}>
                <Text style={[styles.severityText, { color: getSeverityColor(incident.severity) }]}>
                  {incident.severity ? incident.severity.charAt(0).toUpperCase() + incident.severity.slice(1) : 'Unknown'}
                </Text>
              </View>
            </View>
            
            <View style={styles.halfSection}>
              <Text style={styles.sectionTitle}>Status</Text>
              <View style={styles.statusContainer}>
                <View style={styles.statusTracker}>
                  <View style={[styles.statusDot, { backgroundColor: statusInfo.step >= 0 ? '#0bf' : '#ccc' }]} />
                  <View style={[styles.statusLine, { backgroundColor: statusInfo.step >= 1 ? 'linear-gradient(to right, #0bf, #fde047)' : '#ccc' }]} />
                  <View style={[styles.statusDot, { backgroundColor: statusInfo.step >= 1 ? '#fde047' : '#ccc' }]} />
                  <View style={[styles.statusLine, { backgroundColor: statusInfo.step >= 2 ? 'linear-gradient(to right, #fde047, #4ade80)' : '#ccc' }]} />
                  <View style={[styles.statusDot, { backgroundColor: statusInfo.step >= 2 ? '#4ade80' : '#ccc' }]} />
                </View>
                <Text style={[styles.statusText, { color: statusInfo.color }]}>{statusInfo.text}</Text>
              </View>
            </View>
          </View>
          
          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>{incident.description}</Text>
          </View>
          
          {/* Timestamps */}
          <View style={styles.rowSection}>
            <View style={styles.halfSection}>
              <Text style={styles.sectionTitle}>Reported</Text>
              <Text style={styles.timestamp}>
                {new Date(incident.reported_at).toLocaleString()}
              </Text>
            </View>
            
            {incident.resolved_at && (
              <View style={styles.halfSection}>
                <Text style={styles.sectionTitle}>Resolved</Text>
                <Text style={styles.timestamp}>
                  {new Date(incident.resolved_at).toLocaleString()}
                </Text>
              </View>
            )}
          </View>
          
          {/* Location */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Location</Text>
            {incident.maps_link && incident.maps_link !== "None" ? (
              <TouchableOpacity
                style={styles.mapLink}
                onPress={() => Linking.openURL(incident.maps_link)}
              >
                <Ionicons name="location" size={20} color="#0bf" />
                <Text style={styles.mapLinkText}>View on Google Maps</Text>
              </TouchableOpacity>
            ) : (
              <Text style={styles.noLocationText}>No location data available</Text>
            )}
          </View>
          
          {/* Comments Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Comments ({comments.length})</Text>
            
            {comments.length === 0 ? (
              <Text style={styles.noCommentsText}>No comments yet. Be the first to add one!</Text>
            ) : (
              comments.map((comment, index) => (
                <View key={comment.id || index} style={styles.commentItem}>
                  <View style={styles.commentHeader}>
                    <Text style={styles.commentAuthor}>
                      {comment.commented_by?.first_name || 'Anonymous'} {comment.commented_by?.last_name || ''}
                    </Text>
                    <Text style={styles.commentTime}>
                      {new Date(comment.commented_at).toLocaleString()}
                    </Text>
                  </View>
                  <Text style={styles.commentText}>{comment.comment}</Text>
                </View>
              ))
            )}
            
            {/* Add Comment Form */}
            <View style={styles.addCommentSection}>
              <TextInput
                style={styles.commentInput}
                value={newComment}
                onChangeText={setNewComment}
                placeholder="Add a comment..."
                multiline
                editable={!sendingComment}
              />
              <TouchableOpacity
                style={[styles.commentButton, !newComment.trim() && styles.disabledButton]}
                onPress={submitComment}
                disabled={!newComment.trim() || sendingComment}
              >
                {sendingComment ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.commentButtonText}>Send</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      ) : (
        // Chat Tab
        <View style={styles.chatContainer}>
          <ScrollView
            style={styles.chatMessages}
            contentContainerStyle={{ padding: 16 }}
            ref={scrollViewRef}
            onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
          >
            {chatMessages.map((item) => {
              if (item.sender === 'user') {
                return (
                  <View key={item.id} style={[styles.message, styles.userMsg]}>
                    <Text style={{ color: '#fff' }}>{item.text}</Text>
                  </View>
                );
              } else {
                // Parse markdown for bot messages
                const parts = parseMarkdown(item.text);
                return (
                  <View key={item.id} style={[styles.message, styles.botMsg]}>
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
            })}
          </ScrollView>
          
          <View style={styles.chatInputContainer}>
            <TextInput
              style={styles.chatInputField}
              value={chatInput}
              onChangeText={setChatInput}
              placeholder="Type your message..."
              multiline
              editable={!sendingChat}
            />
            <TouchableOpacity
              style={[styles.chatSendButton, !chatInput.trim() && styles.disabledButton]}
              onPress={sendChatMessage}
              disabled={!chatInput.trim() || sendingChat}
            >
              {sendingChat ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="send" size={20} color="#fff" />
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f8ff',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f8ff',
  },
  loadingText: {
    marginTop: 12,
    color: '#0bf',
    fontSize: 16,
  },
  error: {
    color: '#ff5252',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
    marginHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e3f0ff',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  backButtonText: {
    color: '#0bf',
    fontSize: 16,
    marginLeft: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0b2340',
    flex: 1,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e3f0ff',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 3,
    borderBottomColor: '#0bf',
  },
  tabText: {
    fontSize: 16,
    color: '#888',
  },
  activeTabText: {
    color: '#0bf',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#0bf',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  rowSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  halfSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    flex: 0.48,
    shadowColor: '#0bf',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    color: '#888',
    marginBottom: 8,
  },
  incidentType: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0b2340',
  },
  severityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
    borderWidth: 1,
  },
  severityText: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  statusContainer: {
    alignItems: 'center',
  },
  statusTracker: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  statusLine: {
    height: 3,
    width: 20,
  },
  statusText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  description: {
    fontSize: 16,
    color: '#0b2340',
    lineHeight: 22,
  },
  timestamp: {
    fontSize: 14,
    color: '#0b2340',
  },
  mapLink: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e3f0ff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  mapLinkText: {
    color: '#0bf',
    marginLeft: 8,
    fontWeight: '600',
  },
  noLocationText: {
    color: '#888',
    fontStyle: 'italic',
  },
  noCommentsText: {
    color: '#888',
    fontStyle: 'italic',
    marginVertical: 10,
  },
  commentItem: {
    borderWidth: 1,
    borderColor: '#e3f0ff',
    borderRadius: 8,
    padding: 12,
    marginVertical: 6,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  commentAuthor: {
    fontWeight: '600',
    color: '#0b2340',
  },
  commentTime: {
    fontSize: 12,
    color: '#888',
  },
  commentText: {
    color: '#0b2340',
    fontSize: 14,
  },
  addCommentSection: {
    marginTop: 12,
  },
  commentInput: {
    borderWidth: 1,
    borderColor: '#0bf',
    borderRadius: 8,
    padding: 12,
    minHeight: 60,
    maxHeight: 120,
    backgroundColor: '#fff',
    marginBottom: 8,
    color: '#0b2340',
  },
  commentButton: {
    backgroundColor: '#0bf',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.5,
  },
  commentButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  chatContainer: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  chatMessages: {
    flex: 1,
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
  chatInputContainer: {
    flexDirection: 'row',
    padding: 12,
    borderTopWidth: 1,
    borderColor: '#e3f0ff',
    backgroundColor: '#fff',
  },
  chatInputField: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#0bf',
    borderRadius: 8,
    padding: 10,
    marginRight: 8,
    backgroundColor: '#f5f8ff',
    maxHeight: 100,
  },
  chatSendButton: {
    backgroundColor: '#0bf',
    borderRadius: 8,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
});