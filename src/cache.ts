import { identity, pickBy } from 'lodash';
import objectHash from 'object-hash';
import { createClient } from 'redis';

type RedisClient = ReturnType<typeof createClient>;
let _client: RedisClient;
const getClient = async (): Promise<RedisClient> => {
  if (_client) {
    return _client;
  }
  const client = createClient();
  await client.connect();
  _client = client;
  return client;
};

interface RequestProps {
  method: string;
  path: string;
  authHeader: string | undefined;
  body: string | undefined;
}

interface CachedResponse {
  body: string;
  headers: Record<string, string>;
  status: number;
}

export const getCacheKey = (props: RequestProps): string => {
  const propsWithoutUndefined = pickBy(props, identity);
  const hash = objectHash(propsWithoutUndefined);
  return hash;
};

export const readCache = async ({
  cacheKey,
}: {
  cacheKey: string;
}): Promise<CachedResponse | null> => {
  const client = await getClient();
  const result = await client.get(cacheKey);
  if (result) {
    return JSON.parse(result) as CachedResponse;
  }
  return null;
};

interface WriteCacheProps {
  cacheKey: string;
  response: CachedResponse;
}

export const writeCache = async ({ cacheKey, response }: WriteCacheProps): Promise<void> => {
  const client = await getClient();
  await client.set(cacheKey, JSON.stringify(response));
  return;
};
