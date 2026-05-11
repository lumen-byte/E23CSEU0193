import { Log } from '../../../logging_middleware/src/logger.js';

const errorHandler = (err, req, res, next) => {
  Log('backend', 'error', 'handler', `Unhandled error: ${err.message}`);

  // upstream API returned an error status
  if (err.response) {
    Log('backend', 'error', 'handler', `Upstream API returned ${err.response.status}`);
    return res.status(502).json({
      success: false,
      message: 'Failed to fetch data from upstream service',
    });
  }

  if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
    Log('backend', 'fatal', 'handler', `Cannot reach upstream: ${err.code}`);
    return res.status(503).json({
      success: false,
      message: 'Upstream service is unreachable',
    });
  }

  const statusCode = err.status || 500;
  res.status(statusCode).json({
    success: false,
    message: statusCode === 500 ? 'Internal server error' : err.message,
  });
};

export default errorHandler;
