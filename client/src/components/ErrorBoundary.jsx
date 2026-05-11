import { Component } from 'react'

export default class ErrorBoundary extends Component {
  state = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center" style={{ background: '#F5F5F0' }}>
          <div className="text-center p-8 rounded-2xl" style={{ background: 'white', border: '1px solid #E5E5EA' }}>
            <div className="text-4xl mb-4">⚠️</div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Nešto je pošlo po krivu</h2>
            <p className="text-gray-500 mb-6">Došlo je do neočekivane greške.</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2.5 rounded-xl text-white font-semibold text-sm"
              style={{ background: 'linear-gradient(135deg, #FF6B35, #FFB800)' }}
            >
              Osvježi stranicu
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}