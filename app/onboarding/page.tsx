export default function Onboarding() {
    return (
      <main
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#f9fafb',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            background: '#fff',
            padding: '2rem 3rem',
            borderRadius: '1rem',
            boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
            textAlign: 'center',
          }}
        >
          <h1>Hello, World! 👋</h1>
          <p>Welcome to the onboarding page.</p>
        </div>
      </main>
    );
  }
  