import { useState } from 'react';
import toast from 'react-hot-toast';
import { Car } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('admin@autowash.com');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // 模拟登录
    if (email === 'admin@autowash.com' && password === 'admin123') {
      localStorage.setItem('token', 'fake-token');
      localStorage.setItem('user', JSON.stringify({ name: '管理员', role: 'admin' }));
      toast.success('登录成功！');
      window.location.href = '/dashboard';
    } else {
      toast.error('邮箱或密码错误');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
            <Car className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">🚗 Auto Wash Pro</h1>
          <p className="text-gray-500 mt-1">企业级洗车店管理系统</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">邮箱</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">密码</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? '登录中...' : '登录系统'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-500">
          <p>演示账号: admin@autowash.com</p>
          <p>密码: admin123</p>
        </div>
      </div>
    </div>
  );
}
