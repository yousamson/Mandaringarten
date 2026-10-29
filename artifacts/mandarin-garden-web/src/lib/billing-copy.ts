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
    checkoutCancelled: "Checkout was cancelled. No payment was made.",
    priceUnavailable: "Monthly pricing is unavailable right now.",
  },
  "zh-Hant": {
    checkoutSuccess: "高級會員已開通。",
    checkoutPending: "已收到付款，會員權益正在更新，請稍後再查看。",
    checkoutCancelled: "已取消結帳，沒有扣款。",
    priceUnavailable: "目前無法載入月費，請稍後重試。",
  },
  "zh-Hans": {
    checkoutSuccess: "高级会员已开通。",
    checkoutPending: "已收到付款，会员权益正在更新，请稍后再查看。",
    checkoutCancelled: "已取消结账，没有扣款。",
    priceUnavailable: "目前无法加载月费，请稍后重试。",
  },
};
