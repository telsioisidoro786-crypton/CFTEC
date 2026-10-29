import type { Dispatch, SetStateAction } from 'react'
import { RefreshCw, ScrollText, Search } from 'lucide-react'
import { Card } from '../../components/ui/card'
import type { AuditRow } from '../types'

const ACAO_LABEL: Record<string, string> = {
  login: 'Entrou no painel', login_falhado: 'Login falhado',
  perfil_actualizado: 'Actualizou o perfil', password_alterada: 'Alterou a password',
  contacto_recebido: 'Contacto recebido', contacto_estado: 'Mudou estado do contacto', contacto_apagado: 'Apagou contacto',
  candidatura_sub_parceiro: 'Candidatura de sub-parceiro recebida', parceiro_criado: 'Criou parceiro no painel',
  chamado_recebido: 'Chamado recebido', chamado_criado: 'Criou chamado', chamado_actualizado: 'Actualizou chamado', chamado_apagado: 'Apagou chamado',
  pedido_recebido: 'Pedido de licença recebido', pedido_estado: 'Mudou estado do pedido', pedido_apagado: 'Apagou pedido',
  licenca_emitida: 'Emitiu licença', licenca_actualizada: 'Actualizou licença', licenca_apagada: 'Apagou licença',
  licenca_atribuida: 'Atribuiu licença a parceiro',
  definicoes_gravadas: 'Gravou definições do portal', licenca_alterada: 'Alterou a licença da plataforma',
  backup_exportado: 'Exportou cópia de segurança',
  backup_automatico: 'Cópia de segurança automática (diária)',
  '2fa_setup': 'Iniciou configuração do 2FA',
  '2fa_activada': 'Activou o 2FA',
  '2fa_desactivada': 'Desactivou o 2FA',
  portal_registo: 'Registo de empresa no portal', portal_login: 'Cliente entrou no portal', portal_login_falhado: 'Login de cliente falhado',
  portal_chamado_novo: 'Abriram chamado pelo portal',
  chamado_respondido: 'Técnico respondeu no chamado', chamado_escalado: 'Sistema escalou chamado (SLA vencido)',
  portal_chamado_mensagem: 'Cliente respondeu no chamado (portal)', portal_csat: 'Avaliou o chamado (CSAT)',
  whatsapp_teste_ok: 'Teste de WhatsApp: enviado', whatsapp_teste_falhou: 'Teste de WhatsApp: falhou',
  portal_cliente_criado: 'Criou conta de cliente no portal', portal_cliente_estado: 'Mudou estado de cliente do portal', portal_cliente_apagado: 'Apagou conta de cliente do portal',
  '2fa': '2FA',
  sessao_revogada: 'Revogou uma sessão',
  sessoes_revogadas: 'Revogou as outras sessões',
  login_bloqueado: 'Login bloqueado (demasiadas falhas)',
  login_2fa_falhado: 'Login: código 2FA errado',
  '2FA': '2FA',
  utilizador_criado: 'Criou utilizador', utilizador_actualizado: 'Actualizou utilizador', utilizador_apagado: 'Apagou utilizador',
  wiki_criada: 'Registou artigo na wiki', wiki_actualizada: 'Actualizou artigo da wiki', wiki_apagada: 'Apagou artigo da wiki',
  servico_criado: 'Criou serviço', servico_actualizado: 'Actualizou serviço', servico_alternado: 'Activou/desactivou serviço', servico_apagado: 'Apagou serviço',
  destaque_criado: 'Criou destaque', destaque_actualizado: 'Actualizou destaque', destaque_apagado: 'Apagou destaque',
  artigo_blog_criado: 'Criou artigo do blog', artigo_blog_actualizado: 'Actualizou artigo do blog', artigo_blog_apagado: 'Apagou artigo do blog',
  midia_enviada: 'Enviou mídia', midia_actualizada: 'Actualizou mídia', midia_apagada: 'Apagou mídia',
  software_criado: 'Publicou software', software_actualizado: 'Actualizou software', software_alternado: 'Activou/desactivou software', software_apagado: 'Apagou software',
}

