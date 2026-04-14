import { useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import {
  bulkIndexDocumentsFromFile,
  importCisi,
  importPubmed,
  inferDatasetFromFilename,
  uploadCisiFile,
  uploadDocumentSimple,
  uploadPubmedFile,
} from '../features/datasource/api/datasourceApi';
import { Button, Card, EmptyState, Select, Spinner } from '../shared/ui/UiPrimitives';
import { getErrorMessage } from '../shared/utils/errorUtils';
import { setPlatformState } from '../shared/state/platformState';
import { usePlatformReadiness } from '../shared/hooks/usePlatformReadiness';

const ACCEPTED_TYPES = '.txt,.xml,.zip,.all';

const defaultBulkIr = {
  tokenizerType: 'standard',
  useStemming: false,
  rankingAlgorithm: 'bm25',
  lengthNormalization: true,
};

export function DataSourcePage() {
  const queryClient = useQueryClient();
  const readiness = usePlatformReadiness();
  const [bulkIr, setBulkIr] = useState(defaultBulkIr);
  const [selectedFile, setSelectedFile] = useState(null);
  const [resultMessage, setResultMessage] = useState('');
  const [filePreview, setFilePreview] = useState('');
  const [fileMeta, setFileMeta] = useState(null);
  const [datasetMode, setDatasetMode] = useState('auto');
  const [cisiServerPath, setCisiServerPath] = useState('');
  const [pubmedServerPath, setPubmedServerPath] = useState('');

  const inferredDataset = useMemo(
    () => (selectedFile ? inferDatasetFromFilename(selectedFile.name) : ''),
    [selectedFile]
  );

  const loadPreview = file => {
    if (!file) {
      setFilePreview('');
      setFileMeta(null);
      return;
    }

    setFileMeta({
      name: file.name,
      type: file.type || 'unknown',
      sizeKb: (file.size / 1024).toFixed(1),
    });

    const isTextLike =
      file.type.includes('text') ||
      file.type.includes('xml') ||
      file.name.endsWith('.txt') ||
      file.name.endsWith('.xml') ||
      file.name.toLowerCase().endsWith('.all');

    if (!isTextLike) {
      setFilePreview('Preview unavailable for this file type. You can still upload it.');
      return;
    }

    const reader = new FileReader();
    reader.onload = event => {
      const content = String(event.target?.result || '');
      setFilePreview(content.slice(0, 1500) || 'File is empty.');
    };
    reader.onerror = () => {
      setFilePreview('Unable to read file content preview.');
    };
    reader.readAsText(file);
  };

  const cisiMutation = useMutation({
    mutationFn: filePath => importCisi(filePath),
    onSuccess: data => {
      setPlatformState({ dataset: 'CISI', importCompleted: true, relevanceAvailable: true });
      queryClient.invalidateQueries({ queryKey: ['index-status-readiness'] });
      queryClient.invalidateQueries({ queryKey: ['index-stats'] });
      queryClient.invalidateQueries({ queryKey: ['index-metrics'] });
      queryClient.invalidateQueries({ queryKey: ['index-health'] });
      queryClient.invalidateQueries({ queryKey: ['index-config-bundle'] });
      setResultMessage(`CISI import completed. ${JSON.stringify(data || {})}`);
      toast.success('CISI imported successfully. Next step: build index.');
    },
    onError: error => toast.error(getErrorMessage(error, 'Failed to import CISI')),
  });

  const pubmedMutation = useMutation({
    mutationFn: filePath => importPubmed(filePath),
    onSuccess: data => {
      setPlatformState({ dataset: 'PubMed', importCompleted: true, relevanceAvailable: false });
      queryClient.invalidateQueries({ queryKey: ['index-status-readiness'] });
      queryClient.invalidateQueries({ queryKey: ['index-stats'] });
      queryClient.invalidateQueries({ queryKey: ['index-metrics'] });
      queryClient.invalidateQueries({ queryKey: ['index-health'] });
      queryClient.invalidateQueries({ queryKey: ['index-config-bundle'] });
      setResultMessage(`PubMed import completed. ${JSON.stringify(data || {})}`);
      toast.success('PubMed imported successfully. Next step: build index.');
    },
    onError: error => toast.error(getErrorMessage(error, 'Failed to import PubMed')),
  });

  const bulkUploadMutation = useMutation({
    mutationFn: ({ file, mode, indexingOptions }) => {
      const dataset = mode === 'auto' ? inferDatasetFromFilename(file.name) : mode;
      return bulkIndexDocumentsFromFile(file, { dataset, ...indexingOptions });
    },
    onSuccess: data => {
      setPlatformState({ dataset: 'Uploaded', importCompleted: true, relevanceAvailable: false });
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      queryClient.invalidateQueries({ queryKey: ['index-stats'] });
      queryClient.invalidateQueries({ queryKey: ['index-metrics'] });
      queryClient.invalidateQueries({ queryKey: ['index-config-bundle'] });
      setResultMessage(
        `Bulk index completed (${data.documentCount} docs, dataset ${data.dataset}). ${JSON.stringify(data.raw ?? data)}`
      );
      toast.success(
        data.message || `Indexed ${data.documentCount} document(s). Next: build index.`
      );
    },
    onError: error => toast.error(getErrorMessage(error, 'Bulk upload failed')),
  });

  const simpleUploadMutation = useMutation({
    mutationFn: file => uploadDocumentSimple(file),
    onSuccess: data => {
      setPlatformState({ dataset: 'Uploaded', importCompleted: true, relevanceAvailable: false });
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      setResultMessage(
        `Simple upload: ${data.documentCount} document(s). ${data.message ? `${data.message} ` : ''}${JSON.stringify(data.raw ?? {})}`
      );
      toast.success(
        data.message ||
          (data.documentCount ? `Uploaded ${data.documentCount} document(s).` : 'Upload finished.')
      );
    },
    onError: error => toast.error(getErrorMessage(error, 'Upload failed')),
  });

  const uploadCisiMutation = useMutation({
    mutationFn: file => uploadCisiFile(file),
    onSuccess: data => {
      setPlatformState({ dataset: 'CISI', importCompleted: true, relevanceAvailable: false });
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      setResultMessage(`CISI route upload completed. ${JSON.stringify(data || {})}`);
      toast.success('CISI file uploaded. Next step: build index.');
    },
    onError: error => toast.error(getErrorMessage(error, 'CISI upload failed')),
  });

  const uploadPubmedMutation = useMutation({
    mutationFn: file => uploadPubmedFile(file),
    onSuccess: data => {
      setPlatformState({ dataset: 'PubMed', importCompleted: true, relevanceAvailable: false });
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      setResultMessage(`PubMed route upload completed. ${JSON.stringify(data || {})}`);
      toast.success('PubMed file uploaded. Next step: build index.');
    },
    onError: error => toast.error(getErrorMessage(error, 'PubMed upload failed')),
  });

  const anyImportBusy =
    cisiMutation.isPending ||
    pubmedMutation.isPending ||
    bulkUploadMutation.isPending ||
    simpleUploadMutation.isPending ||
    uploadCisiMutation.isPending ||
    uploadPubmedMutation.isPending;

  const busyUpload =
    bulkUploadMutation.isPending ||
    simpleUploadMutation.isPending ||
    uploadCisiMutation.isPending ||
    uploadPubmedMutation.isPending;

  return (
    <div className="space-y-4">
      {readiness.backendStatus === 'connected' && !readiness.importCompleted && (
        <Card title="IR setup guide">
          <p className="mb-3 text-sm text-slate-300">
            The API is reachable but no corpus is registered in this browser session yet. Typical
            workflow:
          </p>
          <ol className="list-decimal space-y-2 pl-5 text-sm text-slate-300">
            <li>Import CISI or PubMed from the server, or bulk-upload a corpus file.</li>
            <li>
              Optional: set tokenizer, stemming, ranking, and length normalization for bulk indexing
              (same fields as the standalone IR UI).
            </li>
            <li>
              Go to <strong className="text-cyan-200">Indexing</strong> and build the Lucene index.
            </li>
            <li>
              Use <strong className="text-cyan-200">Search</strong> or{' '}
              <strong className="text-cyan-200">Experiments</strong> for runs and exports.
            </li>
          </ol>
        </Card>
      )}

      <Card title="Dataset Setup (Entry Point)">
        <p className="mb-4 text-sm text-gray-300">
          Start by importing a built-in dataset or uploading custom files. Search and Evaluation are
          enabled only after import + indexing.
        </p>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded border border-gray-200 p-4">
            <h3 className="font-semibold">Use Built-In Datasets</h3>
            <p className="mt-2 text-xs text-gray-500">
              Imports server-side paths. Optional <code className="text-cyan-600">filePath</code>{' '}
              query overrides the default corpus location.
            </p>
            <ul className="mt-2 list-disc pl-5 text-sm text-gray-600">
              <li>CISI.ALL / CISI.QRY / CISI.REL</li>
              <li>pubmed25n0006.xml</li>
            </ul>
            <div className="mt-2 space-y-2">
              <InputRow
                placeholder="Optional CISI file path on server"
                value={cisiServerPath}
                onChange={setCisiServerPath}
                disabled={anyImportBusy}
              />
              <InputRow
                placeholder="Optional PubMed file path on server"
                value={pubmedServerPath}
                onChange={setPubmedServerPath}
                disabled={anyImportBusy}
              />
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                disabled={
                  cisiMutation.isPending ||
                  pubmedMutation.isPending ||
                  bulkUploadMutation.isPending ||
                  simpleUploadMutation.isPending ||
                  uploadCisiMutation.isPending ||
                  uploadPubmedMutation.isPending
                }
                onClick={() => cisiMutation.mutate(cisiServerPath.trim() || undefined)}
              >
                <span className="flex items-center justify-center gap-2">
                  {cisiMutation.isPending ? <Spinner /> : null}
                  {cisiMutation.isPending ? 'Importing CISI…' : 'Import CISI'}
                </span>
              </Button>
              <Button
                className="bg-violet-600 hover:bg-violet-700"
                disabled={
                  pubmedMutation.isPending ||
                  cisiMutation.isPending ||
                  bulkUploadMutation.isPending ||
                  simpleUploadMutation.isPending ||
                  uploadCisiMutation.isPending ||
                  uploadPubmedMutation.isPending
                }
                onClick={() => pubmedMutation.mutate(pubmedServerPath.trim() || undefined)}
              >
                <span className="flex items-center justify-center gap-2">
                  {pubmedMutation.isPending ? <Spinner /> : null}
                  {pubmedMutation.isPending ? 'Importing PubMed…' : 'Import PubMed'}
                </span>
              </Button>
            </div>
          </div>

          <div className="rounded border border-gray-200 p-4">
            <h3 className="font-semibold">Upload / bulk index from file</h3>
            <p className="mt-1 text-sm text-gray-600">
              Primary: <strong className="text-slate-200">POST /documents/bulk</strong> with{' '}
              <code className="text-xs text-cyan-600">dataset</code> CISI or PUBMED (auto from
              filename: .all / cisi → CISI; .xml / .txt → PUBMED).
            </p>
            <div className="mt-3">
              <label className="mb-1 block text-xs font-medium text-slate-400">
                Dataset for bulk
              </label>
              <Select
                value={datasetMode}
                onChange={e => setDatasetMode(e.target.value)}
                disabled={anyImportBusy}
                className="text-sm"
              >
                <option value="auto">Auto from filename</option>
                <option value="CISI">CISI</option>
                <option value="PUBMED">PUBMED</option>
              </Select>
            </div>
            <div className="mt-3 rounded-md border border-slate-700 bg-slate-900/50 p-3">
              <p className="mb-2 text-xs font-medium text-cyan-200/90">
                Bulk POST fields (tokenizer / stem / ranking / length norm)
              </p>
              <div className="grid gap-2 md:grid-cols-2">
                <Select
                  value={bulkIr.tokenizerType}
                  disabled={anyImportBusy}
                  className="text-sm"
                  onChange={e => setBulkIr(v => ({ ...v, tokenizerType: e.target.value }))}
                >
                  <option value="standard">Tokenizer: standard</option>
                  <option value="custom">Tokenizer: custom</option>
                </Select>
                <Select
                  value={bulkIr.rankingAlgorithm}
                  disabled={anyImportBusy}
                  className="text-sm"
                  onChange={e => setBulkIr(v => ({ ...v, rankingAlgorithm: e.target.value }))}
                >
                  <option value="bm25">Ranking: BM25</option>
                  <option value="tf-idf">Ranking: TF-IDF</option>
                  <option value="tf">Ranking: TF</option>
                </Select>
              </div>
              <label className="mt-2 flex items-center gap-2 text-sm text-slate-200">
                <input
                  type="checkbox"
                  checked={bulkIr.useStemming}
                  disabled={anyImportBusy}
                  onChange={e => setBulkIr(v => ({ ...v, useStemming: e.target.checked }))}
                />
                Stemming during bulk index
              </label>
              <label className="mt-1 flex items-center gap-2 text-sm text-slate-200">
                <input
                  type="checkbox"
                  checked={bulkIr.lengthNormalization}
                  disabled={anyImportBusy}
                  onChange={e => setBulkIr(v => ({ ...v, lengthNormalization: e.target.checked }))}
                />
                Length normalization
              </label>
            </div>
            <input
              className="mt-3 block w-full text-sm"
              type="file"
              accept={ACCEPTED_TYPES}
              disabled={anyImportBusy}
              onChange={e => {
                const file = e.target.files?.[0] || null;
                setSelectedFile(file);
                loadPreview(file);
              }}
            />
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                disabled={
                  !selectedFile ||
                  bulkUploadMutation.isPending ||
                  cisiMutation.isPending ||
                  pubmedMutation.isPending ||
                  simpleUploadMutation.isPending ||
                  uploadCisiMutation.isPending ||
                  uploadPubmedMutation.isPending
                }
                onClick={() =>
                  bulkUploadMutation.mutate({
                    file: selectedFile,
                    mode: datasetMode,
                    indexingOptions: bulkIr,
                  })
                }
              >
                <span className="flex items-center justify-center gap-2">
                  {bulkUploadMutation.isPending ? <Spinner /> : null}
                  {bulkUploadMutation.isPending ? 'Bulk indexing…' : 'Bulk index from file'}
                </span>
              </Button>
              <Button
                className="border-slate-500 bg-slate-700 hover:bg-slate-600"
                disabled={
                  !selectedFile || busyUpload || cisiMutation.isPending || pubmedMutation.isPending
                }
                onClick={() => simpleUploadMutation.mutate(selectedFile)}
              >
                <span className="flex items-center justify-center gap-2">
                  {simpleUploadMutation.isPending ? <Spinner /> : null}
                  {simpleUploadMutation.isPending ? 'Uploading…' : 'Simple upload'}
                </span>
              </Button>
            </div>
            <p className="mt-2 text-xs text-gray-500">
              Optional dedicated routes: <code className="text-cyan-600">/upload/cisi</code>,{' '}
              <code className="text-cyan-600">/upload/pubmed</code>
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Button
                className="border-amber-500/40 bg-amber-900/40 hover:bg-amber-900/60"
                disabled={
                  !selectedFile || busyUpload || cisiMutation.isPending || pubmedMutation.isPending
                }
                onClick={() => uploadCisiMutation.mutate(selectedFile)}
              >
                <span className="flex items-center gap-2">
                  {uploadCisiMutation.isPending ? <Spinner /> : null}
                  POST /upload/cisi
                </span>
              </Button>
              <Button
                className="border-emerald-500/40 bg-emerald-900/30 hover:bg-emerald-900/50"
                disabled={
                  !selectedFile || busyUpload || cisiMutation.isPending || pubmedMutation.isPending
                }
                onClick={() => uploadPubmedMutation.mutate(selectedFile)}
              >
                <span className="flex items-center gap-2">
                  {uploadPubmedMutation.isPending ? <Spinner /> : null}
                  POST /upload/pubmed
                </span>
              </Button>
            </div>
            {fileMeta && (
              <div className="mt-4 rounded border border-gray-700 bg-gray-900/60 p-3 text-xs text-gray-300">
                <p>
                  <span className="font-semibold">Selected:</span> {fileMeta.name}
                </p>
                <p>
                  <span className="font-semibold">Type:</span> {fileMeta.type}
                </p>
                <p>
                  <span className="font-semibold">Size:</span> {fileMeta.sizeKb} KB
                </p>
                {inferredDataset ? (
                  <p className="mt-1 text-cyan-300/90">
                    <span className="font-semibold">Auto dataset:</span> {inferredDataset}
                  </p>
                ) : null}
                <div className="mt-2">
                  <p className="mb-1 font-semibold">Content preview (first part):</p>
                  <pre className="max-h-44 overflow-auto rounded border border-gray-700 bg-gray-800 p-2 text-[11px]">
                    {filePreview || 'Preparing preview...'}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>

      <Card title="Import / Upload Result">
        {anyImportBusy ? (
          <div className="flex items-center gap-3 rounded-md border border-cyan-500/25 bg-slate-900/50 px-4 py-3 text-sm text-slate-200">
            <Spinner className="h-5 w-5 border-2" />
            <span>
              {cisiMutation.isPending && 'Importing CISI…'}
              {pubmedMutation.isPending && !cisiMutation.isPending && 'Importing PubMed…'}
              {bulkUploadMutation.isPending &&
                !cisiMutation.isPending &&
                !pubmedMutation.isPending &&
                'Bulk indexing… This may take a while for large files.'}
              {simpleUploadMutation.isPending &&
                !cisiMutation.isPending &&
                !pubmedMutation.isPending &&
                !bulkUploadMutation.isPending &&
                'Uploading (simple)…'}
              {uploadCisiMutation.isPending &&
                !cisiMutation.isPending &&
                !pubmedMutation.isPending &&
                !bulkUploadMutation.isPending &&
                !simpleUploadMutation.isPending &&
                'Uploading via /upload/cisi…'}
              {uploadPubmedMutation.isPending &&
                !cisiMutation.isPending &&
                !pubmedMutation.isPending &&
                !bulkUploadMutation.isPending &&
                !simpleUploadMutation.isPending &&
                !uploadCisiMutation.isPending &&
                'Uploading via /upload/pubmed…'}
            </span>
          </div>
        ) : null}
        {!resultMessage && !anyImportBusy ? (
          <EmptyState
            title="No action yet"
            description="Import CISI/PubMed or upload a file to start the IR workflow."
          />
        ) : null}
        {resultMessage ? (
          <pre
            className={`overflow-auto rounded border border-gray-700 bg-gray-800 p-3 text-xs ${anyImportBusy ? 'mt-3' : ''}`}
          >
            {resultMessage}
          </pre>
        ) : null}
      </Card>
    </div>
  );
}

function InputRow({ placeholder, value, onChange, disabled }) {
  return (
    <input
      type="text"
      placeholder={placeholder}
      value={value}
      disabled={disabled}
      onChange={e => onChange(e.target.value)}
      className="w-full rounded-md border border-slate-600 bg-slate-900/70 px-2 py-1.5 text-xs text-slate-100 placeholder:text-slate-500 focus:border-cyan-400/50 focus:outline-none"
    />
  );
}
