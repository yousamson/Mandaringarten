import type { Language } from '../garden-data';

export type LegalSection = { h: string; p: string[] };
export type LegalDoc = { title: string; summary: string; sections: LegalSection[] };

export const privacyPolicy: Record<Language, LegalDoc> = {
  en: {
    title: 'Privacy Policy',
    summary: 'What Mandarin Garden collects from parent accounts, why, who helps us process it, and how you can reach us about it.',
    sections: [
      { h: '1. About this policy', p: [
        'This Privacy Policy explains how Mandarin Garden (漢語樂園, “we”, “us”) collects, uses and shares information when parents and guardians use our website. It is adapted from the Automattic Privacy Policy, which Automattic publishes under the Creative Commons Attribution-ShareAlike 4.0 licence. This adapted version is shared under the same licence.',
        'This document is a draft. It has not been reviewed by a lawyer, and it does not claim certification under, or compliance with, any particular law or framework.',
      ] },
      { h: '2. Accounts are for adults', p: [
        'Accounts may only be created by adults who are parents, legal guardians or other responsible adults. Children use the learning activities on an adult’s account and under adult supervision. We do not ask children to create accounts or to type in personal information.',
        'If you believe a child has created an account, please contact us using the details below so we can deal with it.',
      ] },
      { h: '3. Information we collect', p: [
        'Account information: sign-in is provided by Clerk. We receive your email address and a unique account identifier. If you choose to sign in with a social provider such as Google, that provider may share your name and profile picture with Clerk.',
        'Learning information: the learning stage you select (1 to 4), the experience points (XP) earned in each stage, and records of completed game rounds (game mode, round identifier and the number of correct answers).',
        'Consent records: the policy version you accepted, the time you accepted it, and the acknowledgements you confirm before starting a checkout.',
        'Subscription information: the Stripe customer and subscription identifiers linked to your account, subscription status and renewal or cancellation dates. Card details are entered directly with Stripe. We never receive or store full card numbers or security codes.',
        'Technical information: strictly necessary cookies and session tokens used for sign-in and security; preferences saved in your browser (interface language, garden colours, age setting); and server, device and browser logs such as IP address, browser type, pages requested and timestamps.',
        'What we do not collect: we do not record voice or audio, we do not accept file uploads, we do not show advertising or use advertising trackers, and we do not sell personal information.',
      ] },
      { h: '4. How we use information', p: [
        'To create and secure your account; to save learning progress so it follows you across devices; to provide the paid Learning playground to active members; to process subscriptions and show billing status; to keep records of the agreements you accepted; to prevent abuse, fix problems and keep the service running; and to meet legal, tax and accounting obligations.',
      ] },
      { h: '5. Who we share information with', p: [
        'We share information only with service providers that help us run Mandarin Garden: Clerk (authentication and account management), Replit (application hosting and the PostgreSQL database that stores progress, consent and subscription mapping), and Stripe (payments, subscriptions and the billing portal). Fonts are loaded from Google Fonts, which may receive your IP address and browser information.',
        'The listen buttons use your device’s built-in speech synthesis. Depending on your browser and operating system, the text being spoken may be processed by your device or browser vendor under their own terms.',
        'We may also disclose information when required by law, to protect the rights, property or safety of users or others, or as part of a merger, acquisition or sale of the service, in which case this policy will continue to apply to the transferred information.',
      ] },
      { h: '6. International processing', p: [
        'Our service providers may store and process information in the United States and other countries. Those countries may have data protection laws that differ from the laws where you live.',
      ] },
      { h: '7. Cookies and browser storage', p: [
        'We use only cookies that are necessary for sign-in and security. We store preferences in your browser’s local storage, and we briefly use session storage to remember that you completed the consent step during the current sign-in or registration attempt. We do not use advertising cookies or third-party analytics.',
      ] },
      { h: '8. How long we keep information', p: [
        'We keep account, learning and consent information while your account is active and for as long as needed to provide the service. After that we keep information only as long as reasonably needed for legal, tax, accounting, dispute-resolution and security purposes. We do not promise automatic deletion on any fixed schedule. Stripe and Clerk keep their own records under their own policies.',
      ] },
      { h: '9. Security', p: [
        'We use reasonable measures such as encrypted connections and access controls offered by our providers. No method of transmitting or storing information is completely secure, and we cannot guarantee absolute security.',
      ] },
      { h: '10. Your choices and rights', p: [
        'Depending on where you live, you may have rights to access, correct, delete or receive a copy of your personal information, and to object to or restrict certain processing. To make a request, contact us using the details below. We may need to verify your identity before acting. If you have an active subscription, you may need to cancel it through the billing portal before your account can be deleted.',
        'You may also have the right to complain to your local data protection authority.',
      ] },
      { h: '11. Changes to this policy', p: [
        'When we make material changes we will update the version date shown on this page and ask you to review and accept the new version before continuing to use account features.',
      ] },
    ],
  },
  'zh-Hant': {
    title: '私隱政策',
    summary: '說明漢語樂園向家長帳戶收集哪些資料、用途、協助處理的服務商，以及聯絡方式。',
    sections: [
      { h: '1. 關於本政策', p: [
        '本私隱政策說明漢語樂園（Mandarin Garden，「我們」）在家長或監護人使用本網站時，如何收集、使用與分享資料。本文改編自 Automattic 私隱政策，原文由 Automattic 以「創用 CC 姓名標示－相同方式分享 4.0」授權發布；本改編版本亦以相同授權分享。',
        '本文件為草稿，尚未經律師審閱，亦不聲稱已取得任何法律或標準的認證或合規證明。',
      ] },
      { h: '2. 帳戶僅限成人建立', p: [
        '只有家長、法定監護人或其他負責任的成人可以建立帳戶。兒童須在成人帳戶下、並於成人陪同監督下使用學習活動。我們不會要求兒童建立帳戶或輸入個人資料。',
        '如您認為有兒童自行建立了帳戶，請透過下方聯絡方式通知我們處理。',
      ] },
      { h: '3. 我們收集的資料', p: [
        '帳戶資料：登入服務由 Clerk 提供。我們會收到您的電子郵件地址及唯一帳戶識別碼。若您選擇以 Google 等社群帳號登入，該服務商可能會向 Clerk 提供您的姓名與頭像。',
        '學習資料：您選擇的學習階段（1 至 4）、各階段累積的經驗值（XP），以及已完成遊戲回合的紀錄（遊戲模式、回合識別碼與答對題數）。',
        '同意紀錄：您接受的政策版本、接受時間，以及您在開始結帳前確認的聲明。',
        '訂閱資料：與您帳戶連結的 Stripe 客戶及訂閱識別碼、訂閱狀態、續訂或取消日期。卡片資料直接在 Stripe 輸入，我們從不接收或儲存完整卡號或安全碼。',
        '技術資料：登入與安全所必需的 Cookie 及工作階段權杖；儲存在您瀏覽器中的偏好設定（介面語言、樂園色彩、年齡設定）；以及伺服器、裝置與瀏覽器日誌，例如 IP 位址、瀏覽器類型、請求的頁面與時間。',
        '我們不收集的資料：我們不錄製語音或音訊，不接受檔案上傳，不顯示廣告或使用廣告追蹤工具，也不出售個人資料。',
      ] },
      { h: '4. 資料用途', p: [
        '建立並保護您的帳戶；儲存學習進度，讓進度可在不同裝置間同步；向有效會員提供付費的學習樂園；處理訂閱並顯示帳單狀態；保存您已接受之協議的紀錄；防止濫用、修正問題並維持服務運作；以及履行法律、稅務及會計義務。',
      ] },
      { h: '5. 資料分享對象', p: [
        '我們只會與協助營運漢語樂園的服務商分享資料：Clerk（身分驗證與帳戶管理）、Replit（應用程式託管，以及儲存進度、同意紀錄和訂閱對應的 PostgreSQL 資料庫），以及 Stripe（付款、訂閱與帳單管理入口）。字型由 Google Fonts 載入，Google 可能會收到您的 IP 位址與瀏覽器資訊。',
        '「聽一聽」按鈕使用您裝置內建的語音合成功能。視瀏覽器與作業系統而定，朗讀的文字可能由裝置或瀏覽器供應商依其條款處理。',
        '在法律要求、為保護使用者或他人的權利、財產或安全，或在服務合併、收購或出售時，我們也可能揭露資料；屆時本政策將繼續適用於被移轉的資料。',
      ] },
      { h: '6. 跨境處理', p: [
        '我們的服務商可能在美國及其他國家儲存和處理資料，這些國家的資料保護法律可能與您所在地不同。',
      ] },
      { h: '7. Cookie 與瀏覽器儲存', p: [
        '我們只使用登入與安全所必需的 Cookie。偏好設定儲存在瀏覽器的本機儲存空間；在目前的登入或註冊過程中，我們會暫時使用工作階段儲存空間記住您已完成同意步驟。我們不使用廣告 Cookie 或第三方分析工具。',
      ] },
      { h: '8. 資料保存期間', p: [
        '在您的帳戶有效期間，以及提供服務所需的期間內，我們會保存帳戶、學習與同意資料。之後，僅在法律、稅務、會計、爭議處理及安全目的合理需要的範圍內保存。我們不承諾在任何固定期限自動刪除資料。Stripe 與 Clerk 依其各自政策保存紀錄。',
      ] },
      { h: '9. 資料安全', p: [
        '我們採取合理措施，例如服務商提供的加密連線與存取控制。然而，任何傳輸或儲存方式都不是絕對安全的，我們無法保證絕對安全。',
      ] },
      { h: '10. 您的選擇與權利', p: [
        '視您所在地區而定，您可能有權查閱、更正、刪除或取得個人資料副本，並反對或限制部分處理。如需提出請求，請透過下方聯絡方式與我們聯繫；我們可能需要先核實您的身分。若您仍有有效訂閱，可能需要先在帳單管理入口取消訂閱，才能刪除帳戶。',
        '您也可能有權向當地的資料保護主管機關投訴。',
      ] },
      { h: '11. 政策變更', p: [
        '如有重大變更，我們會更新本頁顯示的版本日期，並請您在繼續使用帳戶功能前閱讀並接受新版本。',
      ] },
    ],
  },
  'zh-Hans': {
    title: '隐私政策',
    summary: '说明汉语乐园向家长账户收集哪些信息、用途、协助处理的服务商，以及联系方式。',
    sections: [
      { h: '1. 关于本政策', p: [
        '本隐私政策说明汉语乐园（Mandarin Garden，“我们”）在家长或监护人使用本网站时，如何收集、使用与分享信息。本文改编自 Automattic 隐私政策，原文由 Automattic 以“知识共享 署名－相同方式共享 4.0”许可发布；本改编版本亦以相同许可分享。',
        '本文件为草稿，尚未经律师审阅，也不声称已获得任何法律或标准的认证或合规证明。',
      ] },
      { h: '2. 账户仅限成年人创建', p: [
        '只有家长、法定监护人或其他负责任的成年人可以创建账户。儿童须在成年人账户下、并在成年人陪同监督下使用学习活动。我们不会要求儿童创建账户或输入个人信息。',
        '如您认为有儿童自行创建了账户，请通过下方联系方式通知我们处理。',
      ] },
      { h: '3. 我们收集的信息', p: [
        '账户信息：登录服务由 Clerk 提供。我们会收到您的电子邮件地址及唯一账户标识。若您选择以 Google 等社交账号登录，该服务商可能会向 Clerk 提供您的姓名与头像。',
        '学习信息：您选择的学习阶段（1 至 4）、各阶段累积的经验值（XP），以及已完成游戏回合的记录（游戏模式、回合标识与答对题数）。',
        '同意记录：您接受的政策版本、接受时间，以及您在开始结账前确认的声明。',
        '订阅信息：与您账户关联的 Stripe 客户及订阅标识、订阅状态、续订或取消日期。银行卡信息直接在 Stripe 输入，我们从不接收或存储完整卡号或安全码。',
        '技术信息：登录与安全所必需的 Cookie 及会话令牌；保存在您浏览器中的偏好设置（界面语言、乐园色彩、年龄设置）；以及服务器、设备与浏览器日志，例如 IP 地址、浏览器类型、请求的页面与时间。',
        '我们不收集的信息：我们不录制语音或音频，不接受文件上传，不显示广告或使用广告追踪工具，也不出售个人信息。',
      ] },
      { h: '4. 信息用途', p: [
        '创建并保护您的账户；保存学习进度，让进度可在不同设备间同步；向有效会员提供付费的学习乐园；处理订阅并显示账单状态；保存您已接受之协议的记录；防止滥用、修复问题并维持服务运行；以及履行法律、税务及会计义务。',
      ] },
      { h: '5. 信息分享对象', p: [
        '我们只会与协助运营汉语乐园的服务商分享信息：Clerk（身份验证与账户管理）、Replit（应用托管，以及存储进度、同意记录和订阅对应关系的 PostgreSQL 数据库），以及 Stripe（付款、订阅与账单管理入口）。字体由 Google Fonts 加载，Google 可能会收到您的 IP 地址与浏览器信息。',
        '“听一听”按钮使用您设备内置的语音合成功能。视浏览器与操作系统而定，朗读的文字可能由设备或浏览器供应商依其条款处理。',
        '在法律要求、为保护用户或他人的权利、财产或安全，或在服务合并、收购或出售时，我们也可能披露信息；届时本政策将继续适用于被转移的信息。',
      ] },
      { h: '6. 跨境处理', p: [
        '我们的服务商可能在美国及其他国家存储和处理信息，这些国家的数据保护法律可能与您所在地不同。',
      ] },
      { h: '7. Cookie 与浏览器存储', p: [
        '我们只使用登录与安全所必需的 Cookie。偏好设置保存在浏览器的本地存储中；在当前的登录或注册过程中，我们会暂时使用会话存储记住您已完成同意步骤。我们不使用广告 Cookie 或第三方分析工具。',
      ] },
      { h: '8. 信息保存期限', p: [
        '在您的账户有效期间，以及提供服务所需的期间内，我们会保存账户、学习与同意信息。之后，仅在法律、税务、会计、争议处理及安全目的合理需要的范围内保存。我们不承诺在任何固定期限自动删除信息。Stripe 与 Clerk 依其各自政策保存记录。',
      ] },
      { h: '9. 信息安全', p: [
        '我们采取合理措施，例如服务商提供的加密连接与访问控制。然而，任何传输或存储方式都不是绝对安全的，我们无法保证绝对安全。',
      ] },
      { h: '10. 您的选择与权利', p: [
        '视您所在地区而定，您可能有权查阅、更正、删除或获取个人信息副本，并反对或限制部分处理。如需提出请求，请通过下方联系方式与我们联系；我们可能需要先核实您的身份。若您仍有有效订阅，可能需要先在账单管理入口取消订阅，才能删除账户。',
        '您也可能有权向当地的数据保护主管机关投诉。',
      ] },
      { h: '11. 政策变更', p: [
        '如有重大变更，我们会更新本页显示的版本日期，并请您在继续使用账户功能前阅读并接受新版本。',
      ] },
    ],
  },
};
