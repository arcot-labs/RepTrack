import { Badge } from '@/components/ui/badge'
import {
    blueText,
    greenText,
    lightBlueBackground,
    lightGreenBackground,
} from '@/lib/styles'

const blueBadgeClassName = `${lightBlueBackground} ${blueText}`
const greenBadgeClassName = `${lightGreenBackground} ${greenText}`

export function RoleBadge({ isAdmin }: { isAdmin: boolean }) {
    if (isAdmin) return <Badge className={greenBadgeClassName}>Admin</Badge>
    return <Badge className={blueBadgeClassName}>User</Badge>
}
