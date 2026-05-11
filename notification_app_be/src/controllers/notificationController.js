import { getPriorityInbox, fetchNotifications } from '../services/notificationService.js';
import { Log } from '../../../logging_middleware/src/logger.js';

export const getPriorityNotifications = async (req, res, next) => {
  try {
    Log('backend', 'info', 'controller', 'Priority inbox request received');
    const notifications = await getPriorityInbox();

    Log('backend', 'info', 'controller', `Responding with ${notifications.length} priority notifications`);
    res.status(200).json({
      success: true,
      count: notifications.length,
      notifications,
    });
  } catch (err) {
    Log('backend', 'error', 'controller', `Priority inbox failed — ${err.message}`);
    next(err);
  }
};

export const getAllNotifications = async (req, res, next) => {
  try {
    Log('backend', 'info', 'controller', 'Fetching all notifications');
    const notifications = await fetchNotifications();

    res.status(200).json({
      success: true,
      count: notifications.length,
      notifications,
    });
  } catch (err) {
    Log('backend', 'error', 'controller', `Failed to fetch notifications — ${err.message}`);
    next(err);
  }
};
