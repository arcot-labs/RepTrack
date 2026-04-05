import { ThemeToggle } from '@/components/ThemeToggle'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

const setThemeMock = vi.fn()

vi.mock('next-themes', () => ({
    useTheme: () => ({
        setTheme: setThemeMock,
    }),
}))

vi.mock('@/components/ui/dropdown-menu', () => ({
    DropdownMenu: ({ children }: { children: React.ReactNode }) => (
        <div>{children}</div>
    ),
    DropdownMenuTrigger: ({ children }: { children: React.ReactNode }) => (
        <div>{children}</div>
    ),
    DropdownMenuContent: ({ children }: { children: React.ReactNode }) => (
        <div>{children}</div>
    ),
    DropdownMenuItem: ({
        children,
        onClick,
    }: {
        children: React.ReactNode
        onClick?: () => void
    }) => <button onClick={onClick}>{children}</button>,
}))

describe('ThemeToggle', () => {
    it('renders theme toggle button', () => {
        render(<ThemeToggle />)

        expect(
            screen.getByRole('button', { name: /toggle theme/i })
        ).toBeInTheDocument()
    })

    it('sets light theme', async () => {
        render(<ThemeToggle />)

        await userEvent.click(screen.getByRole('button', { name: /light/i }))

        expect(setThemeMock).toHaveBeenCalledWith('light')
    })

    it('sets dark theme', async () => {
        render(<ThemeToggle />)

        await userEvent.click(screen.getByRole('button', { name: /dark/i }))

        expect(setThemeMock).toHaveBeenCalledWith('dark')
    })

    it('sets system theme', async () => {
        render(<ThemeToggle />)

        await userEvent.click(screen.getByRole('button', { name: /system/i }))

        expect(setThemeMock).toHaveBeenCalledWith('system')
    })
})
