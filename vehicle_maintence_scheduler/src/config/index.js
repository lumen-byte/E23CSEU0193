import 'dotenv/config';

export default {
  port: process.env.PORT || 4000,
  nodeEnv: process.env.NODE_ENV || 'development',
  baseUrl: process.env.BASE_URL,
  accessToken: process.env.ACCESS_TOKEN,
};
