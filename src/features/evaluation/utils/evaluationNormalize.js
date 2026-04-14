/**
 * PR curve from IRPlatformService: list of [precision, recall] pairs (JSON: number[][]).
 * Recharts expects objects with named keys.
 */
export function normalizePrCurveForChart(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((pt, i) => {
      if (Array.isArray(pt) && pt.length >= 2) {
        const precision = Number(pt[0]);
        const recall = Number(pt[1]);
        if (Number.isFinite(precision) && Number.isFinite(recall)) {
          return { precision, recall, index: i };
        }
      }
      if (pt && typeof pt === 'object' && !Array.isArray(pt)) {
        const precision = Number(pt.precision ?? pt[0]);
        const recall = Number(pt.recall ?? pt[1]);
        if (Number.isFinite(precision) && Number.isFinite(recall)) {
          return { precision, recall, index: i };
        }
      }
      return null;
    })
    .filter(Boolean)
    .sort((a, b) => a.recall - b.recall);
}

/** EvaluationMetrics: precision, recall, f1Score, map — tolerate aliases from older payloads. */
export function normalizeEvaluationMetrics(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  return {
    ...raw,
    f1Score: raw.f1Score ?? raw.f1 ?? raw.f1score,
    map: raw.map ?? raw.meanAveragePrecision,
  };
}
