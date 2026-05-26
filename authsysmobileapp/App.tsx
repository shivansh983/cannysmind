import React, { useState, useRef, useEffect, createContext, useContext } from 'react';
import {
  View, Text, TextInput, TextInputProps, TouchableOpacity,
  TouchableWithoutFeedback, StyleSheet, Alert, KeyboardAvoidingView,
  Platform, FlatList, ScrollView, Animated, StatusBar, SafeAreaView,
  useColorScheme, ActivityIndicator, ViewStyle,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Svg, { Path, Circle, Rect, Line, Polyline } from 'react-native-svg';



const API_BASE = 'http://10.0.2.2:8000/api';

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
    const res = await fetch(`${API_BASE}${path}`, {
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `sessionId=${cookie}`,
      },
    });
    return res.json();
  },

  authPost: async (path: string, body: object, cookie: string): Promise<any> => {
    const res = await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `sessionId=${cookie}`,
      },
      body: JSON.stringify(body),
    });
    return res.json();
  },
};

// ─── THEME ─────────────────────────

const LIGHT = {
  bg: '#ffffff', bgSecondary: '#fafafa', bgTertiary: '#f4f4f5',
  surface: '#ffffff', border: '#e4e4e7', borderStrong: '#d4d4d8',
  text: '#09090b', textSecondary: '#52525b', textMuted: '#a1a1aa',
  accent: '#09090b', accentText: '#fafafa', accentMuted: '#f4f4f5',
  success: '#16a34a', successBg: '#f0fdf4',
  warning: '#d97706', warningBg: '#fffbeb',
  danger: '#dc2626', dangerBg: '#fef2f2',
  blue: '#2563eb', blueBg: '#eff6ff',
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
  card: '#111113', cardBorder: '#27272a',
  inputBg: '#111113', tabBar: '#09090b', tabBorder: '#27272a',
};

type Theme = typeof LIGHT;

const SP = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 } as const;
const RD = { sm: 6, md: 8, lg: 12, xl: 16, full: 999 } as const;
const FZ = { xs: 11, sm: 12, md: 14, lg: 16, xl: 18, xxl: 22, xxxl: 28 } as const;

// ─── AUTH CONTEXT ───────

interface AuthCtx {
  cookie: string | null;
  login: (cookieValue: string) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthCtx>({
  cookie: null,
  login: async () => {},
  logout: async () => {},
  loading: true,
});

const useAuth = () => useContext(AuthContext);

function AuthProvider({ children }: { children: React.ReactNode }) {
  const [cookie, setCookie] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem('session_cookie');
        if (saved) setCookie(saved);
      } catch (_) {}
      setLoading(false);
    })();
  }, []);

  const login = async (cookieValue: string) => {
    await AsyncStorage.setItem('session_cookie', cookieValue);
    setCookie(cookieValue);
  };

  const logout = async () => {
    try {
      if (cookie) await api.authPost('/auth/logout', {}, cookie);
    } catch (_) {}
    await AsyncStorage.removeItem('session_cookie');
    setCookie(null);
  };

  return (
    <AuthContext.Provider value={{ cookie, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

// ─── NAVIGATION TYPES ────────────────────────

type AuthStack = { Login: undefined; Signup: undefined; };
type LoginNav = NativeStackNavigationProp<AuthStack, 'Login'>;
type SignupNav = NativeStackNavigationProp<AuthStack, 'Signup'>;

const AuthStackNav = createNativeStackNavigator<AuthStack>();
const Tab = createBottomTabNavigator();

// ─── SVG ICONS ──────────────────────────────
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
};

// ─── SHARED UI COMPONENTS ────────────────────────

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
        <TextInput
          style={[sh.input, { color: theme.text }]}
          placeholderTextColor={theme.textMuted}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          {...rest}
        />
        {iconRight && (
          <TouchableWithoutFeedback onPress={onIconRight}>
            <View style={sh.iRight}>{iconRight}</View>
          </TouchableWithoutFeedback>
        )}
      </View>
      {!!error && (
        <View style={sh.errRow}>
          <I.Alert size={12} color={theme.danger} />
          <Text style={[sh.errText, { color: theme.danger }]}>{error}</Text>
        </View>
      )}
    </View>
  );
}

