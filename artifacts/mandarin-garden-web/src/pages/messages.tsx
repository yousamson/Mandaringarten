import { useState, type FormEvent } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useCreateSupportThread, useSendSupportMessage, type SupportConversation } from '@workspace/api-client-react';
import { ArrowLeft, Inbox, MessageCircle, PenLine, RotateCcw, Send, ShieldAlert } from 'lucide-react';
import { Link } from 'wouter';
import { AccessChecking, AccessError } from '@/components/access-gate';
import { conversationQueryKey, threadsQueryKey, useAccountAccess, useSupportConversation, useSupportThreads } from '@/hooks/use-account';
import type { Language } from '@/lib/garden-data';
import { tr } from '@/lib/playground-copy';

const SUBJECT_MAX = 120;
const TEXT_MAX = 5000;

function when(l: Language, iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat(l, { dateStyle: 'medium', timeStyle: 'short' }).format(d);
}

export default function MessagesPage({ language: l, admin = false }: { language: Language; admin?: boolean }) {
  const a = useAccountAccess();
  if (!a.isLoaded) return <AccessChecking l={l} />;
  if (!a.isSignedIn) {
    return (
      <main className="page-shell"><section className="consent-shell">
        <div className="eyebrow">{tr(l, 'Messages', '訊息', '消息')}</div>
        <h1>{tr(l, 'Sign in to message the Mandarin Garden team.', '登入後即可聯絡漢語樂園團隊。', '登录后即可联系汉语乐园团队。')}</h1>
        <div className="button-row"><Link href="/sign-in" className="button-primary" data-testid="link-messages-sign-in">{tr(l, 'Sign in', '登入', '登录')}</Link></div>
      </section></main>
    );
  }
  if (admin) {
    if (a.query.isError) return <AccessError l={l} onRetry={() => void a.query.refetch()} />;
    if (!a.data) return <AccessChecking l={l} />;
    if (!a.isAdmin) {
      return (
        <main className="page-shell"><section className="consent-shell" data-testid="panel-admin-denied">
          <span className="consent-seal warn"><ShieldAlert size={24} /></span>
          <h1>{tr(l, 'This inbox is for the Mandarin Garden team.', '此收件匣僅供漢語樂園團隊使用。', '此收件箱仅供汉语乐园团队使用。')}</h1>
          <p className="panel-desc">{tr(l, 'Your account does not have team access. Your own conversations are in Messages.', '您的帳戶沒有團隊權限。您的對話在「訊息」中。', '您的账户没有团队权限。您的对话在“消息”中。')}</p>
          <div className="button-row"><Link href="/messages" className="button-primary" data-testid="link-denied-messages">{tr(l, 'Go to my messages', '前往我的訊息', '前往我的消息')}</Link></div>
        </section></main>
      );
    }
  }
  return <Inbox_ l={l} uid={a.uid} admin={admin} />;
}

