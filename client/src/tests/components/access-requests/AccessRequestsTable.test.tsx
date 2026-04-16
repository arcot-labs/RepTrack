import type { AccessRequestPublic, ReviewerPublic } from '@/api/generated'
import {
    getAccessRequestRowActions,
    getDialogConfirmButtonText,
    getStatusFilterOptions,
    handleUpdate,
} from '@/components/access-requests/utils'
import { dash } from '@/lib/text'
import {
    dataTableMock,
    getColumn,
    getDataTableProps,
    hasAccessorFn,
    hasAccessorKey,
    hasFilterFn,
    renderCell,
    testHeader,
} from '@/tests/components/utils'
import { getMockProps } from '@/tests/utils'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { act } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// import last
import { AccessRequestsTable } from '@/components/access-requests/AccessRequestsTable'

const statusBadgeMock = vi.fn()
const onRequestUpdatedMock = vi.fn()
const onReloadRequestsMock = vi.fn()

const dialogMocks = vi.hoisted(() => ({
    open: vi.fn(),
    close: vi.fn(),
    confirm: vi.fn(),
    useDialog: vi.fn(),
}))

const dialogMock = vi.hoisted(() => vi.fn())
const inlineRowActionsMock = vi.hoisted(() => vi.fn())

vi.mock('@/auth/session', () => ({
    useSession: () => ({
        user: {
            id: 1,
            username: 'test-user',
        },
    }),
}))

vi.mock('@/components/access-requests/StatusBadge', () => ({
    StatusBadge: (props: unknown) => {
        statusBadgeMock(props)
        return <div data-testid="mock-status-badge" />
    },
}))

vi.mock('@/components/access-requests/utils', () => ({
    handleUpdate: vi.fn(),
    getAccessRequestRowActions: vi.fn(),
    getStatusFilterOptions: vi.fn(),
    getDialogConfirmButtonText: vi.fn(),
}))

vi.mock('@/components/dialog', () => ({
    useDialog: dialogMocks.useDialog,
}))

vi.mock('@/components/data-table/DataTableInlineRowActions', () => ({
    DataTableInlineRowActions: (props: unknown) => {
        inlineRowActionsMock(props)
        return <div data-testid="mock-inline-row-actions" />
    },
}))

vi.mock('@/components/ui/dialog', () => ({
    Dialog: (props: unknown) => {
        dialogMock(props)
        const p = props as { children: React.ReactNode }
        return <div data-testid="mock-dialog">{p.children}</div>
    },
    DialogContent: ({ children }: { children: React.ReactNode }) => (
        <div data-testid="mock-dialog-content">{children}</div>
    ),
    DialogHeader: ({ children }: { children: React.ReactNode }) => (
        <div>{children}</div>
    ),
    DialogTitle: ({ children }: { children: React.ReactNode }) => (
        <div>{children}</div>
    ),
    DialogFooter: ({ children }: { children: React.ReactNode }) => (
        <div>{children}</div>
    ),
}))

const pendingRequest: AccessRequestPublic = {
    id: 1,
    email: 'test-user@example.com',
    first_name: 'Test',
    last_name: 'User',
    status: 'pending',
    reviewed_at: null,
    reviewer: null,
    created_at: '2024-01-01T00:00:00.000Z',
    updated_at: '2024-01-02T00:00:00.000Z',
}

const reviewer: ReviewerPublic = {
    id: 2,
    username: 'admin',
}

const approvedRequest: AccessRequestPublic = {
    id: 3,
    email: 'approved-user@example.com',
    first_name: 'Approved',
    last_name: 'User',
    status: 'approved',
    reviewed_at: '2024-01-03T00:00:00.000Z',
    reviewer: reviewer,
    created_at: '2024-01-04T00:00:00.000Z',
    updated_at: '2024-01-05T00:00:00.000Z',
}

const rejectedRequest: AccessRequestPublic = {
    id: 4,
    email: 'rejected-user@example.com',
    first_name: 'Rejected',
    last_name: 'User',
    status: 'rejected',
    reviewed_at: '2024-01-06T00:00:00.000Z',
    reviewer: reviewer,
    created_at: '2024-01-07T00:00:00.000Z',
    updated_at: '2024-01-08T00:00:00.000Z',
}

const defaultRequests = [pendingRequest, approvedRequest, rejectedRequest]

const renderAccessRequestsTable = (
    overrides: Partial<Parameters<typeof AccessRequestsTable>[0]> = {}
) =>
    render(
        <AccessRequestsTable
            {...{
                requests: defaultRequests,
                isLoading: false,
                onRequestUpdated: onRequestUpdatedMock,
                onReloadRequests: onReloadRequestsMock,
                ...overrides,
            }}
        />
    )

const mockDialogState = ({
    isOpen = false,
    isConfirming = false,
    args = [pendingRequest, 'approved'],
} = {}) => {
    dialogMocks.useDialog.mockReturnValue({
        state: {
            isOpen,
            isConfirming,
            args,
        },
        open: dialogMocks.open,
        close: dialogMocks.close,
        confirm: dialogMocks.confirm,
    })
}

