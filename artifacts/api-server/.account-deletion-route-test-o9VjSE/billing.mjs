
    export async function hasPremiumMembership() {
      const state = globalThis.__accountDeletionTestState;
      state.billingAccessCalls++;
      if (state.failMembershipLookup) throw new Error("Injected billing status failure");
      return state.isPremium;
    }
  