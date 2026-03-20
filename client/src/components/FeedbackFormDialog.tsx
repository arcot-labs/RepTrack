import { FeedbackService } from '@/api/generated'
import { zCreateFeedbackRequest } from '@/api/generated/zod.gen'
import { Field } from '@/components/forms/Field'
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
import { handleApiError } from '@/lib/http'
import { notify } from '@/lib/notify'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

const feedbackFormSchema = zCreateFeedbackRequest.omit({
    url: true,
    files: true,
})
type FeedbackForm = z.infer<typeof feedbackFormSchema>

export function FeedbackFormDialog() {
    const [open, setOpen] = useState(false)
    const [files, setFiles] = useState<File[]>([])

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        formState: { errors, isDirty, isSubmitting },
        reset,
    } = useForm<FeedbackForm>({
        resolver: zodResolver(feedbackFormSchema),
        defaultValues: {
            type: 'feedback',
            title: '',
            description: '',
        },
        mode: 'onSubmit',
        reValidateMode: 'onChange',
    })

    // eslint-disable-next-line react-hooks/incompatible-library
    const type = watch('type')

    const onSubmit = async (form: FeedbackForm) => {
        const { error } = await FeedbackService.createFeedback({
            body: {
                ...form,
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
        reset()
        setFiles([])
        setOpen(false)
    }

    const onAttemptClose = (e: Event) => {
        if ((isDirty || files.length > 0) && !confirm('Discard changes?')) {
            e.preventDefault()
        } else {
            reset()
            setFiles([])
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>Feedback</Button>
            </DialogTrigger>
            <DialogContent
                onPointerDownOutside={(e) => {
                    onAttemptClose(e)
                }}
                showCloseButton={false}
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
                    <Field
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
                    </Field>
                    <Field
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
                    </Field>
                    <Field label="Attach files (optional)" htmlFor="files">
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
                    </Field>
                </form>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button
                            variant="destructive"
                            disabled={isSubmitting}
                            onClick={(e) => {
                                onAttemptClose(e as unknown as Event)
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
