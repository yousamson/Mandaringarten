import type { Language } from '../garden-data';

export type LegalSection = { h: string; p: string[] };
export type LegalDoc = { title: string; summary: string; sections: LegalSection[] };

const basePrivacyPolicy: Record<'en' | 'zh-Hant' | 'zh-Hans', LegalDoc> = {
  en: {
    title: 'Privacy Policy',
    summary: 'A short guide to the information Mandarin Garden uses to provide accounts, learning progress, payments and support.',
    sections: [
      { h: '1. About this policy', p: [
        'This policy explains how Mandarin Garden (漢語樂園, “we” or “us”) handles information when a parent or guardian uses the website. It is adapted from the Automattic Privacy Policy, published under the Creative Commons Attribution-ShareAlike 4.0 licence; this adaptation is shared under the same licence.',
        'Accounts are for adults. Children may use learning activities only on an adult’s account and under adult supervision.',
      ] },
      { h: '2. Information we use', p: [
        'Account: your email address and account identifier from Clerk. If you sign in with Google or another provider, it may also give Clerk your name or profile image.',
        'Learning and preferences: your chosen stage, XP, completed game-round details, and browser settings such as language, theme and age preference.',
        'Messages: the subject and content of messages between you and the Mandarin Garden team, their authorship and timestamps.',
        'Membership: Stripe customer and subscription identifiers, status, renewal and cancellation details, and records of policy and checkout acknowledgements. Stripe handles card details; we do not receive or store full card numbers or security codes.',
        'Technical: necessary sign-in and security cookies, session tokens, and service logs that may include IP address, browser or device information, pages requested and timestamps.',
      ] },
      { h: '3. How information is used and shared', p: [
        'We use information to provide and secure the service, save progress across devices, manage membership and payments, answer messages, prevent abuse, maintain the website, and meet legal, tax and accounting requirements.',
        'We do not sell personal information or use it for advertising. Information is handled by service providers that help us operate the site: Clerk (sign-in), Replit (hosting and database) and Stripe (payments and subscriptions). Google Fonts may receive your IP address and browser information when a page loads.',
        'If enabled for the published site, Replit-hosted analytics processes IP traffic data and usage information such as pages viewed to provide site-visit reports. We do not use analytics for advertising.',
        'Word lookup sends the text and selected Chinese version to MyMemory (Translated). Its terms state that submitted segments may be stored long term and shared with partners to improve services. Do not submit personal or sensitive information.',
        'The read-aloud feature uses your device’s speech service. Depending on your device or browser, text you choose to hear may be processed by its provider. We may also disclose information where required by law or reasonably needed to protect users, the service or others, or in a transfer of the service.',
      ] },
      { h: '4. Storage and security', p: [
        'Necessary sign-in and security cookies support your session. Language, theme and age preferences are stored in your browser; a temporary session entry remembers consent during sign-in or registration. We do not use advertising cookies. Replit-hosted analytics may process visit and usage data when enabled, as described above.',
        'Our providers may process information in the United States or other countries. We use reasonable safeguards provided by our service providers, but no website or storage method can be guaranteed completely secure.',
        'We keep information for as long as needed to provide, maintain and protect the service. Retention periods vary by information type and provider.',
      ] },
      { h: '5. Membership and messages', p: [
        'Free material is available without an account. Membership features require a parent account and a successful subscription payment. If membership expires, member features stop until renewal; account, renewal, support and policy pages remain available.',
        'Your conversation is available to you and authorised Mandarin Garden team members; other families cannot view it. Replies appear under the team name, not the administrator’s sign-in email. Please do not include a child’s personal details in a message.',
      ] },
      { h: '6. Your choices and account deletion', p: [
        'Depending on applicable law, you may request access to, correction of or deletion of your personal information. Send a request through Messages; we may verify your identity before acting.',
        'You can request permanent account deletion from the Account page, whether or not your membership is active. Deletion removes your sign-in account, learning progress, stage choice, consent records and conversations from our app, and cancels your subscription. It cannot be undone; access ends immediately. Payments are non-refundable except where required by mandatory law or for an erroneous charge.',
        'Deleting an account removes account information from our service. A limited amount of information may remain where needed to operate or protect the service, and providers may retain information under their own policies.',
      ] },
      { h: '7. Changes', p: [
        'We may update this policy. Material changes will be shown on this page with a new version, and you will be asked to accept it before using account features.',
      ] },
    ],
  },
  'zh-Hant': {
    title: '個人私隱資料政策',
    summary: '簡要說明漢語樂園為提供帳戶、學習進度、付款及支援而使用的資料。',
    sections: [
      { h: '1. 關於本政策', p: [
        '本政策說明家長或監護人使用漢語樂園（Mandarin Garden，「我們」）網站時，我們如何處理資料。本文改編自 Automattic 私隱政策，原文以「創用 CC 姓名標示－相同方式分享 4.0」授權；本改編亦以相同授權分享。',
        '帳戶只供成人建立。兒童只可在成人帳戶下並由成人監督使用學習活動。',
      ] },
      { h: '2. 我們使用的資料', p: [
        '帳戶：由 Clerk 提供登入服務；我們會收到您的電郵地址和帳戶識別碼。若以 Google 等登入，該服務商亦可能向 Clerk 提供您的姓名或頭像。',
        '學習與偏好：您選擇的學習階段、XP、已完成遊戲回合資料，以及您儲存在瀏覽器的語言、主題和年齡設定。',
        '訊息：您與漢語樂園團隊對話的主旨、內容、撰寫者及時間。',
        '會員：與帳戶連結的 Stripe 客戶及訂閱識別碼、訂閱狀態、續訂與取消資料，以及您同意政策和付款前確認事項的紀錄。付款卡資料由 Stripe 處理；我們不會收到或儲存完整卡號或安全碼。',
        '技術：登入和安全所需的 Cookie、工作階段權杖，以及可能包含 IP 位址、瀏覽器或裝置資料、瀏覽頁面及時間的服務日誌。',
      ] },
      { h: '3. 資料用途及分享', p: [
        '我們使用資料提供及保障服務、跨裝置保存學習進度、管理會員及付款、回覆訊息、防止濫用、維持網站運作，以及履行法律、稅務和會計責任。',
        '我們不出售個人資料，也不以此作廣告用途。協助營運的服務商包括 Clerk（登入）、Replit（託管及資料庫）和 Stripe（付款及訂閱）。載入 Google Fonts 時，Google 可能收到您的 IP 位址和瀏覽器資料。',
        '如在已發佈網站啟用 Replit 託管的分析功能，Replit 會處理 IP 流量資料及瀏覽頁面等使用資料，以提供網站到訪統計；我們不會將分析資料用於廣告。',
        '查找字詞翻譯時，您輸入的文字和所選中文版本會傳送至 MyMemory（Translated）。其條款表示可能長期保存提交的片段，並與合作夥伴分享以改善服務。請勿輸入個人或敏感資料。',
        '朗讀功能使用您裝置的語音服務；視乎裝置或瀏覽器而定，您選擇朗讀的文字可能由其服務商處理。如法律要求，或為合理地保障使用者、服務或他人，或移轉服務時，我們亦可能披露資料。',
      ] },
      { h: '4. 儲存與安全', p: [
        '登入和安全 Cookie 用於維持工作階段；瀏覽器會儲存語言、主題和年齡設定，並在登入或註冊期間暫存同意狀態。我們不使用廣告 Cookie；如啟用 Replit 託管的分析功能，可能會處理到訪及使用資料，詳見上文。',
        '服務商可能在美國或其他國家處理資料。雖然我們使用服務商提供的合理安全措施，但無法保證網站或資料儲存方式絕對安全。',
        '我們會在提供、維持及保障服務所需期間保存資料；保存期限亦因資料類型及服務商而異。',
      ] },
      { h: '5. 會員與站內訊息', p: [
        '免費內容無需帳戶。會員功能須有家長帳戶並成功付款。會員到期後，會員功能會停止，續訂、帳戶、聯絡團隊及政策頁面仍可使用。',
        '您和獲授權的漢語樂園團隊成員可以查看您的對話，其他家庭無法查看。團隊回覆會顯示團隊名稱，而非管理員登入電郵。請勿在訊息中提供兒童個人資料。',
      ] },
      { h: '6. 您的選擇與刪除帳戶', p: [
        '視乎適用法律，您可能可以要求查閱、更正或刪除個人資料。請透過站內訊息提出；我們可能先核實您的身分。',
        '無論會員是否有效，您都可在「帳戶」頁面永久刪除帳戶。刪除無法復原，會移除我們應用程式內的登入帳戶、學習進度、階段選擇、同意紀錄及訊息，並取消訂閱及即時終止使用權。已付費用不予退還，但強制性法律規定或錯誤收費除外。',
        '刪除帳戶會移除本平台內的帳戶資料。為維持或保障服務，部分資料仍可能保留；服務商亦可能按其政策保存資料。',
      ] },
      { h: '7. 政策更新', p: [
        '我們可能更新本政策。重大變更會在本頁標明新版本；使用帳戶功能前，您須先接受新版本。',
      ] },
    ],
  },
  'zh-Hans': {
    title: '个人隐私资料政策',
    summary: '简要说明汉语乐园为提供账户、学习进度、付款及支持而使用的信息。',
    sections: [
      { h: '1. 关于本政策', p: [
        '本政策说明家长或监护人使用汉语乐园（Mandarin Garden）网站时，我们如何处理信息。本文改编自 Automattic 隐私政策，原文以“知识共享 署名－相同方式共享 4.0”许可发布；本改编亦以相同许可分享。',
        '账户仅供成年人创建。儿童只能在成年人账户下并由成年人监督使用学习活动。',
      ] },
      { h: '2. 我们使用的信息', p: [
        '账户：Clerk 提供登录服务；我们会收到您的电子邮件地址和账户标识。若您通过 Google 等服务登录，该服务商也可能向 Clerk 提供您的姓名或头像。',
        '学习与偏好：您选择的学习阶段、XP、已完成游戏回合资料，以及保存在浏览器中的语言、主题和年龄设置。',
        '消息：您与汉语乐园团队对话的主题、内容、撰写者和时间。',
        '会员：与账户关联的 Stripe 客户和订阅标识、订阅状态、续订与取消信息，以及您同意政策和付款前确认事项的记录。付款卡资料由 Stripe 处理；我们不会收到或保存完整卡号或安全码。',
        '技术：登录和安全所需的 Cookie、会话令牌，以及可能包含 IP 地址、浏览器或设备信息、浏览页面及时间的服务日志。',
      ] },
      { h: '3. 信息用途与分享', p: [
        '我们使用信息提供和保护服务、跨设备保存学习进度、管理会员和付款、回复消息、防止滥用、维护网站，以及履行法律、税务和会计责任。',
        '我们不出售个人信息，也不将其用于广告。协助运营的服务商包括 Clerk（登录）、Replit（托管和数据库）及 Stripe（付款和订阅）。加载 Google Fonts 时，Google 可能会收到您的 IP 地址和浏览器信息。',
        '若在已发布的网站启用 Replit 托管的分析功能，Replit 会处理 IP 流量数据及浏览页面等使用信息，以提供网站访问统计；我们不会将分析数据用于广告。',
        '查找字词翻译时，您输入的文字和所选中文版本会发送至 MyMemory（Translated）。其条款表示可能长期保存提交的片段，并与合作伙伴分享以改进服务。请勿输入个人或敏感信息。',
        '朗读功能使用您设备的语音服务；视设备或浏览器而定，您选择朗读的文字可能由其服务商处理。法律要求、合理保护用户、服务或他人，或转让服务时，我们也可能披露信息。',
      ] },
      { h: '4. 存储与安全', p: [
        '必要的登录和安全 Cookie 用于维持会话；语言、主题和年龄设置保存在浏览器中，登录或注册期间也会暂存同意状态。我们不使用广告 Cookie；如启用 Replit 托管的分析功能，可能会处理访问及使用数据，详见上文。',
        '服务商可能在美国或其他国家处理信息。我们使用服务商提供的合理安全措施，但无法保证网站或存储方式绝对安全。',
        '我们会在提供、维护和保护服务所需期间保存信息；保存期限也会因信息类型和服务商而异。',
      ] },
      { h: '5. 会员与站内消息', p: [
        '免费内容无需账户。会员功能需要家长账户和成功付款。会员到期后，会员功能会停止，但续订、账户、联系团队和政策页面仍可使用。',
        '您和获授权的汉语乐园团队成员可以查看您的对话，其他家庭无法查看。团队回复显示团队名称，而非管理员登录电子邮件。请勿在消息中提供儿童个人信息。',
      ] },
      { h: '6. 您的选择与删除账户', p: [
        '视适用法律而定，您可能可以请求查阅、更正或删除个人信息。请通过站内消息提出；我们可能先核实您的身份。',
        '无论会员是否有效，您都可以在“账户”页面永久删除账户。删除无法恢复，会从我们的应用中移除登录账户、学习进度、阶段选择、同意记录及消息，并取消订阅、立即终止访问。已付费用不予退还，但强制性法律规定或错误收费除外。',
        '删除账户会移除本平台内的账户信息。为维持或保护服务，部分信息仍可能保留；服务商也可能依其政策保存信息。',
      ] },
      { h: '7. 政策更新', p: [
        '我们可能更新本政策。重大变更会在本页标明新版本；使用账户功能前，您须先接受新版本。',
      ] },
    ],
  },
};

export const privacyPolicy: Record<Language, LegalDoc> = {
  ...basePrivacyPolicy,
  es: basePrivacyPolicy.en,
  fr: basePrivacyPolicy.en,
  ja: basePrivacyPolicy.en,
  ko: basePrivacyPolicy.en,
  pt: basePrivacyPolicy.en,
};
