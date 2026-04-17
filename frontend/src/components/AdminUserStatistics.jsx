import React, { useState, useEffect } from 'react';
import { 
  Users, 
  TrendingUp, 
  TrendingDown, 
  ShoppingCart, 
  Clock, 
  AlertTriangle,
  Star,
  Activity
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const AdminUserStatistics = ({ token }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchUserStatistics();
  }, [token]);

  const fetchUserStatistics = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/user-statistics', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Erreur lors du chargement des statistiques');
      }
      
      const data = await response.json();
      setStats(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-slate-200 rounded w-1/3"></div>
          <div className="space-y-3">
            <div className="h-4 bg-slate-200 rounded"></div>
            <div className="h-4 bg-slate-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
        {error}
      </div>
    );
  }

  const mockStats = {
    mostActiveUsers: [
      { name: 'Ahmed Ben Ali', role: 'Artisan', projects: 45, revenue: 12500, lastActive: '2 heures' },
      { name: 'Fatma Trabelsi', role: 'Fournisseur', orders: 89, revenue: 25600, lastActive: '1 heure' },
      { name: 'Mohamed Gharbi', role: 'Prescripteur', requests: 67, spent: 8900, lastActive: '30 min' },
      { name: 'Leila Mansouri', role: 'Artisan', projects: 38, revenue: 9800, lastActive: '4 heures' },
      { name: 'Karim Bouazizi', role: 'Fournisseur', orders: 72, revenue: 18400, lastActive: '1 jour' }
    ],
    inactiveUsers: [
      { name: 'Sami Jebali', role: 'Artisan', lastActive: '15 jours', projects: 3 },
      { name: 'Nadia Khelifi', role: 'Prescripteur', lastActive: '22 jours', requests: 1 },
      { name: 'Hedi Sassi', role: 'Fournisseur', lastActive: '8 jours', orders: 0 },
      { name: 'Rim Chaouch', role: 'Artisan', lastActive: '12 jours', projects: 2 }
    ],
    topBuyers: [
      { name: 'Société BATIMEX', role: 'Prescripteur', totalSpent: 45600, orders: 23 },
      { name: 'Cabinet Arch. Moderne', role: 'Prescripteur', totalSpent: 38900, orders: 18 },
      { name: 'Ali Construction', role: 'Artisan', totalSpent: 28700, orders: 34 },
      { name: 'Entreprise Gharbi', role: 'Artisan', totalSpent: 22100, orders: 28 }
    ],
    projectLeaders: [
      { name: 'Youssef Mechri', role: 'Artisan', projects: 52, completionRate: 96 },
      { name: 'Salma Bouzid', role: 'Artisan', projects: 48, completionRate: 94 },
      { name: 'Tarek Hamdi', role: 'Artisan', projects: 41, completionRate: 89 },
      { name: 'Ines Mejri', role: 'Artisan', projects: 39, completionRate: 92 }
    ],
    activityData: [
      { period: 'Lun', active: 145, inactive: 23 },
      { period: 'Mar', active: 167, inactive: 18 },
      { period: 'Mer', active: 189, inactive: 15 },
      { period: 'Jeu', active: 201, inactive: 12 },
      { period: 'Ven', active: 178, inactive: 19 },
      { period: 'Sam', active: 134, inactive: 28 },
      { period: 'Dim', active: 98, inactive: 35 }
    ]
  };

  const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50">
            <Users className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Statistiques Utilisateurs Détaillées</h2>
            <p className="text-sm text-slate-500">Analyse complète de l'activité et engagement des utilisateurs</p>
          </div>
        </div>
      </div>

      {/* Most Active Users */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="h-5 w-5 text-green-600" />
          <h3 className="text-lg font-semibold text-slate-900">👑 Utilisateurs les Plus Actifs</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-3 px-4 font-medium text-slate-600">Nom</th>
                <th className="text-left py-3 px-4 font-medium text-slate-600">Rôle</th>
                <th className="text-left py-3 px-4 font-medium text-slate-600">Activité</th>
                <th className="text-left py-3 px-4 font-medium text-slate-600">Revenus/Dépenses</th>
                <th className="text-left py-3 px-4 font-medium text-slate-600">Dernière activité</th>
              </tr>
            </thead>
            <tbody>
              {mockStats.mostActiveUsers.map((user, index) => (
                <tr key={index} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-sm font-medium text-blue-600">
                        {user.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <span className="font-medium text-slate-900">{user.name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                      user.role === 'Artisan' ? 'bg-blue-100 text-blue-800' :
                      user.role === 'Fournisseur' ? 'bg-orange-100 text-orange-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-600">
                    {user.projects && `${user.projects} projets`}
                    {user.orders && `${user.orders} commandes`}
                    {user.requests && `${user.requests} demandes`}
                  </td>
                  <td className="py-3 px-4 font-medium text-green-600">
                    {user.revenue && `${user.revenue.toLocaleString()} TND`}
                    {user.spent && `${user.spent.toLocaleString()} TND`}
                  </td>
                  <td className="py-3 px-4 text-slate-500">{user.lastActive}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Grid Layout for Other Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Inactive Users */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="h-5 w-5 text-orange-600" />
            <h3 className="text-lg font-semibold text-slate-900">😴 Utilisateurs Inactifs</h3>
          </div>
          <div className="space-y-3">
            {mockStats.inactiveUsers.map((user, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                <div>
                  <div className="font-medium text-slate-900">{user.name}</div>
                  <div className="text-sm text-slate-500">{user.role}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-orange-600">Inactif {user.lastActive}</div>
                  <div className="text-xs text-slate-500">
                    {user.projects ? `${user.projects} projets` : 
                     user.orders !== undefined ? `${user.orders} commandes` : 
                     `${user.requests} demandes`}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Buyers */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <ShoppingCart className="h-5 w-5 text-purple-600" />
            <h3 className="text-lg font-semibold text-slate-900">💰 Plus Gros Acheteurs</h3>
          </div>
          <div className="space-y-3">
            {mockStats.topBuyers.map((buyer, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                <div>
                  <div className="font-medium text-slate-900">{buyer.name}</div>
                  <div className="text-sm text-slate-500">{buyer.role}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-purple-600">{buyer.totalSpent.toLocaleString()} TND</div>
                  <div className="text-xs text-slate-500">{buyer.orders} commandes</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Project Leaders and Activity Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Project Leaders */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Star className="h-5 w-5 text-yellow-600" />
            <h3 className="text-lg font-semibold text-slate-900">🏆 Leaders de Projets</h3>
          </div>
          <div className="space-y-3">
            {mockStats.projectLeaders.map((leader, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                <div>
                  <div className="font-medium text-slate-900">{leader.name}</div>
                  <div className="text-sm text-slate-500">{leader.projects} projets</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-yellow-600">{leader.completionRate}% réussite</div>
                  <div className="w-16 bg-gray-200 rounded-full h-2 mt-1">
                    <div 
                      className="bg-yellow-600 h-2 rounded-full" 
                      style={{ width: `${leader.completionRate}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Activity Chart */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-slate-900">📊 Activité Hebdomadaire</h3>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mockStats.activityData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="active" fill="#4f46e5" name="Actifs" />
                <Bar dataKey="inactive" fill="#ef4444" name="Inactifs" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminUserStatistics;