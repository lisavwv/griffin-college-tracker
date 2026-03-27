// Local storage-based data store (Phase 1)
// Will migrate to Supabase in Phase 2

const STORAGE_KEYS = {
  visits: 'gct_visits',
  essayNotes: 'gct_essay_notes',
  customSchools: 'gct_custom_schools',
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
  return newSchool;
}

export function deleteCustomSchool(schoolId) {
  const schools = getCustomSchools().filter(s => s.id !== schoolId);
  localStorage.setItem(STORAGE_KEYS.customSchools, JSON.stringify(schools));
  // Also clean up visit data and essay notes
  const visits = getVisits();
  delete visits[schoolId];
  localStorage.setItem(STORAGE_KEYS.visits, JSON.stringify(visits));
  const essayData = localStorage.getItem(STORAGE_KEYS.essayNotes);
  if (essayData) {
    const all = JSON.parse(essayData);
    delete all[schoolId];
    localStorage.setItem(STORAGE_KEYS.essayNotes, JSON.stringify(all));
  }
}

// ============================================================
// RANKINGS
// ============================================================

export function getRankings() {
  const visits = getVisits();
  const ranked = [];
  for (const [schoolId, visit] of Object.entries(visits)) {
    if (visit.scores) {
      const total = Object.values(visit.scores).reduce((sum, s) => sum + (s || 0), 0);
      ranked.push({
        schoolId,
        total,
        scores: visit.scores,
        tier: visit.tier,
        dateVisited: visit.dateVisited,
      });
    }
  }
  ranked.sort((a, b) => b.total - a.total);
  return ranked;
}

// ============================================================
// EXPORT (for Google Sheets later)
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
