// Data store: localStorage for instant reads, Supabase for cross-device sync
import { supabase } from './supabase'

import { SCORING_CRITERIA, getCriteriaForTourType } from './questions'

const STORAGE_KEYS = {
  visits: 'gct_visits',
  essayNotes: 'gct_essay_notes',
  customSchools: 'gct_custom_schools',
  weights: 'gct_weights',
  lastSync: 'gct_last_sync',
};

// ============================================================
// VISIT DATA (scores, notes, tier, date)
// ============================================================

export function getVisits() {
  const data = localStorage.getItem(STORAGE_KEYS.visits);
  return data ? JSON.parse(data) : {};
}

export function getVisit(schoolId) {
  const visits = getVisits();
  return visits[schoolId] || null;
}

export function saveVisit(schoolId, visitData) {
  const visits = getVisits();
  visits[schoolId] = {
    ...visits[schoolId],
    ...visitData,
    updatedAt: new Date().toISOString(),
  };
  localStorage.setItem(STORAGE_KEYS.visits, JSON.stringify(visits));
  // Sync to Supabase in background
  _syncVisitToSupabase(schoolId, visits[schoolId]);
  return visits[schoolId];
}

export function markVisited(schoolId, date = null) {
  return saveVisit(schoolId, {
    visited: true,
    dateVisited: date || new Date().toISOString().split('T')[0],
  });
}

export function saveScores(schoolId, scores) {
  return saveVisit(schoolId, { scores });
}

export function saveTier(schoolId, tier) {
  return saveVisit(schoolId, { tier });
}

// ============================================================
// ESSAY NOTES
// ============================================================

export function getEssayNotes(schoolId) {
  const data = localStorage.getItem(STORAGE_KEYS.essayNotes);
  const all = data ? JSON.parse(data) : {};
  return all[schoolId] || {};
}

export function saveEssayNote(schoolId, questionId, text) {
  const data = localStorage.getItem(STORAGE_KEYS.essayNotes);
  const all = data ? JSON.parse(data) : {};
  if (!all[schoolId]) all[schoolId] = {};
  all[schoolId][questionId] = text;
  localStorage.setItem(STORAGE_KEYS.essayNotes, JSON.stringify(all));
  // Sync to Supabase in background
  _syncEssayNoteToSupabase(schoolId, questionId, text);
}

// ============================================================
// CUSTOM SCHOOLS
// ============================================================

export function getCustomSchools() {
  const data = localStorage.getItem(STORAGE_KEYS.customSchools);
  return data ? JSON.parse(data) : [];
}

export function addCustomSchool(school) {
  const schools = getCustomSchools();
  const id = 'custom_' + Date.now();
  const newSchool = { ...school, id, isCustom: true };
  schools.push(newSchool);
  localStorage.setItem(STORAGE_KEYS.customSchools, JSON.stringify(schools));
  // Sync to Supabase
  _syncCustomSchoolToSupabase(newSchool);
  return newSchool;
}

export function deleteCustomSchool(schoolId) {
  const schools = getCustomSchools().filter(s => s.id !== schoolId);
  localStorage.setItem(STORAGE_KEYS.customSchools, JSON.stringify(schools));
  const visits = getVisits();
  delete visits[schoolId];
  localStorage.setItem(STORAGE_KEYS.visits, JSON.stringify(visits));
  const essayData = localStorage.getItem(STORAGE_KEYS.essayNotes);
  if (essayData) {
    const all = JSON.parse(essayData);
    delete all[schoolId];
    localStorage.setItem(STORAGE_KEYS.essayNotes, JSON.stringify(all));
  }
  // Sync deletes to Supabase
  _deleteFromSupabase(schoolId);
}

// ============================================================
// PRIORITY WEIGHTS (drag-to-rank order)
// ============================================================

// Returns array of criterion IDs in priority order (index 0 = most important)
export function getPriorityOrder() {
  const data = localStorage.getItem(STORAGE_KEYS.weights);
  if (data) return JSON.parse(data);
  // Default: current order in SCORING_CRITERIA
  return SCORING_CRITERIA.map(c => c.id);
}

export function savePriorityOrder(order) {
  localStorage.setItem(STORAGE_KEYS.weights, JSON.stringify(order));
  _syncWeightsToSupabase(order);
}

// Convert rank position to weight: #1 = 13, #2 = 12, ... #13 = 1
export function getWeightsMap() {
  const order = getPriorityOrder();
  const total = SCORING_CRITERIA.length; // 13
  const map = {};
  order.forEach((id, i) => { map[id] = total - i; });
  // Fill in any missing criteria with weight 1
  SCORING_CRITERIA.forEach(c => { if (!map[c.id]) map[c.id] = 1; });
  return map;
}

// ============================================================
// RANKINGS
// ============================================================

