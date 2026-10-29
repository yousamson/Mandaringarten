import type { Language } from '../garden-data';
import type { LegalDoc } from './privacy';

export const disclaimerTerms: Record<Language, LegalDoc> = {
  en: {
    title: 'Disclaimer & Terms of Use',
    summary: 'The rules for using Mandarin Garden, what it can and cannot promise, and how membership billing, renewal and refunds work.',
    sections: [
      { h: '1. About these terms', p: [
        'These terms and this disclaimer govern your use of Mandarin Garden (漢語樂園). They are adapted from the Automattic Terms of Service, which Automattic publishes under the Creative Commons Attribution-ShareAlike 4.0 licence, and this adapted text is shared under the same licence.',
        'By creating an account you confirm you have read and agree to these terms and to our Privacy Policy.',
      ] },
      { h: '2. Who may use Mandarin Garden', p: [
        'Accounts are for adults only: parents, legal guardians or other responsible adults who are at least 18 years old or the age of majority where they live. Children may use the activities only through an adult’s account and under that adult’s supervision.',
      ] },
      { h: '3. Educational content, no guaranteed outcomes', p: [
        'Mandarin Garden provides general language-practice material: vocabulary, pinyin, short stories and games. It is not a substitute for a teacher, school or formal assessment, and it is not professional educational, developmental, medical, psychological or legal advice.',
        'We do not guarantee any particular learning outcome, such as fluency, exam results or school placement. Stage names and age ranges are suggestions only. We work to keep translations, pinyin and characters accurate, but mistakes may occur, and synthesised speech depends on the voices available on your device.',
      ] },
      { h: '4. Parent supervision', p: [
        'You decide whether Mandarin Garden suits your child, choose the learning stage, manage screen time and supervise use. Please stay nearby while children use the app, and stop if an activity is not appropriate for them.',
      ] },
      { h: '5. Your account', p: [
        'Keep your sign-in details secure and give accurate information. You are responsible for activity on your account. Tell us promptly if you think your account has been used without permission.',
      ] },
      { h: '6. Family membership, automatic renewal and cancellation', p: [
        'Family membership costs US$9.99 per month plus any taxes that apply. Payments are processed by Stripe. The subscription renews automatically each month, and the card on file is charged at each renewal until you cancel.',
        'You can cancel at any time from the billing portal under For parents. Cancelling stops future renewals. It takes effect at the end of the current paid period, and you keep access until then. If the price changes, we will tell you in advance and the new price will apply only from your next renewal.',
      ] },
      { h: '7. Refunds', p: [
        'Subscription fees are non-refundable, including for partial months and unused time, except (a) where a refund is required by mandatory law that applies to you, or (b) where you were charged in error, such as a duplicate or unauthorised charge. To report an erroneous charge, contact us using the details below.',
        'Nothing in these terms excludes, limits or waives any consumer rights that cannot legally be excluded, limited or waived under the law that applies to you.',
      ] },
      { h: '8. Intellectual property', p: [
        'The stories, vocabulary selections, games, illustrations, design and software of Mandarin Garden belong to us or our licensors. You may use them for personal, non-commercial learning in your family. Please do not copy, sell, redistribute or create commercial products from them without permission. This legal text itself is available under CC BY-SA 4.0.',
      ] },
      { h: '9. Acceptable use', p: [
        'Do not misuse the service: no attempts to break security, scrape content at scale, interfere with other families, avoid payment or use the service unlawfully.',
      ] },
      { h: '10. Service availability', p: [
        'Mandarin Garden is provided “as is” and “as available”. We may change, pause or retire features, and the service may sometimes be unavailable for maintenance, outages at our providers (Clerk, Replit or Stripe) or reasons outside our control. We do not promise uninterrupted or error-free service.',
      ] },
      { h: '11. Limitation of liability', p: [
        'To the extent permitted by law, we are not liable for indirect, incidental or consequential losses. Where liability cannot be excluded, it is limited to the amount you paid us in the twelve months before the claim, unless the law that applies to you requires otherwise.',
      ] },
      { h: '12. Ending use', p: [
        'You may stop using Mandarin Garden at any time. We may suspend or close accounts that seriously or repeatedly break these terms, and where reasonable we will tell you first.',
      ] },
      { h: '13. Changes', p: [
        'We may update these terms. When we make material changes we will update the version date and ask you to accept the new version before you continue using account features.',
      ] },
      { h: "Membership, expiry and account deletion", p: [
        "Signed-in use requires a parent account and an active paid membership; registering alone does not activate membership. If you cancel, access continues until the end of the period you have already paid for. When a membership expires, member features are blocked, but renewing, contacting the team and deleting the account remain available.",
        "Deleting your account is permanent and irreversible. It cancels any ongoing subscription immediately and ends access at once, with no refund for unused time except where mandatory law requires a refund or you were charged in error. A limited amount of information may remain where needed to operate or protect the service, and providers may retain information under their own policies.",
      ] },
    ],
  },
  'zh-Hant': {
    title: '免責聲明與使用條款',
    summary: '使用漢語樂園的規則、我們能與不能承諾的事項，以及會員收費、續訂與退款方式。',
    sections: [
      { h: '1. 關於本條款', p: [
        '本條款與免責聲明規範您對漢語樂園（Mandarin Garden）的使用。本文改編自 Automattic 服務條款，原文由 Automattic 以「創用 CC 姓名標示－相同方式分享 4.0」授權發布，本改編內容亦以相同授權分享。',
        '建立帳戶即表示您確認已閱讀並同意本條款及我們的私隱政策。',
      ] },
      { h: '2. 使用資格', p: [
        '帳戶僅限成人使用：家長、法定監護人或其他負責任的成人，且年滿 18 歲或達到所在地的成年年齡。兒童只能透過成人帳戶、並在該成人監督下使用各項活動。',
      ] },
      { h: '3. 教育內容，不保證成果', p: [
        '漢語樂園提供一般語言練習素材，包括詞彙、拼音、短篇故事和遊戲。本服務不能取代老師、學校或正式評估，亦不構成專業的教育、發展、醫療、心理或法律建議。',
        '我們不保證任何特定學習成果，例如流利程度、考試成績或入學安排。階段名稱與年齡範圍僅供參考。我們盡力確保翻譯、拼音與漢字正確，但仍可能有錯誤；語音合成效果取決於您裝置提供的語音。',
      ] },
      { h: '4. 家長監督', p: [
        '由您決定漢語樂園是否適合孩子、選擇學習階段、管理使用時間並在旁監督。孩子使用時請留在身邊，如活動不適合孩子，請停止使用。',
      ] },
      { h: '5. 您的帳戶', p: [
        '請妥善保管登入資料並提供正確資訊。您須對帳戶內的活動負責。如懷疑帳戶遭未經授權使用，請立即通知我們。',
      ] },
      { h: '6. 家庭會員、自動續訂與取消', p: [
        '家庭會員費用為每月 9.99 美元，另加適用稅費。付款由 Stripe 處理。訂閱每月自動續訂，在您取消前，每次續訂都會向登記的卡片收費。',
        '您可隨時在「家長專區」的帳單管理入口取消。取消後將停止日後續訂，並於當期已付費期間結束時生效，在此之前仍可繼續使用。如價格調整，我們會事先通知，新價格只會從下次續訂起適用。',
      ] },
      { h: '7. 退款', p: [
        '訂閱費用一經支付恕不退還，包括未滿一個月或未使用的期間；但以下情況除外：（a）適用於您的強制性法律規定須退款；或（b）錯誤收費，例如重複或未經授權的扣款。如需回報錯誤收費，請透過下方聯絡方式與我們聯繫。',
        '本條款不排除、限制或放棄任何依適用法律不得排除、限制或放棄的消費者權利。',
      ] },
      { h: '8. 智慧財產權', p: [
        '漢語樂園的故事、詞彙選編、遊戲、插圖、設計與軟體屬於我們或授權人所有。您可在家庭內作個人、非商業的學習用途。未經許可，請勿複製、出售、轉發或用於製作商業產品。本法律文字本身以 CC BY-SA 4.0 授權提供。',
      ] },
      { h: '9. 合理使用', p: [
        '請勿濫用服務：不得嘗試破壞安全機制、大量擷取內容、干擾其他家庭、逃避付款或以違法方式使用本服務。',
      ] },
      { h: '10. 服務可用性', p: [
        '漢語樂園按「現狀」及「現有」基礎提供。我們可能變更、暫停或停止部分功能；服務也可能因維護、服務商（Clerk、Replit 或 Stripe）中斷或我們無法控制的原因而暫時無法使用。我們不保證服務不中斷或沒有錯誤。',
      ] },
      { h: '11. 責任限制', p: [
        '在法律允許的範圍內，我們不對間接、附帶或衍生損失負責。如責任無法排除，則以您在索償前十二個月內支付給我們的金額為上限，除非適用於您的法律另有規定。',
      ] },
      { h: '12. 終止使用', p: [
        '您可隨時停止使用漢語樂園。對於嚴重或多次違反本條款的帳戶，我們可暫停或關閉；在合理情況下，我們會事先通知您。',
      ] },
      { h: '13. 條款變更', p: [
        '我們可能更新本條款。如有重大變更，我們會更新版本日期，並請您在繼續使用帳戶功能前接受新版本。',
      ] },
      { h: "會員、到期與刪除帳戶", p: [
        "登入後使用須具備家長帳戶及有效的付費會員；僅註冊不會開通會員。取消後，使用權持續至已付費期間結束。會員到期後，會員功能將無法使用，但續訂、聯絡團隊及刪除帳戶仍可使用。",
        "刪除帳戶為永久且不可逆的操作，會立即取消進行中的訂閱並即刻終止使用權，未使用期間不予退款；但強制性法律規定須退款或錯誤收費者除外。為維持或保障服務，部分資料仍可能保留；服務商亦可能按其政策保存資料。",
      ] },
    ],
  },
  'zh-Hans': {
    title: '免责声明与使用条款',
    summary: '使用汉语乐园的规则、我们能与不能承诺的事项，以及会员收费、续订与退款方式。',
    sections: [
      { h: '1. 关于本条款', p: [
        '本条款与免责声明规范您对汉语乐园（Mandarin Garden）的使用。本文改编自 Automattic 服务条款，原文由 Automattic 以“知识共享 署名－相同方式共享 4.0”许可发布，本改编内容亦以相同许可分享。',
        '创建账户即表示您确认已阅读并同意本条款及我们的隐私政策。',
      ] },
      { h: '2. 使用资格', p: [
        '账户仅限成年人使用：家长、法定监护人或其他负责任的成年人，且年满 18 岁或达到所在地的成年年龄。儿童只能通过成年人账户、并在该成年人监督下使用各项活动。',
      ] },
      { h: '3. 教育内容，不保证成果', p: [
        '汉语乐园提供一般语言练习素材，包括词汇、拼音、短篇故事和游戏。本服务不能取代老师、学校或正式评估，也不构成专业的教育、发展、医疗、心理或法律建议。',
        '我们不保证任何特定学习成果，例如流利程度、考试成绩或入学安排。阶段名称与年龄范围仅供参考。我们尽力确保翻译、拼音与汉字正确，但仍可能有错误；语音合成效果取决于您设备提供的语音。',
      ] },
      { h: '4. 家长监督', p: [
        '由您决定汉语乐园是否适合孩子、选择学习阶段、管理使用时间并在旁监督。孩子使用时请留在身边，如活动不适合孩子，请停止使用。',
      ] },
      { h: '5. 您的账户', p: [
        '请妥善保管登录信息并提供准确信息。您须对账户内的活动负责。如怀疑账户遭未经授权使用，请立即通知我们。',
      ] },
      { h: '6. 家庭会员、自动续订与取消', p: [
        '家庭会员费用为每月 9.99 美元，另加适用税费。付款由 Stripe 处理。订阅每月自动续订，在您取消前，每次续订都会向登记的银行卡收费。',
        '您可随时在“家长专区”的账单管理入口取消。取消后将停止日后续订，并于当期已付费期间结束时生效，在此之前仍可继续使用。如价格调整，我们会事先通知，新价格只会从下次续订起适用。',
      ] },
      { h: '7. 退款', p: [
        '订阅费用一经支付恕不退还，包括未满一个月或未使用的期间。',
      ] },
      { h: '8. 知识产权', p: [
        '汉语乐园的故事、词汇选编、游戏、插图、设计与软件属于我们或许可人所有。您可在家庭内作个人、非商业的学习用途。未经许可，请勿复制、出售、转发或用于制作商业产品。本法律文字本身以 CC BY-SA 4.0 许可提供。',
      ] },
      { h: '9. 合理使用', p: [
        '请勿滥用服务：不得尝试破坏安全机制、大量抓取内容、干扰其他家庭、逃避付款或以违法方式使用本服务。',
      ] },
      { h: '10. 服务可用性', p: [
        '汉语乐园按“现状”及“现有”基础提供。我们可能变更、暂停或停止部分功能；服务也可能因维护、服务商（Clerk、Replit 或 Stripe）中断或我们无法控制的原因而暂时无法使用。我们不保证服务不中断或没有错误。',
      ] },
      { h: '11. 责任限制', p: [
        '在法律允许的范围内，我们不对间接、附带或衍生损失负责。',
      ] },
      { h: '12. 终止使用', p: [
        '您可随时停止使用汉语乐园。对于严重或多次违反本条款的账户，我们可暂停或关闭；在合理情况下，我们会事先通知您。',
      ] },
      { h: '13. 条款变更', p: [
        '我们可能更新本条款。如有重大变更，我们会更新版本日期，并请您在继续使用账户功能前接受新版本。',
      ] },
      { h: "会员、到期与删除账户", p: [
        "登录后使用须具备家长账户及有效的付费会员；仅注册不会开通会员。取消后，使用权持续至已付费期间结束。会员到期后，会员功能将无法使用，但续订、联系团队及删除账户仍可使用。",
        "删除账户为永久且不可逆的操作，会立即取消进行中的订阅并即刻终止使用权，未使用期间不予退款；但强制性法律规定须退款或错误收费者除外。为维持或保护服务，部分信息仍可能保留；服务商也可能依其政策保存信息。",
      ] },
    ],
  },
};
