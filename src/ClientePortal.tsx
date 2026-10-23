// ============================================================
// PORTAL DO CLIENTE CFTEC — /cliente
// Registo (approvação depois) → login → pedidos, licenças, chamados.
// Estilo do site (Tailwind) para o cliente sentir-se "dentro" da marca.
// ============================================================
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Activity, BadgeCheck, Building2, CheckCircle2, Download, FileText, KeyRound, LifeBuoy,
  Lock, LogIn, LogOut, Mail, MessageCircle, MessageSquare, Phone, Receipt, Send, ShieldCheck, Star, Timer, UserPlus,
} from 'lucide-react'

type Sessao = { empresa: string; email: string }
type Pedido = { id: string; created_at: string; software_nome: string; status: string; forma_pagamento: string | null; provincia: string | null; observacoes: string | null }
type Licenca = { id: string; chave_licenca: string; data_ativacao: string | null; data_expiracao: string | null; status: string; created_at: string }
type Chamado = { id: string; created_at: string; updated_at: string; software: string | null; problema: string; resolucao: string | null; estado: string; prioridade: string; origem: string | null; sla_horas?: number | null; prazo_sla?: string | null; resolvido_em?: string | null; escalonado?: boolean | null; csat?: number | null }
type Mensagem = { id: string; created_at: string; autor: 'cliente' | 'tecnico' | 'sistema'; autor_nome: string | null; corpo: string }

const statusTone = (s: string) =>
  s === 'Aprovado' || s === 'Pago' || s === 'Activo' || s === 'Resolvido' ? 'text-emerald-400 border-emerald-400/30 bg-emerald-400/10'
    : s === 'Rejeitado' || s === 'Suspenso' ? 'text-rose-400 border-rose-400/30 bg-rose-400/10'
      : s === 'Em Verificação' || s === 'Em Resolução' ? 'text-amber-400 border-amber-400/30 bg-amber-400/10'
        : 'text-slate-300 border-slate-500/30 bg-slate-500/10'

const fmt = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—')

// Pílula de SLA tal como o cliente vê no portal
const slaDoCliente = (c: { estado: string; prazo_sla?: string | null; resolvido_em?: string | null; escalonado?: boolean | null; created_at: string }): { texto: string; classe: string } => {
  if (c.estado === 'Resolvido') {
    if (c.resolvido_em) {
      const dentro = !c.prazo_sla || new Date(c.resolvido_em) <= new Date(c.prazo_sla)
      return dentro ? { texto: 'resolvido no prazo', classe: 'text-emerald-400 border-emerald-400/30 bg-emerald-400/10' } : { texto: 'resolvido fora do prazo', classe: 'text-amber-400 border-amber-400/30 bg-amber-400/10' }
    }
    return { texto: 'resolvido', classe: 'text-emerald-400 border-emerald-400/30 bg-emerald-400/10' }
  }
  if (!c.prazo_sla) return { texto: 'sem prazo contado', classe: 'text-slate-400 border-slate-500/30 bg-slate-500/10' }
  const restante = new Date(c.prazo_sla).getTime() - Date.now()
  if (c.escalonado) return { texto: 'ESCALADO — prioridade máxima', classe: 'text-rose-300 border-rose-400/40 bg-rose-400/10' }
  if (restante <= 0) return { texto: `prazo vencido há ${Math.abs(restante / 3600000).toFixed(0)} h`, classe: 'text-rose-300 border-rose-400/40 bg-rose-400/10' }
  return { texto: `resposta em até ${Math.ceil(restante / 3600000)} h`, classe: 'text-cyan-300 border-cyan-400/30 bg-cyan-400/10' }
}

async function apiJson<T>(url: string, opts?: RequestInit): Promise<{ status: number; body: T & { error?: string; message?: string } }> {
  const r = await fetch(url, { credentials: 'same-origin', ...opts, headers: opts?.body ? { 'Content-Type': 'application/json', ...(opts.headers || {}) } : opts?.headers })
  return { status: r.status, body: (await r.json().catch(() => ({}))) as T & { error?: string; message?: string } }
}

