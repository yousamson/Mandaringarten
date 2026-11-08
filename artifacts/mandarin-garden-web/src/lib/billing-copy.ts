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
  es: {
    checkoutSuccess: "La membresía premium está activa.",
    checkoutPending: "Hemos recibido el pago. La membresía todavía se está actualizando; vuelve a comprobarlo en breve.",
    checkoutCancelled: "El pago no se completó, por lo que la membresía no se activó. Puedes intentarlo de nuevo.",
    priceUnavailable: "El precio mensual no está disponible en este momento.",
  },
  fr: {
    checkoutSuccess: "L’abonnement premium est actif.",
    checkoutPending: "Paiement reçu. L’abonnement est en cours de mise à jour ; vérifiez à nouveau dans un instant.",
    checkoutCancelled: "Le paiement n’a pas abouti et l’abonnement n’a pas été activé. Vous pouvez réessayer.",
    priceUnavailable: "Le tarif mensuel est momentanément indisponible.",
  },
  ja: {
    checkoutSuccess: "プレミアムメンバーシップが有効です。",
    checkoutPending: "お支払いを受け付けました。メンバーシップを更新中です。少ししてから再確認してください。",
    checkoutCancelled: "お支払いが完了していないため、メンバーシップは有効になっていません。もう一度お試しください。",
    priceUnavailable: "現在、月額料金を確認できません。",
  },
  ko: {
    checkoutSuccess: "프리미엄 멤버십이 활성화되었습니다.",
    checkoutPending: "결제를 받았습니다. 멤버십을 업데이트 중이니 잠시 후 다시 확인해 주세요.",
    checkoutCancelled: "결제가 완료되지 않아 멤버십이 활성화되지 않았습니다. 다시 시도해도 됩니다.",
    priceUnavailable: "현재 월 구독료를 확인할 수 없습니다.",
  },
  pt: {
    checkoutSuccess: "A assinatura premium está ativa.",
    checkoutPending: "Pagamento recebido. A assinatura ainda está a ser atualizada; volte a verificar em breve.",
    checkoutCancelled: "O pagamento não foi concluído, por isso a assinatura não foi ativada. Pode tentar novamente.",
    priceUnavailable: "O preço mensal não está disponível neste momento.",
  },
};
