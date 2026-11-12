import { useState, type FormEvent } from 'react';
import {
  getGetAdminDashboardPasswordStatusQueryKey,
  getGetAdminDashboardQueryKey,
  type GetAdminDashboardParams,
  useCreateAdminDashboardPasswordSession,
  useDeleteAdminDashboardPasswordSession,
  useGetAdminDashboardPasswordStatus,
  useGetAdminDashboard,
  useSetupAdminDashboardPassword,
  useUpdateAdminDashboardPassword,
} from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, ArrowRight, ChartNoAxesColumn, Download, KeyRound, LockKeyhole, LogOut, RotateCcw, ShieldCheck, UserPlus, Users } from 'lucide-react';
import { Link } from 'wouter';
import { useAccountAccess } from '@/hooks/use-account';
import { AccessChecking, AccessError } from '@/components/access-gate';
import type { Language } from '@/lib/garden-data';
import { tr } from '@/lib/playground-copy';

const PAGE_SIZE = 10;

function dateLabel(value: string, language: Language, options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat(language, { timeZone: 'Asia/Hong_Kong', ...options }).format(date);
}

function passwordErrorCopy(error: unknown, copy: (en: string, hant: string, hans: string) => string) {
  const status = typeof error === 'object' && error !== null && 'status' in error
    ? Number((error as { status?: unknown }).status)
    : 0;
  if (status === 429) return copy('Too many attempts. Wait 15 minutes and try again.', '嘗試次數過多，請等候 15 分鐘再試。', '尝试次数过多，请等待 15 分钟再试。');
  if (status === 401) return copy('The password is not correct. Please try again.', '密碼不正確，請再試一次。', '密码不正确，请再试一次。');
  return copy('The request could not be completed. Please retry.', '未能完成操作，請重試。', '未能完成操作，请重试。');
}

type DailyChartPoint = { date: string; value: number };