// cor do selo conforme o tipo de acção (criar=verde, apagar=vermelho, mudar estado=azul, licença=roxo…)
const ACAO_TOM = (acao: string) => acao.endsWith('_apagado') ? 'vermelho'
  : acao.endsWith('_criado') || acao.endsWith('_criada') || acao.endsWith('_emitida') || acao.endsWith('_recebido') ? 'verde'
  : acao === 'licenca_alterada' ? 'roxo'
  : acao === 'login_falhado' ? 'ambar'
  : acao === 'login' ? 'neutro' : 'azul'
const fmtAuditDetalhe = (raw: string | null) => {
  if (!raw) return ''
  try {
    const obj = JSON.parse(raw) as Record<string, unknown>
    return Object.entries(obj).map(([k, v]) => `${k}: ${typeof v === 'string' ? v : JSON.stringify(v).replace(/"/g, '')}`).join(' · ')
  } catch { return raw }
}

// Fase Auditoria — secção de trilha extraída do AdminDashboard (JSX byte-a-byte, estado via props)
type AuditoriaSectionProps = {
  audit: AuditRow[]
  auditSearch: string
  setAuditSearch: Dispatch<SetStateAction<string>>
  loadAudit: () => Promise<void> | void
}

export function AuditoriaSection({ audit, auditSearch, setAuditSearch, loadAudit }: AuditoriaSectionProps) {
  return (
    (() => {
          const q = auditSearch.trim().toLowerCase()
          const visiveis = q ? audit.filter(r => `${r.actor_email} ${r.acao} ${r.entidade} ${r.detalhe || ''}`.toLowerCase().includes(q)) : audit
          return <Card className="admin-panel admin-section-panel"><div className="admin-panel-head"><div><span className="admin-panel-kicker">HISTÓRICO · QUEM FEZ O QUÊ</span><h2>Registo de actividades</h2></div><div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}><span className="order-live-note" data-tip="Cada mutação do painel e cada formulário submetido no site deixa rasto aqui — últimos 300 registos"><i /> últimos registos</span><div className="license-search"><Search size={15} /><input value={auditSearch} onChange={(e) => setAuditSearch(e.target.value)} placeholder="Pesquisar quem, acção, entidade..." /></div><button className="icon-btn" title="Actualizar registo" onClick={() => loadAudit()}><RefreshCw size={15} /></button></div></div><p style={{ margin: '0 0 16px', color: '#64748b', fontSize: '.72rem', lineHeight: 1.6 }}>Trilha de auditoria interna: <b>logins</b> (incl. falhados), <b>mudanças de estado</b> de pedidos e chamados, artigos, licenças emitidas, utilizadores criados/apagados e <b>alterações da licença da plataforma</b> — com o autor e a hora exacta.</p>{visiveis.length === 0 ? <div className="admin-empty-state"><ScrollText size={48} /><h3>{q ? 'Nada corresponde à pesquisa' : 'Sem registos ainda'}</h3><p>{q ? `Nenhum registo corresponde a "${q}".` : 'Assim que alguém actuar no painel (ou um cliente submeter um formulário) o registo aparece aqui.'}</p></div> : <div className="admin-table-wrap"><table className="admin-table audit-table"><thead><tr><th>Data</th><th>Quem</th><th>Acção</th><th>Alvo</th><th>Detalhe</th></tr></thead><tbody>{visiveis.map((row) => <tr key={row.id}><td>{new Date(row.created_at).toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit' })}<small className="order-time">{new Date(row.created_at).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}</small></td><td><strong>{row.actor_email}</strong><small className="order-sub">{row.actor_level || (row.acao === 'login_falhado' ? 'sem sessão' : 'site público')}</small></td><td><span className={`audit-pill audit-pill--${ACAO_TOM(row.acao)}`} data-tip={`acção: ${row.acao}`}>{ACAO_LABEL[row.acao] || row.acao}</span></td><td>{row.entidade}{row.entidade_id && <small className="audit-eid"> #{String(row.entidade_id).slice(0, 8).toUpperCase()}</small>}</td><td><small className="audit-detalhe">{fmtAuditDetalhe(row.detalhe) || '—'}</small></td></tr>)}</tbody></table></div>}</Card>
        })()
  )
}
