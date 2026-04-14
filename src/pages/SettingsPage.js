import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import {
  fetchIndexConfigBundle,
  putNormalizationConfig,
  putRankingConfig,
  putStemmingConfig,
  putTokenizerConfig,
} from '../features/indexing/api/indexingApi';
import { API_BASE_URL } from '../shared/constants/endpoints';
import { Button, Card, Select } from '../shared/ui/UiPrimitives';
import { getErrorMessage } from '../shared/utils/errorUtils';

export function SettingsPage() {
  const [saving, setSaving] = useState(false);
  const configQuery = useQuery({
    queryKey: ['settings-config-bundle'],
    queryFn: fetchIndexConfigBundle,
  });

  const config = configQuery.data || {};
  const tokenizer = config?.tokenizer?.type ?? config?.tokenizer?.tokenizerType ?? 'standard';
  const stemming = Boolean(config?.stemming?.enabled ?? config?.stemming?.useStemming);
  const ranking = config?.ranking?.algorithm ?? config?.ranking?.rankingAlgorithm ?? 'bm25';
  const norm = Boolean(
    config?.normalization?.enabled ?? config?.normalization?.lengthNormalization ?? true
  );

  async function updateAll(next) {
    setSaving(true);
    try {
      await Promise.all([
        putTokenizerConfig({ type: next.tokenizer }),
        putStemmingConfig({ enabled: next.stemming }),
        putRankingConfig({ algorithm: next.ranking }),
        putNormalizationConfig({ enabled: next.norm }),
      ]);
      toast.success('Settings synced to backend');
      configQuery.refetch();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to sync settings'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card title="Settings">
      <p className="mb-3 text-sm text-slate-400">API base URL: {API_BASE_URL}</p>
      {configQuery.isError ? (
        <p className="text-sm text-rose-300">{getErrorMessage(configQuery.error)}</p>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          <Select id="tokenizer" defaultValue={tokenizer}>
            <option value="standard">Tokenizer: standard</option>
            <option value="custom">Tokenizer: custom</option>
          </Select>
          <Select id="ranking" defaultValue={ranking}>
            <option value="bm25">Ranking: BM25</option>
            <option value="tf-idf">Ranking: TF-IDF</option>
            <option value="tf">Ranking: TF</option>
          </Select>
          <label className="flex items-center gap-2 text-sm text-slate-200">
            <input id="stemming" type="checkbox" defaultChecked={stemming} />
            Enable stemming
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-200">
            <input id="norm" type="checkbox" defaultChecked={norm} />
            Enable length normalization
          </label>
          <div className="md:col-span-2">
            <Button
              disabled={saving}
              onClick={() =>
                updateAll({
                  tokenizer: document.getElementById('tokenizer')?.value || tokenizer,
                  ranking: document.getElementById('ranking')?.value || ranking,
                  stemming: Boolean(document.getElementById('stemming')?.checked),
                  norm: Boolean(document.getElementById('norm')?.checked),
                })
              }
            >
              {saving ? 'Saving…' : 'Save settings'}
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