export default function ClientePortal() {
  const [vista, setVista] = useState<'a-ler' | 'porta' | 'dentro'>('a-ler')
  const [sessao, setSessao] = useState<Sessao | null>(null)
  const [aviso, setAviso] = useState('')
  const [modoAlt, setModoAlt] = useState<'login' | 'registo'>('login')
  const [tab, setTab] = useState<'resumo' | 'pedidos' | 'licencas' | 'chamados'>('resumo')
  const [registoOk, setRegistoOk] = useState(false)
  const [whats, setWhats] = useState('244933609090') // reforçado pela settings abaixo

  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [licencas, setLicencas] = useState<Licenca[]>([])
  const [chamados, setChamados] = useState<Chamado[]>([])

  const [fLogin, setFLogin] = useState({ email: '', password: '' })
  const [fRegisto, setFRegisto] = useState({ nome_empresa: '', nif: '', nome_responsavel: '', telefone_whatsapp: '', email: '', password: '' })
  const [fChamado, setFChamado] = useState({ software: '', descricao_problema: '' })
  const [fSenha, setFSenha] = useState({ password_actual: '', password_nova: '' })
  const [ocupado, setOcupado] = useState(false)
  // Conversa do chamado + CSAT (parte 3)
  const [conversaId, setConversaId] = useState<string | null>(null)
  const [mensagens, setMensagens] = useState<Mensagem[]>([])
  const [carregandoMsgs, setCarregandoMsgs] = useState(false)
  const [novaMsg, setNovaMsg] = useState('')
  const [csatRascunho, setCsatRascunho] = useState<{ id: string; nota: number; comentario: string } | null>(null)

  // sessão existente (cookie) — levanta dados de imediato
  useEffect(() => {
    fetch('/api/settings', { cache: 'no-store' }).then(r => r.json()).then(d => {
      const s = (d?.settings || {}) as Record<string, string>
      const w = String(s.whatsapp_tecnico || s.whatsapp_comercial || '').replace(/\D/g, '')
      if (w.length >= 9) setWhats(w)
    }).catch(() => {})
    void (async () => {
      const { status, body } = await apiJson<{ ok: boolean; user?: Sessao }>('/api/portal/session')
      if (status === 200 && body.ok && body.user) {
        setSessao(body.user)
        await carregarTudo()
        setVista('dentro')
      } else setVista('porta')
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const carregarTudo = useCallback(async () => {
    const [p, l, c] = await Promise.all([
      apiJson<{ ok: boolean; pedidos?: Pedido[] }>('/api/portal/pedidos'),
      apiJson<{ ok: boolean; licencas?: Licenca[] }>('/api/portal/licencas'),
      apiJson<{ ok: boolean; chamados?: Chamado[] }>('/api/portal/chamados'),
    ])
    setPedidos(p.body.pedidos || [])
    setLicencas(l.body.licencas || [])
    setChamados(c.body.chamados || [])
  }, [])

  // ─── acções ───
  const entrar = async (e: React.FormEvent) => {
    e.preventDefault(); setOcupado(true); setAviso('')
    const { status, body } = await apiJson<{ user?: Sessao }>('/api/portal/login', { method: 'POST', body: JSON.stringify(fLogin) })
    setOcupado(false)
    if (status === 200 && body.user) {
      setSessao(body.user); setVista('dentro'); setTab('resumo')
      await carregarTudo()
    } else setAviso(body.error || 'Não foi possível entrar.')
  }

  const registarse = async (e: React.FormEvent) => {
    e.preventDefault(); setOcupado(true); setAviso('')
    const { status, body } = await apiJson('/api/portal/registo', { method: 'POST', body: JSON.stringify(fRegisto) })
    setOcupado(false)
    if (status === 201) setRegistoOk(true)
    else setAviso(body.error || 'Não foi possível registar.')
  }

  const abrirChamado = async (e: React.FormEvent) => {
    e.preventDefault(); setOcupado(true); setAviso('')
    const { status, body } = await apiJson('/api/portal/chamados', { method: 'POST', body: JSON.stringify(fChamado) })
    setOcupado(false)
    if (status === 201) {
      setFChamado({ software: '', descricao_problema: '' })
      setTab('chamados')
      setAviso(body.message || 'Chamado registado!')
      await carregarTudo()
      window.setTimeout(() => setAviso(''), 5000)
    } else setAviso(body.error || 'Não foi possível registar o chamado.')
  }

  // conversa do chamado — thread cliente ↔ equipa (parte 3)
  const abrirConversa = async (chamado: Chamado) => {
    if (conversaId === chamado.id) return setConversaId(null)
    setConversaId(chamado.id)
    setMensagens([])
    setCarregandoMsgs(true)
    const { body } = await apiJson<{ ok: boolean; mensagens?: Mensagem[] }>(`/api/portal/chamados/${chamado.id}/mensagens`)
    setMensagens(body.mensagens || [])
    setCarregandoMsgs(false)
  }

  // conversa ao vivo: enquanto aberta, re-busca as mensagens — a resposta da
  // equipa entra sozinha na conversa do cliente, sem fechar e abrir de novo
  useEffect(() => {
    if (!conversaId) return
    const chamadoId = conversaId
    const timer = setInterval(() => {
      void (async () => {
        try {
          const r = await fetch(`/api/portal/chamados/${chamadoId}/mensagens`, { credentials: 'same-origin' })
          const d = await r.json()
          if (!r.ok || !d.ok) return
          setMensagens(prev => {
            const todas = new Map(prev.map(m => [m.id, m]))
            for (const m of (d.mensagens || []) as Mensagem[]) todas.set(m.id, m)
            return [...todas.values()].sort((a, b) => String(a.created_at).localeCompare(String(b.created_at)))
          })
        } catch { /* silencioso — mantém o que já tem */ }
      })()
    }, 4000)
    return () => clearInterval(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversaId])
  const fimConversa = useRef<HTMLDivElement>(null)
  useEffect(() => { fimConversa.current?.scrollIntoView({ block: 'end', behavior: 'smooth' }) }, [mensagens.length])

  const enviarMensagem = async (chamadoId: string) => {
    const corpo = novaMsg.trim()
    if (!corpo || ocupado) return
    setOcupado(true)
    const { status, body } = await apiJson<{ mensagem?: Mensagem }>(`/api/portal/chamados/${chamadoId}/mensagens`, { method: 'POST', body: JSON.stringify({ corpo }) })
    if (status === 201 && body.mensagem) { setMensagens(m => [...m, body.mensagem as Mensagem]); setNovaMsg(''); setAviso('Mensagem enviada à equipa técnica.') } else setAviso(body.error || 'Não foi possível enviar a mensagem.')
    setOcupado(false)
  }
  const enviarCsat = async (chamadoId: string) => {
    if (!csatRascunho || csatRascunho.id !== chamadoId || !csatRascunho.nota) return
    setOcupado(true)
    const { status, body } = await apiJson<{ message?: string }>(`/api/portal/chamados/${chamadoId}/csat`, { method: 'POST', body: JSON.stringify({ nota: csatRascunho.nota, comentario: csatRascunho.comentario }) })
    if (status === 200) { setChamados(l => l.map(c => c.id === chamadoId ? { ...c, csat: csatRascunho.nota } : c)); setCsatRascunho(null); setAviso(body.message || 'Obrigado pela avaliação!') } else setAviso(body.error || 'Não foi possível registar a avaliação.')
    setOcupado(false)
  }

  const trocarSenha = async (e: React.FormEvent) => {
    e.preventDefault(); setOcupado(true); setAviso('')
    const { status, body } = await apiJson('/api/portal/password', { method: 'POST', body: JSON.stringify(fSenha) })
    setOcupado(false)
    if (status === 200) { setFSenha({ password_actual: '', password_nova: '' }); setAviso(body.message || 'Password actualizada.') }
    else setAviso(body.error || 'Não foi possível alterar a password.')
  }

  const sair = async () => {
    await apiJson('/api/portal/logout', { method: 'POST' })
    setSessao(null); setVista('porta'); setPedidos([]); setLicencas([]); setChamados([])
  }

  // ─── vista: porta (login + registo) ───
  if (vista === 'a-ler')
    return (
      <div className="min-h-dvh bg-[#0e1726] text-slate-100 flex items-center justify-center">
        <span className="w-8 h-8 rounded-full border-2 border-slate-500/30 border-t-cyan-400 animate-spin" />
      </div>
    )

  if (vista === 'porta')
    return (
      <div className="min-h-dvh bg-[#0e1726] text-slate-100">
        <header className="border-b border-white/10">
          <div className="max-w-5xl mx-auto px-5 py-4 flex items-center justify-between">
            <a href="/" className="text-[22px] font-extrabold tracking-tight">CFTEC<span className="text-cyan-400">.</span></a>
            <a href="/" className="text-sm text-slate-400 hover:text-cyan-400 transition-colors">← voltar ao site</a>
          </div>
        </header>
        <main className="max-w-5xl mx-auto px-5 py-12">
          <div className="max-w-2xl mx-auto">
            <span className="inline-flex items-center gap-2 text-xs font-semibold text-cyan-400 bg-cyan-400/10 border border-cyan-400/20 rounded-full px-3 py-1"><ShieldCheck size={14} /> Área segura · apenas empresas aprovadas</span>
            <h1 className="mt-4 text-3xl md:text-4xl font-extrabold leading-tight">Portal do <span className="text-cyan-400">Cliente</span></h1>
            <p className="mt-3 text-slate-400 leading-relaxed">Acompanhe os seus <b className="text-slate-200">pedidos de licença</b>, <b className="text-slate-200">licenças activas</b> (chaves) e <b className="text-slate-200">chamados de suporte</b> — e abra novos chamados em segundos.</p>

            {aviso && modoAlt === 'login' && <div className="mt-5 text-sm bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-xl px-4 py-3">{aviso}</div>}

            <div className="mt-6 flex gap-1 p-1 rounded-xl bg-white/5 border border-white/10 w-max">
              {(['login', 'registo'] as const).map(m => (
                <button key={m} onClick={() => { setModoAlt(m); setAviso('') }} className={`px-4 py-2 text-sm rounded-lg transition-all ${modoAlt === m ? 'bg-cyan-400 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'}`}>
                  {m === 'login' ? 'Entrar' : 'Registar empresa'}
                </button>
              ))}
            </div>

            {modoAlt === 'login' ? (
              <form onSubmit={entrar} className="mt-5 bg-white/[.03] border border-white/10 rounded-2xl p-6 space-y-4">
                <label className="block"><span className="text-xs font-semibold text-slate-400">E-mail da conta</span>
                  <input className="mt-1.5 w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-cyan-400/60" type="email" required value={fLogin.email} onChange={e => setFLogin({ ...fLogin, email: e.target.value })} placeholder="empresa@exemplo.co" autoComplete="email" /></label>
                <label className="block"><span className="text-xs font-semibold text-slate-400">Password</span>
                  <input className="mt-1.5 w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-cyan-400/60" type="password" required value={fLogin.password} onChange={e => setFLogin({ ...fLogin, password: e.target.value })} placeholder="••••••••" autoComplete="current-password" /></label>
                <button type="submit" disabled={ocupado} className="w-full inline-flex items-center justify-center gap-2 bg-cyan-400 text-slate-950 font-bold rounded-lg px-4 py-3 text-sm hover:bg-cyan-300 transition-colors disabled:opacity-50"><LogIn size={16} /> {ocupado ? 'A entrar…' : 'Entrar no portal'}</button>
                <p className="text-xs text-slate-500 text-center">Esqueceu a password? Contacte a equipa CFTEC por WhatsApp ou <a href="/#suporte" className="text-cyan-400 hover:underline">formulário do site</a> — enviamos uma nova com segurança.</p>
              </form>
            ) : registoOk ? (
              <div className="mt-5 bg-white/[.03] border border-emerald-400/30 rounded-2xl p-7 text-center">
                <div className="flex justify-center text-emerald-400"><CheckCircle2 size={40} /></div>
                <h2 className="mt-3 text-xl font-extrabold">Registo enviado com sucesso!</h2>
                <p className="mt-2 text-sm text-slate-400 leading-relaxed max-w-md mx-auto">A equipa CFTEC vai validar os dados da empresa (<b>{fRegisto.nome_empresa}</b>) e activar o acesso — chegará o aviso por <b>e-mail</b> e <b>WhatsApp</b> normalmente no mesmo dia útil.</p>
                <button onClick={() => { setModoAlt('login'); setRegistoOk(false); setFRegisto({ nome_empresa: '', nif: '', nome_responsavel: '', telefone_whatsapp: '', email: '', password: '' }) }} className="mt-5 inline-flex items-center gap-2 border border-cyan-400/40 text-cyan-400 font-semibold rounded-lg px-4 py-2.5 text-sm hover:bg-cyan-400/10 transition-colors"><LogIn size={15} /> Ir para a entrada</button>
              </div>
            ) : (
              <form onSubmit={registarse} className="mt-5 bg-white/[.03] border border-white/10 rounded-2xl p-6 space-y-4">
                {aviso && modoAlt === 'registo' && <div className="text-sm bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-xl px-4 py-3">{aviso}</div>}
                <div className="grid md:grid-cols-2 gap-4">
                  <label className="block md:col-span-2"><span className="text-xs font-semibold text-slate-400">Nome da empresa *</span>
                    <input className="mt-1.5 w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-cyan-400/60" required value={fRegisto.nome_empresa} onChange={e => setFRegisto({ ...fRegisto, nome_empresa: e.target.value })} placeholder="Empresa Exemplo, Lda" /></label>
                  <label className="block"><span className="text-xs font-semibold text-slate-400">NIF *</span>
                    <input className="mt-1.5 w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-cyan-400/60" required value={fRegisto.nif} onChange={e => setFRegisto({ ...fRegisto, nif: e.target.value })} placeholder="5412345678" /></label>
                  <label className="block"><span className="text-xs font-semibold text-slate-400">Nome do responsável</span>
                    <input className="mt-1.5 w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-cyan-400/60" value={fRegisto.nome_responsavel} onChange={e => setFRegisto({ ...fRegisto, nome_responsavel: e.target.value })} placeholder="Maria Silva" /></label>
                  <label className="block"><span className="text-xs font-semibold text-slate-400">Telefone / WhatsApp *</span>
                    <input className="mt-1.5 w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-cyan-400/60" required value={fRegisto.telefone_whatsapp} onChange={e => setFRegisto({ ...fRegisto, telefone_whatsapp: e.target.value })} placeholder="+244 9xx xxx xxx" /></label>
                  <label className="block"><span className="text-xs font-semibold text-slate-400">E-mail *</span>
                    <input className="mt-1.5 w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-cyan-400/60" type="email" required value={fRegisto.email} onChange={e => setFRegisto({ ...fRegisto, email: e.target.value })} placeholder="geral@empresa.co" /></label>
                  <label className="block md:col-span-2"><span className="text-xs font-semibold text-slate-400">Password (mín. 8 caracteres) *</span>
                    <input className="mt-1.5 w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-cyan-400/60" type="password" required minLength={8} value={fRegisto.password} onChange={e => setFRegisto({ ...fRegisto, password: e.target.value })} placeholder="••••••••" autoComplete="new-password" /></label>
                </div>
                <button type="submit" disabled={ocupado} className="w-full inline-flex items-center justify-center gap-2 bg-cyan-400 text-slate-950 font-bold rounded-lg px-4 py-3 text-sm hover:bg-cyan-300 transition-colors disabled:opacity-50"><UserPlus size={16} /> {ocupado ? 'A enviar…' : 'Enviar registo para aprovação'}</button>
                <p className="text-xs text-slate-500 leading-relaxed">Após o envio, a equipa CFTEC valida os dados da empresa (NIF e contacto) e activa o acesso — é avisado por e-mail e WhatsApp normalmente no mesmo dia útil.</p>
              </form>
            )}
          </div>
        </main>
      </div>
    )

  // ─── vista: dentro (dashboard do cliente) ───
  const nAbertos = chamados.filter(c => c.estado !== 'Resolvido').length
  const licenciasActivas = licencas.filter(l => l.status === 'activa').length

  return (
    <div className="min-h-dvh bg-[#0e1726] text-slate-100">
      <header className="border-b border-white/10 sticky top-0 bg-[#0e1726]/95 backdrop-blur z-10">
        <div className="max-w-6xl mx-auto px-5 py-4 flex items-center justify-between gap-3">
          <a href="/" className="text-[22px] font-extrabold tracking-tight">CFTEC<span className="text-cyan-400">.</span> <span className="text-xs font-semibold text-slate-500 ml-1 hidden sm:inline">portal do cliente</span></a>
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-300 hidden md:inline">{sessao?.empresa}</span>
            <button onClick={sair} className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-rose-400 transition-colors"><LogOut size={15} /> Sair</button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-5 py-8">
        {aviso && <div className="mb-6 text-sm bg-cyan-400/10 border border-cyan-400/30 text-cyan-300 rounded-xl px-4 py-3 flex items-center gap-2"><CheckCircle2 size={16} /> {aviso}</div>}

        <div className="flex gap-1 p-1 rounded-xl bg-white/5 border border-white/10 w-max mb-6 overflow-x-auto max-w-full">
          {([['resumo', 'Resumo'], ['pedidos', 'Pedidos'], ['licencas', 'Licenças'], ['chamados', 'Chamados']] as const).map(([id, label]) => (
            <button key={id} onClick={() => { setTab(id); setAviso('') }} className={`px-4 py-2 text-sm rounded-lg whitespace-nowrap transition-all ${tab === id ? 'bg-cyan-400 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'}`}>{label}</button>
          ))}
        </div>

        {tab === 'resumo' && (
          <div className="space-y-6">
            <div className="grid sm:grid-cols-3 gap-4">
              {[['Pedidos totais', pedidos.length, <FileText key="p" size={18} />], ['Licenças activas', licenciasActivas, <KeyRound key="l" size={18} />], ['Chamados em aberto', nAbertos, <LifeBuoy key="c" size={18} />]].map(([label, val, ic]) => (
                <div key={String(label)} className="bg-white/[.03] border border-white/10 rounded-2xl p-5">
                  <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold uppercase tracking-wide">{ic} {String(label)}</div>
                  <div className="mt-2 text-3xl font-extrabold">{Number(val)}</div>
                </div>
              ))}
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white/[.03] border border-white/10 rounded-2xl p-6">
                <h3 className="font-bold flex items-center gap-2"><Building2 size={16} className="text-cyan-400" /> A sua conta</h3>
                <dl className="mt-4 space-y-2 text-sm">
                  <div className="flex justify-between gap-4"><dt className="text-slate-500">Empresa</dt><dd className="text-slate-200 text-right">{sessao?.empresa}</dd></div>
                  <div className="flex justify-between gap-4"><dt className="text-slate-500">E-mail</dt><dd className="text-slate-200 text-right">{sessao?.email}</dd></div>
                </dl>
                <form onSubmit={trocarSenha} className="mt-5 border-t border-white/10 pt-4 space-y-3">
                  <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5"><Lock size={13} /> Alterar password</span>
                  <input className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-cyan-400/60" type="password" required placeholder="Password actual" value={fSenha.password_actual} onChange={e => setFSenha({ ...fSenha, password_actual: e.target.value })} autoComplete="current-password" />
                  <input className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-cyan-400/60" type="password" required minLength={8} placeholder="Password nova (mín. 8)" value={fSenha.password_nova} onChange={e => setFSenha({ ...fSenha, password_nova: e.target.value })} autoComplete="new-password" />
                  <button type="submit" disabled={ocupado} className="inline-flex items-center gap-2 border border-cyan-400/40 text-cyan-400 font-semibold rounded-lg px-4 py-2 text-sm hover:bg-cyan-400/10 transition-colors disabled:opacity-50"><BadgeCheck size={15} /> {ocupado ? 'A guardar…' : 'Guardar nova password'}</button>
                </form>
              </div>
              <div className="bg-white/[.03] border border-white/10 rounded-2xl p-6">
                <h3 className="font-bold flex items-center gap-2"><Phone size={16} className="text-cyan-400" /> Falar com a equipa</h3>
                <p className="mt-3 text-sm text-slate-400 leading-relaxed">Para algo urgente (baixa de licença, falha crítica) o WhatsApp chega ao técnico na hora.</p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <a href={`https://wa.me/${whats}`} target="_blank" rel="noreferrer noopener" className="inline-flex items-center gap-2 bg-emerald-500 text-slate-950 font-bold rounded-lg px-4 py-2.5 text-sm hover:bg-emerald-400 transition-colors"><MessageCircle size={15} /> WhatsApp</a>
                  <a href={`tel:+${whats}`} className="inline-flex items-center gap-2 border border-white/15 text-slate-300 rounded-lg px-4 py-2.5 text-sm hover:bg-white/5 transition-colors"><Phone size={15} /> Ligar</a>
                  <a href="/#suporte" className="inline-flex items-center gap-2 border border-white/15 text-slate-300 rounded-lg px-4 py-2.5 text-sm hover:bg-white/5 transition-colors"><Mail size={15} /> Formulário</a>
                </div>
                <p className="mt-4 text-xs text-slate-500">Contrato e facturação: contacte o comercial no mesmo WhatsApp.</p>
              </div>
            </div>
          </div>
        )}

        {tab === 'pedidos' && (
          pedidos.length === 0
            ? <Empty ic={<FileText size={44} />} t="Sem pedidos por agora" d="Quando fizer um pedido de licença no site (ou com o comercial), ele aparece aqui com o estado em directo." />
            : <div className="space-y-3">{pedidos.map(p => (
              <div key={p.id} className="bg-white/[.03] border border-white/10 rounded-2xl p-5 flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <strong className="text-[15px]">{p.software_nome}</strong>
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${statusTone(p.status)}`}>{p.status}</span>
                  </div>
                  <p className="mt-1.5 text-xs text-slate-500">#{p.id.slice(0, 8).toUpperCase()} · {fmt(p.created_at)} · {p.forma_pagamento || 'forma de pagamento por definir'}{p.provincia ? ` · ${p.provincia}` : ''}</p>
                  {p.observacoes && <p className="mt-2 text-sm text-slate-300 bg-white/5 border border-white/10 rounded-lg px-3 py-2"><b className="text-slate-400 text-xs">Nota da equipa:</b> {p.observacoes}</p>}
                </div>
                <div className="shrink-0 flex flex-col gap-2 min-w-[170px]">
                  <a href={`/api/portal/pedidos/${p.id}/proforma.pdf`} target="_blank" rel="noreferrer noopener" className="inline-flex items-center justify-center gap-2 text-sm border border-white/15 text-slate-200 rounded-lg px-3.5 py-2 hover:bg-white/5 transition-colors"><Download size={15} /> Proforma PDF</a>
                  {p.status === 'Pago' && <a href={`/api/portal/pedidos/${p.id}/ft.pdf`} target="_blank" rel="noreferrer noopener" className="inline-flex items-center justify-center gap-2 text-sm border border-cyan-400/30 bg-cyan-400/10 text-cyan-200 rounded-lg px-3.5 py-2 hover:bg-cyan-400/15 transition-colors"><Receipt size={15} /> Recibo / FT</a>}
                  <a href={`https://wa.me/${whats}`} target="_blank" rel="noreferrer noopener" className={`text-center text-[11px] ${whats ? 'text-slate-500 hover:text-slate-300' : 'pointer-events-none opacity-50'} transition-colors`}>Dúvidas — falar com o comercial →</a>
                </div>
              </div>
            ))}</div>
        )}

        {tab === 'licencas' && (
          licencas.length === 0
            ? <Empty ic={<KeyRound size={44} />} t="Sem licenças activas" d="As chaves de activação dos seus softwares aparecem aqui assim que emitidas pela equipa." />
            : <div className="space-y-3">{licencas.map(l => {
              const expira = l.data_expiracao ? new Date(l.data_expiracao + 'T00:00:00').getTime() : null
              const dias = expira ? Math.ceil((expira - Date.now()) / 86400000) : null
              return (
                <div key={l.id} className={`bg-white/[.03] border rounded-2xl p-5 flex flex-wrap items-start justify-between gap-4 ${dias !== null && dias <= 15 ? 'border-amber-400/30' : 'border-white/10'}`}>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${statusTone(l.status === 'activa' ? 'Activo' : l.status)}`}>{l.status === 'activa' ? 'Activa' : l.status}</span>
                      {dias !== null && dias <= 15 && dias >= 0 && <span className="text-[11px] font-bold text-amber-400">expira {dias === 0 ? 'hoje' : `em ${dias} dia(s)`}</span>}
                      {dias !== null && dias < 0 && <span className="text-[11px] font-bold text-rose-400">expirada</span>}
                    </div>
                    <code className="mt-2 block text-cyan-300 text-base tracking-wider select-all">{l.chave_licenca}</code>
                    <p className="mt-1.5 text-xs text-slate-500">activada {fmt(l.data_ativacao)} · expira {fmt(l.data_expiracao)}</p>
                  </div>
                  {dias !== null && dias <= 15 && <a href={`https://wa.me/${whats}`} target="_blank" rel="noreferrer noopener" className="inline-flex items-center gap-1.5 text-xs bg-emerald-500/10 border border-emerald-400/30 text-emerald-300 rounded-lg px-3 py-2 hover:bg-emerald-500/20 transition-colors"><MessageCircle size={13} /> Renovar</a>}
                </div>
              )
            })}</div>
        )}

        {tab === 'chamados' && (
          <div className="space-y-6">
            <form onSubmit={abrirChamado} className="bg-white/[.03] border border-white/10 rounded-2xl p-6 space-y-4">
              <h3 className="font-bold flex items-center gap-2"><LifeBuoy size={16} className="text-cyan-400" /> Abrir novo chamado de suporte</h3>
              <div className="grid md:grid-cols-[240px_1fr] gap-4">
                <label className="block"><span className="text-xs font-semibold text-slate-400">Software / área</span>
                  <input className="mt-1.5 w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-cyan-400/60" value={fChamado.software} onChange={e => setFChamado({ ...fChamado, software: e.target.value })} placeholder="PalancaSoft, Rede, Hardware…" /></label>
                <label className="block"><span className="text-xs font-semibold text-slate-400">Descreve o problema *</span>
                  <textarea className="mt-1.5 w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-cyan-400/60 min-h-[92px]" required minLength={10} maxLength={1200} value={fChamado.descricao_problema} onChange={e => setFChamado({ ...fChamado, descricao_problema: e.target.value })} placeholder="O que acontece? Desde quando? Mensagens de erro no ecrã?" /></label>
              </div>
              <button type="submit" disabled={ocupado} className="inline-flex items-center gap-2 bg-cyan-400 text-slate-950 font-bold rounded-lg px-4 py-2.5 text-sm hover:bg-cyan-300 transition-colors disabled:opacity-50"><Send size={15} /> {ocupado ? 'A enviar…' : 'Enviar à equipa técnica'}</button>
              <p className="text-xs text-slate-500">A equipa recebe na hora (notificação + e-mail). Urgências críticas: ligue pelo WhatsApp.</p>
            </form>
            {chamados.length === 0
              ? <Empty ic={<LifeBuoy size={44} />} t="Sem chamados" d="Os pedidos de apoio (deste portal e do site) ficam aqui com o estado em tempo real." />
              : <div className="space-y-3">{chamados.map(c => (
                <div key={c.id} className="bg-white/[.03] border border-white/10 rounded-2xl p-5">
                  <div className="flex items-center gap-2 flex-wrap justify-between">
                    <div className="flex items-center gap-2 flex-wrap">
                      <strong>{c.software || 'Apoio geral'}</strong>
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${statusTone(c.estado === 'Resolvido' ? 'Resolvido' : c.estado === 'Em Resolução' ? 'Em Resolução' : 'Pendente')}`}>{c.estado}</span>
                      <span className="text-[11px] text-slate-500">{c.prioridade}</span>
                      <span className={`text-[11px] px-2 py-0.5 rounded-full border inline-flex items-center gap-1`}><Timer size={10} /> {slaDoCliente(c).texto}</span>
                    </div>
                    <span className="text-xs text-slate-500">{fmt(c.created_at)}{c.updated_at !== c.created_at ? ` · actualizado ${fmt(c.updated_at)}` : ''}</span>
                  </div>
                  <p className="mt-2.5 text-sm text-slate-300 leading-relaxed">{c.problema}</p>
                  {c.resolucao && <p className="mt-2 text-sm text-emerald-300 bg-emerald-400/5 border border-emerald-400/20 rounded-lg px-3 py-2"><b className="text-xs block text-emerald-400 mb-0.5">Resolução da equipa:</b>{c.resolucao}</p>}
                  <button onClick={() => void abrirConversa(c)} className="mt-3 text-xs font-bold text-cyan-300 hover:text-cyan-200 inline-flex items-center gap-1.5"><MessageSquare size={13} /> {conversaId === c.id ? 'Fechar conversa' : 'Ver conversa / responder'}</button>
                  {conversaId === c.id && <div className="mt-3 space-y-2">
                    {carregandoMsgs ? <p className="text-xs text-slate-500">A abrir conversa…</p>
                      : mensagens.length === 0 ? <p className="text-xs text-slate-500">Sem mensagens ainda — escreva a primeira ou aguarde a equipa.</p>
                        : mensagens.map(m => (
                          <div key={m.id} className={m.autor === 'tecnico' ? 'bg-emerald-400/5 border border-emerald-400/20 rounded-lg px-3 py-2' : m.autor === 'cliente' ? 'bg-cyan-400/5 border border-cyan-400/20 rounded-lg px-3 py-2 ml-8' : 'text-[11px] text-slate-500 px-3'}>
                            <b className="text-[10px] block mb-0.5 uppercase tracking-wide text-slate-400">{m.autor_nome || (m.autor === 'cliente' ? 'Você' : 'Equipa CFTEC')} · {fmt(m.created_at)}</b>
                            <span className="text-sm text-slate-200 whitespace-pre-wrap">{m.corpo}</span>
                          </div>
                        ))}
                    <div ref={fimConversa} />
                    {c.estado !== 'Resolvido' && <form onSubmit={e => { e.preventDefault(); void enviarMensagem(c.id) }} className="flex gap-2 items-end">
                      <textarea value={novaMsg} onChange={e => setNovaMsg(e.target.value)} maxLength={1500} rows={2} placeholder="Escreva aqui a sua resposta…" className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-cyan-400/60" />
                      <button type="submit" disabled={ocupado || !novaMsg.trim()} className="bg-cyan-400 text-slate-950 font-bold rounded-lg px-3 py-2 text-xs hover:bg-cyan-300 transition-colors disabled:opacity-50"><Send size={13} /></button>
                    </form>}
                  </div>}
                  {c.estado === 'Resolvido' && (
                    typeof c.csat === 'number'
                      ? <div className="mt-3 text-xs text-amber-300 inline-flex items-center gap-1.5">{Array.from({ length: 5 }, (_, i) => <Star key={i} size={13} className={i < (c.csat as number) ? 'fill-amber-300 text-amber-300' : 'text-slate-600'} />)} <span className="ml-1">avaliado: {c.csat}/5 — obrigado!</span></div>
                      : <div className="mt-3 bg-white/[.04] border border-white/10 rounded-xl p-4">
                        <p className="text-xs text-slate-400 mb-2 font-semibold">💬 O atendimento ficou a fechar? Avalie este chamado (1-5 estrelas):</p>
                        <div className="flex items-center gap-1.5">
                          {([1, 2, 3, 4, 5] as const).map(n => (
                            <button key={n} onClick={() => setCsatRascunho({ id: c.id, nota: n, comentario: csatRascunho?.id === c.id ? csatRascunho.comentario : '' })} className="p-0.5">
                              <Star size={22} className={(csatRascunho?.id === c.id && (csatRascunho?.nota || 0) >= n) ? 'fill-amber-300 text-amber-300' : 'text-slate-600 hover:text-amber-200'} />
                            </button>
                          ))}
                        </div>
                        {csatRascunho?.id === c.id && csatRascunho.nota > 0 && <div className="mt-2.5 flex gap-2 items-end flex-wrap">
                          <textarea value={csatRascunho.comentario} onChange={e => setCsatRascunho({ ...csatRascunho, comentario: e.target.value })} rows={1} maxLength={500} placeholder="Comentário (opcional)" className="flex-1 min-w-[200px] bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-cyan-400/60" />
                          <button onClick={() => void enviarCsat(c.id)} disabled={ocupado} className="bg-amber-300 text-slate-950 font-bold rounded-lg px-3.5 py-2 text-xs hover:bg-amber-200 transition-colors disabled:opacity-50">Enviar nota {csatRascunho.nota}/5</button>
                        </div>}
                      </div>
                  )}
                </div>
              ))}</div>}
          </div>
        )}
      </main>

      <footer className="border-t border-white/10 mt-12">
        <div className="max-w-6xl mx-auto px-5 py-6 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
          <span>CFTEC · cftec.co — engenharia digital para negócios que avançam</span>
          <span className="inline-flex items-center gap-1.5"><Activity size={12} /> Sessão segura (HTTPS · cookie de cliente)</span>
        </div>
      </footer>
    </div>
  )
}

function Empty({ ic, t, d }: { ic: React.ReactNode; t: string; d: string }) {
  return (
    <div className="border border-dashed border-white/10 rounded-2xl p-10 text-center">
      <div className="flex justify-center text-slate-600">{ic}</div>
      <h3 className="mt-4 font-bold text-slate-300">{t}</h3>
      <p className="mt-1.5 text-sm text-slate-500 max-w-md mx-auto leading-relaxed">{d}</p>
    </div>
  )
}
