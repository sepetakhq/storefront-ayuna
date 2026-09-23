import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <main style={{ padding: '96px var(--ay-gutter) 24px' }}>
      <div style={{ maxWidth: 560, margin: '0 auto', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
        <div aria-hidden="true" style={{ fontSize: 72, fontWeight: 800, lineHeight: 1, color: 'var(--ay-pink)', letterSpacing: '-0.04em' }}>
          404
        </div>
        <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, letterSpacing: '-0.02em' }}>Halaman tidak ditemukan</h1>
        <p style={{ margin: 0, fontSize: 16, lineHeight: 1.6, color: 'var(--ay-body)' }}>Tautannya mungkin sudah berubah. Mulai lagi dari beranda.</p>
        <Link to="/" className="ay-btn ay-btn-primary" style={{ marginTop: 8 }}>
          Kembali ke beranda
        </Link>
      </div>
    </main>
  );
}
