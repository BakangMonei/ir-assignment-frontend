function triggerDownload(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function downloadAsJson(data, fileName = 'results.json') {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json;charset=utf-8' });
  triggerDownload(blob, fileName);
}

export function downloadAsCsv(rows, fileName = 'results.csv') {
  if (!Array.isArray(rows) || rows.length === 0) {
    downloadAsJson(rows, fileName.replace(/\.csv$/i, '.json'));
    return;
  }

  const headers = Array.from(new Set(rows.flatMap((row) => Object.keys(row || {}))));
  const csv = [
    headers.join(','),
    ...rows.map((row) =>
      headers
        .map((key) => {
          const value = row?.[key] ?? '';
          const stringValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
          return `"${stringValue.replace(/"/g, '""')}"`;
        })
        .join(',')
    ),
  ].join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  triggerDownload(blob, fileName);
}
