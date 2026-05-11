import apiClient from '../utils/apiClient.js';
import { knapsack } from '../utils/knapsack.js';
import { Log } from '../../../logging_middleware/src/logger.js';

async function fetchDepots() {
  Log('backend', 'info', 'service', 'Fetching depots from evaluation service...');
  const { data } = await apiClient.get('/depots');
  Log('backend', 'info', 'service', `Received ${data.length} depots`);
  return data;
}

async function fetchVehicleTasks() {
  Log('backend', 'info', 'service', 'Fetching vehicle tasks from evaluation service...');
  const { data } = await apiClient.get('/vehicles');
  Log('backend', 'info', 'service', `Received ${data.length} vehicle task entries`);
  return data;
}

function sanitizeTasks(tasks) {
  const clean = tasks.filter((t) => {
    if (!t.TaskID || t.Duration == null || t.Impact == null) {
      Log('backend', 'warn', 'service', `Skipping malformed task payload: ${JSON.stringify(t)}`);
      return false;
    }
    if (t.Duration <= 0 || t.Impact <= 0) {
      Log('backend', 'debug', 'service', `Ignoring task ${t.TaskID} with non-positive values`);
      return false;
    }
    return true;
  });

  Log('backend', 'info', 'service', `${clean.length} valid tasks after sanitization (dropped ${tasks.length - clean.length})`);
  return clean;
}

export async function computeSchedule() {
  Log('backend', 'info', 'service', 'Starting schedule optimization pipeline');

  const [depots, rawTasks] = await Promise.all([
    fetchDepots(),
    fetchVehicleTasks(),
  ]);

  const tasks = sanitizeTasks(rawTasks);
  const results = [];

  for (const depot of depots) {
    const depotId = depot.ID || depot.id;
    const capacity = depot.MechanicHours || depot.mechanicHours || 0;

    if (!depotId || capacity <= 0) {
      Log('backend', 'warn', 'service', `Depot ${depotId} has invalid capacity (${capacity}), skipping`);
      continue;
    }

    Log('backend', 'info', 'service', `Running knapsack for depot ${depotId} — capacity: ${capacity}h`);
    const selected = knapsack(capacity, tasks);

    const totalDuration = selected.reduce((sum, t) => sum + t.Duration, 0);
    const totalImpact = selected.reduce((sum, t) => sum + t.Impact, 0);

    Log('backend', 'info', 'service',
      `Depot ${depotId} done — ${selected.length} tasks, impact: ${totalImpact}, hours: ${totalDuration}/${capacity}`
    );

    results.push({
      depotId,
      availableHours: capacity,
      selectedTasks: selected,
      totalImpact,
      totalDuration,
    });
  }

  Log('backend', 'info', 'service', `Optimization complete — processed ${results.length} depots`);
  return results;
}
