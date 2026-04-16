import { FeedbackService } from '@/api/generated'
import { FeedbackFormDialog } from '@/components/feedback/FeedbackFormDialog'
import * as httpModule from '@/lib/http'
import { notify } from '@/lib/notify'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/config/env', () => ({
    getEnv: () => ({
        IMAGE_TAG: 'test-build',
    }),
}))

const createFeedbackMock = vi.spyOn(FeedbackService, 'createFeedback')
const handleApiErrorMock = vi.spyOn(httpModule, 'handleApiError')
const notifySuccessMock = vi.spyOn(notify, 'success')

const renderDialog = () =>
    render(<FeedbackFormDialog trigger={<button>Open Feedback</button>} />)

const openDialog = async () => {
    await userEvent.click(screen.getByRole('button', { name: 'Open Feedback' }))
}

const fillRequiredFields = async () => {
    await userEvent.type(screen.getByLabelText('Title'), 'Add export options')
    await userEvent.type(
        screen.getByLabelText('Description'),
        'CSV export for workout history would help a lot.'
    )
}

describe('FeedbackFormDialog', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        createFeedbackMock.mockResolvedValue({
            error: undefined,
        } as never)
        handleApiErrorMock.mockResolvedValue(undefined)
        notifySuccessMock.mockImplementation(() => undefined)
    })

    it('renders default feedback state when opened', async () => {
        renderDialog()
        await openDialog()

        expect(
            screen.getByText('Share feedback or request a feature')
        ).toBeInTheDocument()
        expect(
            screen.getByRole('button', { name: 'Feedback' })
        ).toBeInTheDocument()
        expect(
            screen.getByRole('button', { name: 'Feature Request' })
        ).toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'Submit' })).toBeDisabled()
    })

    it('displays feedback content when feedback button is clicked', async () => {
        renderDialog()
        await openDialog()

        const feedbackButton = screen.getByRole('button', { name: 'Feedback' })
        const featureButton = screen.getByRole('button', {
            name: 'Feature Request',
        })

        await userEvent.click(feedbackButton)

        expect(feedbackButton).toHaveAttribute('data-variant', 'default')
        expect(feedbackButton).toHaveClass('border border-transparent')
        expect(featureButton).toHaveAttribute('data-variant', 'outline')

        expect(
            screen.getByPlaceholderText('Describe your feedback...')
        ).toBeInTheDocument()
    })

    it('displays feature request content when feature request button is clicked', async () => {
        renderDialog()
        await openDialog()

        const feedbackButton = screen.getByRole('button', { name: 'Feedback' })
        const featureButton = screen.getByRole('button', {
            name: 'Feature Request',
        })

        await userEvent.click(featureButton)

        expect(feedbackButton).toHaveAttribute('data-variant', 'outline')
        expect(featureButton).toHaveAttribute('data-variant', 'default')
        expect(featureButton).toHaveClass('border border-transparent')

        expect(
            screen.getByPlaceholderText('Describe your feature request...')
        ).toBeInTheDocument()
    })

    it('shows invalid state for title', async () => {
        renderDialog()
        await openDialog()

        const titleInput = screen.getByLabelText('Title')
        const descriptionInput = screen.getByLabelText('Description')

        await userEvent.type(
            descriptionInput,
            'CSV export for workout history would help a lot.'
        )
        await userEvent.click(screen.getByRole('button', { name: 'Submit' }))

        await waitFor(() => {
            expect(createFeedbackMock).not.toHaveBeenCalled()
        })

        expect(titleInput).toHaveAttribute('aria-invalid', 'true')
        expect(titleInput).toHaveClass('border-destructive')
        expect(descriptionInput).toHaveAttribute('aria-invalid', 'false')
    })

    it('shows invalid state for description', async () => {
        renderDialog()
        await openDialog()

        const titleInput = screen.getByLabelText('Title')
        const descriptionInput = screen.getByLabelText('Description')

        await userEvent.type(titleInput, 'Add export options')
        await userEvent.click(screen.getByRole('button', { name: 'Submit' }))

        await waitFor(() => {
            expect(createFeedbackMock).not.toHaveBeenCalled()
        })

        expect(titleInput).toHaveAttribute('aria-invalid', 'false')
        expect(descriptionInput).toHaveAttribute('aria-invalid', 'true')
        expect(descriptionInput).toHaveClass('border-destructive')
    })

    it('shows selected file count text', async () => {
        renderDialog()
        await openDialog()

        const firstFile = new File(['first'], 'first.png', {
            type: 'image/png',
        })
        await userEvent.upload(
            screen.getByLabelText('Attach files (optional)'),
            firstFile
        )

        expect(screen.getByText('1 file selected')).toBeInTheDocument()

        const secondFile = new File(['second'], 'second.png', {
            type: 'image/png',
        })
        await userEvent.upload(
            screen.getByLabelText('Attach files (optional)'),
            [firstFile, secondFile]
        )

        expect(screen.getByText('2 files selected')).toBeInTheDocument()
    })

    it('treats null file input values as an empty file list', async () => {
        renderDialog()
        await openDialog()

        const fileInput = screen.getByLabelText('Attach files (optional)')
        fireEvent.change(fileInput, { target: { files: null } })

        expect(screen.queryByText('1 file selected')).not.toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'Submit' })).toBeDisabled()
    })

    it('closes immediately when pristine cancel is clicked', async () => {
        const confirmMock = vi.spyOn(window, 'confirm')

        renderDialog()
        await openDialog()
        await userEvent.click(screen.getByRole('button', { name: 'Cancel' }))

        expect(confirmMock).not.toHaveBeenCalled()
        await waitFor(() => {
            expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
        })
    })

    it('asks for confirmation before closing dirty changes', async () => {
        const confirmMock = vi.spyOn(window, 'confirm').mockReturnValue(false)

        renderDialog()

        await openDialog()
        await userEvent.type(screen.getByLabelText('Title'), 'Unsaved title')
        await userEvent.click(screen.getByRole('button', { name: 'Cancel' }))

        expect(confirmMock).toHaveBeenCalledWith('Discard changes?')
        expect(screen.getByRole('dialog')).toBeInTheDocument()
    })

    it('routes dialog close button through onOpenChange', async () => {
        const confirmMock = vi.spyOn(window, 'confirm').mockReturnValue(false)

        renderDialog()
        await openDialog()
        await userEvent.type(screen.getByLabelText('Title'), 'Unsaved title')
        await userEvent.click(screen.getByRole('button', { name: 'Close' }))

        expect(confirmMock).toHaveBeenCalledWith('Discard changes?')
        expect(screen.getByRole('dialog')).toBeInTheDocument()
    })

    it('routes escape key and outside clicks through close guard', async () => {
        const confirmMock = vi.spyOn(window, 'confirm').mockReturnValue(false)

        renderDialog()
        await openDialog()
        await userEvent.type(screen.getByLabelText('Title'), 'Unsaved title')

        fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' })
        expect(confirmMock).toHaveBeenCalledWith('Discard changes?')
        expect(screen.getByRole('dialog')).toBeInTheDocument()

        const overlay = document.querySelector('[data-slot="dialog-overlay"]')
        if (!overlay) throw new Error('Dialog overlay not found')

        fireEvent.pointerDown(overlay)
        expect(confirmMock).toHaveBeenCalledTimes(2)
        expect(screen.getByRole('dialog')).toBeInTheDocument()
    })

    it('closes dirty changes when confirmation is accepted', async () => {
        const confirmMock = vi.spyOn(window, 'confirm').mockReturnValue(true)

        renderDialog()
        await openDialog()
        await userEvent.type(screen.getByLabelText('Title'), 'Unsaved title')
        await userEvent.click(screen.getByRole('button', { name: 'Cancel' }))

        expect(confirmMock).toHaveBeenCalledWith('Discard changes?')
        await waitFor(() => {
            expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
        })
    })

    it('conditionally enables submit button for dirty form', async () => {
        renderDialog()
        await openDialog()

        const submitButton = screen.getByRole('button', { name: 'Submit' })
        expect(submitButton).toBeDisabled()

        await userEvent.type(
            screen.getByLabelText('Title'),
            'Needs darker charts'
        )
        expect(submitButton).toBeEnabled()
    })

    it('conditionally enables submit button when files are selected', async () => {
        renderDialog()
        await openDialog()

        const submitButton = screen.getByRole('button', { name: 'Submit' })
        expect(submitButton).toBeDisabled()

        const file = new File(['mock screenshot'], 'feedback.png', {
            type: 'image/png',
        })
        await userEvent.upload(
            screen.getByLabelText('Attach files (optional)'),
            file
        )
        expect(submitButton).toBeEnabled()
    })

    it('prevents invalid submission when required fields are missing', async () => {
        renderDialog()
        await openDialog()

        const titleInput = screen.getByLabelText('Title')

        await userEvent.click(screen.getByRole('button', { name: 'Submit' }))

        await waitFor(() => {
            expect(createFeedbackMock).not.toHaveBeenCalled()
        })

        expect(titleInput).toHaveValue('')
        expect(notifySuccessMock).not.toHaveBeenCalled()
        expect(screen.getByRole('dialog')).toBeInTheDocument()
    })

    it('resets form data and submit state when reopened', async () => {
        vi.spyOn(window, 'confirm').mockReturnValue(true)

        renderDialog()
        await openDialog()
        await userEvent.click(
            screen.getByRole('button', { name: 'Feature Request' })
        )
        await userEvent.type(screen.getByLabelText('Title'), 'Unsaved title')
        await userEvent.type(
            screen.getByLabelText('Description'),
            'Unsaved description'
        )

        const file = new File(['mock screenshot'], 'feedback.png', {
            type: 'image/png',
        })
        await userEvent.upload(
            screen.getByLabelText('Attach files (optional)'),
            file
        )
        await userEvent.click(screen.getByRole('button', { name: 'Cancel' }))

        await waitFor(() => {
            expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
        })

        await openDialog()

        expect(screen.getByLabelText('Title')).toHaveValue('')
        expect(screen.getByLabelText('Description')).toHaveValue('')
        expect(
            screen.getByPlaceholderText('Describe your feedback...')
        ).toBeInTheDocument()
        expect(screen.queryByText('1 file selected')).not.toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'Submit' })).toBeDisabled()
    })

    it('submits feedback with correct payload', async () => {
        renderDialog()
        await openDialog()
        await fillRequiredFields()

        const file = new File(['mock screenshot'], 'feedback.png', {
            type: 'image/png',
        })
        await userEvent.upload(
            screen.getByLabelText('Attach files (optional)'),
            file
        )
        await userEvent.click(screen.getByRole('button', { name: 'Submit' }))

        await waitFor(() => {
            expect(createFeedbackMock).toHaveBeenCalledOnce()
        })

        expect(createFeedbackMock).toHaveBeenCalledWith({
            body: {
                type: 'feedback',
                build: 'test-build',
                title: 'Add export options',
                description: 'CSV export for workout history would help a lot.',
                url: window.location.href,
                files: [file],
            },
        })
        expect(handleApiErrorMock).not.toHaveBeenCalled()
        expect(notifySuccessMock).toHaveBeenCalledWith('Feedback submitted')
        await waitFor(() => {
            expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
        })
    })

    it('submits feature request with type feature', async () => {
        renderDialog()
        await openDialog()
        await userEvent.click(
            screen.getByRole('button', { name: 'Feature Request' })
        )
        await fillRequiredFields()
        await userEvent.click(screen.getByRole('button', { name: 'Submit' }))

        await waitFor(() => {
            expect(createFeedbackMock).toHaveBeenCalledOnce()
        })

        expect(createFeedbackMock).toHaveBeenCalledWith({
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            body: expect.objectContaining({
                type: 'feature',
            }),
        })
    })

    it('handles submit failure', async () => {
        createFeedbackMock.mockResolvedValue({
            error: { detail: 'bad request' },
        } as never)

        renderDialog()

        await openDialog()
        await userEvent.type(screen.getByLabelText('Title'), 'Broken submit')
        await userEvent.type(
            screen.getByLabelText('Description'),
            'This should fail.'
        )
        await userEvent.click(screen.getByRole('button', { name: 'Submit' }))

        await waitFor(() => {
            expect(handleApiErrorMock).toHaveBeenCalledWith(
                { detail: 'bad request' },
                {
                    fallbackMessage: 'Failed to submit feedback',
                }
            )
        })

        expect(notifySuccessMock).not.toHaveBeenCalled()
        expect(screen.getByRole('dialog')).toBeInTheDocument()
    })

    it('shows submitting state and blocks closing while request is in flight', async () => {
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        let resolveRequest: () => void = () => {}
        createFeedbackMock.mockImplementation(
            () =>
                new Promise((resolve) => {
                    resolveRequest = () => {
                        resolve({ error: undefined })
                    }
                }) as never
        )
        const confirmMock = vi.spyOn(window, 'confirm')

        renderDialog()
        await openDialog()
        await fillRequiredFields()
        await userEvent.click(screen.getByRole('button', { name: 'Submit' }))

        await waitFor(() => {
            expect(
                screen.getByRole('button', { name: 'Submitting...' })
            ).toBeDisabled()
        })
        expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled()

        await userEvent.click(screen.getByRole('button', { name: 'Cancel' }))
        expect(confirmMock).not.toHaveBeenCalled()
        expect(screen.getByRole('dialog')).toBeInTheDocument()

        fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' })
        expect(confirmMock).not.toHaveBeenCalled()
        expect(screen.getByRole('dialog')).toBeInTheDocument()

        resolveRequest()

        await waitFor(() => {
            expect(notifySuccessMock).toHaveBeenCalledWith('Feedback submitted')
        })
        await waitFor(() => {
            expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
        })
    })
})
