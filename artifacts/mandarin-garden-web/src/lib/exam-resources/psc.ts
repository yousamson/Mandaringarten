import type { ExamLevel, ExamWord } from './types';

const w = (id: string, traditional: string, simplified: string, pinyin: string, meaning: string): ExamWord => ({
  id, traditional, simplified, pinyin, meaning,
});

export const pscLevels: ExamLevel[] = [
  {
    id: '1a', label: '一級甲等', description: '朗讀與表達練習 · 音節清楚、語調自然',
    words: [
      w('p1a-zhongguo', '中國', '中国', 'Zhōngguó', 'China'),
      w('p1a-renmin', '人民', '人民', 'rénmín', 'people'),
      w('p1a-shenghuo', '生活', '生活', 'shēnghuó', 'life; daily life'),
      w('p1a-renshi', '認識', '认识', 'rènshi', 'to know; to meet'),
      w('p1a-shijian', '時間', '时间', 'shíjiān', 'time'),
      w('p1a-xuexi', '學習', '学习', 'xuéxí', 'to study; to learn'),
      w('p1a-pengyou', '朋友', '朋友', 'péngyou', 'friend'),
      w('p1a-shengyin', '聲音', '声音', 'shēngyīn', 'sound; voice'),
      w('p1a-ziran', '自然', '自然', 'zìrán', 'nature; natural'),
      w('p1a-changchang', '常常', '常常', 'chángcháng', 'often'),
    ],
    article: {
      id: 'psc-1a-reading', title: '清晨的公園', titleSimplified: '清晨的公园',
      traditional: '清晨，公園裡很安靜。人們有的散步，有的讀書，還有人在樹下練習唱歌。微風吹過，花草輕輕搖動。這裡的生活簡單又自在。',
      simplified: '清晨，公园里很安静。人们有的散步，有的读书，还有人在树下练习唱歌。微风吹过，花草轻轻摇动。这里的生活简单又自在。',
    },
  },
  {
    id: '1b', label: '一級乙等', description: '朗讀與表達練習 · 聲調連讀與短句節奏',
    words: [
      w('p1b-siwei', '思維', '思维', 'sīwéi', 'thinking'),
      w('p1b-fazhan', '發展', '发展', 'fāzhǎn', 'development; to develop'),
      w('p1b-fangfa', '方法', '方法', 'fāngfǎ', 'method'),
      w('p1b-zhuyi', '注意', '注意', 'zhùyì', 'to pay attention'),
      w('p1b-renshi', '認真', '认真', 'rènzhēn', 'serious; conscientious'),
      w('p1b-shijian', '實踐', '实践', 'shíjiàn', 'practice; to put into practice'),
      w('p1b-zhuanye', '專業', '专业', 'zhuānyè', 'specialty; professional'),
      w('p1b-huanjing', '環境', '环境', 'huánjìng', 'environment'),
      w('p1b-zhengque', '正確', '正确', 'zhèngquè', 'correct'),
      w('p1b-renwei', '認為', '认为', 'rènwéi', 'to think; to consider'),
    ],
    article: {
      id: 'psc-1b-reading', title: '把事情做好', titleSimplified: '把事情做好',
      traditional: '要把一件事情做好，先要有清楚的方法，也要認真實踐。遇到困難時，不急著放棄，可以先找出原因，再請朋友一起想辦法。每一次小小的進步，都會讓我們更有信心。',
      simplified: '要把一件事情做好，先要有清楚的方法，也要认真实践。遇到困难时，不急着放弃，可以先找出原因，再请朋友一起想办法。每一次小小的进步，都会让我们更有信心。',
    },
  },
  {
    id: '2a', label: '二級甲等', description: '朗讀與表達練習 · 多音節詞與連貫語句',
    words: [
      w('p2a-bixu', '必須', '必须', 'bìxū', 'must; to have to'),
      w('p2a-zhiliang', '質量', '质量', 'zhìliàng', 'quality'),
      w('p2a-zhichi', '支持', '支持', 'zhīchí', 'to support'),
      w('p2a-yingxiang', '影響', '影响', 'yǐngxiǎng', 'influence; effect'),
      w('p2a-zhengque', '正確', '正确', 'zhèngquè', 'correct'),
      w('p2a-reqing', '熱情', '热情', 'rèqíng', 'enthusiasm; warm'),
      w('p2a-xuanzhe', '選擇', '选择', 'xuǎnzé', 'to choose; choice'),
      w('p2a-jieguo', '結果', '结果', 'jiéguǒ', 'result'),
      w('p2a-yuanyin', '原因', '原因', 'yuányīn', 'reason; cause'),
      w('p2a-gongtong', '共同', '共同', 'gòngtóng', 'common; together'),
    ],
    article: {
      id: 'psc-2a-reading', title: '合作的力量', titleSimplified: '合作的力量',
      traditional: '一項社區活動要順利完成，必須有清楚的分工。每個人都可以根據自己的特長選擇任務，也要尊重別人的想法。遇到意見不同時，先說明原因，再一起找出合適的方法。只要大家共同努力，活動的質量自然會提高。',
      simplified: '一项社区活动要顺利完成，必须有清楚的分工。每个人都可以根据自己的特长选择任务，也要尊重别人的想法。遇到意见不同时，先说明原因，再一起找出合适的方法。只要大家共同努力，活动的质量自然会提高。',
    },
  },
  {
    id: '2b', label: '二級乙等', description: '朗讀與表達練習 · 清晰表達與準確停連',
    words: [
      w('p2b-xingshi', '形勢', '形势', 'xíngshì', 'situation; circumstances'),
      w('p2b-jingyan', '經驗', '经验', 'jīngyàn', 'experience'),
      w('p2b-fuzhi', '複製', '复制', 'fùzhì', 'to copy; to reproduce'),
      w('p2b-jiejue', '解決', '解决', 'jiějué', 'to solve'),
      w('p2b-zhidao', '指導', '指导', 'zhǐdǎo', 'to guide; guidance'),
      w('p2b-quanli', '權利', '权利', 'quánlì', 'right; entitlement'),
      w('p2b-zhunque', '準確', '准确', 'zhǔnquè', 'accurate'),
      w('p2b-dianxing', '典型', '典型', 'diǎnxíng', 'typical; example'),
      w('p2b-lvxing', '旅行', '旅行', 'lǚxíng', 'to travel; travel'),
      w('p2b-lvxing-duty', '履行', '履行', 'lǚxíng', 'to fulfill; to carry out'),
    ],
    article: {
      id: 'psc-2b-reading', title: '一次新的嘗試', titleSimplified: '一次新的尝试',
      traditional: '第一次參加志願服務時，我對工作流程並不熟悉。負責人先向大家說明當天的形勢和注意事項，再分別指導不同小組。中途遇到一個問題，我們沒有互相責怪，而是根據實際情況調整分工。活動結束後，我記下這次經驗，提醒自己下次要準備得更充分。',
      simplified: '第一次参加志愿服务时，我对工作流程并不熟悉。负责人先向大家说明当天的形势和注意事项，再分别指导不同小组。中途遇到一个问题，我们没有互相责怪，而是根据实际情况调整分工。活动结束后，我记下这次经验，提醒自己下次要准备得更充分。',
    },
  },
  {
    id: '3a', label: '三級甲等', description: '朗讀與表達練習 · 長句理解與流暢敘述',
    words: [
      w('p3a-zuoyong', '作用', '作用', 'zuòyòng', 'function; effect'),
      w('p3a-cunzai', '存在', '存在', 'cúnzài', 'to exist; existence'),
      w('p3a-zhengti', '整體', '整体', 'zhěngtǐ', 'whole; overall'),
      w('p3a-tongshi', '同時', '同时', 'tóngshí', 'at the same time'),
      w('p3a-guocheng', '過程', '过程', 'guòchéng', 'process'),
      w('p3a-jiegou', '結構', '结构', 'jiégòu', 'structure'),
      w('p3a-xiaolv', '效率', '效率', 'xiàolǜ', 'efficiency'),
      w('p3a-guanlian', '關聯', '关联', 'guānlián', 'connection; to relate'),
      w('p3a-wending', '穩定', '稳定', 'wěndìng', 'stable; stability'),
      w('p3a-tiaojian', '條件', '条件', 'tiáojiàn', 'condition'),
    ],
    article: {
      id: 'psc-3a-reading', title: '城市中的綠地', titleSimplified: '城市中的绿地',
      traditional: '城市裡的綠地不只是休息的地方，也能改善周圍環境。樹木可以遮擋陽光，草地能吸收雨水，公園還為居民提供交流的空間。這些作用彼此關聯，構成一個完整的生態過程。若規劃時只重視面積而忽略整體結構，綠地的功能就很難穩定發揮。因此，設計者需要同時考慮自然條件、使用效率和居民的實際需要。',
      simplified: '城市里的绿地不只是休息的地方，也能改善周围环境。树木可以遮挡阳光，草地能吸收雨水，公园还为居民提供交流的空间。这些作用彼此关联，构成一个完整的生态过程。若规划时只重视面积而忽略整体结构，绿地的功能就很难稳定发挥。因此，设计者需要同时考虑自然条件、使用效率和居民的实际需要。',
    },
  },
  {
    id: '3b', label: '三級乙等', description: '朗讀與表達練習 · 複雜語句與準確語意',
    words: [
      w('p3b-tongchou', '統籌', '统筹', 'tǒngchóu', 'to coordinate; to plan as a whole'),
      w('p3b-jianbie', '鑑別', '鉴别', 'jiànbié', 'to distinguish; to identify'),
      w('p3b-yunhan', '蘊含', '蕴含', 'yùnhán', 'to contain; to imply'),
      w('p3b-shentou', '滲透', '渗透', 'shèntòu', 'to permeate'),
      w('p3b-gailan', '概覽', '概览', 'gàilǎn', 'overview'),
      w('p3b-jiongran', '迥然', '迥然', 'jiǒngrán', 'markedly; distinctly'),
      w('p3b-yunxu', '允許', '允许', 'yǔnxǔ', 'to allow; to permit'),
      w('p3b-xiangying', '相應', '相应', 'xiāngyìng', 'corresponding; to respond'),
      w('p3b-fanwei', '範圍', '范围', 'fànwéi', 'scope; range'),
      w('p3b-jingque', '精確', '精确', 'jīngquè', 'precise'),
    ],
    article: {
      id: 'psc-3b-reading', title: '讓資料真正有用', titleSimplified: '让资料真正有用',
      traditional: '整理資料的目的，不是把所有數字堆在一起，而是讓讀者看見它們之間的關係。研究者首先要鑑別資料來源，再說明抽樣範圍、計算方法及可能的誤差。不同地區的情況迥然有別，若不加區分便直接比較，結論就可能失去精確性。好的分析會把細節放回整體脈絡中，讓讀者理解哪些變化具有代表性，也指出目前證據尚未涵蓋的範圍。這樣的說明雖然需要更多耐心，卻能使資料真正服務於判斷。',
      simplified: '整理资料的目的，不是把所有数字堆在一起，而是让读者看见它们之间的关系。研究者首先要鉴别资料来源，再说明抽样范围、计算方法及可能的误差。不同地区的情况迥然有别，若不加区分便直接比较，结论就可能失去精确性。好的分析会把细节放回整体脉络中，让读者理解哪些变化具有代表性，也指出目前证据尚未涵盖的范围。这样的说明虽然需要更多耐心，却能使资料真正服务于判断。',
    },
  },
];
