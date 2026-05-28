const { authSchema, loginSchema } = require('./validator');
const registerClient = require('./services/signup');
const loginClient = require('./services/login');
const redis = require('../../lib/redis');
const crypto = require('crypto');

async function signup(req, res) {
  try {
    const validation = authSchema.safeParse(req.body);

    if (!validation.success) {
      const errorMessages = validation.error.issues.map(err => err.message);
      return res.status(400).json({ 
        error: 'Validation Failed', 
        missingCriteria: errorMessages 
      });
    }

    const { name, userName, email, phone, password } = validation.data;

    const client = await registerClient(name, userName, email, phone, password);
    
    return res.status(201).json({ 
      message: 'User created successfully', 
      client 
    });

  } catch (error) {
    if (error.message === 'USERNAME_TAKEN') {
      return res.status(409).json({ error: 'Username already exists' });
    }
    if (error.message === 'EMAIL_TAKEN') {
      return res.status(409).json({ error: 'Email already exists' });
    }

    console.error("Signup Error:", error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function login(req, res) {
  try {
    const validation = loginSchema.safeParse(req.body);

    if (!validation.success) {
      const errorMessages = validation.error.issues.map(err => err.message);
      return res.status(400).json({ 
        error: 'Validation Failed', 
        missingCriteria: errorMessages 
      });
    }

    const { userName, password } = validation.data;
    
    // We now extract 'role' from your login service as well
    const { clientId, token, role } = await loginClient(userName, password);

    const cookieValue = `${clientId}.${token}`;

    res.cookie('sessionId', cookieValue, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000
    });

    // THIS IS THE FIX: We send the user object back with the cookie
    return res.status(200).json({ 
      message: 'Login successful', 
      cookieValue,
      user: {
        id: clientId,
        role: role || 'user' // Default to 'user' if not found
      }
    });
  } catch (error) {
    if (error.message === 'INVALID_CREDENTIALS') return res.status(401).json({ error: 'Invalid username or password' });
    console.error(error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function logout(req, res) {
  try {
    console.log('COOKIES RECEIVED:', req.cookies);

    const cookieValue = req.cookies?.sessionId;

    if (!cookieValue) {
      return res.status(400).json({ error: 'No session cookie found' });
    }

    const parts = cookieValue.split('.');
    if (parts.length === 2) {
      const clientId = parts[0];
      const token = parts[1];
      console.log("parts,clientI,token")

      const hashedSessionToken = crypto.createHash('sha256').update(token).digest('hex');
      console.log('DELETING KEY:', `app:${clientId}:${hashedSessionToken}`);

      await redis.del(`app:${clientId}:${hashedSessionToken}`);
    }

    res.clearCookie('sessionId');
    return res.status(200).json({ message: 'Logged out securely' });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Logout failed' });
  }
}

module.exports = { signup, login, logout };