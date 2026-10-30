import type { Language } from "./garden-data";

export const billingCopy: Record<
  Language,
  {
    checkoutSuccess: string;
    checkoutPending: string;
    checkoutCancelled: string;
    priceUnavailable: string;
  }
> = {
  en: {
    checkoutSuccess: "Premium membership is active.",
    checkoutPending: "Payment received. Membership is still updating; check again shortly.",
    checkoutCancelled: "Checkout did not complete, so membership was not activated. You can safely try again.",
    priceUnavailable: "Monthly pricing is unavailable right now.",
  },
  "zh-Hant": {
    checkoutSuccess: "高級會員已開通。",
    checkoutPending: "已收到付款，會員權益正在更新，請稍後再查看。",
    checkoutCancelled: "結帳未完成，因此尚未開通會員。您可以放心再試一次。",
    priceUnavailable: "目前無法載入月費，請稍後重試。",
  },
  "zh-Hans": {
    checkoutSuccess: "高级会员已开通。",
    checkoutPending: "已收到付款，会员权益正在更新，请稍后再查看。",
    checkoutCancelled: "结账未完成，因此尚未开通会员。您可以放心再试一次。",
    priceUnavailable: "目前无法加载月费，请稍后重试。",
  },
};
