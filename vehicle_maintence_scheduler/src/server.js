import app from './app.js';
import config from './config/index.js';
import { Log } from '../../logging_middleware/src/logger.js';

const PORT = config.port;

app.listen(PORT, () => {
  Log('backend', 'info', 'config', `Server started on port ${PORT} [${config.nodeEnv}]`);

  if (!config.accessToken) {
    Log('backend', 'warn', 'auth', 'ACCESS_TOKEN is not set — protected API calls will fail');
  }
  if (!config.baseUrl) {
    Log('backend', 'warn', 'config', 'BASE_URL is not configured');
  }
});
