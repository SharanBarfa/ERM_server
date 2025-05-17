import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();

// CORS configuration - Allow all origins in development
app.use(cors({
  origin: '*', // Allow all origins
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Test route
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'CORS test successful!',
    origin: req.headers.origin || 'No origin header'
  });
});

// User profile test route
app.get('/api/users/profile', (req, res) => {
  res.json({
    success: true,
    data: {
      _id: 'test123',
      name: 'Test User',
      email: 'test@example.com',
      role: 'employee',
      employee: {
        _id: 'emp123',
        employeeId: 'EMP001',
        firstName: 'Test',
        lastName: 'User',
        position: 'Developer',
        department: {
          _id: 'dept001',
          name: 'Engineering'
        }
      }
    }
  });
});

// Login test route
app.post('/api/users/login', (req, res) => {
  const { email, password } = req.body;
  
  res.json({
    success: true,
    data: {
      _id: 'test123',
      name: 'Test User',
      email: email || 'test@example.com',
      role: 'employee',
      token: 'test_token_123',
      employee: {
        _id: 'emp123',
        employeeId: 'EMP001'
      }
    }
  });
});

// Start server on a different port
const PORT = 5001;
app.listen(PORT, () => {
  console.log(`CORS Test Server running on port ${PORT}`);
  console.log(`Test URL: hhttps://erm-server.onrender.com:${PORT}/api/test`);
});
