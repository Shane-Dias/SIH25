import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import LoginScreen from '../screens/LoginScreen';
import SignupScreen from '../screens/SignupScreen';

// Simple token storage (replace with secure storage in production)
const getToken = () => {
  // For demo: use localStorage or AsyncStorage
  return null; // Always show login/signup for now
};

export default function Index() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check token (replace with real logic)
    const token = getToken();
    setIsAuthenticated(!!token);
    setLoading(false);
  }, []);

  if (loading) {
    return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator size="large" /></View>;
  }

  if (!isAuthenticated) {
    return showSignup ? (
      <SignupScreen navigation={useRouter()} goToLogin={() => setShowSignup(false)} />
    ) : (
      <LoginScreen navigation={useRouter()} goToSignup={() => setShowSignup(true)} />
    );
  }

  // If authenticated, show tabs (handled by (tabs)/_layout.tsx)
  // This file will be replaced by tab navigation automatically
  return null;
}