export function getRankings() {
  const visits = getVisits();
  const weights = getWeightsMap();
  const ranked = [];
  for (const [schoolId, visit] of Object.entries(visits)) {
    if (visit.scores) {
      const tourType = visit.tourType || 'official';
      const applicable = getCriteriaForTourType(tourType);
      // Raw: sum of scores / max possible for tour type
      const rawSum = applicable.reduce((sum, c) => sum + (visit.scores[c.id] || 0), 0);
      const rawMax = applicable.length * 10;
      const rawPct = rawMax > 0 ? Math.round((rawSum / rawMax) * 100) : 0;
      // Weighted: sum(score * weight) / sum(10 * weight) for applicable criteria
      const weightedSum = applicable.reduce((sum, c) => sum + (visit.scores[c.id] || 0) * (weights[c.id] || 1), 0);
      const weightedMax = applicable.reduce((sum, c) => sum + 10 * (weights[c.id] || 1), 0);
      const weightedPct = weightedMax > 0 ? Math.round((weightedSum / weightedMax) * 100) : 0;
      ranked.push({
        schoolId,
        total: rawSum,
        rawPct,
        weightedPct,
        scores: visit.scores,
        tier: visit.tier,
        tourType,
        dateVisited: visit.dateVisited,
      });
    }
  }
  ranked.sort((a, b) => b.weightedPct - a.weightedPct);
  return ranked;
}

// ============================================================
// EXPORT
// ============================================================

export function exportAllData() {
  return {
    visits: getVisits(),
    essayNotes: JSON.parse(localStorage.getItem(STORAGE_KEYS.essayNotes) || '{}'),
    customSchools: getCustomSchools(),
    exportedAt: new Date().toISOString(),
  };
}

export function importData(data) {
  if (data.visits) localStorage.setItem(STORAGE_KEYS.visits, JSON.stringify(data.visits));
  if (data.essayNotes) localStorage.setItem(STORAGE_KEYS.essayNotes, JSON.stringify(data.essayNotes));
  if (data.customSchools) localStorage.setItem(STORAGE_KEYS.customSchools, JSON.stringify(data.customSchools));
}

// ============================================================
// SUPABASE SYNC (background, non-blocking)
// ============================================================

async function _syncVisitToSupabase(schoolId, visit) {
  try {
    await supabase.from('visits').upsert({
      school_id: schoolId,
      visited: visit.visited || false,
      date_visited: visit.dateVisited || null,
      tier: visit.tier || null,
      scores: visit.scores || {},
      score_notes: visit.scoreNotes || {},
      low_interest_reason: visit.lowInterestReason || null,
      low_interest_comment: visit.lowInterestComment || null,
      tour_type: visit.tourType || null,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'school_id' });
  } catch (e) {
    console.warn('Supabase sync failed (visits):', e);
  }
}

async function _syncEssayNoteToSupabase(schoolId, questionId, text) {
  try {
    await supabase.from('essay_notes').upsert({
      school_id: schoolId,
      question_id: questionId,
      note_text: text,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'school_id,question_id' });
  } catch (e) {
    console.warn('Supabase sync failed (essay):', e);
  }
}

async function _syncCustomSchoolToSupabase(school) {
  try {
    await supabase.from('custom_schools').upsert({
      id: school.id,
      name: school.name,
      location: school.location || null,
      type: school.type || null,
      setting: school.setting || null,
      rank: school.rank ? parseInt(school.rank) : null,
      acceptance_rate: school.acceptanceRate || null,
      sat_range: school.satRange || null,
      act_range: school.actRange || null,
      undergrad_enrollment: school.undergradEnrollment ? parseInt(school.undergradEnrollment) : null,
      total_enrollment: school.totalEnrollment ? parseInt(school.totalEnrollment) : null,
      student_faculty_ratio: school.studentFacultyRatio || null,
      grad_rate: school.gradRate || null,
      greek_life: school.greekLife || null,
      athletics: school.athletics || null,
      tuition: school.tuition || null,
      known_for: school.knownFor || null,
      top_programs: school.topPrograms || null,
      is_custom: true,
    }, { onConflict: 'id' });
  } catch (e) {
    console.warn('Supabase sync failed (custom school):', e);
  }
}

async function _deleteFromSupabase(schoolId) {
  try {
    await supabase.from('visits').delete().eq('school_id', schoolId);
    await supabase.from('essay_notes').delete().eq('school_id', schoolId);
    await supabase.from('custom_schools').delete().eq('id', schoolId);
  } catch (e) {
    console.warn('Supabase delete failed:', e);
  }
}

async function _syncWeightsToSupabase(order) {
  try {
    await supabase.from('settings').upsert({
      id: 'global',
      priority_order: order,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'id' });
  } catch (e) {
    console.warn('Supabase sync failed (weights):', e);
  }
}

