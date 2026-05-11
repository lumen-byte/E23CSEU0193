import axios from 'axios';
import config from '../config/index.js';
import { Log } from '../../../logging_middleware/src/logger.js';

const apiClient = axios.create({
  baseURL: config.baseUrl,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// attach access token on every outgoing request
apiClient.interceptors.request.use((reqConfig) => {
  if (config.accessToken) {
    reqConfig.headers.Authorization = `Bearer ${config.accessToken}`;
  }
  return reqConfig;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status || 'NETWORK_ERROR';
    const url = error.config?.url || 'unknown';
    Log('backend', 'error', 'utils', `API call failed: ${url} — status ${status}`);
    return Promise.reject(error);
  }
);

export default apiClient;
