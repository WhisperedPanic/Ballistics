import { computeDerivatives, checkStopCondition } from './derivatives.js';

export function runRK4(initialY, params, onStop = null) {
  let t = 0;
  let Y = [...initialY];
  const results = [{ t, Y: [...Y] }];
  let steps = 0;
  let stopReason = 'completed';
  
  while (t < params.tMax) {
    steps++;
    const stopCheck = checkStopCondition(t, Y, params);
    if (stopCheck.stop) { stopReason = stopCheck.reason; break; }
    if (onStop && onStop(t, Y, params)) { stopReason = 'custom'; break; }
    
    const k1 = computeDerivatives(t, Y, params);
    const Y2 = Y.map((y, i) => y + params.dt / 2 * k1[i]);
    const k2 = computeDerivatives(t + params.dt / 2, Y2, params);
    const Y3 = Y.map((y, i) => y + params.dt / 2 * k2[i]);
    const k3 = computeDerivatives(t + params.dt / 2, Y3, params);
    const Y4 = Y.map((y, i) => y + params.dt * k3[i]);
    const k4 = computeDerivatives(t + params.dt, Y4, params);
    
    Y = Y.map((y, i) => y + params.dt / 6 * (k1[i] + 2*k2[i] + 2*k3[i] + k4[i]));
    t += params.dt;
    results.push({ t, Y: [...Y] });
    if (steps > 100000) { stopReason = 'step_limit'; break; }
  }
  
  return { results, meta { totalSteps: steps, stopReason, finalTime: t } };
}

export function runEuler(initialY, params, onStop = null) {
  let t = 0;
  let Y = [...initialY];
  const results = [{ t, Y: [...Y] }];
  let steps = 0;
  
  while (t < params.tMax) {
    steps++;
    const stopCheck = checkStopCondition(t, Y, params);
    if (stopCheck.stop) break;
    if (onStop && onStop(t, Y, params)) break;
    
    const derivatives = computeDerivatives(t, Y, params);
    Y = Y.map((y, i) => y + params.dt * derivatives[i]);
    t += params.dt;
    results.push({ t, Y: [...Y] });
    if (steps > 100000) break;
  }
  
  return { results, metadata: { totalSteps: steps, stopReason: 'completed', finalTime: t } };
}
