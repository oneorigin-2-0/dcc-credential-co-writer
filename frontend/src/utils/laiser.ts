export type LaiserJobStatus = 'QUEUED' | 'SUCCEEDED' | 'FAILED' | 'UNKNOWN';

export interface LaiserSubmitResponse {
  jobId: string;
  status: string;
}

export interface LaiserResultItem {
  'Raw Skill': string;
  'Correlation Coefficient': number;
  'Taxonomy Source'?: string;
  'Source URL'?: string;
  'Taxonomy Description'?: string;
  'Skill Tag': string;
  'Taxonomy Skill': string;
}

export interface LaiserResultResponse {
  jobId: string;
  status: LaiserJobStatus | string;
  updatedAt?: string;
  result?: LaiserResultItem[];
  resultRef?: {
    s3Bucket: string;
    s3Key: string;
  };
  latencyMs?: number;
}

export function isLaiserTerminalStatus(status?: string): boolean {
  const normalized = String(status ?? '').trim().toUpperCase();
  return normalized === 'SUCCEEDED' || normalized === 'FAILED';
}

const LAISER_BASE_URL =
  process.env.NEXT_PUBLIC_LAISER_API_BASE_URL ?? 'https://uhao2r8hue.execute-api.us-east-1.amazonaws.com/dev';
const LAISER_API_KEY = process.env.NEXT_PUBLIC_LAISER_API_KEY ?? '';
const LAISER_LAISER_ENDPOINT = process.env.NEXT_PUBLIC_LAISER_LAISER_ENDPOINT ?? '/laiser';
const LAISER_RESULT_ENDPOINT = process.env.NEXT_PUBLIC_LAISER_RESULT_ENDPOINT ?? '/result';

export async function submitLaiserJob(inputText: string): Promise<LaiserSubmitResponse> {
  if (!LAISER_API_KEY) {
    throw new Error('LAiSER API key is not configured.');
  }

  const res = await fetch(`${LAISER_BASE_URL}${LAISER_LAISER_ENDPOINT}`, {
    method: 'POST',
    headers: {
      'x-api-key': LAISER_API_KEY,
      'content-type': 'application/json',
    },
    body: JSON.stringify({ inputText }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Failed to submit LAiSER job: ${res.status} ${text}`);
  }

  const data = (await res.json()) as LaiserSubmitResponse;
  return data;
}

export async function fetchLaiserResult(jobId: string): Promise<LaiserResultResponse> {
  if (!LAISER_API_KEY) {
    throw new Error('LAiSER API key is not configured.');
  }

  const res = await fetch(
    `${LAISER_BASE_URL}${LAISER_RESULT_ENDPOINT}?jobId=${encodeURIComponent(jobId)}`,
    {
      method: 'GET',
      headers: {
        'x-api-key': LAISER_API_KEY,
      },
    }
  );

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Failed to fetch LAiSER result: ${res.status} ${text}`);
  }

  const data = (await res.json()) as LaiserResultResponse;
  return data;
}

/** Map LAiSER result items to app skill shape (SkillObject) for badge alignment. */
export function mapLaiserResultToSkills(
  items: LaiserResultItem[]
): Array<{ targetName: string; targetDescription?: string; targetUrl: string; targetType?: string }> {
  const mapTaxonomySourceToTargetType = (taxonomySource?: string): string => {
    const source = String(taxonomySource ?? '').trim().toLowerCase();

    if (source === 'esco') return 'ESCO:Skill';
    if (source === 'onet_tech' || source === 'onet_skill') return 'O*NET:Skill';
    else return `${source.toUpperCase()}:Skill`;
    return 'Skill';
  };

  return items.map((item) => ({
    targetName: item['Raw Skill'] ?? '',
    targetDescription: item['Taxonomy Description'] || undefined,
    targetType: mapTaxonomySourceToTargetType(item['Taxonomy Source']),
    targetUrl: item['Source URL'] || '',
  }));
}

