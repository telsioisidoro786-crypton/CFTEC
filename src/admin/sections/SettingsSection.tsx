import type { Dispatch, FormEvent, SetStateAction } from 'react'
import { Check, ChevronRight, Database, KeyRound, Plus, Power, ShieldCheck, Sparkles, Trash2, X } from 'lucide-react'
import { IconLock } from '../../components/animIcons'
import { Avatar, AvatarFallback } from '../../components/ui/avatar'
import { Button } from '../../components/ui/button'
import { Card } from '../../components/ui/card'
import type { AdminUserRow, LogErroRow, SessaoActiva } from '../types'

// Fase Settings — definições do painel extraídas do AdminDashboard (JSX byte-a-byte, estado via props)
type UpgradePedido = { id: string; empresa: string; email: string; itens: string; total: string; estado: 'pendente' | 'autorizado' | 'recusado'; nota_dev?: string | null; resolvido_por?: string | null; created_at: string }

type SettingsSectionProps = {
  adminUser: { name?: string; email?: string; level?: string | null } | null
  ehDev: boolean
  upgradePedidos: UpgradePedido[]
  setShowUpgrade: (valor: boolean) => void
  users: AdminUserRow[]
  ROLES: string[]
  labelRole: (role: string) => string
  updateUser: (user: AdminUserRow, payload: Partial<{ name: string; role: string; is_active: boolean; password: string }>) => Promise<void> | void
  setShowUserForm: (valor: boolean) => void
  setDeletingUserId: (valor: string | null) => void
  setPwResetUser: (valor: AdminUserRow | null) => void
  setPwResetForm: (valor: { pw: string; pw2: string }) => void
  portalSettings: Record<string, string>
  setPortalSettings: Dispatch<SetStateAction<Record<string, string>>>
  savingPortal: boolean
  handlePortalSave: (event: FormEvent<HTMLFormElement>) => Promise<void> | void
  testarWhatsapp: () => Promise<void> | void
  logErrosVer: 'activos' | 'resolvidos'
  setLogErrosVer: Dispatch<SetStateAction<'activos' | 'resolvidos'>>
  carregarLogErros: (ver: 'activos' | 'resolvidos') => Promise<void> | void
  logErros: LogErroRow[]
  logErrosAResolvidos: boolean
  resolverLogErros: () => Promise<void> | void
  profileName: string
  setProfileName: Dispatch<SetStateAction<string>>
  savingProfile: boolean
  handleProfileSave: (event: FormEvent<HTMLFormElement>) => Promise<void> | void
  pwCurrent: string
  setPwCurrent: Dispatch<SetStateAction<string>>
  pwNew: string
  setPwNew: Dispatch<SetStateAction<string>>
  pwConfirm: string
  setPwConfirm: Dispatch<SetStateAction<string>>
  savingPassword: boolean
  handlePasswordChange: (event: FormEvent<HTMLFormElement>) => Promise<void> | void
  twofaEstado: 'loading' | 'desligado' | 'activado'
  busy2fa: boolean
  setup2fa: { secret: string; otpauth: string } | null
  setSetup2fa: Dispatch<SetStateAction<{ secret: string; otpauth: string } | null>>
  codigo2fa: string
  setCodigo2fa: Dispatch<SetStateAction<string>>
  pw2fa: string
  setPw2fa: Dispatch<SetStateAction<string>>
  desactivar2fa: (event: FormEvent<HTMLFormElement>) => Promise<void> | void
  activar2fa: (event: FormEvent<HTMLFormElement>) => Promise<void> | void
  iniciar2fa: () => Promise<void> | void
  sessoes: SessaoActiva[] | null
  revogando: boolean
  revogarOutras: () => Promise<void> | void
  revogarSessao: (jti: string) => Promise<void> | void
  formatDate: (value: string) => string
}

