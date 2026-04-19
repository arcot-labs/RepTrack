import { FeedbackService } from '@/api/generated'
import { zCreateFeedbackRequest } from '@/api/generated/zod.gen'
import { FormField } from '@/components/FormField'
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/overrides/button'
import { Textarea } from '@/components/ui/textarea'
import { getEnv } from '@/config/env'
import { handleApiError } from '@/lib/http'
import { notify } from '@/lib/notify'
import { preprocessTrim } from '@/lib/validation'
import { zodResolver } from '@hookform/resolvers/zod'
import type { ReactElement } from 'react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

const feedbackFormSchema = z.object({
    type: zCreateFeedbackRequest.shape.type,
    build: preprocessTrim(zCreateFeedbackRequest.shape.build),
    title: preprocessTrim(zCreateFeedbackRequest.shape.title),
    description: preprocessTrim(zCreateFeedbackRequest.shape.description),
})

type FeedbackForm = z.infer<typeof feedbackFormSchema>
type FeedbackFormInput = z.input<typeof feedbackFormSchema>

interface FeedbackFormDialogProps {
    trigger: ReactElement
}

export function FeedbackFormDialog({ trigger }: FeedbackFormDialogProps) {
    const [open, setOpen] = useState(false)
    const [files, setFiles] = useState<File[]>([])

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        formState: { errors, isDirty, isSubmitting },
        reset,
    } = useForm<FeedbackFormInput, unknown, FeedbackForm>({
        resolver: zodResolver(feedbackFormSchema),
        defaultValues: {
            type: 'feedback',
            build: getEnv().IMAGE_TAG,
            title: '',
            description: '',
        },
        mode: 'onSubmit',
        reValidateMode: 'onChange',
    })

    // eslint-disable-next-line react-hooks/incompatible-library
    const type = watch('type')

    const handleOpenChange = (nextOpen: boolean) => {
        if (nextOpen) {
            reset()
            setFiles([])
            setOpen(true)
            return
        }
        attemptClose()
    }

    const attemptClose = () => {
        if (isSubmitting) return
        const hasChanges = isDirty || files.length > 0
        if (hasChanges && !confirm('Discard changes?')) return
        close()
    }

    const close = () => {
        setOpen(false)
    }

    const onSubmit = async (form: FeedbackForm) => {
        const { error } = await FeedbackService.createFeedback({
            body: {
                ...feedbackFormSchema.parse(form),
                url: window.location.href,
                files: files,
            },
        })
        if (error) {
            await handleApiError(error, {
                fallbackMessage: 'Failed to submit feedback',
            })
            return
        }
        notify.success('Feedback submitted')
        close()
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>{trigger}</DialogTrigger>
            <DialogContent
                onPointerDownOutside={(e) => {
                    e.preventDefault()
                    attemptClose()
                }}
                onEscapeKeyDown={(e) => {
                    e.preventDefault()
                    attemptClose()
                }}
            >
                <DialogHeader className="text-left">
                    <DialogTitle>Feedback</DialogTitle>
                    <DialogDescription>
                        Share feedback or request a feature
                    </DialogDescription>
                </DialogHeader>
                <div className="flex gap-2">
                    <Button
                        variant={type === 'feedback' ? 'default' : 'outline'}
                        className={
                            type === 'feedback'
                                ? 'border border-transparent'
                                : ''
                        }
                        onClick={() => {
                            setValue('type', 'feedback')
                        }}
                        type="button"
                    >
                        Feedback
                    </Button>
                    <Button
                        variant={type === 'feature' ? 'default' : 'outline'}
                        className={
                            type === 'feature'
                                ? 'border border-transparent'
                                : ''
                        }
                        onClick={() => {
                            setValue('type', 'feature')
                        }}
                        type="button"
                    >
                        Feature Request
                    </Button>
                </div>
                <form
                    id="feedback-form"
                    className="space-y-4"
                    onSubmit={(e) => {
                        void handleSubmit(onSubmit)(e)
                    }}
                >
                    <FormField
                        label="Title"
                        htmlFor="title"
                        error={errors.title?.message}
                    >
                        <Input
                            id="title"
                            placeholder={'Enter a brief title...'}
                            aria-invalid={!!errors.title}
                            className={errors.title ? 'border-destructive' : ''}
                            {...register('title')}
                        />
                    </FormField>
                    <FormField
                        label="Description"
                        htmlFor="description"
                        error={errors.description?.message}
                    >
                        <Textarea
                            id="description"
                            placeholder={
                                type === 'feedback'
                                    ? 'Describe your feedback...'
                                    : 'Describe your feature request...'
                            }
                            aria-invalid={!!errors.description}
                            className={
                                errors.description ? 'border-destructive' : ''
                            }
                            {...register('description')}
                            rows={4}
                        />
                    </FormField>
                    <FormField label="Attach files (optional)" htmlFor="files">
                        <Input
                            id="files"
                            type="file"
                            multiple
                            onChange={(e) => {
                                setFiles(Array.from(e.target.files ?? []))
                            }}
                        />
                        {files.length > 0 && (
                            <p className="text-sm text-muted-foreground">
                                {files.length} file
                                {files.length > 1 ? 's' : ''} selected
                            </p>
                        )}
                    </FormField>
                </form>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button
                            variant="destructive"
                            disabled={isSubmitting}
                            onClick={(e) => {
                                e.preventDefault()
                                attemptClose()
                            }}
                        >
                            Cancel
                        </Button>
                    </DialogClose>
                    <Button
                        form="feedback-form"
                        type="submit"
                        variant="success"
                        disabled={
                            isSubmitting || !(isDirty || files.length > 0)
                        }
                    >
                        {isSubmitting ? 'Submitting...' : 'Submit'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
