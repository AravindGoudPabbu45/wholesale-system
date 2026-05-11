import React from 'react';

/**
 * Reusable skeleton loader components for premium loading states.
 * Use instead of plain "Loading..." text for a polished UX.
 */

/** Single animated skeleton line */
export const SkeletonLine = ({ width = '100%', height = '14px', style }) => (
    <div className="skeleton-line" style={{ width, height, borderRadius: '6px', ...style }} />
);

/** Skeleton card — matches the app's card design */
export const SkeletonCard = ({ lines = 3 }) => (
    <div className="card skeleton-card">
        <SkeletonLine width="40%" height="20px" style={{ marginBottom: '16px' }} />
        {Array.from({ length: lines }).map((_, i) => (
            <SkeletonLine
                key={i}
                width={`${70 + Math.random() * 30}%`}
                style={{ marginBottom: '10px' }}
            />
        ))}
    </div>
);

/** Skeleton table — renders placeholder rows */
export const SkeletonTable = ({ rows = 5, cols = 5 }) => (
    <div className="card" style={{ overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ display: 'flex', gap: '12px', padding: '12px 16px', borderBottom: '1px solid #2a2d3e' }}>
            {Array.from({ length: cols }).map((_, i) => (
                <SkeletonLine key={i} width={`${100 / cols}%`} height="16px" />
            ))}
        </div>
        {/* Rows */}
        {Array.from({ length: rows }).map((_, r) => (
            <div key={r} style={{ display: 'flex', gap: '12px', padding: '14px 16px', borderBottom: '1px solid #1a1c2e' }}>
                {Array.from({ length: cols }).map((_, c) => (
                    <SkeletonLine key={c} width={`${100 / cols}%`} height="14px" />
                ))}
            </div>
        ))}
    </div>
);

/** Skeleton stat cards — row of metric boxes */
export const SkeletonStats = ({ count = 4 }) => (
    <div className="stats-grid">
        {Array.from({ length: count }).map((_, i) => (
            <div key={i} className="stat-card skeleton-card">
                <SkeletonLine width="60%" height="12px" style={{ marginBottom: '12px' }} />
                <SkeletonLine width="40%" height="28px" style={{ marginBottom: '8px' }} />
                <SkeletonLine width="80%" height="10px" />
            </div>
        ))}
    </div>
);
