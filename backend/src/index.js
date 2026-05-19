require('dotenv').config();
const express = require('express');
const cors = require('cors');
const {
  authRoutes,
  productsRoutes,
  categoriesRoutes,
  customersRoutes,
  salesRoutes,
  inventoryRoutes,
  accountsRoutes,
  chatbotRoutes,
  passwordResetRoutes
} = require('./routes');

const app = express();
const PORT = process.env.PORT || 4000;

// Middlewares - Configuracion CORS actualizada para ngrok
app.use(cors({
  origin: '*', 
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'ngrok-skip-browser-warning'] 
}));
app.use(express.json());

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/customers', customersRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/accounts', accountsRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/password-reset', passwordResetRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Ruta no encontrada'
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    message: 'Error interno del servidor'
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`
  ╔═══════════════════════════════════════════╗
  ║      🔧 FerreSync API Server              ║
  ║      Servidor corriendo en puerto ${PORT}     ║
  ║      Escuchando en 0.0.0.0                ║
  ╚═══════════════════════════════════════════╝
  `);
});