import type { ExamLevel, ExamSentence, ExamWord } from './types';

type WordSeed = [key: string, traditional: string, simplified: string, pinyin: string, meaning: string];
type SentenceSeed = [traditional: string, simplified: string, answer: string];
const words = (prefix: string, seeds: WordSeed[]): ExamWord[] =>
  seeds.map(([key, traditional, simplified, pinyin, meaning]) => ({
    id: `${prefix}-${key}`, traditional, simplified, pinyin, meaning,
  }));
const sentencePractice = (prefix: string, seeds: SentenceSeed[], newWords: WordSeed[]): ExamSentence[] =>
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
  sentences: SentenceSeed[],
): ExamLevel => ({
  id,
  label,
  description: `${band} · ${description}`,
  words: [...words(`${id}-core`, core), ...words(id, newWords)],
  article: { id: `actfl-${id}-reading`, title: '語言交換計畫', titleSimplified: '语言交换计划', traditional: '', simplified: '' },
  sentencePractice: sentencePractice(id, sentences, newWords),
});

const noviceCore: WordSeed[] = [
  ['wo', '我', '我', 'wǒ', 'I; me'], ['ni', '你', '你', 'nǐ', 'you'],
  ['ta', '他', '他', 'tā', 'he; him'], ['jia', '家', '家', 'jiā', 'home; family'],
  ['shui', '水', '水', 'shuǐ', 'water'], ['pengyou', '朋友', '朋友', 'péngyou', 'friend'],
  ['xuexiao', '學校', '学校', 'xuéxiào', 'school'], ['xihuan', '喜歡', '喜欢', 'xǐhuan', 'to like'],
  ['jintian', '今天', '今天', 'jīntiān', 'today'], ['xuexi', '學習', '学习', 'xuéxí', 'to study'],
];
const intermediateCore: WordSeed[] = [
  ['jihua', '計畫', '计划', 'jìhuà', 'plan; to plan'], ['jingyan', '經驗', '经验', 'jīngyàn', 'experience'],
  ['mudi', '目的', '目的', 'mùdì', 'purpose; goal'], ['canyu', '參與', '参与', 'cānyù', 'to participate'],
  ['xuanze', '選擇', '选择', 'xuǎnzé', 'to choose; choice'], ['yuanyin', '原因', '原因', 'yuányīn', 'reason; cause'],
  ['jieguo', '結果', '结果', 'jiéguǒ', 'result'], ['yingxiang', '影響', '影响', 'yǐngxiǎng', 'influence; effect'],
  ['liru', '例如', '例如', 'lìrú', 'for example'], ['jixu', '繼續', '继续', 'jìxù', 'to continue'],
];
const advancedCore: WordSeed[] = [
  ['zhidu', '制度', '制度', 'zhìdù', 'system; institution'], ['ziliao', '資料', '资料', 'zīliào', 'data; material'],
  ['guandian', '觀點', '观点', 'guāndiǎn', 'viewpoint'], ['shehui', '社會', '社会', 'shèhuì', 'society'],
  ['yanjiu', '研究', '研究', 'yánjiū', 'research; to study'], ['wenhua', '文化', '文化', 'wénhuà', 'culture'],
  ['keneng', '可能', '可能', 'kěnéng', 'possible; possibly'], ['bijiao', '比較', '比较', 'bǐjiào', 'to compare'],
  ['fangshi', '方式', '方式', 'fāngshì', 'way; method'], ['huanjing', '環境', '环境', 'huánjìng', 'environment'],
];
const superiorCore: WordSeed[] = [
  ['bianzheng', '辯證', '辩证', 'biànzhèng', 'dialectical; to examine both sides'],
  ['quanheng', '權衡', '权衡', 'quánhéng', 'to weigh competing considerations'],
  ['gainian', '概念', '概念', 'gàiniàn', 'concept'], ['lunzheng', '論證', '论证', 'lùnzhèng', 'argumentation'],
  ['shiyong', '適用', '适用', 'shìyòng', 'applicable; to apply'],
  ['fanchou', '範疇', '范畴', 'fànchóu', 'category; domain'], ['jiegou', '結構', '结构', 'jiégòu', 'structure'],
  ['xianzhi', '限制', '限制', 'xiànzhì', 'limitation; to restrict'],
  ['guifan', '規範', '规范', 'guīfàn', 'norm; to standardize'],
  ['shizheng', '實證', '实证', 'shízhèng', 'empirical evidence'],
];

