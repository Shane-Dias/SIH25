import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, KeyboardAvoidingView, Platform, Modal, ActivityIndicator, Image, SafeAreaView } from 'react-native';
import axios from 'axios';
import MapView, { PROVIDER_DEFAULT, Marker, UrlTile } from 'react-native-maps';
import * as Location from 'expo-location';
import { StatusBar } from 'expo-status-bar';

// Make sure this IP matches your Django server's IP and port
const API_BASE_URL = process.env.API_BASE_URL || "http://192.168.1.37:8000";

// Component to display formatted incident information
const IncidentCard = ({ incident, onCommentPress }) => {
  // Format date for display
  const formattedDate = new Date(incident.reported_at).toLocaleString();
  
  // Determine status style and text
  let statusStyle = styles.statusSubmitted;
  let statusText = "Submitted";
  
  if (incident.status === "Resolved") {
    statusStyle = styles.statusResolved;
    statusText = "Resolved";
  } else if (incident.status === "processing") {
    statusStyle = styles.statusProcessing;
    statusText = "In Progress";
  }
  
  // Safely format location data
  const formatLocation = () => {
    if (!incident.location) return "Location not available";
    
    const lat = incident.location.latitude;
    const lng = incident.location.longitude;
    
    if (lat === undefined || lng === undefined) return "Location coordinates incomplete";
    
    try {
      return `${parseFloat(lat).toFixed(4)}, ${parseFloat(lng).toFixed(4)}`;
    } catch (error) {
      return "Invalid location data";
    }
  };
  
  return (
    <View style={styles.incidentCard}>
      <View style={styles.cardHeader}>
        <Text style={styles.incidentType}>{incident.incidentType}</Text>
        <View style={statusStyle}>
          <Text style={styles.statusText}>{statusText}</Text>
        </View>
      </View>
      
      <Text style={styles.description} numberOfLines={2}>{incident.description}</Text>
      <Text style={styles.reportedAt}>Reported: {formattedDate}</Text>
      <Text style={styles.location}>
        Location: {formatLocation()}
      </Text>
      
      <TouchableOpacity 
        style={styles.commentButton} 
        onPress={() => onCommentPress(incident)}
      >
        <Text style={styles.commentButtonText}>View Comments</Text>
      </TouchableOpacity>
    </View>
  );
};

