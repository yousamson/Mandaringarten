export class StripeRequestError extends Error {
  constructor(message: string, readonly status: number, readonly code?: string) {
    super(message);
    this.name = "StripeRequestError";
  }
}

type Customer = { id: string; deleted?: boolean; livemode?: boolean };

/** Only a definitive missing resource means no customer; outages must fail closed. */
export async function customerExistsInMode(
  read: () => Promise<Customer>,
  livemode: boolean,
): Promise<boolean> {
  try {
    const customer = await read();
    return !customer.deleted && customer.livemode === livemode;
  } catch (error) {
    if (error instanceof StripeRequestError && error.status === 404 && error.code === "resource_missing") {
      return false;
    }
    throw error;
  }
}
