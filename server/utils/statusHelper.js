function getDynamicStatus(charger) {
  // If the host turned the charger off/not live, it is statically offline
  if (charger.isLive === false) {
    return 'offline';
  }

  const currentStatus = charger.status || 'available';
  
  // Statically offline/unavailable states remain unchanged
  if (['offline', 'maintenance', 'coming_soon'].includes(currentStatus)) {
    return currentStatus;
  }
  
  // Use a deterministic time-based cycle to avoid database writes and UI flickering
  const idStr = charger._id.toString();
  let idHash = 0;
  for (let i = 0; i < idStr.length; i++) {
    idHash += idStr.charCodeAt(i);
  }
  
  // Status changes dynamically every 2 minutes (120000 ms)
  const timeBlock = Math.floor(Date.now() / 120000);
  const cycleIndex = (timeBlock + idHash) % 10;
  
  // 60% Available, 30% Charging, 10% Reserved
  if (cycleIndex < 6) return 'available';
  if (cycleIndex < 9) return 'charging';
  return 'reserved';
}

module.exports = { getDynamicStatus };
