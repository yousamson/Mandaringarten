import type { ExamLevel, ExamSentence, ExamWord } from './types';

type WordSeed = [key: string, traditional: string, simplified: string, pinyin: string, meaning: string];
type SentenceSeed = [traditional: string, simplified: string, answer: string];
const words = (prefix: string, seeds: WordSeed[]): ExamWord[] =>
  seeds.map(([key, traditional, simplified, pinyin, meaning]) => ({
    id: `${prefix}-${key}`, traditional, simplified, pinyin, meaning,
  }));
const sentences = (prefix: string, seeds: SentenceSeed[], newWords: WordSeed[]): ExamSentence[] =>
  seeds.map(([traditional, simplified, answer], index) => ({
    id: `${prefix}-sentence-${index + 1}`,
    traditional,
    simplified,
    answerWordId: `${prefix}-${newWords.some(([key]) => key === answer) ? '' : 'core-'}${answer}`,
  }));
const level = (
  id: string,
  label: string,
  band: string,
  description: string,
  core: WordSeed[],
  newWords: WordSeed[],
  sentenceSeeds: SentenceSeed[],
): ExamLevel => ({
  id,
  label,
  description: `${band} · ${description}`,
  words: [...words(`${id}-core`, core), ...words(id, newWords)],
  article: { id: `tocfl-${id}-reading`, title: '我的華語學習日記', titleSimplified: '我的华语学习日记', traditional: '', simplified: '' },
  sentencePractice: sentences(id, sentenceSeeds, newWords),
});

const entryCore: WordSeed[] = [
  ['wo', '我', '我', 'wǒ', 'I; me'], ['ni', '你', '你', 'nǐ', 'you'],
  ['ta', '他', '他', 'tā', 'he; him'], ['ren', '人', '人', 'rén', 'person'],
  ['jia', '家', '家', 'jiā', 'home; family'], ['shui', '水', '水', 'shuǐ', 'water'],
  ['xuexiao', '學校', '学校', 'xuéxiào', 'school'], ['pengyou', '朋友', '朋友', 'péngyou', 'friend'],
  ['xihuan', '喜歡', '喜欢', 'xǐhuan', 'to like'], ['jintian', '今天', '今天', 'jīntiān', 'today'],
];
const foundationCore: WordSeed[] = [
  ['jingyan', '經驗', '经验', 'jīngyàn', 'experience'], ['jueding', '決定', '决定', 'juédìng', 'to decide; decision'],
  ['fangfa', '方法', '方法', 'fāngfǎ', 'method'], ['zhunbei', '準備', '准备', 'zhǔnbèi', 'to prepare'],
  ['jiaoliu', '交流', '交流', 'jiāoliú', 'to communicate; exchange'], ['zhongyao', '重要', '重要', 'zhòngyào', 'important'],
  ['yingxiang', '影響', '影响', 'yǐngxiǎng', 'influence; effect'], ['jihua', '計畫', '计划', 'jìhuà', 'plan; to plan'],
  ['gongzuo', '工作', '工作', 'gōngzuò', 'work; job'], ['xuanze', '選擇', '选择', 'xuǎnzé', 'to choose; choice'],
];
const intermediateCore: WordSeed[] = [
  ['shehui', '社會', '社会', 'shèhuì', 'society'], ['wenhua', '文化', '文化', 'wénhuà', 'culture'],
  ['huanjing', '環境', '环境', 'huánjìng', 'environment'], ['ziliao', '資料', '资料', 'zīliào', 'data; material'],
  ['guandian', '觀點', '观点', 'guāndiǎn', 'viewpoint'], ['yanjiu', '研究', '研究', 'yánjiū', 'research; to study'],
  ['fazhan', '發展', '发展', 'fāzhǎn', 'development; to develop'], ['fangxiang', '方向', '方向', 'fāngxiàng', 'direction'],
  ['zeren', '責任', '责任', 'zérèn', 'responsibility'], ['jiegou', '結構', '结构', 'jiégòu', 'structure'],
];
const advancedCore: WordSeed[] = [
  ['lunzheng', '論證', '论证', 'lùnzhèng', 'argumentation'], ['gainian', '概念', '概念', 'gàiniàn', 'concept'],
  ['zhengju', '證據', '证据', 'zhèngjù', 'evidence'], ['quanheng', '權衡', '权衡', 'quánhéng', 'to weigh considerations'],
  ['fanchou', '範疇', '范畴', 'fànchóu', 'category; domain'], ['tuilun', '推論', '推论', 'tuīlùn', 'inference; to infer'],
  ['qiyi', '歧義', '歧义', 'qíyì', 'ambiguity'], ['yinguo', '因果', '因果', 'yīnguǒ', 'cause and effect'],
  ['guifan', '規範', '规范', 'guīfàn', 'norm; to standardize'], ['shizheng', '實證', '实证', 'shízhèng', 'empirical evidence'],
];

