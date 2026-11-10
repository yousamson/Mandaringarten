type DeleteOptions = {
  data: {
    privacyAccepted: boolean;
    disclaimerAccepted: boolean;
    dataDeletionAccepted: boolean;
    noRefundAccepted: boolean;
    subscriptionCancellationAccepted: boolean;
    confirmation: string;
    policyVersion: string;
  };
};

const idleQuery = { data: undefined, isLoading: false, isError: false, refetch: async () => undefined };
const emptyMutation = { isPending: false, isError: false, mutate: () => undefined, mutateAsync: async () => undefined, reset: () => undefined };

export const getGetBillingStatusQueryKey = () => ['billing-status'];
export const getGetBillingPlanQueryKey = () => ['billing-plan'];
export const getGetLearningProgressQueryKey = () => ['learning-progress'];
export const getGetAccountAccessQueryKey = () => ['account-access'];
export const getGetSupportConversationQueryKey = (threadId?: string) => ['support-conversation', threadId];
export const getGetSupportThreadsQueryKey = () => ['support-threads'];
export const getGetLegalConsentQueryKey = () => ['legal-consent'];

export const useGetBillingStatus = () => idleQuery;
export const useGetBillingPlan = () => idleQuery;
export const useGetLearningProgress = () => idleQuery;
export const useGetAccountAccess = () => idleQuery;
export const useGetSupportConversation = () => idleQuery;
export const useGetSupportThreads = () => ({ ...idleQuery, data: [] });
export const useGetLegalConsent = () => idleQuery;
export const useAcceptLegalConsent = () => emptyMutation;
export const useCreateBillingCheckout = () => emptyMutation;
export const useCreateBillingPortal = () => emptyMutation;
export const useCreateSupportThread = () => emptyMutation;
export const useSendSupportMessage = () => emptyMutation;
export const useLookupTranslation = () => ({ ...emptyMutation, data: undefined, error: null });
export const useUpdateLearningProgress = () => emptyMutation;
export const useLookupTranslation = () => emptyMutation;
export const issueLearningRound = async () => { throw new Error('Not available in browser layout tests.'); };
export const recordLearningRound = async () => { throw new Error('Not available in browser layout tests.'); };
export const recordGardenCare = async () => { throw new Error('Not available in browser layout tests.'); };

export function useDeleteAccount() {
  return {
    isPending: false,
    mutate: (options: DeleteOptions) => {
      const browser = window as Window & { __deletionAttempts?: unknown[] };
      browser.__deletionAttempts?.push(options);
    },
  };
}