function Inbox_({ l, uid, admin }: { l: Language; uid: string | null; admin: boolean }) {
  const threads = useSupportThreads(uid, true);
  const [selected, setSelected] = useState<string | null>(null);
  const [composing, setComposing] = useState(false);
  const list = threads.data ?? [];
  const showDetail = composing || Boolean(selected);

  return (
    <main className="page-shell" data-testid={admin ? 'page-admin-messages' : 'page-messages'}>
      <section className="page-title">
        <div className="eyebrow">{admin ? <><ShieldAlert size={14} /> {tr(l, 'Team inbox', '團隊收件匣', '团队收件箱')}</> : <><MessageCircle size={14} /> {tr(l, 'Messages', '訊息', '消息')}</>}</div>
        <h1>{admin ? tr(l, 'Every family conversation.', '所有家庭的對話。', '所有家庭的对话。') : tr(l, 'Talk with the garden team.', '與樂園團隊聊聊。', '与乐园团队聊聊。')}</h1>
        <p>{admin ? tr(l, 'Replies are sent as the Mandarin Garden team. Families never see each other’s threads.', '回覆會以漢語樂園團隊身分送出。家庭之間看不到彼此的對話。', '回复会以汉语乐园团队身份发送。家庭之间看不到彼此的对话。') : tr(l, 'Questions about paid subscriptions, your account or the lessons. Replies appear here, usually within a few days. Please do not share a child’s personal details.', '關於付費訂閱、帳戶或課程的問題都可以留言，回覆會顯示在這裡，通常需要幾天。請勿提供孩子的個人資料。', '关于付费订阅、账户或课程的问题都可以留言，回复会显示在这里，通常需要几天。请勿提供孩子的个人信息。')}</p>
      </section>
      <div className={`inbox ${showDetail ? 'has-detail' : ''}`}>
        <aside className="inbox-list panel">
          <div className="inbox-list-head">
            <h2>{tr(l, 'Conversations', '對話', '对话')}</h2>
            {!admin ? <button className="button-primary small" onClick={() => { setComposing(true); setSelected(null); }} data-testid="button-new-thread"><PenLine size={14} /> {tr(l, 'New', '新訊息', '新消息')}</button> : null}
          </div>
          {threads.isLoading ? <div className="thread-skeletons">{[1, 2, 3].map((i) => <div key={i} className="skeleton-block" style={{ minHeight: 64 }} />)}</div>
            : threads.isError ? <div className="alert" role="alert">{tr(l, 'Conversations could not be loaded.', '無法載入對話。', '无法加载对话。')} <button className="button-secondary" onClick={() => void threads.refetch()} data-testid="button-retry-threads"><RotateCcw size={13} /> {tr(l, 'Try again', '再試一次', '再试一次')}</button></div>
              : list.length === 0 ? (
                <div className="inbox-empty" data-testid="status-no-threads">
                  <Inbox size={26} />
                  <p>{admin ? tr(l, 'No family has written yet.', '目前還沒有家庭來信。', '目前还没有家庭来信。') : tr(l, 'No conversations yet. Start one whenever you need us.', '還沒有對話。需要時隨時開始。', '还没有对话。需要时随时开始。')}</p>
                </div>
              ) : (
                <ul className="thread-list">
                  {[...list].sort((x, y) => y.updatedAt.localeCompare(x.updatedAt)).map((th) => (
                    <li key={th.id}>
                      <button className={`thread-item ${selected === th.id ? 'selected' : ''}`} onClick={() => { setSelected(th.id); setComposing(false); }} aria-current={selected === th.id} data-testid={`button-thread-${th.id}`}>
                        <strong>{th.subject}</strong>
                        <span className="thread-preview">{th.lastMessagePreview}</span>
                        <small>{when(l, th.updatedAt)}</small>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
        </aside>
        <section className="inbox-detail panel">
          {composing && !admin ? <NewThread l={l} uid={uid} onCancel={() => setComposing(false)} onCreated={(id) => { setComposing(false); setSelected(id); }} />
            : selected ? <Conversation key={selected} l={l} uid={uid} threadId={selected} admin={admin} onBack={() => setSelected(null)} />
              : <div className="inbox-empty tall"><MessageCircle size={28} /><p>{tr(l, 'Choose a conversation to read it.', '選擇一則對話來閱讀。', '选择一则对话来阅读。')}</p></div>}
        </section>
      </div>
    </main>
  );
}

function NewThread({ l, uid, onCancel, onCreated }: { l: Language; uid: string | null; onCancel: () => void; onCreated: (id: string) => void }) {
  const client = useQueryClient();
  const create = useCreateSupportThread();
  const [subject, setSubject] = useState('');
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const s = subject.trim();
  const b = text.trim();
  const valid = s.length > 0 && s.length <= SUBJECT_MAX && b.length > 0 && b.length <= TEXT_MAX;
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!valid || create.isPending) { if (!valid) setError(tr(l, 'Please add a subject and a message.', '請填寫主旨與訊息。', '请填写主题与消息。')); return; }
    setError('');
    create.mutate({ data: { subject: s, text: b } }, {
      onSuccess: (conv: SupportConversation) => {
        client.setQueryData(conversationQueryKey(conv.thread.id, uid), conv);
        void client.invalidateQueries({ queryKey: threadsQueryKey(uid) });
        setSubject(''); setText('');
        onCreated(conv.thread.id);
      },
      onError: () => setError(tr(l, 'Your message was not sent. Your draft is kept; please try again.', '訊息未送出，草稿已保留，請再試一次。', '消息未发送，草稿已保留，请再试一次。')),
    });
  };
  return (
    <form className="compose" onSubmit={submit}>
      <button type="button" className="text-next back" onClick={onCancel} data-testid="button-cancel-new"><ArrowLeft size={13} /> {tr(l, 'Back', '返回', '返回')}</button>
      <h2>{tr(l, 'New message', '新訊息', '新消息')}</h2>
      <label className="field-label" htmlFor="support-subject">{tr(l, 'Subject', '主旨', '主题')}</label>
      <input id="support-subject" className="text-field" value={subject} maxLength={SUBJECT_MAX} onChange={(e) => setSubject(e.target.value)} data-testid="input-subject" />
      <small className="counter">{subject.length} / {SUBJECT_MAX}</small>
      <label className="field-label" htmlFor="support-text">{tr(l, 'Message', '訊息內容', '消息内容')}</label>
      <textarea id="support-text" className="text-field area" value={text} maxLength={TEXT_MAX} rows={7} onChange={(e) => setText(e.target.value)} data-testid="input-new-message" />
      <small className="counter">{text.length} / {TEXT_MAX}</small>
      {error ? <div className="alert" role="alert">{error}</div> : null}
      <button type="submit" className="button-primary" disabled={!valid || create.isPending} data-testid="button-send-new">{create.isPending ? tr(l, 'Sending…', '傳送中…', '发送中…') : tr(l, 'Send message', '送出訊息', '发送消息')} <Send size={14} /></button>
    </form>
  );
}

function Conversation({ l, uid, threadId, admin, onBack }: { l: Language; uid: string | null; threadId: string; admin: boolean; onBack: () => void }) {
  const client = useQueryClient();
  const conv = useSupportConversation(threadId, uid);
  const send = useSendSupportMessage();
  const [draft, setDraft] = useState('');
  const [error, setError] = useState('');
  const body = draft.trim();
  const valid = body.length > 0 && body.length <= TEXT_MAX;
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!valid || send.isPending) return;
    setError('');
    send.mutate({ threadId, data: { text: body } }, {
      onSuccess: (result) => {
        client.setQueryData(conversationQueryKey(threadId, uid), result);
        void client.invalidateQueries({ queryKey: threadsQueryKey(uid) });
        setDraft('');
      },
      onError: () => setError(tr(l, 'Your reply was not sent. Your draft is kept; please try again.', '回覆未送出，草稿已保留，請再試一次。', '回复未发送，草稿已保留，请再试一次。')),
    });
  };
  if (conv.isLoading) return <div><div className="skeleton-line w40" /><div className="skeleton-block" /><div className="skeleton-block" style={{ marginTop: 10 }} /></div>;
  if (conv.isError || !conv.data) return <div className="alert" role="alert">{tr(l, 'This conversation could not be loaded.', '無法載入此對話。', '无法加载此对话。')} <button className="button-secondary" onClick={() => void conv.refetch()} data-testid="button-retry-conversation"><RotateCcw size={13} /> {tr(l, 'Try again', '再試一次', '再试一次')}</button></div>;
  const { thread, messages } = conv.data;
  const mine = admin ? 'team' : 'parent';
  return (
    <div className="conversation">
      <button type="button" className="text-next back" onClick={onBack} data-testid="button-back-threads"><ArrowLeft size={13} /> {tr(l, 'All conversations', '所有對話', '所有对话')}</button>
      <h2 data-testid="text-thread-subject">{thread.subject}</h2>
      <ol className="message-list" aria-live="polite">
        {messages.map((m) => (
          <li key={m.id} className={`bubble ${m.author === mine ? 'mine' : ''} ${m.author}`} data-testid={`message-${m.id}`}>
            <span className="bubble-author">{m.author === 'team' ? tr(l, 'Mandarin Garden team', '漢語樂園團隊', '汉语乐园团队') : admin ? tr(l, 'Parent', '家長', '家长') : tr(l, 'You', '您', '您')}</span>
            <p>{m.text}</p>
            <time dateTime={m.createdAt}>{when(l, m.createdAt)}</time>
          </li>
        ))}
      </ol>
      <form className="reply" onSubmit={submit}>
        <label className="field-label" htmlFor="support-reply">{admin ? tr(l, 'Reply as the team', '以團隊身分回覆', '以团队身份回复') : tr(l, 'Your reply', '您的回覆', '您的回复')}</label>
        <textarea id="support-reply" className="text-field area" rows={4} value={draft} maxLength={TEXT_MAX} onChange={(e) => setDraft(e.target.value)} data-testid="input-reply" />
        <div className="reply-foot"><small className="counter">{draft.length} / {TEXT_MAX}</small>
          <button type="submit" className="button-primary" disabled={!valid || send.isPending} data-testid="button-send-reply">{send.isPending ? tr(l, 'Sending…', '傳送中…', '发送中…') : tr(l, 'Send', '送出', '发送')} <Send size={14} /></button></div>
        {error ? <div className="alert" role="alert">{error}</div> : null}
      </form>
    </div>
  );
}
