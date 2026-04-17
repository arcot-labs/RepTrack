import { AuthService } from '@/api/generated'
import { zResetPasswordRequest } from '@/api/generated/zod.gen'
import { FormField } from '@/components/FormField'
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
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { z } from 'zod'

const zResetPasswordFormSchema = zResetPasswordRequest
    .extend({
        confirmPassword: zResetPasswordRequest.shape.password,
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: 'Passwords do not match',
        path: ['confirmPassword'],
    })

type ResetPasswordForm = z.infer<typeof zResetPasswordFormSchema>

export function ResetPassword() {
    const navigate = useNavigate()
    const [searchParams, setSearchParams] = useSearchParams()

    const tokenSet = searchParams.has('token')
    const token = searchParams.get('token') ?? ''

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        reset,
    } = useForm({
        resolver: zodResolver(zResetPasswordFormSchema),
        mode: 'onSubmit',
        reValidateMode: 'onChange',
        defaultValues: {
            token: token,
        },
    })

    const onSubmit = async (form: ResetPasswordForm) => {
        const { error } = await AuthService.resetPassword({
            body: form,
        })
        if (error) {
            await handleApiError(error, {
                httpErrorHandlers: {
                    invalid_token: (err) => {
                        notify.error(err.detail)
                        reset({ token: '', confirmPassword: '' })
                        setSearchParams({})
                    },
                },
                fallbackMessage: 'Failed to reset password',
            })
            return
        }
        notify.success('Password reset. You can now log in')
        void navigate('/login', { replace: true })
    }

    return (
        <div className="flex h-dvh items-center justify-center bg-muted px-4">
            <Card className="w-full max-w-sm rounded-lg! p-2 shadow-md">
                <CardHeader className="mb-1">
                    <CardTitle className="text-2xl">Reset Password</CardTitle>
                </CardHeader>
                <CardContent>
                    <form
                        id="reset-password-form"
                        className="space-y-4"
                        onSubmit={(e) => {
                            void handleSubmit(onSubmit)(e)
                        }}
                    >
                        <FormField
                            label="Token"
                            htmlFor="token"
                            error={errors.token?.message}
                        >
                            <Input
                                id="token"
                                autoComplete="off"
                                disabled={tokenSet}
                                aria-invalid={!!errors.token}
                                className={
                                    errors.token ? 'border-destructive' : ''
                                }
                                {...register('token')}
                            />
                        </FormField>
                        <FormField
                            label="New Password"
                            htmlFor="password"
                            error={errors.password?.message}
                        >
                            <Input
                                id="password"
                                type="password"
                                autoComplete="new-password"
                                aria-invalid={!!errors.password}
                                className={
                                    errors.password ? 'border-destructive' : ''
                                }
                                {...register('password')}
                            />
                        </FormField>
                        <FormField
                            label="Confirm Password"
                            htmlFor="confirmPassword"
                            error={errors.confirmPassword?.message}
                        >
                            <Input
                                id="confirmPassword"
                                type="password"
                                autoComplete="new-password"
                                aria-invalid={!!errors.confirmPassword}
                                className={
                                    errors.confirmPassword
                                        ? 'border-destructive'
                                        : ''
                                }
                                {...register('confirmPassword')}
                            />
                        </FormField>
                    </form>
                </CardContent>
                <CardFooter className="mt-2 mb-1 flex flex-col gap-3">
                    <Button
                        form="reset-password-form"
                        className="w-full"
                        disabled={isSubmitting}
                        type="submit"
                    >
                        {isSubmitting ? 'Resetting...' : 'Reset password'}
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
                    </div>
                </CardFooter>
            </Card>
        </div>
    )
}