interface BtnProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
  theme: Theme;
  variant?: 'solid' | 'outline';
  style?: ViewStyle;
}

function Btn({ title, onPress, loading, theme, variant = 'solid', style }: BtnProps) {
  const sc = useRef(new Animated.Value(1)).current;
  const solid = variant === 'solid';
  return (
    <Animated.View style={{ transform: [{ scale: sc }] }}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={() => Animated.spring(sc, { toValue: 0.97, useNativeDriver: true }).start()}
        onPressOut={() => Animated.spring(sc, { toValue: 1, useNativeDriver: true }).start()}
        disabled={loading}
        activeOpacity={0.85}
        style={[sh.btn, {
          backgroundColor: solid ? theme.accent : 'transparent',
          borderColor: solid ? theme.accent : theme.border,
        }, style]}
      >
        {loading
          ? <ActivityIndicator color={solid ? theme.accentText : theme.text} size="small" />
          : <Text style={[sh.btnText, { color: solid ? theme.accentText : theme.text }]}>{title}</Text>
        }
      </TouchableOpacity>
    </Animated.View>
  );
}

function PageHeader({ title, theme, right }: { title: string; theme: Theme; right?: React.ReactNode }) {
  return (
    <View style={[sh.pageHeader, { borderBottomColor: theme.border }]}>
      <Text style={[sh.pageTitle, { color: theme.text }]}>{title}</Text>
      {right}
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
});

