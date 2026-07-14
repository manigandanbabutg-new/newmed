import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { MeditationService } from './src/server/service';
import { createMeditationRouter } from './src/server/controller';

/**
 * Main application entry point.
 * This file serves as the equivalent to "main.java" in our running stack.
 */
async function startServer() {
  const app = express();
  const PORT = 3000;

  // Enable JSON request body parsing
  app.use(express.json());

  // Initialize business services
  const meditationService = new MeditationService();

  // API router configuration
  const apiRouter = createMeditationRouter(meditationService);
  app.use('/api', apiRouter);

  // Vite integration and static asset serving
  if (process.env.NODE_ENV !== 'production') {
    console.log('Integrating Vite development server middleware...');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    console.log('Serving production static build from ./dist...');
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    
    // Express v4 wildcard routing for SPA
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Bind to 0.0.0.0 for container ingress compatibility
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server successfully started and running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((error) => {
  console.error('Fatal: Server failed to start:', error);
  process.exit(1);
});
