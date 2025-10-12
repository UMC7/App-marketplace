// src/components/cv/DocumentManager.js
import React, { useEffect, useState } from 'react';
import supabase from '../../supabase';

const BUCKET = 'cv-docs';              // bucket privado
const MAX_MB = 10;
const TYPES = [
  { v: 'cv', label: 'CV' },
  { v: 'cover', label: 'Cover letter' },
  { v: 'certificate', label: 'Certificate' },
];
const VIS = [
  { v: 'public', label: 'Public' },
  { v: 'after_contact', label: 'After contact' },
];

export default function DocumentManager({ profileId }) {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  // form
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [type, setType] = useState('cv');
  const [visibility, setVisibility] = useState('after_contact');

  useEffect(() => {
    if (!profileId) return;
    let cancel = false;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('public_documents')
        .select('*')
        .eq('profile_id', profileId)
        .order('created_at', { ascending: false });
      if (!cancel) {
        if (!error) setDocs(data || []);
        setLoading(false);
      }
    })();
    return () => { cancel = true; };
  }, [profileId]);

  async function handleUpload(e) {
    e.preventDefault();
    if (!profileId || !file) return;
    if (file.size > MAX_MB * 1024 * 1024) {
      alert(`Max ${MAX_MB}MB`);
      return;
    }

    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No session');

      const ext = file.name.split('.').pop()?.toLowerCase() || 'pdf';
      const path = `${user.id}/${Date.now()}_${file.name.replace(/\s+/g, '_')}`;

      const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, file, {
        upsert: false,
        contentType: file.type || (ext === 'pdf' ? 'application/pdf' : undefined),
      });
      if (upErr) throw upErr;

      const { data: row, error: dbErr } = await supabase
        .from('public_documents')
        .insert([{
          profile_id: profileId,
          type,
          title: (title || file.name).slice(0, 120),
          file_url: path,                 // guardamos PATH (bucket privado)
          visibility,
        }])
        .select('*')
        .single();
      if (dbErr) throw dbErr;

      setDocs((d) => [row, ...d]);
      // reset
      setFile(null); setTitle('');
      e.target?.reset?.();
      alert('Uploaded');
    } catch (err) {
      alert(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  async function changeVisibility(id, v) {
    const { data, error } = await supabase
      .from('public_documents')
      .update({ visibility: v })
      .eq('id', id)
      .select('*')
      .single();
    if (!error && data) setDocs((d) => d.map(x => x.id === id ? data : x));
  }

  async function removeDoc(doc) {
    if (!window.confirm('Delete document?')) return;
    // delete file (best-effort)
    if (doc.file_url) await supabase.storage.from(BUCKET).remove([doc.file_url]);
    const { error } = await supabase.from('public_documents').delete().eq('id', doc.id);
    if (!error) setDocs((d) => d.filter(x => x.id !== doc.id));
  }

  return (
    <div className="cp-card">
      <h3 className="cp-h3">Documents</h3>
      <form onSubmit={handleUpload} className="cp-form" style={{ gap: 8 }}>
        <label className="cp-label">File (PDF/JPG/PNG/WEBP, max {MAX_MB}MB)</label>
        <input className="cp-input" type="file"
               accept=".pdf,image/jpeg,image/png,image/webp"
               onChange={(e) => setFile(e.target.files?.[0] || null)} required />

        <label className="cp-label">Title</label>
        <input className="cp-input" value={title} onChange={(e)=>setTitle(e.target.value)} placeholder="Optional" />

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
          <div>
            <label className="cp-label">Type</label>
            <select className="cp-input" value={type} onChange={(e)=>setType(e.target.value)}>
              {TYPES.map(t => <option key={t.v} value={t.v}>{t.label}</option>)}
            </select>
          </div>
          <div>
            <label className="cp-label">Visibility</label>
            <select className="cp-input" value={visibility} onChange={(e)=>setVisibility(e.target.value)}>
              {VIS.map(v => <option key={v.v} value={v.v}>{v.label}</option>)}
            </select>
          </div>
        </div>

        <div className="cp-actions" style={{ marginTop: 6 }}>
          <button type="submit" disabled={uploading || !file}>{uploading ? 'Uploading…' : 'Add document'}</button>
        </div>
      </form>

      <div style={{ marginTop: 12 }}>
        <h4 className="cp-h3" style={{ marginBottom: 6 }}>Your files</h4>
        {loading ? <p>Loading…</p> : docs.length === 0 ? <p>No documents yet.</p> : (
          <ul style={{ listStyle:'none', padding:0, margin:0 }}>
            {docs.map(doc => (
              <li key={doc.id}
                  style={{display:'grid',gridTemplateColumns:'1fr 160px 140px auto',gap:8,alignItems:'center',padding:'8px 0',borderTop:'1px solid #2b2b2b'}}>
                <div>
                  <div style={{fontWeight:600}}>{doc.title || '(untitled)'}</div>
                  <div style={{opacity:.8,fontSize:12}}>
                    {TYPES.find(t=>t.v===doc.type)?.label || doc.type} · {new Date(doc.created_at).toLocaleString()}
                  </div>
                </div>
                <div style={{fontSize:12,opacity:.9,justifySelf:'start',border:'1px solid #2b2b2b',borderRadius:6,padding:'4px 8px'}}>
                  {doc.file_url?.split('/').pop()}
                </div>
                <select
                  className="cp-input"
                  value={doc.visibility}
                  onChange={(e)=>changeVisibility(doc.id, e.target.value)}
                >
                  {VIS.map(v => <option key={v.v} value={v.v}>{v.label}</option>)}
                </select>
                <button type="button" onClick={()=>removeDoc(doc)} style={{justifySelf:'end'}}>Delete</button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}