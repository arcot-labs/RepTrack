import { Doc } from '@/components/docs/Doc'
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

const useParamsMock = vi.fn()
const getDocMock = vi.fn()

vi.mock('react-router-dom', () => ({
    useParams: () => useParamsMock() as never,
}))

vi.mock('@/lib/docs', () => ({
    getDoc: (slug: unknown) => getDocMock(slug) as never,
}))

vi.mock('@/components/docs/Mermaid', () => ({
    Mermaid: ({ code }: { code: string }) => (
        <div data-testid="mermaid">{code}</div>
    ),
}))

describe('Doc', () => {
    it('renders not found when slug is missing', () => {
        useParamsMock.mockReturnValue({})
        getDocMock.mockReturnValue(undefined)

        render(<Doc />)

        expect(screen.getByText('Document not found')).toBeInTheDocument()
    })

    it('renders not found when content is undefined', () => {
        useParamsMock.mockReturnValue({ slug: 'test' })
        getDocMock.mockReturnValue(undefined)

        render(<Doc />)

        expect(screen.getByText('Document not found')).toBeInTheDocument()
    })

    it('renders no content when document is empty', () => {
        useParamsMock.mockReturnValue({ slug: 'test' })
        getDocMock.mockReturnValue('')

        render(<Doc />)

        expect(screen.getByText('No content')).toBeInTheDocument()
    })

    // it('falls back to empty string when className is undefined', () => {
    //     useParamsMock.mockReturnValue({ slug: 'test' })
    //     getDocMock.mockReturnValue('```js\nconsole.log("hi")\n```')

    //     render(<Doc />)

    //     expect(screen.getByText('console.log("hi")')).toBeInTheDocument()
    // })

    it('renders markdown content', () => {
        useParamsMock.mockReturnValue({ slug: 'test' })
        getDocMock.mockReturnValue('# Hello World')

        render(<Doc />)

        expect(
            screen.getByRole('heading', { name: 'Hello World' })
        ).toBeInTheDocument()
    })

    it('renders normal code blocks', () => {
        useParamsMock.mockReturnValue({ slug: 'test' })
        getDocMock.mockReturnValue('```js\nconsole.log("hi")\n```')

        render(<Doc />)

        const codeBlock = document.querySelector('code.language-js')
        expect(codeBlock).toBeInTheDocument()
        expect(codeBlock).toHaveTextContent('console.log("hi")')
    })

    it('renders mermaid code blocks using Mermaid component', () => {
        useParamsMock.mockReturnValue({ slug: 'test' })
        getDocMock.mockReturnValue('```mermaid\ngraph TD;\nA-->B;\n```')

        render(<Doc />)

        const mermaid = screen.getByTestId('mermaid')
        expect(mermaid).toBeInTheDocument()
        expect(mermaid).toHaveTextContent('graph TD;')
    })

    it('renders code block correctly when className is undefined', () => {
        useParamsMock.mockReturnValue({ slug: 'test' })

        getDocMock.mockReturnValue('Here is `inline code`')

        render(<Doc />)

        expect(screen.getByText('inline code')).toBeInTheDocument()
        expect(screen.queryByTestId('mermaid')).not.toBeInTheDocument()
    })
})
