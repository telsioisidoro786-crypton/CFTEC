import 'lucide-react'

declare module 'lucide-react' {
  interface LucideProps {
    size?: number
    className?: string
    'aria-hidden'?: string
  }
  
  // Override the icon component type to have proper size prop
  export interface LucideIcon extends React.ForwardRefExoticComponent<Omit<LucideProps, 'ref'> & React.RefAttributes<SVGSVGElement>> {
    (props: Omit<LucideProps, 'ref'> & { ref?: React.Ref<SVGSVGElement> }): React.ReactElement | null
  }
}