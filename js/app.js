import { defaultParams, getParamsFromUI, setParamsToUI, validateParams, loadPropellantLibrary, populatePropellantDropdown, applyPropellantData } from './parameters.js';
import { runRK4 } from './solver.js';
import { exportToCSV, calculateSummary, loadParamsFromURL, generateShareURL, formatNumber } from './utils.js';

let currentResults = null;
let currentParams = null;
let charts = {};

async function init() {
  const library = await loadPropellantLibrary();
  populatePropellantDropdown(library);
  
  const propSelect = document.getElementById('propellantSelect');
  if (propSelect) propSelect.addEventListener('change', (e) => applyPropellantData(e.target.value));
  
  const urlParams = loadParamsFromURL();
  if (Object.keys(urlParams).length > 0) {
    const mergedParams = { ...defaultParams, ...urlParams };
    setParamsToUI(mergedParams);
    if (propSelect) propSelect.value = 'custom';
  }
  
  document.getElementById('runBtn').addEventListener('click', runSimulation);
  document.getElementById('exportBtn').addEventListener('click', handleExport);
  document.getElementById('resetBtn').addEventListener('click', resetToDefaults);
  initCharts();
  console.log('Interior Ballistics Simulator initialized');
}

function initCharts() {
  const commonOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { labels: { color: '#aaa' } } },
    scales: {
      x: { ticks: { color: '#888' }, grid: { color: 'rgba(255,255,255,0.1)' } },
      y: { ticks: { color: '#888' }, grid: { color: 'rgba(255,255,255,0.1)' } }
    }
  };
  
  // ✅ Pressure Chart - FIXED: Added "data:" keys
  charts.pressure = new Chart(document.getElementById('pressureChart'), {
    type: 'line',
    data: {  // ← ADDED
      labels: [],
      datasets: [
        {
          label: 'Average Pressure (MPa)',
          data: [],  // ← ADDED "data:" key
          borderColor: 'rgb(255, 99, 132)',
          backgroundColor: 'rgba(255, 99, 132, 0.1)',
          tension: 0.1,
          fill: true
        },
        {
          label: 'Base Pressure (MPa)',
          data: [],  // ← ADDED "data:" key
          borderColor: 'rgb(54, 162, 235)',
          backgroundColor: 'rgba(54, 162, 235, 0.1)',
          tension: 0.1,
          fill: true
        }
      ]
    },
    options: {
      ...commonOptions,
      scales: {
        ...commonOptions.scales,
        y: {
          ...commonOptions.scales.y,
          title: { display: true, text: 'Pressure (MPa)', color: '#888' }
        },
        x: {
          ...commonOptions.scales.x,
          title: { display: true, text: 'Time (ms)', color: '#888' }
        }
      }
    }
  });
  
  // ✅ Velocity Chart - FIXED: Added "data:" keys
  charts.velocity = new Chart(document.getElementById('velocityChart'), {
    type: 'line',
    data: {  // ← ADDED
      labels: [],
      datasets: [
        {
          label: 'Velocity (m/s)',
          data: [],  // ← ADDED "data:" key
          borderColor: 'rgb(75, 192, 192)',
          tension: 0.1,
          yAxisID: 'y'
        },
        {
          label: 'Position (m)',
          data: [],  // ← ADDED "data:" key
          borderColor: 'rgb(255, 206, 86)',
          tension: 0.1,
          yAxisID: 'y1'
        }
      ]
    },
    options: {
      ...commonOptions,
      scales: {
        ...commonOptions.scales,
        y: {
          type: 'linear',
          display: true,
          position: 'left',
          title: { display: true, text: 'Velocity (m/s)', color: '#888' }
        },
        y1: {
          type: 'linear',
          display: true,
          position: 'right',
          title: { display: true, text: 'Position (m)', color: '#888' },
          grid: { drawOnChartArea: false }
        },
        x: {
          ...commonOptions.scales.x,
          title: { display: true, text: 'Time (ms)', color: '#888' }
        }
      }
    }
  });
  
  // ✅ Burn Chart - FIXED: Added "data:" keys
  charts.burn = new Chart(document.getElementById('burnChart'), {
    type: 'line',
    data: {  // ← ADDED
      labels: [],
      datasets: [
        {
          label: 'Burn Fraction (Z)',
          data: [],  // ← ADDED "data:" key
          borderColor: 'rgb(153, 102, 255)',
          backgroundColor: 'rgba(153, 102, 255, 0.1)',
          tension: 0.1,
          fill: true
        }
      ]
    },
    options: {
      ...commonOptions,
      scales: {
        ...commonOptions.scales,
        y: {
          ...commonOptions.scales.y,
          min: 0,
          max: 1.2,
          title: { display: true, text: 'Fraction Burned', color: '#888' }
        },
        x: {
          ...commonOptions.scales.x,
          title: { display: true, text: 'Time (ms)', color: '#888' }
        }
      }
    }
  });
}

