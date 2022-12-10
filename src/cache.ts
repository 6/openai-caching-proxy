import { identity, pickBy } from 'lodash';
import objectHash from 'object-hash';

interface RequestProps {
  method: string;
  path: string;
  authHeader: string | undefined;
  body: string | undefined;
}

export const getCacheKey = (props: RequestProps): string => {
  const propsWithoutUndefined = pickBy(props, identity);
  const hash = objectHash(propsWithoutUndefined);
  return hash;
};
