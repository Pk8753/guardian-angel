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
  const memberMap = new Map<string | number, PedigreeMember>();
  members.forEach((m) => memberMap.set(m.id, m));

  // 1. Determine generational levels (0 = proband's generation, -1 = parents, -2 = grandparents, +1 = children)
  // Find proband or default to first member
  const proband = members.find((m) => m.is_proband) || members[0];
  const genLevelMap = new Map<string | number, number>();
  genLevelMap.set(proband.id, 0);

  // Traverse relationships to determine relative generations
  let changed = true;
  let iterations = 0;
  while (changed && iterations < 30) {
    changed = false;
    iterations++;

    for (const m of members) {
      const currentGen = genLevelMap.get(m.id);

      // From parents
      if (m.father_id && memberMap.has(m.father_id)) {
        const fatherGen = genLevelMap.get(m.father_id);
        if (fatherGen !== undefined && currentGen === undefined) {
          genLevelMap.set(m.id, fatherGen + 1);
          changed = true;
        } else if (fatherGen === undefined && currentGen !== undefined) {
          genLevelMap.set(m.father_id, currentGen - 1);
          changed = true;
        }
      }

      if (m.mother_id && memberMap.has(m.mother_id)) {
        const motherGen = genLevelMap.get(m.mother_id);
        if (motherGen !== undefined && currentGen === undefined) {
          genLevelMap.set(m.id, motherGen + 1);
          changed = true;
        } else if (motherGen === undefined && currentGen !== undefined) {
          genLevelMap.set(m.mother_id, currentGen - 1);
          changed = true;
        }
      }

      // Spouses are same generation
      if (m.spouse_ids && m.spouse_ids.length > 0) {
        for (const spouseId of m.spouse_ids) {
          const spouseGen = genLevelMap.get(spouseId);
          if (spouseGen !== undefined && currentGen === undefined) {
            genLevelMap.set(m.id, spouseGen);
            changed = true;
          } else if (spouseGen === undefined && currentGen !== undefined) {
            genLevelMap.set(spouseId, currentGen);
            changed = true;
          }
        }
      }

      // Infer generation from relationship string if still unset
      if (genLevelMap.get(m.id) === undefined) {
        const rel = (m.relationship_to_proband || '').toLowerCase();
        if (rel.includes('grandparent')) genLevelMap.set(m.id, -2);
        else if (rel.includes('father') || rel.includes('mother') || rel.includes('parent') || rel.includes('uncle') || rel.includes('aunt')) genLevelMap.set(m.id, -1);
        else if (rel.includes('sibling') || rel.includes('spouse') || rel.includes('partner') || rel.includes('cousin') || rel.includes('self')) genLevelMap.set(m.id, 0);
        else if (rel.includes('son') || rel.includes('daughter') || rel.includes('child')) genLevelMap.set(m.id, 1);
        else genLevelMap.set(m.id, 0);
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
    const key = [p1Id, p2Id].sort().join('-');
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
    if (m.father_id && m.mother_id) {
      const u = getOrCreateUnion(m.father_id, m.mother_id);
      if (!u.children_ids.includes(m.id)) {
        u.children_ids.push(m.id);
      }
    } else if (m.spouse_ids && m.spouse_ids.length > 0) {
      m.spouse_ids.forEach((spId) => {
        getOrCreateUnion(m.id, spId);
      });
    }
  });

  // Layout metrics
  const NODE_SIZE = 48;
  const HORIZONTAL_GAP = 90;
  const LEVEL_HEIGHT = 170;
  const TOP_PADDING = 80;
  const LEFT_PADDING = 120;

  // Position members per generation from left to right
  const sortedGenerations = Array.from(genGroups.keys()).sort((a, b) => a - b);
  const genMetrics: { roman: string; index: number; y: number }[] = [];

  sortedGenerations.forEach((gIdx) => {
    const list = genGroups.get(gIdx)!;
    const yBaseline = TOP_PADDING + gIdx * LEVEL_HEIGHT;
    genMetrics.push({
      roman: ROMAN_NUMERALS[gIdx] || `G${gIdx + 1}`,
      index: gIdx,
      y: yBaseline
    });

    // Order individuals: parents together, siblings grouped
    list.sort((a, b) => {
      // Put fathers / males before their spouses if paired
      if (a.father_id && b.father_id && a.father_id === b.father_id) {
        return (Number(a.id) || 0) - (Number(b.id) || 0);
      }
      return 0;
    });

    let currentX = LEFT_PADDING;
    list.forEach((m, idx) => {
      m.order_in_generation = idx + 1;
      m.display_label = `${m.generation}-${m.order_in_generation}`;

      // If user saved custom drag position, respect it, else auto-layout
      if (m.custom_x !== null && m.custom_x !== undefined) {
        m.x = m.custom_x;
      } else {
        m.x = currentX;
      }

      if (m.custom_y !== null && m.custom_y !== undefined) {
        m.y = m.custom_y;
      } else {
        m.y = yBaseline;
      }

      currentX += NODE_SIZE + HORIZONTAL_GAP;
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

  // Calculate boundary box
  let minX = 0;
  let minY = 0;
  let maxX = 1200;
  let maxY = 800;

  members.forEach((m) => {
    if (m.x !== undefined) {
      minX = Math.min(minX, m.x - 60);
      maxX = Math.max(maxX, m.x + 120);
    }
    if (m.y !== undefined) {
      minY = Math.min(minY, m.y - 60);
      maxY = Math.max(maxY, m.y + 160);
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
      width: Math.max(1200, maxX - minX + 200),
      height: Math.max(800, maxY - minY + 200)
    },
    generations: genMetrics
  };
}

