import React, { useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { login } from '../api/auth';

export default function LoginScreen({ navigation, goToSignup }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    let tempErrors = {};
    if (!email || !/\S+@\S+\.\S+/.test(email)) tempErrors.email = 'Valid Email is required';
    if (!password || password.length < 6) tempErrors.password = 'Password must be at least 6 characters';
    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const data = await login(email, password);
      // Save token and user info for authenticated requests
      await AsyncStorage.setItem('accessToken', data.tokens.access);
      await AsyncStorage.setItem('userEmail', data.email);
      await AsyncStorage.setItem('userId', data.user_id.toString());
      Alert.alert('Login Successful', `Welcome ${data.email}`);
      navigation.replace('(tabs)');
    } catch (err) {
      setErrors({ general: err?.response?.data?.error || 'Invalid credentials' });
    }
    setLoading(false);
  };

  return (
    <KeyboardAvoidingView style={styles.outer} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.container}>
        <Text style={styles.title}>Log In</Text>
        <View style={styles.inputBox}>
          <TextInput
            style={styles.input}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholderTextColor="#bbb"
          />
          {errors.email && <Text style={styles.error}>{errors.email}</Text>}
        </View>
        <View style={styles.inputBox}>
          <TextInput
            style={styles.input}
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholderTextColor="#bbb"
          />
          {errors.password && <Text style={styles.error}>{errors.password}</Text>}
        </View>
        <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
          <Text style={styles.buttonText}>{loading ? 'Logging in...' : 'Log In'}</Text>
        </TouchableOpacity>
        {errors.general && <Text style={styles.error}>{errors.general}</Text>}
        <TouchableOpacity onPress={goToSignup}>
          <Text style={styles.link}>Don't have an account? <Text style={{ color: '#0bf', fontWeight: 'bold' }}>Sign Up</Text></Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  outer: {
    flex: 1,
    backgroundColor: '#181c24',
    justifyContent: 'center',
  },
  container: {
    marginHorizontal: 24,
    padding: 24,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.04)',
    shadowColor: '#0bf',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    elevation: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 24,
    textAlign: 'center',
    textShadowColor: '#0bf',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  inputBox: {
    marginBottom: 16,
  },
  input: {
    width: '100%',
    height: 48,
    borderColor: '#bbb',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    color: '#fff',
    backgroundColor: 'rgba(24,28,36,0.7)',
  },
  button: {
    width: '100%',
    backgroundColor: '#0bf',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 8,
    shadowColor: '#0bf',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  link: {
    color: '#bbb',
    fontSize: 16,
    marginTop: 8,
    textAlign: 'center',
  },
  error: {
    color: '#ff5252',
    fontSize: 14,
    marginTop: 4,
    textAlign: 'left',
  },
});
