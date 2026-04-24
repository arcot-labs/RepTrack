import type { DocItem } from '@/models/doc'
import { Docs } from '@/pages/Docs'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const getAllDocsMock = vi.hoisted(() => vi.fn<() => DocItem[]>())
const docsSidebarMock = vi.hoisted(() => vi.fn())

vi.mock('@/lib/docs', () => ({
    getAllDocs: () => getAllDocsMock(),
}))

vi.mock('@/components/docs/DocsSidebar', () => ({
    DocsSidebar: (props: unknown) => {
        docsSidebarMock(props)
        return <div data-testid="docs-sidebar" />
    },
}))

function renderDocs() {
    return render(
        <MemoryRouter initialEntries={['/docs']}>
            <Routes>
                <Route path="/docs" element={<Docs />}>
                    <Route index element={<div>Docs index outlet</div>} />
                </Route>
            </Routes>
        </MemoryRouter>
    )
}

describe('Docs', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('renders docs layout with sidebar items and outlet', async () => {
        const docs = [{ slug: 'getting-started', title: 'Getting started' }]
        getAllDocsMock.mockReturnValue(docs)

        renderDocs()

        expect(
            screen.getByRole('heading', { level: 1, name: 'Documentation' })
        ).toBeInTheDocument()
        expect(
            screen.getByRole('link', { name: 'Documentation' })
        ).toHaveAttribute('href', '/docs')

        expect(screen.getByTestId('docs-sidebar')).toBeInTheDocument()
        expect(docsSidebarMock).toHaveBeenCalledWith({ items: docs })

        expect(await screen.findByText('Docs index outlet')).toBeInTheDocument()
    })
})
