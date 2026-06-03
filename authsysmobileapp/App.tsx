import React, { useState, useRef, useEffect, createContext, useContext } from 'react';
import {
  View, Text, TextInput, TextInputProps, TouchableOpacity,
  TouchableWithoutFeedback, StyleSheet, Alert, KeyboardAvoidingView,
  Platform, FlatList, ScrollView, Animated, StatusBar, SafeAreaView,
  useColorScheme, ActivityIndicator, ViewStyle, Modal, RefreshControl,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Svg, { Path, Circle, Rect, Line, Polyline } from 'react-native-svg';

// ─── API ────────────

const API_BASE = 'http://10.0.2.2:8000/api';

const buildHeaders = (cookie: string) => {
  const clientId = cookie.split('.')[0];
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${cookie}`,
    'client-id': clientId,
  };
};

const api = {
  post: async (path: string, body: object): Promise<any> => {
    const res = await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return res.json();
  },
  authGet: async (path: string, cookie: string): Promise<any> => {
    const res = await fetch(`${API_BASE}${path}`, { headers: buildHeaders(cookie) });
    return res.json();
  },
  authPost: async (path: string, body: object, cookie: string): Promise<any> => {
    const res = await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers: buildHeaders(cookie),
      body: JSON.stringify(body),
    });
    return res.json();
  },
  authPatch: async (path: string, body: object, cookie: string): Promise<any> => {
    const res = await fetch(`${API_BASE}${path}`, {
      method: 'PATCH',
      headers: buildHeaders(cookie),
      body: JSON.stringify(body),
    });
    return res.json();
  },
};

// ─── THEME ───────────────

const LIGHT = {
  bg: '#ffffff', bgSecondary: '#fafafa', bgTertiary: '#f4f4f5',
  surface: '#ffffff', border: '#e4e4e7', borderStrong: '#d4d4d8',
  text: '#09090b', textSecondary: '#52525b', textMuted: '#a1a1aa',
  accent: '#09090b', accentText: '#fafafa', accentMuted: '#f4f4f5',
  success: '#16a34a', successBg: '#f0fdf4',
  warning: '#d97706', warningBg: '#fffbeb',
  danger: '#dc2626', dangerBg: '#fef2f2',
  blue: '#2563eb', blueBg: '#eff6ff',
  purple: '#7c3aed', purpleBg: '#f5f3ff',
  card: '#ffffff', cardBorder: '#e4e4e7',
  inputBg: '#fafafa', tabBar: '#ffffff', tabBorder: '#e4e4e7',
};

const DARK = {
  bg: '#09090b', bgSecondary: '#111113', bgTertiary: '#18181b',
  surface: '#111113', border: '#27272a', borderStrong: '#3f3f46',
  text: '#fafafa', textSecondary: '#a1a1aa', textMuted: '#52525b',
  accent: '#fafafa', accentText: '#09090b', accentMuted: '#18181b',
  success: '#4ade80', successBg: '#052e16',
  warning: '#fbbf24', warningBg: '#1c1400',
  danger: '#f87171', dangerBg: '#2d0707',
  blue: '#60a5fa', blueBg: '#0c1a35',
  purple: '#a78bfa', purpleBg: '#1e1030',
  card: '#111113', cardBorder: '#27272a',
  inputBg: '#111113', tabBar: '#09090b', tabBorder: '#27272a',
};

type Theme = typeof LIGHT;
const SP = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 } as const;
const RD = { sm: 6, md: 8, lg: 12, xl: 16, full: 999 } as const;
const FZ = { xs: 11, sm: 12, md: 14, lg: 16, xl: 18, xxl: 22, xxxl: 28 } as const;

// ─── TYPES ──────────────────

interface UserRef { id: string; name: string; userName: string; }

interface Task {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  status: 'open' | 'claimed' | 'assigned' | 'in-progress' | 'completed' | 'reopened';
  startedAt: string;
  completedAt?: string;
  duration?: string;
  deadline?: string; // New field for Admin
  priority?: string; // New field for Admin
  creator?: UserRef;
  manager?: UserRef;
  assignee?: UserRef;
}

interface Comment { id: string; content: string; createdAt: string; author: { id: string; name: string; role: string }; }
interface TaskLog { id: string; action: string; note?: string; createdAt: string; actor: { id: string; name: string; role: string }; }

// ─── AUTH CONTEXT ──────────────────────

interface AuthCtx {
  cookie: string | null;
  role: string | null;
  userId: string | null;
  login: (cookieValue: string, userRole: string, id: string) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthCtx>({
  cookie: null, role: null, userId: null, login: async () => {}, logout: async () => {}, loading: true,
});
const useAuth = () => useContext(AuthContext);

function AuthProvider({ children }: { children: React.ReactNode }) {
  const [cookie, setCookie] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const savedCookie = await AsyncStorage.getItem('session_cookie');
        const savedRole = await AsyncStorage.getItem('user_role');
        const savedId = await AsyncStorage.getItem('user_id');
        if (savedCookie && savedRole && savedId) {
          setCookie(savedCookie);
          setRole(savedRole);
          setUserId(savedId);
        }
      } catch (_) {}
      setLoading(false);
    })();
  }, []);

  const login = async (cookieValue: string, userRole: string, id: string) => {
    await AsyncStorage.setItem('session_cookie', cookieValue);
    await AsyncStorage.setItem('user_role', userRole);
    await AsyncStorage.setItem('user_id', id);
    setCookie(cookieValue);
    setRole(userRole);
    setUserId(id);
  };

  const logout = async () => {
    try {
      if (cookie) await api.authPost('/auth/logout', {}, cookie);
    } catch (_) {}
    await AsyncStorage.multiRemove(['session_cookie', 'user_role', 'user_id']);
    setCookie(null);
    setRole(null);
    setUserId(null);
  };

  return (
    <AuthContext.Provider value={{ cookie, role, userId, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

// ─── NAVIGATION ─────────────────────────

type AuthStack = { Login: undefined; Signup: undefined; };
type LoginNav = NativeStackNavigationProp<AuthStack, 'Login'>;
type SignupNav = NativeStackNavigationProp<AuthStack, 'Signup'>;
const AuthStackNav = createNativeStackNavigator<AuthStack>();
const Tab = createBottomTabNavigator();

// ─── SVG ICONS ───────────────────────

interface IP { size?: number; color: string; sw?: number; }
const I = {
  Task:     ({ size = 20, color, sw = 1.5 }: IP) => <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><Polyline points="9 11 12 14 22 4" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" /><Path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" /></Svg>,
  Bar:      ({ size = 20, color, sw = 1.5 }: IP) => <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><Line x1="18" y1="20" x2="18" y2="10" stroke={color} strokeWidth={sw} strokeLinecap="round" /><Line x1="12" y1="20" x2="12" y2="4" stroke={color} strokeWidth={sw} strokeLinecap="round" /><Line x1="6" y1="20" x2="6" y2="14" stroke={color} strokeWidth={sw} strokeLinecap="round" /></Svg>,
  Cog:      ({ size = 20, color, sw = 1.5 }: IP) => <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><Circle cx="12" cy="12" r="3" stroke={color} strokeWidth={sw} /><Path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" stroke={color} strokeWidth={sw} /></Svg>,
  Person:   ({ size = 20, color, sw = 1.5 }: IP) => <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><Path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" /><Circle cx="12" cy="7" r="4" stroke={color} strokeWidth={sw} /></Svg>,
  Eye:      ({ size = 18, color, sw = 1.5 }: IP) => <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><Path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" /><Circle cx="12" cy="12" r="3" stroke={color} strokeWidth={sw} /></Svg>,
  EyeOff:   ({ size = 18, color, sw = 1.5 }: IP) => <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><Path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" /><Line x1="1" y1="1" x2="23" y2="23" stroke={color} strokeWidth={sw} strokeLinecap="round" /></Svg>,
  Lock:     ({ size = 18, color, sw = 1.5 }: IP) => <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><Rect x="3" y="11" width="18" height="11" rx="2" ry="2" stroke={color} strokeWidth={sw} /><Path d="M7 11V7a5 5 0 0110 0v4" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" /></Svg>,
  At:       ({ size = 18, color, sw = 1.5 }: IP) => <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><Circle cx="12" cy="12" r="4" stroke={color} strokeWidth={sw} /><Path d="M16 8v5a3 3 0 006 0v-1a10 10 0 10-3.92 7.94" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" /></Svg>,
  Phone:    ({ size = 18, color, sw = 1.5 }: IP) => <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><Path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 10.8 19.79 19.79 0 01.1 2.18 2 2 0 012.1 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92z" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" /></Svg>,
  Mail:     ({ size = 18, color, sw = 1.5 }: IP) => <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><Path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" /><Polyline points="22,6 12,13 2,6" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" /></Svg>,
  Plus:     ({ size = 18, color, sw = 1.5 }: IP) => <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><Line x1="12" y1="5" x2="12" y2="19" stroke={color} strokeWidth={sw} strokeLinecap="round" /><Line x1="5" y1="12" x2="19" y2="12" stroke={color} strokeWidth={sw} strokeLinecap="round" /></Svg>,
  LogOut:   ({ size = 18, color, sw = 1.5 }: IP) => <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><Path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" /><Polyline points="16 17 21 12 16 7" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" /><Line x1="21" y1="12" x2="9" y2="12" stroke={color} strokeWidth={sw} strokeLinecap="round" /></Svg>,
  Grid:     ({ size = 18, color, sw = 1.5 }: IP) => <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><Rect x="3" y="3" width="7" height="7" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" /><Rect x="14" y="3" width="7" height="7" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" /><Rect x="14" y="14" width="7" height="7" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" /><Rect x="3" y="14" width="7" height="7" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" /></Svg>,
  ListIcon: ({ size = 18, color, sw = 1.5 }: IP) => <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><Line x1="8" y1="6" x2="21" y2="6" stroke={color} strokeWidth={sw} strokeLinecap="round" /><Line x1="8" y1="12" x2="21" y2="12" stroke={color} strokeWidth={sw} strokeLinecap="round" /><Line x1="8" y1="18" x2="21" y2="18" stroke={color} strokeWidth={sw} strokeLinecap="round" /><Line x1="3" y1="6" x2="3.01" y2="6" stroke={color} strokeWidth={sw} strokeLinecap="round" /><Line x1="3" y1="12" x2="3.01" y2="12" stroke={color} strokeWidth={sw} strokeLinecap="round" /><Line x1="3" y1="18" x2="3.01" y2="18" stroke={color} strokeWidth={sw} strokeLinecap="round" /></Svg>,
  Chevron:  ({ size = 14, color, sw = 1.5 }: IP) => <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><Polyline points="9 18 15 12 9 6" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" /></Svg>,
  Alert:    ({ size = 14, color, sw = 1.5 }: IP) => <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><Circle cx="12" cy="12" r="10" stroke={color} strokeWidth={sw} /><Line x1="12" y1="8" x2="12" y2="12" stroke={color} strokeWidth={sw} strokeLinecap="round" /><Line x1="12" y1="16" x2="12.01" y2="16" stroke={color} strokeWidth={sw} strokeLinecap="round" /></Svg>,
  Trend:    ({ size = 18, color, sw = 1.5 }: IP) => <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><Polyline points="23 6 13.5 15.5 8.5 10.5 1 18" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" /><Polyline points="17 6 23 6 23 12" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" /></Svg>,
  Check:    ({ size = 16, color, sw = 2 }: IP) => <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><Polyline points="20 6 9 17 4 12" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" /></Svg>,
  X:        ({ size = 16, color, sw = 2 }: IP) => <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><Line x1="18" y1="6" x2="6" y2="18" stroke={color} strokeWidth={sw} strokeLinecap="round" /><Line x1="6" y1="6" x2="18" y2="18" stroke={color} strokeWidth={sw} strokeLinecap="round" /></Svg>,
  Users:    ({ size = 18, color, sw = 1.5 }: IP) => <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><Path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" /><Circle cx="9" cy="7" r="4" stroke={color} strokeWidth={sw} /><Path d="M23 21v-2a4 4 0 00-3-3.87" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" /><Path d="M16 3.13a4 4 0 010 7.75" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" /></Svg>,
  Clock:    ({ size = 16, color, sw = 1.5 }: IP) => <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><Circle cx="12" cy="12" r="10" stroke={color} strokeWidth={sw} /><Polyline points="12 6 12 12 16 14" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" /></Svg>,
};

// ─── SHARED COMPONENTS ───────────────────────

interface InputProps extends TextInputProps {
  label: string;
  iconLeft: React.ReactNode;
  error?: string | null;
  iconRight?: React.ReactNode;
  onIconRight?: () => void;
  theme: Theme;
}

function Field({ label, iconLeft, error, iconRight, onIconRight, theme, ...rest }: InputProps) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={{ marginBottom: error ? SP.xs : SP.md }}>
      <Text style={[sh.label, { color: theme.textSecondary }]}>{label}</Text>
      <View style={[sh.inputWrap, {
        backgroundColor: theme.inputBg,
        borderColor: error ? theme.danger : focused ? theme.text : theme.border,
      }]}>
        <View style={sh.iLeft}>{iconLeft}</View>
        <TextInput style={[sh.input, { color: theme.text }]} placeholderTextColor={theme.textMuted} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} {...rest} />
        {iconRight && <TouchableWithoutFeedback onPress={onIconRight}><View style={sh.iRight}>{iconRight}</View></TouchableWithoutFeedback>}
      </View>
      {!!error && <View style={sh.errRow}><I.Alert size={12} color={theme.danger} /><Text style={[sh.errText, { color: theme.danger }]}>{error}</Text></View>}
    </View>
  );
}

interface BtnProps { title: string; onPress: () => void; loading?: boolean; theme: Theme; variant?: 'solid' | 'outline' | 'success' | 'danger' | 'blue'; style?: ViewStyle; disabled?: boolean; }

function Btn({ title, onPress, loading, theme, variant = 'solid', style, disabled }: BtnProps) {
  const sc = useRef(new Animated.Value(1)).current;
  const bg = variant === 'success' ? theme.success : variant === 'danger' ? theme.danger : variant === 'blue' ? theme.blue : variant === 'outline' ? 'transparent' : theme.accent;
  const fg = variant === 'outline' ? theme.text : theme.accentText;
  const bc = variant === 'success' ? theme.success : variant === 'danger' ? theme.danger : variant === 'blue' ? theme.blue : variant === 'outline' ? theme.border : theme.accent;
  
  return (
    <Animated.View style={{ transform: [{ scale: sc }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={() => Animated.spring(sc, { toValue: 0.97, useNativeDriver: true }).start()} onPressOut={() => Animated.spring(sc, { toValue: 1, useNativeDriver: true }).start()} disabled={loading || disabled} activeOpacity={0.85} style={[sh.btn, { backgroundColor: bg, borderColor: bc, opacity: disabled ? 0.5 : 1 }, style]}>
        {loading ? <ActivityIndicator color={fg} size="small" /> : <Text style={[sh.btnText, { color: fg }]}>{title}</Text>}
      </TouchableOpacity>
    </Animated.View>
  );
}

function PageHeader({ title, theme, right, sub }: { title: string; theme: Theme; right?: React.ReactNode; sub?: string }) {
  return (
    <View style={[sh.pageHeader, { borderBottomColor: theme.border }]}>
      <View>
        <Text style={[sh.pageTitle, { color: theme.text }]}>{title}</Text>
        {sub ? <Text style={{ fontSize: FZ.xs, color: theme.textMuted, marginTop: 2 }}>{sub}</Text> : null}
      </View>
      {right}
    </View>
  );
}

function StatusPill({ status, theme }: { status: string; theme: Theme }) {
  const cfg =
    status === 'completed' ? { label: 'Completed', color: theme.success, bg: theme.successBg } :
    status === 'in-progress' ? { label: 'In Progress', color: theme.blue, bg: theme.blueBg } :
    status === 'assigned' ? { label: 'Assigned', color: theme.purple, bg: theme.purpleBg } :
    status === 'claimed' ? { label: 'Claimed', color: theme.warning, bg: theme.warningBg } :
    status === 'reopened' ? { label: 'Reopened', color: theme.danger, bg: theme.dangerBg } :
    { label: 'Open', color: theme.textSecondary, bg: theme.bgTertiary };
  return (
    <View style={[sh.pill, { backgroundColor: cfg.bg }]}>
      <Text style={[sh.pillText, { color: cfg.color }]}>{cfg.label}</Text>
    </View>
  );
}

const sh = StyleSheet.create({
  label:     { fontSize: FZ.sm, fontWeight: '500', marginBottom: 6, letterSpacing: 0.1 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', height: 46, borderWidth: 1, borderRadius: RD.md },
  iLeft:     { paddingLeft: SP.md, paddingRight: SP.sm },
  iRight:    { paddingRight: SP.md, paddingLeft: SP.sm },
  input:     { flex: 1, fontSize: FZ.md, height: '100%' },
  errRow:    { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 4, marginBottom: SP.xs },
  errText:   { fontSize: FZ.xs, fontWeight: '500' },
  btn:       { height: 44, borderRadius: RD.md, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
  btnText:   { fontSize: FZ.md, fontWeight: '600', letterSpacing: 0.1 },
  pageHeader:{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: SP.lg, paddingVertical: SP.md, borderBottomWidth: 1 },
  pageTitle: { fontSize: FZ.xl, fontWeight: '700', letterSpacing: -0.3 },
  iconBtn:   { width: 34, height: 34, borderRadius: RD.md, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  pill:      { alignSelf: 'flex-start', paddingHorizontal: SP.sm, paddingVertical: 4, borderRadius: RD.full },
  pillText:  { fontSize: FZ.xs, fontWeight: '700', textTransform: 'uppercase' },
});

// ─── LOGIN ────────────────────

function LoginScreen({ navigation }: { navigation: LoginNav }) {
  const scheme = useColorScheme();
  const theme = scheme === 'dark' ? DARK : LIGHT;
  const { login } = useAuth();
  const [userName, setUserName] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!userName.trim()) e.userName = 'Username is required';
    if (!password) e.password = 'Password is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const data = await api.post('/auth/login', { userName: userName.trim(), password });
      if (data.cookieValue && data.user) {
        await login(data.cookieValue, data.user.role, data.user.id);
      } else if (data.error) {
        Alert.alert('Sign in failed', data.error);
      } else {
        Alert.alert('Sign in failed', 'Unexpected response from server.');
      }
    } catch {
      Alert.alert('Connection error', 'Cannot reach server. Is your backend running on port 8000?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
      <StatusBar barStyle={scheme === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={theme.bg} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={au.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={au.brand}>
            <View style={[au.logoBox, { backgroundColor: theme.bgTertiary, borderColor: theme.border }]}>
              <I.Task size={20} color={theme.text} sw={1.5} />
            </View>
            <Text style={[au.logoLabel, { color: theme.text }]}>TeamHub</Text>
          </View>
          <Text style={[au.title, { color: theme.text }]}>Sign in</Text>
          <Text style={[au.sub, { color: theme.textSecondary }]}>Enter your credentials to continue.</Text>
          <View style={[au.card, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <Field label="Username" iconLeft={<I.At size={16} color={theme.textMuted} />} placeholder="your_username" autoCapitalize="none" autoCorrect={false} value={userName} onChangeText={t => { setUserName(t); setErrors(p => ({ ...p, userName: '' })); }} error={errors.userName} theme={theme} />
            <Field label="Password" iconLeft={<I.Lock size={16} color={theme.textMuted} />} placeholder="••••••••" secureTextEntry={!showPw} value={password} onChangeText={t => { setPassword(t); setErrors(p => ({ ...p, password: '' })); }} error={errors.password} iconRight={showPw ? <I.EyeOff size={16} color={theme.textMuted} /> : <I.Eye size={16} color={theme.textMuted} />} onIconRight={() => setShowPw(p => !p)} theme={theme} />
            <TouchableOpacity style={{ alignSelf: 'flex-end', marginBottom: SP.md, marginTop: -SP.xs }}>
              <Text style={{ color: theme.blue, fontSize: FZ.sm, fontWeight: '500' }}>Forgot password?</Text>
            </TouchableOpacity>
            <Btn title="Sign in" onPress={submit} loading={loading} theme={theme} />
          </View>
          <View style={au.foot}>
            <Text style={{ color: theme.textSecondary, fontSize: FZ.sm }}>No account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
              <Text style={{ color: theme.text, fontSize: FZ.sm, fontWeight: '600' }}>Sign up</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── SIGNUP ─────────────────

function SignupScreen({ navigation }: { navigation: SignupNav }) {
  const scheme = useColorScheme();
  const theme = scheme === 'dark' ? DARK : LIGHT;
  const [form, setForm] = useState({ name: '', userName: '', email: '', phone: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const set = (k: keyof typeof form, v: string) => { setForm(p => ({ ...p, [k]: v })); setErrors(p => ({ ...p, [k]: '' })); };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Full name is required';
    if (form.userName.trim().length < 3) e.userName = 'Username must be at least 3 characters';
    if (!form.email.includes('@')) e.email = 'Enter a valid email';
    if (form.phone && form.phone.length < 10) e.phone = 'Enter a valid phone number';
    if (form.password.length < 6) e.password = 'Minimum 6 characters';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const data = await api.post('/auth/signup', { name: form.name.trim(), userName: form.userName.trim(), email: form.email.trim(), phone: form.phone.trim() || undefined, password: form.password });
      if (data.message === 'User created successfully') {
        Alert.alert('Account created!', 'You can now sign in.', [{ text: 'Sign in', onPress: () => navigation.navigate('Login') }]);
      } else if (data.error) {
        const detail = data.missingCriteria ? `\n• ${data.missingCriteria.join('\n• ')}` : '';
        Alert.alert('Signup failed', data.error + detail);
      } else {
        Alert.alert('Signup failed', 'Unexpected response. Check your backend logs.');
      }
    } catch {
      Alert.alert('Connection error', 'Cannot reach server. Is your backend running on port 8000?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
      <StatusBar barStyle={scheme === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={theme.bg} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={au.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={au.brand}>
            <View style={[au.logoBox, { backgroundColor: theme.bgTertiary, borderColor: theme.border }]}>
              <I.Task size={20} color={theme.text} sw={1.5} />
            </View>
            <Text style={[au.logoLabel, { color: theme.text }]}>TeamHub</Text>
          </View>
          <Text style={[au.title, { color: theme.text }]}>Create account</Text>
          <Text style={[au.sub, { color: theme.textSecondary }]}>Join your team and start collaborating.</Text>
          <View style={[au.card, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <Field label="Full Name" iconLeft={<I.Person size={16} color={theme.textMuted} />} placeholder="John Smith" value={form.name} onChangeText={t => set('name', t)} error={errors.name} theme={theme} />
            <Field label="Username" iconLeft={<I.At size={16} color={theme.textMuted} />} placeholder="john_smith" autoCapitalize="none" autoCorrect={false} value={form.userName} onChangeText={t => set('userName', t)} error={errors.userName} theme={theme} />
            <Field label="Email" iconLeft={<I.Mail size={16} color={theme.textMuted} />} placeholder="john@company.com" keyboardType="email-address" autoCapitalize="none" value={form.email} onChangeText={t => set('email', t)} error={errors.email} theme={theme} />
            <Field label="Phone (optional)" iconLeft={<I.Phone size={16} color={theme.textMuted} />} placeholder="+91 98765 43210" keyboardType="phone-pad" value={form.phone} onChangeText={t => set('phone', t)} error={errors.phone} theme={theme} />
            <Field label="Password" iconLeft={<I.Lock size={16} color={theme.textMuted} />} placeholder="Min. 6 characters" secureTextEntry={!showPw} value={form.password} onChangeText={t => set('password', t)} error={errors.password} iconRight={showPw ? <I.EyeOff size={16} color={theme.textMuted} /> : <I.Eye size={16} color={theme.textMuted} />} onIconRight={() => setShowPw(p => !p)} theme={theme} />
            <Btn title="Create account" onPress={submit} loading={loading} theme={theme} />
          </View>
          <View style={au.foot}>
            <Text style={{ color: theme.textSecondary, fontSize: FZ.sm }}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={{ color: theme.text, fontSize: FZ.sm, fontWeight: '600' }}>Sign in</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const au = StyleSheet.create({
  scroll:    { flexGrow: 1, paddingHorizontal: SP.lg, paddingTop: SP.xl, paddingBottom: SP.xxl },
  brand:     { flexDirection: 'row', alignItems: 'center', marginBottom: SP.xl, gap: SP.sm },
  logoBox:   { width: 34, height: 34, borderRadius: RD.md, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  logoLabel: { fontSize: FZ.lg, fontWeight: '700', letterSpacing: -0.3 },
  title:     { fontSize: FZ.xxxl, fontWeight: '700', letterSpacing: -0.5, marginBottom: SP.xs },
  sub:       { fontSize: FZ.md, lineHeight: 22, marginBottom: SP.xl },
  card:      { borderRadius: RD.lg, borderWidth: 1, padding: SP.lg, marginBottom: SP.lg },
  foot:      { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
});

// ─── CREATE TASK MODAL ────────────

function CreateTaskModal({ visible, onClose, onCreated, theme, cookie }: { visible: boolean; onClose: () => void; onCreated: () => void; theme: Theme; cookie: string }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [nameErr, setNameErr] = useState('');

  const submit = async () => {
    if (name.trim().length < 3) { setNameErr('Task name must be at least 3 characters'); return; }
    setLoading(true);
    try {
      const data = await api.authPost('/tasks', { name: name.trim(), description: description.trim() || undefined }, cookie);
      if (data.task) {
        setName(''); setDescription('');
        onCreated(); onClose();
      } else {
        Alert.alert('Failed', data.error || data.message || 'Could not create task.');
      }
    } catch {
      Alert.alert('Error', 'Connection error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
        <View style={[sh.pageHeader, { borderBottomColor: theme.border }]}>
          <Text style={[sh.pageTitle, { color: theme.text }]}>New Task</Text>
          <TouchableOpacity onPress={onClose} style={[sh.iconBtn, { backgroundColor: theme.bgTertiary, borderColor: theme.border }]}>
            <I.X size={16} color={theme.text} />
          </TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={{ padding: SP.lg, gap: SP.sm }}>
          <Field label="Task Name" iconLeft={<I.Task size={16} color={theme.textMuted} />} placeholder="Min. 3 characters" value={name} onChangeText={t => { setName(t); setNameErr(''); }} error={nameErr} theme={theme} />
          <Field label="Description (optional)" iconLeft={<I.ListIcon size={16} color={theme.textMuted} />} placeholder="What needs to be done?" value={description} onChangeText={setDescription} theme={theme} />
          <Btn title="Create Task" onPress={submit} loading={loading} theme={theme} />
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

// ─── TASK DETAIL MODAL (UPDATED FLOW) ────────────

function TaskDetailModal({ task, visible, onClose, onRefresh, theme, cookie, role }: { task: Task | null; visible: boolean; onClose: () => void; onRefresh: () => void; theme: Theme; cookie: string; role: string | null }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [logs, setLogs] = useState<TaskLog[]>([]);
  const [newComment, setNewComment] = useState('');
  
  // States for Manager Search
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<UserRef[]>([]);
  
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible && task) {
      api.authGet(`/comments/${task.id}`, cookie).then(d => setComments(d.comments || []));
      api.authGet(`/logs/task/${task.id}`, cookie).then(d => setLogs(d.logs || []));
      setSearch('');
      setResults([]);
    }
  }, [visible, task]);

  if (!task) return null;

  const handleAction = async (action: string, body: any = {}) => {
    setLoading(true);
    try {
      // Switch logic if the action is purely a 'delete' via a dedicated DELETE endpoint,
      // but assuming for now it's managed via PATCH or a DELETE route.
      const method = action === 'delete' ? 'DELETE' : 'PATCH';
      const url = `/tasks/${task.id}${action === 'delete' ? '' : '/' + action}`;
      
      const res = await fetch(`${API_BASE}${url}`, {
        method,
        headers: buildHeaders(cookie),
        body: JSON.stringify(body),
      });
      const data = await res.json();
      
      if (data.task || data.message === 'Task deleted successfully') { 
        onRefresh(); 
        onClose(); 
      } else {
        Alert.alert('Error', data.error || data.message || 'Action failed.');
      }
    } catch { 
      Alert.alert('Error', 'Connection Error'); 
    } finally { 
      setLoading(false); 
    }
  };

  const addComment = async () => {
    if (!newComment.trim()) return;
    const data = await api.authPost(`/comments/${task.id}`, { content: newComment }, cookie);
    if (data.comment) { setComments([...comments, data.comment]); setNewComment(''); }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
        <View style={[sh.pageHeader, { borderBottomColor: theme.border }]}>
          <Text style={[sh.pageTitle, { color: theme.text }]}>Task #{task.id}</Text>
          <TouchableOpacity onPress={onClose} style={[sh.iconBtn, { backgroundColor: theme.bgTertiary, borderColor: theme.border }]}>
            <I.X size={16} color={theme.text} />
          </TouchableOpacity>
        </View>
        
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: SP.lg, gap: SP.md }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Text style={{ fontSize: FZ.xl, fontWeight: '700', color: theme.text, flex: 1, marginRight: SP.md }}>{task.name}</Text>
            <StatusPill status={task.status} theme={theme} />
          </View>
          <Text style={{ color: theme.textSecondary, fontSize: FZ.md, lineHeight: 22 }}>{task.description || 'No description provided.'}</Text>
          
          <View style={{ backgroundColor: theme.bgTertiary, padding: SP.md, borderRadius: RD.md, borderWidth: 1, borderColor: theme.border }}>
            <Text style={{ color: theme.text, fontSize: FZ.sm, marginBottom: 4 }}>Created by: <Text style={{fontWeight: '600'}}>{task.creator?.name || 'Unknown'}</Text></Text>
            <Text style={{ color: theme.text, fontSize: FZ.sm, marginBottom: 4 }}>Manager: <Text style={{fontWeight: '600'}}>{task.manager?.name || 'Unclaimed'}</Text></Text>
            <Text style={{ color: theme.text, fontSize: FZ.sm, marginBottom: 4 }}>Assignee: <Text style={{fontWeight: '600'}}>{task.assignee?.name || 'Unassigned'}</Text></Text>
            {task.deadline && <Text style={{ color: theme.text, fontSize: FZ.sm, marginBottom: 4 }}>Deadline: <Text style={{fontWeight: '600'}}>{new Date(task.deadline).toLocaleDateString()}</Text></Text>}
            {task.priority && <Text style={{ color: theme.text, fontSize: FZ.sm }}>Priority: <Text style={{fontWeight: '600'}}>{task.priority}</Text></Text>}
          </View>

          {/* ROLE BASED ACTIONS */}
          <View style={{ gap: SP.sm, marginVertical: SP.xs }}>
            {role === 'manager' && task.status === 'open' && (
              <Btn title="Claim Task" onPress={() => handleAction('claim')} loading={loading} theme={theme} />
            )}
            
            {/* MANAGER SEARCH ASSIGNMENT (UPDATED) */}
            {role === 'manager' && task.status === 'claimed' && (
              <View style={{ gap: SP.sm }}>
                <Text style={{ color: theme.textSecondary, fontSize: FZ.sm }}>Assign Task To:</Text>
                <TextInput 
                  style={{ height: 44, borderWidth: 1, borderColor: theme.border, borderRadius: RD.md, paddingHorizontal: SP.md, color: theme.text, backgroundColor: theme.inputBg }} 
                  placeholder="Search user by name..." 
                  placeholderTextColor={theme.textMuted} 
                  value={search} 
                  onChangeText={async (t) => {
                    setSearch(t);
                    if (t.length > 2) {
                      try {
                        const data = await api.authGet(`/users/search?q=${t}`, cookie);
                        setResults(data.users || []);
                      } catch (e) {
                        console.log("Search error", e);
                      }
                    } else {
                      setResults([]);
                    }
                  }} 
                />
                
                {results.map(u => (
                  <TouchableOpacity 
                    key={u.id} 
                    style={{ padding: SP.md, backgroundColor: theme.bgTertiary, borderRadius: RD.md, marginBottom: 4 }}
                    onPress={() => {
                      handleAction('assign', { assigneeId: u.id });
                      setSearch('');
                      setResults([]);
                    }}
                  >
                    <Text style={{ color: theme.text, fontWeight: '600' }}>{u.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {role === 'user' && task.status === 'assigned' && (
              <Btn title="Start Working" onPress={() => handleAction('status', { status: 'in-progress' })} loading={loading} theme={theme} variant="blue" />
            )}

            {role === 'user' && task.status === 'in-progress' && (
              <Btn title="Mark Complete" onPress={() => handleAction('status', { status: 'completed' })} loading={loading} theme={theme} variant="success" />
            )}

            {(role === 'manager' || role === 'admin') && task.status === 'completed' && (
              <Btn title="Reopen Task" onPress={() => {
                if(!newComment) return Alert.alert('Required', 'Type a reason in the comments box below first.');
                handleAction('reopen', { comment: newComment });
              }} loading={loading} theme={theme} variant="danger" />
            )}

            {/* ADMIN ACTIONS (UPDATED) */}
            {role === 'admin' && (
              <View style={{ marginTop: SP.md, borderTopWidth: 1, borderTopColor: theme.border, paddingTop: SP.md }}>
                <Text style={{ color: theme.text, fontWeight: '700', fontSize: FZ.md, marginBottom: SP.sm }}>Admin Actions</Text>
                <Btn title="Delete Task" onPress={() => {
                  Alert.alert("Confirm Delete", "Are you sure you want to permanently delete this task?", [
                    { text: "Cancel", style: "cancel" },
                    { text: "Delete", style: "destructive", onPress: () => handleAction('delete') }
                  ]);
                }} loading={loading} theme={theme} variant="danger" />
              </View>
            )}
          </View>

          {/* COMMENTS */}
          <Text style={{ fontSize: FZ.lg, fontWeight: '700', color: theme.text, marginTop: SP.sm }}>Discussion</Text>
          {comments.map(c => (
            <View key={c.id} style={{ backgroundColor: theme.card, padding: SP.md, borderRadius: RD.md, borderWidth: 1, borderColor: theme.cardBorder }}>
              <Text style={{ color: theme.textMuted, fontSize: FZ.xs, marginBottom: 4, textTransform: 'capitalize' }}>{c.author.name} ({c.author.role})</Text>
              <Text style={{ color: theme.text }}>{c.content}</Text>
            </View>
          ))}
          <View style={{ flexDirection: 'row', gap: SP.sm }}>
            <TextInput style={{ flex: 1, height: 44, borderWidth: 1, borderColor: theme.border, borderRadius: RD.md, paddingHorizontal: SP.md, color: theme.text }} placeholder="Add a comment..." placeholderTextColor={theme.textMuted} value={newComment} onChangeText={setNewComment} />
            <Btn title="Post" onPress={addComment} theme={theme} style={{ paddingHorizontal: SP.lg }} />
          </View>

          {/* LOGS */}
          <Text style={{ fontSize: FZ.lg, fontWeight: '700', color: theme.text, marginTop: SP.lg }}>Activity Log</Text>
          {logs.map(l => (
            <View key={l.id} style={{ paddingVertical: SP.sm, borderBottomWidth: 1, borderBottomColor: theme.border }}>
              <Text style={{ color: theme.text, fontSize: FZ.sm }}>
                <Text style={{fontWeight: '600'}}>{l.actor.name}</Text> {l.action.replace('_', ' ').toLowerCase()}
              </Text>
              <Text style={{ color: theme.textMuted, fontSize: FZ.xs, marginTop: 4 }}>{new Date(l.createdAt).toLocaleString()}</Text>
            </View>
          ))}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

// ─── TASKS SCREEN (UPDATED GRID LAYOUT) ────────────

function TasksScreen() {
  const scheme = useColorScheme();
  const theme = scheme === 'dark' ? DARK : LIGHT;
  const { cookie, role } = useAuth();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [fetching, setFetching] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [grid, setGrid] = useState(false);
  const [filter, setFilter] = useState('All');
  const [showCreate, setShowCreate] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  useEffect(() => { load(); }, []);

  const load = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setFetching(true);
    try {
      const data = await api.authGet('/tasks', cookie ?? '');
      setTasks(Array.isArray(data.tasks) ? data.tasks : []);
    } catch (e) {
      console.log('Tasks error:', e);
      setTasks([]);
    } finally {
      setFetching(false);
      setRefreshing(false);
    }
  };

  const FILTERS = ['All', 'Open', 'In Progress', 'Completed'];

  const filtered = tasks.filter(t => {
    if (filter === 'All') return true;
    if (filter === 'Open') return t.status === 'open';
    if (filter === 'In Progress') return t.status === 'in-progress';
    if (filter === 'Completed') return t.status === 'completed';
    return true;
  });

  const renderItem = ({ item }: { item: Task }) => {
    return (
      <TouchableOpacity 
        activeOpacity={0.7} 
        onPress={() => setSelectedTask(item)} 
        // UPDATED: Fixed width logic to prevent grid view squishing/overlapping
        style={[tk.card, { 
          backgroundColor: theme.card, 
          borderColor: theme.cardBorder,
          width: grid ? '48%' : '100%',
          marginBottom: grid ? 0 : SP.sm 
        }]}
      >
        <View style={[tk.strip, {
          backgroundColor:
            item.status === 'open' ? theme.warning :
            item.status === 'completed' ? theme.success : 
            item.status === 'reopened' ? theme.danger : theme.blue,
        }]} />

        <View style={{ flex: 1 }}>
          <Text style={[tk.name, { color: theme.text }]} numberOfLines={1}>{item.name}</Text>

          {item.description ? <Text style={[tk.desc, { color: theme.textSecondary }]} numberOfLines={2}>{item.description}</Text> : null}

          <View style={tk.meta}>
            <Text style={[tk.id, { color: theme.textMuted }]}>#{item.id}</Text>
            <StatusPill status={item.status} theme={theme} />
          </View>

          <View style={tk.footer}>
            {item.assignee && (
              <View style={tk.memberRow}>
                <I.Person size={12} color={theme.textMuted} />
                <Text style={[tk.meta2, { color: theme.textMuted }]} numberOfLines={1}>{item.assignee.name}</Text>
              </View>
            )}
            {!item.assignee && item.manager && (
              <View style={tk.memberRow}>
                <I.Users size={12} color={theme.textMuted} />
                <Text style={[tk.meta2, { color: theme.textMuted }]} numberOfLines={1}>Mgr: {item.manager.name}</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
      <StatusBar barStyle={scheme === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={theme.bg} />
      <PageHeader
        title={role === 'admin' ? 'Admin Portal' : role === 'manager' ? 'Manager Board' : 'My Work'}
        sub={`${tasks.length} task${tasks.length !== 1 ? 's' : ''} total`}
        theme={theme}
        right={
          <View style={{ flexDirection: 'row', gap: SP.sm }}>
            <TouchableOpacity style={[sh.iconBtn, { backgroundColor: theme.bgTertiary, borderColor: theme.border }]} onPress={() => setGrid(p => !p)}>
              {grid ? <I.ListIcon size={16} color={theme.text} /> : <I.Grid size={16} color={theme.text} />}
            </TouchableOpacity>
            {role === 'admin' && (
              <TouchableOpacity style={[sh.iconBtn, { backgroundColor: theme.accent, borderColor: theme.accent }]} onPress={() => setShowCreate(true)}>
                <I.Plus size={16} color={theme.accentText} />
              </TouchableOpacity>
            )}
          </View>
        }
      />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={[tk.filterBar, { borderBottomColor: theme.border }]} contentContainerStyle={{ paddingHorizontal: SP.lg, gap: SP.xs }}>
        {FILTERS.map(f => (
          <TouchableOpacity key={f} onPress={() => setFilter(f)} style={[tk.chip, { borderColor: theme.border, backgroundColor: filter === f ? theme.accent : 'transparent' }]}>
            <Text style={[tk.chipTxt, { color: filter === f ? theme.accentText : theme.textSecondary }]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {fetching
        ? <ActivityIndicator style={{ marginTop: SP.xxl }} color={theme.text} />
        : <FlatList<Task>
            key={grid ? 'grid' : 'list'}
            data={filtered}
            numColumns={grid ? 2 : 1}
            renderItem={renderItem}
            keyExtractor={item => item.id}
            contentContainerStyle={{ padding: SP.lg }}
            // UPDATED: Added column wrapper styling for grid spacing
            columnWrapperStyle={grid ? { justifyContent: 'space-between', marginBottom: SP.sm } : undefined}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={theme.textMuted} />}
            ListEmptyComponent={
              <View style={{ alignItems: 'center', paddingTop: SP.xxl }}>
                <Text style={{ color: theme.textMuted, fontSize: FZ.md }}>No tasks found.</Text>
                {role === 'admin' && <Text style={{ color: theme.textMuted, fontSize: FZ.sm, marginTop: SP.xs }}>Tap + to create one.</Text>}
              </View>
            }
          />
      }

      <CreateTaskModal visible={showCreate} onClose={() => setShowCreate(false)} onCreated={() => load()} theme={theme} cookie={cookie ?? ''} />
      <TaskDetailModal task={selectedTask} visible={!!selectedTask} onClose={() => setSelectedTask(null)} onRefresh={() => load()} theme={theme} cookie={cookie ?? ''} role={role} />
    </SafeAreaView>
  );
}

const tk = StyleSheet.create({
  card:        { flexDirection: 'row', borderRadius: RD.lg, borderWidth: 1, padding: SP.md, overflow: 'hidden' },
  strip:       { width: 3, borderRadius: RD.full, marginRight: SP.md, alignSelf: 'stretch' },
  name:        { fontSize: FZ.md, fontWeight: '600', marginBottom: 3 },
  desc:        { fontSize: FZ.sm, lineHeight: 18, marginBottom: SP.xs },
  meta:        { flexDirection: 'row', alignItems: 'center', gap: SP.xs, marginBottom: SP.sm, flexWrap: 'wrap' },
  id:          { fontSize: FZ.xs, fontWeight: '500' },
  footer:      { flexDirection: 'row', alignItems: 'center', gap: SP.sm, flexWrap: 'wrap' },
  memberRow:   { flexDirection: 'row', alignItems: 'center', gap: 4 },
  meta2:       { fontSize: FZ.xs },
  filterBar:   { borderBottomWidth: 1, paddingVertical: SP.sm, flexGrow: 0 },
  chip:        { paddingHorizontal: SP.md, paddingVertical: 6, borderRadius: RD.full, borderWidth: 1 },
  chipTxt:     { fontSize: FZ.sm, fontWeight: '500' },
});

// ─── ANALYTICS SCREEN ─────────

function AnalyticsScreen() {
  const scheme = useColorScheme();
  const theme = scheme === 'dark' ? DARK : LIGHT;
  const { cookie } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    api.authGet('/tasks', cookie ?? '')
      .then(d => setTasks(Array.isArray(d.tasks) ? d.tasks : []))
      .catch(() => setTasks([]))
      .finally(() => setFetching(false));
  }, []);

  const total       = tasks.length;
  const active      = tasks.filter(t => ['assigned', 'in-progress', 'reopened'].includes(t.status)).length;
  const completed   = tasks.filter(t => t.status === 'completed').length;
  const pending     = tasks.filter(t => t.status === 'open').length;
  const claimed     = tasks.filter(t => t.status === 'claimed').length;
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  const statCards = [
    { label: 'Total Tasks',  value: total,     note: 'All time',         c: theme.blue,    bg: theme.blueBg },
    { label: 'Active',       value: active,    note: 'In progress',      c: theme.warning, bg: theme.warningBg },
    { label: 'Completed',    value: completed, note: `${completionRate}% rate`, c: theme.success, bg: theme.successBg },
    { label: 'Open',         value: pending,   note: 'Awaiting managers', c: theme.purple,  bg: theme.purpleBg },
  ];

  const bars = [
    { label: 'Completed', count: completed, total, c: theme.success },
    { label: 'Active Work', count: active, total, c: theme.warning },
    { label: 'Claimed', count: claimed, total, c: theme.purple },
    { label: 'Open',  count: pending,  total, c: theme.textSecondary },
  ];

  if (fetching) return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
      <StatusBar barStyle={scheme === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={theme.bg} />
      <PageHeader title="Analytics" theme={theme} />
      <ActivityIndicator style={{ marginTop: SP.xxl }} color={theme.text} />
    </SafeAreaView>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
      <StatusBar barStyle={scheme === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={theme.bg} />
      <PageHeader title="Analytics" theme={theme} sub="Live data from your tasks" right={<I.Trend size={18} color={theme.textSecondary} />} />
      <ScrollView contentContainerStyle={{ padding: SP.lg, gap: SP.md }} showsVerticalScrollIndicator={false}>

        {/* Stat cards grid */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: SP.sm }}>
          {statCards.map(c => (
            <View key={c.label} style={[an.card, { backgroundColor: theme.card, borderColor: theme.cardBorder, width: '47.5%' }]}>
              <View style={[an.dot, { backgroundColor: c.bg }]}><I.Bar size={13} color={c.c} /></View>
              <Text style={[an.val, { color: theme.text }]}>{c.value}</Text>
              <Text style={[an.lbl, { color: theme.textSecondary }]}>{c.label}</Text>
              <Text style={[an.note, { color: c.c }]}>{c.note}</Text>
            </View>
          ))}
        </View>

        {total > 0 && (
          <View style={[an.section, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <Text style={[an.secTitle, { color: theme.text }]}>Breakdown</Text>
            {bars.map(b => {
              const pct = total > 0 ? Math.round((b.count / total) * 100) : 0;
              return (
                <View key={b.label} style={{ marginTop: SP.md }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                    <Text style={{ fontSize: FZ.sm, color: theme.textSecondary, fontWeight: '500' }}>{b.label}</Text>
                    <Text style={{ fontSize: FZ.sm, color: theme.text, fontWeight: '700' }}>{b.count} <Text style={{ color: theme.textMuted, fontWeight: '400' }}>({pct}%)</Text></Text>
                  </View>
                  <View style={[an.track, { backgroundColor: theme.bgTertiary }]}>
                    <View style={[an.fill, { width: `${pct}%` as any, backgroundColor: b.c }]} />
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {total === 0 && (
          <View style={{ alignItems: 'center', paddingVertical: SP.xxl }}>
            <Text style={{ color: theme.textMuted, fontSize: FZ.md }}>No task data yet.</Text>
            <Text style={{ color: theme.textMuted, fontSize: FZ.sm, marginTop: SP.xs }}>Create tasks to see your analytics here.</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const an = StyleSheet.create({
  card:       { padding: SP.md, borderRadius: RD.lg, borderWidth: 1, gap: 2 },
  dot:        { width: 26, height: 26, borderRadius: RD.sm, justifyContent: 'center', alignItems: 'center', marginBottom: SP.xs },
  val:        { fontSize: FZ.xxl, fontWeight: '700', letterSpacing: -0.5 },
  lbl:        { fontSize: FZ.sm, fontWeight: '500' },
  note:       { fontSize: FZ.xs, fontWeight: '500' },
  section:    { padding: SP.lg, borderRadius: RD.lg, borderWidth: 1 },
  secTitle:   { fontSize: FZ.lg, fontWeight: '700' },
  track:      { height: 6, borderRadius: RD.full, overflow: 'hidden' },
  fill:       { height: '100%', borderRadius: RD.full },
});

// ─── SETTINGS SCREEN ────────────────

function SettingsScreen() {
  const scheme = useColorScheme();
  const theme = scheme === 'dark' ? DARK : LIGHT;

  const sections = [
    {
      title: 'Preferences',
      rows: [
        { label: 'Notifications', sub: 'Push alerts for task updates' },
        { label: 'Appearance', sub: 'Follows system dark/light setting' },
        { label: 'Language', sub: 'English' },
      ],
    },
    {
      title: 'Account',
      rows: [
        { label: 'Privacy', sub: 'Manage your data and permissions' },
        { label: 'Security', sub: 'Password and session management' },
      ],
    },
    {
      title: 'Support',
      rows: [
        { label: 'Help Centre', sub: 'FAQs and documentation' },
        { label: 'About', sub: 'TeamHub · Version 2.0.0' },
      ],
    },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
      <StatusBar barStyle={scheme === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={theme.bg} />
      <PageHeader title="Settings" theme={theme} />
      <ScrollView contentContainerStyle={{ padding: SP.lg, gap: SP.lg }} showsVerticalScrollIndicator={false}>
        {sections.map(section => (
          <View key={section.title}>
            <Text style={[se.sectionTitle, { color: theme.textMuted }]}>{section.title.toUpperCase()}</Text>
            <View style={[se.group, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
              {section.rows.map((r, i) => (
                <TouchableOpacity key={r.label} style={[se.row, i < section.rows.length - 1 && { borderBottomWidth: 1, borderBottomColor: theme.border }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={[se.rowLabel, { color: theme.text }]}>{r.label}</Text>
                    <Text style={[se.rowSub, { color: theme.textMuted }]}>{r.sub}</Text>
                  </View>
                  <I.Chevron size={14} color={theme.textMuted} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const se = StyleSheet.create({
  sectionTitle: { fontSize: FZ.xs, fontWeight: '600', letterSpacing: 0.8, marginBottom: SP.sm },
  group:        { borderRadius: RD.lg, borderWidth: 1, overflow: 'hidden' },
  row:          { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SP.md, paddingVertical: SP.md, gap: SP.sm },
  rowLabel:     { fontSize: FZ.md, fontWeight: '500', marginBottom: 2 },
  rowSub:       { fontSize: FZ.sm },
});

// ─── PROFILE SCREEN ─────────────────────

function ProfileScreen() {
  const scheme = useColorScheme();
  const theme = scheme === 'dark' ? DARK : LIGHT;
  const { cookie, logout, role, userId } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    if (!cookie) return;
    api.authGet('/tasks', cookie)
      .then(d => setTasks(Array.isArray(d.tasks) ? d.tasks : []))
      .catch(() => {});
  }, []);

  const myTaskCount  = tasks.length;
  const doneCount    = tasks.filter(t => t.status === 'completed').length;
  const activeCount  = tasks.filter(t => ['in-progress', 'assigned', 'reopened'].includes(t.status)).length;

  const statItems = [
    { label: 'My Tasks',  value: myTaskCount,  color: theme.blue },
    { label: 'Completed', value: doneCount,     color: theme.success },
    { label: 'Active',    value: activeCount,   color: theme.warning },
  ];

  const infoRows = [
    { label: 'User ID',  value: userId ? `${userId.slice(0, 8)}...` : '—' },
    { label: 'Session',  value: 'Active' },
    { label: 'Platform', value: Platform.OS === 'ios' ? 'iOS' : 'Android' },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
      <StatusBar barStyle={scheme === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={theme.bg} />
      <PageHeader title="Profile" theme={theme} />
      <ScrollView contentContainerStyle={{ padding: SP.lg, gap: SP.md }} showsVerticalScrollIndicator={false}>

        {/* Avatar card */}
        <View style={[pr.hero, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
          <View style={[pr.avatar, { backgroundColor: theme.bgTertiary, borderColor: theme.border }]}>
            <I.Person size={28} color={theme.textSecondary} />
          </View>
          <Text style={[pr.name, { color: theme.text, textTransform: 'capitalize' }]}>{role || 'Team Member'}</Text>
          <Text style={{ color: theme.textMuted, fontSize: FZ.sm }}>System Access Level</Text>
        </View>

        {/* Task stats */}
        <View style={[pr.statsRow, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
          {statItems.map((s, i) => (
            <React.Fragment key={s.label}>
              <View style={pr.statItem}>
                <Text style={[pr.statVal, { color: s.color }]}>{s.value}</Text>
                <Text style={[pr.statLbl, { color: theme.textMuted }]}>{s.label}</Text>
              </View>
              {i < statItems.length - 1 && <View style={[pr.divider, { backgroundColor: theme.border }]} />}
            </React.Fragment>
          ))}
        </View>

        {/* Info rows */}
        <View style={[se.group, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
          {infoRows.map((r, i) => (
            <View key={r.label} style={[se.row, i < infoRows.length - 1 && { borderBottomWidth: 1, borderBottomColor: theme.border }]}>
              <Text style={[se.rowLabel, { color: theme.text, flex: 1, marginBottom: 0 }]}>{r.label}</Text>
              <Text style={{ color: theme.textSecondary, fontSize: FZ.sm }}>{r.value}</Text>
            </View>
          ))}
        </View>

        {/* Sign out */}
        <TouchableOpacity style={[pr.logoutBtn, { backgroundColor: theme.dangerBg, borderColor: theme.danger + '55' }]} onPress={logout}>
          <I.LogOut size={16} color={theme.danger} />
          <Text style={[pr.logoutText, { color: theme.danger }]}>Sign out</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const pr = StyleSheet.create({
  hero:       { alignItems: 'center', padding: SP.xl, borderRadius: RD.lg, borderWidth: 1, gap: SP.xs },
  avatar:     { width: 72, height: 72, borderRadius: RD.full, borderWidth: 1, justifyContent: 'center', alignItems: 'center', marginBottom: SP.sm },
  name:       { fontSize: FZ.xl, fontWeight: '700', letterSpacing: -0.3 },
  statsRow:   { flexDirection: 'row', borderRadius: RD.lg, borderWidth: 1, overflow: 'hidden' },
  statItem:   { flex: 1, alignItems: 'center', paddingVertical: SP.md },
  statVal:    { fontSize: FZ.xl, fontWeight: '700', letterSpacing: -0.3 },
  statLbl:    { fontSize: FZ.xs, marginTop: 2 },
  divider:    { width: 1 },
  logoutBtn:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SP.sm, padding: SP.md, borderRadius: RD.md, borderWidth: 1 },
  logoutText: { fontSize: FZ.md, fontWeight: '600' },
});

// ─── BOTTOM TABS ─────────────────────────────────────

function AppTabs() {
  const scheme = useColorScheme();
  const theme = scheme === 'dark' ? DARK : LIGHT;
  const { role } = useAuth();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: { backgroundColor: theme.tabBar, borderTopColor: theme.tabBorder, borderTopWidth: 1, height: Platform.OS === 'ios' ? 86 : 62, paddingBottom: Platform.OS === 'ios' ? 26 : 10, paddingTop: 10, elevation: 0, shadowOpacity: 0 },
        tabBarActiveTintColor: theme.text,
        tabBarInactiveTintColor: theme.textMuted,
        tabBarLabelStyle: { fontSize: FZ.xs, fontWeight: '500', marginTop: 2 },
        tabBarIcon: ({ color, focused }) => {
          const sw = focused ? 2 : 1.5;
          if (route.name === 'Tasks')     return <I.Task   size={20} color={color} sw={sw} />;
          if (route.name === 'Analytics') return <I.Bar    size={20} color={color} sw={sw} />;
          if (route.name === 'Settings')  return <I.Cog    size={20} color={color} sw={sw} />;
          if (route.name === 'Profile')   return <I.Person size={20} color={color} sw={sw} />;
        },
      })}
    >
      <Tab.Screen name="Tasks"     component={TasksScreen}     />
      {/* Hide Analytics from Standard Users */}
      {(role === 'admin' || role === 'manager') && (
        <Tab.Screen name="Analytics" component={AnalyticsScreen} />
      )}
      <Tab.Screen name="Settings"  component={SettingsScreen}  />
      <Tab.Screen name="Profile"   component={ProfileScreen}   />
    </Tab.Navigator>
  );
}

// ─── ROOT ────────────────────

function Root() {
  const { cookie, loading } = useAuth();
  const scheme = useColorScheme();
  const theme = scheme === 'dark' ? DARK : LIGHT;
  
  if (loading) return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.bg }}>
      <ActivityIndicator color={theme.text} />
    </View>
  );

  return (
    <NavigationContainer>
      {cookie
        ? <AppTabs />
        : <AuthStackNav.Navigator screenOptions={{ headerShown: false }}>
            <AuthStackNav.Screen name="Login"  component={LoginScreen}  />
            <AuthStackNav.Screen name="Signup" component={SignupScreen} />
          </AuthStackNav.Navigator>
      }
    </NavigationContainer>
  );
}

// ─── APP 
export default function App() {
  return <AuthProvider><Root /></AuthProvider>;
}