const getDialogProps = () => {
    return getMockProps(dialogMock) as {
        onOpenChange: (isOpen: boolean) => void
    }
}

beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getAccessRequestRowActions).mockReturnValue([
        {
            type: 'action',
            label: 'Approve',
            onSelect: vi.fn(),
            disabled: false,
        },
    ])
    vi.mocked(getStatusFilterOptions).mockReturnValue([
        { label: 'Pending', value: 'pending' },
    ])
    mockDialogState()
})

describe('AccessRequestsTable - columns', () => {
    it('configures actions column', () => {
        renderAccessRequestsTable()

        const cols = getDataTableProps<AccessRequestPublic>().columns
        const col = getColumn(cols, (c) => c.id === 'actions')

        testHeader(col, 'actions', 'Actions')

        const pendingCell = renderCell(col, pendingRequest)
        expect(
            pendingCell.getByTestId('mock-inline-row-actions')
        ).toBeInTheDocument()
        expect(getAccessRequestRowActions).toHaveBeenCalledWith(
            pendingRequest,
            false,
            expect.any(Function)
        )
        expect(inlineRowActionsMock).toHaveBeenCalledExactlyOnceWith(
            expect.objectContaining({ row: { original: pendingRequest } })
        )

        vi.mocked(getAccessRequestRowActions).mockReturnValueOnce([])
        const approvedCell = renderCell(col, approvedRequest)
        expect(approvedCell.getByText(dash)).toBeInTheDocument()
    })

    it('configures name column', () => {
        renderAccessRequestsTable()

        const cols = getDataTableProps<AccessRequestPublic>().columns
        const col = getColumn(cols, (c) => c.id === 'name')

        if (!hasAccessorFn(col))
            throw new Error('Name column does not have an accessorFn')
        expect(col.accessorFn(pendingRequest, 0)).toBe('Test User')
        expect(col.accessorFn(approvedRequest, 0)).toBe('Approved User')

        testHeader(col, 'name', 'Name')
    })

    it('configures status column', () => {
        renderAccessRequestsTable()

        const cols = getDataTableProps<AccessRequestPublic>().columns
        const col = getColumn(
            cols,
            (c) => hasAccessorKey(c) && c.accessorKey === 'status'
        )

        testHeader(col, 'status', 'Status')

        renderCell(col, pendingRequest)
        renderCell(col, approvedRequest)

        const badges = screen.getAllByTestId('mock-status-badge')
        expect(badges).toHaveLength(2)
        expect(statusBadgeMock).toHaveBeenCalledWith(
            expect.objectContaining({ status: 'pending' })
        )
        expect(statusBadgeMock).toHaveBeenCalledWith(
            expect.objectContaining({ status: 'approved' })
        )

        const mockRow = {
            getValue: () => 'pending',
        }

        if (!hasFilterFn(col))
            throw new Error('Status column does not have a filterFn')
        expect(col.filterFn(mockRow, 'status', ['pending'])).toBe(true)
        expect(col.filterFn(mockRow, 'status', ['approved'])).toBe(false)
    })

    it('configures email column', () => {
        renderAccessRequestsTable()

        const cols = getDataTableProps<AccessRequestPublic>().columns
        const col = getColumn(
            cols,
            (c) => hasAccessorKey(c) && c.accessorKey === 'email'
        )

        testHeader(col, 'email', 'Email')
    })

    it('configures reviewed by column', () => {
        renderAccessRequestsTable()

        const cols = getDataTableProps<AccessRequestPublic>().columns
        const col = getColumn(
            cols,
            (c) => hasAccessorKey(c) && c.accessorKey === 'reviewer.username'
        )

        testHeader(col, 'reviewer.username', 'Reviewed By')

        const rejectedCell = renderCell(col, rejectedRequest)
        expect(rejectedCell.getByText('admin')).toBeInTheDocument()

        const pendingCell = renderCell(col, pendingRequest)
        expect(pendingCell.getByText(dash)).toBeInTheDocument()
    })

    it('configures reviewed at column', () => {
        renderAccessRequestsTable()

        const cols = getDataTableProps<AccessRequestPublic>().columns
        const col = getColumn(
            cols,
            (c) => hasAccessorKey(c) && c.accessorKey === 'reviewed_at'
        )

        testHeader(col, 'reviewed_at', 'Reviewed At')

        const { getByText } = renderCell(col, approvedRequest)
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const expected = new Date(approvedRequest.reviewed_at!).toLocaleString()
        expect(getByText(expected)).toBeInTheDocument()
    })

    it('configures created at column', () => {
        renderAccessRequestsTable()

        const cols = getDataTableProps<AccessRequestPublic>().columns
        const col = getColumn(
            cols,
            (c) => hasAccessorKey(c) && c.accessorKey === 'created_at'
        )

        testHeader(col, 'created_at', 'Created At')

        const { getByText } = renderCell(col, pendingRequest)
        const expected = new Date(pendingRequest.created_at).toLocaleString()
        expect(getByText(expected)).toBeInTheDocument()
    })

    it('configures updated at column', () => {
        renderAccessRequestsTable()

        const cols = getDataTableProps<AccessRequestPublic>().columns
        const col = getColumn(
            cols,
            (c) => hasAccessorKey(c) && c.accessorKey === 'updated_at'
        )

        testHeader(col, 'updated_at', 'Updated At')

        const { getByText } = renderCell(col, rejectedRequest)
        const expected = new Date(rejectedRequest.updated_at).toLocaleString()
        expect(getByText(expected)).toBeInTheDocument()
    })
})

