import 'dotenv/config';

export default {
  logLevel: process.env.LOG_LEVEL || 'debug',
  accessToken: process.env.ACCESS_TOKEN,
  baseUrl: process.env.BASE_URL,
};
