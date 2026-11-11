import { PedigreeMember, PedigreeUnion } from './types';

export interface LayoutResult {
  members: PedigreeMember[];
  unions: PedigreeUnion[];
  bounds: { minX: number; minY: number; maxX: number; maxY: number; width: number; height: number };
  generations: { roman: string; index: number; y: number }[];
}

const ROMAN_NUMERALS = ['I', 'II', 'III', 'IV', 'V', 'VI'];

export function computePedigreeLayout(
  rawMembers: PedigreeMember[],
  familyConsanguineous: boolean = false
): LayoutResult {
  if (!rawMembers || rawMembers.length === 0) {
    return {
      members: [],
      unions: [],
      bounds: { minX: 0, minY: 0, maxX: 1200, maxY: 800, width: 1200, height: 800 },
      generations: []
    };
  }

  // Clone members to avoid mutating inputs
  const members: PedigreeMember[] = rawMembers.map((m) => ({ ...m }));

  // 0. Auto-link relationships if explicit parent/spouse IDs are unassigned
  const proband = members.find((m) => m.is_proband) || members[0];
  if (proband) {
    const father = members.find((m) => (m.relationship_to_proband || '').toLowerCase() === 'father');
    const mother = members.find((m) => (m.relationship_to_proband || '').toLowerCase() === 'mother');
    const spouse = members.find((m) =>
      ['spouse', 'husband_wife', 'husband', 'wife', 'partner'].includes((m.relationship_to_proband || '').toLowerCase())
    );

    // Link Proband to parents (guard against self-parenting cycles!)
    if (father && String(father.id) !== String(proband.id) && !proband.father_id) {
      proband.father_id = father.id;
    }
    if (mother && String(mother.id) !== String(proband.id) && !proband.mother_id) {
      proband.mother_id = mother.id;
    }

    // Link parents as mutual partners if both exist and are distinct
    if (father && mother && String(father.id) !== String(mother.id)) {
      if (!father.spouse_ids || father.spouse_ids.length === 0) father.spouse_ids = [mother.id];
      if (!mother.spouse_ids || mother.spouse_ids.length === 0) mother.spouse_ids = [father.id];
    }

    // Link Proband and Spouse
    if (spouse && String(spouse.id) !== String(proband.id)) {
      if (!proband.spouse_ids || proband.spouse_ids.length === 0) proband.spouse_ids = [spouse.id];
      if (!spouse.spouse_ids || spouse.spouse_ids.length === 0) spouse.spouse_ids = [proband.id];
    }

    // Auto-link children, siblings, and twins
    members.forEach((m) => {
      const rel = (m.relationship_to_proband || '').toLowerCase();
      // Siblings & Twins share parents
      if (
        rel === 'brother' ||
        rel === 'sister' ||
        rel === 'full_sibling' ||
        rel === 'sibling' ||
        rel === 'twin_identical' ||
        rel === 'twin_fraternal'
      ) {
        if (father && String(father.id) !== String(m.id) && !m.father_id) m.father_id = father.id;
        if (mother && String(mother.id) !== String(m.id) && !m.mother_id) m.mother_id = mother.id;
        if (rel.includes('twin')) {
          m.twin_group_id = m.twin_group_id || 'twin-1';
          if (rel === 'twin_identical') m.is_identical_twin = true;
        }
      } else if (rel === 'half_sibling_father') {
        if (father && String(father.id) !== String(m.id) && !m.father_id) m.father_id = father.id;
      } else if (rel === 'half_sibling_mother') {
        if (mother && String(mother.id) !== String(m.id) && !m.mother_id) m.mother_id = mother.id;
      } else if (
        rel === 'son' ||
        rel === 'daughter' ||
        rel === 'child' ||
        rel === 'adopted_child' ||
        rel === 'pregnancy_loss' ||
        m.sex === 'star'
      ) {
        // If father and mother exist as the couple, link child to both
        if (father && mother && String(father.id) !== String(mother.id)) {
          if (!m.father_id) m.father_id = father.id;
          if (!m.mother_id) m.mother_id = mother.id;
        } else if (proband.sex === 'female') {
          if (!m.mother_id && String(proband.id) !== String(m.id)) m.mother_id = proband.id;
          if (spouse && !m.father_id && String(spouse.id) !== String(m.id)) m.father_id = spouse.id;
        } else {
          if (!m.father_id && String(proband.id) !== String(m.id)) m.father_id = proband.id;
          if (spouse && !m.mother_id && String(spouse.id) !== String(m.id)) m.mother_id = spouse.id;
        }
        if (rel === 'pregnancy_loss') {
          m.sex = 'pregnancy_loss';
        }
      }
    });
  }

  const memberMap = new Map<string | number, PedigreeMember>();
  members.forEach((m) => {
    memberMap.set(m.id, m);
    memberMap.set(String(m.id), m);
    if (!isNaN(Number(m.id))) memberMap.set(Number(m.id), m);
  });

  // 1. Determine generational levels (0 = proband's generation, -1 = parents, -2 = grandparents, +1 = children)
  const genLevelMap = new Map<string | number, number>();
  const setGen = (id: string | number, val: number) => {
    genLevelMap.set(id, val);
    genLevelMap.set(String(id), val);
    if (!isNaN(Number(id))) genLevelMap.set(Number(id), val);
  };
  const getGen = (id: string | number | null | undefined): number | undefined => {
    if (id === null || id === undefined) return undefined;
    return genLevelMap.get(id) ?? genLevelMap.get(String(id)) ?? (isNaN(Number(id)) ? undefined : genLevelMap.get(Number(id)));
  };

  if (proband) {
    setGen(proband.id, 0);
  }

  // Traverse relationships to determine relative generations
  let changed = true;
  let iterations = 0;
  while (changed && iterations < 30) {
    changed = false;
    iterations++;

    for (const m of members) {
      const currentGen = getGen(m.id);

      // From parents
      if (m.father_id && String(m.father_id) !== String(m.id) && memberMap.has(m.father_id)) {
        const fatherGen = getGen(m.father_id);
        if (fatherGen !== undefined && currentGen === undefined) {
          setGen(m.id, fatherGen + 1);
          changed = true;
        } else if (fatherGen === undefined && currentGen !== undefined) {
          setGen(m.father_id, currentGen - 1);
          changed = true;
        }
      }

      if (m.mother_id && String(m.mother_id) !== String(m.id) && memberMap.has(m.mother_id)) {
        const motherGen = getGen(m.mother_id);
        if (motherGen !== undefined && currentGen === undefined) {
          setGen(m.id, motherGen + 1);
          changed = true;
        } else if (motherGen === undefined && currentGen !== undefined) {
          setGen(m.mother_id, currentGen - 1);
          changed = true;
        }
      }

      // Parents of children must share the same generation level
      if (m.father_id && m.mother_id && String(m.father_id) !== String(m.mother_id)) {
        const fGen = getGen(m.father_id);
        const mGen = getGen(m.mother_id);
        if (fGen !== undefined && mGen === undefined) {
          setGen(m.mother_id, fGen);
          changed = true;
        } else if (mGen !== undefined && fGen === undefined) {
          setGen(m.father_id, mGen);
          changed = true;
        }
      }

      // Spouses are same generation
      if (m.spouse_ids && m.spouse_ids.length > 0) {
        for (const spouseId of m.spouse_ids) {
          const spouseGen = getGen(spouseId);
          if (spouseGen !== undefined && currentGen === undefined) {
            setGen(m.id, spouseGen);
            changed = true;
          } else if (spouseGen === undefined && currentGen !== undefined) {
            setGen(spouseId, currentGen);
            changed = true;
          }
        }
      }

      // Infer generation from relationship string if still unset
      if (getGen(m.id) === undefined) {
        const rel = (m.relationship_to_proband || '').toLowerCase();
        if (rel.includes('grandparent') || rel.includes('grandfather') || rel.includes('grandmother')) setGen(m.id, -2);
        else if (rel.includes('father') || rel.includes('mother') || rel.includes('parent') || rel.includes('uncle') || rel.includes('aunt')) setGen(m.id, -1);
        else if (rel.includes('sibling') || rel.includes('brother') || rel.includes('sister') || rel.includes('spouse') || rel.includes('partner') || rel.includes('husband') || rel.includes('wife') || rel.includes('cousin') || rel.includes('self') || rel.includes('twin')) setGen(m.id, 0);
        else if (rel.includes('son') || rel.includes('daughter') || rel.includes('child') || rel.includes('loss') || rel.includes('adopt')) setGen(m.id, 1);
        else setGen(m.id, 0);
        changed = true;
      }
    }
  }

  // Shift minimum generation to 0
  const allLevels = Array.from(genLevelMap.values());
  const minLevel = allLevels.length > 0 ? Math.min(...allLevels) : 0;
  members.forEach((m) => {
    const rawGen = genLevelMap.get(m.id) ?? 0;
    m.generation_index = rawGen - minLevel; // 0, 1, 2, ...
    m.generation = ROMAN_NUMERALS[m.generation_index] || `G${m.generation_index + 1}`;
  });

  // Group members by generation index
  const genGroups = new Map<number, PedigreeMember[]>();
  members.forEach((m) => {
    const g = m.generation_index || 0;
    if (!genGroups.has(g)) genGroups.set(g, []);
    genGroups.get(g)!.push(m);
  });

  // Build unions (couples that produce children or are marked as spouses)
  const unions: PedigreeUnion[] = [];
  const unionKeySet = new Set<string>();

  // Helper to ensure union exists
  const getOrCreateUnion = (p1Id: string | number, p2Id: string | number): PedigreeUnion => {
    const key = [String(p1Id), String(p2Id)].sort().join('-');
    let union = unions.find((u) => u.id === key);
    if (!union) {
      union = {
        id: key,
        parent1_id: p1Id,
        parent2_id: p2Id,
        is_consanguineous: familyConsanguineous,
        x: 0,
        y: 0,
        children_ids: []
      };
      unions.push(union);
      unionKeySet.add(key);
    }
    return union;
  };

  // Add unions from parents of members
  members.forEach((m) => {
    if (m.father_id && m.mother_id && String(m.father_id) !== String(m.mother_id)) {
      const u = getOrCreateUnion(m.father_id, m.mother_id);
      const childNormId = String(m.id);
      if (!u.children_ids.some((cid) => String(cid) === childNormId)) {
        u.children_ids.push(m.id);
      }
    } else if (m.spouse_ids && m.spouse_ids.length > 0) {
      m.spouse_ids.forEach((spId) => {
        if (String(spId) !== String(m.id)) {
          getOrCreateUnion(m.id, spId);
        }
      });
    }
  });

  // Layout metrics
  const NODE_SIZE = 48;
  const HORIZONTAL_GAP = 90;
  const STEP_X = NODE_SIZE + HORIZONTAL_GAP; // 138px between centers
  const LEVEL_HEIGHT = 170;
  const CANVAS_CENTER_X = 600;
  const CANVAS_CENTER_Y = 380;

  // Position members per generation centered around canvas center
  const sortedGenerations = Array.from(genGroups.keys()).sort((a, b) => a - b);
  const numGens = sortedGenerations.length || 1;
  const totalTreeHeight = (numGens - 1) * LEVEL_HEIGHT;
  const startTopY = Math.max(90, Math.round(CANVAS_CENTER_Y - (totalTreeHeight / 2)));

  const genMetrics: { roman: string; index: number; y: number }[] = [];

  sortedGenerations.forEach((gIdx, genArrayIdx) => {
    const list = genGroups.get(gIdx)!;
    const yBaseline = startTopY + genArrayIdx * LEVEL_HEIGHT;

    genMetrics.push({
      roman: ROMAN_NUMERALS[gIdx] || `G${gIdx + 1}`,
      index: gIdx,
      y: yBaseline
    });

    // Order individuals: parents together (male on left), siblings grouped
    list.sort((a, b) => {
      // If a and b are mutual spouses, place male on the left
      if (a.spouse_ids?.includes(b.id) || b.spouse_ids?.includes(a.id)) {
        if (a.sex === 'male' && b.sex !== 'male') return -1;
        if (a.sex !== 'male' && b.sex === 'male') return 1;
      }
      // Group siblings sharing same parents
      if (a.father_id && b.father_id && a.father_id === b.father_id) {
        return (Number(a.id) || 0) - (Number(b.id) || 0);
      }
      return 0;
    });

    // Center this generation horizontally around CANVAS_CENTER_X (600)
    const genSpan = (list.length - 1) * STEP_X;
    const startX = Math.max(80, Math.round(CANVAS_CENTER_X - (genSpan / 2)));

    list.forEach((m, idx) => {
      m.order_in_generation = idx + 1;
      m.display_label = `${m.generation}-${m.order_in_generation}`;

      // If user saved custom drag position, respect it; otherwise auto-center
      if (m.custom_x !== null && m.custom_x !== undefined) {
        m.x = m.custom_x;
      } else {
        m.x = startX + idx * STEP_X;
      }

      if (m.custom_y !== null && m.custom_y !== undefined) {
        m.y = m.custom_y;
      } else {
        m.y = yBaseline;
      }
    });
  });

  // Calculate union coordinates (midpoint between couple)
  unions.forEach((u) => {
    const p1 = memberMap.get(u.parent1_id);
    const p2 = memberMap.get(u.parent2_id);
    if (p1 && p2 && p1.x !== undefined && p2.x !== undefined && p1.y !== undefined && p2.y !== undefined) {
      u.x = (p1.x + p2.x) / 2;
      u.y = (p1.y + p2.y) / 2;
    }
  });

  // Calculate boundary box encompassing all nodes with padding
  let minX = 600;
  let minY = 380;
  let maxX = 600;
  let maxY = 380;

  members.forEach((m) => {
    if (m.x !== undefined) {
      minX = Math.min(minX, m.x - 80);
      maxX = Math.max(maxX, m.x + 80);
    }
    if (m.y !== undefined) {
      minY = Math.min(minY, m.y - 80);
      maxY = Math.max(maxY, m.y + 120);
    }
  });

  return {
    members,
    unions,
    bounds: {
      minX: Math.max(0, minX),
      minY: Math.max(0, minY),
      maxX: Math.max(1200, maxX),
      maxY: Math.max(800, maxY),
      width: Math.max(1200, maxX + 100),
      height: Math.max(800, maxY + 100)
    },
    generations: genMetrics
  };
}