// Component to display comments for an incident
const CommentsSection = ({ comments, onAddComment, incidentId }) => {
  const [commentText, setCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [commentError, setCommentError] = useState(null);
  
  const handleSubmit = async () => {
    if (!commentText.trim()) {
      setCommentError('Please enter a comment');
      return;
    }
    
    setCommentError(null);
    setIsSubmitting(true);
    try {
      const token = await (await import("@react-native-async-storage/async-storage")).default.getItem("accessToken");
      
      if (!token) {
        setCommentError('You need to be logged in to comment');
        setIsSubmitting(false);
        return;
      }
      
      console.log(`Submitting comment to incident ${incidentId}`);
      const response = await axios.post(`${API_BASE_URL}/api/incidents/${incidentId}/comments/`, {
        comment: commentText
      }, {
        headers: { Authorization: `Bearer ${token} `}
      });
      
      if (response.data) {
        console.log('Comment added successfully:', response.data);
        onAddComment(response.data);
        setCommentText('');
      } else {
        setCommentError('Server returned an invalid response');
      }
    } catch (error) {
      console.error('Error submitting comment:', error);
      setCommentError(error.response?.data?.detail || 'Failed to post comment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <View style={styles.commentsContainer}>
      <Text style={styles.commentsHeader}>Comments</Text>
      
      {comments && comments.length > 0 ? (
        <FlatList
          data={comments}
          keyExtractor={(item, index) => `comment-${index}`}
          renderItem={({ item }) => (
            <View style={styles.commentItem}>
              <Text style={styles.commentAuthor}>
                {item.commented_by?.first_name || 'Anonymous'} {item.commented_by?.last_name || ''}
              </Text>
              <Text style={styles.commentText}>{item.comment}</Text>
              <Text style={styles.commentDate}>
                {new Date(item.commented_at || Date.now()).toLocaleString()}
              </Text>
            </View>
          )}
          style={styles.commentsList}
        />
      ) : (
        <Text style={styles.noCommentsText}>No comments yet</Text>
      )}
      
      {/* Comment input area */}
      <View style={styles.commentInputContainer}>
        {commentError && (
          <Text style={styles.commentErrorText}>{commentError}</Text>
        )}
        
        <View style={styles.commentInputRow}>
          <TextInput
            style={styles.commentInput}
            value={commentText}
            onChangeText={(text) => {
              setCommentText(text);
              if (commentError) setCommentError(null);
            }}
            placeholder="Add a comment..."
            placeholderTextColor="#a0aec0"
            multiline={true}
            numberOfLines={2}
          />
          <TouchableOpacity 
            style={[
              styles.sendCommentBtn,
              (!commentText.trim() || isSubmitting) && styles.sendCommentBtnDisabled
            ]} 
            onPress={handleSubmit}
            disabled={isSubmitting || !commentText.trim()}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.sendCommentText}>Send</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default function RecentIncident1() {
  // State variables
  const [incidents, setIncidents] = useState([]);
  const [allIncidents, setAllIncidents] = useState([]); // Keep a copy of all incidents for filtering
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [showMapModal, setShowMapModal] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [locationPermissionStatus, setLocationPermissionStatus] = useState(null);
  const [selectedMapLocation, setSelectedMapLocation] = useState(null);
  const [mapRadius, setMapRadius] = useState(10); // in km for filtering
  
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  
  // Handle map press for location selection
  const handleMapPress = (event) => {
    // Extract coordinates from press event
    const { coordinate } = event.nativeEvent;
    console.log("Map pressed at:", coordinate);
    
    // Update selected location
    setSelectedMapLocation(coordinate);
    
    // Filter incidents based on this location
    filterIncidentsByMapPoint(coordinate.latitude, coordinate.longitude);
  };
  
  // Filter incidents by a specific map point
  const filterIncidentsByMapPoint = (lat, lng) => {
    setError(null);
    console.log(`Filtering incidents near ${lat}, ${lng} within ${mapRadius}km`);
    
    try {
      const filtered = allIncidents.filter(incident => {
        // Check if location data exists and has valid coordinates
        if (!incident.location) return false;
        
        const incidentLat = incident.location.latitude;
        const incidentLng = incident.location.longitude;
        
        if (incidentLat === undefined || incidentLat === null || 
            incidentLng === undefined || incidentLng === null) return false;
        
        try {
          const distance = calculateDistance(
            lat,
            lng,
            parseFloat(incidentLat),
            parseFloat(incidentLng)
          );
          
          return distance <= mapRadius; // Show incidents within radius
        } catch (error) {
          console.error('Error calculating distance:', error);
          return false;
        }
      });
      
      if (filtered.length > 0) {
        setIncidents(filtered);
      } else {
        // Keep showing the incidents but notify user
        setError(`No incidents found within ${mapRadius}km of selected location.`);
      }
    } catch (error) {
      console.error("Error filtering by map location:", error);
      setError('Failed to filter incidents by location.');
    }
  };
  
  // Request location permissions and get current location
  useEffect(() => {
    (async () => {
      console.log("Requesting location permissions...");
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        console.log("Location permission status:", status);
        setLocationPermissionStatus(status);
        
        if (status === 'granted') {
          console.log("Getting current position...");
          const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
            timeout: 15000
          });
          console.log("Current position obtained:", location.coords);
          
          setCurrentLocation({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421,
          });
        } else {
          console.log("Location permission denied, using default location");
          // Default location (India) if permission not granted
          setCurrentLocation({
            latitude: 22.9734,
            longitude: 78.6569,
            latitudeDelta: 10,
            longitudeDelta: 10,
          });
        }
      } catch (err) {
        console.error('Error in location services:', err);
        // Default to India location if user location unavailable
        setCurrentLocation({
          latitude: 22.9734,
          longitude: 78.6569,
          latitudeDelta: 10,
          longitudeDelta: 10,
        });
        
        // Show error to user
        setError('Unable to access your location. Please check your device settings.');
      }
    })();
  }, []);
  
  // Fetch incidents from API
  useEffect(() => {
    fetchIncidents();
  }, []);
  
  const fetchIncidents = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await (await import("@react-native-async-storage/async-storage")).default.getItem("accessToken");
      
      const response = await axios.get(`${API_BASE_URL}/api/latest-incidents/`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      
      if (response.data && Array.isArray(response.data)) {
        // Validate and sanitize incident data before setting state
        const validatedIncidents = response.data.map(incident => {
          // Ensure incident has an id
          if (!incident.id) {
            incident.id = `temp-${Math.random().toString(36).substr(2, 9)}`;
          }
          
          // Validate location data
          if (incident.location) {
            // Ensure we have proper location object format
            if (typeof incident.location === 'string') {
              try {
                incident.location = JSON.parse(incident.location);
              } catch (e) {
                // If parsing fails, create a default location object
                incident.location = { latitude: null, longitude: null };
              }
            }
            
            // Ensure location has latitude and longitude properties
            if (!('latitude' in incident.location)) incident.location.latitude = null;
            if (!('longitude' in incident.location)) incident.location.longitude = null;
          } else {
            incident.location = { latitude: null, longitude: null };
          }
          
          // Ensure other required properties exist
          if (!incident.incidentType) incident.incidentType = "Unknown";
          if (!incident.description) incident.description = "No description provided";
          if (!incident.status) incident.status = "submitted";
          if (!incident.reported_at) incident.reported_at = new Date().toISOString();
          if (!incident.comments) incident.comments = [];
          
          return incident;
        });
        
        setIncidents(validatedIncidents);
        setAllIncidents(validatedIncidents); // Store a copy of all incidents for filtering
      } else {
        console.warn('API response format unexpected:', response.data);
        setIncidents([]);
        setError('No incidents found or invalid data format.');
      }
    } catch (err) {
      console.error('Error fetching incidents:', err);
      setIncidents([]);
      setError('Failed to load incidents. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle adding a new comment
  const handleAddComment = (newComment) => {
    // Find the incident and add the comment to it
    setIncidents(prevIncidents => 
      prevIncidents.map(inc => 
        inc.id === selectedIncident.id 
          ? { 
              ...inc, 
              comments: [...(inc.comments || []), newComment] 
            } 
          : inc
      )
    );
    
    // Update the selected incident with the new comment
    setSelectedIncident(prev => ({
      ...prev,
      comments: [...(prev.comments || []), newComment]
    }));
  };
  
  // Calculate distance between two coordinates in km
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const toRad = (value) => (value * Math.PI) / 180;
    const R = 6371; // Earth's radius in km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };
  
  // Filter incidents by current location (within 10km)
  const filterIncidentsByLocation = async () => {
    setError(null);
    
    // First check if we have location permission
    if (locationPermissionStatus !== 'granted') {
      console.log("Requesting location permission again...");
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setError('Location permission is required to find nearby incidents.');
          return;
        }
        setLocationPermissionStatus(status);
      } catch (error) {
        console.error("Error requesting permission:", error);
        setError('Failed to request location permissions.');
        return;
      }
    }
    
    // Start showing loading indicator
    setLoading(true);
    
    try {
      // Get fresh current location
      console.log("Getting fresh current position...");
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
        timeout: 15000
      });
      
      const userLocation = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      };
      
      console.log("Fresh position obtained:", userLocation);
      setCurrentLocation(userLocation);
      
      // Now filter incidents based on this fresh location
      const filtered = incidents.filter(incident => {
        // Check if location data exists and has valid coordinates
        if (!incident.location) return false;
        
        const lat = incident.location.latitude;
        const lng = incident.location.longitude;
        
        if (lat === undefined || lat === null || lng === undefined || lng === null) return false;
        
        try {
          const distance = calculateDistance(
            userLocation.latitude,
            userLocation.longitude,
            parseFloat(lat),
            parseFloat(lng)
          );
          
          return distance <= 10; // Show incidents within 10km
        } catch (error) {
          console.error('Error calculating distance:', error);
          return false;
        }
      });
      
      if (filtered.length > 0) {
        setIncidents(filtered);
        // If map is open, zoom to current location
        if (mapRef.current) {
          mapRef.current.animateToRegion({
            ...userLocation,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05
          }, 1000);
        }
      } else {
        // Keep original incidents but show error message
        setError('No incidents found within 10km of your location.');
      }
    } catch (error) {
      console.error("Error filtering by location:", error);
      setError('Failed to get your current location. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Reset filters to show all incidents
  const resetFilters = () => {
    setError(null);
    setSelectedMapLocation(null); // Clear selected map location
    setIncidents(allIncidents); // Restore all incidents from our copy
    
    // If map is open and we have a default location, reset the view
    if (mapRef.current && currentLocation) {
      mapRef.current.animateToRegion(currentLocation, 1000);
    }
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="auto" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerText}>Recent Incidents</Text>
      </View>
      
      {/* Filter Buttons */}
      <View style={styles.filterContainer}>
        <TouchableOpacity 
          style={styles.filterButton} 
          onPress={filterIncidentsByLocation}
          disabled={!currentLocation || loading}
        >
          <Text style={styles.filterButtonText}>
            Nearby Incidents
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.filterButton}
          onPress={() => setShowMapModal(true)}
        >
          <Text style={styles.filterButtonText}>
            Show Map
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.resetButton}
          onPress={resetFilters}
        >
          <Text style={styles.resetButtonText}>
            Reset
          </Text>
        </TouchableOpacity>
      </View>
      
      {/* Loading State */}
      {loading && (
        <View style={styles.centeredContent}>
          <ActivityIndicator size="large" color="#0bf" />
          <Text style={styles.loadingText}>Loading incidents...</Text>
        </View>
      )}
      
      {/* Error State */}
      {error && !loading && (
        <View style={styles.centeredContent}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchIncidents}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}
      
      {/* Incidents List */}
      {!loading && !error && incidents.length > 0 && (
        <FlatList
          data={incidents}
          keyExtractor={item => item.id.toString()}
          renderItem={({ item }) => (
            <IncidentCard 
              incident={item} 
              onCommentPress={(incident) => {
                setSelectedIncident(incident);
                setShowCommentsModal(true);
              }}
            />
          )}
          contentContainerStyle={styles.incidentsList}
        />
      )}
      
      {/* Empty State */}
      {!loading && !error && incidents.length === 0 && (
        <View style={styles.centeredContent}>
          <Text style={styles.emptyText}>No incidents found.</Text>
        </View>
      )}
      
      {/* Comments Modal */}
      <Modal
        visible={showCommentsModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCommentsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setShowCommentsModal(false)}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
            
            {selectedIncident && (
              <CommentsSection 
                comments={selectedIncident.comments || []} 
                onAddComment={handleAddComment}
                incidentId={selectedIncident.id}
              />
            )}
          </View>
        </View>
      </Modal>
      
      {/* Map Modal */}
      <Modal
        visible={showMapModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowMapModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.mapModalContent}>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setShowMapModal(false)}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
            
            {currentLocation ? (
              <View style={styles.mapContainer}>
                <MapView
                  ref={mapRef}
                  style={styles.map}
                  provider={PROVIDER_DEFAULT}
                  initialRegion={currentLocation}
                  showsUserLocation={locationPermissionStatus === 'granted'}
                  showsMyLocationButton={true}
                  onPress={handleMapPress}
                >
                  {/* OpenStreetMap tiles */}
                  <UrlTile
                    urlTemplate="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
                    maximumZ={19}
                    flipY={false}
                  />
                  
                  {/* User selected location marker */}
                  {selectedMapLocation && (
                    <Marker
                      key="selected-location"
                      coordinate={selectedMapLocation}
                      pinColor="blue"
                    >
                      <View style={{
                        width: 30,
                        height: 30,
                        borderRadius: 15,
                        backgroundColor: 'rgba(0, 0, 255, 0.3)',
                        borderWidth: 2,
                        borderColor: 'blue',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                        <View style={{
                          width: 15,
                          height: 15,
                          borderRadius: 7.5,
                          backgroundColor: 'blue',
                        }} />
                      </View>
                    </Marker>
                  )}
                  
                  {/* Incident markers */}
                  {incidents.map((incident) => {
                    // Skip incidents without valid location data
                    if (!incident.location) return null;
                    
                    const lat = incident.location.latitude;
                    const lng = incident.location.longitude;
                    
                    // Skip if coordinates are missing or invalid
                    if (lat === undefined || lng === undefined || 
                        lat === null || lng === null ||
                        isNaN(parseFloat(lat)) || isNaN(parseFloat(lng))) {
                      return null;
                    }
                    
                    try {
                      const latitude = parseFloat(lat);
                      const longitude = parseFloat(lng);
                      
                      // Additional validation to ensure coordinates are in valid range
                      if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
                        return null;
                      }
                      
                      return (
                        <Marker
                          key={`incident-${incident.id}`}
                          coordinate={{
                            latitude: latitude,
                            longitude: longitude
                          }}
                          title={incident.incidentType}
                          description={incident.description?.substring(0, 50) + '...'}
                        >
                          <View style={{
                            width: 24,
                            height: 24,
                            borderRadius: 12,
                            backgroundColor: 'rgba(255, 0, 0, 0.3)',
                            borderWidth: 1,
                            borderColor: 'red',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}>
                            <View style={{
                              width: 12,
                              height: 12,
                              borderRadius: 6,
                              backgroundColor: 'red',
                            }} />
                          </View>
                        </Marker>
                      );
                    } catch (error) {
                      console.error('Error rendering marker:', error);
                      return null;
                    }
                  })}
                </MapView>
              </View>
            ) : (
              <View style={styles.centeredContent}>
                <ActivityIndicator size="large" color="#0bf" />
                <Text style={styles.loadingText}>Loading map...</Text>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f8ff',
  },
  header: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: '#0bf',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  headerText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e3f0ff',
    backgroundColor: 'white',
  },
  filterButton: {
    backgroundColor: '#0bf',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1.5,
  },
  filterButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  resetButton: {
    backgroundColor: '#f0f4f8',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#d0d7de',
  },
  resetButtonText: {
    color: '#5a6a85',
  },
  centeredContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  loadingText: {
    marginTop: 12,
    color: '#5a6a85',
    fontSize: 16,
  },
  errorText: {
    color: '#e53e3e',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#0bf',
    paddingVertical: 8,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  emptyText: {
    color: '#5a6a85',
    fontSize: 16,
  },
  incidentsList: {
    padding: 12,
  },
  incidentCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  incidentType: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e3a8a',
  },
  statusSubmitted: {
    backgroundColor: '#fee2e2',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  statusProcessing: {
    backgroundColor: '#fef3c7',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  statusResolved: {
    backgroundColor: '#d1fae5',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  description: {
    color: '#334155',
    marginBottom: 8,
  },
  reportedAt: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 4,
  },
  location: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 12,
  },
  commentButton: {
    backgroundColor: '#e0f2fe',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  commentButtonText: {
    color: '#0369a1',
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  mapModalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    width: '90%',
    height: '80%',
  },
  closeButton: {
    alignSelf: 'flex-end',
    padding: 8,
  },
  closeButtonText: {
    fontSize: 20,
    color: '#64748b',
  },
  commentsContainer: {
    flex: 1,
  },
  commentsHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#1e3a8a',
  },
  commentsList: {
    maxHeight: 300,
  },
  commentItem: {
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  commentAuthor: {
    fontWeight: '600',
    color: '#0369a1',
    marginBottom: 4,
  },
  commentText: {
    color: '#334155',
    marginBottom: 4,
  },
  commentDate: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'right',
  },
  noCommentsText: {
    color: '#64748b',
    textAlign: 'center',
    padding: 16,
  },
  commentInputContainer: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e3e8ef',
    paddingTop: 12,
  },
  commentErrorText: {
    color: '#e53e3e',
    fontSize: 12,
    marginBottom: 6,
    textAlign: 'center',
  },
  commentInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  commentInput: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    padding: 10,
    marginRight: 8,
    color: '#334155',
    maxHeight: 80,
  },
  sendCommentBtn: {
    backgroundColor: '#0bf',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 70,
  },
  sendCommentBtnDisabled: {
    backgroundColor: '#a0aec0',
    opacity: 0.6,
  },
  sendCommentText: {
    color: 'white',
    fontWeight: '600',
  },
  mapContainer: {
    flex: 1,
    borderRadius: 8,
    overflow: 'hidden',
    marginTop: 8,
  },
  map: {
    width: '100%',
    height: '100%',
  },
});