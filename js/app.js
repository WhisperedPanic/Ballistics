// js/app.js - CORRECTED VERSION
// Debug: Confirm module is loading
console.log('🔧 app.js module loaded');

import { defaultParams, getParamsFromUI, setParamsToUI, validateParams, loadPropellantLibrary, populatePropellantDropdown, applyPropellantData } from './parameters.js';
import { runRK4 } from './solver.js';
import { exportToCSV, calculateSummary, loadParamsFromURL, generateShareURL, formatNumber } from './utils.js';

// Debug: Confirm imports resolved
console.log('✅ Imports resolved:', {
  hasRunRK4: typeof runRK4 === 'function',
  hasLoadLibrary: typeof loadPropellantLibrary === 'function',
  hasDefaultParams: typeof defaultParams === 'object'
});

let currentResults = null;
let currentParams = null;
let charts = {};

/**
 * Initialize the application
 */
async function init() {
  console.log('🚀 init() called');
  
  // Load propellant library first
  console.log('📚 Loading propellant library...');
  const library = await loadPropellantLibrary();
  console.log('📚 Library loaded, populating dropdown...');
  populatePropellantDropdown(library);
  
  // Setup propellant selector event
  const propSelect = document.getElementById('propellantSelect');
  if (propSelect) {
    console.log('✅ propellantSelect element found');
    propSelect.addEventListener('change', (e) => {
      console.log(`🔄 Propellant changed to: ${e.target.value}`);
      applyPropellantData(e.target.value);
    });
  } else {
    console.error('❌ propellantSelect element NOT found in HTML');
  }
  
  // Load URL parameters (overrides library defaults)
  const urlParams = loadParamsFromURL();
  if (Object.keys(urlParams).length > 0) {
    console.log('🔗 URL params detected, merging with defaults');
    const mergedParams = { ...defaultParams, ...urlParams };
    setParamsToUI(mergedParams);
    if (propSelect) propSelect.value = 'custom';
  }
  
  // Setup button event listeners
  document.getElementById('runBtn').addEventListener('click', runSimulation);
  document.getElementById('exportBtn').addEventListener('click', handleExport);
  document.getElementById('resetBtn').addEventListener('click', resetToDefaults);
  
  // Initialize charts
  console.log('📊 Initializing charts...');
  initCharts();
  
  console.log('✅ Interior Ballistics Simulator initialized');
}

/**
 * Initialize Chart.js charts
 * FIXED: Added missing "data:" keys in Chart.js configuration
 */
