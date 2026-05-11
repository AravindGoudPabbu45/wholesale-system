import React, { useState, useMemo, useCallback } from 'react';
import { FiSearch, FiChevronLeft, FiChevronRight, FiColumns, FiCheck } from 'react-icons/fi';

/**
 * Advanced reusable DataTable component with:
 * - Server/client-side pagination
 * - Column toggling
 * - Multi-row selection for bulk actions
 * - Search filtering
 * - Dynamic sorting
 *
 * Props:
 *   columns: [{ key, label, sortable?, render?, width? }]
 *   data: array of row objects
 *   pageSize: number (default 15)
 *   selectable: boolean - enable multi-select
 *   onBulkAction: (selectedRows) => void
 *   bulkActionLabel: string
 *   searchable: boolean
 *   searchPlaceholder: string
 */
const DataTable = ({
    columns: allColumns = [],
    data = [],
    pageSize: defaultPageSize = 15,
    selectable = false,
    onBulkAction,
    bulkActionLabel = 'Bulk Action',
    searchable = true,
    searchPlaceholder = 'Search...',
    emptyIcon = '📭',
    emptyMessage = 'No data found'
}) => {
    const [page, setPage] = useState(0);
    const [sortKey, setSortKey] = useState(null);
    const [sortDir, setSortDir] = useState('asc');
    const [search, setSearch] = useState('');
    const [selected, setSelected] = useState(new Set());
    const [hiddenCols, setHiddenCols] = useState(new Set());
    const [showColMenu, setShowColMenu] = useState(false);

    const pageSize = defaultPageSize;

    const columns = allColumns.filter(c => !hiddenCols.has(c.key));

    // Search filter
    const filtered = useMemo(() => {
        if (!search.trim()) return data;
        const q = search.toLowerCase();
        return data.filter(row =>
            allColumns.some(col => {
                const val = row[col.key];
                return val != null && String(val).toLowerCase().includes(q);
            })
        );
    }, [data, search, allColumns]);

    // Sort
    const sorted = useMemo(() => {
        if (!sortKey) return filtered;
        return [...filtered].sort((a, b) => {
            const av = a[sortKey] ?? '';
            const bv = b[sortKey] ?? '';
            const cmp = typeof av === 'number' ? av - bv : String(av).localeCompare(String(bv));
            return sortDir === 'asc' ? cmp : -cmp;
        });
    }, [filtered, sortKey, sortDir]);

    // Paginate
    const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
    const pageData = sorted.slice(page * pageSize, (page + 1) * pageSize);

    const handleSort = (key) => {
        if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
        else { setSortKey(key); setSortDir('asc'); }
    };

    const toggleSelect = (idx) => {
        setSelected(prev => {
            const next = new Set(prev);
            if (next.has(idx)) next.delete(idx);
            else next.add(idx);
            return next;
        });
    };

    const toggleAll = () => {
        if (selected.size === pageData.length) setSelected(new Set());
        else setSelected(new Set(pageData.map((_, i) => page * pageSize + i)));
    };

    const toggleColumn = (key) => {
        setHiddenCols(prev => {
            const next = new Set(prev);
            if (next.has(key)) next.delete(key);
            else next.add(key);
            return next;
        });
    };

    return (
        <div>
            {/* Toolbar */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                {searchable && (
                    <div style={{ position: 'relative', flex: '1 1 240px', maxWidth: '320px' }}>
                        <FiSearch style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#8b8fa3' }} />
                        <input
                            className="form-input"
                            style={{ paddingLeft: '36px', width: '100%' }}
                            placeholder={searchPlaceholder}
                            value={search}
                            onChange={e => { setSearch(e.target.value); setPage(0); }}
                        />
                    </div>
                )}

                {/* Column toggle */}
                <div style={{ position: 'relative' }}>
                    <button className="btn btn-secondary btn-sm" onClick={() => setShowColMenu(!showColMenu)}
                        style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <FiColumns /> Columns
                    </button>
                    {showColMenu && (
                        <div style={{
                            position: 'absolute', right: 0, top: '100%', marginTop: '4px', zIndex: 100,
                            background: '#1e2035', border: '1px solid #2a2d3e', borderRadius: '10px',
                            padding: '8px 0', minWidth: '180px', boxShadow: '0 8px 24px rgba(0,0,0,0.4)'
                        }}>
                            {allColumns.map(col => (
                                <button key={col.key} onClick={() => toggleColumn(col.key)}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '8px', width: '100%',
                                        padding: '8px 16px', border: 'none', background: 'transparent',
                                        color: hiddenCols.has(col.key) ? '#555' : '#fff', cursor: 'pointer',
                                        fontSize: '0.85rem', textAlign: 'left'
                                    }}>
                                    {!hiddenCols.has(col.key) && <FiCheck style={{ color: '#818cf8' }} />}
                                    {hiddenCols.has(col.key) && <span style={{ width: '16px' }}> </span>}
                                    {col.label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Bulk action */}
                {selectable && selected.size > 0 && onBulkAction && (
                    <button className="btn btn-primary btn-sm"
                        onClick={() => { onBulkAction(Array.from(selected).map(i => data[i])); setSelected(new Set()); }}>
                        {bulkActionLabel} ({selected.size})
                    </button>
                )}

                <div style={{ flex: 1 }} />
                <span style={{ color: '#8b8fa3', fontSize: '0.82rem' }}>
                    {sorted.length} total · Page {page + 1}/{totalPages}
                </span>
            </div>

            {/* Table */}
            <div className="card" style={{ padding: 0, overflow: 'auto' }}>
                <table className="table">
                    <thead>
                        <tr>
                            {selectable && (
                                <th style={{ width: '40px' }}>
                                    <input type="checkbox"
                                        checked={selected.size > 0 && selected.size === pageData.length}
                                        onChange={toggleAll} />
                                </th>
                            )}
                            {columns.map(col => (
                                <th key={col.key} style={{ cursor: col.sortable !== false ? 'pointer' : 'default', width: col.width }}
                                    onClick={() => col.sortable !== false && handleSort(col.key)}>
                                    {col.label}
                                    {sortKey === col.key && (
                                        <span style={{ marginLeft: '4px', fontSize: '0.7rem' }}>
                                            {sortDir === 'asc' ? '▲' : '▼'}
                                        </span>
                                    )}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {pageData.map((row, idx) => {
                            const globalIdx = page * pageSize + idx;
                            return (
                                <tr key={globalIdx} style={{ background: selected.has(globalIdx) ? '#1a1c2e' : 'transparent' }}>
                                    {selectable && (
                                        <td><input type="checkbox" checked={selected.has(globalIdx)}
                                            onChange={() => toggleSelect(globalIdx)} /></td>
                                    )}
                                    {columns.map(col => (
                                        <td key={col.key}>
                                            {col.render ? col.render(row[col.key], row) : (row[col.key] ?? '—')}
                                        </td>
                                    ))}
                                </tr>
                            );
                        })}
                        {pageData.length === 0 && (
                            <tr>
                                <td colSpan={columns.length + (selectable ? 1 : 0)}
                                    style={{ textAlign: 'center', padding: '40px', color: '#8b8fa3' }}>
                                    <div style={{ fontSize: '2rem', marginBottom: '8px' }}>{emptyIcon}</div>
                                    {emptyMessage}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '16px', alignItems: 'center' }}>
                    <button className="btn btn-secondary btn-sm" disabled={page === 0}
                        onClick={() => setPage(p => p - 1)}>
                        <FiChevronLeft />
                    </button>
                    {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 7) pageNum = i;
                        else if (page < 4) pageNum = i;
                        else if (page > totalPages - 5) pageNum = totalPages - 7 + i;
                        else pageNum = page - 3 + i;
                        return (
                            <button key={pageNum} className={`btn btn-sm ${page === pageNum ? 'btn-primary' : 'btn-secondary'}`}
                                onClick={() => setPage(pageNum)} style={{ minWidth: '36px' }}>
                                {pageNum + 1}
                            </button>
                        );
                    })}
                    <button className="btn btn-secondary btn-sm" disabled={page >= totalPages - 1}
                        onClick={() => setPage(p => p + 1)}>
                        <FiChevronRight />
                    </button>
                </div>
            )}
        </div>
    );
};

export default DataTable;
