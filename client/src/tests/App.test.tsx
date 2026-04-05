import { App } from '@/App'
import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const ToasterMock = vi.fn()

vi.mock('@/components/ui/sonner', () => ({
    Toaster: (props: Record<string, unknown>) => {
        ToasterMock(props)
        return <div>toaster</div>
    },
}))

describe('App', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('renders children', () => {
        render(
            <App>
                <div>app child</div>
            </App>
        )

        expect(screen.getByText('app child')).toBeInTheDocument()
    })

    it('wires toast options to Toaster component', () => {
        render(
            <App>
                <div>app child</div>
            </App>
        )

        expect(ToasterMock).toHaveBeenCalledExactlyOnceWith(
            expect.objectContaining({
                richColors: true,
                position: 'bottom-center',
                visibleToasts: 5,
                toastOptions: {
                    closeButton: true,
                },
            })
        )
        expect(screen.getByText('toaster')).toBeInTheDocument()
    })
})