export const tocflLevels: ExamLevel[] = [
  level('1', 'Entry 1', 'TOCFL Band 1 · Entry', 'Recognize personal information and familiar everyday words.', entryCore, [
    ['zaoshang', '早上', '早上', 'zǎoshang', 'morning'], ['mama', '媽媽', '妈妈', 'māma', 'mother; mom'],
    ['baba', '爸爸', '爸爸', 'bàba', 'father; dad'], ['chi', '吃', '吃', 'chī', 'to eat'],
    ['kan', '看', '看', 'kàn', 'to look; to watch'], ['shu', '書', '书', 'shū', 'book'],
    ['xuexi', '學習', '学习', 'xuéxí', 'to study'], ['qu', '去', '去', 'qù', 'to go'],
    ['shang', '上', '上', 'shàng', 'up; to go to'], ['mingtian', '明天', '明天', 'míngtiān', 'tomorrow'],
  ], [
    ['＿＿早上要去學校。', '＿＿早上要去学校。', 'wo'],
    ['口渴時，我會喝＿＿。', '口渴时，我会喝＿＿。', 'shui'],
    ['她每天＿＿中文。', '她每天＿＿中文。', 'xuexi'],
  ]),
  level('2', 'Entry 2', 'TOCFL Band 1 · Entry', 'Exchange simple information about routines, places, and preferences.', entryCore, [
    ['zhu', '住', '住', 'zhù', 'to live; to stay'], ['gongyuan', '公園', '公园', 'gōngyuán', 'park'],
    ['canting', '餐廳', '餐厅', 'cāntīng', 'restaurant'], ['dianying', '電影', '电影', 'diànyǐng', 'movie'],
    ['yundong', '運動', '运动', 'yùndòng', 'exercise; sport'], ['yisheng', '醫生', '医生', 'yīshēng', 'doctor'],
    ['shijian', '時間', '时间', 'shíjiān', 'time'], ['gongche', '公車', '公交车', 'gōngchē', 'bus'],
    ['yinwei', '因為', '因为', 'yīnwèi', 'because'], ['yidian', '一點', '一点', 'yìdiǎn', 'a little; one o’clock'],
  ], [
    ['下課後，我們一起去＿＿散步。', '下课后，我们一起去＿＿散步。', 'gongyuan'],
    ['我住得離學校不遠，常常＿＿上學。', '我住得离学校不远，常常＿＿上学。', 'gongche'],
    ['今天有＿＿，我們要早點回家。', '今天有＿＿，我们要早点回家。', 'dianying'],
  ]),
  level('3', 'Foundation 1', 'TOCFL Band 2 · Foundation', 'Describe familiar experiences and explain a simple plan.', foundationCore, [
    ['canyu', '參與', '参与', 'cānyù', 'to participate'], ['huodong', '活動', '活动', 'huódòng', 'activity; event'],
    ['tongshi', '同事', '同事', 'tóngshì', 'colleague'], ['jiaqi', '假期', '假期', 'jiàqī', 'holiday; vacation'],
    ['luying', '露營', '露营', 'lùyíng', 'to camp; camping'], ['lianxi', '聯繫', '联系', 'liánxì', 'to contact; contact'],
    ['jiaotong', '交通', '交通', 'jiāotōng', 'transportation'], ['xiaofei', '消費', '消费', 'xiāofèi', 'to spend; consumption'],
    ['fangbian', '方便', '方便', 'fāngbiàn', 'convenient'], ['yuehui', '約會', '约会', 'yuēhuì', 'appointment; date'],
  ], [
    ['我們＿＿後，決定週末去郊外。', '我们＿＿后，决定周末去郊外。', 'jiaoliu'],
    ['出發前要確認交通＿＿。', '出发前要确认交通＿＿。', 'fangfa'],
    ['她常常＿＿社區活動，認識新朋友。', '她常常＿＿社区活动，认识新朋友。', 'canyu'],
  ]),
  level('4', 'Foundation 2', 'TOCFL Band 2 · Foundation', 'Connect events and describe reasons, results, and preferences.', foundationCore, [
    ['jiyu', '寄予', '寄予', 'jìyǔ', 'to place (hopes) in'], ['jieri', '節日', '节日', 'jiérì', 'festival; holiday'],
    ['zhunshi', '準時', '准时', 'zhǔnshí', 'on time'], ['diyi', '第一', '第一', 'dì-yī', 'first; number one'],
    ['shoudao', '受到', '受到', 'shòudào', 'to receive; to be affected'], ['guli', '鼓勵', '鼓励', 'gǔlì', 'to encourage'],
    ['jixu', '繼續', '继续', 'jìxù', 'to continue'], ['chenggong', '成功', '成功', 'chénggōng', 'success; to succeed'],
    ['jiaoyou', '交友', '交友', 'jiāoyǒu', 'to make friends'], ['tihui', '體會', '体会', 'tǐhuì', 'to realize; experience'],
  ], [
    ['大家準時到場，活動才會順利＿＿。', '大家准时到场，活动才会顺利＿＿。', 'chenggong'],
    ['老師的話給了我很大的＿＿。', '老师的话给了我很大的＿＿。', 'guli'],
    ['他＿＿練習，終於學會了新的歌曲。', '他＿＿练习，终于学会了新的歌曲。', 'jixu'],
  ]),
  level('5', 'Intermediate 1', 'TOCFL Band 3 · Intermediate', 'Summarize information and compare options in familiar public settings.', intermediateCore, [
    ['yonghu', '用戶', '用户', 'yònghù', 'user'], ['xiaolv', '效率', '效率', 'xiàolǜ', 'efficiency'],
    ['zhibiao', '指標', '指标', 'zhǐbiāo', 'indicator; metric'], ['jichu', '基礎', '基础', 'jīchǔ', 'foundation; basis'],
    ['tixian', '體現', '体现', 'tǐxiàn', 'to reflect; embody'], ['shuju', '數據', '数据', 'shùjù', 'data'],
    ['fenxi', '分析', '分析', 'fēnxī', 'to analyze; analysis'], ['queding', '確定', '确定', 'quèdìng', 'to determine; certain'],
    ['duoyang', '多樣', '多样', 'duōyàng', 'diverse; varied'], ['biaoda', '表達', '表达', 'biǎodá', 'to express'],
  ], [
    ['研究團隊用＿＿比較不同地區的交通需求。', '研究团队用＿＿比较不同地区的交通需求。', 'shuju'],
    ['新的服務＿＿提高了辦理速度。', '新的服务＿＿提高了办理速度。', 'zhibiao'],
    ['不同年齡的＿＿可能有不同需要。', '不同年龄的＿＿可能有不同需要。', 'yonghu'],
  ]),
  level('6', 'Intermediate 2', 'TOCFL Band 3 · Intermediate', 'Explain more abstract ideas and support conclusions with examples.', intermediateCore, [
    ['tiaojian', '條件', '条件', 'tiáojiàn', 'condition'], ['xiangguan', '相關', '相关', 'xiāngguān', 'related; relevant'],
    ['celue', '策略', '策略', 'cèlüè', 'strategy'], ['shishi', '實施', '实施', 'shíshī', 'to implement'],
    ['gailiang', '改良', '改良', 'gǎiliáng', 'to improve; improvement'], ['yongtu', '用途', '用途', 'yòngtú', 'use; purpose'],
    ['zhuanbian', '轉變', '转变', 'zhuǎnbiàn', 'to transform; change'], ['xuqiu', '需求', '需求', 'xūqiú', 'need; demand'],
    ['jiazhi', '價值', '价值', 'jiàzhí', 'value; worth'], ['huozhe', '或者', '或者', 'huòzhě', 'or; perhaps'],
  ], [
    ['在＿＿有限時，團隊要先處理最急的問題。', '在＿＿有限时，团队要先处理最急的问题。', 'tiaojian'],
    ['新方案要和居民的實際＿＿相符。', '新方案要和居民的实际＿＿相符。', 'xuqiu'],
    ['持續＿＿流程可以減少不必要的等待。', '持续＿＿流程可以减少不必要的等待。', 'gailiang'],
  ]),
  level('7', 'Advanced 1', 'TOCFL Band 4 · Advanced', 'Discuss complex social topics and distinguish claims from supporting evidence.', advancedCore, [
    ['qianti', '前提', '前提', 'qiántí', 'premise; precondition'], ['mailuo', '脈絡', '脉络', 'màiluò', 'context; thread'],
    ['fangfalun', '方法論', '方法论', 'fāngfǎlùn', 'methodology'], ['panduan', '判斷', '判断', 'pànduàn', 'judgment; to judge'],
    ['jiashe', '假設', '假设', 'jiǎshè', 'assumption; to assume'], ['zhengyi', '爭議', '争议', 'zhēngyì', 'controversy; dispute'],
    ['quanshi', '詮釋', '诠释', 'quánshì', 'interpretation; to interpret'], ['fanwei', '範圍', '范围', 'fànwéi', 'scope; range'],
    ['bijiao', '比較', '比较', 'bǐjiào', 'to compare'], ['lundian', '論點', '论点', 'lùndiǎn', 'argument; point'],
  ], [
    ['若＿＿不清楚，研究結果容易被誤讀。', '若＿＿不清楚，研究结果容易被误读。', 'gainian'],
    ['作者應交代研究方法和適用＿＿。', '作者应交代研究方法和适用＿＿。', 'fanchou'],
    ['討論＿＿時，要同時呈現不同立場。', '讨论＿＿时，要同时呈现不同立场。', 'zhengju'],
  ]),
  level('8', 'Advanced 2', 'TOCFL Band 4 · Advanced', 'Evaluate nuanced arguments and synthesize information across sources.', advancedCore, [
    ['tuiguang', '推廣', '推广', 'tuīguǎng', 'to promote; promotion'], ['zhengming', '證明', '证明', 'zhèngmíng', 'to prove; proof'],
    ['tuice', '推測', '推测', 'tuīcè', 'to infer; speculation'], ['touming', '透明', '透明', 'tòumíng', 'transparent'],
    ['hengliang', '衡量', '衡量', 'héngliáng', 'to measure; weigh'], ['panzhun', '判準', '判准', 'pànzhǔn', 'criterion; standard'],
    ['fanying', '反映', '反映', 'fǎnyìng', 'to reflect; mirror'], ['kexing', '可行', '可行', 'kěxíng', 'feasible; workable'],
    ['xianzhi', '限制', '限制', 'xiànzhì', 'limitation; to restrict'], ['qiyi2', '歧異', '歧异', 'qíyì', 'difference; divergence'],
  ], [
    ['評估新制度時，需要＿＿公平與效率。', '评估新制度时，需要＿＿公平与效率。', 'quanheng'],
    ['公開資料能使決策過程更＿＿。', '公开资料能使决策过程更＿＿。', 'touming'],
    ['比較多份報告後，研究者才能提出審慎的＿＿。', '比较多份报告后，研究者才能提出审慎的＿＿。', 'tuice'],
  ]),
];
