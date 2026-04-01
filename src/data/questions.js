// Scoring criteria — 13 categories, each rated 1-10
// selfGuided: true = included in self-guided tour scoring, false = official tour only
export const SCORING_CRITERIA = [
  {
    id: 'academic_fit',
    title: 'Academic Fit',
    description: 'Programs, majors, and courses for your interests (data science, CS, business, math)',
    icon: '📚',
    selfGuided: true,
  },
  {
    id: 'campus_vibe',
    title: 'Campus Vibe',
    description: 'Did you feel comfortable here? Could you see yourself here for 4 years?',
    icon: '✨',
    selfGuided: true,
  },
  {
    id: 'student_energy',
    title: 'Student Energy',
    description: 'Were students engaged, friendly, interesting? Would you want them as classmates?',
    icon: '⚡',
    selfGuided: true,
  },
  {
    id: 'location',
    title: 'Location & Setting',
    description: 'City, town, or rural? Weather? Distance from home? Surrounding area?',
    icon: '📍',
    selfGuided: true,
  },
  {
    id: 'size_feel',
    title: 'Size & Feel',
    description: 'Right number of students? Felt too big, too small, or just right?',
    icon: '🏛️',
    selfGuided: true,
  },
  {
    id: 'facilities',
    title: 'Dorms & Facilities',
    description: 'Housing, dining, libraries, labs, gym — quality and condition?',
    icon: '🏠',
    selfGuided: false,
  },
  {
    id: 'athletics',
    title: 'Athletics & Spirit',
    description: 'Division level? Baseball program? Game day culture? School spirit?',
    icon: '⚾',
    selfGuided: true,
  },
  {
    id: 'entrepreneurship',
    title: 'Entrepreneurship & Innovation',
    description: 'Startup programs, business incubators, maker spaces, innovation culture?',
    icon: '🚀',
    selfGuided: true,
  },
  {
    id: 'research',
    title: 'Research & Hands-On',
    description: 'Undergraduate research, co-ops, internship access, study abroad?',
    icon: '🔬',
    selfGuided: false,
  },
  {
    id: 'social',
    title: 'Social Scene',
    description: 'Greek life? Clubs? Did you vibe with the people? Night life / weekend culture?',
    icon: '🎉',
    selfGuided: false,
  },
  {
    id: 'career',
    title: 'Career Outcomes',
    description: 'Where do grads go? Starting salaries? Alumni network strength?',
    icon: '💼',
    selfGuided: true,
  },
  {
    id: 'value',
    title: 'Financial Value',
    description: 'Cost vs. quality? Aid available? Is it worth the investment?',
    icon: '💰',
    selfGuided: true,
  },
  {
    id: 'gut',
    title: 'Gut Feeling',
    description: 'Your overall instinct. If you got in everywhere, would you pick this one?',
    icon: '🎯',
    selfGuided: true,
  },
];

// Helper: get criteria for a tour type
export function getCriteriaForTourType(tourType) {
  if (tourType === 'self_guided') return SCORING_CRITERIA.filter(c => c.selfGuided);
  return SCORING_CRITERIA; // official gets all 13
}

