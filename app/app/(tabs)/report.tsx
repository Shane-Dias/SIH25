import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import * as Location from 'expo-location';
import * as DocumentPicker from 'expo-document-picker';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';

// Centralized API base URL from .env
const API_BASE_URL = process.env.API_BASE_URL || 'http://192.168.1.37:8000';

type IncidentType =
  | 'Domestic Violence' | 'Child Abuse' | 'Sexual Harassment' | 'Stalking' | 'Human Trafficking'
  | 'Fire' | 'Theft' | 'Accident' | 'Missing Persons' | 'Medical Emergency' | 'Other';

interface LocationType {
  latitude: string;
  longitude: string;
}

interface FileType {
  uri: string;
  name: string;
  mimeType: string;
}

interface FormType {
  incidentType: IncidentType | '';
  location: LocationType;
  description: string;
  file: FileType | null;
}

interface ErrorType {
  incidentType?: string;
  location?: string;
  description?: string;
  general?: string;
}

const INCIDENT_TYPES: IncidentType[] = [
  'Domestic Violence', 'Child Abuse', 'Sexual Harassment', 'Stalking', 'Human Trafficking',
  'Fire', 'Theft', 'Accident', 'Missing Persons', 'Medical Emergency', 'Other'
];

export default function ReportScreen() {
  // Camera capture handler
  const handleTakePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Camera permission is required to take a photo.');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.7,
        allowsEditing: false,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const photo = result.assets[0];
        setForm({
          ...form,
          file: {
            uri: photo.uri,
            name: photo.fileName || 'photo.jpg',
            mimeType: photo.type || 'image/jpeg',
          },
        });
      }
    } catch (error) {
      console.error('Camera error:', error);
      Alert.alert('Error', 'Failed to take photo');
    }
  };
  const [form, setForm] = useState<FormType>({
    incidentType: '',
    location: { latitude: '', longitude: '' },
    description: '',
    file: null,
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<ErrorType>({});

  const validate = (): boolean => {
    let tempErrors: ErrorType = {};
    
    if (!form.incidentType) {
      tempErrors.incidentType = 'Incident type is required';
    }
    
    if (!form.location.latitude || !form.location.longitude) {
      tempErrors.location = 'Location is required';
    } else {
      // Validate coordinates are valid numbers
      const lat = parseFloat(form.location.latitude);
      const lon = parseFloat(form.location.longitude);
      
      if (isNaN(lat) || isNaN(lon)) {
        tempErrors.location = 'Please enter valid coordinates';
      } else if (lat < -90 || lat > 90) {
        tempErrors.location = 'Latitude must be between -90 and 90';
      } else if (lon < -180 || lon > 180) {
        tempErrors.location = 'Longitude must be between -180 and 180';
      }
    }
    
    if (!form.description.trim()) {
      tempErrors.description = 'Description is required';
    } else if (form.description.trim().length < 10) {
      tempErrors.description = 'Description must be at least 10 characters long';
    }
    
    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleChange = (key: keyof FormType, value: any) => {
    setForm({ ...form, [key]: value });
    // Clear error when user starts typing
    if (errors[key as keyof ErrorType]) {
      setErrors({ ...errors, [key as keyof ErrorType]: undefined });
    }
  };

  const handleLocation = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Location permission is required to auto-fill coordinates');
        return;
      }
      
      setLoading(true);
      let loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      
      setForm({ 
        ...form, 
        location: { 
          latitude: String(loc.coords.latitude), 
          longitude: String(loc.coords.longitude) 
        } 
      });
      
      // Clear location error if it exists
      if (errors.location) {
        setErrors({ ...errors, location: undefined });
      }
    } catch (error) {
      console.error('Location error:', error);
      Alert.alert('Error', 'Failed to get current location. Please enter coordinates manually.');
    } finally {
      setLoading(false);
    }
  };

  const handleFilePick = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ 
        type: '*/*',
        copyToCacheDirectory: true 
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        setForm({
          ...form,
          file: {
            uri: file.uri,
            name: file.name || 'file',
            mimeType: file.mimeType || 'application/octet-stream',
          },
        });
      }
    } catch (error) {
      console.error('File pick error:', error);
      Alert.alert('Error', 'Failed to pick file');
    }
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    
    setLoading(true);
    setErrors({});
    try {
      // Get user token from AsyncStorage
      const token = await AsyncStorage.getItem('accessToken');

      // Prepare incident data in backend format
      const locationData = {
        latitude: parseFloat(form.location.latitude),
        longitude: parseFloat(form.location.longitude),
      };

      const incidentData = {
        incidentType: form.incidentType,
        location: JSON.stringify(locationData), // backend expects JSON string
        description: form.description.trim(),
        reported_at: Date.now(), // send as timestamp (ms since epoch)
      };

      // Use FormData for file upload
      const data = new FormData();
      Object.entries(incidentData).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          // Convert reported_at to string for FormData
          if (key === 'reported_at') {
            data.append(key, String(value));
          } else {
            data.append(key, value as string);
          }
        }
      });
      if (form.file && form.file.uri && form.file.name && form.file.mimeType) {
        data.append('file', {
          uri: form.file.uri,
          name: form.file.name,
          type: form.file.mimeType,
        } as any);
      }

      console.log('Submitting data:', {
        ...incidentData,
        hasFile: !!form.file,
        token,
      });

      const response = await axios.post(`${API_BASE_URL}/api/report-incident/`, data, {
        headers: {
          'Content-Type': 'multipart/form-data',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        timeout: 30000,
      });

      console.log('Response:', response.data);
      Alert.alert(
        'Success',
        response.data.message || 'Incident reported successfully!',
        [{
          text: 'OK',
          onPress: () => {
            setForm({
              incidentType: '',
              location: { latitude: '', longitude: '' },
              description: '',
              file: null
            });
            setErrors({});
          }
        }]
      );
    } catch (err: any) {
      console.error('Submit error:', err);
      let errorMessage = 'Failed to report incident. Please try again.';
      let fieldErrors: ErrorType = {};
      
      if (err.response) {
        console.log('Error response:', err.response.data);
        if (err.response.data) {
          if (typeof err.response.data === 'object' && !err.response.data.error && !err.response.data.message) {
            Object.keys(err.response.data).forEach(key => {
              if (key in fieldErrors || key === 'incidentType' || key === 'location' || key === 'description') {
                fieldErrors[key as keyof ErrorType] = Array.isArray(err.response.data[key])
                  ? err.response.data[key][0]
                  : err.response.data[key];
              }
            });
            if (Object.keys(fieldErrors).length > 0) {
              setErrors(fieldErrors);
              errorMessage = 'Please fix the errors above and try again.';
            }
          } else {
            errorMessage = err.response.data?.error || err.response.data?.message || errorMessage;
          }
        }
      } else if (err.request) {
        errorMessage = 'Network error. Please check your connection and try again.';
      } else if (err.code === 'ECONNABORTED') {
        errorMessage = 'Request timed out. Please try again.';
      }
      
      if (Object.keys(fieldErrors).length === 0) {
        Alert.alert('Error', errorMessage);
      } else {
        Alert.alert('Validation Error', errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const removeFile = () => {
    setForm({ ...form, file: null });
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Report Incident</Text>
      
      <Text style={styles.label}>Incident Type *</Text>
      <View style={styles.dropdownBox}>
        {INCIDENT_TYPES.map(type => (
          <TouchableOpacity
            key={type}
            style={[styles.dropdownItem, form.incidentType === type && styles.selectedDropdown]}
            onPress={() => handleChange('incidentType', type)}
          >
            <Text style={[styles.dropdownText, form.incidentType === type && styles.selectedDropdownText]}>
              {type}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      {errors.incidentType && <Text style={styles.error}>{errors.incidentType}</Text>}

      <Text style={styles.label}>Location *</Text>
      <View style={styles.locationBox}>
        <TextInput
          style={[styles.input, styles.locationInput]}
          placeholder="Latitude (e.g., 19.0760)"
          value={form.location.latitude}
          onChangeText={val => setForm({ ...form, location: { ...form.location, latitude: val } })}
          keyboardType="numeric"
          placeholderTextColor="#bbb"
        />
        <TextInput
          style={[styles.input, styles.locationInput]}
          placeholder="Longitude (e.g., 72.8777)"
          value={form.location.longitude}
          onChangeText={val => setForm({ ...form, location: { ...form.location, longitude: val } })}
          keyboardType="numeric"
          placeholderTextColor="#bbb"
        />
      </View>
      <TouchableOpacity 
        style={[styles.locButton, loading && styles.disabledButton]} 
        onPress={handleLocation}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Getting Location...' : 'Use My Location'}
        </Text>
      </TouchableOpacity>
      {errors.location && <Text style={styles.error}>{errors.location}</Text>}

      <Text style={styles.label}>Description *</Text>
      <TextInput
        style={[styles.input, styles.descriptionInput]}
        placeholder="Describe the incident in detail... (minimum 10 characters)"
        value={form.description}
        onChangeText={val => handleChange('description', val)}
        multiline
        textAlignVertical="top"
        placeholderTextColor="#bbb"
      />
      {errors.description && <Text style={styles.error}>{errors.description}</Text>}

      <TouchableOpacity style={styles.fileButton} onPress={handleFilePick}>
        <Text style={styles.buttonText}>
          {form.file ? 'Change File' : 'Attach File (optional)'}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.cameraButton} onPress={handleTakePhoto}>
        <Text style={styles.buttonText}>Take Photo</Text>
      </TouchableOpacity>
      
      {form.file && (
        <View style={styles.fileInfo}>
          <Text style={styles.fileName}>{form.file.name || 'File attached'}</Text>
          <TouchableOpacity onPress={removeFile} style={styles.removeFileButton}>
            <Text style={styles.removeFileText}>Remove</Text>
          </TouchableOpacity>
        </View>
      )}

      {errors.general && <Text style={styles.error}>{errors.general}</Text>}

      <TouchableOpacity 
        style={[styles.submitButton, loading && styles.disabledButton]} 
        onPress={handleSubmit} 
        disabled={loading}
      >
        <Text style={styles.submitButtonText}>
          {loading ? 'Reporting...' : 'Report Incident'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  cameraButton: {
    backgroundColor: '#0bf',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 8,
    marginTop: 0,
    borderWidth: 1,
    borderColor: '#444',
  },
  container: {
    flexGrow: 1,
    backgroundColor: '#181c24',
    padding: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 24,
    textAlign: 'center',
  },
  label: {
    color: '#bbb',
    fontSize: 16,
    marginBottom: 8,
    marginTop: 16,
    fontWeight: '500',
  },
  dropdownBox: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  dropdownItem: {
    backgroundColor: '#2a2d36',
    padding: 12,
    borderRadius: 8,
    margin: 4,
    borderWidth: 1,
    borderColor: '#333',
  },
  selectedDropdown: {
    backgroundColor: '#0bf',
    borderColor: '#0bf',
  },
  dropdownText: {
    color: '#fff',
    fontSize: 14,
  },
  selectedDropdownText: {
    color: '#fff',
    fontWeight: '600',
  },
  locationBox: {
    marginBottom: 8,
  },
  locationInput: {
    marginBottom: 8,
  },
  input: {
    height: 48,
    borderColor: '#444',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    color: '#fff',
    backgroundColor: 'rgba(42, 45, 54, 0.7)',
  },
  descriptionInput: {
    height: 100,
    paddingTop: 12,
  },
  locButton: {
    backgroundColor: '#0bf',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  fileButton: {
    backgroundColor: '#2a2d36',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 8,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#444',
  },
  fileInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#2a2d36',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  fileName: {
    color: '#0bf',
    fontSize: 14,
    flex: 1,
  },
  removeFileButton: {
    backgroundColor: '#ff5252',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  removeFileText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#0bf',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
    shadowColor: '#0bf',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  disabledButton: {
    backgroundColor: '#666',
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  error: {
    color: '#ff5252',
    fontSize: 14,
    marginTop: 4,
    marginBottom: 8,
  },
});