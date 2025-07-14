'use client'

import { motion } from 'framer-motion'
import { Users, UserCheck, UserX, Wrench, Sparkles, Shield, Crown } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/Card'
import { StaffStats } from '@/types/staff'

interface StaffStatsCardsProps {
  stats: StaffStats
}

export default function StaffStatsCards({ stats }: StaffStatsCardsProps) {
  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return Crown
      case 'supervisor': return Shield
      case 'maintenance': return Wrench
      case 'cleaner': return Sparkles
      default: return Users
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'text-purple-400'
      case 'supervisor': return 'text-blue-400'
      case 'maintenance': return 'text-orange-400'
      case 'cleaner': return 'text-green-400'
      default: return 'text-gray-400'
    }
  }

  const statsCards = [
    {
      title: 'Total Staff',
      value: stats.total,
      icon: Users,
      color: 'text-white',
      bgColor: 'bg-neutral-800',
      description: 'All team members'
    },
    {
      title: 'Active',
      value: stats.active,
      icon: UserCheck,
      color: 'text-green-400',
      bgColor: 'bg-green-500/10',
      description: 'Currently working'
    },
    {
      title: 'Inactive',
      value: stats.inactive,
      icon: UserX,
      color: 'text-gray-400',
      bgColor: 'bg-gray-500/10',
      description: 'Not currently active'
    }
  ]

  const roleCards = Object.entries(stats.byRole).map(([role, count]) => ({
    title: role.charAt(0).toUpperCase() + role.slice(1),
    value: count,
    icon: getRoleIcon(role),
    color: getRoleColor(role),
    bgColor: 'bg-neutral-800',
    description: `${role} staff`
  }))

  return (
    <div className="mb-8 space-y-6">
      {/* Main Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        {statsCards.map((stat, index) => {
          const Icon = stat.icon
          return (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + index * 0.05 }}
            >
              <Card className={`${stat.bgColor} border-neutral-800 hover:border-neutral-700 transition-colors`}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-400 mb-1">
                        {stat.title}
                      </p>
                      <p className={`text-3xl font-bold ${stat.color}`}>
                        {stat.value}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {stat.description}
                      </p>
                    </div>
                    <div className={`p-3 rounded-lg bg-neutral-900/50`}>
                      <Icon className={`h-6 w-6 ${stat.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </motion.div>

      {/* Role Breakdown */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Users className="h-5 w-5" />
          Staff by Role
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {roleCards.map((role, index) => {
            const Icon = role.icon
            return (
              <motion.div
                key={role.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + index * 0.05 }}
              >
                <Card className="bg-neutral-800 border-neutral-700 hover:border-neutral-600 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-400 mb-1">
                          {role.title}
                        </p>
                        <p className={`text-2xl font-bold ${role.color}`}>
                          {role.value}
                        </p>
                      </div>
                      <div className="p-2 rounded-lg bg-neutral-900/50">
                        <Icon className={`h-5 w-5 ${role.color}`} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>
      </motion.div>

      {/* Activity Summary */}
      {stats.total > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-neutral-800 border-neutral-700">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Team Overview</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Active Rate</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 bg-neutral-700 rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${stats.total > 0 ? (stats.active / stats.total) * 100 : 0}%` }}
                      />
                    </div>
                    <span className="text-white font-medium">
                      {stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : 0}%
                    </span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-neutral-700">
                  {Object.entries(stats.byRole).map(([role, count]) => {
                    const percentage = stats.total > 0 ? (count / stats.total) * 100 : 0
                    return (
                      <div key={role} className="text-center">
                        <p className="text-xs text-gray-400 mb-1">
                          {role.charAt(0).toUpperCase() + role.slice(1)}
                        </p>
                        <p className="text-sm font-medium text-white">
                          {percentage.toFixed(0)}%
                        </p>
                      </div>
                    )
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  )
}
