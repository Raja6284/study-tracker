/**
 * All duration math lives here so "Duration = End Time - Start Time" is
 * always computed by the system, never entered by the student.
 */

function minutesBetween(start, end) {
  const ms = new Date(end).getTime() - new Date(start).getTime();
  return Math.max(0, Math.round(ms / 60000));
}

// "2h 30m" / "2h" / "45m" style formatting used across dashboards & reports.
function formatDuration(totalMinutes) {
  const mins = Math.max(0, Math.round(totalMinutes || 0));
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function accuracy(correct, attempted) {
  if (!attempted || attempted <= 0) return null;
  const c = correct || 0;
  return Math.round((c / attempted) * 1000) / 10; // one decimal place
}

module.exports = { minutesBetween, formatDuration, accuracy };
