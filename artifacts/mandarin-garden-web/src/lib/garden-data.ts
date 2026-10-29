export type Language = 'en' | 'zh-Hant' | 'zh-Hans';
export type LessonWord = {
  id: string;
  hanzi: string;
  simplified: string;
  pinyin: string;
  meaning: Record<Language, string>;
  sentence: string;
  sentenceSimplified: string;
  sentencePinyin: string;
  category: string;
};
export type GardenLesson = {
  id: string;
  title: Record<Language, string>;
  subtitle: Record<Language, string>;
  category: string;
  icon: string;
  premium: boolean;
  words: LessonWord[];
};

const w = (id: string, hanzi: string, simplified: string, pinyin: string, meaning: string, tradSentence: string, simpleSentence: string, sentencePinyin: string, category: string): LessonWord => ({
  id, hanzi, simplified, pinyin, meaning: { en: meaning, 'zh-Hant': hanzi, 'zh-Hans': simplified },
  sentence: tradSentence, sentenceSimplified: simpleSentence, sentencePinyin, category,
});

export const lessons: GardenLesson[] = [
  {
    id: 'greetings', title: { en: 'Hello, friend', 'zh-Hant': '打招呼', 'zh-Hans': '打招呼' }, subtitle: { en: 'A few kind words to begin', 'zh-Hant': '認識新朋友', 'zh-Hans': '认识新朋友' }, category: 'daily', icon: 'message',
    premium: false, words: [
      w('ni-hao', '你好', '你好', 'nǐ hǎo', 'Hello', '你好，我叫小樂。', '你好，我叫小乐。', 'nǐ hǎo, wǒ jiào xiǎo lè.', 'daily'),
      w('zao-shang-hao', '早上好', '早上好', 'zǎo shàng hǎo', 'Good morning', '早上好，我們一起出門吧。', '早上好，我们一起出门吧。', 'zǎo shàng hǎo, wǒ men yì qǐ chū mén ba.', 'daily'),
      w('xie-xie', '謝謝', '谢谢', 'xiè xie', 'Thank you', '謝謝你幫我。', '谢谢你帮我。', 'xiè xie nǐ bāng wǒ.', 'daily'),
      w('zai-jian', '再見', '再见', 'zài jiàn', 'Goodbye', '再見，明天見！', '再见，明天见！', 'zài jiàn, míng tiān jiàn.', 'daily'),
    ],
  },
  {
    id: 'fruit', title: { en: 'Fruit & colors', 'zh-Hant': '好吃水果', 'zh-Hans': '好吃水果' }, subtitle: { en: 'Look, taste and name', 'zh-Hant': '看看顏色和味道', 'zh-Hans': '看看颜色和味道' }, category: 'food', icon: 'apple',
    premium: false, words: [
      w('ping-guo', '蘋果', '苹果', 'píng guǒ', 'Apple', '我想吃一個蘋果。', '我想吃一个苹果。', 'wǒ xiǎng chī yí ge píng guǒ.', 'food'),
      w('xiang-jiao', '香蕉', '香蕉', 'xiāng jiāo', 'Banana', '香蕉是黃色的。', '香蕉是黄色的。', 'xiāng jiāo shì huáng sè de.', 'food'),
      w('shui', '水', '水', 'shuǐ', 'Water', '請給我一杯水。', '请给我一杯水。', 'qǐng gěi wǒ yì bēi shuǐ.', 'food'),
      w('mi-fan', '米飯', '米饭', 'mǐ fàn', 'Rice', '我們一起吃米飯。', '我们一起吃米饭。', 'wǒ men yì qǐ chī mǐ fàn.', 'food'),
    ],
  },
  {
    id: 'animals', title: { en: 'Little neighbours', 'zh-Hant': '可愛動物', 'zh-Hans': '可爱动物' }, subtitle: { en: 'Who lives nearby?', 'zh-Hant': '牠們住在哪裡？', 'zh-Hans': '它们住在哪里？' }, category: 'world', icon: 'paw',
    premium: true, words: [
      w('mao', '貓', '猫', 'māo', 'Cat', '小貓在窗邊睡覺。', '小猫在窗边睡觉。', 'xiǎo māo zài chuāng biān shuì jiào.', 'world'),
      w('gou', '狗', '狗', 'gǒu', 'Dog', '小狗喜歡散步。', '小狗喜欢散步。', 'xiǎo gǒu xǐ huan sàn bù.', 'world'),
      w('niao', '鳥', '鸟', 'niǎo', 'Bird', '小鳥在樹上唱歌。', '小鸟在树上唱歌。', 'xiǎo niǎo zài shù shàng chàng gē.', 'world'),
      w('yu', '魚', '鱼', 'yú', 'Fish', '魚兒在水裡游。', '鱼儿在水里游。', 'yú ér zài shuǐ lǐ yóu.', 'world'),
    ],
  },
  {
    id: 'family', title: { en: 'My close circle', 'zh-Hant': '我的家人', 'zh-Hans': '我的家人' }, subtitle: { en: 'The people we love', 'zh-Hant': '介紹最親近的人', 'zh-Hans': '介绍最亲近的人' }, category: 'family', icon: 'heart',
    premium: true, words: [
      w('mama', '媽媽', '妈妈', 'mā ma', 'Mum', '媽媽陪我看書。', '妈妈陪我看书。', 'mā ma péi wǒ kàn shū.', 'family'),
      w('baba', '爸爸', '爸爸', 'bà ba', 'Dad', '爸爸和我去公園。', '爸爸和我去公园。', 'bà ba hé wǒ qù gōng yuán.', 'family'),
      w('peng-you', '朋友', '朋友', 'péng you', 'Friend', '我們是好朋友。', '我们是好朋友。', 'wǒ men shì hǎo péng you.', 'family'),
      w('jia', '家', '家', 'jiā', 'Home', '我喜歡我的家。', '我喜欢我的家。', 'wǒ xǐ huan wǒ de jiā.', 'family'),
    ],
  },
  {
    id: 'playtime', title: { en: 'Make & play', 'zh-Hant': '玩一玩，動一動', 'zh-Hans': '玩一玩，动一动' }, subtitle: { en: 'Move, sing and make-believe', 'zh-Hant': '唱唱跳跳，開心想像', 'zh-Hans': '唱唱跳跳，开心想象' }, category: 'leisure', icon: 'message',
    premium: true, words: [
      w('wan', '玩', '玩', 'wán', 'Play', '我們一起玩積木。', '我们一起玩积木。', 'wǒ men yì qǐ wán jī mù.', 'leisure'),
      w('chang-ge', '唱歌', '唱歌', 'chàng gē', 'Sing', '大家一起唱歌。', '大家一起唱歌。', 'dà jiā yì qǐ chàng gē.', 'leisure'),
      w('tiao-wu', '跳舞', '跳舞', 'tiào wǔ', 'Dance', '小朋友喜歡跳舞。', '小朋友喜欢跳舞。', 'xiǎo péng you xǐ huan tiào wǔ.', 'leisure'),
      w('ti-qiu', '踢球', '踢球', 'tī qiú', 'Play ball', '我們在草地上踢球。', '我们在草地上踢球。', 'wǒ men zài cǎo dì shàng tī qiú.', 'leisure'),
    ],
  },
  {
    id: 'outside', title: { en: 'Out and about', 'zh-Hant': '出門去看看', 'zh-Hans': '出门去看看' }, subtitle: { en: 'A little walk, many words', 'zh-Hant': '街上有什麼？', 'zh-Hans': '街上有什么？' }, category: 'world', icon: 'compass',
    premium: true, words: [
      w('che', '車', '车', 'chē', 'Car', '我們坐車去公園。', '我们坐车去公园。', 'wǒ men zuò chē qù gōng yuán.', 'world'),
      w('gong-yuan', '公園', '公园', 'gōng yuán', 'Park', '公園裡有很多樹。', '公园里有很多树。', 'gōng yuán lǐ yǒu hěn duō shù.', 'world'),
      w('shu', '樹', '树', 'shù', 'Tree', '大樹下很涼快。', '大树下很凉快。', 'dà shù xià hěn liáng kuai.', 'world'),
      w('shu-bao', '書包', '书包', 'shū bāo', 'Schoolbag', '我把書放進書包。', '我把书放进书包。', 'wǒ bǎ shū fàng jìn shū bāo.', 'daily'),
    ],
  },
];

