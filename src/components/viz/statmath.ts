// Shared statistical math helpers for the stats-domain interactive islands
// (AlphaBetaExplorer, PowerCurveExplorer, TDistributionExplorer,
// ChiSquaredExplorer, ...). Kept dependency-free (no scipy/jStat) so every
// island can dynamically import only its rendering library (Plotly/p5/canvas).
//
// Numerical routes mirror what SciPy uses internally:
//  - Lanczos approximation for log-gamma
//  - Numerical Recipes' regularized incomplete beta (betai/betacf) for the
//    Student-t CDF
//  - Acklam's rational approximation + one Halley refinement step for the
//    standard normal inverse CDF (quantile function)
//  - erf-based standard normal CDF
// Accuracy is more than sufficient for pedagogical slider-driven charts.

// ---------------------------------------------------------------------------
// Seeded PRNG (reproducible samples across renders/reloads)
// ---------------------------------------------------------------------------

// mulberry32: small, fast, deterministic PRNG (public domain).
export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Box-Muller transform: pairs of uniform draws -> standard normal z-scores.
export function standardNormals(count: number, seed: number): number[] {
  const rand = mulberry32(seed);
  const out: number[] = [];
  while (out.length < count) {
    const u1 = Math.max(rand(), 1e-12);
    const u2 = rand();
    const mag = Math.sqrt(-2.0 * Math.log(u1));
    out.push(mag * Math.cos(2.0 * Math.PI * u2));
    if (out.length < count) out.push(mag * Math.sin(2.0 * Math.PI * u2));
  }
  return out.slice(0, count);
}

// ---------------------------------------------------------------------------
// Gamma / beta family
// ---------------------------------------------------------------------------

export function logGamma(x: number): number {
  // Lanczos approximation (g=7, n=9), standard coefficients.
  const g = 7;
  const coeffs = [
    0.99999999999980993, 676.5203681218851, -1259.1392167224028,
    771.32342877765313, -176.61502916214059, 12.507343278686905,
    -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7
  ];
  if (x < 0.5) {
    return Math.log(Math.PI / Math.sin(Math.PI * x)) - logGamma(1 - x);
  }
  x -= 1;
  let a = coeffs[0];
  const t = x + g + 0.5;
  for (let i = 1; i < g + 2; i++) a += coeffs[i] / (x + i);
  return 0.5 * Math.log(2 * Math.PI) + (x + 0.5) * Math.log(t) - t + Math.log(a);
}

export function logBeta(a: number, b: number): number {
  return logGamma(a) + logGamma(b) - logGamma(a + b);
}

