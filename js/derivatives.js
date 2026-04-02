export function computeDerivatives(t, Y, params) {
  const [Sp, Vp, X, Z, VT, Pa, Pb] = Y;
  const { As, Ws, Cm, rho_s, eta, B, n, Rg, Lg, lambda, gamma, beta_Lag, delta_c, g_a } = params;
  
  const VT_safe = Math.max(VT, Cm * eta + 1e-10);
  const Pa_safe = Math.max(Pa, 101325);
  
  const dSp_dt = Vp;
  const dVp_dt = (As * Pb) / Ws;
  const dX_dt = B * Math.pow(Pa_safe, n);
  
  const remainingRadius = Math.max(Rg - X, 0);
  const remainingLength = Math.max(Lg - 2 * X, 0);
  const termA = 2 * dX_dt * remainingRadius * remainingRadius;
  const termB = 2 * dX_dt * remainingRadius * remainingLength;
  const denom = Rg * Rg * Lg;
  const dZ_dt = denom > 0 ? (termA + termB) / denom : 0;
  const dZ_dt_clamped = Z >= 1.0 ? 0 : dZ_dt;
  
  const dVT_dt = As * Vp + (Cm / rho_s - Cm * eta) * dZ_dt_clamped;
  
  const term1 = lambda * Cm * dZ_dt_clamped;
  const term2 = (1/6) * (gamma - 1) * (1 + beta_Lag) * Cm * dZ_dt_clamped * Vp * Vp;
  const term3 = (gamma - 1) * (1 + beta_Lag) * (Ws + (1/3) * Cm * Z) * Vp * dVp_dt;
  const term4_num = lambda * Cm * Z - 0.5 * (gamma - 1) * (1 + beta_Lag) * (Ws + (1/3) * Cm * Z) * Vp * Vp;
  const dPa_dt = (term1 - term2 - term3) / VT_safe - (term4_num * dVT_dt) / (VT_safe * VT_safe);
  
  const velocityTerm = Vp * Vp / (g_a * gamma * lambda);
  const correction = 1 + 0.5 * (gamma - 1) / delta_c * velocityTerm;
  const correction_safe = Math.max(correction, 0.001);
  const exponent1 = -gamma / (gamma - 1);
  const termPb1 = dPa_dt * Math.pow(correction_safe, exponent1);
  const termPb2 = Pa_safe * Math.pow(correction_safe, -exponent1) / delta_c * Vp / (g_a * lambda) * dVp_dt / correction_safe;
  const dPb_dt = termPb1 - termPb2;
  
  return [dSp_dt, dVp_dt, dX_dt, dZ_dt_clamped, dVT_dt, dPa_dt, dPb_dt];
}

export function checkStopCondition(t, Y, params) {
  const [Sp, Vp, X, Z, VT, Pa, Pb] = Y;
  if (Sp >= params.L_barrel) return { stop: true, reason: 'muzzle_exit' };
  if (Pa < 50000) return { stop: true, reason: 'pressure_low' };
  if (t >= params.tMax) return { stop: true, reason: 'time_limit' };
  if (!isFinite(Pa) || !isFinite(Pb) || !isFinite(Vp)) return { stop: true, reason: 'numerical_error' };
  return { stop: false, reason: 'continue' };
}
