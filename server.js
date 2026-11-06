const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const authRoutes = require('./backend/routes/auth');
const requestRoutes = require('./backend/routes/requests');
const resourceRoutes = require('./backend/routes/resources');
const userRoutes = require('./backend/routes/users');
const notificationRoutes = require('./backend/routes/notifications');
const reportRoutes = require('./backend/routes/reports');
const departmentRoutes = require('./backend/routes/departments');

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  app.use(cors());
  app.use(express.json());

  // API Health & Routes
  app.get('/api/health', (req, res) => res.json({ status: 'ok', service: 'RRAM System API' }));

  app.use('/api/auth', authRoutes);
  app.use('/api/requests', requestRoutes);
  app.use('/api/resources', resourceRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/notifications', notificationRoutes);
  app.use('/api/reports', reportRoutes);
  app.use('/api/departments', departmentRoutes);

  // Catch-all API error handler
  app.use('/api', (err, req, res, next) => {
    console.error('[API Error]:', err);
    res.status(500).json({ error: 'Something went wrong on the server.' });
  });

  // Serve static assets from public folders
  app.use('/public', express.static(path.resolve(__dirname, 'public')));
  app.use(express.static(path.resolve(__dirname, 'frontend', 'public')));

  // Frontend Integration (Vite Middleware in dev / Static dist in production)
  const isProduction = process.env.NODE_ENV === 'production';
  const distPath = path.resolve(__dirname, 'dist');

  if (!isProduction && !fs.existsSync(distPath)) {
    try {
      const { createServer: createViteServer } = await import('vite');
      const vite = await createViteServer({
        server: { middlewareMode: true, hmr: false },
        appType: 'spa',
        root: path.resolve(__dirname, 'frontend'),
      });
      app.use(vite.middlewares);
      console.log('Vite middleware mounted in development mode');
    } catch (err) {
      console.warn('Could not start Vite middleware:', err.message);
      // Fallback to static if dist exists
      if (fs.existsSync(distPath)) {
        app.use(express.static(distPath));
        app.get('*', (req, res) => res.sendFile(path.join(distPath, 'index.html')));
      }
    }
  } else {
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`RRAM server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
