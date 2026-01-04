'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getStoredToken, getStoredUser } from '@/lib/api';
import AdminNav from '@/components/AdminNav';

// Advanced Permission Types
interface AdvancedPermission {
    id: string;
    label: string;
    description: string;
    level: 'active' | 'limited' | 'restricted';
}

// Extended Role Definition
interface RoleDefinition {
    id: string;
    title: string;
    color: string;
    permissions: string[];
    description: string;
    advancedPermissions: Record<string, boolean>;
    hierarchy: number;
}

// Assignment Rule Type
interface AssignmentRule {
    id: string;
    name: string;
    conditions: {
        category?: string;
        priority?: string;
        location?: string;
        department?: string;
        isEmergency?: boolean;
    };
    assignTo: string;
    notify?: string[];
    isActive: boolean;
}

// Advanced permissions list
const ADVANCED_PERMISSIONS: AdvancedPermission[] = [
    { id: 'compliance_access', label: 'Compliance Access', description: 'View compliance reports and audits', level: 'limited' },
    { id: 'analytics_access', label: 'Analytics Access', description: 'Access advanced analytics dashboards', level: 'active' },
    { id: 'emergency_override', label: 'Emergency Override', description: 'Override system rules in emergencies', level: 'restricted' },
    { id: 'inter_dept_access', label: 'Inter-Department Access', description: 'Access complaints across departments', level: 'limited' },
    { id: 'audit_log_access', label: 'Audit Log Access', description: 'View system audit logs', level: 'restricted' },
    { id: 'ai_recommendation', label: 'AI Recommendation Access', description: 'View AI suggestions and insights', level: 'active' },
];

// Role definitions with advanced permissions
const initialRoleDefinitions: RoleDefinition[] = [
    {
        id: 'super_admin',
        title: 'Super Admin',
        color: 'purple',
        permissions: ['Full System Access', 'Analytics & AI Insights', 'Role Assignment', 'System Configuration', 'Audit Logs'],
        description: 'Complete administrative control over all portal functions and user management.',
        advancedPermissions: {
            compliance_access: true,
            analytics_access: true,
            emergency_override: true,
            inter_dept_access: true,
            audit_log_access: true,
            ai_recommendation: true,
        },
        hierarchy: 1
    },
    {
        id: 'compliance_manager',
        title: 'Compliance Manager',
        color: 'indigo',
        permissions: ['Read-Only Complaints', 'Flag Violations', 'Request Reassignment', 'Generate Compliance Reports'],
        description: 'Monitors compliance, flags violations, and ensures regulatory adherence.',
        advancedPermissions: {
            compliance_access: true,
            analytics_access: true,
            emergency_override: false,
            inter_dept_access: true,
            audit_log_access: true,
            ai_recommendation: false,
        },
        hierarchy: 2
    },
    {
        id: 'audit_officer',
        title: 'Audit Officer',
        color: 'slate',
        permissions: ['View Audit Trails', 'Generate Audit Reports', 'Access Historical Data', 'Compliance Verification'],
        description: 'Conducts system audits and ensures data integrity and process compliance.',
        advancedPermissions: {
            compliance_access: true,
            analytics_access: false,
            emergency_override: false,
            inter_dept_access: true,
            audit_log_access: true,
            ai_recommendation: false,
        },
        hierarchy: 2
    },
    {
        id: 'complaint_manager',
        title: 'Complaint Manager',
        color: 'blue',
        permissions: ['View All Complaints', 'Update Status', 'Communicate with Users', 'Generate Reports'],
        description: 'Manages day-to-day complaint processing and status updates.',
        advancedPermissions: {
            compliance_access: false,
            analytics_access: true,
            emergency_override: false,
            inter_dept_access: false,
            audit_log_access: false,
            ai_recommendation: true,
        },
        hierarchy: 3
    },
    {
        id: 'field_officer',
        title: 'Field Assignment Officer',
        color: 'green',
        permissions: ['Assign to Local Workers', 'Location-based Routing', 'Department Coordination'],
        description: 'Assigns complaints to field workers based on location and department.',
        advancedPermissions: {
            compliance_access: false,
            analytics_access: false,
            emergency_override: false,
            inter_dept_access: false,
            audit_log_access: false,
            ai_recommendation: true,
        },
        hierarchy: 4
    },
    {
        id: 'priority_officer',
        title: 'Priority Officer',
        color: 'red',
        permissions: ['Access Priority Session', 'Handle HIGH/CRITICAL Cases', 'Emergency Response', 'AI Urgency Insights'],
        description: 'Handles high-priority and emergency cases requiring immediate attention.',
        advancedPermissions: {
            compliance_access: false,
            analytics_access: true,
            emergency_override: true,
            inter_dept_access: true,
            audit_log_access: false,
            ai_recommendation: true,
        },
        hierarchy: 3
    },
    {
        id: 'support_officer',
        title: 'Support & Help Officer',
        color: 'orange',
        permissions: ['Monitor User Issues', 'Error Resolution', 'Admin Help Management', 'Citizen Support'],
        description: 'Handles user-reported issues and provides support for portal-related problems.',
        advancedPermissions: {
            compliance_access: false,
            analytics_access: false,
            emergency_override: false,
            inter_dept_access: false,
            audit_log_access: false,
            ai_recommendation: false,
        },
        hierarchy: 4
    },
    {
        id: 'assessment_officer',
        title: 'Assessment Officer',
        color: 'teal',
        permissions: ['Evaluate Resolution Quality', 'Citizen Feedback Review', 'Performance Assessment'],
        description: 'Assesses quality of resolutions and reviews citizen satisfaction.',
        advancedPermissions: {
            compliance_access: true,
            analytics_access: true,
            emergency_override: false,
            inter_dept_access: false,
            audit_log_access: false,
            ai_recommendation: false,
        },
        hierarchy: 3
    }
];

