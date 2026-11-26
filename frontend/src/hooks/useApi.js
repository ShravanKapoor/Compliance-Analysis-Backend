import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Run an API call on mount (and when deps change).
 * Returns { data, error, loading, reload, setData }.
 */
export function useApi(fn, deps = []) {
  const [state, setState] = useState({ data: undefined, error: null, loading: true });
  const latest = useRef(0);

  const reload = useCallback(async () => {
    const call = ++latest.current;
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const data = await fn();
      if (call === latest.current) setState({ data, error: null, loading: false });
    } catch (error) {
      if (call === latest.current) setState((s) => ({ ...s, error, loading: false }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    reload();
  }, [reload]);

  const setData = useCallback((data) => setState((s) => ({ ...s, data })), []);
  return { ...state, reload, setData };
}
