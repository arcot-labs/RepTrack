import { cn } from '@/lib/utils'
import type { DocItem } from '@/models/doc'
import { NavLink } from 'react-router-dom'

export function DocsSidebar({ items }: { items: DocItem[] }) {
    if (items.length === 0)
        return (
            <p className="px-3 text-sm text-muted-foreground">
                No docs available
            </p>
        )

    return (
        <nav className="space-y-1">
            {items.map(({ slug, title }) => (
                <NavLink
                    key={slug}
                    to={`/docs/${slug}`}
                    className={({ isActive }) =>
                        cn(
                            'block rounded-md px-3 py-2 text-sm transition',
                            isActive
                                ? 'bg-muted font-medium'
                                : 'text-muted-foreground hover:bg-muted'
                        )
                    }
                >
                    {title}
                </NavLink>
            ))}
        </nav>
    )
}
