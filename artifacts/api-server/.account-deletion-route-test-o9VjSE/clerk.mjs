
    export const clerkClient = {
      users: {
        async deleteUser(userId) {
          const state = globalThis.__accountDeletionTestState;
          state.identityDeleteCalls++;
          if (state.identityFailureCount > 0) {
            state.identityFailureCount--;
            throw new Error("Injected identity-provider failure");
          }
          state.deletedIdentity = userId;
        },
      },
    };
    export function getAuth(req) { return { userId: req.testUserId ?? null }; }
  