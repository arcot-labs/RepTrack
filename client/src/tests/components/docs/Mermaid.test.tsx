import { Mermaid } from '@/components/docs/Mermaid'
import { render, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const renderMock = vi.fn()

vi.mock('mermaid', () => ({
    default: {
        initialize: vi.fn(),
        render: (...args: unknown[]) => renderMock(...args) as never,
    },
}))

describe('Mermaid', () => {
    beforeEach(() => {
        renderMock.mockReset()
    })

    it('renders mermaid svg into container', async () => {
        renderMock.mockResolvedValue({
            svg: '<svg><text>diagram</text></svg>',
        })

        render(<Mermaid code="graph TD; A-->B;" />)

        await waitFor(() => {
            expect(renderMock).toHaveBeenCalled()
        })
        await waitFor(() => {
            const container = document.querySelector('div')
            expect(container?.innerHTML).toContain('<svg')
            expect(container?.innerHTML).toContain('diagram')
        })
    })

    it('re-renders when code changes', async () => {
        renderMock.mockResolvedValue({
            svg: '<svg>v1</svg>',
        })

        const { rerender } = render(<Mermaid code="graph TD; A-->B;" />)

        await waitFor(() => {
            expect(renderMock).toHaveBeenCalledTimes(1)
        })

        renderMock.mockResolvedValue({
            svg: '<svg>v2</svg>',
        })

        rerender(<Mermaid code="graph TD; A-->C;" />)

        await waitFor(() => {
            expect(renderMock).toHaveBeenCalledTimes(2)
        })
    })

    it('handles when render returns before ref is set', () => {
        renderMock.mockResolvedValue({
            svg: '<svg />',
        })

        const { unmount } = render(<Mermaid code="graph TD; A-->B;" />)

        unmount()

        expect(renderMock).toHaveBeenCalled()
    })

    it('clears container when render fails', async () => {
        renderMock.mockImplementationOnce(() => {
            return new Promise((_resolve, reject) => {
                reject(new Error('render failed'))
            })
        })

        const { container } = render(<Mermaid code="graph TD; A-->B;" />)
        const diagram = container.querySelector<HTMLDivElement>('.my-4')

        expect(diagram).not.toBeNull()
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        diagram!.innerHTML = 'should be reset'

        const renderPromise = renderMock.mock.results[0]
            ?.value as Promise<unknown>
        await expect(renderPromise).rejects.toThrow('render failed')
        await waitFor(() => {
            expect(diagram?.innerHTML).toBe('')
        })
    })

    it('does not write innerHTML after unmounting while render fails', async () => {
        renderMock.mockImplementationOnce(() => {
            return new Promise((_resolve, reject) => {
                reject(new Error('render failed'))
            })
        })

        const { unmount, container } = render(
            <Mermaid code="graph TD; A-->B;" />
        )
        const diagram = container.querySelector<HTMLDivElement>('.my-4')

        expect(diagram).not.toBeNull()
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        diagram!.innerHTML = 'should remain'

        unmount()

        await waitFor(() => {
            expect(renderMock).toHaveBeenCalled()
        })

        await waitFor(() => {
            expect(diagram?.innerHTML).toBe('should remain')
        })
    })
})
