'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getStoredToken, getStoredUser } from '@/lib/api';
import AdminNav from '@/components/AdminNav';

// Role definitions
const roleDefinitions = [
    {
        id: 'super_admin',
        title: 'Super Admin',
        color: 'purple',
        permissions: ['Full System Access', 'Analytics & AI Insights', 'Role Assignment', 'System Configuration', 'Audit Logs'],
        description: 'Complete administrative control over all portal functions and user management.'
    },
    {
        id: 'complaint_manager',
        title: 'Complaint Manager',
        color: 'blue',
        permissions: ['View All Complaints', 'Update Status', 'Communicate with Users', 'Generate Reports'],
        description: 'Manages day-to-day complaint processing and status updates.'
    },
    {
        id: 'field_officer',
        title: 'Field Assignment Officer',
        color: 'green',
        permissions: ['Assign to Local Workers', 'Location-based Routing', 'Department Coordination'],
        description: 'Assigns complaints to field workers based on location and department.'
    },
    {
        id: 'priority_officer',
        title: 'Priority Officer',
        color: 'red',
        permissions: ['Access Priority Session', 'Handle HIGH/CRITICAL Cases', 'Emergency Response', 'AI Urgency Insights'],
        description: 'Handles high-priority and emergency cases requiring immediate attention.'
    },
    {
        id: 'support_officer',
        title: 'Support & Help Officer',
        color: 'orange',
        permissions: ['Monitor User Issues', 'Error Resolution', 'Admin Help Management', 'Citizen Support'],
        description: 'Handles user-reported issues and provides support for portal-related problems.'
    }
];

// Mock team members
const mockTeamMembers = [
    { id: 'EMP001', name: 'Rajesh Kumar', email: 'rajesh.kumar@gov.in', role: 'super_admin', department: 'IT Administration', status: 'active', lastActive: '2 mins ago' },
    { id: 'EMP002', name: 'Priya Sharma', email: 'priya.sharma@gov.in', role: 'complaint_manager', department: 'Public Works', status: 'active', lastActive: '15 mins ago' },
    { id: 'EMP003', name: 'Arun Patel', email: 'arun.patel@gov.in', role: 'field_officer', department: 'Municipal Services', status: 'active', lastActive: '1 hour ago' },
    { id: 'EMP004', name: 'Lakshmi Devi', email: 'lakshmi.devi@gov.in', role: 'priority_officer', department: 'Emergency Services', status: 'active', lastActive: '5 mins ago' },
    { id: 'EMP005', name: 'Mohammed Ismail', email: 'mohammed.ismail@gov.in', role: 'support_officer', department: 'Citizen Support', status: 'inactive', lastActive: '2 days ago' },
    { id: 'EMP006', name: 'Sunita Reddy', email: 'sunita.reddy@gov.in', role: 'complaint_manager', department: 'Health', status: 'active', lastActive: '30 mins ago' },
];

