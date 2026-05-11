import axios from 'axios';
import config from '../config/index.js';
import { Log } from '../../../logging_middleware/src/logger.js';

const apiClient = axios.create({
  baseURL: config.baseUrl,
  timeout: 12000,
});

apiClient.interceptors.request.use((reqConfig) => {
  if (config.accessToken) {
    reqConfig.headers.Authorization = `Bearer ${config.accessToken}`;
  }
  return reqConfig;
});

apiClient.interceptors.response.use(
  (res) => res,
  (err) => {
    const url = err.config?.url || 'unknown';
    const status = err.response?.status || 'NETWORK_ERR';
    Log('backend', 'error', 'utils', `Upstream request failed — ${url} (${status})`);
    return Promise.reject(err);
  }
);

export default apiClient;
