import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Login from '../pages/Login'
import { login } from '../api/auth'

// Mockujemo mrežni poziv i socket da test ne dira backend
vi.mock('../api/auth', () => ({ login: vi.fn() }))
vi.mock('../services/socket', () => ({ initSocket: vi.fn() }))

const renderLogin = () =>
  render(
    <MemoryRouter>
      <Login />
    </MemoryRouter>
  )

describe('Login stranica', () => {
  beforeEach(() => vi.clearAllMocks())

  test('prikazuje polja za email i lozinku i dugme za prijavu', () => {
    const { container } = renderLogin()

    expect(container.querySelector('input[name="email"]')).toBeInTheDocument()
    expect(container.querySelector('input[name="password"]')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /prijavi se/i })).toBeInTheDocument()
  })

  test('poziva login() sa unesenim podacima pri slanju forme', async () => {
    login.mockResolvedValue({
      token: 't', refreshToken: 'r', user: { emailVerified: true },
    })

    const { container } = renderLogin()

    fireEvent.change(container.querySelector('input[name="email"]'), {
      target: { name: 'email', value: 'amar@b.com' },
    })
    fireEvent.change(container.querySelector('input[name="password"]'), {
      target: { name: 'password', value: 'pass1234' },
    })
    fireEvent.click(screen.getByRole('button', { name: /prijavi se/i }))

    await waitFor(() =>
      expect(login).toHaveBeenCalledWith({ email: 'amar@b.com', password: 'pass1234' })
    )
  })
})
