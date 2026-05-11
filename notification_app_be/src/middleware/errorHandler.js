import { Log } from '../../../logging_middleware/src/logger.js';

const errorHandler = (err, req, res, next) => {
  Log('backend', 'error', 'handler', `Error caught: ${err.message}`);

  if (err.response) {
    Log('backend', 'error', 'handler', `Upstream service returned ${err.response.status}`);
    return res.status(502).json({
      success: false,
      message: 'Upstream notification service failed',
    });
  }

  if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
    Log('backend', 'fatal', 'handler', `Upstream unreachable — ${err.code}`);
    return res.status(503).json({
      success: false,
      message: 'Cannot connect to upstream service',
    });
  }

  res.status(err.status || 500).json({
    success: false,
    message: err.status ? err.message : 'Something went wrong',
  });
};

export default errorHandler;
