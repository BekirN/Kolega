import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'

export default function VerifyEmail() {
  const navigate = useNavigate()
  const [code, setCode] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [countdown, setCountdown] = useState(60)
  const [canResend, setCanResend] = useState(false)
  const inputRefs = useRef([])
  const user = JSON.parse(localStorage.getItem('user') || '{}')

  // Countdown za resend
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(c => c - 1), 1000)
      return () => clearTimeout(timer)
    } else {
      setCanResend(true)
    }
  }, [countdown])

  const handleInput = (i, val) => {
    if (!/^\d*$/.test(val)) return
    const newCode = [...code]
    newCode[i] = val.slice(-1)
    setCode(newCode)
    setError('')

    // Auto-focus next
    if (val && i < 5) {
      inputRefs.current[i + 1]?.focus()
    }

    // Auto-submit kada su sva polja popunjena
    if (newCode.every(c => c !== '') && val) {
      handleVerify(newCode.join(''))
    }
  }

  const handleKeyDown = (i, e) => {
    if (e.key === 'Backspace' && !code[i] && i > 0) {
      inputRefs.current[i - 1]?.focus()
    }
    if (e.key === 'ArrowLeft' && i > 0) inputRefs.current[i - 1]?.focus()
    if (e.key === 'ArrowRight' && i < 5) inputRefs.current[i + 1]?.focus()
  }

  const handlePaste = (e) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (pasted.length === 6) {
      const newCode = pasted.split('')
      setCode(newCode)
      inputRefs.current[5]?.focus()
      handleVerify(pasted)
    }
  }

  const handleVerify = async (codeStr) => {
    setLoading(true)
    setError('')
    try {
      await api.post('/auth/verify-email', { code: codeStr })
      setSuccess(true)

      // Ažuriraj user u localStorage
      const user = JSON.parse(localStorage.getItem('user') || '{}')
      localStorage.setItem('user', JSON.stringify({ ...user, emailVerified: true }))

      setTimeout(() => navigate('/dashboard'), 2000)
    } catch (err) {
      setError(err.response?.data?.message || 'Pogrešan kod. Pokušaj ponovo.')
      setCode(['', '', '', '', '', ''])
      inputRefs.current[0]?.focus()
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    setResending(true)
    try {
      await api.post('/auth/resend-verification')
      setCountdown(60)
      setCanResend(false)
      setError('')
    } catch (err) {
      setError(err.response?.data?.message || 'Greška pri slanju')
    } finally {
      setResending(false)
    }
  }

  const handleSubmit = () => {
    const codeStr = code.join('')
    if (codeStr.length === 6) handleVerify(codeStr)
  }

  if (success) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center',
        justifyContent: 'center', background: '#E2DDD6',
      }}>
        <div style={{ textAlign: 'center', animation: 'fadeSlideUp 0.5s ease' }}>
          <div style={{
            width: '80px', height: '80px', borderRadius: '50%', margin: '0 auto 20px',
            background: 'linear-gradient(135deg, #16A34A, #4ADE80)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '36px',
            boxShadow: '0 8px 32px rgba(22,163,74,0.3)',
          }}>
            ✓
          </div>
          <h2 style={{ fontSize: '28px', fontWeight: '900', color: '#1C1C1E', marginBottom: '8px' }}>
            Email verifikovan! 🎉
          </h2>
          <p style={{ color: '#7A7570', fontSize: '15px' }}>
            Preusmjeravamo te na platformu...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: '#E2DDD6', padding: '20px',
    }}>
      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .code-input:focus { outline: none; }
      `}</style>

      <div style={{ width: '100%', maxWidth: '420px', animation: 'fadeSlideUp 0.5s ease' }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            width: '56px', height: '56px', borderRadius: '18px', margin: '0 auto 12px',
            background: 'linear-gradient(135deg, #FF6B35, #FFB800)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '28px', fontWeight: '900', color: 'white',
            boxShadow: '0 8px 24px rgba(255,107,53,0.35)',
          }}>
            K
          </div>
          <h1 style={{ fontSize: '26px', fontWeight: '900', color: '#1C1C1E', marginBottom: '6px', letterSpacing: '-0.02em' }}>
            Verifikuj email 📧
          </h1>
          <p style={{ color: '#7A7570', fontSize: '14px', lineHeight: '1.5' }}>
            Poslali smo 6-cifreni kod na<br />
            <strong style={{ color: '#1C1C1E' }}>{user.email || 'tvoj email'}</strong>
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: '#EEEBE5', borderRadius: '24px', padding: '32px',
          boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
          border: '1px solid rgba(0,0,0,0.06)',
        }}>

          {error && (
            <div style={{
              padding: '12px 16px', borderRadius: '12px', marginBottom: '20px',
              background: '#FFF0ED', color: '#FF3B30', fontSize: '14px',
              border: '1px solid rgba(255,59,48,0.2)',
            }}>
              ⚠️ {error}
            </div>
          )}

          {/* Code input */}
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginBottom: '24px' }}>
            {code.map((digit, i) => (
              <input
                key={i}
                ref={el => inputRefs.current[i] = el}
                className="code-input"
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={e => handleInput(i, e.target.value)}
                onKeyDown={e => handleKeyDown(i, e)}
                onPaste={handlePaste}
                autoFocus={i === 0}
                style={{
                  width: '48px', height: '60px', borderRadius: '14px',
                  textAlign: 'center', fontSize: '24px', fontWeight: '800',
                  color: '#1C1C1E',
                  background: digit ? '#FFF7ED' : '#E2DDD6',
                  border: digit
                    ? '2px solid #FF6B35'
                    : '2px solid rgba(0,0,0,0.08)',
                  transition: 'all 0.15s',
                  caretColor: '#FF6B35',
                  boxShadow: digit ? '0 0 0 3px rgba(255,107,53,0.12)' : 'none',
                }}
              />
            ))}
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={code.join('').length !== 6 || loading}
            style={{
              width: '100%', padding: '14px', borderRadius: '14px', border: 'none',
              background: code.join('').length === 6
                ? 'linear-gradient(135deg, #FF6B35, #FFB800)'
                : '#D8D4CC',
              color: code.join('').length === 6 ? 'white' : '#A0A0A0',
              fontSize: '15px', fontWeight: '800', cursor: code.join('').length === 6 ? 'pointer' : 'not-allowed',
              marginBottom: '16px',
              boxShadow: code.join('').length === 6 ? '0 4px 16px rgba(255,107,53,0.3)' : 'none',
              transition: 'all 0.2s',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            }}>
            {loading ? (
              <>
                <div style={{
                  width: '16px', height: '16px', borderRadius: '50%',
                  border: '2px solid white', borderTopColor: 'transparent',
                  animation: 'spin 0.8s linear infinite',
                }} />
                Provjeravam...
              </>
            ) : (
              'Verifikuj nalog →'
            )}
          </button>

          {/* Resend */}
          <div style={{ textAlign: 'center' }}>
            {canResend ? (
              <button
                onClick={handleResend}
                disabled={resending}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: '#FF6B35', fontSize: '14px', fontWeight: '700',
                  opacity: resending ? 0.6 : 1,
                }}>
                {resending ? 'Šaljem...' : '📧 Pošalji novi kod'}
              </button>
            ) : (
              <p style={{ color: '#9A9690', fontSize: '13px' }}>
                Novi kod možeš zatražiti za{' '}
                <strong style={{ color: '#FF6B35' }}>{countdown}s</strong>
              </p>
            )}
          </div>
        </div>

        {/* Skip – za development */}
        <div style={{ textAlign: 'center', marginTop: '16px' }}>
          <button
            onClick={() => navigate('/dashboard')}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: '#9A9690', fontSize: '13px',
            }}>
            Preskoči za sada →
          </button>
        </div>
      </div>
    </div>
  )
}