// Essay note prompts — organized by section
export const ESSAY_SECTIONS = [
  {
    id: 'academic',
    title: 'Academic Fit',
    icon: '📚',
    questions: [
      {
        id: 'major_program',
        prompt: 'What specific major, program, or concentration would you pursue here?',
        placeholder: 'e.g., Applied Math + CS double major, or Business Analytics concentration...',
      },
      {
        id: 'course_1',
        prompt: 'Name a specific course in their catalog that excites you (look it up!)',
        placeholder: 'e.g., "CSCI 1420: Machine Learning" — what drew you to it?',
      },
      {
        id: 'course_2',
        prompt: 'A second course — ideally cross-disciplinary',
        placeholder: 'e.g., a philosophy + tech ethics course, or a data journalism class...',
      },
      {
        id: 'professor',
        prompt: 'A professor whose work connects to your interests (Google them!)',
        placeholder: 'Name, department, what they research, and why it interests you...',
      },
      {
        id: 'program_difference',
        prompt: 'How does their program differ from similar ones at other schools you visited?',
        placeholder: 'What makes their approach to data/CS/business unique?',
      },
      {
        id: 'lab_center',
        prompt: 'A specific research lab, center, or institute you\'d want to join',
        placeholder: 'e.g., "The AI Lab" or "Center for Data Science" — be specific about what they do',
      },
    ],
  },
  {
    id: 'experience',
    title: 'Campus Experience',
    icon: '👀',
    questions: [
      {
        id: 'standout_moment',
        prompt: 'One specific moment during the tour that stuck with you',
        placeholder: 'A scene, interaction, or discovery that made an impression...',
      },
      {
        id: 'memorable_quote',
        prompt: 'Something a student, tour guide, or professor said that was memorable',
        placeholder: 'Try to capture the actual words or close to it...',
      },
      {
        id: 'special_spot',
        prompt: 'A building, space, or spot on campus that felt special — and why',
        placeholder: 'Not just "the library was nice" — what specifically about it?',
      },
      {
        id: 'student_activity',
        prompt: 'What were students actually doing when you walked around?',
        placeholder: 'Studying on the lawn? Playing frisbee? In the lab? Be specific...',
      },
      {
        id: 'feel_different',
        prompt: 'How did it FEEL different from the last school you visited?',
        placeholder: 'Compare the energy, pace, friendliness, seriousness...',
      },
    ],
  },
  {
    id: 'personal',
    title: 'Why You + This School',
    icon: '🤝',
    questions: [
      {
        id: 'data_connection',
        prompt: 'How does this school connect to your interest in data / financial analysis?',
        placeholder: 'Think about your Financial Fragility project — what here supports that?',
      },
      {
        id: 'philosophy_connection',
        prompt: 'How does it connect to your interest in philosophy / tech ethics?',
        placeholder: 'Think about Philosophy Club, Conference on Democracy...',
      },
      {
        id: 'entrepreneurial_connection',
        prompt: 'How does it connect to your entrepreneurial side?',
        placeholder: 'Think about VC internship, Pacifics baseball operations, investment club...',
      },
      {
        id: 'contribution',
        prompt: 'What could you CONTRIBUTE to this campus?',
        placeholder: 'A club you\'d start? A project you\'d bring? A perspective you offer?',
      },
      {
        id: 'club_org',
        prompt: 'A specific club or organization you\'d join (look them up!)',
        placeholder: 'Name the actual club and why it appeals to you...',
      },
      {
        id: 'alumni_inspiration',
        prompt: 'Is there an alumni whose path inspires your own?',
        placeholder: 'Who, what they did, and how it connects to where you want to go...',
      },
    ],
  },
  {
    id: 'non_obvious',
    title: 'Non-Obvious Details',
    icon: '💎',
    questions: [
      {
        id: 'unique_fact',
        prompt: 'Something unique about this school that most applicants wouldn\'t know',
        placeholder: 'The kind of detail that shows you really dug in...',
      },
      {
        id: 'tradition',
        prompt: 'A tradition you\'d want to participate in — what does it say about the culture?',
        placeholder: 'Not just "they have traditions" — name one and explain why it appeals...',
      },
      {
        id: 'city_town',
        prompt: 'Something about the surrounding city/town that matters to you',
        placeholder: 'A restaurant, neighborhood, outdoor activity, vibe...',
      },
      {
        id: 'structure_appeal',
        prompt: 'How does the school\'s approach to curriculum / housing / social life appeal?',
        placeholder: 'Open curriculum? Residential colleges? Greek life? Quarter system?',
      },
    ],
  },
  {
    id: 'thesis',
    title: 'One-Sentence Thesis',
    icon: '🎯',
    questions: [
      {
        id: 'thesis_sentence',
        prompt: 'In one sentence: Why is this school the right fit for YOU specifically?',
        placeholder: 'This becomes the core of your "Why Us" essay. Make it personal and specific.',
      },
      {
        id: 'common_app_link',
        prompt: 'Which Common App essay prompt (1-7) could this school experience support?',
        placeholder: 'e.g., "#6 Intellectual Curiosity — the data science lab visit..." or "#5 Personal Growth..."',
      },
    ],
  },
];

// Flatten all essay questions for counting
export const ALL_ESSAY_QUESTIONS = ESSAY_SECTIONS.flatMap(s =>
  s.questions.map(q => ({ ...q, sectionId: s.id, sectionTitle: s.title }))
);
