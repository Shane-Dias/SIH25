import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import axios from 'axios';

const API_BASE_URL = process.env.API_BASE_URL || "http://192.168.1.37:8000";

export default function ChatBotScreen() {
  const [messages, setMessages] = useState([
    { id: 0, text: 'Hi! I am your assistant. How can I help you?', sender: 'bot' },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMsg = { id: messages.length, text: input, sender: 'user' };
    setMessages([...messages, userMsg]);
    setInput('');
    setLoading(true);
    try {
      const token = await (await import("@react-native-async-storage/async-storage")).default.getItem("accessToken");
      const response = await axios.post(`${API_BASE_URL}/chat-t/`, {
        user_input: input,
        chat_history: messages.filter(m => m.sender === 'user').map(m => m.text),
      }, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const botText = response.data && response.data.reply ? response.data.reply : 'Sorry, I could not understand.';
      setMessages(msgs => [...msgs, { id: msgs.length, text: botText, sender: 'bot' }]);
    } catch (err) {
      setMessages(msgs => [...msgs, { id: msgs.length, text: 'Error connecting to chatbot.', sender: 'bot' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <FlatList
        data={messages}
        keyExtractor={item => item.id.toString()}
        renderItem={({ item }) => (
          <View style={[styles.message, item.sender === 'user' ? styles.userMsg : styles.botMsg]}>
            <Text style={{ color: item.sender === 'user' ? '#fff' : '#0b2340' }}>{item.text}</Text>
          </View>
        )}
        contentContainerStyle={{ padding: 16 }}
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
});
