import type { Dispatch, FormEvent, SetStateAction } from 'react'
import { AlertTriangle, BookOpen, ChevronRight, Eye, Pencil, Plus, Search, Trash2, X } from 'lucide-react'
import { IconThumb } from '../../components/animIcons'
import { Button } from '../../components/ui/button'
import { Card } from '../../components/ui/card'
import { WikiModal, type WikiFormShape } from '../modals/WikiModal'
import type { Software, WikiArtigo } from '../types'

// Fase 3 — secção Wiki Técnica extraída do AdminDashboard (JSX byte-a-byte, estado via props)
type WikiSectionProps = {
  wiki: WikiArtigo[]
  wikiSearch: string
  setWikiSearch: Dispatch<SetStateAction<string>>
  wikiForm: WikiFormShape
  setWikiForm: Dispatch<SetStateAction<WikiFormShape>>
  setEditingWiki: (valor: WikiArtigo | null) => void
  setShowWikiForm: (valor: boolean) => void
  showWikiForm: boolean
  editingWiki: WikiArtigo | null
  savingWiki: boolean
  guardarWiki: (event: FormEvent<HTMLFormElement>) => Promise<void> | void
  software: Software[]
  deletingWikiId: string | null
  setDeletingWikiId: (valor: string | null) => void
  handleWikiDelete: () => Promise<void> | void
  toggleWiki_cliente: (artigo: WikiArtigo) => Promise<void> | void
}

