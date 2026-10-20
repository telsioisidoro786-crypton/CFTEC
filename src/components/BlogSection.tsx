import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, CalendarDays, FileText, User } from 'lucide-react'

export type BlogCard = { id: string; slug: string; title: string; excerpt: string; cover_url: string | null; category: string | null; author: string | null; published_at: string | null }
export type BlogFull = BlogCard & { content: string }

export function parseBlogContent(raw: string) {
  // marcações leves: ## subtítulos, ### subtítulo menor, **negrito**, *itálico*, [texto](url), - lista, linhas em branco = parágrafo
  const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  const inline = (s: string) =>
    esc(s)
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer noopener">$1</a>')
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/\*([^*]+)\*/g, '<em>$1</em>')
  const blocks = raw.trim().split(/\n{2,}/)
  return blocks.map((blockRaw) => {
    const block = blockRaw.trim()
    if (block.startsWith('### ')) return `<h4>${inline(block.slice(4))}</h4>`
    if (block.startsWith('## ')) return `<h3>${inline(block.slice(3))}</h3>`
    if (/^[-•] (\s|$)/m.test(block) || block.split('\n').every(l => l.trim().startsWith('- ') || !l.trim())) {
      const items = block.split('\n').filter(l => l.trim().startsWith('- ')).map(l => l.trim().slice(2))
      if (items.length) return `<ul>${items.map(li => `<li>${inline(li)}</li>`).join('')}</ul>`
    }
    return `<p>${inline(block).replace(/\n/g, '<br />')}</p>`
  }).join('')
}

export default function BlogSection({ onOpen }: { onOpen: (post: BlogFull) => void }) {
  const [posts, setPosts] = useState<BlogCard[]>([])
  const [cat, setCat] = useState('')

  useEffect(() => {
    fetch('/api/blog', { cache: 'no-store' })
      .then(r => r.json())
      .then(d => { if (d.ok && Array.isArray(d.posts)) setPosts(d.posts) })
      .catch(() => {})
  }, [])

  const categorias = useMemo(() => Array.from(new Set(posts.map(p => p.category).filter(Boolean))) as string[], [posts])
  const visiveis = cat ? posts.filter(p => p.category === cat) : posts

  if (!posts.length) return null

  return (
    <section className="section section-blog" id="blog">
      <div className="container">
        <div className="section-head">
          <span className="section-kicker"><FileText size={12} /> ARTIGOS & GUIAS</span>
          <h2 className="section-title">Estudos que ajudam Angola<br />a faturar melhor.</h2>
          <p className="section-desc">Guias de faturação, novidades fiscais da AGT e lições dos projectos CFTEC — escritas sem jargão.</p>
        </div>

        {categorias.length > 1 && (
          <div className="blog-filter">
            <button className={cat === '' ? 'is-active' : ''} onClick={() => setCat('')}>Todos</button>
            {categorias.map(c => <button key={c} className={cat === c ? 'is-active' : ''} onClick={() => setCat(c)}>{c}</button>)}
          </div>
        )}

        <div className="blog-grid">
          {visiveis.map(p => (
            <article className="blog-card" key={p.id} onClick={() => onOpen({ ...p, content: '' })}>
              <div className="blog-card-media">
                {p.cover_url ? <img src={p.cover_url} alt={p.title} loading="lazy" /> : <span className="blog-card-ph"><FileText size={26} /></span>}
                {p.category && <span className="blog-card-cat">{p.category}</span>}
              </div>
              <div className="blog-card-body">
                <h3>{p.title}</h3>
                <p>{p.excerpt}</p>
                <footer>
                  <span><User size={13} /> {p.author || 'Equipa CFTEC'}</span>
                  <span><CalendarDays size={13} /> {p.published_at ? new Date(p.published_at).toLocaleDateString('pt-PT', { day: '2-digit', month: 'long', year: 'numeric' }) : ''}</span>
                  <em><ArrowRight size={14} /> Ler artigo</em>
                </footer>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
