import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/react';
import {
  getGetExamProgressQueryKey,
  recordExamActivity,
  useGetExamProgress,
  type ExamProgressResponse,
  type RecordExamActivityInput,
} from '@workspace/api-client-react';
import { useRef } from 'react';

export const examProgressQueryKey = (uid: string | null) => [
  ...getGetExamProgressQueryKey(),
  uid,
];

export function useExamProgress(uid: string | null, enabled: boolean) {
  const client = useQueryClient();
  const { getToken, userId } = useAuth();
  const currentUser = useRef(userId);
  currentUser.current = userId;
  const query = useGetExamProgress({
    query: {
      enabled: enabled && Boolean(uid),
      queryKey: examProgressQueryKey(uid),
      refetchOnMount: 'always',
      refetchOnWindowFocus: true,
      retry: false,
    },
  });
  const mutation = useMutation({
    mutationFn: async (data: RecordExamActivityInput) => {
      if (!uid || currentUser.current !== uid) throw new Error('Account changed.');
      const token = await getToken();
      if (!token || currentUser.current !== uid) throw new Error('Sign in to save learning progress.');
      return recordExamActivity(data, { headers: { Authorization: `Bearer ${token}` } });
    },
    onSuccess: (result) => {
      if (!uid || currentUser.current !== uid) return;
      client.setQueryData<ExamProgressResponse>(examProgressQueryKey(uid), result);
      void client.invalidateQueries({ queryKey: examProgressQueryKey(uid) });
    },
  });
  return {
    ...query,
    progress: query.isError ? undefined : query.data,
    recordActivity: mutation.mutateAsync,
    isSaving: mutation.isPending,
    saveError: mutation.error,
  };
}
