import { Stack } from "expo-router";
import './global.css'

import ChatBotScreen from "./ChatBotScreen";
export default function RootLayout() {
  return <Stack>

    <Stack.Screen
      name="(tabs)"
      options={{
        headerShown: false,
      }}
    />
    <Stack.Screen
      name="index"
      options={{
        headerShown: false,
      }}
    />
    <Stack.Screen name="ChatBotScreen" 
     options={{ 
      headerShown: false,
      title: 'Chatbot' 
      }} />
    </Stack>;
}
