import { AuthService } from '@/api/generated'
import { zRequestAccessRequest } from '@/api/generated/zod.gen'
import { Field } from '@/components/forms/Field'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/overrides/button'
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/overrides/card'
import { handleApiError } from '@/lib/http'
import { notify } from '@/lib/notify'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { z } from 'zod'

type RequestAccessForm = z.infer<typeof zRequestAccessRequest>

export function RequestAccess() {
    const navigate = useNavigate()

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        reset,
    } = useForm<RequestAccessForm>({
        resolver: zodResolver(zRequestAccessRequest),
        mode: 'onSubmit',
        reValidateMode: 'onChange',
    })

    const onSubmit = async (form: RequestAccessForm) => {
        const { data, error } = await AuthService.requestAccess({ body: form })
        if (error) {
            await handleApiError(error, {
                httpErrorHandlers: {
                    email_in_use: (err) => {
                        notify.error(err.detail)
                        void navigate('/login', { replace: true })
                    },
                    access_request_pending: (err) => {
                        notify.error(err.detail)
                        reset()
                    },
                    access_request_rejected: (err) => {
                        notify.error(err.detail)
                        reset()
                    },
                },
                fallbackMessage: 'Failed to request access',
            })
            return
        }
        notify.success(data)
        reset()
    }

    return (
        <div className="flex h-dvh items-center justify-center bg-muted px-4">
            <Card className="w-full max-w-sm rounded-lg! p-2 shadow-md">
                <CardHeader className="mb-1">
                    <CardTitle className="text-2xl">Request Access</CardTitle>
                </CardHeader>
                <CardContent>
                    <form
                        id="request-access-form"
                        className="space-y-4"
                        onSubmit={(e) => {
                            void handleSubmit(onSubmit)(e)
                        }}
                    >
                        <Field
                            label="First name"
                            htmlFor="first_name"
                            error={errors.first_name?.message}
                        >
                            <Input
                                id="first_name"
                                autoComplete="given-name"
                                aria-invalid={!!errors.first_name}
                                className={
                                    errors.first_name
                                        ? 'border-destructive'
                                        : ''
                                }
                                {...register('first_name')}
                            />
                        </Field>
                        <Field
                            label="Last name"
                            htmlFor="last_name"
                            error={errors.last_name?.message}
                        >
                            <Input
                                id="last_name"
                                autoComplete="family-name"
                                aria-invalid={!!errors.last_name}
                                className={
                                    errors.last_name ? 'border-destructive' : ''
                                }
                                {...register('last_name')}
                            />
                        </Field>
                        <Field
                            label="Email"
                            htmlFor="email"
                            error={errors.email?.message}
                        >
                            <Input
                                id="email"
                                type="email"
                                autoComplete="email"
                                aria-invalid={!!errors.email}
                                className={
                                    errors.email ? 'border-destructive' : ''
                                }
                                {...register('email')}
                            />
                        </Field>
                    </form>
                </CardContent>
                <CardFooter className="mt-2 mb-1 flex flex-col gap-3">
                    <Button
                        form="request-access-form"
                        className="w-full"
                        disabled={isSubmitting}
                        type="submit"
                    >
                        {isSubmitting ? 'Submitting...' : 'Request Access'}
                    </Button>
                    <div className="flex flex-col items-center gap-1 text-sm">
                        <div className="text-muted-foreground">
                            Already have a token?{' '}
                            <Link to="/register">
                                <Button
                                    variant="link"
                                    className="h-auto p-0 align-baseline"
                                >
                                    Register
                                </Button>
                            </Link>
                        </div>
                        <div className="text-muted-foreground">
                            Already have an account?{' '}
                            <Link to="/login">
                                <Button
                                    variant="link"
                                    className="h-auto p-0 align-baseline"
                                >
                                    Log In
                                </Button>
                            </Link>
                        </div>
                    </div>
                </CardFooter>
            </Card>
        </div>
    )
}