// Default Assignment Rules
const defaultAssignmentRules: AssignmentRule[] = [
    {
        id: 'rule_1',
        name: 'High Priority Auto-Route',
        conditions: { priority: 'high' },
        assignTo: 'priority_officer',
        notify: ['super_admin'],
        isActive: true
    },
    {
        id: 'rule_2',
        name: 'Emergency Case Handler',
        conditions: { isEmergency: true },
        assignTo: 'priority_officer',
        notify: ['super_admin', 'priority_officer'],
        isActive: true
    },
    {
        id: 'rule_3',
        name: 'Water Issues - Municipal',
        conditions: { category: 'water', department: 'Municipal Corporation' },
        assignTo: 'field_officer',
        isActive: true
    },
    {
        id: 'rule_4',
        name: 'Health & Safety Priority',
        conditions: { category: 'health_safety', priority: 'high' },
        assignTo: 'priority_officer',
        notify: ['compliance_manager'],
        isActive: true
    },
    {
        id: 'rule_5',
        name: 'Road Complaints - PWD',
        conditions: { category: 'road', department: 'Public Works' },
        assignTo: 'field_officer',
        isActive: true
    }
];

// Mock team members
const mockTeamMembers = [
    { id: 'EMP001', name: 'Rajesh Kumar', email: 'rajesh.kumar@gov.in', role: 'super_admin', department: 'IT Administration', status: 'active', lastActive: '2 mins ago' },
    { id: 'EMP002', name: 'Priya Sharma', email: 'priya.sharma@gov.in', role: 'complaint_manager', department: 'Public Works', status: 'active', lastActive: '15 mins ago' },
    { id: 'EMP003', name: 'Arun Patel', email: 'arun.patel@gov.in', role: 'field_officer', department: 'Municipal Services', status: 'active', lastActive: '1 hour ago' },
    { id: 'EMP004', name: 'Lakshmi Devi', email: 'lakshmi.devi@gov.in', role: 'priority_officer', department: 'Emergency Services', status: 'active', lastActive: '5 mins ago' },
    { id: 'EMP005', name: 'Mohammed Ismail', email: 'mohammed.ismail@gov.in', role: 'support_officer', department: 'Citizen Support', status: 'inactive', lastActive: '2 days ago' },
    { id: 'EMP006', name: 'Sunita Reddy', email: 'sunita.reddy@gov.in', role: 'compliance_manager', department: 'Compliance', status: 'active', lastActive: '30 mins ago' },
    { id: 'EMP007', name: 'Vikram Singh', email: 'vikram.singh@gov.in', role: 'audit_officer', department: 'Internal Audit', status: 'active', lastActive: '1 hour ago' },
    { id: 'EMP008', name: 'Kavitha Nair', email: 'kavitha.nair@gov.in', role: 'assessment_officer', department: 'Quality Assurance', status: 'active', lastActive: '45 mins ago' },
];

