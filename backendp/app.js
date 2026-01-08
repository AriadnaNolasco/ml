const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();

// ===============================
// MIDDLEWARES DE SEGURIDAD
// ===============================
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
    maxAge: 63072000,
    includeSubDomains: true,
    preload: true
  },
  referrerPolicy: { policy: 'same-origin' }
}));

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));

app.use(morgan('dev'));
app.use(express.json());

// ===============================
// RATE LIMIT → LOGIN
// ===============================
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use('/api/auth/login', limiter);

// ===============================
// IMPORTAR RUTAS
// ===============================
const publicRoutes = require('./routes/publicRoutes');
const userRoutes = require('./routes/userRoutes');
const almacenRoutes = require('./routes/almacenRoutes');
const notasRoutes = require('./routes/notasRoutes');
const movimientosRoutes = require('./routes/movimientosRoutes');
const kardexRoutes = require('./routes/kardexRoutes');
const comprasRoutes = require('./routes/comprasRoutes');
const contabilidadRoutes = require('./routes/contabilidadRoutes');
const ventasRoutes = require('./routes/ventasRoutes');
const pedidosRoutes = require('./routes/pedidosRoutes');
const sunatRoutes = require('./routes/sunat');
const ordenFabricacionRoutes = require('./routes/ordenFabricacionRoutes');
const guiasRemisionRoutes = require('./routes/Guiasremisionroutes');
const mantenimientoRoutes = require('./routes/mantenimientoRoutes'); // ← aquí está PLANIFICACIÓN

// ===============================
// REGISTRAR RUTAS
// ===============================
app.use('/api', publicRoutes);
app.use('/api/auth', userRoutes);
app.use('/api/almacen', almacenRoutes, movimientosRoutes, notasRoutes, kardexRoutes );
app.use('/api/compras', comprasRoutes);
app.use('/api/contabilidad', contabilidadRoutes);
app.use('/api/ventas', ventasRoutes);
app.use('/api/pedidos', pedidosRoutes);
app.use('/api/sunat', sunatRoutes);
app.use('/api/ordenes-fabricacion', ordenFabricacionRoutes);
app.use('/api/guias-remision', guiasRemisionRoutes);
app.use('/api/mantenimiento', mantenimientoRoutes);

// ===============================
// MANEJO DE ERRORES
// ===============================
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Error interno del servidor' });
});

// ===============================
// INICIAR SERVIDOR
// ===============================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
