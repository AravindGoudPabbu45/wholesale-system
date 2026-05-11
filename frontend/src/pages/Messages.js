import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { getContacts, getConversation, sendMessage, markAsRead, getBranches } from '../services/api';
import { FiSend, FiMessageSquare, FiFilter, FiCheckSquare, FiSquare, FiUsers } from 'react-icons/fi';
import { useToast } from '../context/ToastContext';

const Messages = () => {
    const { user } = useAuth();
    const { showToast } = useToast() || {};
    const [contacts, setContacts] = useState([]);
    const [branches, setBranches] = useState([]);
    
    // Selection for single chat
    const [selectedContact, setSelectedContact] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    
    // Bulk messaging mode
    const [isBulkMode, setIsBulkMode] = useState(false);
    const [bulkSelected, setBulkSelected] = useState(new Set());
    const [bulkMessage, setBulkMessage] = useState('');
    
    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [branchFilter, setBranchFilter] = useState('');
    
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);

    useEffect(() => { fetchContacts(); fetchBranches(); }, []);
    useEffect(() => { 
        if (selectedContact && !isBulkMode) fetchMessages(selectedContact.id); 
    }, [selectedContact, isBulkMode]);

    const fetchBranches = async () => {
        try {
            const res = await getBranches();
            setBranches(res.data.filter(b => b.isActive));
        } catch (e) { }
    };

    const fetchContacts = async () => { 
        try { 
            const res = await getContacts(); 
            setContacts(res.data); 
        } catch (e) { } 
        setLoading(false); 
    };

    const fetchMessages = async (contactId) => {
        try {
            const res = await getConversation(contactId);
            setMessages(res.data);
            await markAsRead(contactId);
        } catch (e) { }
    };

    // Derived filtered contacts
    const filteredContacts = useMemo(() => {
        return contacts.filter(c => {
            const matchesSearch = c.fullName.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesRole = roleFilter ? c.role === roleFilter : true;
            const matchesBranch = branchFilter ? String(c.branchId) === String(branchFilter) : true;
            return matchesSearch && matchesRole && matchesBranch;
        });
    }, [contacts, searchTerm, roleFilter, branchFilter]);

    // Unique roles for dropdown
    const availableRoles = useMemo(() => [...new Set(contacts.map(c => c.role))], [contacts]);

    const handleSendSingle = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedContact) return;
        setSending(true);
        try {
            await sendMessage({ receiverId: selectedContact.id, content: newMessage });
            setNewMessage('');
            fetchMessages(selectedContact.id);
        } catch (e) { 
            if (showToast) showToast('Failed to send message', 'error');
            else alert('Failed to send'); 
        }
        setSending(false);
    };

    const handleSendBulk = async (e) => {
        e.preventDefault();
        if (!bulkMessage.trim() || bulkSelected.size === 0) return;
        setSending(true);
        try {
            const promises = Array.from(bulkSelected).map(id => 
                sendMessage({ receiverId: id, content: bulkMessage })
            );
            await Promise.allSettled(promises);
            setBulkMessage('');
            setBulkSelected(new Set());
            if (showToast) showToast(`Message sent to ${promises.length} users!`, 'success');
            else alert(`Sent to ${promises.length} users`);
            setIsBulkMode(false);
        } catch (e) {
            if (showToast) showToast('Failed to send bulk messages', 'error');
        }
        setSending(false);
    };

    const toggleBulkSelection = (id) => {
        setBulkSelected(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const handleSelectAll = () => {
        if (bulkSelected.size === filteredContacts.length) {
            setBulkSelected(new Set()); // deselect all
        } else {
            setBulkSelected(new Set(filteredContacts.map(c => c.id))); // select all
        }
    };

    if (loading) return <div className="loading">Loading messages...</div>;

    return (
        <div>
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h1>Messages</h1>
                {(user.role === 'SUPER_ADMIN' || user.role === 'BRANCH_ADMIN') && (
                    <button 
                        className={`btn ${isBulkMode ? 'btn-primary' : 'btn-secondary'}`} 
                        onClick={() => {
                            setIsBulkMode(!isBulkMode);
                            if (!isBulkMode) setSelectedContact(null);
                        }}
                    >
                        <FiUsers style={{ marginRight: '8px' }} />
                        {isBulkMode ? 'Exit Bulk Messaging' : 'Bulk Messaging'}
                    </button>
                )}
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 320px) 1fr', gap: '20px', height: 'calc(100vh - 180px)' }}>
                {/* Contacts Panel */}
                <div className="card" style={{ marginBottom: 0, display: 'flex', flexDirection: 'column', padding: '12px', overflow: 'hidden' }}>
                    <div style={{ padding: '8px', borderBottom: '1px solid #2a2d3e', marginBottom: '8px' }}>
                        <input 
                            className="form-input" 
                            placeholder="Search contacts..." 
                            value={searchTerm} 
                            onChange={e => setSearchTerm(e.target.value)}
                            style={{ width: '100%', marginBottom: '8px' }}
                        />
                        <select 
                            className="form-input" 
                            value={branchFilter} 
                            onChange={e => setBranchFilter(e.target.value)}
                            style={{ width: '100%', marginBottom: '8px' }}
                        >
                            <option value="">All Branches</option>
                            {branches.map(b => (
                                <option key={b.id} value={b.id}>{b.name}</option>
                            ))}
                        </select>
                        <select 
                            className="form-input" 
                            value={roleFilter} 
                            onChange={e => setRoleFilter(e.target.value)}
                            style={{ width: '100%' }}
                        >
                            <option value="">All Roles</option>
                            {availableRoles.filter(Boolean).map(r => (
                                <option key={r} value={r}>{r?.replace('_', ' ')}</option>
                            ))}
                        </select>
                    </div>

                    {isBulkMode && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', cursor: 'pointer', background: 'rgba(79,140,255,0.1)', borderRadius: '6px', marginBottom: '8px' }} onClick={handleSelectAll}>
                            <span style={{ fontSize: '14px', fontWeight: 600, color: '#4f8cff' }}>Select All ({filteredContacts.length})</span>
                            {bulkSelected.size > 0 && bulkSelected.size === filteredContacts.length ? (
                                <FiCheckSquare size={18} color="#4f8cff" />
                            ) : (
                                <FiSquare size={18} color="#4f8cff" />
                            )}
                        </div>
                    )}

                    <div style={{ overflow: 'auto', flex: 1, paddingRight: '4px' }}>
                        {filteredContacts.map(c => {
                            const isSelected = isBulkMode ? bulkSelected.has(c.id) : selectedContact?.id === c.id;
                            return (
                                <div key={c.id}
                                    onClick={() => {
                                        if (isBulkMode) toggleBulkSelection(c.id);
                                        else setSelectedContact(c);
                                    }}
                                    style={{
                                        padding: '12px', borderRadius: '8px', cursor: 'pointer', margin: '0 4px 4px 0',
                                        background: isSelected ? 'rgba(79,140,255,0.15)' : 'transparent',
                                        border: isSelected && isBulkMode ? '1px solid rgba(79,140,255,0.5)' : '1px solid transparent',
                                        transition: 'all 0.2s',
                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                                    }}
                                >
                                    <div>
                                        <div style={{ fontWeight: 600, fontSize: '14px' }}>{c.fullName}</div>
                                        <div className="text-muted" style={{ fontSize: '11px' }}>{c.role?.replace('_', ' ')}</div>
                                    </div>
                                    {isBulkMode && (
                                        bulkSelected.has(c.id) ? <FiCheckSquare size={18} color="#4f8cff" /> : <FiSquare size={18} color="#8b8fa3" />
                                    )}
                                </div>
                            );
                        })}
                        {filteredContacts.length === 0 && <div className="empty-state"><p>No contacts found</p></div>}
                    </div>
                </div>

                {/* Chat Area */}
                <div className="card" style={{ marginBottom: 0, display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
                    {isBulkMode ? (
                        <>
                            <div style={{ padding: '20px', borderBottom: '1px solid #2a2d3e', background: '#1c1e2e' }}>
                                <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><FiUsers /> Bulk Messaging Mode</h3>
                                <p className="text-muted" style={{ marginTop: '4px' }}>
                                    Message will be sent to <strong>{bulkSelected.size}</strong> selected contact(s).
                                </p>
                            </div>
                            <div style={{ flex: 1, padding: '20px', display: 'flex', flexDirection: 'column' }}>
                                <textarea 
                                    className="form-input" 
                                    placeholder="Type your broadcast message here..." 
                                    value={bulkMessage} 
                                    onChange={e => setBulkMessage(e.target.value)}
                                    style={{ flex: 1, width: '100%', resize: 'none', padding: '16px', fontSize: '15px' }} 
                                />
                            </div>
                            <div style={{ padding: '16px 20px', borderTop: '1px solid #2a2d3e', display: 'flex', justifyContent: 'flex-end', background: '#1c1e2e' }}>
                                <button className="btn btn-primary" onClick={handleSendBulk} disabled={sending || bulkSelected.size === 0 || !bulkMessage.trim()}>
                                    <FiSend style={{ marginRight: '8px' }} /> {sending ? 'Sending...' : `Broadcast to ${bulkSelected.size} users`}
                                </button>
                            </div>
                        </>
                    ) : selectedContact ? (
                        <>
                            <div style={{ padding: '16px 20px', borderBottom: '1px solid #2a2d3e', background: '#1c1e2e', display: 'flex', alignItems: 'center' }}>
                                <strong>{selectedContact.fullName}</strong>
                                <span className="text-muted" style={{ marginLeft: '12px', fontSize: '12px', padding: '2px 8px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)' }}>
                                    {selectedContact.role?.replace('_', ' ')}
                                </span>
                            </div>
                            <div style={{ flex: 1, overflow: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {messages.length === 0 && <div className="empty-state"><FiMessageSquare size={32} /><p>Start a conversation</p></div>}
                                {messages.map(msg => (
                                    <div key={msg.id} style={{ alignSelf: msg.senderId === user.userId ? 'flex-end' : 'flex-start', maxWidth: '70%' }}>
                                        <div style={{
                                            padding: '10px 14px', borderRadius: '12px', fontSize: '14px',
                                            background: msg.senderId === user.userId ? 'linear-gradient(135deg, #4f8cff, #6366f1)' : '#252840',
                                            color: msg.senderId === user.userId ? 'white' : '#e8eaed',
                                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                        }}>
                                            {msg.content}
                                        </div>
                                        <div className="text-muted" style={{ fontSize: '11px', marginTop: '4px', textAlign: msg.senderId === user.userId ? 'right' : 'left' }}>
                                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <form onSubmit={handleSendSingle} style={{ padding: '12px 16px', borderTop: '1px solid #2a2d3e', display: 'flex', gap: '10px', background: '#1c1e2e' }}>
                                <input className="form-input" placeholder="Type a message..." value={newMessage} onChange={e => setNewMessage(e.target.value)} style={{ flex: 1 }} />
                                <button type="submit" className="btn btn-primary" disabled={sending}><FiSend /></button>
                            </form>
                        </>
                    ) : (
                        <div className="empty-state" style={{ margin: 'auto' }}>
                            <FiMessageSquare size={48} />
                            <p style={{ marginTop: '12px' }}>Select a contact to start chatting</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
export default Messages;
