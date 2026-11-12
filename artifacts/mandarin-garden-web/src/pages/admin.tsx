import { useState } from 'react';
import { useGetAdminDashboard, getGetAdminDashboardQueryKey, type GetAdminDashboardParams } from '@workspace/api-client-react';
import { ArrowLeft, ArrowRight, ChartNoAxesColumn, RotateCcw, ShieldCheck, Users } from 'lucide-react';
import { Link } from 'wouter';
import { useAccountAccess } from '@/hooks/use-account';
import { AccessChecking, AccessError } from '@/components/access-gate';
import type { Language } from '@/lib/garden-data';
import { tr } from '@/lib/playground-copy';

const PAGE_SIZE = 10;

function dateLabel(value: string, language: Language, options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat(language, options).format(date);
}

function AdminDashboardData({ language: l }: { language: Language }) {
  const copy = (en: string, hant: string, hans: string) => tr(l, en, hant, hans);
  const [offset, setOffset] = useState(0);
  const params: GetAdminDashboardParams = { offset, limit: PAGE_SIZE };
  const dashboard = useGetAdminDashboard(params, {
    query: { enabled: true, queryKey: getGetAdminDashboardQueryKey(params), retry: 1 },
  });
  const data = dashboard.data;
  const maxViews = Math.max(1, ...(data?.dailyPageViews.map((day) => day.pageViews) ?? []));

  return (
    <main className="page-shell admin-page" data-testid="page-admin-dashboard">
      <section className="admin-heading">
        <div>
          <div className="eyebrow"><ShieldCheck size={14} /> Mandarin Garden · {copy('Administration', '管理後台', '管理后台')}</div>
          <h1>{copy('Garden overview', '樂園總覽', '乐园总览')}</h1>
          <p>{copy('Registered accounts and page-view totals. Counts begin after this feature is published.', '查看註冊帳戶與頁面瀏覽總數；數據由此功能發布後開始累計。', '查看注册账户与页面浏览总数；数据从此功能发布后开始累计。')}</p>
        </div>
        <span className="admin-secure-note"><ShieldCheck size={15} /> {copy('Private team view', '僅管理團隊可見', '仅管理团队可见')}</span>
      </section>

      {dashboard.isLoading ? (
        <section className="admin-loading" aria-label="Loading dashboard" data-testid="status-admin-loading">
          <div className="admin-skeleton admin-skeleton-stat" />
          <div className="admin-skeleton admin-skeleton-stat" />
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
          </section>

          <section className="admin-panel admin-activity-panel" aria-labelledby="admin-activity-title" data-testid="section-daily-page-views">
            <div className="admin-panel-heading">
              <div><span className="admin-kicker">{copy('RECENT ACTIVITY', '近期活動', '近期活动')}</span><h2 id="admin-activity-title">{copy('Daily page views', '每日頁面瀏覽', '每日页面浏览')}</h2></div>
              {data.dailyPageViews.length > 0 ? <span className="admin-period">{dateLabel(data.dailyPageViews[0].date, l)} — {dateLabel(data.dailyPageViews[data.dailyPageViews.length - 1].date, l)}</span> : null}
            </div>
            {data.dailyPageViews.length === 0 ? (
                <div className="admin-empty-inline" data-testid="status-no-page-views">{copy('No page views recorded yet.', '暫無頁面瀏覽紀錄。', '暂无页面浏览记录。')}</div>
            ) : (
                  <div className="admin-chart" role="img" aria-label={copy('Daily page views chart', '每日頁面瀏覽圖表', '每日页面浏览图表')}>
                {data.dailyPageViews.map((day) => (
                  <div className="admin-chart-column" key={day.date} data-testid={`bar-page-views-${day.date}`}>
                    <span className="admin-chart-value">{day.pageViews.toLocaleString()}</span>
                    <div className="admin-chart-track"><span style={{ transform: `scaleY(${day.pageViews / maxViews})` }} /></div>
                    <time dateTime={day.date}>{dateLabel(day.date, l)}</time>
                  </div>
                ))}
              </div>
            )}
          </section>

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
  return <AdminDashboardData language={l} />;
}
