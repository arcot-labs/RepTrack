import type { AccessRequestStatus } from '@/api/generated'
import { Badge } from '@/components/ui/badge'
import {
    blueText,
    greenText,
    lightBlueBackground,
    lightGreenBackground,
    lightRedBackground,
    redText,
} from '@/lib/styles'
import type { JSX } from 'react'

const blueBadgeClassName = `${lightBlueBackground} ${blueText}`
const greenBadgeClassName = `${lightGreenBackground} ${greenText}`
const redBadgeClassName = `${lightRedBackground} ${redText}`

export function StatusBadge({
    status,
}: {
    status: AccessRequestStatus
}): JSX.Element {
    switch (status) {
        case 'pending':
            return <Badge className={blueBadgeClassName}>Pending</Badge>
        case 'approved':
            return <Badge className={greenBadgeClassName}>Approved</Badge>
        case 'rejected':
            return <Badge className={redBadgeClassName}>Rejected</Badge>
    }
}
