export const defaultParams = {
  As: 0.0001267,
  Ws: 0.01,
  Cm: 0.003,
  V0: 0.000015,
  L_barrel: 0.5,
  lambda: 1000000,
  eta: 0.001,
  rho_s: 1600,
  B: 0.000012,
  n: 0.85,
  Rg: 0.001,
  Lg: 0.005,
  gamma: 1.25,
  beta_Lag: 0.5,
  dt: 0.000001,
  tMax: 0.01,
  delta_c: 1.0,
  g_a: 9.80665
};

let propellantLibrary = [];

export async function loadPropellantLibrary() {
  try {
    const response = await fetch('data/propellants.json');
    if (!response.ok) throw new Error('Failed to load library');
    propellantLibrary = await response.json();
    return propellantLibrary;
  } catch (error) {
    console.error('Error loading propellant library:', error);
    return [];
  }
}

export function populatePropellantDropdown(library) {
  const select = document.getElementById('propellantSelect');
  if (!select) return;
  
  select.innerHTML = '';
  
  library.forEach(prop => {
    const option = document.createElement('option');
    option.value = prop.id;
    option.textContent = prop.name;
    if (prop.cluster) {
      if (prop.cluster.includes('Fast')) option.className = 'fast';
      else if (prop.cluster.includes('Medium')) option.className = 'medium';
      else if (prop.cluster.includes('Slow')) option.className = 'slow';
    }
    select.appendChild(option);
  });
  
  select.value = 'custom';
}

export function applyPropellantData(propellantId) {
  const prop = propellantLibrary.find(p => p.id === propellantId);
  if (!prop || prop.id === 'custom') return;
  
  const descEl = document.getElementById('propellantDesc');
  if (descEl) descEl.textContent = prop.description || '';
  
  const setVal = (id, val) => {
    const el = document.getElementById(id);
    if (el && val !== undefined) el.value = val;
  };
  
  setVal('B', prop.B);
  setVal('n', prop.n);
  setVal('rho_s', prop.rho_s);
  setVal('lambda', prop.lambda);
  setVal('eta', prop.eta);
}

export function getParamsFromUI() {
  return {
    As: parseFloat(document.getElementById('As').value),
    Ws: parseFloat(document.getElementById('Ws').value),
    Cm: parseFloat(document.getElementById('Cm').value),
    V0: parseFloat(document.getElementById('V0').value),
    L_barrel: parseFloat(document.getElementById('L_barrel').value),
    lambda: parseFloat(document.getElementById('lambda').value),
    eta: parseFloat(document.getElementById('eta').value),
    rho_s: parseFloat(document.getElementById('rho_s').value),
    B: parseFloat(document.getElementById('B').value),
    n: parseFloat(document.getElementById('n').value),
    Rg: parseFloat(document.getElementById('Rg').value),
    Lg: parseFloat(document.getElementById('Lg').value),
    gamma: parseFloat(document.getElementById('gamma').value),
    beta_Lag: parseFloat(document.getElementById('beta_Lag').value),
    dt: parseFloat(document.getElementById('dt').value),
    tMax: defaultParams.tMax,
    delta_c: defaultParams.delta_c,
    g_a: defaultParams.g_a
  };
}

export function setParamsToUI(params) {
  document.getElementById('As').value = params.As;
  document.getElementById('Ws').value = params.Ws;
  document.getElementById('Cm').value = params.Cm;
  document.getElementById('V0').value = params.V0;
  document.getElementById('L_barrel').value = params.L_barrel;
  document.getElementById('lambda').value = params.lambda;
  document.getElementById('eta').value = params.eta;
  document.getElementById('rho_s').value = params.rho_s;
  document.getElementById('B').value = params.B;
  document.getElementById('n').value = params.n;
  document.getElementById('Rg').value = params.Rg;
  document.getElementById('Lg').value = params.Lg;
  document.getElementById('gamma').value = params.gamma;
  document.getElementById('beta_Lag').value = params.beta_Lag;
  document.getElementById('dt').value = params.dt;
}

export function validateParams(params) {
  const errors = [];
  if (params.Cm <= 0) errors.push('Charge mass must be positive');
  if (params.Ws <= 0) errors.push('Projectile mass must be positive');
  if (params.As <= 0) errors.push('Bore area must be positive');
  if (params.V0 <= 0) errors.push('Initial volume must be positive');
  if (params.L_barrel <= 0) errors.push('Barrel length must be positive');
  if (params.lambda <= 0) errors.push('Force constant must be positive');
  if (params.B <= 0) errors.push('Burn rate coefficient must be positive');
  if (params.n <= 0 || params.n > 2) errors.push('Burn rate index must be 0 < n ≤ 2');
  if (params.Rg <= 0) errors.push('Grain radius must be positive');
  if (params.Lg <= 0) errors.push('Grain length must be positive');
  if (params.gamma <= 1) errors.push('Specific heat ratio must be > 1');
  if (params.dt <= 0) errors.push('Time step must be positive');
  const minVolume = params.Cm * params.eta;
  if (params.V0 <= minVolume) errors.push(`Initial volume must exceed covolume (${minVolume.toFixed(8)} m³)`);
  return errors;
}
