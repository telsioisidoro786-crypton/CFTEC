import { Media } from '../../AdminDashboard'
import { FileImage, Copy, Trash2, Download, Eye, Image as ImageIcon } from 'lucide-react'
import { Card, CardContent } from './card'
import { Badge } from './badge'
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from './tooltip'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from './dropdown-menu'

interface MediaTileProps {
  item: Media
  onDelete: (id: string) => Promise<void>
  notify: (message: string) => void
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

function getFileTypeColor(mimeType: string): string {
  if (mimeType.startsWith('image/')) return 'bg-blue-100 text-blue-800 border-blue-200'
  if (mimeType.startsWith('video/')) return 'bg-purple-100 text-purple-800 border-purple-200'
  if (mimeType.startsWith('audio/')) return 'bg-green-100 text-green-800 border-green-200'
  if (mimeType.startsWith('application/pdf')) return 'bg-red-100 text-red-800 border-red-200'
  return 'bg-gray-100 text-gray-800 border-gray-200'
}

export function MediaTile({ item, onDelete, notify }: MediaTileProps) {
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const target = e.currentTarget
    target.style.display = 'none'
    const placeholder = target.nextElementSibling as HTMLElement
    if (placeholder) placeholder.style.display = 'flex'
  }

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.origin + item.file_path)
    notify('Link copiado para a área de transferência')
  }

  const handleDelete = async () => {
    if (confirm('Tem a certeza que quer eliminar esta imagem?')) {
      await onDelete(item.id)
    }
  }

  const openImage = () => {
    window.open(item.file_path, '_blank')
  }

  return (
    <TooltipProvider>
      <Card className="media-tile group h-full transition-all duration-200 hover:shadow-lg hover:border-primary/30 hover:-translate-y-1">
        <div className="relative aspect-video overflow-hidden rounded-t-lg bg-muted/50">
          <img
            src={item.file_path}
            alt={item.alt_text || item.filename}
            onError={handleImageError}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={openImage}
                  className="p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:bg-white transition-all duration-200 hover:scale-110"
                  aria-label="Ver imagem em tamanho real"
                >
                  <Eye className="h-4 w-4 text-gray-900" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">
                Ver em tamanho real
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={copyLink}
                  className="p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:bg-white transition-all duration-200 hover:scale-110"
                  aria-label="Copiar link"
                >
                  <Copy className="h-4 w-4 text-gray-900" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">
                Copiar link
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={handleDelete}
                  className="p-2 bg-red-500/90 backdrop-blur-sm rounded-full shadow-lg hover:bg-red-500 transition-all duration-200 hover:scale-110"
                  aria-label="Eliminar imagem"
                >
                  <Trash2 className="h-4 w-4 text-white" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">
                Eliminar
              </TooltipContent>
            </Tooltip>
          </div>
          <div className="absolute bottom-2 left-2 flex gap-1">
            <Badge 
              variant="outline" 
              className={`text-xs ${getFileTypeColor(item.mime_type)}`}
            >
              {item.mime_type.split('/')[1]?.toUpperCase()}
            </Badge>
          </div>
        </div>
        
        <CardContent className="p-4 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p className="font-medium text-sm text-gray-900 truncate" title={item.filename}>
                {item.filename}
              </p>
              <p className="text-xs text-gray-500 font-mono mt-0.5">
                {formatFileSize(item.file_size)} • {item.mime_type}
              </p>
              {item.alt_text && (
                <p className="text-xs text-gray-400 mt-1 truncate" title={item.alt_text}>
                  Alt: {item.alt_text}
                </p>
              )}
            </div>
          </div>
          
          <div className="flex items-center justify-between pt-2 border-t">
            <div className="flex items-center gap-1">
              <Badge variant="secondary" className="text-xs">
                {new Date(item.uploaded_at).toLocaleDateString('pt-PT', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric'
                })}
              </Badge>
            </div>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                      aria-label="Mais opções"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                      </svg>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="min-w-[160px]">
                    <DropdownMenuItem 
                      onClick={openImage}
                      className="flex items-center gap-2 text-sm"
                    >
                      <Eye className="h-4 w-4" />
                      Ver imagem
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={copyLink}
                      className="flex items-center gap-2 text-sm"
                    >
                      <Copy className="h-4 w-4" />
                      Copiar link
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => window.open(item.file_path, '_blank')}
                      className="flex items-center gap-2 text-sm"
                    >
                      <Download className="h-4 w-4" />
                      Baixar
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={handleDelete}
                      className="flex items-center gap-2 text-sm text-red-600 focus:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                      Eliminar
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TooltipTrigger>
              <TooltipContent side="left" className="text-xs">
                Mais opções
              </TooltipContent>
            </Tooltip>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  )
}