// School primary colors and website domains for logo fetching
// Logo URL: https://logo.clearbit.com/{domain}

export const SCHOOL_BRANDING = {
  princeton:     { color: '#FF6F00', domain: 'princeton.edu' },
  mit:           { color: '#A31F34', domain: 'mit.edu' },
  harvard:       { color: '#A51C30', domain: 'harvard.edu' },
  yale:          { color: '#00356B', domain: 'yale.edu' },
  stanford:      { color: '#8C1515', domain: 'stanford.edu' },
  caltech:       { color: '#FF6C0C', domain: 'caltech.edu' },
  duke:          { color: '#003087', domain: 'duke.edu' },
  upenn:         { color: '#011F5B', domain: 'upenn.edu' },
  jhu:           { color: '#002D72', domain: 'jhu.edu' },
  northwestern:  { color: '#4E2A84', domain: 'northwestern.edu' },
  uchicago:      { color: '#800000', domain: 'uchicago.edu' },
  brown:         { color: '#4E3629', domain: 'brown.edu' },
  dartmouth:     { color: '#00693E', domain: 'dartmouth.edu' },
  vanderbilt:    { color: '#CFB991', domain: 'vanderbilt.edu' },
  rice:          { color: '#003DA5', domain: 'rice.edu' },
  notre_dame:    { color: '#0C2340', domain: 'nd.edu' },
  cornell:       { color: '#B31B1B', domain: 'cornell.edu' },
  columbia:      { color: '#B9D9EB', domain: 'columbia.edu' },
  wustl:         { color: '#A51417', domain: 'wustl.edu' },
  georgetown:    { color: '#041E42', domain: 'georgetown.edu' },
  cmu:           { color: '#C41230', domain: 'cmu.edu' },
  emory:         { color: '#012169', domain: 'emory.edu' },
  uva:           { color: '#232D4B', domain: 'virginia.edu' },
  usc:           { color: '#990000', domain: 'usc.edu' },
  ucla:          { color: '#2774AE', domain: 'ucla.edu' },
  unc:           { color: '#4B9CD3', domain: 'unc.edu' },
  michigan:      { color: '#00274C', domain: 'umich.edu' },
  nyu:           { color: '#57068C', domain: 'nyu.edu' },
  tufts:         { color: '#3E8EDE', domain: 'tufts.edu' },
  georgia_tech:  { color: '#B3A369', domain: 'gatech.edu' },
  bc:            { color: '#98002E', domain: 'bc.edu' },
  uf:            { color: '#0021A5', domain: 'ufl.edu' },
  bu:            { color: '#CC0000', domain: 'bu.edu' },
  lehigh:        { color: '#653819', domain: 'lehigh.edu' },
  wake_forest:   { color: '#9E7E38', domain: 'wfu.edu' },
  uga:           { color: '#BA0C2F', domain: 'uga.edu' },
  babson:        { color: '#006747', domain: 'babson.edu' },
  cal_poly:      { color: '#1F4F21', domain: 'calpoly.edu' },
  ucsb:          { color: '#003660', domain: 'ucsb.edu' },
  clemson:       { color: '#F56600', domain: 'clemson.edu' },
  gwu:           { color: '#033C5A', domain: 'gwu.edu' },
  villanova:     { color: '#003366', domain: 'villanova.edu' },
  northeastern:  { color: '#D41B2C', domain: 'northeastern.edu' },
  tulane:        { color: '#006747', domain: 'tulane.edu' },
  wm:            { color: '#115740', domain: 'wm.edu' },
  berkeley:      { color: '#003262', domain: 'berkeley.edu' },
  case_western:  { color: '#0A304E', domain: 'case.edu' },
  wisconsin:     { color: '#C5050C', domain: 'wisc.edu' },
  texas:         { color: '#BF5700', domain: 'utexas.edu' },
  illinois:      { color: '#E84A27', domain: 'illinois.edu' },
  ohio_state:    { color: '#BB0000', domain: 'osu.edu' },
  purdue:        { color: '#CFB991', domain: 'purdue.edu' },
}

export function getBranding(schoolId) {
  return SCHOOL_BRANDING[schoolId] || { color: '#1e40af', domain: null }
}

export function getLogoUrl(schoolId) {
  const b = SCHOOL_BRANDING[schoolId]
  if (!b?.domain) return null
  return `https://logo.clearbit.com/${b.domain}`
}