// ─── LOGIN ──────────────────────

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
      const data = await api.post('/auth/login', {
        userName: userName.trim(),
        password,
      });

      if (data.cookieValue) {
        await login(data.cookieValue);
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
            <Field
              label="Username"
              iconLeft={<I.At size={16} color={theme.textMuted} />}
              placeholder="your_username"
              autoCapitalize="none"
              autoCorrect={false}
              value={userName}
              onChangeText={t => { setUserName(t); setErrors(p => ({ ...p, userName: '' })); }}
              error={errors.userName}
              theme={theme}
            />
            <Field
              label="Password"
              iconLeft={<I.Lock size={16} color={theme.textMuted} />}
              placeholder="••••••••"
              secureTextEntry={!showPw}
              value={password}
              onChangeText={t => { setPassword(t); setErrors(p => ({ ...p, password: '' })); }}
              error={errors.password}
              iconRight={showPw ? <I.EyeOff size={16} color={theme.textMuted} /> : <I.Eye size={16} color={theme.textMuted} />}
              onIconRight={() => setShowPw(p => !p)}
              theme={theme}
            />
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

// ─── SIGNUP ──────────────────

function SignupScreen({ navigation }: { navigation: SignupNav }) {
  const scheme = useColorScheme();
  const theme = scheme === 'dark' ? DARK : LIGHT;

 
  const [form, setForm] = useState({
    name: '',
    userName: '',   
    email: '',
    phone: '',
    password: '',
  });
  const [showPw, setShowPw] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const set = (k: keyof typeof form, v: string) => {
    setForm(p => ({ ...p, [k]: v }));
    setErrors(p => ({ ...p, [k]: '' }));
  };

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
      const data = await api.post('/auth/signup', {
        name: form.name.trim(),
        userName: form.userName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || undefined,
        password: form.password,
      });

      if (data.message === 'User created successfully') {
        Alert.alert('Account created!', 'You can now sign in.', [
          { text: 'Sign in', onPress: () => navigation.navigate('Login') },
        ]);
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
            <Field
              label="Password"
              iconLeft={<I.Lock size={16} color={theme.textMuted} />}
              placeholder="Min. 6 characters"
              secureTextEntry={!showPw}
              value={form.password}
              onChangeText={t => set('password', t)}
              error={errors.password}
              iconRight={showPw ? <I.EyeOff size={16} color={theme.textMuted} /> : <I.Eye size={16} color={theme.textMuted} />}
              onIconRight={() => setShowPw(p => !p)}
              theme={theme}
            />
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



interface Task {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  startedAt: string;
  completedAt?: string;
  duration?: string;
  //approver
  //assigned
}

const DUMMY: Task[] = [
  { id: 'AB1234', name: 'Fix Postgres Sync Issues', isActive: false, startedAt: new Date().toISOString(), completedAt: new Date().toISOString(), duration: '12 minutes' },
  { id: 'CD5678', name: 'Build React Native UI', isActive: true, startedAt: new Date().toISOString() },
  { id: 'EF9012', name: 'Connect Auth APIs', isActive: true, startedAt: new Date().toISOString() },
];

function TasksScreen() {
  const scheme = useColorScheme();
  const theme = scheme === 'dark' ? DARK : LIGHT;
  const { cookie } = useAuth();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [fetching, setFetching] = useState(true);
  const [grid, setGrid] = useState(false);
  const [filter, setFilter] = useState('All');

  useEffect(() => { load(); }, []);

  const load = async () => {
    setFetching(true);
    try {
      const data = await api.authGet('/tasks', cookie ?? '');
      setTasks(Array.isArray(data.tasks) ? data.tasks : DUMMY);
    } catch { setTasks(DUMMY); }
    finally { setFetching(false); }
  };

  const markComplete = async (taskId: string) => {
    try {
      const data = await api.authPost(`/tasks/${taskId}/complete`, {}, cookie ?? '');
      if (data.task) {
        setTasks(prev => prev.map(t => t.id === taskId ? data.task : t));
        Alert.alert('Done!', `Completed in ${data.timeTaken}`);
      }
    } catch {
      Alert.alert('Error', 'Could not complete task.');
    }
  };

  const getStatus = (t: Task) => {
    if (!t.isActive && t.completedAt) return 'Completed';
    if (t.isActive) return 'In Progress';
    return 'Pending';
  };

  const FILTERS = ['All', 'In Progress', 'Completed'];

  const filtered = tasks.filter(t => {
    if (filter === 'All') return true;
    return getStatus(t) === filter;
  });

  const badge = (t: Task) => {
    const s = getStatus(t);
    if (s === 'Completed') return { text: theme.success, bg: theme.successBg, label: 'Completed' };
    return { text: theme.warning, bg: theme.warningBg, label: 'In Progress' };
  };

  const renderItem = ({ item }: { item: Task }) => {
    const b = badge(item);
    const canComplete = item.isActive;

    if (grid) return (
      <View style={[tk.gridCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
        <Text style={[tk.gridTitle, { color: theme.text }]} numberOfLines={2}>{item.name}</Text>
        <Text style={[tk.idText, { color: theme.textMuted }]}>#{item.id}</Text>
        <View style={[tk.badge, { backgroundColor: b.bg }]}>
          <Text style={[tk.badgeText, { color: b.text }]}>{b.label}</Text>
        </View>
        {item.duration && item.duration !== 'Pending' &&
          <Text style={[tk.duration, { color: theme.textMuted }]}>{item.duration}</Text>
        }
        {canComplete && (
          <TouchableOpacity style={[tk.completeBtn, { borderColor: theme.border }]} onPress={() => markComplete(item.id)}>
            <Text style={[tk.completeBtnText, { color: theme.textSecondary }]}>Mark done</Text>
          </TouchableOpacity>
        )}
      </View>
    );

    return (
      <View style={[tk.listCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
        <View style={{ flex: 1 }}>
          <Text style={[tk.listTitle, { color: theme.text }]}>{item.name}</Text>
          <View style={tk.row}>
            <Text style={[tk.idText, { color: theme.textMuted }]}>#{item.id}</Text>
            <View style={[tk.badge, { backgroundColor: b.bg }]}>
              <Text style={[tk.badgeText, { color: b.text }]}>{b.label}</Text>
            </View>
            {item.duration && item.duration !== 'Pending' &&
              <Text style={[tk.duration, { color: theme.textMuted }]}>{item.duration}</Text>
            }
          </View>
        </View>
        {canComplete && (
          <TouchableOpacity onPress={() => markComplete(item.id)} style={{ paddingLeft: SP.sm }}>
            <I.Task size={18} color={theme.success} />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
      <StatusBar barStyle={scheme === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={theme.bg} />
      <PageHeader title="Tasks" theme={theme} right={
        <View style={{ flexDirection: 'row', gap: SP.sm }}>
          <TouchableOpacity style={[sh.iconBtn, { backgroundColor: theme.bgTertiary, borderColor: theme.border }]} onPress={() => setGrid(p => !p)}>
            {grid ? <I.ListIcon size={16} color={theme.text} /> : <I.Grid size={16} color={theme.text} />}
          </TouchableOpacity>
          <TouchableOpacity style={[sh.iconBtn, { backgroundColor: theme.accent, borderColor: theme.accent }]}>
            <I.Plus size={16} color={theme.accentText} />
          </TouchableOpacity>
        </View>
      } />

      <ScrollView horizontal showsHorizontalScrollIndicator={false}
        style={[tk.filterRow, { borderBottomColor: theme.border }]}
        contentContainerStyle={{ paddingHorizontal: SP.lg, gap: SP.xs }}>
        {FILTERS.map(f => (
          <TouchableOpacity key={f} onPress={() => setFilter(f)}
            style={[tk.chip, { borderColor: theme.border, backgroundColor: filter === f ? theme.accent : 'transparent' }]}>
            <Text style={[tk.chipText, { color: filter === f ? theme.accentText : theme.textSecondary }]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {fetching
        ? <ActivityIndicator style={{ marginTop: SP.xxl }} color={theme.text} />
        : <FlatList<Task>
            key={grid ? 'g' : 'l'}
            data={filtered}
            numColumns={grid ? 2 : 1}
            renderItem={renderItem}
            keyExtractor={item => item.id}
            contentContainerStyle={{ padding: SP.lg, gap: SP.sm }}
            columnWrapperStyle={grid ? { gap: SP.sm } : undefined}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={<View style={tk.empty}><Text style={{ color: theme.textMuted, fontSize: FZ.md }}>No tasks found.</Text></View>}
          />
      }
    </SafeAreaView>
  );
}

const tk = StyleSheet.create({
  filterRow:   { borderBottomWidth: 1, paddingVertical: SP.sm, flexGrow: 0 },
  chip:        { paddingHorizontal: SP.md, paddingVertical: 6, borderRadius: RD.full, borderWidth: 1 },
  chipText:    { fontSize: FZ.sm, fontWeight: '500' },
  listCard:    { flexDirection: 'row', alignItems: 'center', padding: SP.md, borderRadius: RD.md, borderWidth: 1 },
  listTitle:   { fontSize: FZ.md, fontWeight: '500', marginBottom: 5 },
  gridCard:    { flex: 1, padding: SP.md, borderRadius: RD.md, borderWidth: 1, gap: SP.xs },
  gridTitle:   { fontSize: FZ.md, fontWeight: '600', lineHeight: 20 },
  row:         { flexDirection: 'row', gap: SP.xs, flexWrap: 'wrap', alignItems: 'center' },
  idText:      { fontSize: FZ.xs, fontWeight: '500' },
  badge:       { alignSelf: 'flex-start', paddingHorizontal: SP.sm, paddingVertical: 2, borderRadius: RD.sm },
  badgeText:   { fontSize: FZ.xs, fontWeight: '600' },
  duration:    { fontSize: FZ.xs },
  completeBtn: { marginTop: SP.xs, borderWidth: 1, borderRadius: RD.sm, paddingHorizontal: SP.sm, paddingVertical: 4, alignSelf: 'flex-start' },
  completeBtnText: { fontSize: FZ.xs, fontWeight: '600' },
  empty:       { alignItems: 'center', paddingTop: SP.xxl },
});

// ─── ANALYTICS ─────────────

function AnalyticsScreen() {
  const scheme = useColorScheme();
  const theme = scheme === 'dark' ? DARK : LIGHT;

  const cards = [
    { label: 'Total Tasks', value: '24', note: '+4 this week', c: theme.blue, bg: theme.blueBg },
    { label: 'Completed', value: '14', note: '58% done', c: theme.success, bg: theme.successBg },
    { label: 'In Progress', value: '6', note: 'Active', c: theme.warning, bg: theme.warningBg },
    { label: 'Overdue', value: '4', note: 'Attention needed', c: theme.danger, bg: theme.dangerBg },
  ];

  const bars = [
    { label: 'Completed', pct: 58, c: theme.success },
    { label: 'In Progress', pct: 25, c: theme.warning },
    { label: 'Pending', pct: 17, c: theme.danger },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
      <StatusBar barStyle={scheme === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={theme.bg} />
      <PageHeader title="Analytics" theme={theme} right={<I.Trend size={18} color={theme.textSecondary} />} />
      <ScrollView contentContainerStyle={{ padding: SP.lg, gap: SP.md }} showsVerticalScrollIndicator={false}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: SP.sm }}>
          {cards.map(c => (
            <View key={c.label} style={[an.card, { backgroundColor: theme.card, borderColor: theme.cardBorder, width: '47.5%' }]}>
              <View style={[an.dot, { backgroundColor: c.bg }]}><I.Bar size={13} color={c.c} /></View>
              <Text style={[an.val, { color: theme.text }]}>{c.value}</Text>
              <Text style={[an.cardLabel, { color: theme.textSecondary }]}>{c.label}</Text>
              <Text style={[an.note, { color: c.c }]}>{c.note}</Text>
            </View>
          ))}
        </View>
        <View style={[an.section, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
          <Text style={[an.secTitle, { color: theme.text }]}>Status breakdown</Text>
          {bars.map(b => (
            <View key={b.label} style={{ marginTop: SP.sm }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                <Text style={{ fontSize: FZ.sm, color: theme.textSecondary }}>{b.label}</Text>
                <Text style={{ fontSize: FZ.sm, color: theme.text, fontWeight: '600' }}>{b.pct}%</Text>
              </View>
              <View style={[an.track, { backgroundColor: theme.bgTertiary }]}>
                <View style={[an.fill, { width: `${b.pct}%` as any, backgroundColor: b.c }]} />
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const an = StyleSheet.create({
  card:      { padding: SP.md, borderRadius: RD.lg, borderWidth: 1, gap: 2 },
  dot:       { width: 26, height: 26, borderRadius: RD.sm, justifyContent: 'center', alignItems: 'center', marginBottom: SP.xs },
  val:       { fontSize: FZ.xxl, fontWeight: '700', letterSpacing: -0.5 },
  cardLabel: { fontSize: FZ.sm, fontWeight: '500' },
  note:      { fontSize: FZ.xs, fontWeight: '500' },
  section:   { padding: SP.lg, borderRadius: RD.lg, borderWidth: 1 },
  secTitle:  { fontSize: FZ.lg, fontWeight: '600' },
  track:     { height: 5, borderRadius: RD.full, overflow: 'hidden' },
  fill:      { height: '100%', borderRadius: RD.full },
});

// ─── SETTINGS ───────────────

function SettingsScreen() {
  const scheme = useColorScheme();
  const theme = scheme === 'dark' ? DARK : LIGHT;
  const rows = [
    { label: 'Notifications', sub: 'Push alerts for task updates' },
    { label: 'Privacy', sub: 'Manage your data' },
    { label: 'Appearance', sub: 'Follows system setting' },
    { label: 'Language', sub: 'English' },
    { label: 'About', sub: 'Version 1.0.0' },
  ];
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
      <StatusBar barStyle={scheme === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={theme.bg} />
      <PageHeader title="Settings" theme={theme} />
      <ScrollView contentContainerStyle={{ padding: SP.lg }} showsVerticalScrollIndicator={false}>
        <View style={[se.group, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
          {rows.map((r, i) => (
            <TouchableOpacity key={r.label} style={[se.row, i < rows.length - 1 && { borderBottomWidth: 1, borderBottomColor: theme.border }]}>
              <View style={{ flex: 1 }}>
                <Text style={[se.rowLabel, { color: theme.text }]}>{r.label}</Text>
                <Text style={[se.rowSub, { color: theme.textMuted }]}>{r.sub}</Text>
              </View>
              <I.Chevron size={14} color={theme.textMuted} />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const se = StyleSheet.create({
  group:    { borderRadius: RD.lg, borderWidth: 1, overflow: 'hidden' },
  row:      { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SP.md, paddingVertical: SP.md, gap: SP.sm },
  rowLabel: { fontSize: FZ.md, fontWeight: '500', marginBottom: 2 },
  rowSub:   { fontSize: FZ.sm },
});

// ─── PROFILE ─────────────

function ProfileScreen() {
  const scheme = useColorScheme();
  const theme = scheme === 'dark' ? DARK : LIGHT;
  const { cookie, logout } = useAuth();

  const clientId = cookie ? cookie.split('.')[0] : '—';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
      <StatusBar barStyle={scheme === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={theme.bg} />
      <PageHeader title="Profile" theme={theme} />
      <ScrollView contentContainerStyle={{ padding: SP.lg, gap: SP.md }} showsVerticalScrollIndicator={false}>
        <View style={[pr.hero, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
          <View style={[pr.avatar, { backgroundColor: theme.bgTertiary, borderColor: theme.border }]}>
            <I.Person size={26} color={theme.textSecondary} />
          </View>
          <Text style={[pr.name, { color: theme.text }]}>Team Member</Text>
          <Text style={{ color: theme.textSecondary, fontSize: FZ.sm }}>ID: {clientId}</Text>
        </View>

        <View style={[se.group, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
          {[{ label: 'Session', value: 'Active' }, { label: 'Client ID', value: clientId }].map((r, i, arr) => (
            <View key={r.label} style={[se.row, i < arr.length - 1 && { borderBottomWidth: 1, borderBottomColor: theme.border }]}>
              <Text style={[se.rowLabel, { color: theme.text, flex: 1, marginBottom: 0 }]}>{r.label}</Text>
              <Text style={{ color: theme.textSecondary, fontSize: FZ.sm }}>{r.value}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity
          style={[pr.logoutBtn, { backgroundColor: theme.dangerBg, borderColor: theme.danger + '55' }]}
          onPress={logout}
        >
          <I.LogOut size={16} color={theme.danger} />
          <Text style={[pr.logoutText, { color: theme.danger }]}>Sign out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const pr = StyleSheet.create({
  hero:       { alignItems: 'center', padding: SP.xl, borderRadius: RD.lg, borderWidth: 1, gap: SP.xs },
  avatar:     { width: 68, height: 68, borderRadius: RD.full, borderWidth: 1, justifyContent: 'center', alignItems: 'center', marginBottom: SP.sm },
  name:       { fontSize: FZ.xl, fontWeight: '700', letterSpacing: -0.3 },
  logoutBtn:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SP.sm, padding: SP.md, borderRadius: RD.md, borderWidth: 1 },
  logoutText: { fontSize: FZ.md, fontWeight: '600' },
});

// ─── BOTTOM TABS ────────────
function AppTabs() {
  const scheme = useColorScheme();
  const theme = scheme === 'dark' ? DARK : LIGHT;
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
      <Tab.Screen name="Analytics" component={AnalyticsScreen} />
      <Tab.Screen name="Settings"  component={SettingsScreen}  />
      <Tab.Screen name="Profile"   component={ProfileScreen}   />
    </Tab.Navigator>
  );
}

// ─── ROOT ──────────────────

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

// ─── APP ──────────────────────────────
export default function App() {
  return <AuthProvider><Root /></AuthProvider>;
}