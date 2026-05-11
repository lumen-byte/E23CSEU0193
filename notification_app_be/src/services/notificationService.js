import apiClient from '../utils/apiClient.js';
import { rankNotifications } from '../utils/scorer.js';
import { Log } from '../../../logging_middleware/src/logger.js';

async function fetchNotifications() {
  Log('backend', 'info', 'service', 'Fetching notifications from upstream API...');
  const { data } = await apiClient.get('/notifications');

  // handle both array and wrapped response shapes
  const notifications = Array.isArray(data) ? data : data.notifications || data.data || [];
  Log('backend', 'info', 'service', `Fetched ${notifications.length} notifications from upstream`);
  return notifications;
}

export async function getPriorityInbox() {
  Log('backend', 'info', 'service', 'Building priority inbox');

  const allNotifications = await fetchNotifications();
  const ranked = rankNotifications(allNotifications, 10);

  Log('backend', 'info', 'service', `Priority inbox ready — ${ranked.length} top notifications`);
  return ranked;
}

export { fetchNotifications };
