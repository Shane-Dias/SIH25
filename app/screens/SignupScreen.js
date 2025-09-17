import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { signup } from '../api/auth';

export default function SignupScreen({ navigation, goToLogin }) {
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    address: '',
    aadharNumber: '',
    emergencyContact1: '',
    emergencyContact2: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    let tempErrors = {};
    if (!form.firstName) tempErrors.firstName = 'First name is required';
    if (!form.lastName) tempErrors.lastName = 'Last name is required';
    if (!form.email || !/\S+@\S+\.\S+/.test(form.email)) tempErrors.email = 'Valid Email is required';
    if (!form.phoneNumber) tempErrors.phoneNumber = 'Phone number is required';
    if (!form.address) tempErrors.address = 'Address is required';
    if (!form.aadharNumber) tempErrors.aadharNumber = 'Aadhar number is required';
    if (!form.emergencyContact1) tempErrors.emergencyContact1 = 'Emergency contact 1 is required';
    if (!form.emergencyContact2) tempErrors.emergencyContact2 = 'Emergency contact 2 is required';
    if (!form.password || form.password.length < 6) tempErrors.password = 'Password must be at least 6 characters';
    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleChange = (key, value) => {
    setForm({ ...form, [key]: value });
  };

  const handleSignup = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const data = await signup(form);
      Alert.alert('Signup Successful', data.message || 'Account created!');
      navigation.replace('(tabs)');
    } catch (err) {
      setErrors({ general: err?.response?.data?.error || 'Check your details' });
    }
    setLoading(false);
  };

  return (
    <KeyboardAvoidingView style={styles.outer} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Sign Up</Text>
        {Object.keys(form).map((key) => (
          <View key={key} style={styles.inputBox}>
            <TextInput
              style={styles.input}
              placeholder={key.replace(/([A-Z])/g, ' $1')}
              value={form[key]}
              onChangeText={(val) => handleChange(key, val)}
              secureTextEntry={key === 'password'}
              autoCapitalize={key === 'email' ? 'none' : 'words'}
              keyboardType={key.toLowerCase().includes('phone') || key.toLowerCase().includes('aadhar') ? 'numeric' : 'default'}
              placeholderTextColor="#bbb"
            />
            {errors[key] && <Text style={styles.error}>{errors[key]}</Text>}
          </View>
        ))}
        <TouchableOpacity style={styles.button} onPress={handleSignup} disabled={loading}>
          <Text style={styles.buttonText}>{loading ? 'Signing up...' : 'Sign Up'}</Text>
        </TouchableOpacity>
        {errors.general && <Text style={styles.error}>{errors.general}</Text>}
        <TouchableOpacity onPress={goToLogin}>
          <Text style={styles.link}>Already have an account? <Text style={{ color: '#0bf', fontWeight: 'bold' }}>Login</Text></Text>
        </TouchableOpacity>
      </ScrollView>
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
    flexGrow: 1,
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
