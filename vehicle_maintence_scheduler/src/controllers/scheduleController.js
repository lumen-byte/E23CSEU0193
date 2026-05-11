import { computeSchedule } from '../services/scheduleService.js';
import { Log } from '../../../logging_middleware/src/logger.js';

export const getOptimizedSchedule = async (req, res, next) => {
  try {
    Log('backend', 'info', 'controller', 'Schedule optimization request received');

    const results = await computeSchedule();

    Log('backend', 'info', 'controller', `Returning optimized schedule — ${results.length} depot results`);

    res.status(200).json({ success: true, results });
  } catch (err) {
    Log('backend', 'error', 'controller', `Schedule endpoint failed: ${err.message}`);
    next(err);
  }
};