function DailyActivityPanel({
  language,
  title,
  ariaLabel,
  emptyText,
  points,
  testId,
  color,
}: {
  language: Language;
  title: string;
  ariaLabel: string;
  emptyText: string;
  points: DailyChartPoint[];
  testId: string;
  color: string;
}) {
  const maxValue = Math.max(1, ...points.map((point) => point.value));
  return (
    <section className="admin-panel admin-activity-panel" aria-label={title} data-testid={testId}>
      <div className="admin-panel-heading">
        <div><span className="admin-kicker">{tr(language, 'RECENT ACTIVITY', '近期活動', '近期活动')}</span><h2>{title}</h2></div>
        {points.length > 0 ? <span className="admin-period">{dateLabel(points[0].date, language)} — {dateLabel(points[points.length - 1].date, language)}</span> : null}
      </div>
      {points.length === 0 ? (
        <div className="admin-empty-inline" data-testid={`${testId}-empty`}>{emptyText}</div>
      ) : (
        <div className="admin-chart" role="img" aria-label={ariaLabel}>
          {points.map((point) => (
            <div className="admin-chart-column" key={point.date} data-testid={`${testId}-${point.date}`}>
              <span className="admin-chart-value">{point.value.toLocaleString()}</span>
              <div className="admin-chart-track"><span style={{ transform: `scaleY(${point.value / maxValue})`, backgroundColor: color }} /></div>
              <time dateTime={point.date}>{dateLabel(point.date, language)}</time>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function AdminDashboardPasswordGate({ language: l, userId }: { language: Language; userId: string }) {
  const copy = (en: string, hant: string, hans: string) => tr(l, en, hant, hans);
  const queryClient = useQueryClient();
  const statusKey = [...getGetAdminDashboardPasswordStatusQueryKey(), userId];
  const status = useGetAdminDashboardPasswordStatus({
    query: {
      queryKey: statusKey,
      retry: false,
      refetchOnWindowFocus: true,
      refetchInterval: 60_000,
    },
  });
  const setup = useSetupAdminDashboardPassword();
  const login = useCreateAdminDashboardPasswordSession();
  const lock = useDeleteAdminDashboardPasswordSession();
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState('');
  const [lockError, setLockError] = useState('');
  const [working, setWorking] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setWorking(true);
    try {
      if (status.data?.passwordConfigured) {
        await login.mutateAsync({ data: { password } });
      } else {
        if (password !== confirmation) {
          setError(copy('The passwords do not match.', '兩次輸入的密碼不一致。', '两次输入的密码不一致。'));
          setWorking(false);
          return;
        }
        await setup.mutateAsync({ data: { password, confirmation } });
      }
      setPassword('');
      setConfirmation('');
      await queryClient.invalidateQueries({ queryKey: statusKey });
    } catch (cause) {
      setError(passwordErrorCopy(cause, copy));
    } finally {
      setWorking(false);
    }
  };

  if (status.isLoading || (!status.data && !status.isError)) {
    return (
      <main className="page-shell admin-page" data-testid="status-admin-password-loading">
        <section className="admin-state-panel"><span className="admin-state-icon"><LockKeyhole size={22} /></span><h1>{copy('Checking dashboard access', '正在確認後台權限', '正在确认后台权限')}</h1></section>
      </main>
    );
  }
  if (status.isError) {
    return (
      <main className="page-shell admin-page" data-testid="status-admin-password-error">
        <section className="admin-state-panel" role="alert"><span className="admin-state-icon"><LockKeyhole size={22} /></span><h1>{copy('Could not verify dashboard access', '未能確認後台權限', '未能确认后台权限')}</h1><p>{copy('Please retry. Your administrator account is still required.', '請重試；仍須使用管理員帳戶登入。', '请重试；仍须使用管理员账户登录。')}</p><button type="button" className="button-secondary" onClick={() => void status.refetch()}><RotateCcw size={14} /> {copy('Try again', '再試一次', '再试一次')}</button></section>
      </main>
    );
  }
  if (status.data?.passwordConfigured && status.data.passwordAuthenticated) {
    return <AdminDashboardData language={l} userId={userId} lockError={lockError} onLock={async () => {
      setLockError('');
      try {
        await lock.mutateAsync();
        await queryClient.invalidateQueries({ queryKey: statusKey });
      } catch {
        setLockError(copy('Could not lock the dashboard. Please retry.', '未能鎖定後台，請重試。', '未能锁定后台，请重试。'));
      }
    }} />;
  }

  const isSetup = !status.data?.passwordConfigured;
  return (
    <main className="page-shell admin-page" data-testid={isSetup ? 'page-admin-password-setup' : 'page-admin-password-login'}>
      <section className="admin-state-panel admin-password-panel">
        <span className="admin-state-icon">{isSetup ? <KeyRound size={22} /> : <LockKeyhole size={22} />}</span>
        <h1>{isSetup ? copy('Set a dashboard password', '設定後台密碼', '设置后台密码') : copy('Enter the dashboard password', '輸入後台密碼', '输入后台密码')}</h1>
        <p>{isSetup
          ? copy('Create a password of at least 8 characters. It is separate from your administrator account sign-in.', '請設定至少 8 個字元的密碼。此密碼與管理員帳戶登入密碼分開。', '请设置至少 8 个字符的密码。此密码与管理员账户登录密码分开。')
          : copy('Your administrator account and this password are both required. The dashboard locks after 8 hours.', '須同時通過管理員帳戶及此密碼驗證；後台工作階段會在 8 小時後鎖定。', '须同时通过管理员账户及此密码验证；后台会话将在 8 小时后锁定。')}</p>
        <form className="admin-password-form" onSubmit={(event) => void submit(event)}>
          <label htmlFor="admin-dashboard-password">{copy('Dashboard password', '後台密碼', '后台密码')}</label>
          <input id="admin-dashboard-password" className="admin-password-input" type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete={isSetup ? 'new-password' : 'current-password'} minLength={isSetup ? 8 : 1} maxLength={128} required data-testid="input-admin-dashboard-password" />
          {isSetup ? <>
            <label htmlFor="admin-dashboard-password-confirm">{copy('Confirm password', '再次輸入密碼', '再次输入密码')}</label>
            <input id="admin-dashboard-password-confirm" className="admin-password-input" type="password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} autoComplete="new-password" minLength={8} maxLength={128} required data-testid="input-admin-dashboard-password-confirm" />
          </> : null}
          {error ? <p className="admin-password-error" role="alert" data-testid="error-admin-dashboard-password">{error}</p> : null}
          <button type="submit" className="button-primary" disabled={working} data-testid="button-admin-dashboard-password-submit">
            <LockKeyhole size={15} /> {working
              ? copy('Please wait…', '請稍候…', '请稍候…')
              : isSetup ? copy('Set password and continue', '設定密碼並繼續', '设置密码并继续') : copy('Unlock dashboard', '解鎖後台', '解锁后台')}
          </button>
        </form>
      </section>
    </main>
  );
}

function AdminDashboardData({ language: l, userId, onLock, lockError }: { language: Language; userId: string; onLock: () => Promise<void>; lockError: string }) {
  const copy = (en: string, hant: string, hans: string) => tr(l, en, hant, hans);
  const [offset, setOffset] = useState(0);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordConfirmation, setNewPasswordConfirmation] = useState('');
  const [passwordFormError, setPasswordFormError] = useState('');
  const [passwordFormSuccess, setPasswordFormSuccess] = useState('');
  const changePassword = useUpdateAdminDashboardPassword();
  const queryClient = useQueryClient();
  const params: GetAdminDashboardParams = { offset, limit: PAGE_SIZE };
  const dashboard = useGetAdminDashboard(params, {
    query: {
      enabled: true,
      queryKey: [...getGetAdminDashboardQueryKey(params), userId],
      retry: 1,
      refetchOnWindowFocus: true,
      refetchInterval: 60_000,
    },
  });
  const data = dashboard.data;

  const submitPasswordChange = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPasswordFormError('');
    setPasswordFormSuccess('');
    if (newPassword !== newPasswordConfirmation) {
      setPasswordFormError(copy('The new passwords do not match.', '新密碼不一致。', '新密码不一致。'));
      return;
    }
    try {
      await changePassword.mutateAsync({ data: {
        currentPassword,
        password: newPassword,
        confirmation: newPasswordConfirmation,
      } });
      setCurrentPassword('');
      setNewPassword('');
      setNewPasswordConfirmation('');
      setPasswordFormSuccess(copy('Dashboard password changed. Other password sessions were closed.', '後台密碼已更改，其他密碼工作階段已關閉。', '后台密码已更改，其他密码会话已关闭。'));
      await queryClient.invalidateQueries({ queryKey: getGetAdminDashboardPasswordStatusQueryKey() });
    } catch (cause) {
      setPasswordFormError(passwordErrorCopy(cause, copy));
    }
  };

  return (
    <main className="page-shell admin-page" data-testid="page-admin-dashboard">
      <section className="admin-heading">
        <div>
          <div className="eyebrow"><ShieldCheck size={14} /> Mandarin Garden · {copy('Administration', '管理後台', '管理后台')}</div>
          <h1>{copy('Garden overview', '樂園總覽', '乐园总览')}</h1>
          <p>{copy(
            'Daily counts use Hong Kong time. Page views and install clicks start after this feature is published; registration history covers the recent 30 days.',
            '每日數據按香港時間統計；頁面瀏覽和安裝點擊由功能發布後開始累計，註冊紀錄顯示最近 30 天。',
            '每日数据按香港时间统计；页面浏览和安装点击从功能发布后开始累计，注册记录显示最近 30 天。',
          )}</p>
          <div className="admin-header-actions">
            <button type="button" className="admin-page-button" onClick={() => { setChangePasswordOpen((open) => !open); setPasswordFormError(''); setPasswordFormSuccess(''); }} data-testid="button-admin-change-password"><KeyRound size={14} /> {copy('Change password', '更改密碼', '更改密码')}</button>
            <button type="button" className="admin-page-button" onClick={() => void onLock()} data-testid="button-admin-lock-dashboard"><LogOut size={14} /> {copy('Lock dashboard', '鎖定後台', '锁定后台')}</button>
          </div>
        </div>
        <span className="admin-secure-note"><ShieldCheck size={15} /> {copy('Private team view', '僅管理團隊可見', '仅管理团队可见')}</span>
      </section>
      {lockError ? <p className="admin-password-error" role="alert">{lockError}</p> : null}

      {changePasswordOpen ? (
        <form className="admin-panel admin-password-form admin-password-change" onSubmit={(event) => void submitPasswordChange(event)} data-testid="form-admin-change-password">
          <h2>{copy('Change dashboard password', '更改後台密碼', '更改后台密码')}</h2>
          <label htmlFor="admin-current-password">{copy('Current password', '目前密碼', '当前密码')}</label>
          <input id="admin-current-password" className="admin-password-input" type="password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} autoComplete="current-password" maxLength={128} required />
          <label htmlFor="admin-new-password">{copy('New password', '新密碼', '新密码')}</label>
          <input id="admin-new-password" className="admin-password-input" type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} autoComplete="new-password" minLength={8} maxLength={128} required />
          <label htmlFor="admin-new-password-confirm">{copy('Confirm new password', '再次輸入新密碼', '再次输入新密码')}</label>
          <input id="admin-new-password-confirm" className="admin-password-input" type="password" value={newPasswordConfirmation} onChange={(event) => setNewPasswordConfirmation(event.target.value)} autoComplete="new-password" minLength={8} maxLength={128} required />
          {passwordFormError ? <p className="admin-password-error" role="alert">{passwordFormError}</p> : null}
          {passwordFormSuccess ? <p className="admin-password-success" role="status">{passwordFormSuccess}</p> : null}
          <button type="submit" className="button-primary" disabled={changePassword.isPending}><KeyRound size={15} /> {changePassword.isPending ? copy('Please wait…', '請稍候…', '请稍候…') : copy('Save new password', '儲存新密碼', '保存新密码')}</button>
        </form>
      ) : null}

      {dashboard.isLoading ? (
        <section className="admin-loading" aria-label="Loading dashboard" data-testid="status-admin-loading">
          <div className="admin-skeleton admin-skeleton-stat" />
          <div className="admin-skeleton admin-skeleton-stat" />
          <div className="admin-skeleton admin-skeleton-stat" />
          <div className="admin-skeleton admin-skeleton-stat" />
          <div className="admin-skeleton admin-skeleton-chart" />
          <div className="admin-skeleton admin-skeleton-chart" />
          <div className="admin-skeleton admin-skeleton-chart" />
          <div className="admin-skeleton admin-skeleton-table" />
        </section>
      ) : dashboard.isError ? (
        <section className="admin-state-panel" role="alert" data-testid="status-admin-error">
          <span className="admin-state-icon"><ChartNoAxesColumn size={22} /></span>
          <h2>{copy('Dashboard data could not load', '無法載入後台資料', '无法加载后台资料')}</h2>
          <p>{copy('Please try again. Your access is checked securely by the server.', '請重試；伺服器會核實管理員權限。', '请重试；服务器会核实管理员权限。')}</p>
          <button type="button" className="button-secondary" onClick={() => void dashboard.refetch()} data-testid="button-retry-admin"><RotateCcw size={14} /> {copy('Try again', '再試一次', '再试一次')}</button>
        </section>
      ) : data ? (
        <>
          <section className="admin-metrics" aria-label={copy('Garden metrics', '樂園數據', '乐园数据')}>
            <article className="admin-metric-card" data-testid="metric-member-count">
              <span className="admin-metric-label"><Users size={15} /> {copy('Registered accounts', '註冊帳戶', '注册账户')}</span>
              <strong>{data.memberCount.toLocaleString()}</strong>
              <small>{copy('Includes team accounts', '包括團隊帳戶', '包括团队账户')}</small>
            </article>
            <article className="admin-metric-card admin-metric-accent" data-testid="metric-page-views">
              <span className="admin-metric-label"><ChartNoAxesColumn size={15} /> {copy('Page views', '頁面瀏覽次數', '页面浏览次数')}</span>
              <strong>{data.totalPageViews.toLocaleString()}</strong>
              <small>{copy('Page loads, not unique visitors', '頁面載入次數，並非不重複訪客人數', '页面加载次数，并非独立访客人数')}</small>
            </article>
            <article className="admin-metric-card" data-testid="metric-app-install-clicks">
              <span className="admin-metric-label"><Download size={15} /> {copy('App install clicks', 'App 安裝按鈕點擊', 'App 安装按钮点击')}</span>
              <strong>{data.totalAppInstallClicks.toLocaleString()}</strong>
              <small>{copy('Clicks, not confirmed installs', '按鈕點擊，不代表已完成安裝', '按钮点击，不代表已完成安装')}</small>
            </article>
            <article className="admin-metric-card" data-testid="metric-today-registrations">
              <span className="admin-metric-label"><UserPlus size={15} /> {copy('New accounts today', '今日新註冊', '今日新注册')}</span>
              <strong>{(data.dailyRegistrations.at(-1)?.registrations ?? 0).toLocaleString()}</strong>
              <small>{copy('Hong Kong calendar day', '按香港時間統計', '按香港时间统计')}</small>
            </article>
          </section>

          <DailyActivityPanel
            language={l}
            title={copy('Daily page views', '每日頁面瀏覽', '每日页面浏览')}
            ariaLabel={copy('Daily page views chart', '每日頁面瀏覽圖表', '每日页面浏览图表')}
            emptyText={copy('No page views recorded yet.', '暫無頁面瀏覽紀錄。', '暂无页面浏览记录。')}
            points={data.dailyPageViews.map((day) => ({ date: day.date, value: day.pageViews }))}
            testId="section-daily-page-views"
            color="#73916b"
          />
          <DailyActivityPanel
            language={l}
            title={copy('Daily app install button clicks', '每日 App 安裝按鈕點擊', '每日 App 安装按钮点击')}
            ariaLabel={copy('Daily app install button clicks chart', '每日 App 安裝按鈕點擊圖表', '每日 App 安装按钮点击图表')}
            emptyText={copy('No install button clicks recorded yet.', '暫無安裝按鈕點擊紀錄。', '暂无安装按钮点击记录。')}
            points={data.dailyAppInstallClicks.map((day) => ({ date: day.date, value: day.appInstallClicks }))}
            testId="section-daily-app-install-clicks"
            color="#c08a57"
          />
          <DailyActivityPanel
            language={l}
            title={copy('Daily new registrations', '每日新註冊人數', '每日新注册人数')}
            ariaLabel={copy('Daily new registrations chart', '每日新註冊人數圖表', '每日新注册人数图表')}
            emptyText={copy('No recent registrations recorded.', '近期沒有新註冊紀錄。', '近期没有新注册记录。')}
            points={data.dailyRegistrations.map((day) => ({ date: day.date, value: day.registrations }))}
            testId="section-daily-registrations"
            color="#668f96"
          />

          <section className="admin-panel admin-members-panel" aria-labelledby="admin-members-title" data-testid="section-admin-members">
            <div className="admin-panel-heading">
              <div><span className="admin-kicker">{copy('ACCOUNT DIRECTORY', '帳戶清單', '账户清单')}</span><h2 id="admin-members-title">{copy('Registrations', '註冊紀錄', '注册记录')}</h2></div>
              <span className="admin-page-count">{copy(`${data.memberCount.toLocaleString()} total`, `共 ${data.memberCount.toLocaleString()} 個`, `共 ${data.memberCount.toLocaleString()} 个`)}</span>
            </div>
            {data.members.length === 0 ? (
                <div className="admin-empty" data-testid="status-no-members">
                <span className="admin-state-icon"><Users size={22} /></span>
                  <h3>{copy('No accounts to show', '目前沒有帳戶', '目前没有账户')}</h3>
                  <p>{copy('There are no registered accounts on this page.', '此頁沒有註冊帳戶。', '此页没有注册账户。')}</p>
              </div>
            ) : (
              <div className="admin-table-wrap">
                <table className="admin-table">
                    <thead><tr><th scope="col">{copy('Account', '帳戶', '账户')}</th><th scope="col">{copy('Email', '電郵', '电子邮件')}</th><th scope="col">{copy('Registered', '註冊日期', '注册日期')}</th></tr></thead>
                  <tbody>
                    {data.members.map((member) => (
                      <tr key={member.id} data-testid={`row-admin-member-${member.id}`}>
                          <td><span className="admin-member-name">{member.name === 'Mandarin Garden team' ? copy('Mandarin Garden team', '漢語樂園團隊', '汉语乐园团队') : member.name || copy('Name not provided', '未提供名稱', '未提供名称')}</span></td>
                          <td>{member.email || copy('Not shown', '不顯示', '不显示')}</td>
                          <td><time dateTime={member.createdAt}>{dateLabel(member.createdAt, l, { year: 'numeric', month: 'short', day: 'numeric' })}</time></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div className="admin-pagination" aria-label={copy('Registration pages', '註冊紀錄頁數', '注册记录页数')}>
              <span data-testid="text-admin-page-range">{data.members.length ? `${offset + 1}–${offset + data.members.length}` : '0'} / {data.memberCount.toLocaleString()}</span>
              <div>
                <button type="button" className="admin-page-button" onClick={() => setOffset((current) => Math.max(0, current - PAGE_SIZE))} disabled={offset === 0 || dashboard.isFetching} aria-label={copy('Previous page', '上一頁', '上一页')} data-testid="button-admin-previous"><ArrowLeft size={15} /> {copy('Previous', '上一頁', '上一页')}</button>
                <button type="button" className="admin-page-button" onClick={() => { if (data.nextOffset !== null) setOffset(data.nextOffset); }} disabled={data.nextOffset === null || dashboard.isFetching} aria-label={copy('Next page', '下一頁', '下一页')} data-testid="button-admin-next">{copy('Next', '下一頁', '下一页')} <ArrowRight size={15} /></button>
              </div>
            </div>
          </section>
        </>
      ) : (
        <section className="admin-state-panel" data-testid="status-admin-empty">
          <span className="admin-state-icon"><ChartNoAxesColumn size={22} /></span>
          <h2>{copy('No dashboard data available', '暫無後台資料', '暂无后台资料')}</h2>
          <p>{copy('The server returned no dashboard summary.', '伺服器目前沒有可顯示的總覽資料。', '服务器目前没有可显示的总览资料。')}</p>
        </section>
      )}
    </main>
  );
}

export default function AdminPage({ language: l }: { language: Language }) {
  const access = useAccountAccess();
  if (!access.isLoaded) return <AccessChecking l={l} />;
  if (!access.isSignedIn) {
    const copy = (en: string, hant: string, hans: string) => tr(l, en, hant, hans);
    return (
      <main className="page-shell admin-page" data-testid="page-admin-sign-in-required">
        <section className="admin-state-panel">
          <span className="admin-state-icon"><ShieldCheck size={22} /></span>
          <h1>{copy('Sign in to continue', '登入後繼續', '登录后继续')}</h1>
          <p>{copy('The administrator dashboard is available to authorized team accounts.', '管理後台只供獲授權的團隊帳戶使用。', '管理后台只供获授权的团队账户使用。')}</p>
          <Link href="/sign-in" className="button-primary" data-testid="link-admin-sign-in">{copy('Sign in', '登入', '登录')}</Link>
        </section>
      </main>
    );
  }
  if (access.query.isError) return <AccessError l={l} onRetry={() => void access.query.refetch()} />;
  if (!access.data) return <AccessChecking l={l} />;
  if (!access.isAdmin) {
    const copy = (en: string, hant: string, hans: string) => tr(l, en, hant, hans);
    return (
      <main className="page-shell admin-page" data-testid="panel-admin-denied">
        <section className="admin-state-panel admin-denied">
          <span className="admin-state-icon"><ShieldCheck size={22} /></span>
          <h1>{copy('This area is for the Mandarin Garden team.', '此頁僅供漢語樂園團隊使用。', '此页仅供汉语乐园团队使用。')}</h1>
          <p>{copy('Your account does not have administrator access. The dashboard remains protected by server-side access checks.', '此帳戶沒有管理員權限；伺服器仍會保護後台資料。', '此账户没有管理员权限；服务器仍会保护后台资料。')}</p>
          <Link href="/home" className="button-secondary" data-testid="link-admin-denied-home">{copy('Return to the garden', '返回樂園', '返回乐园')}</Link>
        </section>
      </main>
    );
  }
  return <AdminDashboardPasswordGate language={l} userId={access.uid ?? ''} />;
}
