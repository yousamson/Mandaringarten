
    export const DeleteAccountBody = {
      safeParse(value) {
        return value?.privacyAccepted && value?.disclaimerAccepted &&
          value?.dataDeletionAccepted && value?.noRefundAccepted &&
          value?.subscriptionCancellationAccepted && value?.confirmation === "DELETE"
          ? { success: true, data: value } : { success: false };
      },
    };
  