export function WikiSection({ wiki, wikiSearch, setWikiSearch, wikiForm, setWikiForm, setEditingWiki, setShowWikiForm, showWikiForm, editingWiki, savingWiki, guardarWiki, software, deletingWikiId, setDeletingWikiId, handleWikiDelete, toggleWiki_cliente }: WikiSectionProps) {
  return (
    <Card className="admin-panel admin-section-panel"><div className="admin-panel-head"><div><span className="admin-panel-kicker">BASE DE CONHECIMENTO INTERNA</span><h2>Wiki técnica</h2></div><div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}><div className="license-search"><Search size={15} /><input value={wikiSearch} onChange={(e) => setWikiSearch(e.target.value)} placeholder="Pesquisar problema, software ou tag..." /></div><Button size="sm" onClick={() => { setEditingWiki(null); setWikiForm({ titulo: '', software: '', problema: '', solucao: '', tags: '' }); setShowWikiForm(true) }}><Plus size={15} /> Nova solução</Button></div></div><p style={{ margin: '0 0 16px', color: '#64748b', fontSize: '.72rem', lineHeight: 1.6 }}>Soluções que a equipa técnica já resolveu — quando um chamado igual voltar, pesquise aqui antes de gastar tempo a descobrir de novo. Com o <b>olho</b> publica o artigo na <b>Ajuda do portal do cliente</b> (o cliente tenta primeiro, abre chamado só se não resolver).</p>{wiki.length === 0 ? <div className="admin-empty-state"><BookOpen size={48} /><h3>{wikiSearch ? 'Nada encontrado' : 'Wiki vazia'}</h3><p>{wikiSearch ? `Nenhum artigo corresponde a "${wikiSearch}" — tenta outros termos ou tags.` : 'Regista a primeira solução — passo-a-passo de um problema real que já resolveste. Da próxima vez, pesquise e resolva em segundos.'}</p><Button size="lg" onClick={() => { setEditingWiki(null); setWikiForm({ titulo: '', software: '', problema: '', solucao: '', tags: '' }); setShowWikiForm(true) }}><Plus size={16} /> Nova solução</Button></div> : (() => { const q = wikiSearch.trim().toLowerCase(); const visiveis = q ? wiki.filter(a => `${a.titulo} ${a.software || ''} ${a.problema} ${a.solucao} ${a.tags || ''}`.toLowerCase().includes(q)) : wiki; return visiveis.length === 0 ? <div className="admin-empty-state"><BookOpen size={40} /><h3>Nada para "{wikiSearch}"</h3><p>Guarda mesmo assim uma solução nova com este problema — assim o próximo collega encontra.</p></div> : <div className="wiki-list">{visiveis.map((a) => <details key={a.id} className="wiki-item"><summary><span className="wiki-software" data-tip={a.software ? `Aplica-se a ${a.software}` : 'Software não especificado'}>{a.software || 'Geral'}</span><strong>{a.titulo}</strong><small>actualizado {new Date(a.updated_at).toLocaleDateString('pt-PT')} · {a.autor || '—'}{a.visivel_cliente && <b style={{ color: '#10b981', marginLeft: 8, fontSize: '.62rem', textTransform: 'uppercase', letterSpacing: '.08em' }}>FAQ cliente{(a.ajudou || 0) > 0 ? <> · <IconThumb size={11} /> {a.ajudou}</> : ''}</b>}</small><b className="wiki-open-hint"><ChevronRight size={14} /></b></summary><div className="wiki-body"><div className="wiki-block"><span>Problema / sintoma</span><p>{a.problema}</p></div><div className="wiki-block wiki-block--sol"><span>Solução passo-a-passo</span><p>{a.solucao}</p></div>{a.tags && <div className="wiki-tags">{a.tags.split(',').map((t) => t.trim()).filter(Boolean).map((t) => <span key={t} className="wiki-tag"><b onClick={(e) => { e.preventDefault(); e.stopPropagation(); setWikiSearch(t) }}>#{t}</b></span>)}</div>}<div className="service-admin-actions"><button className="icon-btn" data-tip={a.visivel_cliente ? 'Retirar da Ajuda do cliente' : 'Publicar na Ajuda do cliente (Parte 7.2)'} title={a.visivel_cliente ? 'Retirar da Ajuda do cliente' : 'Publicar na Ajuda do cliente'} onClick={(e) => { e.preventDefault(); void toggleWiki_cliente(a) }} style={a.visivel_cliente ? { color: '#10b981', borderColor: 'rgba(16,185,129,.4)' } : undefined}><Eye size={16} /></button><button className="icon-btn" title="Editar solução" onClick={(e) => { e.preventDefault(); setEditingWiki(a); setWikiForm({ titulo: a.titulo, software: a.software || '', problema: a.problema, solucao: a.solucao, tags: a.tags || '' }); setShowWikiForm(true) }}><Pencil size={16} /></button><button className="icon-btn danger" title="Eliminar" onClick={(e) => { e.preventDefault(); setDeletingWikiId(a.id) }}><Trash2 size={16} /></button></div></div></details>)}</div> })()}{showWikiForm && <WikiModal wikiForm={wikiForm} setWikiForm={setWikiForm} software={software} wiki={wiki} editingWiki={editingWiki} savingWiki={savingWiki} guardarWiki={guardarWiki} onClose={() => setShowWikiForm(false)} />}
        {deletingWikiId && <div className="admin-modal-backdrop" onMouseDown={() => setDeletingWikiId(null)}><div className="admin-modal admin-modal--confirm" onMouseDown={(e) => e.stopPropagation()}><div className="admin-modal-head"><span className="admin-modal-warn"><AlertTriangle size={20} /></span><div><span className="admin-panel-kicker">CONFIRMAÇÃO</span><h2>Eliminar artigo da wiki</h2></div><button onClick={() => setDeletingWikiId(null)}><X size={18} /></button></div><p>Eliminar esta solução da base de conhecimento? O técnico perde esta referência. Esta acção não pode ser desfeita.</p><div className="admin-modal-actions"><Button variant="outline" onClick={() => setDeletingWikiId(null)}>Cancelar</Button><Button variant="dark" onClick={handleWikiDelete}><Trash2 size={15} /> Eliminar artigo</Button></div></div></div>}</Card>
  )
}
