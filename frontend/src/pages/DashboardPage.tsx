import { LayoutDashboard, ShoppingBag, Users, TrendingUp } from 'lucide-react';

export default function DashboardPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">仪表盘</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">今日订单</p>
              <p className="text-2xl font-bold text-gray-800">0</p>
            </div>
            <ShoppingBag className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">今日收入</p>
              <p className="text-2xl font-bold text-green-600">SAR 0</p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-500" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">总客户</p>
              <p className="text-2xl font-bold text-gray-800">0</p>
            </div>
            <Users className="w-8 h-8 text-purple-500" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">本月收入</p>
              <p className="text-2xl font-bold text-orange-600">SAR 0</p>
            </div>
            <LayoutDashboard className="w-8 h-8 text-orange-500" />
          </div>
        </div>
      </div>
    </div>
  );
}
