import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { importCisi, importPubmed, uploadDocumentFile } from '../features/datasource/api/datasourceApi';
import { Button, Card, EmptyState } from '../shared/ui/UiPrimitives';
import { getErrorMessage } from '../shared/utils/errorUtils';
import { setPlatformState } from '../shared/state/platformState';

const ACCEPTED_TYPES = '.txt,.xml,.zip';

export function DataSourcePage() {
  const queryClient = useQueryClient();
  const [selectedFile, setSelectedFile] = useState(null);
  const [resultMessage, setResultMessage] = useState('');

  const cisiMutation = useMutation({
    mutationFn: importCisi,
    onSuccess: (data) => {
      setPlatformState({ dataset: 'CISI', importCompleted: true, relevanceAvailable: true });
      queryClient.invalidateQueries({ queryKey: ['index-status-readiness'] });
      setResultMessage(`CISI import completed. ${JSON.stringify(data || {})}`);
      toast.success('CISI imported successfully. Next step: build index.');
    },
    onError: (error) => toast.error(getErrorMessage(error, 'Failed to import CISI')),
  });

  const pubmedMutation = useMutation({
    mutationFn: importPubmed,
    onSuccess: (data) => {
      setPlatformState({ dataset: 'PubMed', importCompleted: true, relevanceAvailable: false });
      queryClient.invalidateQueries({ queryKey: ['index-status-readiness'] });
      setResultMessage(`PubMed import completed. ${JSON.stringify(data || {})}`);
      toast.success('PubMed imported successfully. Next step: build index.');
    },
    onError: (error) => toast.error(getErrorMessage(error, 'Failed to import PubMed')),
  });

  const uploadMutation = useMutation({
    mutationFn: uploadDocumentFile,
    onSuccess: (data) => {
      setPlatformState({ dataset: 'Uploaded', importCompleted: true, relevanceAvailable: false });
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      setResultMessage(`Upload completed. ${JSON.stringify(data || {})}`);
      toast.success('File uploaded. Next step: build index.');
    },
    onError: (error) => toast.error(getErrorMessage(error, 'Upload failed')),
  });

  return (
    <div className="space-y-4">
      <Card title="Dataset Setup (Entry Point)">
        <p className="mb-4 text-sm text-gray-600">
          Start by importing a built-in dataset or uploading custom files. Search and Evaluation are enabled only after import + indexing.
        </p>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded border border-gray-200 p-4">
            <h3 className="font-semibold">Use Built-In Datasets</h3>
            <ul className="mt-2 list-disc pl-5 text-sm text-gray-600">
              <li>CISI.ALL / CISI.QRY / CISI.REL</li>
              <li>pubmed25n0006.xml</li>
            </ul>
            <div className="mt-3 flex gap-2">
              <Button disabled={cisiMutation.isPending} onClick={() => cisiMutation.mutate()}>Import CISI</Button>
              <Button className="bg-violet-600 hover:bg-violet-700" disabled={pubmedMutation.isPending} onClick={() => pubmedMutation.mutate()}>
                Import PubMed
              </Button>
            </div>
          </div>

          <div className="rounded border border-gray-200 p-4">
            <h3 className="font-semibold">Upload Custom File</h3>
            <p className="mt-1 text-sm text-gray-600">Supported: .txt, .xml, and .zip (UI-ready).</p>
            <input
              className="mt-3 block w-full text-sm"
              type="file"
              accept={ACCEPTED_TYPES}
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
            />
            <div className="mt-3">
              <Button disabled={!selectedFile || uploadMutation.isPending} onClick={() => uploadMutation.mutate(selectedFile)}>
                Upload File
              </Button>
            </div>
          </div>
        </div>
      </Card>

      <Card title="Import / Upload Result">
        {!resultMessage ? (
          <EmptyState title="No action yet" description="Import CISI/PubMed or upload a file to start the IR workflow." />
        ) : (
          <pre className="overflow-auto rounded bg-gray-100 p-3 text-xs">{resultMessage}</pre>
        )}
      </Card>
    </div>
  );
}
