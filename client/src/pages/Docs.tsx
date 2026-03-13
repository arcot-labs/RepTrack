import { getAllDocs } from '@/lib/docs'
import { cn } from '@/lib/utils'
import { NavLink, Outlet } from 'react-router-dom'

export function Docs() {
    const items = getAllDocs()

    return (
        <div className="flex h-[calc(100dvh-10rem)] flex-col gap-4">
            <h1 className="text-xl font-bold">
                <NavLink to="/docs">Documentation</NavLink>
            </h1>
            <div className="flex flex-1 gap-4 overflow-hidden">
                <aside className="w-50 shrink-0 overflow-y-auto border-r pr-2">
                    <nav className="space-y-1">
                        {items.length === 0 ? (
                            <p className="px-3 text-sm text-muted-foreground">
                                No docs available
                            </p>
                        ) : (
                            items.map(({ slug, title }) => (
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
                            ))
                        )}
                    </nav>
                </aside>
                <section className="min-w-0 flex-1 overflow-y-auto pr-3">
                    <Outlet />
                </section>
            </div>
        </div>
    )
}
