import type { Dispatch, FormEvent, SetStateAction } from 'react'
import { BookOpen, Check, X } from 'lucide-react'
import { Button } from '../../components/ui/button'

// Fase 1 — modal da Wiki Técnica extraído do AdminDashboard (JSX byte-a-byte)
export type WikiFormShape = { titulo: string; software: string; problema: string; solucao: string; tags: string }

type WikiModalProps = {
  wikiForm: WikiFormShape
  setWikiForm: Dispatch<SetStateAction<WikiFormShape>>
  software: ReadonlyArray<{ name: string }>
  wiki: ReadonlyArray<{ software: string | null; tags: string | null }>
  editingWiki: { titulo: string } | null
  savingWiki: boolean
  guardarWiki: (event: FormEvent<HTMLFormElement>) => Promise<void> | void
  onClose: () => void
}

export function WikiModal({ wikiForm, setWikiForm, software, wiki, editingWiki, savingWiki, guardarWiki, onClose }: WikiModalProps) {
          // sugestões datalist: softwares do catálogo + os já usados na wiki; tags existentes
          const sugerirSoft = [...new Set([...software.map(s => s.name), ...wiki.map(a => a.software).filter((s): s is string => Boolean(s))])].sort((a, b) => a.localeCompare(b))
          const sugerirTags = [...new Set(wiki.flatMap(a => (a.tags || '').split(',').map(t => t.trim()).filter(Boolean)))].sort((a, b) => a.localeCompare(b))
          const pLen = wikiForm.problema.length
          const sLen = wikiForm.solucao.length
          return <div className="admin-modal-backdrop" onMouseDown={() => onClose()}><div className="admin-modal admin-modal--lg wiki-modal" onMouseDown={(e) => e.stopPropagation()}><div className="admin-modal-head wiki-modal-head"><div><span className="admin-panel-kicker">{editingWiki ? 'EDITAR SOLUÇÃO · BASE DE CONHECIMENTO' : 'NOVA SOLUÇÃO · BASE DE CONHECIMENTO'}</span><h2>{editingWiki ? `Editar "${editingWiki.titulo.slice(0, 32)}${editingWiki.titulo.length > 32 ? '…' : ''}"` : 'Registar solução na wiki técnica'}</h2><small className="wiki-modal-meta"><BookOpen size={11} /> Ficha SOP — o artigo alimenta a pesquisa da equipa e a ajuda do portal</small></div><button onClick={() => onClose()} className="admin-modal-close" aria-label="Fechar"><X size={18} /></button></div><form className="admin-modal-body wiki-modal-body" onSubmit={guardarWiki}>
          <fieldset className="wiki-fs"><legend><span className="wiki-fs-num">01</span>Identificação</legend><div className="wiki-fs-grid">
          <label className="wiki-fs-full">Título do artigo<input value={wikiForm.titulo} onChange={(e) => setWikiForm(f => ({ ...f, titulo: e.target.value }))} placeholder="Ex.: Impressora térmica não imprime após actualização de driver" required maxLength={160} autoFocus /></label>
          <label>Software (opcional)<input value={wikiForm.software} onChange={(e) => setWikiForm(f => ({ ...f, software: e.target.value }))} placeholder="Ex.: PalancaSoft ERP" maxLength={120} list="wiki-soft-sugestoes" /><datalist id="wiki-soft-sugestoes">{sugerirSoft.map(s => <option key={s} value={s} />)}</datalist></label>
          <label>Tags (vírgulas)<input value={wikiForm.tags} onChange={(e) => setWikiForm(f => ({ ...f, tags: e.target.value }))} placeholder="Ex.: impressora, usb, talões" maxLength={200} list="wiki-tags-sugestoes" /><datalist id="wiki-tags-sugestoes">{sugerirTags.map(t => <option key={t} value={t} />)}</datalist></label>
          <small className="wiki-fs-hint wiki-fs-full">Os campos abaixo preenchem as sugestões da próxima pesquisa — software e tags reutilizam os registos anteriores.</small>
          </div></fieldset>
          <div className="wiki-fs-duplo">
          <fieldset className="wiki-fs"><legend><span className="wiki-fs-num wiki-fs-num--prob">02</span>Problema / sintoma<small className={`wiki-char-count ${pLen > 1350 ? 'wiki-char-count--max' : pLen > 1050 ? 'wiki-char-count--warn' : ''}`}>{pLen} / 1500</small></legend><textarea rows={9} aria-label="Problema / sintoma" value={wikiForm.problema} onChange={(e) => setWikiForm(f => ({ ...f, problema: e.target.value }))} placeholder="O que o cliente vê: mensagens de erro, comportamento estranho, quando acontece..." required maxLength={1500} /></fieldset>
          <fieldset className="wiki-fs"><legend><span className="wiki-fs-num wiki-fs-num--sol">03</span>Solução passo-a-passo<small className={`wiki-char-count ${sLen > 7200 ? 'wiki-char-count--max' : sLen > 5600 ? 'wiki-char-count--warn' : ''}`}>{sLen} / 8000</small></legend><textarea rows={9} className="wiki-fs-mono" aria-label="Solução passo-a-passo" value={wikiForm.solucao} onChange={(e) => setWikiForm(f => ({ ...f, solucao: e.target.value }))} placeholder={'1. Verificar cabo USB e alimentação\n2. Painel de controlo → dispositivos → thermal\n3. Reinstalar driver X do fabricante'} required maxLength={8000} /><p className="admin-field-hint">Passos numerados — as quebras de linha ficam preservadas na leitura do artigo.</p></fieldset>
          </div>
          <div className="admin-modal-actions"><Button variant="outline" type="button" onClick={() => onClose()}>Cancelar</Button><Button type="submit" disabled={savingWiki}><Check size={15} /> {savingWiki ? 'A guardar…' : editingWiki ? 'Guardar alterações' : 'Registar solução'}</Button></div>
</form></div></div>
}