export default function TeamManagementPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [team, setTeam] = useState(mockTeamMembers);
    const [roles, setRoles] = useState<RoleDefinition[]>(initialRoleDefinitions);
    const [assignmentRules, setAssignmentRules] = useState<AssignmentRule[]>(defaultAssignmentRules);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showRuleModal, setShowRuleModal] = useState(false);
    const [activeTab, setActiveTab] = useState<'roles' | 'members' | 'rules' | 'hierarchy'>('roles');
    const [expandedRole, setExpandedRole] = useState<string | null>(null);
    const [newMember, setNewMember] = useState({ name: '', email: '', role: '', department: '' });
    const [newRule, setNewRule] = useState<Partial<AssignmentRule>>({
        name: '',
        conditions: {},
        assignTo: '',
        notify: [],
        isActive: true
    });

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
        return roles.find(r => r.id === roleId) || roles[0];
    };

    const getRoleColor = (color: string) => {
        const colors: Record<string, { bg: string; text: string; border: string; solid: string }> = {
            purple: { bg: 'bg-purple-50', text: 'text-purple-800', border: 'border-purple-300', solid: '#9333ea' },
            indigo: { bg: 'bg-indigo-50', text: 'text-indigo-800', border: 'border-indigo-300', solid: '#6366f1' },
            slate: { bg: 'bg-slate-50', text: 'text-slate-800', border: 'border-slate-300', solid: '#64748b' },
            blue: { bg: 'bg-blue-50', text: 'text-blue-800', border: 'border-blue-300', solid: '#2563eb' },
            green: { bg: 'bg-green-50', text: 'text-green-800', border: 'border-green-300', solid: '#16a34a' },
            red: { bg: 'bg-red-50', text: 'text-red-800', border: 'border-red-300', solid: '#dc2626' },
            orange: { bg: 'bg-orange-50', text: 'text-orange-800', border: 'border-orange-300', solid: '#ea580c' },
            teal: { bg: 'bg-teal-50', text: 'text-teal-800', border: 'border-teal-300', solid: '#14b8a6' },
        };
        return colors[color] || colors.blue;
    };

    const toggleAdvancedPermission = (roleId: string, permId: string) => {
        setRoles(prev => prev.map(role =>
            role.id === roleId
                ? { ...role, advancedPermissions: { ...role.advancedPermissions, [permId]: !role.advancedPermissions[permId] } }
                : role
        ));
    };

    const toggleRuleStatus = (ruleId: string) => {
        setAssignmentRules(prev => prev.map(rule =>
            rule.id === ruleId ? { ...rule, isActive: !rule.isActive } : rule
        ));
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

    const handleAddRule = () => {
        if (!newRule.name || !newRule.assignTo) return;
        const rule: AssignmentRule = {
            id: `rule_${assignmentRules.length + 1}`,
            name: newRule.name || '',
            conditions: newRule.conditions || {},
            assignTo: newRule.assignTo || '',
            notify: newRule.notify,
            isActive: newRule.isActive ?? true
        };
        setAssignmentRules([...assignmentRules, rule]);
        setNewRule({ name: '', conditions: {}, assignTo: '', notify: [], isActive: true });
        setShowRuleModal(false);
    };

    const toggleMemberStatus = (id: string) => {
        setTeam(prev => prev.map(m =>
            m.id === id ? { ...m, status: m.status === 'active' ? 'inactive' : 'active' } : m
        ));
    };

    const getPermissionColor = (enabled: boolean) => {
        return enabled ? 'bg-green-500' : 'bg-gray-300';
    };

    if (loading) return (
        <div className="min-h-screen bg-gray-100 pt-40 flex justify-center">
            <div className="text-2xl font-bold text-[#003366] uppercase tracking-widest">Loading...</div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-100">
            <div className="h-36"></div>

            <div className="max-w-[1400px] mx-auto px-8 pb-20">
                {/* PAGE TITLE */}
                <header className="text-center mb-10 pt-6">
                    <h1 className="text-4xl font-bold text-[#003366] uppercase tracking-wide">
                        TEAM & ROLES MANAGEMENT
                    </h1>
                    <p className="text-xl text-gray-600 mt-3">
                        Advanced Role-Based Access Control & Task Assignment
                    </p>
                    <div className="w-32 h-1 bg-[#003366] mx-auto mt-6"></div>
                </header>

                <AdminNav />

                {/* TAB NAVIGATION */}
                <div className="flex justify-center gap-2 mb-8">
                    {[
                        { id: 'roles', label: '🔐 Roles & Permissions', icon: '🔐' },
                        { id: 'members', label: '👥 Team Members', icon: '👥' },
                        { id: 'rules', label: '⚙️ Assignment Rules', icon: '⚙️' },
                        { id: 'hierarchy', label: '📊 Role Hierarchy', icon: '📊' }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`px-6 py-3 rounded-lg font-bold text-sm uppercase tracking-wide transition-all ${activeTab === tab.id
                                    ? 'bg-[#003366] text-white shadow-lg'
                                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* ROLES & PERMISSIONS TAB */}
                {activeTab === 'roles' && (
                    <section className="bg-white rounded-xl shadow-lg overflow-hidden">
                        <div className="px-10 py-6 bg-gray-50 border-b-2 border-gray-200">
                            <h2 className="text-2xl font-bold text-[#003366] uppercase tracking-wide text-center">
                                Role Definitions & Advanced Permissions
                            </h2>
                            <p className="text-base text-gray-600 text-center mt-2">
                                Configure role-based access control for each position
                            </p>
                        </div>

                        <div className="p-8">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {roles.map(role => {
                                    const colorInfo = getRoleColor(role.color);
                                    const isExpanded = expandedRole === role.id;

                                    return (
                                        <div
                                            key={role.id}
                                            className={`border-2 rounded-xl overflow-hidden transition-all ${colorInfo.border} ${colorInfo.bg}`}
                                        >
                                            {/* Role Header */}
                                            <div
                                                className="p-5 cursor-pointer hover:bg-white/50 transition-colors"
                                                onClick={() => setExpandedRole(isExpanded ? null : role.id)}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div
                                                            className="w-10 h-10 rounded-full flex items-center justify-center"
                                                            style={{ backgroundColor: colorInfo.solid }}
                                                        >
                                                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                            </svg>
                                                        </div>
                                                        <div>
                                                            <h3 className="text-lg font-bold text-gray-800">{role.title}</h3>
                                                            <p className="text-xs text-gray-500">Level {role.hierarchy}</p>
                                                        </div>
                                                    </div>
                                                    <span className={`transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                                                        ▼
                                                    </span>
                                                </div>
                                                <p className="text-sm text-gray-600 mt-3">{role.description}</p>

                                                {/* Basic Permissions */}
                                                <div className="mt-3 flex flex-wrap gap-1">
                                                    {role.permissions.slice(0, 3).map(perm => (
                                                        <span key={perm} className="text-xs bg-white px-2 py-1 rounded border border-gray-200 text-gray-600">
                                                            {perm}
                                                        </span>
                                                    ))}
                                                    {role.permissions.length > 3 && (
                                                        <span className="text-xs text-gray-500">+{role.permissions.length - 3} more</span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Advanced Permissions (Expanded) */}
                                            {isExpanded && (
                                                <div className="border-t border-gray-200 bg-white p-5">
                                                    <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4">
                                                        🔒 Advanced Permissions
                                                    </h4>
                                                    <div className="space-y-3">
                                                        {ADVANCED_PERMISSIONS.map(perm => {
                                                            const isEnabled = role.advancedPermissions[perm.id];
                                                            return (
                                                                <div key={perm.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                                                    <div className="flex-1">
                                                                        <p className="font-medium text-gray-800 text-sm">{perm.label}</p>
                                                                        <p className="text-xs text-gray-500">{perm.description}</p>
                                                                    </div>
                                                                    <button
                                                                        onClick={(e) => { e.stopPropagation(); toggleAdvancedPermission(role.id, perm.id); }}
                                                                        className={`relative w-12 h-6 rounded-full transition-colors ${getPermissionColor(isEnabled)}`}
                                                                    >
                                                                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${isEnabled ? 'translate-x-7' : 'translate-x-1'
                                                                            }`}></div>
                                                                    </button>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </section>
                )}

                {/* TEAM MEMBERS TAB */}
                {activeTab === 'members' && (
                    <section className="bg-white rounded-xl shadow-lg overflow-hidden">
                        <div className="px-10 py-6 bg-gray-50 border-b-2 border-gray-200 flex justify-between items-center">
                            <div>
                                <h2 className="text-2xl font-bold text-[#003366] uppercase tracking-wide">
                                    Team Members
                                </h2>
                                <p className="text-base text-gray-600 mt-1">
                                    {team.length} registered officers across {new Set(team.map(t => t.role)).size} roles
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
                                        const colorInfo = getRoleColor(roleInfo.color);
                                        return (
                                            <tr key={member.id} className={`hover:bg-blue-50 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                                                <td className="p-5 font-mono font-bold text-gray-700">{member.id}</td>
                                                <td className="p-5 font-bold text-gray-800">{member.name}</td>
                                                <td className="p-5 text-gray-600">{member.email}</td>
                                                <td className="p-5">
                                                    <span className={`px-3 py-1 rounded text-xs font-bold uppercase border ${colorInfo.bg} ${colorInfo.text} ${colorInfo.border}`}>
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
                )}

                {/* ASSIGNMENT RULES TAB */}
                {activeTab === 'rules' && (
                    <section className="bg-white rounded-xl shadow-lg overflow-hidden">
                        <div className="px-10 py-6 bg-gray-50 border-b-2 border-gray-200 flex justify-between items-center">
                            <div>
                                <h2 className="text-2xl font-bold text-[#003366] uppercase tracking-wide">
                                    Auto-Assignment Rules
                                </h2>
                                <p className="text-base text-gray-600 mt-1">
                                    Configure automatic complaint routing based on conditions
                                </p>
                            </div>
                            <button
                                onClick={() => setShowRuleModal(true)}
                                className="bg-[#003366] text-white px-6 py-3 rounded-lg font-bold uppercase text-sm tracking-wide hover:bg-blue-900 transition-colors flex items-center gap-2"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                                Add Rule
                            </button>
                        </div>

                        <div className="p-8">
                            <div className="space-y-4">
                                {assignmentRules.map(rule => {
                                    const assignedRole = getRoleInfo(rule.assignTo);
                                    return (
                                        <div key={rule.id} className={`border-2 rounded-lg p-5 ${rule.isActive ? 'border-green-300 bg-green-50' : 'border-gray-200 bg-gray-50'}`}>
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <span className={`w-3 h-3 rounded-full ${rule.isActive ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                                                        <h3 className="font-bold text-gray-800">{rule.name}</h3>
                                                        <span className={`px-2 py-0.5 text-xs font-bold uppercase rounded ${rule.isActive ? 'bg-green-200 text-green-800' : 'bg-gray-200 text-gray-600'
                                                            }`}>
                                                            {rule.isActive ? 'Active' : 'Inactive'}
                                                        </span>
                                                    </div>

                                                    <div className="flex flex-wrap gap-2 mb-3">
                                                        <span className="text-sm font-medium text-gray-600">IF</span>
                                                        {rule.conditions.category && (
                                                            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                                                                Category = {rule.conditions.category}
                                                            </span>
                                                        )}
                                                        {rule.conditions.priority && (
                                                            <span className={`px-2 py-1 rounded text-xs font-medium ${rule.conditions.priority === 'high' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                                                                }`}>
                                                                Priority = {rule.conditions.priority.toUpperCase()}
                                                            </span>
                                                        )}
                                                        {rule.conditions.department && (
                                                            <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs font-medium">
                                                                Dept = {rule.conditions.department}
                                                            </span>
                                                        )}
                                                        {rule.conditions.isEmergency && (
                                                            <span className="px-2 py-1 bg-red-200 text-red-800 rounded text-xs font-bold">
                                                                🚨 EMERGENCY
                                                            </span>
                                                        )}
                                                        <span className="text-sm font-medium text-gray-600">→</span>
                                                        <span className="px-2 py-1 bg-gray-800 text-white rounded text-xs font-bold">
                                                            Assign to: {assignedRole.title}
                                                        </span>
                                                    </div>

                                                    {rule.notify && rule.notify.length > 0 && (
                                                        <p className="text-xs text-gray-500">
                                                            📧 Notify: {rule.notify.map(n => getRoleInfo(n).title).join(', ')}
                                                        </p>
                                                    )}
                                                </div>

                                                <button
                                                    onClick={() => toggleRuleStatus(rule.id)}
                                                    className={`px-4 py-2 rounded text-xs font-bold uppercase ${rule.isActive
                                                            ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                                                            : 'bg-green-100 text-green-800 hover:bg-green-200'
                                                        }`}
                                                >
                                                    {rule.isActive ? 'Disable' : 'Enable'}
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </section>
                )}

                {/* ROLE HIERARCHY TAB */}
                {activeTab === 'hierarchy' && (
                    <section className="bg-white rounded-xl shadow-lg overflow-hidden">
                        <div className="px-10 py-6 bg-gray-50 border-b-2 border-gray-200">
                            <h2 className="text-2xl font-bold text-[#003366] uppercase tracking-wide text-center">
                                Role Hierarchy Visualization
                            </h2>
                            <p className="text-base text-gray-600 text-center mt-2">
                                Organizational structure and reporting hierarchy
                            </p>
                        </div>

                        <div className="p-8">
                            <div className="flex flex-col items-center">
                                {/* Level 1 - Super Admin */}
                                <div className="flex justify-center mb-4">
                                    <div className="bg-purple-100 border-2 border-purple-400 rounded-xl p-4 text-center shadow-lg min-w-[200px]">
                                        <div className="w-12 h-12 bg-purple-600 rounded-full mx-auto mb-2 flex items-center justify-center">
                                            <span className="text-white text-xl">👑</span>
                                        </div>
                                        <h3 className="font-bold text-purple-800">Super Admin</h3>
                                        <p className="text-xs text-purple-600 mt-1">Full System Control</p>
                                    </div>
                                </div>

                                {/* Connector Line */}
                                <div className="w-1 h-8 bg-gray-300"></div>
                                <div className="w-[600px] h-1 bg-gray-300"></div>

                                {/* Level 2 - Managers */}
                                <div className="flex justify-center gap-8 mt-4 mb-4">
                                    <div className="flex flex-col items-center">
                                        <div className="w-1 h-4 bg-gray-300"></div>
                                        <div className="bg-indigo-100 border-2 border-indigo-400 rounded-xl p-4 text-center shadow min-w-[160px]">
                                            <div className="w-10 h-10 bg-indigo-600 rounded-full mx-auto mb-2 flex items-center justify-center">
                                                <span className="text-white">📋</span>
                                            </div>
                                            <h3 className="font-bold text-indigo-800 text-sm">Compliance Manager</h3>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-center">
                                        <div className="w-1 h-4 bg-gray-300"></div>
                                        <div className="bg-blue-100 border-2 border-blue-400 rounded-xl p-4 text-center shadow min-w-[160px]">
                                            <div className="w-10 h-10 bg-blue-600 rounded-full mx-auto mb-2 flex items-center justify-center">
                                                <span className="text-white">📁</span>
                                            </div>
                                            <h3 className="font-bold text-blue-800 text-sm">Complaint Manager</h3>
                                        </div>
                                        <div className="w-1 h-4 bg-gray-300"></div>
                                    </div>
                                    <div className="flex flex-col items-center">
                                        <div className="w-1 h-4 bg-gray-300"></div>
                                        <div className="bg-red-100 border-2 border-red-400 rounded-xl p-4 text-center shadow min-w-[160px]">
                                            <div className="w-10 h-10 bg-red-600 rounded-full mx-auto mb-2 flex items-center justify-center">
                                                <span className="text-white">🚨</span>
                                            </div>
                                            <h3 className="font-bold text-red-800 text-sm">Priority Officer</h3>
                                        </div>
                                    </div>
                                </div>

                                {/* Level 3 - Officers */}
                                <div className="flex justify-center gap-6 mt-4">
                                    <div className="bg-slate-100 border-2 border-slate-400 rounded-xl p-3 text-center shadow min-w-[140px]">
                                        <div className="w-8 h-8 bg-slate-600 rounded-full mx-auto mb-2 flex items-center justify-center">
                                            <span className="text-white text-sm">🔍</span>
                                        </div>
                                        <h3 className="font-bold text-slate-800 text-xs">Audit Officer</h3>
                                    </div>
                                    <div className="bg-teal-100 border-2 border-teal-400 rounded-xl p-3 text-center shadow min-w-[140px]">
                                        <div className="w-8 h-8 bg-teal-600 rounded-full mx-auto mb-2 flex items-center justify-center">
                                            <span className="text-white text-sm">⭐</span>
                                        </div>
                                        <h3 className="font-bold text-teal-800 text-xs">Assessment Officer</h3>
                                    </div>
                                    <div className="bg-green-100 border-2 border-green-400 rounded-xl p-3 text-center shadow min-w-[140px]">
                                        <div className="w-8 h-8 bg-green-600 rounded-full mx-auto mb-2 flex items-center justify-center">
                                            <span className="text-white text-sm">📍</span>
                                        </div>
                                        <h3 className="font-bold text-green-800 text-xs">Field Officer</h3>
                                    </div>
                                    <div className="bg-orange-100 border-2 border-orange-400 rounded-xl p-3 text-center shadow min-w-[140px]">
                                        <div className="w-8 h-8 bg-orange-600 rounded-full mx-auto mb-2 flex items-center justify-center">
                                            <span className="text-white text-sm">💬</span>
                                        </div>
                                        <h3 className="font-bold text-orange-800 text-xs">Support Officer</h3>
                                    </div>
                                </div>

                                {/* Legend */}
                                <div className="mt-12 p-6 bg-gray-50 rounded-lg w-full max-w-2xl">
                                    <h4 className="font-bold text-gray-700 mb-4 text-center uppercase tracking-wide">Permission Legend</h4>
                                    <div className="grid grid-cols-3 gap-4 text-sm">
                                        <div className="flex items-center gap-2">
                                            <span className="w-4 h-4 bg-green-500 rounded"></span>
                                            <span>Active - Full Access</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="w-4 h-4 bg-yellow-500 rounded"></span>
                                            <span>Limited - Partial Access</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="w-4 h-4 bg-red-500 rounded"></span>
                                            <span>Restricted - Approval Required</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                )}

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
                                        {roles.map(role => (
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
                                        <option value="Compliance">Compliance</option>
                                        <option value="Internal Audit">Internal Audit</option>
                                        <option value="Quality Assurance">Quality Assurance</option>
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

                {/* ADD RULE MODAL */}
                {showRuleModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowRuleModal(false)}>
                        <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-8" onClick={e => e.stopPropagation()}>
                            <h2 className="text-2xl font-bold text-[#003366] mb-6">Add Assignment Rule</h2>
                            <div className="space-y-5">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Rule Name</label>
                                    <input
                                        type="text"
                                        className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-[#003366] focus:outline-none"
                                        placeholder="e.g., High Priority Health Cases"
                                        value={newRule.name}
                                        onChange={e => setNewRule({ ...newRule, name: e.target.value })}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Category</label>
                                        <select
                                            className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-[#003366] focus:outline-none"
                                            value={newRule.conditions?.category || ''}
                                            onChange={e => setNewRule({ ...newRule, conditions: { ...newRule.conditions, category: e.target.value || undefined } })}
                                        >
                                            <option value="">Any Category</option>
                                            <option value="water">Water</option>
                                            <option value="electricity">Electricity</option>
                                            <option value="road">Road</option>
                                            <option value="sanitation">Sanitation</option>
                                            <option value="health_safety">Health & Safety</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Priority</label>
                                        <select
                                            className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-[#003366] focus:outline-none"
                                            value={newRule.conditions?.priority || ''}
                                            onChange={e => setNewRule({ ...newRule, conditions: { ...newRule.conditions, priority: e.target.value || undefined } })}
                                        >
                                            <option value="">Any Priority</option>
                                            <option value="high">High</option>
                                            <option value="medium">Medium</option>
                                            <option value="low">Low</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Assign To Role</label>
                                    <select
                                        className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-[#003366] focus:outline-none"
                                        value={newRule.assignTo}
                                        onChange={e => setNewRule({ ...newRule, assignTo: e.target.value })}
                                    >
                                        <option value="">-- Select Role --</option>
                                        {roles.map(role => (
                                            <option key={role.id} value={role.id}>{role.title}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        id="emergency"
                                        checked={newRule.conditions?.isEmergency || false}
                                        onChange={e => setNewRule({ ...newRule, conditions: { ...newRule.conditions, isEmergency: e.target.checked || undefined } })}
                                        className="w-4 h-4"
                                    />
                                    <label htmlFor="emergency" className="text-sm font-bold text-red-700">Mark as Emergency Rule</label>
                                </div>
                            </div>
                            <div className="flex justify-end gap-4 mt-8">
                                <button
                                    onClick={() => setShowRuleModal(false)}
                                    className="px-6 py-3 text-gray-600 hover:bg-gray-100 rounded-lg font-bold"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleAddRule}
                                    className="px-8 py-3 bg-[#003366] text-white rounded-lg font-bold hover:bg-blue-900"
                                >
                                    Add Rule
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