export const actflLevels: ExamLevel[] = [
  level('n-low', 'Novice Low', 'Novice', 'Recognize familiar names and essential classroom words.', noviceCore, [
    ['zaoshang', '早上', '早上', 'zǎoshang', 'morning'], ['mama', '媽媽', '妈妈', 'māma', 'mother; mom'],
    ['kan', '看', '看', 'kàn', 'to look; to watch'], ['chi', '吃', '吃', 'chī', 'to eat'],
    ['shu', '書', '书', 'shū', 'book'], ['xiao', '小', '小', 'xiǎo', 'small'],
    ['da', '大', '大', 'dà', 'big'], ['you', '有', '有', 'yǒu', 'to have; there is'],
    ['qu', '去', '去', 'qù', 'to go'], ['qing', '請', '请', 'qǐng', 'please; to invite'],
  ], [
    ['早上，＿＿和朋友一起去學校。', '早上，＿＿和朋友一起去学校。', 'wo'],
    ['我口渴了，想喝＿＿。', '我口渴了，想喝＿＿。', 'shui'],
    ['老師請我們打開＿＿。', '老师请我们打开＿＿。', 'shu'],
  ]),
  level('n-mid', 'Novice Mid', 'Novice', 'Use familiar words in memorized phrases and short exchanges.', noviceCore, [
    ['mingtian', '明天', '明天', 'míngtiān', 'tomorrow'], ['shangban', '上班', '上班', 'shàngbān', 'to go to work'],
    ['shengbing', '生病', '生病', 'shēngbìng', 'to be ill'], ['zaofan', '早飯', '早饭', 'zǎofàn', 'breakfast'],
    ['xuyao', '需要', '需要', 'xūyào', 'to need'], ['zhu', '住', '住', 'zhù', 'to live; to stay'],
    ['shuo', '說', '说', 'shuō', 'to speak; to say'], ['gaosu', '告訴', '告诉', 'gàosu', 'to tell'],
    ['ye', '也', '也', 'yě', 'also; too'], ['xianzai', '現在', '现在', 'xiànzài', 'now'],
  ], [
    ['他每天＿＿。', '他每天＿＿。', 'shangban'],
    ['我＿＿喝一杯水。', '我＿＿喝一杯水。', 'xihuan'],
    ['他今天不舒服，可能＿＿了。', '他今天不舒服，可能＿＿了。', 'shengbing'],
  ]),
  level('n-high', 'Novice High', 'Novice', 'Create simple statements about daily routines and immediate needs.', noviceCore, [
    ['zhoumo', '週末', '周末', 'zhōumò', 'weekend'], ['canting', '餐廳', '餐厅', 'cāntīng', 'restaurant'],
    ['juede', '覺得', '觉得', 'juéde', 'to feel; to think'], ['yibian', '一邊', '一边', 'yìbiān', 'while; one side'],
    ['gongyuan', '公園', '公园', 'gōngyuán', 'park'], ['renshi', '認識', '认识', 'rènshi', 'to know; to meet'],
    ['tianqi', '天氣', '天气', 'tiānqì', 'weather'], ['changchang', '常常', '常常', 'chángcháng', 'often'],
    ['zhunbei', '準備', '准备', 'zhǔnbèi', 'to prepare'], ['yinwei', '因為', '因为', 'yīnwèi', 'because'],
  ], [
    ['＿＿的時候，我常和朋友去公園。', '＿＿的时候，我常和朋友去公园。', 'zhoumo'],
    ['今天的＿＿很好，我們可以散步。', '今天的＿＿很好，我们可以散步。', 'tianqi'],
    ['我們＿＿在學校見面。', '我们＿＿在学校见面。', 'changchang'],
  ]),
  level('i-low', 'Intermediate Low', 'Intermediate', 'Handle familiar tasks with connected sentences and simple narration.', intermediateCore, [
    ['anpai', '安排', '安排', 'ānpái', 'to arrange; arrangement'], ['didian', '地點', '地点', 'dìdiǎn', 'location'],
    ['lianluo', '聯絡', '联络', 'liánluò', 'to contact; contact'], ['gaibian', '改變', '改变', 'gǎibiàn', 'to change; change'],
    ['huodong', '活動', '活动', 'huódòng', 'activity; event'], ['fuzhe', '負責', '负责', 'fùzé', 'to be responsible'],
    ['shijian', '時間', '时间', 'shíjiān', 'time'], ['cankaizhe', '參加者', '参加者', 'cānjiāzhě', 'participant'],
    ['tongzhi', '通知', '通知', 'tōngzhī', 'notice; to notify'], ['zhunshi', '準時', '准时', 'zhǔnshí', 'on time'],
  ], [
    ['我們先＿＿集合的地點，再通知大家。', '我们先＿＿集合的地点，再通知大家。', 'jihua'],
    ['下雨時，活動＿＿到室內進行。', '下雨时，活动＿＿到室内进行。', 'gaibian'],
    ['請把新的＿＿傳給所有參加者。', '请把新的＿＿传给所有参加者。', 'jihua'],
  ]),
  level('i-mid', 'Intermediate Mid', 'Intermediate', 'Explain events, preferences, and reasons across connected sentences.', intermediateCore, [
    ['taidu', '態度', '态度', 'tàidù', 'attitude'], ['jianyi', '建議', '建议', 'jiànyì', 'suggestion; to suggest'],
    ['taolun', '討論', '讨论', 'tǎolùn', 'to discuss; discussion'], ['zhichi', '支持', '支持', 'zhīchí', 'to support'],
    ['fudan', '負擔', '负担', 'fùdān', 'burden; to bear'], ['xiaoguo', '效果', '效果', 'xiàoguǒ', 'effect; result'],
    ['gongping', '公平', '公平', 'gōngpíng', 'fair; fairness'], ['gaishan', '改善', '改善', 'gǎishàn', 'to improve'],
    ['hezuo', '合作', '合作', 'hézuò', 'to cooperate; cooperation'], ['shihe', '適合', '适合', 'shìhé', 'to suit; suitable'],
  ], [
    ['大家＿＿後，決定先改善圖書室。', '大家＿＿后，决定先改善图书室。', 'taolun'],
    ['這個方法比較＿＿新加入的同學。', '这个方法比较＿＿新加入的同学。', 'shihe'],
    ['同學的＿＿讓活動更公平。', '同学的＿＿让活动更公平。', 'jianyi'],
  ]),
  level('i-high', 'Intermediate High', 'Intermediate', 'Narrate and explain practical matters with detail and some flexibility.', intermediateCore, [
    ['guocheng', '過程', '过程', 'guòchéng', 'process'], ['tiaozheng', '調整', '调整', 'tiáozhěng', 'to adjust'],
    ['ziyuan', '資源', '资源', 'zīyuán', 'resource'], ['xuqiu', '需求', '需求', 'xūqiú', 'need; demand'],
    ['chengguo', '成果', '成果', 'chéngguǒ', 'achievement; result'], ['cankao', '參考', '参考', 'cānkǎo', 'to refer to; reference'],
    ['youdian', '優點', '优点', 'yōudiǎn', 'advantage; strength'], ['xianzhi', '限制', '限制', 'xiànzhì', 'limitation; to restrict'],
    ['tidai', '取代', '取代', 'tìdài', 'to replace; replacement'], ['wancheng', '完成', '完成', 'wánchéng', 'to complete'],
  ], [
    ['我們根據居民的＿＿調整服務時間。', '我们根据居民的＿＿调整服务时间。', 'xuqiu'],
    ['準備＿＿中，團隊先整理可用資源。', '准备＿＿中，团队先整理可用资源。', 'guocheng'],
    ['這次合作的＿＿超過原來的預期。', '这次合作的＿＿超过原来的预期。', 'jieguo'],
  ]),
  level('a-low', 'Advanced Low', 'Advanced', 'Discuss public issues, summarize information, and support a point of view.', advancedCore, [
    ['qushi', '趨勢', '趋势', 'qūshì', 'trend'], ['zhengju', '證據', '证据', 'zhèngjù', 'evidence'],
    ['zhengce', '政策', '政策', 'zhèngcè', 'policy'], ['ziyuan', '資源', '资源', 'zīyuán', 'resource'],
    ['fenxi', '分析', '分析', 'fēnxī', 'to analyze; analysis'], ['diaocha', '調查', '调查', 'diàochá', 'survey; to investigate'],
    ['fazhan', '發展', '发展', 'fāzhǎn', 'development; to develop'], ['chayi', '差異', '差异', 'chāyì', 'difference; variation'],
    ['yinsu', '因素', '因素', 'yīnsù', 'factor'], ['shuju', '數據', '数据', 'shùjù', 'data'],
  ], [
    ['這份＿＿比較了不同地區的學習環境。', '这份＿＿比较了不同地区的学习环境。', 'yanjiu'],
    ['討論公共＿＿時，應同時考慮成本和公平。', '讨论公共＿＿时，应同时考虑成本和公平。', 'zhidu'],
    ['目前的＿＿顯示居民更需要安靜空間。', '目前的＿＿显示居民更需要安静空间。', 'shuju'],
  ]),
  level('a-mid', 'Advanced Mid', 'Advanced', 'Develop a structured argument and compare perspectives with supporting details.', advancedCore, [
    ['guancha', '觀察', '观察', 'guānchá', 'observation; to observe'], ['jieshi', '解釋', '解释', 'jiěshì', 'to explain; explanation'],
    ['guanchazhe', '觀察者', '观察者', 'guāncházhě', 'observer'], ['lichang', '立場', '立场', 'lìchǎng', 'position; stance'],
    ['mailuo', '脈絡', '脉络', 'màiluò', 'context; thread'], ['lundian', '論點', '论点', 'lùndiǎn', 'argument; point'],
    ['duizhao', '對照', '对照', 'duìzhào', 'to compare; contrast'], ['fangfa', '方法', '方法', 'fāngfǎ', 'method'],
    ['jielun', '結論', '结论', 'jiélùn', 'conclusion'], ['huiying', '回應', '回应', 'huíyìng', 'response; to respond'],
  ], [
    ['要理解一項政策，還要看它形成的＿＿。', '要理解一项政策，还要看它形成的＿＿。', 'huanjing'],
    ['不同資料可能＿＿同一現象。', '不同资料可能＿＿同一现象。', 'jieshi'],
    ['提出＿＿時，最好一併說明可查證的依據。', '提出＿＿时，最好一并说明可查证的依据。', 'lundian'],
  ]),
  level('a-high', 'Advanced High', 'Advanced', 'Sustain nuanced discussion and adapt formal language to complex contexts.', advancedCore, [
    ['zhixing', '執行', '执行', 'zhíxíng', 'to implement; execution'], ['pinggu', '評估', '评估', 'pínggū', 'to evaluate; evaluation'],
    ['gongpingxing', '公平性', '公平性', 'gōngpíngxìng', 'fairness'], ['toumingdu', '透明度', '透明度', 'tòumíngdù', 'transparency'],
    ['canyuzhe', '參與者', '参与者', 'cānyùzhě', 'participant'], ['xieshang', '協商', '协商', 'xiéshāng', 'to negotiate'],
    ['qushe', '取捨', '取舍', 'qǔshě', 'trade-off; to choose between'], ['changqi', '長期', '长期', 'chángqī', 'long-term'],
    ['chengxiao', '成效', '成效', 'chéngxiào', 'effectiveness; result'], ['luoshi', '落實', '落实', 'luòshí', 'to put into effect'],
  ], [
    ['公開討論能增加決策的＿＿。', '公开讨论能增加决策的＿＿。', 'toumingdu'],
    ['政策需要＿＿到每個服務據點。', '政策需要＿＿到每个服务据点。', 'luoshi'],
    ['評估時要同時呈現成效與＿＿。', '评估时要同时呈现成效与＿＿。', 'qushe'],
  ]),
  level('superior', 'Superior', 'Superior', 'Synthesize evidence, qualify claims, and address competing interpretations.', superiorCore, [
    ['qianti', '前提', '前提', 'qiántí', 'premise; precondition'], ['tuilun', '推論', '推论', 'tuīlùn', 'inference; to infer'],
    ['fanwei', '範圍', '范围', 'fànwéi', 'scope; range'], ['mailuohua', '脈絡化', '脉络化', 'màiluòhuà', 'to contextualize'],
    ['qiyi', '歧義', '歧义', 'qíyì', 'ambiguity'], ['jiashe', '假設', '假设', 'jiǎshè', 'assumption; to assume'],
    ['liwai', '例外', '例外', 'lìwài', 'exception'], ['yinguo', '因果', '因果', 'yīnguǒ', 'cause and effect'],
    ['quanshi', '詮釋', '诠释', 'quánshì', 'interpretation; to interpret'], ['keyanzheng', '可驗證', '可验证', 'kě yànzhèng', 'verifiable'],
  ], [
    ['一項＿＿要成立，必須說明適用的範圍。', '一项＿＿要成立，必须说明适用的范围。', 'lunzheng'],
    ['若前提不同，相同資料也可能產生不同＿＿。', '若前提不同，相同资料也可能产生不同＿＿。', 'tuilun'],
    ['作者應區分因果關係和時間上的＿＿。', '作者应区分因果关系和时间上的＿＿。', 'yinguo'],
  ]),
];
