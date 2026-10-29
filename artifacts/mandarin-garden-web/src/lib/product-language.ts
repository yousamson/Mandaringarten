/** Keep all visible website copy aligned with the product's garden and subscription terminology. */
export function cleanProductText(text: string): string {
  return text
    .replaceAll('且費用恕不退還', '且已付訂閱月費恕不退還')
    .replaceAll('且费用恕不退还', '且已付订阅月费恕不退还')
    .replaceAll('已付費用', '已付訂閱月費')
    .replaceAll('已付费用', '已付订阅月费')
    .replaceAll('家庭會員費用', '家庭會員訂閱')
    .replaceAll('家庭会员费用', '家庭会员订阅')
    .replaceAll('訂閱費用', '訂閱月費')
    .replaceAll('订阅费用', '订阅月费')
    .replaceAll('免費課程', '免費內容')
    .replaceAll('免费课程', '免费内容')
    .replaceAll('學習課程', '學習樂園')
    .replaceAll('学习课程', '学习乐园')
    .replaceAll('課程', '學習內容')
    .replaceAll('课程', '学习内容')
    .replaceAll('完成這堂課', '完成這段練習')
    .replaceAll('完成这堂课', '完成这段练习')
    .replaceAll('這堂課', '這條小徑')
    .replaceAll('这堂课', '这条小径')
    .replaceAll('另一堂課', '另一條小徑')
    .replaceAll('另一堂课', '另一条小径')
    .replaceAll('費用', '訂閱')
    .replaceAll('费用', '订阅')
    .replace(/\bsubscription fees?\b/gi, 'subscription payments')
    .replace(/\bfees?\b/gi, 'subscriptions')
    .replace(/\bcourses?\b/gi, 'learning content')
    .replace(/\blessons\b/gi, 'learning activities')
    .replace(/\blesson\b/gi, 'learning activity');
}

export function cleanProductCopy<T>(value: T): T {
  if (typeof value === 'string') return cleanProductText(value) as T;
  if (Array.isArray(value)) return value.map((item) => cleanProductCopy(item)) as T;
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, cleanProductCopy(item)])) as T;
  }
  return value;
}
