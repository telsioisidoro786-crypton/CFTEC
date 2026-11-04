import { useCallback, useEffect, useRef, useState } from 'react'
import type { DragEvent } from 'react'
import { Check, Copy, Github, RefreshCw, Send, Trash2, UploadCloud, X } from 'lucide-react'
import { Button } from '../../components/ui/button'

// GitHub Releases — publicação de instaladores directamente pela área admin.
// Ficheiro até 2 GB: o browser emite ao servidor, que re-streama para
// uploads.github.com e devolve o URL do asset + SHA-256 (integridade comprovada).
type GhAsset = { id: number; nome: string; bytes: number; url: string; estado: string }
type GhRelease = { id: number; tag: string; titulo: string; descricao: string | null; draft: boolean; publicado: string | null; assets: GhAsset[] }

const MB = 1024 * 1024
const fmt = (b: number) => (b >= MB ? `${(b / MB).toFixed(1)} MB` : `${(b / 1024).toFixed(0)} KB`)
type RespostaUpload = { ok: boolean; corpo: { asset?: { url: string; sha256: string; bytes: number }; error?: string } }

type Props = { isOpen: boolean; onClose: () => void; onAviso: (msg: string) => void }

export function GitHubReleaseModal({ isOpen, onClose, onAviso }: Props) {
  const [releases, setReleases] = useState<GhRelease[]>([])
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState('')

  const [novaTag, setNovaTag] = useState('')
  const [novaTitulo, setNovaTitulo] = useState('')
  const [novaDesc, setNovaDesc] = useState('')
  const [aCriar, setACriar] = useState(false)

  const [relSeleccionada, setRelSeleccionada] = useState<number | null>(null)
  const [ficheiro, setFicheiro] = useState<File | null>(null)
  const [progresso, setProgresso] = useState(-1)
  const [resultado, setResultado] = useState<{ url: string; sha256: string; bytes: number } | null>(null)
  const [copiado, setCopiado] = useState('')
  const ficheiroRef = useRef<HTMLInputElement>(null)

  const carregar = useCallback(async () => {
    setCarregando(true)
    setErro('')
    try {
      const r = await fetch('/api/admin/github/releases', { credentials: 'include' })
      const j = await r.json().catch(() => ({}))
      if (!r.ok || !j.ok) throw new Error(j.error || `HTTP ${r.status}`)
      setReleases(j.releases || [])
      setRelSeleccionada(prev => (prev && (j.releases || []).some((x: GhRelease) => x.id === prev) ? prev : (j.releases || [])[0]?.id ?? null))
    } catch (e) {
      setErro(e instanceof Error ? e.message : String(e))
    } finally {
      setCarregando(false)
    }
  }, [])

  useEffect(() => { if (isOpen) { void carregar(); setResultado(null); setFicheiro(null); setProgresso(-1) } }, [isOpen, carregar])

  if (!isOpen) return null

  const criarRelease = async () => {
    const tag = novaTag.trim()
    if (!tag) return
    setACriar(true)
    setErro('')
    try {
      const r = await fetch('/api/admin/github/releases', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tag, titulo: novaTitulo.trim() || tag, descricao: novaDesc.trim() }),
      })
      const j = await r.json().catch(() => ({}))
      if (!r.ok || !j.ok) throw new Error(j.error || `HTTP ${r.status}`)
      onAviso(`Release ${tag} criada no GitHub`)
      setNovaTag(''); setNovaTitulo(''); setNovaDesc('')
      await carregar()
      setRelSeleccionada(j.release?.id ?? null)
    } catch (e) {
      setErro(e instanceof Error ? e.message : String(e))
    } finally {
      setACriar(false)
    }
  }

  const enviar = async () => {
    if (!ficheiro || relSeleccionada === null) return
    const rel = releases.find(x => x.id === relSeleccionada)
    setProgresso(0)
    setResultado(null)
    setErro('')
    try {
      const url = `/api/admin/github/releases/${relSeleccionada}/asset?name=${encodeURIComponent(ficheiro.name)}`
      const msg = await new Promise<RespostaUpload>((resolve) => {
        const xhr = new XMLHttpRequest()
        xhr.open('POST', url)
        xhr.withCredentials = true
        xhr.upload.onprogress = (ev) => {
          if (ev.lengthComputable) setProgresso(Math.round((ev.loaded / ev.total) * 90))
        }
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) resolve({ ok: true, corpo: JSON.parse(xhr.responseText) })
          else if (xhr.status === 401) resolve({ ok: false, corpo: { error: 'Sessão expirada — reentre e tente de novo.' } })
          else resolve({ ok: false, corpo: (() => { try { return JSON.parse(xhr.responseText) } catch { return { error: `HTTP ${xhr.status}` } } })() })
        }
        xhr.onerror = () => resolve({ ok: false, corpo: { error: 'A rede interrompeu o envio.' } })
        xhr.setRequestHeader('Content-Type', 'application/octet-stream')
        xhr.send(ficheiro)
      })
      if (!msg.ok) throw new Error(msg.corpo.error || 'Falha no envio')
      setProgresso(100)
      const a = msg.corpo.asset!
      setResultado({ url: a.url, sha256: a.sha256, bytes: a.bytes })
      onAviso(`Asset publicado no GitHub — ${fmt(a.bytes)}`)
      setFicheiro(null)
      if (ficheiroRef.current) ficheiroRef.current.value = ''
      await carregar()
    } catch (e) {
      setErro(e instanceof Error ? e.message : String(e))
    } finally {
      setProgresso(-1)
    }
  }

  const apagarAsset = async (a: GhAsset) => {
    if (!window.confirm(`Apagar o asset «${a.nome}» do GitHub? O download para de funcionar para quem tiver o link.`)) return
    setErro('')
    try {
      const r = await fetch(`/api/admin/github/assets/${a.id}`, { method: 'DELETE', credentials: 'include' })
      const j = await r.json().catch(() => ({}))
      if (!r.ok || !j.ok) throw new Error(j.error || `HTTP ${r.status}`)
      onAviso('Asset apagado')
      await carregar()
    } catch (e) {
      setErro(e instanceof Error ? e.message : String(e))
    }
  }

  const removerRelease = async (rel: GhRelease) => {
    if (!window.confirm(`Apagar a release ${rel.tag} (com todos os assets) do GitHub?`)) return
    setErro('')
    try {
      const r = await fetch(`/api/admin/github/releases/${rel.id}`, { method: 'DELETE', credentials: 'include' })
      const j = await r.json().catch(() => ({}))
      if (!r.ok || !j.ok) throw new Error(j.error || `HTTP ${r.status}`)
      onAviso(`Release ${rel.tag} apagada`)
      await carregar()
    } catch (e) {
      setErro(e instanceof Error ? e.message : String(e))
    }
  }

  const copiar = async (tipo: string, texto: string) => {
    try { await navigator.clipboard.writeText(texto) } catch { /* clipboard negado — sem falha fatal */ }
    setCopiado(tipo)
    window.setTimeout(() => setCopiado(''), 1800)
  }

  const rel = releases.find(x => x.id === relSeleccionada) || null
  const ficheiroExcede = ficheiro !== null && ficheiro.size > 2 * 1024 * MB

  return (
    <div className="admin-modal-backdrop" onMouseDown={() => onClose()}>
      <div className="admin-modal admin-modal--lg wiki-modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="admin-modal-head wiki-modal-head">
          <div>
            <span className="admin-panel-kicker">PUBLICAÇÃO DE INSTALADORES · GITHUB RELEASES</span>
            <h2>Enviar ficheiro para o GitHub</h2>
            <small className="wiki-modal-meta"><Github size={11} /> Até 2 GB por ficheiro · a repo «cftec-instaladores» a seguir recebe o asset com URL público e SHA-256</small>
          </div>
          <button onClick={() => onClose()} className="admin-modal-close" aria-label="Fechar"><X size={18} /></button>
        </div>

        <div className="admin-modal-body wiki-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {erro && <p className="admin-field-error" style={{ margin: 0 }}>{erro}</p>}

          {/* 01 — Release nova */}
          <fieldset className="wiki-fs">
            <legend><span className="wiki-fs-num">01</span>Release nova</legend>
            <label>Tag<textarea rows={1} value={novaTag} onChange={e => setNovaTag(e.target.value)} placeholder="filee-v2.2.1" style={{ fontFamily: 'inherit' }} /></label>
            <label>Título<textarea rows={1} value={novaTitulo} onChange={e => setNovaTitulo(e.target.value)} placeholder="PalancaSoft Gestão 2.2.1" style={{ fontFamily: 'inherit' }} /></label>
            <label className="wiki-fs-full">Descrição (opcional)<textarea rows={2} value={novaDesc} onChange={e => setNovaDesc(e.target.value)} placeholder="Novidades curto — o texto fica vivo na página da release." style={{ fontFamily: 'inherit' }} /></label>
            <div style={{ marginTop: 10, display: 'flex', justifyContent: 'flex-end' }}>
              <Button size="sm" variant="outline" onClick={() => void criarRelease()} disabled={aCriar || !novaTag.trim()}>{aCriar ? <RefreshCw size={13} className="spin" /> : <Github size={13} />} {aCriar ? 'A criar…' : 'Criar release'}</Button>
            </div>
          </fieldset>

          {/* 02 — Upload do asset */}
          <fieldset className="wiki-fs">
            <legend><span className="wiki-fs-num wiki-fs-num--prob">02</span>Enviar ficheiro</legend>
            <label>Release de destino<select value={relSeleccionada ?? ''} onChange={e => setRelSeleccionada(Number(e.target.value))}>
              <option value="" disabled>{carregando ? 'A carregar…' : 'Escolha a release…'}</option>
              {releases.map(x => <option key={x.id} value={x.id}>{x.tag}{x.draft ? ' (draft)' : ''}</option>)}
            </select></label>
            <div
              style={{ marginTop: 10, border: '1.5px dashed rgba(148,163,184,.4)', borderRadius: 12, padding: '18px 14px', textAlign: 'center', cursor: 'pointer' }}
              onClick={() => ficheiroRef.current?.click()}
              onDragOver={e => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f) setFicheiro(f) }}
            >
              <DriveArraste ficheiro={ficheiro} />
              <input ref={ficheiroRef} type="file" style={{ display: 'none' }} onChange={e => { setFicheiro(e.target.files?.[0] || null); setResultado(null) }} />
              {ficheiro && <small style={{ display: 'block', marginTop: 6, color: '#94a3b8' }}>{ficheiro.name} · {fmt(ficheiro.size)}{ficheiroExcede ? ' — EXCEDE 2 GB' : ''}</small>}
            </div>
            {progresso >= 0 && (
              <div className="admin-upload-progress">
                <div className="admin-upload-progress-bar"><i style={{ width: `${progresso}%` }} /></div>
                <span>{progresso < 100 ? `A enviar ao GitHub… ${progresso}%` : 'A confirmar no GitHub…'}</span>
              </div>
            )}
            {resultado && (
              <div style={{ marginTop: 10, background: 'rgba(16,185,129,.08)', border: '1px solid rgba(16,185,129,.3)', borderRadius: 10, padding: 12, fontSize: 12, wordBreak: 'break-all' }}>
                <strong><Check size={12} className="inline" /> Publicado:</strong>
                <div style={{ marginTop: 4 }}>{resultado.url}</div>
                <div style={{ marginTop: 6, color: '#94a3b8' }}>SHA-256: <code>{resultado.sha256}</code> ({fmt(resultado.bytes)})</div>
                <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                  <Button size="sm" variant="outline" onClick={() => void copiar('url', resultado.url)}><Copy size={12} /> {copiado === 'url' ? 'copiado!' : 'Copiar URL do asset'}</Button>
                  <Button size="sm" variant="outline" onClick={() => void copiar('sha', resultado.sha256)}>{copiado === 'sha' ? 'copiado!' : 'Copiar SHA-256'}</Button>
                </div>
                <p style={{ margin: '8px 0 0', color: '#94a3b8' }}>Cole o URL no campo «URL externo» da ficha do software.</p>
              </div>
            )}
            <div style={{ marginTop: 10, display: 'flex', justifyContent: 'flex-end' }}>
              <Button size="sm" onClick={() => void enviar()} disabled={!ficheiro || progresso >= 0 || ficheiroExcede || !rel}><Send size={13} /> {progresso >= 0 ? 'A enviar…' : 'Enviar ao GitHub'}</Button>
            </div>
          </fieldset>

          {/* 03 — Releases existentes */}
          <fieldset className="wiki-fs">
            <legend><span className="wiki-fs-num wiki-fs-num--sol">03</span>Releases existentes</legend>
            {carregando && !releases.length && <small className="wiki-fs-hint wiki-fs-full">A carregar do GitHub…</small>}
            {!carregando && !releases.length && <small className="wiki-fs-hint wiki-fs-full">Ainda sem releases — crie a primeira acima.</small>}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {releases.map(x => (
                <div key={x.id} style={{ border: '1px solid rgba(148,163,184,.25)', borderRadius: 10, padding: '10px 12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                    <strong style={{ fontSize: 13 }}>{x.titulo || x.tag}{x.draft && <span style={{ color: '#fbbf24' }}> · draft</span>}</strong>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="icon-btn" title="Copiar tag" onClick={() => void copiar('tag-' + x.id, x.tag)}>{copiado === 'tag-' + x.id ? <Check size={13} /> : <Copy size={13} />}</button>
                      <button className="icon-btn" title="Apagar release" onClick={() => void removerRelease(x)}><Trash2 size={13} /></button>
                    </div>
                  </div>
                  {x.assets.length > 0 && (
                    <ul style={{ margin: '8px 0 0', padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {x.assets.map(a => (
                        <li key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                          <span style={{ flex: 1, wordBreak: 'break-all' }}>{a.nome} <span style={{ color: '#64748b' }}>· {fmt(a.bytes)}</span></span>
                          <button className="icon-btn" title="Copiar URL" onClick={() => void copiar('asset-' + a.id, a.url)}>{copiado === 'asset-' + a.id ? <Check size={12} /> : <Copy size={12} />}</button>
                          <button className="icon-btn" title="Apagar asset" onClick={() => void apagarAsset(a)}><Trash2 size={12} /></button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </fieldset>
        </div>
      </div>
    </div>
  )
}

function DriveArraste({ ficheiro }: { ficheiro: File | null }) {
  if (ficheiro) return <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}><Check size={18} style={{ color: '#10b981' }} /> <strong style={{ fontSize: 13 }}>Pronto para enviar</strong></div>
  return (
    <>
      <UploadCloud size={26} style={{ color: '#94a3b8' }} />
      <div style={{ fontSize: 13, marginTop: 4 }}><strong>Arraste o ficheiro aqui</strong> <span style={{ color: '#94a3b8' }}>· ou clique para seleccionar (.zip, .exe — até 2 GB)</span></div>
    </>
  )
}

export type { GhRelease, GhAsset }
