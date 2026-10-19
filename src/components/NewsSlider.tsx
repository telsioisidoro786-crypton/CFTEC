import { useCallback, useEffect, useRef, useState } from 'react'
import { ArrowRight, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react'

type Destaque = { id: string; titulo: string; descricao: string; imagem_url: string; link_botao: string | null; texto_botao: string | null }

export default function NewsSlider() {
  const [destaques, setDestaques] = useState<Destaque[]>([])
  const [atual, setAtual] = useState(0)
  const [pausado, setPausado] = useState(false)
  const timerRef = useRef<number | null>(null)
  const total = destaques.length

  useEffect(() => {
    fetch('/api/destaques', { cache: 'no-store' })
      .then(r => r.json())
      .then(d => { if (d.ok && Array.isArray(d.destaques)) setDestaques(d.destaques) })
      .catch(() => {})
  }, [])

  const trocar = useCallback((dir: 1 | -1) => {
    if (total < 2) return
    setAtual(a => (a + dir + total) % total)
  }, [total])

  // slideshow automático: 5 s por slide (pausa com o rato em cima)
  useEffect(() => {
    if (total < 2 || pausado) return
    timerRef.current = window.setInterval(() => trocar(1), 5000)
    return () => { if (timerRef.current) window.clearInterval(timerRef.current) }
  }, [total, pausado, trocar])

  if (!total) return null

  const d = destaques[atual] || destaques[0]

  return (
    <section className="news-slider" aria-label="Destaques e novidades" onMouseEnter={() => setPausado(true)} onMouseLeave={() => setPausado(false)}>
      <div className="news-slide news-slide--in" key={d.id}>
        <div className="news-media"><img src={d.imagem_url} alt={d.titulo} loading="lazy" /></div>
        <div className="news-copy">
          <span className="section-kicker"><Sparkles size={12} /> DESTAQUE {total > 1 ? `${atual + 1}/${total}` : 'CFTEC'}</span>
          <h2>{d.titulo}</h2>
          <p>{d.descricao}</p>
          {d.link_botao && <a className="news-cta" href={d.link_botao} target={d.link_botao.startsWith('http') ? '_blank' : '_self'} rel="noreferrer noopener"> {d.texto_botao || 'Saber Mais'} <ArrowRight size={15} /></a>}
        </div>
      </div>

      {total > 1 && <>
        <button className="news-arrow news-arrow--prev" aria-label="Anterior" onClick={() => trocar(-1)}><ChevronLeft size={19} /></button>
        <button className="news-arrow news-arrow--next" aria-label="Seguinte" onClick={() => trocar(1)}><ChevronRight size={19} /></button>
        <div className="news-dots" role="tablist">
          {destaques.map((s, i) => <button key={s.id} className={i === atual ? 'news-dot is-active' : 'news-dot'} aria-label={`Destaque ${i + 1}`} onClick={() => setAtual(i)} />)}
        </div>
      </>}
    </section>
  )
}
