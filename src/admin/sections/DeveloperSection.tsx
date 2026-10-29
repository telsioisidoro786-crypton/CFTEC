import type { Dispatch, SetStateAction } from 'react'
import { AlertTriangle, ArrowDownToLine, Bell, Check, Copy, Database, Download, Inbox, KeyRound, Loader2, MessageCircle, RefreshCw, Repeat, Send, UploadCloud, Users, Wallet, X } from 'lucide-react'
import { IconAlert, IconClock, IconDownload, IconGear, IconLock, IconPhone } from '../../components/animIcons'
import { Avatar, AvatarFallback } from '../../components/ui/avatar'
import { Button } from '../../components/ui/button'
import { Card } from '../../components/ui/card'
import type { AlertaRow, AnalyticsState, BackupFicheiro, BackupPrever, RepoEmpresa, SysLic } from '../types'

// Fase Developer — secção exclusiva Nexora Systems extraída do AdminDashboard (JSX byte-a-byte, estado via props)
type UpgradePedido = { id: string; empresa: string; email: string; itens: string; total: string; estado: 'pendente' | 'autorizado' | 'recusado'; nota_dev?: string | null; resolvido_por?: string | null; created_at: string }

type DeveloperSectionProps = {
  adminUser: { name?: string; email?: string; level?: string | null } | null
  notify: (message: string) => void
  formatDate: (value: string) => string
  analytics: AnalyticsState
  loadAnalytics: () => Promise<void> | void
  exportarCSV: (nome: string, colunas: string[], linhas: (string | number | null)[][]) => void
  upgradePedidos: UpgradePedido[]
  resolverUpgrade: (id: string, estado: 'autorizado' | 'recusado') => Promise<void> | void
  sysLic: SysLic
  setSysLic: Dispatch<SetStateAction<SysLic>>
  guardarLicenca: (parcial: Partial<SysLic>) => Promise<void> | void
  guardarRegras: (parcial?: { somenteLeitura?: boolean }) => Promise<void> | void
  regrasForm: { diasAviso: string; maxUsuarios: string; maxStorageMb: string }
  setRegrasForm: Dispatch<SetStateAction<{ diasAviso: string; maxUsuarios: string; maxStorageMb: string }>>
  gerarCodigoMaster: () => Promise<void> | void
  gerandoCodigo: boolean
  codigoMaster: string | null
  backupFicheiros: BackupFicheiro[]
  backupUltimoAuto: string | null
  backupAGerando: boolean
  exportarBackup: () => Promise<void> | void
  gerarBackupAgora: () => Promise<void> | void
  baixandoBackup: boolean
  baixarBackupFicheiro: (nome: string) => Promise<void> | void
  abrirRestaurar: (ficheiro: BackupFicheiro) => Promise<void> | void
  backupARestaurar: BackupFicheiro | null
  setBackupARestaurar: Dispatch<SetStateAction<BackupFicheiro | null>>
  backupPrever: BackupPrever | null
  aplicarRestaurar: () => Promise<void> | void
  backupAAplicar: boolean
  setBackupAAplicar: Dispatch<SetStateAction<boolean>>
  backupConfirma: string
  setBackupConfirma: Dispatch<SetStateAction<string>>
  backupEscolhidas: string[]
  setBackupEscolhidas: Dispatch<SetStateAction<string[]>>
  backupModo: 'faltam' | 'substituir'
  setBackupModo: Dispatch<SetStateAction<'faltam' | 'substituir'>>
  alertaFila: AlertaRow[]
  alertaResumo: { enviados: number; falhados: number; saltados: number; ultimo: string | null }
  alertaSemTabela: boolean
  alertaTestando: string | null
  carregarAlertas: () => Promise<void> | void
  testarCanalAlerta: (canal: 'callmebot' | 'email' | 'push') => Promise<void> | void
  abrirFicha360: (nif: string) => Promise<void> | void
}

