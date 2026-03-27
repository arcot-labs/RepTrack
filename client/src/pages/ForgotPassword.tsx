import { AuthService } from '@/api/generated'
import { zForgotPasswordRequest } from '@/api/generated/zod.gen'
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
import { Link } from 'react-router-dom'
import { z } from 'zod'

type ForgotPasswordForm = z.infer<typeof zForgotPasswordRequest>

export function ForgotPassword() {
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        reset,
    } = useForm<ForgotPasswordForm>({
        resolver: zodResolver(zForgotPasswordRequest),
        mode: 'onSubmit',
        reValidateMode: 'onChange',
    })

    const onSubmit = async (form: ForgotPasswordForm) => {
        const { error } = await AuthService.forgotPassword({ body: form })
        if (error) {
            await handleApiError(error, {
                fallbackMessage: 'Failed to request password reset',
            })
            return
        }
        notify.success(
            'If that email is registered, a reset link has been sent'
        )
        reset()
    }

    return (
        <div className="flex h-dvh items-center justify-center bg-muted px-4">
            <Card className="w-full max-w-sm rounded-lg! p-2 shadow-md">
                <CardHeader className="mb-1">
                    <CardTitle className="text-2xl">Forgot Password</CardTitle>
                </CardHeader>
                <CardContent>
                    <form
                        id="forgot-password-form"
                        className="space-y-4"
                        onSubmit={(e) => {
                            void handleSubmit(onSubmit)(e)
                        }}
                    >
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
                        form="forgot-password-form"
                        className="w-full"
                        disabled={isSubmitting}
                        type="submit"
                    >
                        {isSubmitting ? 'Sending...' : 'Send Reset Link'}
                    </Button>
                    <div className="flex flex-col items-center gap-1 text-sm">
                        <div className="text-muted-foreground">
                            Know your password?{' '}
                            <Link to="/login">
                                <Button
                                    variant="link"
                                    className="h-auto p-0 align-baseline"
                                >
                                    Log In
                                </Button>
                            </Link>
                        </div>
                        <div className="text-muted-foreground">
                            Need access?{' '}
                            <Link to="/request-access">
                                <Button
                                    variant="link"
                                    className="h-auto p-0 align-baseline"
                                >
                                    Request Access
                                </Button>
                            </Link>
                        </div>
                    </div>
                </CardFooter>
            </Card>
        </div>
    )
}
