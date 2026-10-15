import { Media } from '../../AdminDashboard'
import { FileImage, ArrowDownToLine, Trash2 } from 'lucide-react'

interface MediaTileProps {
  item: Media
  onDelete: (id: string) => Promise<void>
  notify: (message: string) => void
}

export function MediaTile({ item, onDelete, notify }: MediaTileProps) {
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const target = e.currentTarget
    target.style.display = 'none'
    const placeholder = target.nextElementSibling as HTMLElement
    if (placeholder) placeholder.style.display = 'flex'
  }

  return (
    <div className="media-tile">
      <div className="media-thumbnail">
        <img 
          src={item.file_path} 
          alt={item.alt_text || item.filename} 
          onError={handleImageError} 
        />
        <div className="media-placeholder" style={{display: 'none'}}>
          <FileImage size={25} />
        </div>
      </div>
      <div>
        <strong>{item.filename}</strong>
        <span>{(item.file_size / 1024 / 1024).toFixed(2)} MB · {item.mime_type}</span>
      </div>
      <div className="media-tile-actions">
        <button 
          onClick={() => { 
            navigator.clipboard.writeText(window.location.origin + item.file_path)
            notify('Link copiado') 
          }} 
          title="Copiar link"
        >
          <ArrowDownToLine size={15} />
        </button>
        <button 
          onClick={async () => { 
            if (confirm('Eliminar esta imagem?')) { 
              await onDelete(item.id)
            } 
          }} 
          title="Eliminar" 
          className="admin-tile-btn-danger"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  )
}