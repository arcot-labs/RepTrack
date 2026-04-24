import { DocsSidebar } from '@/components/docs/DocsSidebar'
import { Card, CardContent } from '@/components/ui/overrides/card'
import { getAllDocs } from '@/lib/docs'
import { NavLink, Outlet } from 'react-router-dom'

export function Docs() {
    const items = getAllDocs()

    return (
        <Card>
            <CardContent className="p-3">
                <div className="flex h-[calc(100dvh-10rem)] flex-col gap-4">
                    <h1 className="text-xl font-bold">
                        <NavLink to="/docs">Documentation</NavLink>
                    </h1>
                    <div className="flex flex-1 gap-4 overflow-hidden">
                        <aside className="w-50 shrink-0 overflow-y-auto border-r pr-2">
                            <DocsSidebar items={items} />
                        </aside>
                        <section className="min-w-0 flex-1 overflow-y-auto pr-3">
                            <Outlet />
                        </section>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
