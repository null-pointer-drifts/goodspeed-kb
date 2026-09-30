'use client';

import { useState } from 'react';
import { Document } from '@goodspeed/types';
import { api } from '../lib/api';

interface Props {
  documents: Document[];
  onDeleted: (id: string) => void;
  onUpdated: (doc: Document) => void;
}

export default function DocumentList({ documents, onDeleted, onUpdated }: Props) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editTags, setEditTags] = useState('');
  const [saving, setSaving] = useState(false);

  function startEdit(doc: Document) {
    setEditingId(doc.id);
    setEditTitle(doc.title);
    setEditContent(doc.content);
    setEditTags(doc.tags.join(', '));
    setExpandedId(null);
  }

  async function handleUpdate(id: string) {
    setSaving(true);
    try {
      const updated = await api.documents.update(id, {
        title: editTitle,
        content: editContent,
        tags: editTags.split(',').map((t) => t.trim()).filter(Boolean),
      });
      onUpdated(updated);
      setEditingId(null);
    } finally {
      setSaving(false);
    }
  }

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
            boxShadow: 'var(--shadow)',
          }}
        >
          {editingId === doc.id ? (
            /* Edit mode */
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div>
                <label>Title</label>
                <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
              </div>
              <div>
                <label>Content</label>
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  rows={6}
                />
              </div>
              <div>
                <label>Tags (comma-separated)</label>
                <input value={editTags} onChange={(e) => setEditTags(e.target.value)} />
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn-primary" onClick={() => handleUpdate(doc.id)} disabled={saving}>
                  {saving ? 'Saving...' : 'Save'}
                </button>
                <button className="btn-ghost" onClick={() => setEditingId(null)}>Cancel</button>
              </div>
            </div>
          ) : (
            /* View mode */
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: 600, marginBottom: 4 }}>{doc.title}</p>
                  <p
                    style={{
                      color: 'var(--muted)',
                      fontSize: 13,
                      marginBottom: 6,
                      ...(expandedId === doc.id
                        ? { whiteSpace: 'pre-wrap', wordBreak: 'break-word' }
                        : { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }),
                    }}
                  >
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
                <div style={{ display: 'flex', gap: 8, marginLeft: 16, flexShrink: 0 }}>
                  <button
                    className="btn-ghost"
                    onClick={() => setExpandedId(expandedId === doc.id ? null : doc.id)}
                  >
                    {expandedId === doc.id ? 'Collapse' : 'View'}
                  </button>
                  <button className="btn-ghost" onClick={() => startEdit(doc)}>
                    Edit
                  </button>
                  <button
                    className="btn-danger"
                    onClick={() => handleDelete(doc.id)}
                    disabled={deletingId === doc.id}
                  >
                    {deletingId === doc.id ? '...' : 'Delete'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