export function SettingsSection({ adminUser, ehDev, upgradePedidos, setShowUpgrade, users, ROLES, labelRole, updateUser, setShowUserForm, setDeletingUserId, setPwResetUser, setPwResetForm, portalSettings, setPortalSettings, savingPortal, handlePortalSave, testarWhatsapp, logErrosVer, setLogErrosVer, carregarLogErros, logErros, logErrosAResolvidos, resolverLogErros, profileName, setProfileName, savingProfile, handleProfileSave, pwCurrent, setPwCurrent, pwNew, setPwNew, pwConfirm, setPwConfirm, savingPassword, handlePasswordChange, twofaEstado, busy2fa, setup2fa, setSetup2fa, codigo2fa, setCodigo2fa, pw2fa, setPw2fa, desactivar2fa, activar2fa, iniciar2fa, sessoes, revogando, revogarOutras, revogarSessao, formatDate }: SettingsSectionProps) {
  return (
    <div className="settings-grid">
          {adminUser?.level === 'super_admin' && <Card className="admin-panel settings-card settings-card--upg">
            <div className="admin-panel-head"><div><span className="admin-panel-kicker">PAGAMENTO · MANUTENÇÃO</span><h2>Pagamento para a Manutenção</h2></div>
              <Button type="button" size="sm" onClick={() => setShowUpgrade(true)}><Sparkles size={14} /> Ver planos & solicitar</Button>
            </div>
            <p>Escolha os módulos, utilizadores ou armazenamento extra de que precisa e envie o pedido — a Nexora Systems (Developer) autoriza e activa por cá.</p>
            {upgradePedidos.length > 0 && <div className="upg-lista">
              {upgradePedidos.map(p => (
                <div className="upg-row" key={p.id}>
                  <div className="upg-row-main">
                    <span className="upg-total">{p.total}</span>
                    <span className="upg-data">{formatDate(p.created_at)}</span>
                    <span className={`upg-chip upg-chip--${p.estado}`}>{p.estado === 'pendente' ? 'Pendente' : p.estado === 'autorizado' ? 'Autorizado' : 'Recusado'}</span>
                  </div>
                  <div className="upg-itens">{p.itens.split('\n').filter(Boolean).join(' · ')}</div>
                  {p.nota_dev && <div className="upg-nota">Nota da Nexora: {p.nota_dev}</div>}
                </div>
              ))}
            </div>}
          </Card>}
          {['super_admin', 'developer'].includes(adminUser?.level || 'super_admin') && <Card className="admin-panel settings-card settings-card--portal"><div className="admin-panel-head"><div><span className="admin-panel-kicker">SITE PÚBLICO</span><h2>Contactos, pagamento & banner</h2></div><a className="settings-site-link" href="/" target="_blank" rel="noreferrer noopener">Abrir site <ChevronRight size={14} /></a></div><p>Estes valores alimentam o rodapé, a secção de contactos, o checkout B2B (IBAN + WhatsApp) e o banner superior do site. Guardar aplica ao site no próximo carregamento dos visitantes.</p><form className="settings-form" onSubmit={handlePortalSave}><div className="settings-grid-2">
          <label className="settings-field">WhatsApp comercial<small>Exemplo: 244933609090 (link wa.me nos cards e botões)</small><input value={portalSettings.whatsapp_comercial || ''} onChange={(e) => setPortalSettings(p => ({ ...p, whatsapp_comercial: e.target.value }))} placeholder="244933609090" maxLength={40} /></label>
          <label className="settings-field">WhatsApp de apoio técnico<small>Apoio Técnico a Clientes no site — chamados e suporte. Vazio = usa o comercial.</small><input value={portalSettings.whatsapp_tecnico || ''} onChange={(e) => setPortalSettings(p => ({ ...p, whatsapp_tecnico: e.target.value }))} placeholder="244933609091 (opcional)" maxLength={40} /></label>
          <label className="settings-field">E-mail de contacto<small>Rodapé e «Escreva-nos»</small><input type="email" value={portalSettings.email_contacto || ''} onChange={(e) => setPortalSettings(p => ({ ...p, email_contacto: e.target.value }))} placeholder="hello@cftec.co" maxLength={160} /></label>
          <label className="settings-field">Telefone de directório<small>Link «tel:» no rodapé</small><input value={portalSettings.telefone_directorio || ''} onChange={(e) => setPortalSettings(p => ({ ...p, telefone_directorio: e.target.value }))} placeholder="+244 923 000 000" maxLength={40} /></label>
          <label className="settings-field">IBAN de pagamento<small>Mostrado na confirmação dos pedidos de licença</small><input value={portalSettings.iban_cftec || ''} onChange={(e) => setPortalSettings(p => ({ ...p, iban_cftec: e.target.value }))} placeholder="AO06 ..." maxLength={40} className="iban-input" /></label>
          <label className="settings-field">Meta mensal de receita (Kz)<small>Interno — barra de progresso nos Relatórios & Metas do comercial. 0 = sem meta.</small><input type="number" min="0" value={portalSettings.meta_mensal_kz || ''} onChange={(e) => setPortalSettings(p => ({ ...p, meta_mensal_kz: e.target.value }))} placeholder="Ex.: 2500000" maxLength={12} /></label>
          <label className="settings-field">LinkedIn (URL)<input value={portalSettings.linkedin_url || ''} onChange={(e) => setPortalSettings(p => ({ ...p, linkedin_url: e.target.value }))} placeholder="https://www.linkedin.com/company/cftec" maxLength={200} /></label>
          <label className="settings-field">X / Twitter (URL)<input value={portalSettings.x_url || ''} onChange={(e) => setPortalSettings(p => ({ ...p, x_url: e.target.value }))} placeholder="https://x.com/cftec" maxLength={200} /></label>
          <label className="settings-checkbox settings-banner-checkbox"><input type="checkbox" checked={portalSettings.banner_activo === 'true'} onChange={(e) => setPortalSettings(p => ({ ...p, banner_activo: e.target.checked ? 'true' : 'false' }))} /><span>Banner superior activo no site</span></label>
          <label className="settings-field settings-field--full">Mensagem do banner<input value={portalSettings.banner_mensagem || ''} onChange={(e) => setPortalSettings(p => ({ ...p, banner_mensagem: e.target.value }))} placeholder="Ex.: Novo PalancaSoft ERP 2026 já disponível — fale connosco!" maxLength={160} disabled={portalSettings.banner_activo !== 'true'} /></label>
          <label className="settings-field settings-field--full">E-mail de notificações<small>Aviso automático a este destino com cada contacto novo e pedido de licença (Resend). Vazio = desactivado.</small><input type="email" value={portalSettings.notify_email || ''} onChange={(e) => setPortalSettings(p => ({ ...p, notify_email: e.target.value }))} placeholder="ex.: vigilante@cftec.co" maxLength={160} /></label>
          </div><div className="settings-actions"><Button type="submit" size="sm" disabled={savingPortal}>{savingPortal ? 'A guardar…' : <><Check size={14} /> Guardar e aplicar ao site</>}</Button></div></form></Card>}
          {['super_admin', 'developer'].includes(adminUser?.level || 'super_admin') && <Card className="admin-panel settings-card"><div className="admin-panel-head"><div><span className="admin-panel-kicker">NOTIFICAÇÕES · WHATSAPP / TELEGRAM GRÁTIS</span><h2>Avisos no teu telemóvel</h2></div></div>
            <p>Alertas instantâneos (gratuitos, via CallMeBot) sempre que: <b>empresa se registar no portal</b>, <b>chegar um chamado</b>, <b>um pedido de licença</b>, <b>liquidação confirmada</b> ou <b>renovação criar oportunidades</b> no funil. O e-mail formal segue em paralelo via Resend.</p>
            <form className="settings-form" onSubmit={handlePortalSave}>
              <div className="settings-row">
                <label className="settings-field">Telefone do destinatário (WhatsApp)<small>Com indicativo do país. Ex.: +244 957834748</small><input value={portalSettings.callmebot_phone || ''} onChange={(e) => setPortalSettings(p => ({ ...p, callmebot_phone: e.target.value }))} placeholder="+244 9xx xxx xxx" maxLength={25} /></label>
                <label className="settings-field">API key do CallMeBot (WhatsApp)<small>Como obter: callmebot.com → Free API → WhatsApp. Quando o bot tiver vagas, adiciona o número do bot aos contactos do WhatsApp do destinatário e manda «I allow callmebot to send me messages» — o bot responde com a key. (Sem vagas hoje? Usa o Telegram em baixo — activa logo.)</small><input value={portalSettings.callmebot_key || ''} onChange={(e) => setPortalSettings(p => ({ ...p, callmebot_key: e.target.value }))} placeholder="ex.: 392174" maxLength={30} /></label>
              </div>
              <label className="settings-field">Utilizador Telegram para alertas (recomendado — activo já)<small>1. Abre o Telegram e manda «/start» ao bot @CallMeBot_txtbot (uma única vez, é a autorização). 2. Escreve aqui o teu @utilizador (ex.: @telsio). Se o WhatsApp estiver configurado, os dois recebem; se só o Telegram estiver, ele sozinho entrega os alertas.</small><input value={portalSettings.telegram_alert_user || ''} onChange={(e) => setPortalSettings(p => ({ ...p, telegram_alert_user: e.target.value }))} placeholder="@teu_utilizador" maxLength={64} /></label>
              <div className="settings-actions">
                <Button type="button" variant="outline" size="sm" onClick={() => void testarWhatsapp()}>Testar agora</Button>
                <Button type="submit" size="sm" disabled={savingPortal}>{savingPortal ? 'A guardar…' : <><Check size={14} /> Guardar chaves</>}</Button>
              </div>
            </form>
          </Card>}
          {['super_admin', 'developer'].includes(adminUser?.level || 'super_admin') && <Card className="admin-panel settings-card"><div className="admin-panel-head"><div><span className="admin-panel-kicker">MONITORIZAÇÃO · ERROS</span><h2>Diário de erros (browser + server)</h2></div></div>
            <p>Cada erro JS do site/painel/portal e cada falha do servidor cai na tabela <code>logs_erros</code> — sem Sentry, sem serviço externo. Fecha o(s) erro(s) depois de tratado(s).</p>
            <div className="settings-actions" style={{ marginBottom: 12 }}>
              <Button type="button" size="sm" variant={logErrosVer === 'activos' ? 'default' : 'outline'} onClick={() => { setLogErrosVer('activos'); void carregarLogErros('activos') }}>Activos</Button>
              <Button type="button" size="sm" variant={logErrosVer === 'resolvidos' ? 'default' : 'outline'} onClick={() => { setLogErrosVer('resolvidos'); void carregarLogErros('resolvidos') }}>Resolvidos</Button>
              <Button type="button" size="sm" variant="outline" onClick={() => void carregarLogErros(logErrosVer)}>Atualizar</Button>
              {logErrosVer === 'activos' && logErros.length > 0 && <Button type="button" size="sm" disabled={logErrosAResolvidos} onClick={() => void resolverLogErros()}>{logErrosAResolvidos ? 'A resolver…' : <>Marcar todos resolvidos</>}</Button>}
            </div>
            {logErros.length === 0 ? <small className="settings-hint">{logErrosVer === 'activos' ? 'Sem erros activos — estão em silêncio (ou o SQL do logs_erros ainda não correu; silêncio até confirmação).' : 'Nada aqui ainda.'}</small>
            : <div style={{ display: 'grid', gap: 10, maxHeight: 420, overflow: 'auto' }}>
              {logErros.map(x => (
                <div key={x.id} style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid rgba(148,163,184,.25)', background: 'rgba(148,163,184,.06)', font: '500 12px/1.45 ui-sans-serif, system-ui' }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'baseline', flexWrap: 'wrap' }}>
                    <span style={{ padding: '1px 7px', borderRadius: 99, fontSize: 10, fontWeight: 700, background: x.origem === 'client' ? 'rgba(56,189,248,.15)' : 'rgba(251,146,60,.15)' }}>{x.origem}</span>
                    <b style={{ wordBreak: 'break-word' }}>{x.mensagem}</b>
                    <small style={{ color: 'rgb(148,163,184)', marginLeft: 'auto' }}>{new Date(x.criado_em).toLocaleString('pt-PT')}</small>
                  </div>
                  {x.pagina && <div style={{ color: 'rgb(148,163,184)', fontSize: 11, marginTop: 4, wordBreak: 'break-all' }}>{x.pagina}</div>}
                  {x.detalhe && <pre style={{ margin: '6px 0 0', padding: 8, borderRadius: 8, background: 'rgba(0,0,0,.25)', fontSize: 11, lineHeight: 1.4, overflow: 'auto', maxHeight: 110, whiteSpace: 'pre-wrap' }}>{x.detalhe}</pre>}
                  {x.user_agent && <div style={{ color: 'rgb(148,163,184)', fontSize: 10, marginTop: 4 }}>{x.user_agent.slice(0, 140)}</div>}
                </div>
              ))}
            </div>}
          </Card>}
          <Card className="admin-panel settings-card"><div className="admin-panel-head"><div><span className="admin-panel-kicker">CONTA</span><h2>Perfil do administrador</h2></div></div><p>Actualize o nome exibido no painel. O e-mail de acesso é fixo.</p><div className="settings-profile"><Avatar className="admin-avatar-large"><AvatarFallback>{(profileName.trim()[0] || adminUser?.name?.[0] || 'A').toUpperCase()}</AvatarFallback></Avatar><form className="settings-form" onSubmit={handleProfileSave}><label className="settings-field">Nome de exibição<input value={profileName} onChange={(e) => setProfileName(e.target.value)} required maxLength={120} /></label><label className="settings-field">E-mail de acesso<input value={adminUser?.email || ''} disabled /><small className="settings-hint">Não é alterável nesta versão.</small></label><div className="settings-actions"><Button type="submit" size="sm" disabled={savingProfile}>{savingProfile ? 'A guardar…' : <><Check size={14} /> Guardar perfil</>}</Button></div></form></div></Card><Card className="admin-panel settings-card"><div className="admin-panel-head"><div><span className="admin-panel-kicker">SEGURANÇA</span><h2>Mudar password</h2></div></div><p>A password actual é verificada (bcrypt) antes de qualquer alteração. Mínimo 8 caracteres.</p><form className="settings-form" onSubmit={handlePasswordChange}><label className="settings-field">Password actual<input type="password" value={pwCurrent} onChange={(e) => setPwCurrent(e.target.value)} required autoComplete="current-password" /></label><div className="settings-row"><label className="settings-field">Nova password<input type="password" value={pwNew} onChange={(e) => setPwNew(e.target.value)} required minLength={8} autoComplete="new-password" /></label><label className="settings-field">Confirmar nova<input type="password" value={pwConfirm} onChange={(e) => setPwConfirm(e.target.value)} required minLength={8} autoComplete="new-password" /></label></div>{pwNew && pwConfirm && pwNew !== pwConfirm && <p className="settings-warn">As passwords não coincidem.</p>}{pwNew && pwNew.length < 8 && <p className="settings-warn">A nova password precisa de pelo menos 8 caracteres.</p>}<div className="settings-actions"><Button type="submit" size="sm" disabled={savingPassword || (pwNew.length > 0 && pwNew !== pwConfirm)}>{savingPassword ? 'A alterar…' : <><Check size={14} /> Alterar password</>}</Button></div></form><div className="security-list"><div className="security-item"><ShieldCheck size={18} /><div><span>Autenticação de administrador</span><small>Protegida por JWT + cookie HttpOnly</small></div><span className="security-badge security-badge--ok">Activa</span></div><div className="security-item"><Database size={18} /><div><span>Base de dados gerida</span><small>Conexão activa e monitorizada</small></div><span className="security-badge security-badge--ok">Ligada</span></div></div></Card>{(adminUser?.level || 'super_admin') === 'super_admin' && <Card className="admin-panel settings-card"><div className="admin-panel-head"><div><span className="admin-panel-kicker">PORTAL PÚBLICO</span><h2>Configuração do site</h2></div></div><p>Directório telefónico, WhatsApp comercial e o banner de avisos exibido no topo do site.</p><form className="settings-form" onSubmit={handlePortalSave}><div className="settings-row"><label className="settings-field">Telefone do directório<input value={portalSettings['telefone_directorio'] || ''} onChange={(e) => setPortalSettings(f => ({ ...f, telefone_directorio: e.target.value }))} placeholder="+244 900 000 000" maxLength={40} /></label><label className="settings-field">WhatsApp comercial (só dígitos)<input value={portalSettings['whatsapp_comercial'] || ''} onChange={(e) => setPortalSettings(f => ({ ...f, whatsapp_comercial: e.target.value }))} placeholder="244900000000" maxLength={25} /></label></div><label className="settings-field">Mensagem do banner<input value={portalSettings['banner_mensagem'] || ''} onChange={(e) => setPortalSettings(f => ({ ...f, banner_mensagem: e.target.value }))} placeholder="Ex.: Nova versão do PalancaSoft disponível!" maxLength={140} /></label><label className="settings-field">Banner no site<select value={portalSettings['banner_activo'] || 'false'} onChange={(e) => setPortalSettings(f => ({ ...f, banner_activo: e.target.value }))}><option value="false">Desactivado</option><option value="true">Activado</option></select></label><div className="settings-actions"><Button type="submit" size="sm" disabled={savingPortal}>{savingPortal ? 'A guardar…' : <><Check size={14} /> Guardar configuração</>}</Button></div></form></Card>}{(adminUser?.level || 'super_admin') === 'super_admin' && <Card className="admin-panel settings-card"><div className="admin-panel-head"><div><span className="admin-panel-kicker">GESTÃO DE ACESSOS</span><h2>Utilizadores do painel</h2></div><Button size="sm" onClick={() => setShowUserForm(true)}><Plus size={15} /> Novo utilizador</Button></div><p>Níveis: <strong>Super Admin</strong> (tudo), <strong>Gestor Comercial</strong> (contactos, licenças, parceiros, catálogo) e <strong>Técnico de Suporte</strong> (contactos, catálogo e mídias).</p><div className="user-admin-list">{users.map((user) => { const isSelf = adminUser?.email?.toLowerCase() === user.email.toLowerCase(); const protegido = user.role === 'developer' && !ehDev; return <div key={user.id} className={`user-admin-row ${protegido ? 'user-admin-row--dev' : ''}`}><div className="user-main"><strong>{user.name}{isSelf && <small> (você)</small>}{protegido && <small> · conta Developer <IconLock size={10} /></small>}</strong><span>{user.email}</span></div><select className="user-role-select" value={user.role} disabled={isSelf || protegido} title={protegido ? 'A conta Developer (Master Admin) só é gerida por outra conta Developer' : undefined} onChange={(e) => updateUser(user, { role: e.target.value })}>{ROLES.map(r => <option key={r} value={r}>{labelRole(r)}</option>)}</select><span className={`active-pill ${user.is_active && user.role !== 'developer' ? '' : 'inactive'}`}>{user.role === 'developer' ? <><IconLock size={10} /> Master</> : user.is_active ? 'Activo' : 'Desactivado'}</span><div className="service-admin-actions">{!isSelf && !protegido && <button className="icon-btn" title={user.is_active ? 'Desactivar' : 'Activar'} onClick={() => updateUser(user, { is_active: !user.is_active })}><Power size={16} /></button>}{!protegido && <button className="icon-btn" title="Redefinir password" onClick={() => { setPwResetUser(user); setPwResetForm({ pw: '', pw2: '' }) }}><KeyRound size={16} /></button>}{!isSelf && !protegido && <button className="icon-btn danger" title="Eliminar" onClick={() => setDeletingUserId(user.id)}><Trash2 size={16} /></button>}</div></div> })}</div></Card>}
          <Card className="admin-panel settings-card"><div className="admin-panel-head"><div><span className="admin-panel-kicker">SEGURANÇA · 2º PASSO</span><h2>Autenticação em dois passos (2FA)</h2></div></div><p>Com o 2FA activo, depois da password o painel pede um código de 6 dígitos de um app autenticador (Google Authenticator, Authy, …). Cada conta activa o seu — aqui.</p>
            {twofaEstado === 'loading' && <small className="settings-hint">A verificar…</small>}
            {twofaEstado === 'activado' ? <form className="settings-form" onSubmit={desactivar2fa}><div className="settings-field settings-field--full">Estado: <strong style={{ color: 'var(--success, #16a34a)' }}>activo</strong> — este login exige o código TOTP.</div><label className="settings-field">Password actual<small>Prove que é o dono da conta para desligar</small><input type="password" value={pw2fa} onChange={(e) => setPw2fa(e.target.value)} required autoComplete="current-password" /></label><div className="settings-actions"><Button variant="outline" type="submit" size="sm" disabled={busy2fa || !pw2fa || savingPassword}>{busy2fa ? 'A desactivar…' : 'Desactivar 2FA'}</Button></div></form>
            : setup2fa ? <form className="settings-form" onSubmit={activar2fa}><div className="settings-field settings-field--full">1. No app autenticador, escolha «+» → «Introduzir chave de configuração» e cole este segreto:<code className="settings-2fa-secret" style={{ display: 'block', margin: '8px 0', padding: '10px 12px', font: '600 15px/1.3 ui-monospace, monospace', letterSpacing: '2px', borderRadius: 10, background: 'rgba(0,0,0,.35)' }}>{setup2fa.secret.slice(0, 4)} {setup2fa.secret.slice(4, 12)} {setup2fa.secret.slice(12, 20)} {setup2fa.secret.slice(20)}</code><small>Conta: CFTEC:{adminUser?.email || ''}</small></div><label className="settings-field">2. Código de 6 dígitos que o app mostra<input inputMode="numeric" pattern="[0-9]*" maxLength={6} value={codigo2fa} onChange={(e) => setCodigo2fa(e.target.value.replace(/\D/g, ''))} placeholder="000000" autoComplete="one-time-code" required /></label><div className="settings-actions"><Button type="submit" size="sm" disabled={busy2fa || codigo2fa.length !== 6}>{busy2fa ? 'A verificar…' : <><Check size={14} /> Activar 2FA</>}</Button><Button variant="outline" type="button" size="sm" onClick={() => setSetup2fa(null)}>Cancelar</Button></div></form>
            : <Button type="button" size="sm" onClick={iniciar2fa} disabled={busy2fa}>{busy2fa ? 'A gerar segredo…' : <>Configurar 2FA <ShieldCheck size={14} /></>}</Button>}
          </Card>
          <Card className="admin-panel settings-card"><div className="admin-panel-head"><div><span className="admin-panel-kicker">SEGURANÇA</span><h2>Sessões activas</h2></div><Button variant="outline" type="button" size="sm" onClick={revogarOutras} disabled={revogando || !sessoes?.some(s => !s.actual)}>{revogando ? 'A fechar…' : 'Fechar as outras'}</Button></div><p>Navegadores onde esta conta entrou nos últimos 30 dias. «Fechar as outras» revoga-os — quem estiver noutro dispositivo precisará de iniciar sessão de novo.</p>
            <div className="upg-lista">{sessoes === null ? <small className="settings-hint">A carregar…</small> : sessoes.length === 0 ? <small className="settings-hint">Nenhuma sessão registada (entrar de novo para registar).</small> : sessoes.map((s) => (
              <div className="upg-row" key={s.jti}>
                <div className="upg-row-main">
                  <span className="upg-data">{formatDate(s.emitida)}</span>
                  {s.actual && <span className="upg-chip upg-chip--autorizado">Sessão actual</span>}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span title={s.dispositivo} style={{ opacity: .65, fontSize: 12.5, maxWidth: 340, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.dispositivo.slice(0, 64)}{s.dispositivo.length > 64 ? '…' : ''}</span>
                  {!s.actual && <button className="icon-btn danger" title="Revogar esta sessão" onClick={() => void revogarSessao(s.jti)}><X size={15} /></button>}
                </div>
              </div>
            ))}</div>
          </Card></div>
  )
}