// ============================================================
// PULL FROM SUPABASE (call on app load to sync from cloud)
// ============================================================

export async function pullFromSupabase() {
  try {
    // Pull visits
    const { data: visitRows } = await supabase.from('visits').select('*');
    if (visitRows && visitRows.length > 0) {
      const localVisits = getVisits();
      for (const row of visitRows) {
        const localVisit = localVisits[row.school_id];
        const remoteTime = new Date(row.updated_at).getTime();
        const localTime = localVisit?.updatedAt ? new Date(localVisit.updatedAt).getTime() : 0;
        // Remote wins if newer
        if (remoteTime > localTime) {
          localVisits[row.school_id] = {
            visited: row.visited,
            dateVisited: row.date_visited,
            tier: row.tier,
            scores: row.scores || {},
            scoreNotes: row.score_notes || {},
            lowInterestReason: row.low_interest_reason,
            lowInterestComment: row.low_interest_comment,
            tourType: row.tour_type,
            updatedAt: row.updated_at,
          };
        } else if (localTime > remoteTime) {
          // Local is newer — push to Supabase
          _syncVisitToSupabase(row.school_id, localVisits[row.school_id]);
        }
      }
      // Also push any local visits not in remote
      for (const [schoolId, visit] of Object.entries(localVisits)) {
        if (!visitRows.find(r => r.school_id === schoolId)) {
          _syncVisitToSupabase(schoolId, visit);
        }
      }
      localStorage.setItem(STORAGE_KEYS.visits, JSON.stringify(localVisits));
    } else {
      // No remote data — push all local data up
      const localVisits = getVisits();
      for (const [schoolId, visit] of Object.entries(localVisits)) {
        _syncVisitToSupabase(schoolId, visit);
      }
    }

    // Pull essay notes
    const { data: essayRows } = await supabase.from('essay_notes').select('*');
    if (essayRows && essayRows.length > 0) {
      const localEssays = JSON.parse(localStorage.getItem(STORAGE_KEYS.essayNotes) || '{}');
      for (const row of essayRows) {
        if (!localEssays[row.school_id]) localEssays[row.school_id] = {};
        // Remote wins (simple merge — essay notes don't have individual timestamps)
        if (row.note_text) {
          localEssays[row.school_id][row.question_id] = row.note_text;
        }
      }
      localStorage.setItem(STORAGE_KEYS.essayNotes, JSON.stringify(localEssays));
    } else {
      // Push local essays up
      const localEssays = JSON.parse(localStorage.getItem(STORAGE_KEYS.essayNotes) || '{}');
      for (const [schoolId, notes] of Object.entries(localEssays)) {
        for (const [qId, text] of Object.entries(notes)) {
          if (text) _syncEssayNoteToSupabase(schoolId, qId, text);
        }
      }
    }

    // Pull custom schools
    const { data: customRows } = await supabase.from('custom_schools').select('*');
    if (customRows && customRows.length > 0) {
      const merged = customRows.map(row => ({
        id: row.id,
        name: row.name,
        location: row.location,
        type: row.type,
        setting: row.setting,
        rank: row.rank,
        acceptanceRate: row.acceptance_rate,
        satRange: row.sat_range,
        actRange: row.act_range,
        undergradEnrollment: row.undergrad_enrollment,
        totalEnrollment: row.total_enrollment,
        studentFacultyRatio: row.student_faculty_ratio,
        gradRate: row.grad_rate,
        greekLife: row.greek_life,
        athletics: row.athletics,
        tuition: row.tuition,
        knownFor: row.known_for,
        topPrograms: row.top_programs,
        isCustom: true,
      }));
      localStorage.setItem(STORAGE_KEYS.customSchools, JSON.stringify(merged));
    } else {
      // Push local custom schools up
      const localCustom = getCustomSchools();
      for (const school of localCustom) {
        _syncCustomSchoolToSupabase(school);
      }
    }

    // Pull weights/priority order
    const { data: settingsRows } = await supabase.from('settings').select('*').eq('id', 'global');
    if (settingsRows && settingsRows.length > 0 && settingsRows[0].priority_order) {
      const remoteOrder = settingsRows[0].priority_order;
      const localOrder = getPriorityOrder();
      const remoteTime = new Date(settingsRows[0].updated_at).getTime();
      // Use remote if it has data
      if (remoteOrder.length > 0) {
        localStorage.setItem(STORAGE_KEYS.weights, JSON.stringify(remoteOrder));
      }
    } else {
      // Push local weights up
      const localOrder = getPriorityOrder();
      if (localOrder.length > 0) _syncWeightsToSupabase(localOrder);
    }

    localStorage.setItem(STORAGE_KEYS.lastSync, new Date().toISOString());
    return true;
  } catch (e) {
    console.warn('Supabase pull failed:', e);
    return false;
  }
}
