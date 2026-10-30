import { useEffect, useRef, useState } from 'react'
import { BookOpen, Building2, FileDown, KeyRound, LifeBuoy, Search, ShoppingCart, UserPlus, Users } from 'lucide-react'

// Productividade admin (Parte A) — paleta de pesquisa global activada com ⌘K / Ctrl+K.
// Busca via /api/admin/search e navega com callbacks do dashboard (nada de estado de negócio aqui).
export type ItemBusca = {
  id: string
  tipo: string
  titulo: string
  sub: string
  criadoEm?: string
  nif?: string | null
  estado?: string | null
  chamado?: { cliente: string; estado: string; software: string | null; telefone?: string | null; csat?: number | null; prioridade?: string | null }
}

type Grupo = { tipo: string; itens: ItemBusca[] }

type MetaGrupo = { label: string; Icon: typeof LifeBuoy }

const META_GRUPOS: Record<string, MetaGrupo> = {
  chamados: { label: 'Chamados de suporte', Icon: LifeBuoy },
  contactos: { label: 'Contactos · funil', Icon: UserPlus },
  pedidos: { label: 'Pedidos de licença', Icon: ShoppingCart },
  licencas: { label: 'Licenças PalancaSoft', Icon: KeyRound },
  portal: { label: 'Portal do cliente', Icon: Building2 },
  parceiros: { label: 'Revenda Negomil', Icon: Users },
  wiki: { label: 'Wiki técnica', Icon: BookOpen },
  softwares: { label: 'Softwares & downloads', Icon: FileDown },
}

export const SECCAO_BUSCA: Record<string, string> = {
  chamados: 'chamados',
  contactos: 'contactos',
  pedidos: 'pedidos',
  licencas: 'licencas',
  portal: 'portal',
  parceiros: 'parceiros',
  wiki: 'wiki',
  softwares: 'software',
}

type GlobalSearchProps = {
  aberta: boolean
  setAberta: (valor: boolean) => void
  navegar: (item: ItemBusca) => void
}

export function GlobalSearch({ aberta, setAberta, navegar }: GlobalSearchProps) {
  const [termo, setTermo] = useState('')
  const [grupos, setGrupos] = useState<Grupo[]>([])
  const [aCarregar, setACarregar] = useState(false)
  const [ativo, setAtivo] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listaRef = useRef<HTMLDivElement>(null)

  const planos = grupos.flatMap(g => g.itens)
  const planoActivo = planos[ativo] || null

  // Atalho global ⌘K / Ctrl+K e Esc — registado sempre, mesmo com a paleta fechada
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault()
        setAberta(!aberta)
        return
      }
      if (e.key === 'Escape' && aberta) {
        e.preventDefault()
        setAberta(false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [aberta, setAberta])

  // Foco no input ao abrir + reset
  useEffect(() => {
    if (aberta) {
      setAtivo(0)
      const t = window.setTimeout(() => inputRef.current?.focus(), 30)
      return () => window.clearTimeout(t)
    }
  }, [aberta])

  // Busca com debounce de 250 ms (mínimo 2 caracteres)
  useEffect(() => {
    if (!aberta) return
    const q = termo.trim()
    if (q.length < 2) { setGrupos([]); setACarregar(false); return }
    setACarregar(true)
    const timer = window.setTimeout(async () => {
      try {
        const r = await fetch(`/api/admin/search?q=${encodeURIComponent(q)}`, { credentials: 'include' })
        const data = await r.json()
        if (!r.ok || !data.ok) { setGrupos([]); return }
        // o tipo vive no grupo no backend — propaga-o para cada item (o dashboard navega por item.tipo)
        setGrupos(((data.grupos || []) as Grupo[]).map(g => ({ ...g, itens: g.itens.map(i => ({ ...i, tipo: g.tipo })) })))
      } catch {
        setGrupos([])
      } finally {
        setACarregar(false)
      }
    }, 250)
    return () => window.clearTimeout(timer)
  }, [termo, aberta])

  // setas mantêm o cursor visível
  useEffect(() => {
    listaRef.current?.querySelector('.admin-palette-item.is-active')?.scrollIntoView({ block: 'nearest' })
  }, [ativo])

  if (!aberta) return null

  const escolher = () => {
    if (!planoActivo) return
    navegar(planoActivo)
    setTermo('')
  }

  const onInputKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setAtivo(i => Math.min(i + 1, planos.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setAtivo(i => Math.max(i - 1, 0)) }
    else if (e.key === 'Enter') { e.preventDefault(); escolher() }
  }

  return (
    <div className="admin-palette-backdrop" onMouseDown={() => setAberta(false)}>
      <div className="admin-palette" onMouseDown={e => e.stopPropagation()} role="dialog" aria-label="Pesquisa global">
        <div className="admin-palette-head">
          <Search size={17} />
          <input
            ref={inputRef}
            value={termo}
            onChange={e => { setTermo(e.target.value); setAtivo(0) }}
            onKeyDown={onInputKey}
            placeholder="Pesquisar cliente, NIF, chamado, licença, artigo…"
            maxLength={60}
          />
          <kbd>Esc</kbd>
        </div>
        <div className="admin-palette-body" ref={listaRef}>
          {termo.trim().length < 2 ? (
            <p className="admin-palette-empty">Escreve pelo menos 2 caracteres — ex.: nome do cliente, NIF, chave PS-…, nº de chamado.</p>
          ) : aCarregar ? (
            <p className="admin-palette-empty">A pesquisar…</p>
          ) : planos.length === 0 ? (
            <p className="admin-palette-empty">Sem resultados para «{termo.trim()}».</p>
          ) : (
            grupos.map(g => {
              const meta = META_GRUPOS[g.tipo]
              if (!meta) return null
              const Icon = meta.Icon
              return (
                <div className="admin-palette-grupo" key={g.tipo}>
                  <div className="admin-palette-grupo-head"><Icon size={13} /> {meta.label}</div>
                  {g.itens.map(item => {
                    const idx = planos.findIndex(p => p.id === item.id)
                    return (
                      <button
                        key={g.tipo + item.id}
                        className={`admin-palette-item ${idx === ativo ? 'is-active' : ''}`}
                        onMouseEnter={() => setAtivo(idx)}
                        onClick={escolher}
                      >
                        <span className="admin-palette-item-titulo">{item.titulo}</span>
                        <span className="admin-palette-item-sub">{item.sub}</span>
                        {item.estado && <span className="admin-palette-item-badge">{item.estado}</span>}
                      </button>
                    )
                  })}
                </div>
              )
            })
          )}
        </div>
        <div className="admin-palette-foot">
          <span><kbd>↑</kbd><kbd>↓</kbd> navegar</span>
          <span><kbd>Enter</kbd> abrir</span>
          <span><kbd>⌘K</kbd> fechar/abrir</span>
        </div>
      </div>
    </div>
  )
}