function initCharts() {
  console.log('📈 initCharts() called');
  
  const commonOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { 
      legend: { labels: { color: '#aaa' } } 
    },
    scales: {
      x: { 
        ticks: { color: '#888' }, 
        grid: { color: 'rgba(255,255,255,0.1)' } 
      },
      y: { 
        ticks: { color: '#888' }, 
        grid: { color: 'rgba(255,255,255,0.1)' } 
      }
    }
  };
  
  // ✅ Pressure Chart - FIXED: Added "data:" keys
  console.log('📊 Creating pressure chart...');
  charts.pressure = new Chart(document.getElementById('pressureChart'), {
    type: 'line',
     {  // ← CRITICAL FIX: Added "data:" key
      labels: [],
      datasets: [
        {
          label: 'Average Pressure (MPa)',
           [],  // ← CRITICAL FIX: Added "data:" key
          borderColor: 'rgb(255, 99, 132)',
          backgroundColor: 'rgba(255, 99, 132, 0.1)',
          tension: 0.1,
          fill: true
        },
        {
          label: 'Base Pressure (MPa)',
           [],  // ← CRITICAL FIX: Added "data:" key
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
  console.log('✅ Pressure chart created');
  
  // ✅ Velocity Chart - FIXED: Added "" keys
  console.log('📊 Creating velocity chart...');
  charts.velocity = new Chart(document.getElementById('velocityChart'), {
    type: 'line',
     {  // ← CRITICAL FIX: Added "data:" key
      labels: [],
      datasets: [
        {
          label: 'Velocity (m/s)',
           [],  // ← CRITICAL FIX: Added "data:" key
          borderColor: 'rgb(75, 192, 192)',
          tension: 0.1,
          yAxisID: 'y'
        },
        {
          label: 'Position (m)',
           [],  // ← CRITICAL FIX: Added "" key
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
  console.log('✅ Velocity chart created');
  
  // ✅ Burn Chart - FIXED: Added "" keys
  console.log('📊 Creating burn chart...');
  charts.burn = new Chart(document.getElementById('burnChart'), {
    type: 'line',
     {  // ← CRITICAL FIX: Added "data:" key
      labels: [],
      datasets: [
        {
          label: 'Burn Fraction (Z)',
           [],  // ← CRITICAL FIX: Added "data:" key
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
  console.log('✅ Burn chart created');
}

/**
 * Run the simulation
 */
function runSimulation() {
  console.log('▶ Run Simulation clicked');
  
  const params = getParamsFromUI();
  const errors = validateParams(params);
  
  if (errors.length > 0) { 
    console.error('❌ Parameter validation failed:', errors);
    alert('Parameter errors:\n' + errors.join('\n')); 
    return; 
  }
  
  // Update UI state
  const runBtn = document.getElementById('runBtn');
  runBtn.classList.add('loading');
  runBtn.disabled = true;
  
  // Use setTimeout to allow UI to update before heavy computation
  setTimeout(() => {
    try {
      console.log('🔢 Starting RK4 integration...');
      
      // Initial conditions: [Sp, Vp, X, Z, VT, Pa, Pb]
      const initialVT = params.V0 - params.Cm / params.rho_s;
      const initialY = [0, 0, 0, 0, initialVT, 101325, 101325];
      
      // Run RK4 solver
      const { results, metadata } = runRK4(initialY, params);
      
      console.log(`✅ Simulation complete: ${metadata.totalSteps} steps, stop reason: ${metadata.stopReason}`);
      
      currentResults = results;
      currentParams = params;
      
      // Update charts
      updateCharts(results, params);
      
      // Update summary
      updateSummary(results, params, metadata);
      
      // Update URL for sharing
      updateShareURL(params);
      
    } catch (error) {
      console.error('❌ Simulation error:', error);
      alert('Simulation error: ' + error.message);
    } finally {
      runBtn.classList.remove('loading');
      runBtn.disabled = false;
      console.log('🔘 Run button re-enabled');
    }
  }, 50);
}

/**
 * Update charts with new results
 */
function updateCharts(results, params) {
  console.log('📊 Updating charts with', results.length, 'data points');
  
  const timeData = results.map(r => (r.t * 1000).toFixed(3)); // Convert to ms
  
  // Pressure chart
  charts.pressure.data.labels = timeData;
  charts.pressure.data.datasets[0].data = results.map(r => r.Y[5] / 1e6);
  charts.pressure.data.datasets[1].data = results.map(r => r.Y[6] / 1e6);
  charts.pressure.update();
  console.log('✅ Pressure chart updated');
  
  // Velocity chart
  charts.velocity.data.labels = timeData;
  charts.velocity.data.datasets[0].data = results.map(r => r.Y[1]);
  charts.velocity.data.datasets[1].data = results.map(r => r.Y[0]);
  charts.velocity.update();
  console.log('✅ Velocity chart updated');
  
  // Burn chart
  charts.burn.data.labels = timeData;
  charts.burn.data.datasets[0].data = results.map(r => r.Y[3]);
  charts.burn.update();
  console.log('✅ Burn chart updated');
}

/**
 * Update summary statistics display
 */
function updateSummary(results, params, metadata) {
  console.log('📋 Updating summary...');
  
  const summary = calculateSummary(results, params);
  
  document.getElementById('muzzleVel').textContent = formatNumber(summary.muzzleVelocity, 1);
  document.getElementById('peakPressure').textContent = formatNumber(summary.peakPressure, 2);
  document.getElementById('muzzlePressure').textContent = formatNumber(summary.muzzlePressure, 2);
  document.getElementById('timeToMuzzle').textContent = formatNumber(summary.timeToMuzzle, 3);
  document.getElementById('allBurntPos').textContent = summary.allBurntPosition 
    ? formatNumber(summary.allBurntPosition, 4) : '--';
  document.getElementById('totalSteps').textContent = metadata.totalSteps;
  
  console.log('✅ Summary updated');
}

/**
 * Handle CSV export
 */
function handleExport() {
  console.log('📥 Export CSV clicked');
  
  if (!currentResults || currentResults.length === 0) {
    console.warn('⚠️ No results to export');
    alert('Run a simulation first!');
    return;
  }
  
  exportToCSV(currentResults, currentParams);
  console.log('✅ CSV exported');
}

/**
 * Reset to default parameters
 */
function resetToDefaults() {
  console.log('🔄 Reset to defaults clicked');
  
  setParamsToUI(defaultParams);
  currentResults = null;
  currentParams = null;
  
  // Clear charts
  Object.values(charts).forEach(chart => {
    chart.data.labels = [];
    chart.data.datasets.forEach(ds => ds.data = []);
    chart.update();
  });
  
  // Clear summary
  document.querySelectorAll('.result-card .value').forEach(el => {
    el.textContent = '--';
  });
  
  // Clear URL params
  window.history.pushState({}, document.title, window.location.pathname);
  
  console.log('✅ Reset complete');
}

/**
 * Update URL for sharing
 */
function updateShareURL(params) {
  const url = generateShareURL(params);
  window.history.pushState({}, document.title, url);
  console.log('🔗 Share URL updated:', url);
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  console.log('📄 DOMContentLoaded fired');
  init();
});