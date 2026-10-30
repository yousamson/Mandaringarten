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

export function useDeleteAccount() {
  return {
    isPending: false,
    mutate: (options: DeleteOptions) => {
      const browser = window as Window & { __deletionAttempts?: unknown[] };
      browser.__deletionAttempts?.push(options);
    },
  };
}
