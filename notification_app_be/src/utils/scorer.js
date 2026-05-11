import { Log } from '../../../logging_middleware/src/logger.js';

// weights by notification type
const TYPE_WEIGHTS = {
  placement: 100,
  result: 70,
  event: 40,
};

function getRecencyBonus(createdAt) {
  const ageMs = Date.now() - new Date(createdAt).getTime();
  const ageHours = ageMs / (1000 * 60 * 60);

  if (ageHours <= 24) return 15;
  if (ageHours <= 72) return 8;
  if (ageHours <= 168) return 3;
  return 0;
}

function scoreNotification(notification) {
  const type = (notification.type || '').toLowerCase();
  const typeWeight = TYPE_WEIGHTS[type] || 20;
  const recency = getRecencyBonus(notification.createdAt || notification.created_at);
  return typeWeight + recency;
}

// filters unread, scores, sorts, and returns top N
export function rankNotifications(notifications, topN = 10) {
  Log('backend', 'info', 'utils', `Scoring ${notifications.length} notifications for priority ranking`);

  const unread = notifications.filter((n) => {
    if (n.isRead === true || n.is_read === true) return false;
    if (!n.type || !n.title) {
      Log('backend', 'warn', 'utils', `Skipping malformed notification — missing type or title`);
      return false;
    }
    return true;
  });

  Log('backend', 'debug', 'utils', `${unread.length} unread notifications after filtering`);

  const scored = unread.map((n) => ({
    ...n,
    _score: scoreNotification(n),
  }));

  scored.sort((a, b) => b._score - a._score);

  const topItems = scored.slice(0, topN);
  Log('backend', 'info', 'utils', `Priority ranking done — returning top ${topItems.length} results`);
  return topItems;
}
