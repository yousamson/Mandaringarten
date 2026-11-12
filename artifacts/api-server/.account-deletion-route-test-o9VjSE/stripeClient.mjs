
    export async function stripeRequest(endpoint, options = {}) {
      const state = globalThis.__accountDeletionTestState;
      const method = options.method ?? "GET";
      const url = new URL(endpoint, "https://stripe.test");
      const request = { method, pathname: url.pathname };
      state.stripeCalls.push(request);
      if (state.failOnce === request.method + " " + request.pathname) {
        state.failOnce = null;
        throw new Error("Injected Stripe failure: " + request.method + " " + request.pathname);
      }
      if (url.pathname === "/v1/customers/cus_fixture" && method === "GET") {
        return state.customerDeleted
          ? { id: "cus_fixture", deleted: true }
          : { id: "cus_fixture" };
      }
      if (url.pathname === "/v1/checkout/sessions" && method === "GET") {
        return { data: state.sessionStatus === "open" ? [{ id: "cs_fixture", status: "open" }] : [], has_more: false };
      }
      if (url.pathname === "/v1/checkout/sessions/cs_fixture/expire" && method === "POST") {
        state.sessionStatus = "expired";
        return { id: "cs_fixture", status: "expired" };
      }
      if (url.pathname === "/v1/subscriptions" && method === "GET") {
        return { data: state.subscriptionStatus === "active" ? [{ id: "sub_fixture", status: "active" }] : [], has_more: false };
      }
      if (url.pathname === "/v1/subscriptions/sub_fixture" && method === "DELETE") {
        state.subscriptionStatus = "canceled";
        return { id: "sub_fixture", status: "canceled" };
      }
      if (url.pathname === "/v1/customers/cus_fixture" && method === "DELETE") {
        state.customerDeleted = true;
        return { id: "cus_fixture", deleted: true };
      }
      throw new Error("Unexpected Stripe fixture request: " + method + " " + endpoint);
    }
  