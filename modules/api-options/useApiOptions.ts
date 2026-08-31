'use client';

import { useEffect, useState } from 'react';
import { fetchApiOptions } from './service';
import type { ApiOptions } from './types';

export function useApiOptions(provider: 'flight' | 'hotel') {
  const [options, setOptions] = useState<ApiOptions | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApiOptions(provider).then(opts => {
      setOptions(opts);
      setLoading(false);
    });
  }, [provider]);

  return { options, loading };
}
