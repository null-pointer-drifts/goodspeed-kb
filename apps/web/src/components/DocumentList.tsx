'use client';

import { useState } from 'react';
import { Document } from '@goodspeed/types';
import { api } from '../lib/api';

interface Props {
  documents: Document[];
  onDeleted: (id: string) => void;
}

export default function DocumentList({ documents, onDeleted }: Props) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      await api.documents.remove(id);
      onDeleted(id);
    } finally {
      setDeletingId(null);
    }
  }

  if (documents.length === 0) {
    return (
      <p style={{ color: 'var(--muted)', textAlign: 'center', padding: '48px 0' }}>
        No documents yet. Add one above.
      </p>
    );
  }

  return (
    <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 12 }}>
      {documents.map((doc) => (
        <li
          key={doc.id}
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            padding: '16px 20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            boxShadow: 'var(--shadow)',
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontWeight: 600, marginBottom: 4 }}>{doc.title}</p>
            <p style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {doc.content}
            </p>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {doc.tags.map((tag) => (
                <span
                  key={tag}
                  style={{
                    fontSize: 11,
                    padding: '2px 8px',
                    borderRadius: 99,
                    background: '#ede9fe',
                    color: 'var(--primary)',
                    fontWeight: 500,
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
          <button
            className="btn-danger"
            style={{ marginLeft: 16, flexShrink: 0 }}
            onClick={() => handleDelete(doc.id)}
            disabled={deletingId === doc.id}
          >
            {deletingId === doc.id ? '...' : 'Delete'}
          </button>
        </li>
      ))}
    </ul>
  );
}
