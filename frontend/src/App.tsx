function App() {
  return (
    <div style={{ textAlign: 'center', padding: '50px', fontFamily: 'sans-serif' }}>
      <h1 style={{ color: '#3b82f6' }}>🚗 Auto Wash Manager</h1>
      <p>系统已启动！</p>
      <button 
        onClick={() => {
          localStorage.setItem('token', 'test');
          alert('登录成功！');
          window.location.reload();
        }}
        style={{ padding: '10px 20px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', marginTop: '20px' }}
      >
        点击登录
      </button>
    </div>
  );
}

export default App;
