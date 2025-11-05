"use client";
import React from 'react';
import { Protected } from '@/components/shadcn/protected';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/shadcn/button';
import Link from 'next/link';

export default function DashboardPage() {
  const { decoded, logout } = useAuth();

  return (
    <Protected fallback={<div className="p-8 text-center text-[#666666]">Please sign in to view the dashboard.</div>}>
    <div className="space-y-10">
      {/* Header Section */}
      <div className="bg-white border border-[#EEEEEE] rounded-xl p-8 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-[#1A1A1A]">Welcome to Dashboard</h1>
            <p className="mt-2 text-[#666666]">Manage your salary slips and employee records</p>
          </div>
          <Button variant="outline" onClick={logout} className="px-6">Logout</Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="px-4 py-3 bg-[#FFF0F4] text-[#FF3366] rounded-lg flex items-center justify-between">
            <span className="font-medium">Role</span>
            <span>{decoded?.is_manager ? 'Manager' : 'Employee'}</span>
          </div>
          <div className="px-4 py-3 bg-[#F5F5F5] text-[#1A1A1A] rounded-lg flex items-center justify-between">
            <span className="font-medium">Access Level</span>
            <span>{decoded?.is_manager ? 'Full Access' : 'Limited'}</span>
          </div>
          <div className="px-4 py-3 bg-[#F5F5F5] text-[#1A1A1A] rounded-lg flex items-center justify-between">
            <span className="font-medium">Status</span>
            <span className="text-[#00B67A]">Active</span>
          </div>
        </div>
      </div>

      {/* Quick Actions Section */}
      <div className="space-y-6">
        <h2 className="text-xl font-medium text-[#1A1A1A]">Quick Actions</h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <Link 
            href="/employees" 
            className="group rounded-xl bg-white p-6 shadow-sm hover:shadow-md border-2 border-[#EEEEEE] hover:border-[#FF3366] transition-all duration-200"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-[#FFF0F4] flex items-center justify-center">
                <svg className="w-6 h-6 text-[#FF3366]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-medium text-[#1A1A1A] group-hover:text-[#FF3366] transition-colors">Employees</h2>
                <p className="mt-1 text-sm text-[#666666]">Manage employee records</p>
              </div>
            </div>
            <div className="mt-4 flex items-center text-[#FF3366] text-sm font-medium">
              View Employees
              <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Link>

          <Link
            href="/reports"
            className={`group rounded-xl bg-white p-6 shadow-sm border-2 border-[#EEEEEE] transition-all duration-200 
              ${decoded?.is_manager ? 'hover:shadow-md hover:border-[#FF3366]' : 'opacity-80 cursor-not-allowed'}`}
            aria-disabled={decoded?.is_manager ? 'false' : 'true'}
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-[#F5F5F5] flex items-center justify-center">
                <svg className="w-6 h-6 text-[#1A1A1A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-medium text-[#1A1A1A] group-hover:text-[#FF3366] transition-colors flex items-center gap-2">
                  Reports {!decoded?.is_manager && <span className="text-xs font-normal text-[#666666] px-2 py-1 rounded-full bg-[#F5F5F5]">View Only</span>}
                </h2>
                <p className="mt-1 text-sm text-[#666666]">Generate and send salary documents</p>
              </div>
            </div>
            <div className="mt-4 flex items-center text-[#1A1A1A] text-sm font-medium group-hover:text-[#FF3366] transition-colors">
              {decoded?.is_manager ? 'Manage Reports' : 'View Reports'}
              <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </div>
            {!decoded?.is_manager && (
              <p className="mt-4 text-xs text-[#666666] p-2 rounded bg-[#F5F5F5]">
                Manager role required for full access
              </p>
            )}
          </Link>

          {/* Quick Access Card */}
          <div className="rounded-xl bg-gradient-to-br from-[#FF3366] to-[#FF1F55] p-6 text-white shadow-sm">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-medium">Quick Access</h2>
                <p className="mt-1 text-sm text-white/80">Frequently used actions</p>
              </div>
            </div>
            <div className="mt-6 space-y-3">
              <Button variant="secondary" className="w-full bg-white/10 hover:bg-white/20 text-white border-0">
                View My Profile
              </Button>
              {decoded?.is_manager && (
                <Button variant="secondary" className="w-full bg-white/10 hover:bg-white/20 text-white border-0">
                  Generate Reports
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Activity Stats Section */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-[#EEEEEE] rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-medium text-[#1A1A1A] mb-4">Recent Activity</h3>
          <div className="space-y-4">
            {[
              { action: 'Logged in', time: '2 minutes ago', icon: '🔐' },
              { action: 'Viewed reports', time: '1 hour ago', icon: '📊' },
              { action: 'Updated profile', time: 'Yesterday', icon: '👤' },
            ].map((activity, index) => (
              <div key={index} className="flex items-center gap-3 text-sm">
                <span className="text-lg">{activity.icon}</span>
                <div className="flex-1">
                  <p className="text-[#1A1A1A]">{activity.action}</p>
                  <p className="text-[#666666] text-xs">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border border-[#EEEEEE] rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-medium text-[#1A1A1A] mb-4">System Status</h3>
          <div className="space-y-4">
            {[
              { label: 'System', status: 'Operational', color: '#00B67A' },
              { label: 'Database', status: 'Active', color: '#00B67A' },
              { label: 'API', status: 'Running', color: '#00B67A' },
            ].map((item, index) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <span className="text-[#666666]">{item.label}</span>
                <span className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full`} style={{ backgroundColor: item.color }}></span>
                  <span className="text-[#1A1A1A]">{item.status}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
    </Protected>
  );
}
