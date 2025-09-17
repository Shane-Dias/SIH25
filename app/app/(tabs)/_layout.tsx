import { Tabs } from 'expo-router'
import React, { Component } from 'react'
import { Text, StyleSheet, View } from 'react-native'

export default class _layout extends Component {
  render() {
    return (
      <Tabs>
        <Tabs.Screen
          name="index"
          options={{
            headerShown: false,
            title: 'home',
            tabBarLabel: 'Home',
          }}
        />
        <Tabs.Screen
          name="map"
          options={{
            headerShown: false,
            title: 'Map',
            tabBarLabel: 'Map',
          }}
        />
        <Tabs.Screen
          name="report"
          options={{
            headerShown: false,
            title: 'Report',
            tabBarLabel: 'Report',
          }}
        />
        <Tabs.Screen
          name="recentincident1"
          options={{
            headerShown: false,
            title: 'Recent',
            tabBarLabel: 'Recent',
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            headerShown: false,
            title: 'Profile',
            tabBarLabel: 'Profile',
          }}
        />
        <Tabs.Screen
          name="incident-detail"
          options={{
            headerShown: false,
            tabBarButton: () => null, // Remove tab button entirely
          }}
        />
      </Tabs>
    )
  }
}

const styles = StyleSheet.create({})
