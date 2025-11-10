declare module 'lucide-react' {
  import { FC, SVGProps } from 'react'

  export interface IconProps extends SVGProps<SVGSVGElement> {
    size?: string | number
    strokeWidth?: string | number
    absoluteStrokeWidth?: boolean
  }

  // Export all common icons
  export const Mail: FC<IconProps>
  export const Lock: FC<IconProps>
  export const User: FC<IconProps>
  export const ArrowRight: FC<IconProps>
  export const ArrowLeft: FC<IconProps>
  export const Check: FC<IconProps>
  export const Menu: FC<IconProps>
  export const Search: FC<IconProps>
  export const Building2: FC<IconProps>
  export const Briefcase: FC<IconProps>
  export const FileText: FC<IconProps>
  export const Shield: FC<IconProps>
  export const Plus: FC<IconProps>
  export const X: FC<IconProps>
  export const CheckCircle2: FC<IconProps>
  export const Upload: FC<IconProps>
  export const RefreshCw: FC<IconProps>
  export const Download: FC<IconProps>
  export const CircleX: FC<IconProps>
  export const CircleAlert: FC<IconProps>
  export const AlertCircle: FC<IconProps>
  export const XCircle: FC<IconProps>
  export const Bookmark: FC<IconProps>
  export const BookmarkCheck: FC<IconProps>
  export const Eye: FC<IconProps>
  export const Trash2: FC<IconProps>

  // Type for any icon component
  type LucideIcon = FC<IconProps>

  // Export any other icon (this allows dynamic imports)
  const createLucideIcon: (name: string) => LucideIcon
}
