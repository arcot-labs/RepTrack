import type { UserPublic } from '@/api/generated/types.gen'
import type { ColumnDef } from '@tanstack/react-table'
import { render } from '@testing-library/react'
import type { ReactElement } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { UsersTable } from '@/components/users/UsersTable'

const dataTableMock = vi.fn()

vi.mock('@/components/data-table/DataTable', () => ({
    DataTable: (props: unknown) => {
        dataTableMock(props)
        return <div data-testid="mock-users-table" />
    },
}))

const adminUser: UserPublic = {
    id: 1,
    username: 'admin',
    email: 'admin@example.com',
    first_name: 'Admin',
    last_name: 'User',
    is_admin: true,
    created_at: '2024-01-01T00:00:00.000Z',
    updated_at: '2024-01-02T00:00:00.000Z',
}

const regularUser: UserPublic = {
    id: 2,
    username: 'regular',
    email: 'user@example.com',
    first_name: 'Regular',
    last_name: 'User',
    is_admin: false,
    created_at: '2024-01-03T00:00:00.000Z',
    updated_at: '2024-01-04T00:00:00.000Z',
}

const defaultUsers = [adminUser, regularUser]

type UsersTableProps = Parameters<typeof UsersTable>[0]

const renderUsersTable = (overrides: Partial<UsersTableProps> = {}) =>
    render(
        <UsersTable
            {...{ users: defaultUsers, isLoading: false, ...overrides }}
        />
    )

describe('UsersTable', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('passes users, toolbar config, and custom page size to DataTable', () => {
        renderUsersTable({ users: defaultUsers, isLoading: true })

        expect(dataTableMock).toHaveBeenCalledOnce()
        const props = dataTableMock.mock.calls[0]?.[0] as {
            data: UserPublic[]
            isLoading: boolean
            pageSize: number
            toolbarConfig?: {
                search?: { columnId: string; placeholder: string }
                filters?: {
                    columnId: string
                    title: string
                    options: { label: string; value: string }[]
                }[]
                showViewOptions?: boolean
            }
        }

        expect(props.data).toBe(defaultUsers)
        expect(props.isLoading).toBe(true)
        expect(props.pageSize).toBe(5)
        expect(props.toolbarConfig).toBeDefined()
        expect(props.toolbarConfig?.search).toEqual({
            columnId: 'name',
            placeholder: 'Filter by name...',
        })
        expect(props.toolbarConfig?.filters).toHaveLength(1)
        expect(props.toolbarConfig?.filters?.[0]).toEqual({
            columnId: 'role',
            title: 'Role',
            options: [
                { label: 'Admin', value: 'admin' },
                { label: 'User', value: 'user' },
            ],
        })
        expect(props.toolbarConfig?.showViewOptions).toBe(true)
    })

    it('renders admin and user badges via the role column cell', () => {
        renderUsersTable()

        expect(dataTableMock).toHaveBeenCalledOnce()
        const columns = (
            dataTableMock.mock.calls[0]?.[0] as {
                columns: ColumnDef<UserPublic>[]
            }
        ).columns
        const roleColumn = columns.find((column) => column.id === 'role')
        expect(roleColumn).toBeDefined()

        const renderBadge = (user: UserPublic) => {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            const cell =
                typeof roleColumn?.cell === 'function'
                    ? roleColumn.cell({ row: { original: user } } as never)
                    : undefined
            expect(cell).toBeDefined()

            const { container } = render(cell as ReactElement)
            return container.querySelector('[data-slot="badge"]')
        }

        const adminBadge = renderBadge(adminUser)
        expect(adminBadge).toHaveTextContent('Admin')
        expect(adminBadge).toHaveClass('bg-green-50')
        expect(adminBadge).toHaveClass('text-green-700')

        const userBadge = renderBadge(regularUser)
        expect(userBadge).toHaveTextContent('User')
        expect(userBadge).toHaveClass('bg-blue-50')
        expect(userBadge).toHaveClass('text-blue-700')
    })
})
