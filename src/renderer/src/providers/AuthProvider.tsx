import { Button } from '../components/Button'
import { useAuth } from '../hooks/firebase'
import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { useConfigInit } from '../hooks/config'
import { TextField } from '@renderer/components/form/TextField'
import { zodResolver } from '@hookform/resolvers/zod'
import z from 'zod'
import { useForm } from 'react-hook-form'
import { FormError } from '@renderer/components/form'
import toast from 'react-hot-toast'

function Loading() {
  return (
    <div className="h-screen w-screen flex items-center justify-center">
      <Loader2 className="size-4 animate-spin" />
    </div>
  )
}

const promiseSignInToast = (promise: Promise<unknown>) =>
  toast.promise(promise, {
    loading: 'Entrando...',
    success: 'Login realizado com sucesso!',
    error: 'Erro ao entrar'
  })

const promiseSignUpToast = (promise: Promise<unknown>) =>
  toast.promise(promise, {
    loading: 'Criando conta...',
    success: 'Conta criada com sucesso!',
    error: 'Erro ao criar conta'
  })

function SignUpSignIn() {
  const [action, setAction] = useState<'sign-up' | 'sign-in'>('sign-in')
  const signUp = useAuth((state) => state.signUp)
  const signIn = useAuth((state) => state.signIn)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<{ email: string; password: string }>({
    resolver: zodResolver(
      z.object({
        email: z.string('Email é obrigatório').email('Email inválido'),
        password: z.string('Senha é obrigatória').min(6, 'Senha deve ter pelo menos 6 caracteres')
      })
    ),
    defaultValues: { email: '', password: '' }
  })

  const onSubmit = async (data: { email: string; password: string }) => {
    if (action === 'sign-in') {
      await promiseSignInToast(signIn(data.email, data.password))
    } else {
      await promiseSignUpToast(signUp(data.email, data.password))
    }
  }

  return (
    <div className="h-screen w-screen flex items-center justify-center">
      <div>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 w-[400px]">
          <h2 className="text-2xl font-bold">{action === 'sign-in' ? 'Login' : 'Criar conta'}</h2>
          <TextField
            placeholder="Email"
            {...register('email')}
            error={!!errors.email}
            disabled={isSubmitting}
          />
          {errors.email && <FormError>{errors.email.message}</FormError>}
          <TextField
            type="password"
            placeholder="Password"
            {...register('password')}
            error={!!errors.password}
            disabled={isSubmitting}
          />
          {errors.password && <FormError>{errors.password.message}</FormError>}
          <Button variant="primary" type="submit" isLoading={isSubmitting}>
            {action === 'sign-in' ? 'Login' : 'Criar conta'}
          </Button>
        </form>
        {action === 'sign-up' ? (
          <p className="text-sm text-center mt-4">
            Já tem uma conta?{' '}
            <button className="text-primary cursor-pointer" onClick={() => setAction('sign-in')}>
              Fazer login
            </button>
          </p>
        ) : (
          <p className="text-sm text-center mt-4">
            Não tem uma conta?{' '}
            <button className="text-primary cursor-pointer" onClick={() => setAction('sign-up')}>
              Criar conta
            </button>
          </p>
        )}
      </div>
    </div>
  )
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const load = useAuth((state) => state.load)
  const isSignedIn = useAuth((state) => state.user !== null)
  const isLoad = useAuth((state) => state.isLoad)

  const configLoad = useConfigInit()

  useEffect(() => {
    load()
  }, [])

  if (!isLoad) {
    return <Loading />
  }
  if (!isSignedIn) {
    return (
      <div className="h-screen w-screen flex items-center justify-center">
        <SignUpSignIn />
      </div>
    )
  }

  if (!configLoad) {
    return <Loading />
  }
  return children
}