export function DeveloperSection({ adminUser, notify, formatDate, analytics, loadAnalytics, exportarCSV, upgradePedidos, resolverUpgrade, sysLic, setSysLic, guardarLicenca, guardarRegras, regrasForm, setRegrasForm, gerarCodigoMaster, gerandoCodigo, codigoMaster, backupFicheiros, backupUltimoAuto, backupAGerando, exportarBackup, gerarBackupAgora, baixandoBackup, baixarBackupFicheiro, abrirRestaurar, backupARestaurar, setBackupARestaurar, backupPrever, aplicarRestaurar, backupAAplicar, setBackupAAplicar, backupConfirma, setBackupConfirma, backupEscolhidas, setBackupEscolhidas, backupModo, setBackupModo, alertaFila, alertaResumo, alertaSemTabela, alertaTestando, carregarAlertas, testarCanalAlerta, abrirFicha360 }: DeveloperSectionProps) {
  return (
    <>
          <Card className="admin-panel admin-section-panel"><div className="admin-panel-head"><div><span className="admin-panel-kicker">ÁREA EXCLUSIVA · DEVELOPER (NEXORA SYSTEMS)</span><h2>Licença & módulos da plataforma</h2></div><span className="developer-lock" data-tip="Só a sua conta developer vê e altera estas definições — o super admin da CFTEC não pode"><IconLock size={11} /> só o developer</span></div><p style={{ margin: '0 0 18px', color: '#64748b', fontSize: '.72rem', lineHeight: 1.6 }}>Estes interruptores controlam o que a CFTEC tem direito a usar conforme o contrato Setup/manutenção. Alterações aplicam-se a todos os painéis em até <b>20 segundos</b> (ou imediatamente ao recarregar). As chaves de licença nunca aparecem nas Definições do super admin.</p>{!sysLic.licencaAtiva && <div className="licenca-aviso licenca-aviso--off"><AlertTriangle size={15} /> A plataforma está SUSPENSA — a equipa CFTEC vê um ecrã de bloqueio e os formulários públicos (checkout/suporte) estão fechados.</div>}
          <div className="dev-lic-status"><strong>{sysLic.expirada ? 'LICENÇA EXPIRADA (suspensão automática)' : sysLic.licencaAtiva ? 'Licença ACTIVA' : 'Licença SUSPENSA'}</strong><span>{sysLic.expiraEm ? `Validade até ${new Date(sysLic.expiraEm).toLocaleDateString('pt-PT')}${typeof sysLic.diasParaVencer === 'number' && sysLic.diasParaVencer >= 0 ? ` · ${sysLic.diasParaVencer === 0 ? 'vence hoje' : `vence em ${sysLic.diasParaVencer} dia(s)`} (aviso ${sysLic.diasAviso || 5} dias antes)` : ''}` : 'Sem prazo de validade definido'}</span>{sysLic.expirada && <span className="dev-lic-urgente"><IconClock size={12} /> Venceu-se a {new Date(sysLic.expiraEm).toLocaleDateString('pt-PT')} — a equipa CFTEC está bloqueada (ou em bypass de emergência).</span>}</div>
          <div className="dev-toggles">
            <div className={`dev-toggle-row ${!sysLic.licencaAtiva ? 'dev-toggle-row--off' : ''}`}><div><strong>Licença da plataforma</strong><small>Off = painel bloqueia para toda a equipa CFTEC excepto developers · formulários públicos fechados</small></div><button type="button" className={`dev-switch ${sysLic.licencaAtiva ? 'is-on' : ''}`} aria-label="Licença da plataforma" onClick={() => guardarLicenca({ licencaAtiva: !sysLic.licencaAtiva })} /></div>
            <div className={`dev-toggle-row ${!sysLic.moduloComercial ? 'dev-toggle-row--off' : ''}`}><div><strong>Módulo Comercial</strong><small>Pedidos B2B, proformas, faturas internas, relatórios e revenda Negomil (+ checkout público)</small></div><button type="button" className={`dev-switch ${sysLic.moduloComercial ? 'is-on' : ''}`} aria-label="Módulo Comercial" onClick={() => guardarLicenca({ moduloComercial: !sysLic.moduloComercial })} /></div>
            <div className={`dev-toggle-row ${!sysLic.moduloTecnico ? 'dev-toggle-row--off' : ''}`}><div><strong>Módulo de Suporte Técnico</strong><small>Chamados de suporte + wiki técnica (+ formulário público de suporte)</small></div><button type="button" className={`dev-switch ${sysLic.moduloTecnico ? 'is-on' : ''}`} aria-label="Módulo Técnico" onClick={() => guardarLicenca({ moduloTecnico: !sysLic.moduloTecnico })} /></div>
            <div className={`dev-toggle-row ${!sysLic.moduloNovidades ? 'dev-toggle-row--off' : ''}`}><div><strong>Módulo de Novidades</strong><small>Blog/CMS e destaques do site (slider da página inicial)</small></div><button type="button" className={`dev-switch ${sysLic.moduloNovidades ? 'is-on' : ''}`} aria-label="Módulo de Novidades" onClick={() => guardarLicenca({ moduloNovidades: !sysLic.moduloNovidades })} /></div>
            <div className={`dev-toggle-row ${!sysLic.moduloFaturacao ? 'dev-toggle-row--off' : ''}`}><div><strong>Módulo de Faturação (Auto-serviço no Portal)</strong><small>O cliente renova a licença 1-clique, anexa comprovativos, vê proformas/FT em PDF e pede utilizadores extra no portal — sentinela: os GETs de histórico continuam livres</small></div><button type="button" className={`dev-switch ${sysLic.moduloFaturacao ? 'is-on' : ''}`} aria-label="Módulo de Faturação" onClick={() => guardarLicenca({ moduloFaturacao: !sysLic.moduloFaturacao })} /></div>
            <div className={`dev-toggle-row ${!sysLic.moduloRelatorios ? 'dev-toggle-row--off' : ''}`}><div><strong>Módulo de Relatórios avançados & Metas</strong><small>Secção Relatórios: vendas/conversão + SLA/CSAT + analytics de subscrições (MRR/ARR, churn, engajamento) — é o add-on «Relatórios avançados & metas» dos planos</small></div><button type="button" className={`dev-switch ${sysLic.moduloRelatorios ? 'is-on' : ''}`} aria-label="Módulo de Relatórios" onClick={() => guardarLicenca({ moduloRelatorios: !sysLic.moduloRelatorios })} /></div>
          </div>
          <form className="settings-form dev-lic-form" onSubmit={(e) => { e.preventDefault(); guardarLicenca({ expiraEm: sysLic.expiraEm, mensagem: sysLic.mensagem }) }}>
            <div className="settings-row">
              <label className="settings-field">Licença expira em (opcional)<input type="date" value={sysLic.expiraEm} onChange={(e) => setSysLic(s => ({ ...s, expiraEm: e.target.value }))} /><small className="settings-hint">Vazio = sem prazo. A equipa vê “⚠️ licença de manutenção expira a …” no painel.</small></label>
            </div>
            <label className="settings-field">Mensagem de bloqueio<textarea rows={2} maxLength={300} value={sysLic.mensagem} onChange={(e) => setSysLic(s => ({ ...s, mensagem: e.target.value }))} placeholder="Módulo indisponível no vosso plano actual. Contacte o suporte técnico." /></label>
            <div className="settings-actions"><Button type="submit" size="sm"><Check size={14} /> Guardar prazo & mensagem</Button></div>
          </form>
        </Card>
          <Card className="admin-panel admin-section-panel"><div className="admin-panel-head"><div><span className="admin-panel-kicker">CONTRATO SAAS · REGRAS AUTOMÁTICAS</span><h2>Regras de contrato & quotas</h2></div><span className="developer-lock" data-tip="O sistema aplica sozinho: aviso por data, quotas e modo só-leitura — sem precisar de 'dar a cara' para bloquear manualmente"><IconGear size={11} /> automático</span></div><p style={{ margin: '0 0 18px', color: '#64748b', fontSize: '.72rem', lineHeight: 1.6 }}>O sistema vigia as regras por si: <b>avisos amarelos</b> X dias antes do vencimento e <b>suspensão automática</b> no dia seguinte; <b>quota de utilizadores</b> bloqueia a criação de contas acima do plano; <b>quota de storage</b> trava uploads de instaladores/mídia; e o <b>modo somente leitura</b> congela a escrita mantendo a consulta (período de graça).</p>
          <form className="settings-form dev-lic-form" onSubmit={(e) => { e.preventDefault(); guardarRegras() }}>
            <div className="settings-row dev-regras-grid">
              <label className="settings-field">Aviso prévio (dias)<input type="number" min={0} max={30} value={regrasForm.diasAviso} onChange={(e) => setRegrasForm(r => ({ ...r, diasAviso: e.target.value }))} /><small className="settings-hint">Banner amarelo “vence em N dias” começa a aparecer este número de dias antes da validade.</small></label>
              <label className="settings-field">Máx. utilizadores do painel<input type="number" min={0} max={999} value={regrasForm.maxUsuarios} onChange={(e) => setRegrasForm(r => ({ ...r, maxUsuarios: e.target.value }))} /><small className="settings-hint">0 = ilimitado. Ao atingir, a criação de contas devolve “upgrade do plano”.</small></label>
              <label className="settings-field">Máx. storage (MB)<input type="number" min={0} max={999999} value={regrasForm.maxStorageMb} onChange={(e) => setRegrasForm(r => ({ ...r, maxStorageMb: e.target.value }))} /><small className="settings-hint">0 = ilimitado. Soma real dos buckets (instaladores + mídia): {typeof sysLic.storageUsadoMb === 'number' ? `${sysLic.storageUsadoMb} MB em uso` : '…'}</small></label>
            </div>
            <div className="settings-actions"><Button type="submit" size="sm"><Check size={14} /> Guardar regras de contrato</Button></div>
          </form>
          <div className="dev-toggle-row dev-toggle-row--regras">
            <div><strong>Modo somente leitura (período de graça)</strong><small>Consulta livre de clientes, faturas e chamados; botões de escrita devolvem 403 ao painel da CFTEC. O código de emergência de 48h desbloqueia.</small></div>
            <button type="button" className={`dev-switch ${sysLic.somenteLeitura ? 'is-on' : ''}`} aria-label="Modo somente leitura" onClick={() => guardarRegras({ somenteLeitura: !sysLic.somenteLeitura })} />
          </div>
          <div className="dev-bypass-box">
            <div className="dev-bypass-head"><strong>Código de emergência mestre (48h)</strong><small>Se o Supabase/internet falhar ou suspender por engano: gere o código, passe-o por telefone/WhatsApp — o diretor da CFTEC insere no ecrã de bloqueio e ganha 48h de acesso sem depender da base de dados (assinado petid HMAC da plataforma, impossível de adivinhar).</small></div>
            <div className="settings-actions" style={{ marginBottom: codigoMaster ? 10 : 0 }}>
              <Button size="sm" onClick={gerarCodigoMaster} disabled={gerandoCodigo}>{gerandoCodigo ? <><Loader2 size={14} className="spin" /> A gerar…</> : <><KeyRound size={14} /> Gerar código de emergência</>}</Button>
            </div>
            {codigoMaster && <div className="dev-bypass-codigo"><code>{codigoMaster}</code><button className="icon-btn" title="Copiar código" onClick={() => { navigator.clipboard?.writeText(codigoMaster); notify('Código copiado — passe-o ao cliente por telefone/WhatsApp') }}><Copy size={14} /></button><small>válido 48h · cada utilização fica no Registo de actividades</small></div>}
          </div>
        </Card>
          {adminUser?.level === 'developer' && <Card className="admin-panel admin-section-panel settings-card--upg-dev"><div className="admin-panel-head"><div><span className="admin-panel-kicker">CONTRATO SAAS · PEDIDOS DO CLIENTE</span><h2>Pedidos de pagamento (manutenção)</h2></div><span className="order-live-note"><i /> {upgradePedidos.filter(p => p.estado === 'pendente').length} pendente(s)</span></div><p style={{ margin: '0 0 16px', color: '#64748b', fontSize: '.72rem', lineHeight: 1.6 }}>A CFTEC abre <b>Definições → Pagamento para a Manutenção</b>, escolhe o plano/add-ons e envia. O pedido chega aqui: veja o que querem pagar, <b>autorize</b> ou <b>recuse</b> (e-mail automático ao cliente). Ao <b>autorizar</b>, o contrato actualiza-se sozinho: licença activa, modo somente leitura desligado, validade +30 dias e os módulos <b>exactamente como a escolha do pedido</b> — o que não foi escolhido desliga (o Módulo Comercial fica sempre ligado, vem no plano base). Quotas só somam se já existir limite definido.</p>
            {upgradePedidos.length === 0 ? <div className="admin-empty-state" style={{ padding: '22px 0' }}><Wallet size={40} /><h3>Sem pedidos de pagamento</h3><p>Quando a CFTEC submeter um pedido no pop-up de planos, aparece aqui para decidir.</p></div> : <div className="upg-lista">{upgradePedidos.map(p => (
              <div className="upg-row" key={p.id}>
                <div className="upg-row-main">
                  <span className="upg-total">{p.total}</span>
                  <span className="upg-data">{p.empresa} · {p.email} · {formatDate(p.created_at)}</span>
                  <span className={`upg-chip upg-chip--${p.estado}`}>{p.estado === 'pendente' ? 'Pendente' : p.estado === 'autorizado' ? 'Autorizado' : 'Recusado'}</span>
                </div>
                <div className="upg-itens">{p.itens.split('\n').filter(Boolean).join(' · ')}</div>
                {p.nota_dev && <div className="upg-nota">Nota: {p.nota_dev}{p.resolvido_por ? ` — por ${p.resolvido_por}` : ''}</div>}
                {p.estado === 'pendente' && <div className="upg-acoes">
                  <Button type="button" size="sm" onClick={() => resolverUpgrade(p.id, 'autorizado')}><Check size={13} /> Autorizar</Button>
                  <Button type="button" size="sm" variant="outline" onClick={() => resolverUpgrade(p.id, 'recusado')}><X size={13} /> Recusar</Button>
                </div>}
              </div>
            ))}</div>}
          </Card>}
          <Card className="admin-panel admin-section-panel"><div className="admin-panel-head"><div><span className="admin-panel-kicker">CONFIABILIDADE · NEXORA SYSTEMS</span><h2>Central de alertas</h2></div><button className="icon-btn" title="Recarregar fila + resumo" onClick={() => void carregarAlertas()}><RefreshCw size={15} /></button></div><p style={{ margin: '0 0 16px', color: '#64748b', fontSize: '.72rem', lineHeight: 1.6 }}>Todo o aviso da plataforma (chamado novo, pedido, renovação, liquidação…) sai pelos 3 canais de notificação e deixa <b>rasto</b> aqui: estado de entrega real (✓ enviado · ✗ falhou · — saltou sem chaves) e o motivo exacto quando não chegou. Teste cada canal a qualquer momento — o resultado entra na fila com a sua assinatura.</p>
            {alertaSemTabela && <div className="licenca-aviso licenca-aviso--off" style={{ marginBottom: 14 }}><AlertTriangle size={15} /> A fila ainda não existe na base de dados — corra <b>supabase-parte82-alertas.sql</b> no SQL Editor do Supabase para activar. Os alertas continuam a ser enviados na mesma (só sem rasto).</div>}
            <div className="sla-grid" style={{ marginBottom: 16 }}>
              <div className="sla-kpi"><small>Entregues · 30d</small><strong>{alertaResumo.enviados}</strong><span>alertas chegaram ao destino</span></div>
              <div className="sla-kpi"><small>Falhados · 30d</small><strong style={alertaResumo.falhados > 0 ? { color: '#dc2626' } : undefined}>{alertaResumo.falhados}</strong><span>{alertaResumo.falhados > 0 ? 'ver o detalhe na fila' : 'nenhuma falha'}</span></div>
              <div className="sla-kpi"><small>Saltados · 30d</small><strong style={alertaResumo.saltados > 0 ? { color: '#d97706' } : undefined}>{alertaResumo.saltados}</strong><span>sem chaves / sem subscrição</span></div>
              <div className="sla-kpi"><small>Último entregue</small><strong>{alertaResumo.ultimo ? new Date(alertaResumo.ultimo).toLocaleDateString('pt-PT') : '—'}</strong><span>{alertaResumo.ultimo ? new Date(alertaResumo.ultimo).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' }) : 'sem entregas registadas'}</span></div>
            </div>
            <div className="settings-actions" style={{ margin: '0 0 16px' }}>
              <Button type="button" size="sm" onClick={() => void testarCanalAlerta('callmebot')} disabled={alertaTestando !== null}>{alertaTestando === 'callmebot' ? <><Loader2 size={13} className="spin" /> A testar…</> : <><MessageCircle size={13} /> Testar WhatsApp/TG</>}</Button>
              <Button type="button" size="sm" variant="outline" onClick={() => void testarCanalAlerta('email')} disabled={alertaTestando !== null}>{alertaTestando === 'email' ? <><Loader2 size={13} className="spin" /> A testar…</> : <><Send size={13} /> Testar e-mail</>}</Button>
              <Button type="button" size="sm" variant="outline" onClick={() => void testarCanalAlerta('push')} disabled={alertaTestando !== null}>{alertaTestando === 'push' ? <><Loader2 size={13} className="spin" /> A testar…</> : <><Bell size={13} /> Testar Web Push</>}</Button>
            </div>
            <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Data</th><th>Canal</th><th>Alerta</th><th>Estado</th><th>Detalhe</th></tr></thead><tbody>{alertaFila.length === 0 ? <tr><td colSpan={5} style={{ textAlign: 'center', padding: '18px 0' }}><Inbox size={18} style={{ display: 'block', margin: '0 auto 6px', color: '#94a3b8' }} /><span style={{ fontSize: '.72rem', color: '#64748b' }}>{alertaSemTabela ? 'Sem fila ainda — corra o SQL indicado acima.' : 'Nenhum alerta registado. Os próximos avisos aparecem aqui.'}</span></td></tr> : alertaFila.map(a => <tr key={a.id}>
              <td style={{ whiteSpace: 'nowrap', fontSize: '.72rem', color: '#64748b' }}>{new Date(a.criado_em).toLocaleString('pt-PT', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</td>
              <td data-tip={a.canal === 'callmebot' ? 'CallMeBot: WhatsApp admin + fallback Telegram' : a.canal === 'email' ? 'Resend → e-mail de notificação (Definições)' : 'Web Push → browser da equipa'}><span className={`alerta-chip alerta-chip--${a.canal}`}>{a.canal === 'callmebot' ? 'WhatsApp/TG' : a.canal === 'email' ? 'E-mail' : 'Push'}</span></td>
              <td style={{ maxWidth: 300, fontSize: '.72rem' }}>{a.texto}</td>
              <td><span className={`alerta-chip alerta-chip--${a.estado}`}>{a.estado === 'enviado' ? '✓ enviado' : a.estado === 'falhou' ? '✗ falhou' : '— saltou'}</span></td>
              <td style={{ fontSize: '.7rem', color: '#64748b', maxWidth: 230 }}>{a.detalhe || '—'}</td>
            </tr>)}</tbody></table></div>
          </Card>
          <Card className="admin-panel admin-section-panel"><div className="admin-panel-head"><div><span className="admin-panel-kicker">SEGURANÇA · NEXORA SYSTEMS</span><h2>Cópias de segurança</h2></div><span className="developer-lock" data-tip="Exportação exclusiva da conta developer — nem o super admin consegue descarregar"><IconLock size={11} /> só o developer</span></div><p style={{ margin: '0 0 14px', color: '#64748b', fontSize: '.72rem', lineHeight: 1.6 }}>Gera um ficheiro <b>.json</b> com todos os dados da plataforma (abaixo). O ficheiro sai <b>directo para o seu computador</b> — nada fica guardado no servidor, zero risco de fuga. Cada exportação fica registada no Registo de actividades. Recomendação: exportar no fim de cada semana e guardar num disco externo ou nuvem privado.</p><ul className="dev-backup-lista">{[['pedidos_licencas', 'pedidos de licença'], ['licencas_palancasoft', 'licenças activas'], ['recibos_faturacao', 'recibos / faturas (FT)'], ['pedidos_upgrade', 'pedidos de upgrade (contrato)'], ['chamados_suporte', 'chamados'], ['chamados_mensagens', 'conversas dos chamados'], ['wiki_tecnica', 'wiki técnica + FAQ'], ['clientes_portal', 'contas do portal do cliente'], ['download_events', 'eventos de downloads'], ['admin_users', 'utilizadores (sem passwords)'], ['settings', 'definições do portal'], ['parceiros_candidaturas', 'parceiros Negomil'], ['contacts', 'contactos do site'], ['blog_posts', 'blog'], ['novidades_destaques', 'destaques'], ['media', 'galeria de mídia'], ['softwares', 'softwares'], ['services', 'serviços'], ['logs_erros', 'diário de erros'], ['audit_log', 'auditoria (últimos 20 000)']].map(([t, l]) => <li key={t} data-tip={t}><Database size={12} /> {l}</li>)}</ul><div className="settings-actions"><Button size="sm" onClick={exportarBackup} disabled={baixandoBackup}>{baixandoBackup ? <><Loader2 size={14} className="spin" /> A gerar cópia…</> : <><ArrowDownToLine size={14} /> Exportar cópia completa (.json)</>}</Button><Button size="sm" variant="outline" onClick={() => void gerarBackupAgora()} disabled={backupAGerando}>{backupAGerando ? <><Loader2 size={14} className="spin" /> A gerar…</> : <><UploadCloud size={14} /> Gerar cópia agora (nuvem)</>}</Button></div>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', margin: '18px 0 8px' }}><p style={{ margin: 0, fontWeight: 700, fontSize: '.72rem', letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--muted, #64748b)' }}>Cópia automática diária · bucket «backups»</p><span style={{ fontSize: '.68rem', color: '#64748b' }}>retenção 30 · último automático: {backupUltimoAuto ? new Date(backupUltimoAuto).toLocaleString('pt-PT') : 'sem registo ainda (activa no 1.º acesso do dia)'}</span></div>
            <div className="admin-table-wrap" style={{ marginBottom: 8 }}><table className="admin-table"><thead><tr><th>Data da cópia</th><th>Tamanho</th><th style={{ textAlign: 'right' }}>Acções</th></tr></thead><tbody>{backupFicheiros.length === 0 ? <tr><td colSpan={3} style={{ textAlign: 'center', padding: '16px 0', fontSize: '.72rem', color: '#64748b' }}>Nenhuma cópia no bucket.</td></tr> : backupFicheiros.map(f => <tr key={f.nome}>
              <td>{f.gerado_em ? <strong>{new Date(f.gerado_em).toLocaleDateString('pt-PT')}</strong> : <code style={{ fontSize: '.68rem' }}>{f.nome}</code>}{f.gerado_em ? <span style={{ display: 'block', fontSize: '.68rem', color: '#94a3b8' }}>{new Date(f.gerado_em).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}</span> : null}</td>
              <td style={{ fontSize: '.72rem', color: '#64748b' }}>{f.tamanho >= 1048576 ? `${(f.tamanho / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(f.tamanho / 1024))} KB`}</td>
              <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                <button className="icon-btn" title="Descarregar esta cópia (.json)" onClick={() => void baixarBackupFicheiro(f.nome)}><ArrowDownToLine size={15} /></button>
                <button className="icon-btn" title="Restaurar assistido — pré-visualiza diferenças antes de aplicar" onClick={() => void abrirRestaurar(f)}><Repeat size={15} /></button>
              </td>
            </tr>)}</tbody></table></div>
          </Card>
          {backupARestaurar && <div className="admin-modal-backdrop" onMouseDown={() => setBackupARestaurar(null)}><div className="admin-modal" onMouseDown={(e) => e.stopPropagation()}><div className="admin-modal-head" style={{ borderTop: '3px solid #d97706' }}><div><span className="admin-panel-kicker">RESTAURAÇÃO ASSISTIDA · CÓPIA DE SEGURANÇA</span><h2>{backupARestaurar.gerado_em ? new Date(backupARestaurar.gerado_em).toLocaleString('pt-PT') : 'Cópia'}</h2>{backupARestaurar.gerado_em && <span style={{ color: '#64748b', fontSize: '.72rem' }}>{new Date(backupARestaurar.gerado_em).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })} · {(backupARestaurar.tamanho / 1024).toFixed(0)} KB</span>}</div><button onClick={() => setBackupARestaurar(null)} className="admin-modal-close" aria-label="Fechar"><X size={18} /></button></div><div className="admin-modal-body">
            {!backupPrever ? <div className="admin-empty-state"><Loader2 size={28} className="spin" style={{ color: 'var(--brand, #0ea5e9)' }} /><h3>A comparar a cópia com os dados actuais…</h3><p>Pré-visualização a contar linha a linha.</p></div> : <>
              <div style={{ fontSize: '.72rem', color: '#64748b', margin: '0 0 12px', lineHeight: 1.6 }}>Cópia gerada por <b>{backupPrever.por || '—'}</b> · {backupPrever.gerado_em ? new Date(backupPrever.gerado_em).toLocaleString('pt-PT') : '—'}. Escolha as tabelas e o modo de restauro.</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, margin: '0 0 12px' }}>
                <label style={{ display: 'flex', gap: 9, alignItems: 'flex-start', fontSize: '.76rem', lineHeight: 1.5, cursor: 'pointer' }}><input type="checkbox" checked={backupModo === 'faltam'} onChange={() => setBackupModo('faltam')} style={{ marginTop: 2 }} /> <span><b>Modo seguro — repõe só o que falta:</b> insere apenas as linhas cuja chave ainda não existe na base. Nunca apaga nada — a escolha por defeito.</span></label>
                <label style={{ display: 'flex', gap: 9, alignItems: 'flex-start', fontSize: '.76rem', lineHeight: 1.5, cursor: 'pointer' }}><input type="checkbox" checked={backupModo === 'substituir'} onChange={() => setBackupModo('substituir')} style={{ marginTop: 2 }} /> <span><b>Modo radical — substituir:</b> apaga TODAS as linhas actuais das tabelas escolhidas e repõe exactamente o conteúdo da cópia. Use só para recuperação de desastre.</span></label>
              </div>
              {backupModo === 'substituir' && <label className="settings-field" style={{ margin: '0 0 12px' }}>Confirmação obrigatória — escreva SUBSTITUIR<input value={backupConfirma} onChange={(e) => setBackupConfirma(e.target.value)} placeholder="SUBSTITUIR" maxLength={12} />{backupConfirma !== 'SUBSTITUIR' && <small style={{ color: '#b45309' }}>O botão de aplicar permanece bloqueado até escrever SUBSTITUIR em maiúsculas.</small>}</label>}
              <div className="admin-table-wrap" style={{ marginBottom: 4 }}><table className="admin-table"><thead><tr><th></th><th>Tabela</th><th>Nº na cópia</th><th>Actual</th><th>Faltam</th></tr></thead><tbody>{backupPrever.tabelas.map(t => <tr key={t.tabela} style={t.faltam === 0 && backupModo === 'faltam' ? { opacity: .55 } : undefined}>
                <td><input type="checkbox" checked={backupEscolhidas.includes(t.tabela)} onChange={(e) => setBackupEscolhidas(e.target.checked ? [...backupEscolhidas, t.tabela] : backupEscolhidas.filter(x => x !== t.tabela))} /></td>
                <td><code style={{ fontSize: '.7rem' }}>{t.tabela}</code></td>
                <td style={{ fontSize: '.72rem' }}>{t.noFicheiro.toLocaleString('pt-PT')}</td>
                <td style={{ fontSize: '.72rem' }}>{t.naBase.toLocaleString('pt-PT')}</td>
                <td style={{ fontSize: '.72rem', fontWeight: 700, color: t.faltam > 0 ? '#15803d' : '#94a3b8' }}>{t.faltam > 0 ? `+${t.faltam.toLocaleString('pt-PT')}` : '—'}</td>
              </tr>)}</tbody></table></div>
              {backupModo === 'faltam' && <div style={{ fontSize: '.68rem', color: '#94a3b8', margin: '6px 0 0' }}>Nota: admin_users repõe utilizadores <b>sem password</b> (as credenciais nunca viajam na cópia) — redefina as passwords depois.</div>}
              <div className="admin-modal-actions">
                <Button variant="outline" size="sm" onClick={() => setBackupARestaurar(null)}>Cancelar</Button>
                <Button size="sm" onClick={() => void aplicarRestaurar()} disabled={backupAAplicar || backupEscolhidas.length === 0 || (backupModo === 'substituir' && backupConfirma !== 'SUBSTITUIR')}>{backupAAplicar ? <><Loader2 size={13} className="spin" /> A restaurar…</> : <><Repeat size={13} /> Restaurar {backupEscolhidas.length || ''} tabela(s)</>}</Button>
              </div>
            </>}
          </div></div></div>}
          {analytics && <Card className="admin-panel admin-section-panel"><div className="admin-panel-head"><div><span className="admin-panel-kicker">DESEMPENHO · PORTAL DOS CLIENTES</span><h2>Monitorização & análise dos clientes</h2></div><div style={{ display: 'flex', gap: 6 }}><button className="icon-btn" title="Exportar CSV — empresas (licenças, validade, valor anual, engajamento)" onClick={() => { if (!analytics) return; exportarCSV('monitorizacao-clientes', ['Empresa', 'NIF', 'Licenças activas', 'Validade', 'Valor anual (Kz)', 'Downloads 30d', 'Chamados 30d', 'Último sinal'], analytics.empresas.map(e => [e.nome, e.nif, e.activas || 0, e.expira || '', e.anualKz ?? '', e.downloads, e.chamados, e.ultimo || ''])) }}><Download size={15} /></button><button className="icon-btn" title="Actualizar números" onClick={() => void loadAnalytics()}><RefreshCw size={15} /></button></div></div><p style={{ margin: '0 0 16px', color: '#64748b', fontSize: '.72rem', lineHeight: 1.6 }}>Como cada empresa usa realmente o portal nos <b>últimos 30 dias</b>: downloads do catálogo oficial e chamados de suporte (peso ×3), cruzados com as licenças e o valor anual já recebido. Servem para decidir renovações, cortesias e quem merece atenção comercial.</p>
            <div className="sla-grid" style={{ marginBottom: 16 }}>
              <div className="sla-kpi"><small>Empresas com actividade</small><strong>{analytics.empresas.length}</strong><span>nas consultas dos últimos 30 dias</span></div>
              <div className="sla-kpi"><small>Downloads no portal</small><strong>{analytics.empresas.reduce((s, e) => s + e.downloads, 0)}</strong><span>últimos 30 dias</span></div>
              <div className="sla-kpi"><small>Chamados abertos</small><strong>{analytics.empresas.reduce((s, e) => s + e.chamados, 0)}</strong><span>últimos 30 dias</span></div>
              <div className="sla-kpi"><small>Subscrição anual activa</small><strong>{(analytics.arrKz).toLocaleString('pt-PT')} Kz</strong><span>{analytics.licencas.activas} licença(s) activa(s)</span></div>
            </div>
            {analytics.empresas.length === 0 ? <div className="admin-empty-state"><Users size={40} /><h3>Sem sinais de actividade</h3><p>Quando os clientes entrarem no portal (downloads, chamados, renovações), os sinais aparecem aqui.</p></div> : <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Empresa</th><th>NIF</th><th>Lic.</th><th>Validade</th><th>Valor anual</th><th><IconDownload size={12} /> 30d</th><th><IconPhone size={12} /> 30d</th><th>Último sinal</th></tr></thead><tbody>{analytics.empresas.map(e => {
              const diasVal = e.expira ? Math.ceil((new Date(`${e.expira}T00:00:00Z`).getTime() - Date.now()) / 86400000) : null
              return <tr key={e.nif + '|' + e.nome} style={{ cursor: 'pointer' }} onClick={() => void abrirFicha360(e.nif)} title="Abrir ficha completa da empresa (Cliente 360)"><td><strong>{e.nome}</strong></td><td>{e.nif}</td><td>{e.activas || '—'}</td><td>{!e.expira ? '—' : <span className="tl-badge tl-badge-servico" data-tip={diasVal !== null && diasVal < 0 ? 'Licença VENCIDA' : diasVal !== null && diasVal <= 30 ? 'Vence em breve — fale com o cliente' : 'Licença activa'}>{new Date(`${e.expira}T00:00:00Z`).toLocaleDateString('pt-PT')}{diasVal !== null && diasVal < 0 ? <> <IconAlert size={11} /></> : diasVal !== null && diasVal <= 30 ? <> <IconClock size={11} /></> : ''}</span>}</td><td>{e.anualKz ? `${e.anualKz.toLocaleString('pt-PT')} Kz` : '—'}</td><td>{e.downloads}</td><td>{e.chamados}</td><td>{e.ultimo ? new Date(e.ultimo).toLocaleDateString('pt-PT') : '—'}</td></tr>
            })}</tbody></table></div>}
          </Card>}
        </>
  )
}
