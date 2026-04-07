import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import {
  importCisi,
  importPubmed,
  uploadDocumentFile,
} from '../features/datasource/api/datasourceApi';
import { Button, Card, EmptyState } from '../shared/ui/UiPrimitives';
import { getErrorMessage } from '../shared/utils/errorUtils';
import { setPlatformState } from '../shared/state/platformState';

const ACCEPTED_TYPES = '.txt,.xml,.zip';

export function DataSourcePage() {
  const queryClient = useQueryClient();
  const [selectedFile, setSelectedFile] = useState(null);
  const [resultMessage, setResultMessage] = useState('');
  const [filePreview, setFilePreview] = useState('');
  const [fileMeta, setFileMeta] = useState(null);

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
      file.name.endsWith('.xml');

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
    mutationFn: importCisi,
    onSuccess: data => {
      setPlatformState({ dataset: 'CISI', importCompleted: true, relevanceAvailable: true });
      queryClient.invalidateQueries({ queryKey: ['index-status-readiness'] });
      setResultMessage(`CISI import completed. ${JSON.stringify(data || {})}`);
      toast.success('CISI imported successfully. Next step: build index.');
    },
    onError: error => toast.error(getErrorMessage(error, 'Failed to import CISI')),
  });

  const pubmedMutation = useMutation({
    mutationFn: importPubmed,
    onSuccess: data => {
      setPlatformState({ dataset: 'PubMed', importCompleted: true, relevanceAvailable: false });
      queryClient.invalidateQueries({ queryKey: ['index-status-readiness'] });
      setResultMessage(`PubMed import completed. ${JSON.stringify(data || {})}`);
      toast.success('PubMed imported successfully. Next step: build index.');
    },
    onError: error => toast.error(getErrorMessage(error, 'Failed to import PubMed')),
  });

  const uploadMutation = useMutation({
    mutationFn: uploadDocumentFile,
    onSuccess: data => {
      setPlatformState({ dataset: 'Uploaded', importCompleted: true, relevanceAvailable: false });
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      setResultMessage(`Upload completed. ${JSON.stringify(data || {})}`);
      toast.success('File uploaded. Next step: build index.');
    },
    onError: error => toast.error(getErrorMessage(error, 'Upload failed')),
  });

  return (
    <div className="space-y-4">
      <Card title="Dataset Setup (Entry Point)">
        <p className="mb-4 text-sm text-gray-300">
          Start by importing a built-in dataset or uploading custom files. Search and Evaluation are
          enabled only after import + indexing.
        </p>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded border border-gray-200 p-4">
            <h3 className="font-semibold">Use Built-In Datasets</h3>
            <ul className="mt-2 list-disc pl-5 text-sm text-gray-600">
              <li>CISI.ALL / CISI.QRY / CISI.REL</li>
              <li>pubmed25n0006.xml</li>
            </ul>
            <div className="mt-3 flex gap-2">
              <Button disabled={cisiMutation.isPending} onClick={() => cisiMutation.mutate()}>
                Import CISI
              </Button>
              <Button
                className="bg-violet-600 hover:bg-violet-700"
                disabled={pubmedMutation.isPending}
                onClick={() => pubmedMutation.mutate()}
              >
                Import PubMed
              </Button>
            </div>
          </div>

          <div className="rounded border border-gray-200 p-4">
            <h3 className="font-semibold">Upload Custom File</h3>
            <p className="mt-1 text-sm text-gray-600">
              Supported: .txt, .xml, and .zip (UI-ready).
            </p>
            <input
              className="mt-3 block w-full text-sm"
              type="file"
              accept={ACCEPTED_TYPES}
              onChange={e => {
                const file = e.target.files?.[0] || null;
                setSelectedFile(file);
                loadPreview(file);
              }}
            />
            <div className="mt-3">
              <Button
                disabled={!selectedFile || uploadMutation.isPending}
                onClick={() => uploadMutation.mutate(selectedFile)}
              >
                Upload File
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
        {!resultMessage ? (
          <EmptyState
            title="No action yet"
            description="Import CISI/PubMed or upload a file to start the IR workflow."
          />
        ) : (
          <pre className="overflow-auto rounded border border-gray-700 bg-gray-800 p-3 text-xs">
            {resultMessage}
          </pre>
        )}
      </Card>
    </div>
  );
}