export default function TeamManagementPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [team, setTeam] = useState(mockTeamMembers);
    const [showAddModal, setShowAddModal] = useState(false);
    const [newMember, setNewMember] = useState({ name: '', email: '', role: '', department: '' });

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        const token = getStoredToken();
        const user = getStoredUser();
        if (!token || user?.role !== 'admin') {
            router.push('/login');
            return;
        }
        setLoading(false);
    };

    const getRoleInfo = (roleId: string) => {
        return roleDefinitions.find(r => r.id === roleId) || roleDefinitions[0];
    };

    const getRoleColor = (color: string) => {
        const colors: Record<string, string> = {
            purple: 'bg-purple-100 text-purple-800 border-purple-300',
            blue: 'bg-blue-100 text-blue-800 border-blue-300',
            green: 'bg-green-100 text-green-800 border-green-300',
            red: 'bg-red-100 text-red-800 border-red-300',
            orange: 'bg-orange-100 text-orange-800 border-orange-300',
        };
        return colors[color] || colors.blue;
    };

    const handleAddMember = () => {
        if (!newMember.name || !newMember.email || !newMember.role) return;

        const member = {
            id: `EMP${String(team.length + 1).padStart(3, '0')}`,
            name: newMember.name,
            email: newMember.email,
            role: newMember.role,
            department: newMember.department || 'General',
            status: 'active',
            lastActive: 'Just now'
        };

        setTeam([...team, member]);
        setNewMember({ name: '', email: '', role: '', department: '' });
        setShowAddModal(false);
    };

    const toggleMemberStatus = (id: string) => {
        setTeam(prev => prev.map(m =>
            m.id === id ? { ...m, status: m.status === 'active' ? 'inactive' : 'active' } : m
        ));
    };

    if (loading) return (
        <div className="min-h-screen bg-gray-100 pt-40 flex justify-center">
            <div className="text-2xl font-bold text-[#003366] uppercase tracking-widest">Loading...</div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-100">
            {/* HEADER OFFSET */}
            <div className="h-36"></div>

            {/* CENTERED CONTAINER */}
            <div className="max-w-[1280px] mx-auto px-8 pb-20">

                {/* PAGE TITLE */}
                <header className="text-center mb-10 pt-6">
                    <h1 className="text-4xl font-bold text-[#003366] uppercase tracking-wide">
                        TEAM & ROLES MANAGEMENT
                    </h1>
                    <p className="text-xl text-gray-600 mt-3">
                        Manage admin team members and their access permissions
                    </p>
                    <div className="w-32 h-1 bg-[#003366] mx-auto mt-6"></div>
                </header>

                {/* NAVIGATION TABS */}
                <AdminNav />

                {/* ROLE DEFINITIONS SECTION */}
                <section className="bg-white rounded-xl shadow-lg mb-12 overflow-hidden">
                    <div className="px-10 py-6 bg-gray-50 border-b-2 border-gray-200">
                        <h2 className="text-2xl font-bold text-[#003366] uppercase tracking-wide text-center">
                            Employee Role Definitions
                        </h2>
                        <p className="text-base text-gray-600 text-center mt-2">
                            Available roles and their permissions in the portal
                        </p>
                    </div>

                    <div className="p-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {roleDefinitions.map(role => (
                                <div key={role.id} className={`border-2 rounded-xl p-6 border-${role.color}-200 bg-${role.color}-50`} style={{
                                    borderColor: role.color === 'purple' ? '#d8b4fe' :
                                        role.color === 'blue' ? '#93c5fd' :
                                            role.color === 'green' ? '#86efac' :
                                                role.color === 'red' ? '#fca5a5' : '#fed7aa',
                                    backgroundColor: role.color === 'purple' ? '#faf5ff' :
                                        role.color === 'blue' ? '#eff6ff' :
                                            role.color === 'green' ? '#f0fdf4' :
                                                role.color === 'red' ? '#fef2f2' : '#fff7ed'
                                }}>
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center`} style={{
                                            backgroundColor: role.color === 'purple' ? '#9333ea' :
                                                role.color === 'blue' ? '#2563eb' :
                                                    role.color === 'green' ? '#16a34a' :
                                                        role.color === 'red' ? '#dc2626' : '#ea580c'
                                        }}>
                                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                            </svg>
                                        </div>
                                        <h3 className="text-lg font-bold text-gray-800">{role.title}</h3>
                                    </div>

                                    <p className="text-sm text-gray-600 mb-4">{role.description}</p>

                                    <div className="space-y-2">
                                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Permissions:</p>
                                        <div className="flex flex-wrap gap-2">
                                            {role.permissions.map(perm => (
                                                <span key={perm} className="text-xs bg-white px-2 py-1 rounded border border-gray-200 text-gray-600">
                                                    {perm}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* TEAM MEMBERS TABLE */}
                <section className="bg-white rounded-xl shadow-lg overflow-hidden">
                    <div className="px-10 py-6 bg-gray-50 border-b-2 border-gray-200 flex justify-between items-center">
                        <div>
                            <h2 className="text-2xl font-bold text-[#003366] uppercase tracking-wide">
                                Team Members
                            </h2>
                            <p className="text-base text-gray-600 mt-1">
                                {team.length} registered officers
                            </p>
                        </div>
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="bg-[#003366] text-white px-6 py-3 rounded-lg font-bold uppercase text-sm tracking-wide hover:bg-blue-900 transition-colors flex items-center gap-2"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            Add Member
                        </button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-100 border-b-2 border-gray-200">
                                <tr>
                                    <th className="p-5 text-sm font-bold text-gray-600 uppercase tracking-wide">ID</th>
                                    <th className="p-5 text-sm font-bold text-gray-600 uppercase tracking-wide">Name</th>
                                    <th className="p-5 text-sm font-bold text-gray-600 uppercase tracking-wide">Email</th>
                                    <th className="p-5 text-sm font-bold text-gray-600 uppercase tracking-wide">Role</th>
                                    <th className="p-5 text-sm font-bold text-gray-600 uppercase tracking-wide">Department</th>
                                    <th className="p-5 text-sm font-bold text-gray-600 uppercase tracking-wide">Status</th>
                                    <th className="p-5 text-sm font-bold text-gray-600 uppercase tracking-wide">Last Active</th>
                                    <th className="p-5 text-sm font-bold text-gray-600 uppercase tracking-wide text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {team.map((member, idx) => {
                                    const roleInfo = getRoleInfo(member.role);
                                    return (
                                        <tr key={member.id} className={`hover:bg-blue-50 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                                            <td className="p-5 font-mono font-bold text-gray-700">{member.id}</td>
                                            <td className="p-5 font-bold text-gray-800">{member.name}</td>
                                            <td className="p-5 text-gray-600">{member.email}</td>
                                            <td className="p-5">
                                                <span className={`px-3 py-1 rounded text-xs font-bold uppercase border ${getRoleColor(roleInfo.color)}`}>
                                                    {roleInfo.title}
                                                </span>
                                            </td>
                                            <td className="p-5 text-gray-600">{member.department}</td>
                                            <td className="p-5">
                                                <span className={`px-3 py-1 rounded text-xs font-bold uppercase ${member.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-600'
                                                    }`}>
                                                    {member.status}
                                                </span>
                                            </td>
                                            <td className="p-5 text-gray-500 text-sm">{member.lastActive}</td>
                                            <td className="p-5 text-center">
                                                <button
                                                    onClick={() => toggleMemberStatus(member.id)}
                                                    className={`px-4 py-2 rounded text-xs font-bold uppercase ${member.status === 'active'
                                                            ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                                            : 'bg-green-600 text-white hover:bg-green-700'
                                                        }`}
                                                >
                                                    {member.status === 'active' ? 'Deactivate' : 'Activate'}
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* ADD MEMBER MODAL */}
                {showAddModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowAddModal(false)}>
                        <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-8" onClick={e => e.stopPropagation()}>
                            <h2 className="text-2xl font-bold text-[#003366] mb-6">Add New Team Member</h2>

                            <div className="space-y-5">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Full Name</label>
                                    <input
                                        type="text"
                                        className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-[#003366] focus:outline-none"
                                        placeholder="Enter full name"
                                        value={newMember.name}
                                        onChange={e => setNewMember({ ...newMember, name: e.target.value })}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Email Address</label>
                                    <input
                                        type="email"
                                        className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-[#003366] focus:outline-none"
                                        placeholder="Enter email address"
                                        value={newMember.email}
                                        onChange={e => setNewMember({ ...newMember, email: e.target.value })}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Assign Role</label>
                                    <select
                                        className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-[#003366] focus:outline-none"
                                        value={newMember.role}
                                        onChange={e => setNewMember({ ...newMember, role: e.target.value })}
                                    >
                                        <option value="">-- Select Role --</option>
                                        {roleDefinitions.map(role => (
                                            <option key={role.id} value={role.id}>{role.title}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Department</label>
                                    <select
                                        className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-[#003366] focus:outline-none"
                                        value={newMember.department}
                                        onChange={e => setNewMember({ ...newMember, department: e.target.value })}
                                    >
                                        <option value="">-- Select Department --</option>
                                        <option value="IT Administration">IT Administration</option>
                                        <option value="Public Works">Public Works</option>
                                        <option value="Health">Health</option>
                                        <option value="Education">Education</option>
                                        <option value="Municipal Services">Municipal Services</option>
                                        <option value="Emergency Services">Emergency Services</option>
                                        <option value="Citizen Support">Citizen Support</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex justify-end gap-4 mt-8">
                                <button
                                    onClick={() => setShowAddModal(false)}
                                    className="px-6 py-3 text-gray-600 hover:bg-gray-100 rounded-lg font-bold"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleAddMember}
                                    className="px-8 py-3 bg-[#003366] text-white rounded-lg font-bold hover:bg-blue-900"
                                >
                                    Add Member
                                </button>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}
