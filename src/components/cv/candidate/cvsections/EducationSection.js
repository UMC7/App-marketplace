// src/components/cv/candidate/cvsections/EducationSection.js
import React, { useEffect, useState, useMemo } from 'react';
import supabase from '../../../../supabase';
import { toast } from 'react-toastify';

import EducationItemCard from '../sectionscomponents/education/EducationItemCard';
import EducationItemForm from '../sectionscomponents/education/EducationItemForm';

export default function EducationSection({ userId: userIdProp, showRequiredMark = true }) {
  const [userId, setUserId] = useState(userIdProp || null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState(null);

  const isDark = useMemo(() => {
    if (typeof document === 'undefined') return false;
    return document.documentElement.getAttribute('data-theme') === 'dark';
  }, []);

  const formWrapperStyle = useMemo(
    () => ({
      border: `1px solid ${isDark ? '#212734' : 'var(--line)'}`,
      borderRadius: 12,
      padding: 12,
      background: isDark ? '#0c1017' : 'linear-gradient(180deg, var(--card), var(--card-2))',
      marginBottom: 10,
    }),
    [isDark]
  );

  useEffect(() => {
    let mounted = true;
    async function resolveUser() {
      if (userIdProp) return;
      const { data, error } = await supabase.auth.getUser();
      if (!mounted) return;
      if (error) {
        toast.error('Unable to resolve current user.');
        return;
      }
      setUserId(data?.user?.id || null);
    }
    resolveUser();
    return () => {
      mounted = false;
    };
  }, [userIdProp]);

  // cargar items
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    async function load() {
      setLoading(true);
      const { data, error } = await supabase
        .from('cv_education')
        .select('*')
        .eq('user_id', userId)
        .order('start_year', { ascending: false })
        .order('start_month', { ascending: false })
        .order('created_at', { ascending: false });

      if (cancelled) return;
      if (error) {
        toast.error('Failed to load Education.');
      } else {
        setItems(data || []);
      }
      setLoading(false);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  async function createItem(payload) {
    const insert = {
      user_id: userId,
      institution: payload.institution,
      program: payload.program,
      level_type: payload.levelType,
      country: payload.country,
      start_month: payload.startMonth,
      start_year: payload.startYear,
      end_month: payload.current ? null : payload.endMonth,
      end_year: payload.current ? null : payload.endYear,
      current: !!payload.current,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('cv_education')
      .insert(insert)
      .select('*')
      .single();

    if (error) {
      toast.error('Could not save education.');
      return;
    }
    setItems((prev) => [data, ...prev]);
    setCreating(false);
    toast.success('Education added.');
  }

  async function updateItem(id, payload) {
    const update = {
      institution: payload.institution,
      program: payload.program,
      level_type: payload.levelType,
      country: payload.country,
      start_month: payload.startMonth,
      start_year: payload.startYear,
      end_month: payload.current ? null : payload.endMonth,
      end_year: payload.current ? null : payload.endYear,
      current: !!payload.current,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('cv_education')
      .update(update)
      .eq('id', id)
      .eq('user_id', userId)
      .select('*')
      .single();

    if (error) {
      toast.error('Could not update education.');
      return;
    }
    setItems((prev) => prev.map((it) => (it.id === id ? data : it)));
    setEditing(null);
    toast.success('Education updated.');
  }

  async function deleteItem(id) {
    const { error } = await supabase
      .from('cv_education')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      toast.error('Could not delete education.');
      return;
    }
    setItems((prev) => prev.filter((it) => it.id !== id));
    toast.success('Education removed.');
  }

  return (
    <>
      {/* Barra de acción superior */}
      <div className="cp-actions" style={{ marginBottom: 8 }}>
        {!creating && !editing && (
          <button type="button" className="cp-btn-add" onClick={() => setCreating(true)}>
            + Add education
          </button>
        )}
      </div>

      {/* Crear (sin título interno) */}
      {creating && (
        <div style={formWrapperStyle}>
          <EducationItemForm
            onSubmit={(p) => createItem(p)}
            onCancel={() => setCreating(false)}
            showRequiredMark={showRequiredMark}
          />
        </div>
      )}

      {/* Editar (sin título interno) */}
      {editing && (
        <div style={formWrapperStyle}>
          <EducationItemForm
            initialValue={{
              institution: editing.institution,
              program: editing.program,
              levelType: editing.level_type,
              country: editing.country,
              startMonth: editing.start_month,
              startYear: editing.start_year,
              endMonth: editing.end_month || '',
              endYear: editing.end_year || '',
              current: !!editing.current,
            }}
            onSubmit={(p) => updateItem(editing.id, p)}
            onCancel={() => setEditing(null)}
            showRequiredMark={showRequiredMark}
          />
        </div>
      )}

      {loading ? (
        <p className="cv-muted">Loading…</p>
      ) : items.length === 0 ? (
        <p className="cv-muted">No education added yet.</p>
      ) : (
        <>
          {items.map((it) => (
            <EducationItemCard
              key={it.id}
              item={{
                institution: it.institution,
                program: it.program,
                levelType: it.level_type,
                country: it.country,
                startMonth: it.start_month,
                startYear: it.start_year,
                endMonth: it.end_month,
                endYear: it.end_year,
                current: it.current,
              }}
              onEdit={() => setEditing(it)}
              onDelete={() => deleteItem(it.id)}
            />
          ))}
        </>
      )}
    </>
  );
}
