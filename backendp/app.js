const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();

app.use('/api/mantenimiento/planificacion', require('./routes/planificacionRoutes'));



// Middlewares de seguridad
// En app.js, mejorar la configuración de Helmet
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:"],
    },
  },
  hsts: {
    maxAge: 63072000, // 2 años en segundos
    includeSubDomains: true,
    preload: true
  },
  referrerPolicy: { policy: 'same-origin' }
}));
app.use(cors({
  origin: 'http://localhost:5173', // o el puerto de tu frontend
  credentials: true
}));
app.use(morgan('dev'));
app.use(express.json());

// Limitar peticiones de login
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100 // límite de 100 peticiones por ventana
});
app.use('/api/auth/login', limiter);

// Rutas
const publicRoutes = require('./routes/publicRoutes');
const userRoutes = require('./routes/userRoutes');
const almacenRoutes = require('./routes/almacenRoutes');
const comprasRoutes = require('./routes/comprasRoutes');
const contabilidadRoutes = require('./routes/contabilidadRoutes');
const ventasRoutes = require('./routes/ventasRoutes');
const pedidosRoutes = require('./routes/pedidosRoutes');
const sunatRoutes = require('./routes/sunat');
const mantenimientoRoutes = require('./routes/mantenimientoRoutes');//






app.use('/api', publicRoutes);
app.use('/api/auth', userRoutes);
app.use('/api/almacen', almacenRoutes);
app.use('/api/compras', comprasRoutes); 
app.use('/api/contabilidad', contabilidadRoutes);
app.use('/api/ventas', ventasRoutes); 
app.use('/api/pedidos', pedidosRoutes);
app.use('/api/sunat', sunatRoutes);
app.use('/api/mantenimiento', mantenimientoRoutes);//


// Manejo de errores
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Error interno del servidor' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});