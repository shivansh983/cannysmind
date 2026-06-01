import { Platform } from 'react-native';

const LOCAL_WIFI_IP = '192.168.29.152'; 
const BACKEND_PORT = '8000'; 

let BASE_URL = `http://${LOCAL_WIFI_IP}:${BACKEND_PORT}/api`;

if (Platform.OS === 'android') {
  BASE_URL = `http://10.0.2.2:${BACKEND_PORT}/api`;
} 

if (Platform.OS === 'web') {
  BASE_URL = `http://localhost:${BACKEND_PORT}/api`;
}

export const API_URL = BASE_URL;