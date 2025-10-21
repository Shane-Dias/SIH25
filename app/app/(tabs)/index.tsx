
import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, ActivityIndicator, StyleSheet, FlatList, TouchableOpacity, Linking, Dimensions, Button } from "react-native";
import { useRouter } from 'expo-router';
import { Picker } from '@react-native-picker/picker';
import axios from "axios";
import { LineChart, PieChart, BarChart } from "react-native-chart-kit";

const API_BASE_URL = process.env.API_BASE_URL || "http://192.168.1.37:8000";


export default function UserDashboard() {
  const router = useRouter();
  const [incidents, setIncidents] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [resolved, setResolved] = useState(0);
  const [unresolved, setUnresolved] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [severityFilter, setSeverityFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [expandedId, setExpandedId] = useState<number|null>(null);
  const [chartData, setChartData] = useState<{ labels: string[]; data: number[] }>({ labels: [], data: [] });
  const [allChartData, setAllChartData] = useState<any>({});

  useEffect(() => {
    const fetchIncidents = async () => {
      setLoading(true);
      setError("");
      try {
        // Get token from AsyncStorage
        const token = await (await import("@react-native-async-storage/async-storage")).default.getItem("accessToken");
        const response = await axios.get(`${API_BASE_URL}/api/all_user_incidents/`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (response.data && Array.isArray(response.data.incidents)) {
          setIncidents(response.data.incidents);
          setTotal(response.data.incidents.length);
          setResolved(response.data.incidents.filter((inci: any) => inci.status === "Resolved").length);
          setUnresolved(response.data.incidents.filter((inci: any) => inci.status !== "Resolved").length);
        } else {
          setError("Unexpected data format from server.");
          console.error("Unexpected data format:", response.data);
        }
      } catch (err: any) {
        setError("Failed to load dashboard data.");
        console.error("Dashboard API error:", err);
      } finally {
        setLoading(false);
      }
    };
    const fetchChartStats = async () => {
      try {
        const token = await (await import("@react-native-async-storage/async-storage")).default.getItem("accessToken");
        const response = await axios.get(`${API_BASE_URL}/api/incident-chart-user/`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        console.log("Chart API response:", response.data); // Debug log
        setAllChartData(response.data);
        // Monthly trend for main chart
        if (response.data.monthly_trend && Array.isArray(response.data.monthly_trend)) {
          const labels = response.data.monthly_trend.map((item: any) => {
            const d = new Date(item.month);
            return d.toLocaleString('default', { month: 'short', year: '2-digit' });
          });
          const data = response.data.monthly_trend.map((item: any) => item.count || 0);
          setChartData({ labels, data });
        } else {
          setChartData({ labels: [], data: [] });
        }
      } catch (err) {
        setChartData({ labels: [], data: [] });
        setAllChartData({});
        console.error("Chart API error:", err);
      }
    };
    fetchIncidents();
    fetchChartStats();
  }, []);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#0bf" />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.error}>{error}</Text>
      </View>
    );
  }

  // Filter incidents based on selected filters
  const filteredIncidents = incidents.filter((incident: any) => {
    const typeMatch = typeFilter ? incident.incidentType === typeFilter : true;
    const severityMatch = severityFilter ? incident.severity === severityFilter : true;
    const statusMatch = statusFilter ? incident.status === statusFilter : true;
    return typeMatch && severityMatch && statusMatch;
  });

  // Get unique values for dropdowns
  const typeOptions = Array.from(new Set(incidents.map((i: any) => i.incidentType))).filter(Boolean);
  const severityOptions = Array.from(new Set(incidents.map((i: any) => i.severity))).filter(Boolean);
  const statusOptions = Array.from(new Set(incidents.map((i: any) => i.status))).filter(Boolean);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Your Dashboard</Text>

      {/* Quick Action Buttons */}
      <View style={{ alignItems: 'center', marginBottom: 12 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 12 }}>
          <TouchableOpacity
            style={{ backgroundColor: '#0bf', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 10 }}
            onPress={() => router.push('../ChatBotScreen')}
          >
            <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Open Chatbot</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={{ backgroundColor: '#ff5252', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 10 }}
            onPress={() => router.push('/(tabs)/recentincident1')}
          >
            <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Recent Incidents</Text>
          </TouchableOpacity>
        </View>
      </View>
      {/* Dashboard Stats Cards - now vertical */}

      {/* Dashboard Stats Cards - now vertical */}
      <View style={{ marginBottom: 18 }}>
        <View style={[styles.card, { borderColor: '#ff5252', borderWidth: 2, marginBottom: 8 }]}> 
          <Text style={styles.cardTitle}>Total Incidents</Text>
          <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#0b2340' }}>{total}</Text>
        </View>
        <View style={[styles.card, { borderColor: '#4ade80', borderWidth: 2, marginBottom: 8 }]}> 
          <Text style={styles.cardTitle}>Resolved</Text>
          <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#0b2340' }}>{resolved}</Text>
        </View>
        <View style={[styles.card, { borderColor: '#fde047', borderWidth: 2 }]}> 
          <Text style={styles.cardTitle}>Unresolved</Text>
          <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#0b2340' }}>{unresolved}</Text>
        </View>
      </View>

      {/* Filters - improved UI */}
      <View style={{ marginBottom: 16 }}>
        <Text style={{ fontWeight: '700', color: '#0b2340', fontSize: 15, marginBottom: 8, textAlign: 'center' }}>Filter Incidents</Text>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
          <View style={{ flex: 1, marginRight: 4, backgroundColor: '#fff', borderRadius: 10, borderWidth: 1, borderColor: '#0bf', padding: 6 }}>
            <Text style={{ fontWeight: '600', color: '#0b2340', marginBottom: 2, fontSize: 14 }}>Type</Text>
            <Picker
              selectedValue={typeFilter}
              onValueChange={setTypeFilter}
              style={{ backgroundColor: '#e3f0ff', borderRadius: 8, height: 36, fontSize: 15, color: '#0b2340' }}
              itemStyle={{ fontSize: 15, color: '#0b2340' }}
            >
              <Picker.Item label="All" value="" color="#0b2340" />
              {typeOptions.map((type) => (
                <Picker.Item key={type} label={type} value={type} color="#0b2340" />
              ))}
            </Picker>
          </View>
          <View style={{ flex: 1, marginHorizontal: 4, backgroundColor: '#fff', borderRadius: 10, borderWidth: 1, borderColor: '#0bf', padding: 6 }}>
            <Text style={{ fontWeight: '600', color: '#0b2340', marginBottom: 2, fontSize: 14 }}>Severity</Text>
            <Picker
              selectedValue={severityFilter}
              onValueChange={setSeverityFilter}
              style={{ backgroundColor: '#e3f0ff', borderRadius: 8, height: 36, fontSize: 15, color: '#0b2340' }}
              itemStyle={{ fontSize: 15, color: '#0b2340' }}
            >
              <Picker.Item label="All" value="" color="#0b2340" />
              {severityOptions.map((sev) => (
                <Picker.Item key={sev} label={sev} value={sev} color="#0b2340" />
              ))}
            </Picker>
          </View>
          <View style={{ flex: 1, marginLeft: 4, backgroundColor: '#fff', borderRadius: 10, borderWidth: 1, borderColor: '#0bf', padding: 6 }}>
            <Text style={{ fontWeight: '600', color: '#0b2340', marginBottom: 2, fontSize: 14 }}>Status</Text>
            <Picker
              selectedValue={statusFilter}
              onValueChange={setStatusFilter}
              style={{ backgroundColor: '#e3f0ff', borderRadius: 8, height: 36, fontSize: 15, color: '#0b2340' }}
              itemStyle={{ fontSize: 15, color: '#0b2340' }}
            >
              <Picker.Item label="All" value="" color="#0b2340" />
              {statusOptions.map((status) => (
                <Picker.Item key={status} label={status} value={status} color="#0b2340" />
              ))}
            </Picker>
          </View>
        </View>
      </View>

      {/* All Incidents Cards */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>All Incidents</Text>
        {filteredIncidents.length === 0 ? (
          <Text style={styles.typeName}>No incidents found.</Text>
        ) : (
          filteredIncidents.map((incident: any) => {
            let locationStr = "";
            let mapsUrl = "";
            if (typeof incident.location === "string") {
              locationStr = incident.location;
              const match = locationStr.match(/([\d.-]+)[, ]+([\d.-]+)/);
              if (match) {
                mapsUrl = `https://www.google.com/maps?q=${match[1]},${match[2]}`;
              }
            } else if (incident.location && typeof incident.location === "object") {
              locationStr = `${incident.location.latitude}, ${incident.location.longitude}`;
              mapsUrl = `https://www.google.com/maps?q=${incident.location.latitude},${incident.location.longitude}`;
            }
            const isExpanded = expandedId === incident.id;
            return (
              <TouchableOpacity
                key={incident.id}
                style={[styles.incidentCard, isExpanded && styles.incidentCardExpanded]}
                activeOpacity={0.8}
                onPress={() => setExpandedId(isExpanded ? null : incident.id)}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={styles.incidentType}>{incident.incidentType}</Text>
                  <Text style={[styles.incidentSeverity, { marginLeft: 8 }]}>{incident.severity}</Text>
                  <Text style={[styles.incidentStatus, { marginLeft: 8 }]}>{incident.status}</Text>
                </View>
                {isExpanded && (
                  <View style={{ marginTop: 8 }}>
                    <Text style={styles.incidentDesc}>{incident.description}</Text>
                    <Text style={styles.incidentDate}>{new Date(incident.reported_at).toLocaleString()}</Text>
                    {mapsUrl ? (
                      <Text
                        style={styles.incidentLocationLink}
                        onPress={() => Linking.openURL(mapsUrl)}
                      >
                        View Location on Google Maps
                      </Text>
                    ) : (
                      <Text style={styles.incidentDesc}>Location: {locationStr}</Text>
                    )}
                    
                    {/* View Details Button */}
                    <TouchableOpacity
                      style={{
                        backgroundColor: '#0bf',
                        paddingVertical: 8,
                        paddingHorizontal: 12,
                        borderRadius: 8,
                        marginTop: 10,
                        alignSelf: 'flex-start',
                      }}
                      onPress={() => router.push({
                        pathname: '/(tabs)/incident-detail',
                        params: { id: incident.id }
                      })}
                    >
                      <Text style={{ color: '#fff', fontWeight: 'bold' }}>View Details</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </TouchableOpacity>
            );
          })
        )}
      </View>

      {/* --- All Charts Section (at the end) --- */}
      <View style={{ marginBottom: 24 }}>
        <Text style={{ fontSize: 22, fontWeight: 'bold', color: '#0b2340', marginBottom: 12, textAlign: 'center' }}>Analytics & Trends</Text>

        {/* Incident Trend Bar Chart */}
        {allChartData.monthly_trend && allChartData.monthly_trend.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Incident Trend (Monthly)</Text>
            <BarChart
              data={{
                labels: allChartData.monthly_trend.map((item: any) => {
                  const d = new Date(item.month);
                  return d.toLocaleString('default', { month: 'short', year: '2-digit' });
                }),
                datasets: [{ data: allChartData.monthly_trend.map((item: any) => item.count || 0) }],
              }}
              width={Dimensions.get("window").width - 48}
              height={180}
              yAxisLabel=""
              yAxisSuffix=""
              chartConfig={{
                backgroundColor: "#fff",
                backgroundGradientFrom: "#e3f0ff",
                backgroundGradientTo: "#f5f8ff",
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(11, 35, 64, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(11, 35, 64, ${opacity})`,
                style: { borderRadius: 16 },
              }}
              style={{ marginVertical: 8, borderRadius: 12 }}
            />
          </View>
        )}

        {/* Score Trend Line Chart */}
        {allChartData.score_trend && allChartData.score_trend.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Score Trend</Text>
            <LineChart
              data={{
                labels: allChartData.score_trend.map((item: any) => {
                  const d = new Date(item.month);
                  return d.toLocaleString('default', { month: 'short', year: '2-digit' });
                }),
                datasets: [{ data: allChartData.score_trend.map((item: any) => item.avg_score || 0) }],
              }}
              width={Dimensions.get("window").width - 48}
              height={180}
              yAxisLabel=""
              yAxisSuffix=""
              chartConfig={{
                backgroundColor: "#fff",
                backgroundGradientFrom: "#e3f0ff",
                backgroundGradientTo: "#f5f8ff",
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(11, 35, 64, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(11, 35, 64, ${opacity})`,
                style: { borderRadius: 16 },
                propsForDots: { r: "5", strokeWidth: "2", stroke: "#0bf" },
              }}
              bezier
              style={{ marginVertical: 8, borderRadius: 12 }}
            />
          </View>
        )}

        {/* Incident Type Distribution Pie Chart */}
        {allChartData.incident_types && allChartData.incident_types.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Incident Type Distribution</Text>
            <PieChart
              data={allChartData.incident_types.map((item: any, idx: number) => ({
                name: item.incidentType,
                count: item.count,
                color: ["#0bf", "#4ade80", "#fde047", "#ff5252", "#0b2340", "#888"][idx % 6],
                legendFontColor: "#0b2340",
                legendFontSize: 14,
              }))}
              width={Dimensions.get("window").width - 48}
              height={180}
              chartConfig={{
                color: () => `#0b2340`,
              }}
              accessor="count"
              backgroundColor="transparent"
              paddingLeft="15"
              absolute
            />
          </View>
        )}

        {/* Severity Distribution Pie Chart */}
        {allChartData.severity_distribution && allChartData.severity_distribution.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Severity Distribution</Text>
            <PieChart
              data={allChartData.severity_distribution.map((item: any, idx: number) => ({
                name: item.severity,
                count: item.count,
                color: ["#4ade80", "#fde047", "#ff5252", "#0bf", "#0b2340", "#888"][idx % 6],
                legendFontColor: "#0b2340",
                legendFontSize: 14,
              }))}
              width={Dimensions.get("window").width - 48}
              height={180}
              chartConfig={{
                color: () => `#0b2340`,
              }}
              accessor="count"
              backgroundColor="transparent"
              paddingLeft="15"
              absolute
            />
          </View>
        )}

        {/* Status Distribution Pie Chart */}
        {allChartData.status_distribution && allChartData.status_distribution.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Status Distribution</Text>
            <PieChart
              data={allChartData.status_distribution.map((item: any, idx: number) => ({
                name: item.status,
                count: item.count,
                color: ["#fde047", "#4ade80", "#ff5252", "#0bf", "#0b2340", "#888"][idx % 6],
                legendFontColor: "#0b2340",
                legendFontSize: 14,
              }))}
              width={Dimensions.get("window").width - 48}
              height={180}
              chartConfig={{
                color: () => `#0b2340`,
              }}
              accessor="count"
              backgroundColor="transparent"
              paddingLeft="15"
              absolute
            />
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f8ff',
    padding: 16,
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
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#0b2340',
    marginBottom: 18,
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 18,
    shadowColor: '#0bf',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#0b2340',
    marginBottom: 10,
  },
  stat: {
    fontSize: 16,
    color: '#333',
    marginBottom: 6,
  },
  trendItem: {
    backgroundColor: '#e3f0ff',
    borderRadius: 8,
    padding: 8,
    marginRight: 8,
    alignItems: 'center',
    minWidth: 80,
  },
  trendMonth: {
    fontSize: 14,
    color: '#0b2340',
    fontWeight: '500',
  },
  trendCount: {
    fontSize: 16,
    color: '#0bf',
    fontWeight: 'bold',
  },
  typeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  typeName: {
    fontSize: 15,
    color: '#0b2340',
  },
  typeCount: {
    fontSize: 15,
    color: '#0bf',
    fontWeight: 'bold',
  },
  incidentCard: {
    backgroundColor: '#f0f6ff',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#e3f0ff',
  },
  incidentCardExpanded: {
    backgroundColor: '#e3f0ff',
    borderColor: '#0bf',
    elevation: 4,
  },
  incidentType: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0b2340',
  },
  incidentSeverity: {
    fontSize: 13,
    color: '#ff5252',
    fontWeight: '600',
  },
  incidentStatus: {
    fontSize: 13,
    color: '#0b2340',
    fontWeight: '600',
  },
  incidentDesc: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  incidentDate: {
    fontSize: 12,
    color: '#888',
    marginBottom: 2,
  },
  incidentLocationLink: {
    fontSize: 14,
    color: '#0b72e3',
    textDecorationLine: 'underline',
    marginTop: 4,
  },
});