describe('AccessRequestsTable', () => {
    it('passes props to DataTable', () => {
        renderAccessRequestsTable()

        expect(screen.getByTestId('mock-data-table')).toBeInTheDocument()

        expect(dataTableMock).toHaveBeenCalledOnce()
        const props = getMockProps(dataTableMock)
        expect(props).toMatchObject({
            data: defaultRequests,
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            columns: expect.any(Array),
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            toolbarConfig: expect.any(Object),
            pageSize: 5,
            isLoading: false,
        })

        expect(getStatusFilterOptions).toHaveBeenCalledOnce()
    })
})

describe('AccessRequestsTable - dialog', () => {
    it('calls handleUpdate in callback', async () => {
        renderAccessRequestsTable()

        expect(screen.getByTestId('mock-dialog')).toBeInTheDocument()

        expect(dialogMocks.useDialog).toHaveBeenCalledOnce()

        const onConfirm = getMockProps(dialogMocks.useDialog)
        expect(onConfirm).toBeTypeOf('function')

        await act(async () => {
            // @ts-expect-error onConfirm is typed correctly
            onConfirm(pendingRequest, 'approved')
            await Promise.resolve()
        })

        expect(handleUpdate).toHaveBeenCalledExactlyOnceWith(
            pendingRequest,
            'approved',
            { id: 1, username: 'test-user' },
            onRequestUpdatedMock,
            onReloadRequestsMock,
            expect.any(Function)
        )
    })

    it('does nothing if onOpenChange called with true', () => {
        renderAccessRequestsTable()

        const dialogProps = getDialogProps()
        dialogProps.onOpenChange(true)

        expect(dialogMocks.close).not.toHaveBeenCalled()
    })

    it('does nothing if onOpenChange called when dialog already confirming', () => {
        mockDialogState({
            isOpen: true,
            isConfirming: true,
        })
        renderAccessRequestsTable()

        const dialogProps = getDialogProps()
        dialogProps.onOpenChange(false)

        expect(dialogMocks.close).not.toHaveBeenCalled()
    })

    it('closes dialog when onOpenChange called with false', () => {
        renderAccessRequestsTable()

        const dialogProps = getDialogProps()
        dialogProps.onOpenChange(false)

        expect(dialogMocks.close).toHaveBeenCalledOnce()
    })

    it('shows correct dialog content for approve', () => {
        mockDialogState({
            isOpen: true,
        })
        renderAccessRequestsTable()

        expect(screen.getByText('Approve Request')).toBeInTheDocument()
        const content = screen.getByTestId('mock-dialog-content')
        expect(content).toHaveTextContent(
            'Are you sure you want to approve this access request'
        )
    })

    it('shows correct dialog content for reject', () => {
        mockDialogState({
            isOpen: true,
            args: [pendingRequest, 'rejected'],
        })
        renderAccessRequestsTable()

        expect(screen.getByText('Reject Request')).toBeInTheDocument()
        const content = screen.getByTestId('mock-dialog-content')
        expect(content).toHaveTextContent(
            'Are you sure you want to reject this access request'
        )
    })

    it('disables buttons when dialog is confirming', () => {
        vi.mocked(getDialogConfirmButtonText).mockReturnValueOnce(
            'Approving...'
        )

        mockDialogState({
            isOpen: true,
            isConfirming: true,
        })
        renderAccessRequestsTable()

        const cancelButton = screen.getByText('Cancel')
        const approvingButton = screen.getByText('Approving...')

        expect(cancelButton).toBeDisabled()
        expect(approvingButton).toBeDisabled()
    })

    it('calls confirm when button clicked', async () => {
        vi.mocked(getDialogConfirmButtonText).mockReturnValueOnce('Reject')

        renderAccessRequestsTable()

        const button = screen.getByText('Reject')
        await userEvent.click(button)

        expect(dialogMocks.confirm).toHaveBeenCalledOnce()
    })

    it('passes null for action when args are not set', () => {
        vi.mocked(getDialogConfirmButtonText).mockReturnValueOnce('Reject')

        mockDialogState({
            isOpen: true,
            // @ts-expect-error args set null intentionally
            args: null,
        })

        renderAccessRequestsTable()

        expect(getDialogConfirmButtonText).toHaveBeenCalledWith(null, false)
    })
})
