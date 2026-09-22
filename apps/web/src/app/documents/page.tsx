'use client';

import { useEffect, useState } from 'react';
import { Document } from '@goodspeed/types';
import { api } from '../../lib/api';
import DocumentForm from '../../components/DocumentForm';
import DocumentList from '../../components/DocumentList';

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.documents.list()
      .then(setDocuments)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  function handleCreated(doc: Document) {
    setDocuments((prev) => [doc, ...prev]);
  }

  function handleDeleted(id: string) {
    setDocuments((prev) => prev.filter((d) => d.id !== id));
  }

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '32px 24px', width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700 }}>Documents</h1>
      </div>

      <div style={{ marginBottom: 24 }}>
        <DocumentForm onCreated={handleCreated} />
      </div>

      {loading && <p style={{ color: 'var(--muted)' }}>Loading...</p>}
      {error && <p style={{ color: 'var(--danger)' }}>{error}</p>}
      {!loading && !error && (
        <DocumentList documents={documents} onDeleted={handleDeleted} />
      )}
    </div>
  );
}
