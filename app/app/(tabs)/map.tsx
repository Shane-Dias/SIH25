import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Dimensions, ActivityIndicator } from 'react-native';
import MapView, { PROVIDER_DEFAULT, Marker, UrlTile } from 'react-native-maps';
import axios from 'axios';

const API_BASE_URL = process.env.API_BASE_URL || "http://192.168.1.37:8000";

export default function IncidentHeatMap() {
  const [points, setPoints] = useState<{ latitude: number; longitude: number; weight?: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchIncidents = async () => {
      setLoading(true);
      try {
        const token = await (await import("@react-native-async-storage/async-storage")).default.getItem("accessToken");
        const response = await axios.get(`${API_BASE_URL}/api/all_user_incidents/`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (response.data && Array.isArray(response.data.incidents)) {
          // Extract lat/lon from each incident
          const heatPoints = response.data.incidents
            .map((incident: any) => {
              if (incident.location && typeof incident.location === 'object' && incident.location.latitude && incident.location.longitude) {
                return {
                  latitude: parseFloat(incident.location.latitude),
                  longitude: parseFloat(incident.location.longitude),
                  weight: 1,
                };
              }
              return null;
            })
            .filter(Boolean);
          setPoints(heatPoints);
        } else {
          setPoints([]);
        }
      } catch (err) {
        setPoints([]);
      } finally {
        setLoading(false);
      }
    };
    fetchIncidents();
  }, []);

  // Default map region (centered on India)
  const initialRegion = {
    latitude: 22.9734,
    longitude: 78.6569,
    latitudeDelta: 10,
    longitudeDelta: 10,
  };

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color="#0bf" style={{ marginTop: 40 }} />
      ) : (
        <MapView
          style={styles.map}
          provider={PROVIDER_DEFAULT}
          initialRegion={initialRegion}
          minZoomLevel={3}
          maxZoomLevel={18}
        >
          {/* OpenStreetMap tiles */}
          <UrlTile
            urlTemplate="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
            maximumZ={19}
            flipY={false}
          />
          {/* Custom heatmap-like markers */}
          {points.length > 0 && points.map((pt, idx) => (
            <Marker
              key={idx}
              coordinate={{ latitude: pt.latitude, longitude: pt.longitude }}
              anchor={{ x: 0.5, y: 0.5 }}
            >
              <View style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: 'rgba(11, 191, 255, 0.25)',
                borderWidth: 0,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <View style={{
                  width: 16,
                  height: 16,
                  borderRadius: 8,
                  backgroundColor: 'rgba(255, 82, 82, 0.5)',
                }} />
              </View>
            </Marker>
          ))}
        </MapView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f8ff',
  },
  map: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
  },
});
