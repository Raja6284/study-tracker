import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import client from '../api/client';

const ACTIVITY_TYPES = [
  { value: 'SELF_STUDY', label: 'Self Study' },
  { value: 'LECTURE', label: 'Lecture' },
  { value: 'NOTE_MAKING', label: 'Note Making' },
  { value: 'QUESTION_PRACTICE', label: 'Question Practice' },
  { value: 'REVISION', label: 'Revision' },
  { value: 'READING', label: 'Reading' },
  { value: 'OTHER', label: 'Other' },
];

const today = () => new Date().toISOString().slice(0, 10);
const nowTime = () => new Date().toTimeString().slice(0, 5);

const emptyForm = {
  date: today(),
  startTime: '',
  endTime: '',
  subjectId: '',
  topicId: '',
  activityType: 'SELF_STUDY',
  description: '',
  questionsAttempted: '',
  questionsCorrect: '',
  questionsIncorrect: '',
  notes: '',
};

export default function AddSession() {
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');
  const navigate = useNavigate();

  const [subjects, setSubjects] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [showMore, setShowMore] = useState(false);
  const [newSubject, setNewSubject] = useState('');
  const [newTopic, setNewTopic] = useState('');
  const [files, setFiles] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [savedMsg, setSavedMsg] = useState('');

  useEffect(() => {
    loadSubjects();
    if (editId) loadForEdit(editId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editId]);

  async function loadSubjects() {
    const { data } = await client.get('/subjects');
    setSubjects(data);
  }

  async function loadForEdit(id) {
    const { data } = await client.get(`/sessions/${id}`);
    setForm({
      date: data.date.slice(0, 10),
      startTime: new Date(data.startTime).toTimeString().slice(0, 5),
      endTime: new Date(data.endTime).toTimeString().slice(0, 5),
      subjectId: data.subjectId,
      topicId: data.topicId,
      activityType: data.activityType,
      description: data.description || '',
      questionsAttempted: data.questionsAttempted ?? '',
      questionsCorrect: data.questionsCorrect ?? '',
      questionsIncorrect: data.questionsIncorrect ?? '',
      notes: data.notes || '',
    });
    setShowMore(true);
  }

  const selectedSubject = subjects.find((s) => s.id === form.subjectId);
  const topics = selectedSubject?.topics || [];

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function addSubject() {
    if (!newSubject.trim()) return;
    const { data } = await client.post('/subjects', { name: newSubject.trim() });
    setNewSubject('');
    await loadSubjects();
    update('subjectId', data.id);
    update('topicId', '');
  }

  async function addTopic() {
    if (!newTopic.trim() || !form.subjectId) return;
    const { data } = await client.post(`/subjects/${form.subjectId}/topics`, { name: newTopic.trim() });
    setNewTopic('');
    await loadSubjects();
    update('topicId', data.id);
  }

  function buildPayload() {
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, v ?? ''));
    files.forEach((f) => fd.append('attachments', f));
    return fd;
  }

  async function save(andAddAnother) {
    setError('');
    if (!form.startTime || !form.endTime || !form.subjectId || !form.topicId) {
      setError('Start time, end time, subject and topic are required.');
      return;
    }
    setSaving(true);
    try {
      const fd = buildPayload();
      if (editId) {
        await client.put(`/sessions/${editId}`, fd);
      } else {
        await client.post('/sessions', fd);
      }
      setSavedMsg('Saved.');
      if (andAddAnother && !editId) {
        setForm((f) => ({ ...emptyForm, date: f.date, subjectId: f.subjectId }));
        setFiles([]);
        setTimeout(() => setSavedMsg(''), 1500);
      } else {
        navigate('/');
      }
    } catch (err) {
      setError(err?.response?.data?.error || 'Could not save session');
    } finally {
      setSaving(false);
    }
  }

  const isQuestionActivity = form.activityType === 'QUESTION_PRACTICE';

  return (
    <div className="max-w-xl mx-auto px-4 py-6">
      <h1 className="font-serif text-2xl font-semibold text-mossdark mb-1">
        {editId ? 'Edit session' : 'Add study session'}
      </h1>
      <p className="text-sm text-ink/60 mb-5">Only the essentials are required — save and add the next one in seconds.</p>

      <div className="card p-5 space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="field-label">Date</label>
            <input type="date" className="input" value={form.date} onChange={(e) => update('date', e.target.value)} />
          </div>
          <div>
            <label className="field-label">Start</label>
            <input type="time" className="input" value={form.startTime} onChange={(e) => update('startTime', e.target.value)} />
          </div>
          <div>
            <label className="field-label">End</label>
            <input type="time" className="input" value={form.endTime} onChange={(e) => update('endTime', e.target.value)} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="field-label">Subject</label>
            <select className="input" value={form.subjectId} onChange={(e) => { update('subjectId', e.target.value); update('topicId', ''); }}>
              <option value="">Select subject</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            <div className="flex gap-1 mt-1">
              <input className="input !py-1 text-xs" placeholder="New subject" value={newSubject} onChange={(e) => setNewSubject(e.target.value)} />
              <button type="button" onClick={addSubject} className="btn-secondary !py-1 !px-2 text-xs">Add</button>
            </div>
          </div>
          <div>
            <label className="field-label">Topic</label>
            <select className="input" value={form.topicId} onChange={(e) => update('topicId', e.target.value)} disabled={!form.subjectId}>
              <option value="">Select topic</option>
              {topics.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
            <div className="flex gap-1 mt-1">
              <input className="input !py-1 text-xs" placeholder="New topic" value={newTopic} onChange={(e) => setNewTopic(e.target.value)} disabled={!form.subjectId} />
              <button type="button" onClick={addTopic} className="btn-secondary !py-1 !px-2 text-xs" disabled={!form.subjectId}>Add</button>
            </div>
          </div>
        </div>

        <div>
          <label className="field-label">Activity type</label>
          <select className="input" value={form.activityType} onChange={(e) => update('activityType', e.target.value)}>
            {ACTIVITY_TYPES.map((a) => (
              <option key={a.value} value={a.value}>{a.label}</option>
            ))}
          </select>
        </div>

        {isQuestionActivity && (
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="field-label">Attempted</label>
              <input type="number" min="0" className="input" value={form.questionsAttempted} onChange={(e) => update('questionsAttempted', e.target.value)} />
            </div>
            <div>
              <label className="field-label">Correct</label>
              <input type="number" min="0" className="input" value={form.questionsCorrect} onChange={(e) => update('questionsCorrect', e.target.value)} />
            </div>
            <div>
              <label className="field-label">Incorrect</label>
              <input type="number" min="0" className="input" value={form.questionsIncorrect} onChange={(e) => update('questionsIncorrect', e.target.value)} />
            </div>
          </div>
        )}

        <button type="button" className="text-sm text-moss underline" onClick={() => setShowMore((v) => !v)}>
          {showMore ? 'Hide optional fields' : 'Add description / notes / files'}
        </button>

        {showMore && (
          <div className="space-y-3">
            <div>
              <label className="field-label">What was covered (optional)</label>
              <textarea className="input" rows={2} value={form.description} onChange={(e) => update('description', e.target.value)} />
            </div>
            <div>
              <label className="field-label">Notes (optional)</label>
              <textarea className="input" rows={2} value={form.notes} onChange={(e) => update('notes', e.target.value)} />
            </div>
            <div>
              <label className="field-label">Attachments (optional)</label>
              <input type="file" multiple accept="image/*,.pdf" onChange={(e) => setFiles(Array.from(e.target.files))} />
            </div>
          </div>
        )}

        {error && <p className="text-sm text-clay">{error}</p>}
        {savedMsg && <p className="text-sm text-moss">{savedMsg}</p>}

        <div className="flex gap-2 pt-2">
          <button type="button" disabled={saving} onClick={() => save(false)} className="btn-primary">
            {saving ? 'Saving…' : 'Save'}
          </button>
          {!editId && (
            <button type="button" disabled={saving} onClick={() => save(true)} className="btn-secondary">
              Save &amp; add another
            </button>
          )}
          <button type="button" onClick={() => navigate('/')} className="text-sm text-ink/50 ml-auto self-center">Cancel</button>
        </div>
      </div>
    </div>
  );
}
