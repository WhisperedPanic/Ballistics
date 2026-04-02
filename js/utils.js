export function exportToCSV(results, params) {
  const headers = ['Time_s', 'Position_m', 'Velocity_mps', 'BurnDepth_m', 'BurnFraction', 'Volume_m3', 'PressureAvg_Pa', 'PressureBase_Pa'];
  const rows = results.map(r => [r.t.toFixed(8), r.Y[0].toFixed(8), r.Y[1].toFixed(4), r.Y[2].toFixed(8), r.Y[3].toFixed(6), r.Y[4].toFixed(10), r.Y[5].toFixed(2), r.Y[6].toFixed(2)]);
  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `ballistics_${new Date().toISOString().slice(0,19)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export function calculateSummary(results, params) {
  if (!results || results.length === 0) return null;
  const lastResult = results[results.length - 1];
  const pressures = results.map(r => r.Y[5]);
  const muzzleIndex = results.findIndex(r => r.Y[0] >= params.L_barrel);
  const muzzleResult = muzzleIndex >= 0 ? results[muzzleIndex] : lastResult;
  const allBurntIndex = results.findIndex(r => r.Y[3] >= 1.0);
  const allBurntResult = allBurntIndex >= 0 ? results[allBurntIndex] : null;
  
  return {
    muzzleVelocity: muzzleResult ? muzzleResult.Y[1] : lastResult.Y[1],
    muzzlePressure: muzzleResult ? muzzleResult.Y[6] / 1e6 : lastResult.Y[6] / 1e6,
    peakPressure: Math.max(...pressures) / 1e6,
    timeToMuzzle: muzzleResult ? muzzleResult.t * 1000 : lastResult.t * 1000,
    allBurntPosition: allBurntResult ? allBurntResult.Y[0] : null,
    totalSteps: results.length
  };
}

export function loadParamsFromURL() {
  const urlParams = new URLSearchParams(window.location.search);
  const params = {};
  const floatParams = ['Cm', 'Ws', 'As', 'V0', 'L_barrel', 'lambda', 'eta', 'rho_s', 'B', 'n', 'Rg', 'Lg', 'gamma', 'beta_Lag', 'dt'];
  floatParams.forEach(key => {
    const value = urlParams.get(key);
    if (value !== null) params[key] = parseFloat(value);
  });
  return params;
}

export function generateShareURL(params) {
  const url = new URL(window.location.href);
  const floatParams = ['Cm', 'Ws', 'As', 'V0', 'L_barrel', 'lambda', 'eta', 'rho_s', 'B', 'n', 'Rg', 'Lg', 'gamma', 'beta_Lag', 'dt'];
  floatParams.forEach(key => {
    if (params[key] !== undefined) url.searchParams.set(key, params[key].toString());
  });
  return url.toString();
}

export function formatNumber(num, decimals = 2) {
  if (num === null || num === undefined || !isFinite(num)) return '--';
  return num.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}