export const categories = ['all', 'daily', 'food', 'family', 'leisure', 'world'] as const;
export const categoryNames: Record<Language, Record<string, string>> = {
  en: { all: 'All', daily: 'Everyday', food: 'Food & drink', family: 'Family', leisure: 'Play & make', world: 'Around me' },
  'zh-Hant': { all: '全部', daily: '日常生活', food: '吃喝', family: '家人朋友', leisure: '休閒活動', world: '身邊世界' },
  'zh-Hans': { all: '全部', daily: '日常生活', food: '吃喝', family: '家人朋友', leisure: '休闲活动', world: '身边世界' },
};

export const copy = {
  en: {
    navHome: 'Garden', navWords: 'Word paths', navParent: 'For parents', signIn: 'Sign in', welcome: 'A little Mandarin, every day', headline: 'Let curiosity take root.', intro: 'Short, joyful Mandarin practice for little learners — with a grown-up close by.', start: 'Start with a hello', browse: 'Explore the garden', today: 'A gentle 10-minute ritual', lessons: 'Choose a little path', lessonsHint: 'Tap a lesson to listen, say it, and make it yours.', learn: 'words to discover', free: 'FREE START', premium: 'FULL PATH', path: 'A path that grows with them', pathHint: 'Four stages to choose from, in any order. Each one opens a little more of the world.', levels: ['Seedling', 'Word explorer', 'Sentence builder', 'Little reader'], levelAges: ['2–4 years', '3–5 years', '6–8 years', '9–12 years'], levelNotes: ['First words & phrases', 'Listening & speaking', 'Words & short sentences', 'Reading & expression'], join: 'See family membership', minutes: '4 words · about 5 minutes', locked: 'Membership opens this lesson', back: 'Back to the garden', word: 'Word', listen: 'Listen', sentence: 'In a little sentence', next: 'I know it · next word', finish: 'Finish this lesson', complete: 'What a lovely round.', completeHint: 'Four new words have found a home.', return: 'Choose another lesson', parentTitle: 'A garden for growing minds.', parentSubtitle: 'A few thoughtful settings for the grown-ups who make learning feel safe.', interface: 'Interface language', interfaceHint: 'Choose the language for menus and buttons.', age: 'Learning stage', ageHint: 'Match the paths to your child’s age.', theme: 'Garden colors', membership: 'Family membership', premiumActive: 'Premium path is open', freePlan: 'Free garden', monthly: 'Monthly membership', price: '$9.99', perMonth: '/ month', benefits: ['The full Learning playground: all four stages, 800 words', 'Short vocabulary, pinyin and real sentences', 'Five games and 40 read-aloud stories, any stage you choose'], upgrade: 'Open the full garden', manage: 'Manage subscription', paymentNote: 'Secure checkout is handled by Stripe. You can manage or cancel any time in the billing portal.', account: 'Your parent account', signedOut: 'Sign in or create an account to manage membership. A new account becomes a member only after a successful payment; free lessons stay open without signing in.', signUp: 'Create an account', due: 'Next renewal', cancelAt: 'Cancellation scheduled', active: 'Active membership', loading: 'Checking membership…', retry: 'Try again', failed: 'We could not load membership. Please retry.', checkoutError: 'Checkout could not be started. Please try again.', portalError: 'Billing portal could not be opened. Please try again.', category: 'A small learning garden', footer: 'Small steps. New words. A whole world.' },
  'zh-Hant': {
    navHome: '樂園首頁', navWords: '詞語小徑', navParent: '家長專區', signIn: '登入', welcome: '每天一點點漢語', headline: '讓好奇心慢慢發芽。', intro: '為小小學習者準備的輕鬆漢語練習，大人就在身邊陪伴。', start: '從「你好」開始', browse: '逛逛樂園', today: '溫柔的十分鐘日常', lessons: '挑一條小路出發', lessonsHint: '點選課程，聽一聽、說一說，讓詞語成為自己的。', learn: '個詞語等你發現', free: '免費開始', premium: '完整學習路徑', path: '陪孩子一起長大的學習路', pathHint: '四個階段自由選擇，每一步都多認識一點世界。', levels: ['小芽學徒', '詞語探險家', '短句小能手', '漢語小讀者'], levelAges: ['2–4 歲', '3–5 歲', '6–8 歲', '9–12 歲'], levelNotes: ['單字及生活詞彙', '聽說啟蒙', '詞語短句', '閱讀表達'], join: '看看家庭會員', minutes: '4 個詞語 · 約 5 分鐘', locked: '加入會員即可開啟這堂課', back: '回到樂園', word: '詞語', listen: '聽一聽', sentence: '放進短句裡', next: '學會了，下一個', finish: '完成這堂課', complete: '真棒，完成一輪了。', completeHint: '四個新詞語已經住進記憶裡。', return: '挑選另一堂課', parentTitle: '陪伴孩子自在成長。', parentSubtitle: '為陪伴學習的大人準備的幾項貼心設定。', interface: '介面語言', interfaceHint: '選擇選單和按鈕使用的語言。', age: '學習階段', ageHint: '依孩子年齡推薦合適的學習路徑。', theme: '樂園色彩', membership: '家庭會員', premiumActive: '完整學習路徑已開啟', freePlan: '免費樂園', monthly: '月度會員', price: 'US$9.99', perMonth: '/ 月', benefits: ['完整學習樂園：四個階段、800 個詞語', '生活詞語、拼音與實用短句', '五種遊戲與 40 篇朗讀故事，任選階段'], upgrade: '開啟完整樂園', manage: '管理訂閱', paymentNote: '安全付款由 Stripe 處理，可隨時前往帳單入口管理或取消。', account: '家長帳戶', signedOut: '登入或建立帳戶即可管理會員方案。新帳戶須付款成功後才會成為會員；免費課程無需登入即可使用。', signUp: '建立帳戶', due: '下次續訂', cancelAt: '已設定取消', active: '會員有效', loading: '正在查看會員狀態…', retry: '再試一次', failed: '無法載入會員狀態，請重試。', checkoutError: '目前無法開始結帳，請再試一次。', portalError: '目前無法開啟帳單管理，請再試一次。', category: '一座小小學習樂園', footer: '每天一小步，詞語帶你看世界。' },
  'zh-Hans': {
    navHome: '乐园首页', navWords: '词语小径', navParent: '家长专区', signIn: '登录', welcome: '每天一点点汉语', headline: '让好奇心慢慢发芽。', intro: '为小小学习者准备的轻松汉语练习，大人就在身边陪伴。', start: '从“你好”开始', browse: '逛逛乐园', today: '温柔的十分钟日常', lessons: '挑一条小路出发', lessonsHint: '点选课程，听一听、说一说，让词语成为自己的。', learn: '个词语等你发现', free: '免费开始', premium: '完整学习路径', path: '陪孩子一起长大的学习路', pathHint: '四个阶段自由选择，每一步都多认识一点世界。', levels: ['小芽学徒', '词语探险家', '短句小能手', '汉语小读者'], levelAges: ['2–4 岁', '3–5 岁', '6–8 岁', '9–12 岁'], levelNotes: ['单字及生活词汇', '听说启蒙', '词语短句', '阅读表达'], join: '看看家庭会员', minutes: '4 个词语 · 约 5 分钟', locked: '加入会员即可开启这堂课', back: '回到乐园', word: '词语', listen: '听一听', sentence: '放进短句里', next: '学会了，下一个', finish: '完成这堂课', complete: '真棒，完成一轮了。', completeHint: '四个新词语已经住进记忆里。', return: '挑选另一堂课', parentTitle: '陪伴孩子自在成长。', parentSubtitle: '为陪伴学习的大人准备的几项贴心设置。', interface: '界面语言', interfaceHint: '选择菜单和按钮使用的语言。', age: '学习阶段', ageHint: '依孩子年龄推荐合适的学习路径。', theme: '乐园色彩', membership: '家庭会员', premiumActive: '完整学习路径已开启', freePlan: '免费乐园', monthly: '月度会员', price: 'US$9.99', perMonth: '/ 月', benefits: ['完整学习乐园：四个阶段、800 个词语', '生活词语、拼音与实用短句', '五种游戏与 40 篇朗读故事，任选阶段'], upgrade: '开启完整乐园', manage: '管理订阅', paymentNote: '安全付款由 Stripe 处理，可随时前往账单入口管理或取消。', account: '家长账户', signedOut: '登录或创建账户即可管理会员方案。新账户须付款成功后才会成为会员；免费课程无需登录即可使用。', signUp: '创建账户', due: '下次续订', cancelAt: '已设置取消', active: '会员有效', loading: '正在查看会员状态…', retry: '再试一次', failed: '无法加载会员状态，请重试。', checkoutError: '目前无法开始结账，请再试一次。', portalError: '目前无法打开账单管理，请再试一次。', category: '一座小小学习乐园', footer: '每天一小步，词语带你看世界。' },
};

export const levels = [
  { age: '2-4', words: ['門|门|mén|door', '手|手|shǒu|hand', '媽媽|妈妈|mā ma|mum', '水|水|shuǐ|water'] },
  { age: '3-5', words: ['刷牙|刷牙|shuā yá|brush teeth', '姐姐|姐姐|jiě jie|older sister', '牛奶|牛奶|niú nǎi|milk', '公園|公园|gōng yuán|park'] },
  { age: '6-8', words: ['整理|整理|zhěng lǐ|organize', '體貼|体贴|tǐ tiē|considerate', '營養|营养|yíng yǎng|nutrition', '植物|植物|zhí wù|plant'] },
  { age: '9-12', words: ['規劃|规划|guī huà|plan', '溝通|沟通|gōu tōng|communicate', '均衡|均衡|jūn héng|balanced', '環境|环境|huán jìng|environment'] },
];
