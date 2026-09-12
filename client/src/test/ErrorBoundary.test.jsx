import { render, screen } from '@testing-library/react'
import ErrorBoundary from '../components/ErrorBoundary'

const Boom = () => {
  throw new Error('boom')
}

describe('ErrorBoundary', () => {
  test('prikazuje djecu kada nema greške', () => {
    render(
      <ErrorBoundary>
        <p>Sadržaj aplikacije</p>
      </ErrorBoundary>
    )
    expect(screen.getByText('Sadržaj aplikacije')).toBeInTheDocument()
  })

  test('prikazuje fallback poruku kada dijete baci grešku', () => {
    // Prigušimo očekivane React error logove u konzoli
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})

    render(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>
    )

    expect(screen.getByText(/Nešto je pošlo po krivu/i)).toBeInTheDocument()
    spy.mockRestore()
  })
})
