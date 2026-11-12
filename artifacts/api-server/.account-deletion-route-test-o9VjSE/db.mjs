
    const defineTable = (name, columns) => {
      const table = { __name: name };
      for (const column of columns) table[column] = { __table: name, __column: column };
      return table;
    };
    export const accountDeletionsTable = defineTable("deletions", ["accountHash", "completed"]);
    export const billingAccountsTable = defineTable("billingAccounts", ["clerkUserId", "stripeCustomerId"]);
    export const billingCustomersTable = defineTable("billingCustomers", ["clerkUserId", "stripeCustomerId"]);
    export const billingCustomerScopesTable = defineTable("billingScopes", ["clerkUserId", "stripeScope", "stripeCustomerId"]);
    export const learningChallengesTable = defineTable("challenges", ["clerkUserId"]);
    export const learningProgressTable = defineTable("progress", ["clerkUserId"]);
    export const learningRoundsTable = defineTable("rounds", ["clerkUserId"]);
    export const legalConsentsTable = defineTable("legalConsents", ["clerkUserId"]);
    export const checkoutConsentsTable = defineTable("checkoutConsents", ["clerkUserId"]);
    export const supportThreadsTable = defineTable("supportThreads", ["id", "clerkUserId", "lastMessagePreview"]);
    export const supportMessagesTable = defineTable("supportMessages", ["id", "threadId", "authorId", "text", "createdAt"]);
    const state = () => globalThis.__accountDeletionTestState;
    const matches = (row, predicate) => {
      if (!predicate) return true;
      if (predicate.kind === "eq") return row[predicate.column.__column] === predicate.value;
      if (predicate.kind === "inArray") return predicate.values.includes(row[predicate.column.__column]);
      if (predicate.kind === "and") return predicate.parts.every((part) => matches(row, part));
      return true;
    };
    const projected = (row, selection) => {
      if (!selection) return row;
      return Object.fromEntries(Object.entries(selection).map(([key, column]) => [key, row[column.__column]]));
    };
    function query(selection) {
      let table;
      let predicate;
      const builder = {
        from(value) { table = value; return this; },
        where(value) { predicate = value; return this; },
        orderBy() { return this; },
        then(resolve, reject) {
          try {
            resolve(state().rows[table.__name].filter((row) => matches(row, predicate)).map((row) => projected(row, selection)));
          } catch (error) { reject(error); }
        },
        limit(count) {
          return Promise.resolve(state().rows[table.__name]
            .filter((row) => matches(row, predicate)).slice(0, count)
            .map((row) => projected(row, selection)));
        },
      };
      return builder;
    }
    function insert(table) {
      return {
        values(value) {
          return {
            onConflictDoNothing() {
              if (!state().rows[table.__name].some((row) => row.accountHash === value.accountHash)) {
                state().rows[table.__name].push({ completed: null, ...value });
              }
              return Promise.resolve();
            },
          };
        },
      };
    }
    function remove(table) {
      return {
        where(predicate) {
          state().rows[table.__name] = state().rows[table.__name]
            .filter((row) => !matches(row, predicate));
          return Promise.resolve();
        },
      };
    }
    function update(table) {
      return {
        set(values) {
          return {
            where(predicate) {
              for (const row of state().rows[table.__name]) {
                if (matches(row, predicate)) Object.assign(row, values);
              }
              return Promise.resolve();
            },
          };
        },
      };
    }
    export const db = {
      select: (selection) => query(selection),
      selectDistinct: (selection) => query(selection),
      insert,
      delete: remove,
      update,
      execute: async () => undefined,
      transaction: async (operation) => operation(db),
    };
  