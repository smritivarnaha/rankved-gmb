import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useGlobalSettings() {
  const { data, error, isLoading, mutate } = useSWR("/api/admin/login-settings", fetcher);

  return {
    settings: data,
    isLoading,
    isError: error,
    mutate,
  };
}
