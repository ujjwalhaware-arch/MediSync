const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { initSchema } = require('./database');
const { checkOverdueDosesAndEscalate } = require('./services/doseScheduler');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/medicines', require('./routes/medicineRoutes'));
app.use('/api/doses', require('./routes/doseRoutes'));
app.use('/api/inventory', require('./routes/inventoryRoutes'));
app.use('/api/analytics', require('./routes/analyticsRoutes'));
app.use('/api/caregiver', require('./routes/caregiverRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    platform: 'MediSync Healthcare API',
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({ error: 'Internal server error occurred.' });
});

// Startup sequence
async function startServer() {
  try {
    await initSchema();

    // Start background missed-dose and escalation worker (runs every 30 seconds)
    setInterval(async () => {
      try {
        await checkOverdueDosesAndEscalate();
      } catch (err) {
        console.error('Background worker error:', err);
      }
    }, 30000);

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`===============================================`);
      console.log(`🏥 MediSync Server running on port ${PORT}`);
      console.log(`📡 API Base: http://localhost:${PORT}/api`);
      console.log(`===============================================`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