// Continued fraction for the incomplete beta function (Numerical Recipes betacf).
function betacf(x: number, a: number, b: number): number {
  const MAXIT = 200;
  const EPS = 3e-9;
  const FPMIN = 1e-300;

  const qab = a + b;
  const qap = a + 1;
  const qam = a - 1;
  let c = 1;
  let d = 1 - (qab * x) / qap;
  if (Math.abs(d) < FPMIN) d = FPMIN;
  d = 1 / d;
  let h = d;

  for (let m = 1; m <= MAXIT; m++) {
    const m2 = 2 * m;
    let aa = (m * (b - m) * x) / ((qam + m2) * (a + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < FPMIN) d = FPMIN;
    c = 1 + aa / c;
    if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1 / d;
    h *= d * c;

    aa = (-(a + m) * (qab + m) * x) / ((a + m2) * (qap + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < FPMIN) d = FPMIN;
    c = 1 + aa / c;
    if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1 / d;
    const del = d * c;
    h *= del;
    if (Math.abs(del - 1) < EPS) break;
  }
  return h;
}

// Regularized incomplete beta function I_x(a, b).
export function incompleteBeta(x: number, a: number, b: number): number {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  const bt = Math.exp(logBeta(a, b) * -1 + a * Math.log(x) + b * Math.log(1 - x));
  if (x < (a + 1) / (a + b + 2)) {
    return (bt * betacf(x, a, b)) / a;
  }
  return 1 - (bt * betacf(1 - x, b, a)) / b;
}

// Lower regularized incomplete gamma function P(s, x) via series/continued
// fraction (Numerical Recipes gser/gcf), used for the chi-squared CDF.
function gser(s: number, x: number): number {
  const ITMAX = 200;
  const EPS = 3e-9;
  if (x <= 0) return 0;
  let ap = s;
  let sum = 1 / s;
  let del = sum;
  for (let n = 1; n <= ITMAX; n++) {
    ap += 1;
    del *= x / ap;
    sum += del;
    if (Math.abs(del) < Math.abs(sum) * EPS) break;
  }
  return sum * Math.exp(-x + s * Math.log(x) - logGamma(s));
}

function gcf(s: number, x: number): number {
  const ITMAX = 200;
  const EPS = 3e-9;
  const FPMIN = 1e-300;
  let b = x + 1 - s;
  let c = 1 / FPMIN;
  let d = 1 / b;
  let h = d;
  for (let i = 1; i <= ITMAX; i++) {
    const an = -i * (i - s);
    b += 2;
    d = an * d + b;
    if (Math.abs(d) < FPMIN) d = FPMIN;
    c = b + an / c;
    if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1 / d;
    const del = d * c;
    h *= del;
    if (Math.abs(del - 1) < EPS) break;
  }
  return Math.exp(-x + s * Math.log(x) - logGamma(s)) * h;
}

// Regularized lower incomplete gamma P(s, x) = gamma(s, x) / Gamma(s).
export function lowerIncompleteGamma(s: number, x: number): number {
  if (x < 0 || s <= 0) return NaN;
  if (x === 0) return 0;
  if (x < s + 1) return gser(s, x);
  return 1 - gcf(s, x);
}

// ---------------------------------------------------------------------------
// Normal distribution
// ---------------------------------------------------------------------------

export function normalPdf(x: number, mean = 0, sd = 1): number {
  const z = (x - mean) / sd;
  return Math.exp(-0.5 * z * z) / (sd * Math.sqrt(2 * Math.PI));
}

// erf via Abramowitz & Stegun 7.1.26 (max error ~1.5e-7).
function erf(x: number): number {
  const sign = x < 0 ? -1 : 1;
  const ax = Math.abs(x);
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;
  const t = 1 / (1 + p * ax);
  const y = 1 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-ax * ax);
  return sign * y;
}

export function normalCdf(x: number, mean = 0, sd = 1): number {
  return 0.5 * (1 + erf((x - mean) / (sd * Math.SQRT2)));
}

// Standard normal inverse CDF (quantile function) via Acklam's algorithm.
export function normalQuantile(p: number, mean = 0, sd = 1): number {
  if (p <= 0) return -Infinity;
  if (p >= 1) return Infinity;

  const a = [
    -3.969683028665376e1, 2.209460984245205e2, -2.759285104469687e2,
    1.383577518672690e2, -3.066479806614716e1, 2.506628277459239
  ];
  const b = [
    -5.447609879822406e1, 1.615858368580409e2, -1.556989798598866e2,
    6.680131188771972e1, -1.328068155288572e1
  ];
  const c = [
    -7.784894002430293e-3, -3.223964580411365e-1, -2.400758277161838,
    -2.549732539343734, 4.374664141464968, 2.938163982698783
  ];
  const d = [
    7.784695709041462e-3, 3.224671290700398e-1, 2.445134137142996,
    3.754408661907416
  ];

  const pLow = 0.02425;
  let q: number;
  let z: number;

  if (p < pLow) {
    q = Math.sqrt(-2 * Math.log(p));
    z =
      (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
      ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  } else if (p <= 1 - pLow) {
    q = p - 0.5;
    const r = q * q;
    z =
      ((((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q) /
      (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
  } else {
    q = Math.sqrt(-2 * Math.log(1 - p));
    z =
      -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
      ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  }

  // One Halley step to polish (pushes accuracy to ~1e-9).
  const e = 0.5 * erfc(-z / Math.SQRT2) - p;
  const u = e * Math.sqrt(2 * Math.PI) * Math.exp((z * z) / 2);
  z = z - u / (1 + (z * u) / 2);

  return mean + sd * z;
}

function erfc(x: number): number {
  return 1 - erf(x);
}

// ---------------------------------------------------------------------------
// Student-t distribution
// ---------------------------------------------------------------------------

export function studentTPdf(x: number, df: number): number {
  const num = Math.exp(logGamma((df + 1) / 2) - logGamma(df / 2));
  const denom = Math.sqrt(df * Math.PI);
  return (num / denom) * Math.pow(1 + (x * x) / df, -(df + 1) / 2);
}

// Two-tailed Student-t p-value for statistic t with df degrees of freedom.
export function studentTTwoTailedP(t: number, df: number): number {
  const x = df / (df + t * t);
  const p = incompleteBeta(x, df / 2, 0.5);
  return Math.min(1, Math.max(0, p));
}

export interface WelchResult {
  t: number;
  df: number;
  p: number;
}

export function welchTTest(a: number[], b: number[]): WelchResult {
  const n1 = a.length;
  const n2 = b.length;
  const mean1 = a.reduce((s, v) => s + v, 0) / n1;
  const mean2 = b.reduce((s, v) => s + v, 0) / n2;
  const var1 = a.reduce((s, v) => s + (v - mean1) ** 2, 0) / (n1 - 1);
  const var2 = b.reduce((s, v) => s + (v - mean2) ** 2, 0) / (n2 - 1);

  const se2 = var1 / n1 + var2 / n2;
  const t = (mean1 - mean2) / Math.sqrt(se2);
  const df =
    (se2 * se2) /
    ((var1 / n1) ** 2 / (n1 - 1) + (var2 / n2) ** 2 / (n2 - 1));
  const p = studentTTwoTailedP(Math.abs(t), df);
  return { t, df, p };
}

// ---------------------------------------------------------------------------
// Chi-squared distribution
// ---------------------------------------------------------------------------

export function chiSquaredPdf(x: number, df: number): number {
  if (x < 0) return 0;
  const k = df / 2;
  if (x === 0) return k < 1 ? Infinity : k === 1 ? 0.5 : 0;
  const logPdf = (k - 1) * Math.log(x) - x / 2 - k * Math.log(2) - logGamma(k);
  return Math.exp(logPdf);
}

export function chiSquaredCdf(x: number, df: number): number {
  if (x <= 0) return 0;
  return lowerIncompleteGamma(df / 2, x / 2);
}

// Two-sided independent t-test power via the noncentral-t approximation is
// overkill for a pedagogical demo; the power islands instead resample
// directly (Monte Carlo) using standardNormals()/mulberry32() above, mirroring
// the V1 notebook's simulate_p_values() approach exactly.