function runSimulation() {
  const params = getParamsFromUI();
  const errors = validateParams(params);
  if (errors.length > 0) { alert('Parameter errors:\n' + errors.join('\n')); return; }
  
  const runBtn = document.getElementById('runBtn');
  runBtn.classList.add('loading');
  runBtn.disabled = true;
  
  setTimeout(() => {
    try {
      const initialVT = params.V0 - params.Cm / params.rho_s;
      const initialY = [0, 0, 0, 0, initialVT, 101325, 101325];
      const { results, metadata } = runRK4(initialY, params);
      currentResults = results;
      currentParams = params;
      updateCharts(results, params);
      updateSummary(results, params, metadata);
      updateShareURL(params);
    } catch (error) {
      console.error('Simulation error:', error);
      alert('Simulation error: ' + error.message);
    } finally {
      runBtn.classList.remove('loading');
      runBtn.disabled = false;
    }
  }, 50);
}

function updateCharts(results, params) {
  const timeData = results.map(r => (r.t * 1000).toFixed(3));
  charts.pressure.data.labels = timeData;
  charts.pressure.data.datasets[0].data = results.map(r => r.Y[5] / 1e6);
  charts.pressure.data.datasets[1].data = results.map(r => r.Y[6] / 1e6);
  charts.pressure.update();
  charts.velocity.data.labels = timeData;
  charts.velocity.data.datasets[0].data = results.map(r => r.Y[1]);
  charts.velocity.data.datasets[1].data = results.map(r => r.Y[0]);
  charts.velocity.update();
  charts.burn.data.labels = timeData;
  charts.burn.data.datasets[0].data = results.map(r => r.Y[3]);
  charts.burn.update();
}

function updateSummary(results, params, metadata) {
  const summary = calculateSummary(results, params);
  document.getElementById('muzzleVel').textContent = formatNumber(summary.muzzleVelocity, 1);
  document.getElementById('peakPressure').textContent = formatNumber(summary.peakPressure, 2);
  document.getElementById('muzzlePressure').textContent = formatNumber(summary.muzzlePressure, 2);
  document.getElementById('timeToMuzzle').textContent = formatNumber(summary.timeToMuzzle, 3);
  document.getElementById('allBurntPos').textContent = summary.allBurntPosition ? formatNumber(summary.allBurntPosition, 4) : '--';
  document.getElementById('totalSteps').textContent = metadata.totalSteps;
}

function handleExport() {
  if (!currentResults || currentResults.length === 0) { alert('Run a simulation first!'); return; }
  exportToCSV(currentResults, currentParams);
}

function resetToDefaults() {
  setParamsToUI(defaultParams);
  currentResults = null;
  currentParams = null;
  Object.values(charts).forEach(chart => { chart.data.labels = []; chart.data.datasets.forEach(ds => ds.data = []); chart.update(); });
  document.querySelectorAll('.result-card .value').forEach(el => el.textContent = '--');
  window.history.pushState({}, document.title, window.location.pathname);
}

function updateShareURL(params) {
  const url = generateShareURL(params);
  window.history.pushState({}, document.title, url);
}

document.addEventListener('DOMContentLoaded', init);
