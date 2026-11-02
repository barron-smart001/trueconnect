import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { AuthHeading, AuthLayout } from '../components/auth/parts'
import { ApiError, getAuthenticatedUser } from '../lib/api'
import { setUser } from '../lib/session'

export function AuthCallback() {
  const location = useLocation()
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const providerError = new URLSearchParams(location.search).get('error_description')
    ?? new URLSearchParams(location.search).get('error')
  const errorMessage = providerError || error

  useEffect(() => {
    let active = true
    const params = new URLSearchParams(location.search)
    const callbackProviderError = params.get('error_description') ?? params.get('error')

    if (callbackProviderError) {
      return () => {
        active = false
      }
    }

    async function completeSignIn() {
      try {
        const user = await getAuthenticatedUser()
        if (!active) return
        setUser(user)
        const destination = params.get('next') === '/onboarding' ? '/onboarding' : '/dashboard'
        navigate(destination, { replace: true })
      } catch (cause) {
        if (!active) return
        const api = cause instanceof ApiError ? cause : new ApiError('Could not complete sign in. Please try again.')
        setError(api.message)
      }
    }

    void completeSignIn()
    return () => {
      active = false
    }
  }, [location.search, navigate])

  return (
    <AuthLayout shift={3} image="/images/auth-signin.jpg">
      <AuthHeading title={errorMessage ? 'Sign in failed' : 'Signing you in'} subtitle={errorMessage ? 'We could not complete authentication.' : 'Please wait while we finish setting up your account.'} />
      {errorMessage && (
        <div className="mt-6 text-center">
          <p role="alert" className="text-[14px] leading-[22px] text-[#ff383c]">{errorMessage}</p>
          <Link to="/signin" className="mt-4 inline-block text-[14px] text-gold">Return to sign in</Link>
        </div>
      )}
    </AuthLayout>
  )
}
