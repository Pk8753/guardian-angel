"""
Clinical Genetics Intelligence & Dynamic Metric Engine for GuardianAngel
Calculates phenotypic completeness, monogenic risk alerts, priority diagnostics,
and pedigree lineage synthesis based on user-entered relatives.
Keeps pre-filled historical benchmark data for admin only.
"""
from typing import Dict, List, Any, Optional

def compute_clinical_state(user: Optional[Any],
                           nodes: List[Any],
                           profile: Optional[Any]) -> Dict[str, Any]:
    user_dict = dict(user) if user else {}
    profile_dict = dict(profile) if profile else {}
    nodes_list = [dict(n) for n in nodes]

    username = user_dict.get('username', '')
    is_admin = (username.lower() in ('admin', 'user'))

    # Separate relatives by relationship
    father = next((n for n in nodes_list if 'father' in n.get('relationship', '').lower() and 'grand' not in n.get('relationship', '').lower()), None)
    mother = next((n for n in nodes_list if 'mother' in n.get('relationship', '').lower() and 'grand' not in n.get('relationship', '').lower()), None)
    siblings = [n for n in nodes_list if any(k in n.get('relationship', '').lower() for k in ['brother', 'sister', 'sibling'])]
    grandparents = [n for n in nodes_list if 'grand' in n.get('relationship', '').lower()]
    partner = next((n for n in nodes_list if any(k in n.get('relationship', '').lower() for k in ['spouse', 'partner', 'wife', 'husband'])), None)
    proband = next((n for n in nodes_list if n.get('is_proband')), None)
    
    non_proband_nodes = [n for n in nodes_list if not n.get('is_proband')]
    has_relatives = (len(non_proband_nodes) > 0)
    is_fresh_user = (not is_admin and not has_relatives)

    # ==================== ADMIN BENCHMARK DATA ====================
    if is_admin:
        return {
            'is_admin': True,
            'is_fresh_user': False,
            'has_relatives': True,
            'completeness_index': 92,
            'completeness_status': 'Clinical Node: Active',
            'completeness_subtitle': 'Locus 11p15.4 Indexed • GCP Vertex AI Sync',
            'completeness_desc': 'Your family health journey starts with understanding. Lineage telemetry reveals <span class="text-jungle-dark font-semibold">92% phenotypic completeness</span> across 3 mapped generations.',
            'has_priority_diagnostic': True,
            'diagnostic_title': 'Carrier Scan Recommended',
            'diagnostic_locus': 'Locus: HBB 11p15.4',
            'diagnostic_badge': 'Autosomal Recessive',
            'pedigree_size': len(nodes),
            'pedigree_subtitle': '3 generations verified with dual-side paternal & maternal ancestry.',
            'phenotypes_count': 2,
            'phenotypes_list': ['β-Thal trait', 'G6PD Def.'],
            'ai_alerts_count': 3,
            'ai_alerts_subtitle': 'Conjugated risk markers detected in maternal F2 filial tier.',
            'spousal_harmony': 'Fatima Al-Zahra',
            'spousal_harmony_code': 'FA',
            'spousal_harmony_subtitle': 'Linked Tree Verified',
            'has_partner': True,
            'father': father,
            'mother': mother,
            'siblings': siblings,
            'grandparents': grandparents,
            'partner': partner,
            'proband': proband,
            'intake_complete': True,
            'steps_remaining': 0,
            'missing_steps': []
        }

    # ==================== NON-ADMIN USER (FRESH OR INTAKE) ====================
    # 1. Dynamic Completeness Calculation
    # Starts at 0% if fresh, otherwise grows as user enters data
    if not has_relatives:
        completeness = 0
    else:
        completeness = 10  # base for proband
        if father:
            completeness += 25
        if mother:
            completeness += 25
        if siblings:
            completeness += 15
        if profile_dict and profile_dict.get('blood_type') and profile_dict.get('dob'):
            completeness += 15
        
        # Check if carrier or clinical condition statuses were documented
        carrier_or_clear = [n for n in nodes_list if n.get('carrier_status') in ('carrier', 'affected', 'clear')]
        if carrier_or_clear:
            completeness += 10
            
        completeness = min(completeness, 100)

    # 2. Extract Carrier & Condition Traits
    carrier_nodes = [n for n in nodes_list if n.get('carrier_status') in ('carrier', 'affected')]
    phenotype_conditions = []
    for n in carrier_nodes:
        cond = (n.get('condition_locus') or '').strip()
        if cond and cond.lower() not in ('none documented', 'unassessed', 'clear', 'none'):
            if cond not in phenotype_conditions:
                phenotype_conditions.append(cond)
                
    if not phenotype_conditions and carrier_nodes:
        for n in carrier_nodes:
            name_label = n.get('relationship') or n.get('name') or 'Relative'
            phenotype_conditions.append(f"{name_label} Carrier")

    phenotypes_count = len(phenotype_conditions) if phenotype_conditions else len(carrier_nodes)

    # 3. AI Genomic Surveillance Alerts
    ai_alerts = []
    if father and mother:
        f_carrier = (father.get('carrier_status') in ('carrier', 'affected'))
        m_carrier = (mother.get('carrier_status') in ('carrier', 'affected'))
        if f_carrier and m_carrier:
            ai_alerts.append("High Alert: Dual-parental carrier pairing detected — 25% homozygous autosomal recessive risk for offspring.")
        elif f_carrier:
            ai_alerts.append("Alert: Paternal carrier trait detected — 50% heterozygous inheritance transmission probability.")
        elif m_carrier:
            ai_alerts.append("Alert: Maternal carrier trait detected — transmission risk across filial lineage.")
    elif father and father.get('carrier_status') in ('carrier', 'affected'):
        ai_alerts.append("Alert: Paternal carrier trait detected — 50% heterozygous transmission probability.")
    elif mother and mother.get('carrier_status') in ('carrier', 'affected'):
        ai_alerts.append("Alert: Maternal carrier trait detected — transmission risk across filial lineage.")

    if any(s.get('carrier_status') in ('carrier', 'affected') for s in siblings):
        ai_alerts.append("Alert: Sibling recurrence observed — filial concordance verified in current generation.")

    ai_alerts_count = len(ai_alerts)
    if ai_alerts:
        ai_alerts_subtitle = ai_alerts[0]
    elif has_relatives:
        ai_alerts_subtitle = "No immediate pathogenic variant alerts detected in documented relatives."
    else:
        ai_alerts_subtitle = "AI surveillance idle. Requires pedigree intake."

    # 4. Priority Diagnostic Generation
    if not has_relatives:
        has_priority_diagnostic = False
        diag_title = "(Blank — No clinical diagnostic data recorded)"
        diag_locus = "Awaiting First-Degree Intake"
        diag_badge = "Pending Family Details"
    elif carrier_nodes:
        has_priority_diagnostic = True
        diag_title = "Carrier Surveillance Advised"
        diag_locus = f"Locus: {phenotype_conditions[0]}" if phenotype_conditions else "Identified Monogenic Trait"
        diag_badge = "Autosomal Recessive"
    else:
        has_priority_diagnostic = True
        diag_title = "Low Hereditary Risk Observed"
        diag_locus = "No Pathogenic Loci Reported"
        diag_badge = "Clear Lineage Trajectory"

    # 5. Missing Intake Steps Check
    missing_steps = []
    if not father:
        missing_steps.append({'key': 'father', 'label': 'Father Details', 'rel': 'Father', 'gen': 'gen2', 'icon': 'male'})
    if not mother:
        missing_steps.append({'key': 'mother', 'label': 'Mother Details', 'rel': 'Mother', 'gen': 'gen2', 'icon': 'female'})
    if not siblings:
        missing_steps.append({'key': 'sibling', 'label': 'Sibling Details', 'rel': 'Sibling', 'gen': 'gen3', 'icon': 'group'})
        
    intake_complete = (len(missing_steps) == 0)

    # 6. Spousal Harmony
    has_partner = (partner is not None)
    if partner:
        spousal_harmony = partner.get('name') or 'Partner Linked'
        spousal_harmony_code = partner.get('name', 'PT')[:2].upper()
        spousal_harmony_subtitle = 'Linked Tree Assessment Active'
    else:
        spousal_harmony = None
        spousal_harmony_code = '--'
        spousal_harmony_subtitle = 'Pre-marital harmony unassessed'

    # Subtitles
    if has_relatives:
        completeness_desc = f'Lineage telemetry reveals <span class="text-jungle-dark font-semibold">{completeness}% phenotypic completeness</span> across {len(nodes_list)} mapped relatives.'
        completeness_subtitle = f'{len(nodes_list)} Lineage Nodes Mapped • GCP Vertex AI Sync'
        pedigree_subtitle = f'{len(nodes_list)} members documented across first-degree lineage.'
    else:
        completeness_desc = 'Welcome to your private genomics vault. Your health dossier is currently initialized in a clean, de-identified state. Begin by filling in your Father, Mother, and Sibling details.'
        completeness_subtitle = 'Awaiting First Pedigree Intake • Zero-Knowledge Vault Active'
        pedigree_subtitle = 'Your pedigree is empty. You haven\'t added any family members yet.'

    return {
        'is_admin': False,
        'is_fresh_user': is_fresh_user,
        'has_relatives': has_relatives,
        'completeness_index': completeness,
        'completeness_status': 'Clinical Node: Active' if has_relatives else 'Clinical Node: Initializing',
        'completeness_subtitle': completeness_subtitle,
        'completeness_desc': completeness_desc,
        'has_priority_diagnostic': has_priority_diagnostic,
        'diagnostic_title': diag_title,
        'diagnostic_locus': diag_locus,
        'diagnostic_badge': diag_badge,
        'pedigree_size': len(nodes_list),
        'pedigree_subtitle': pedigree_subtitle,
        'phenotypes_count': phenotypes_count,
        'phenotypes_list': phenotype_conditions,
        'ai_alerts_count': ai_alerts_count,
        'ai_alerts_subtitle': ai_alerts_subtitle,
        'spousal_harmony': spousal_harmony,
        'spousal_harmony_code': spousal_harmony_code,
        'spousal_harmony_subtitle': spousal_harmony_subtitle,
        'has_partner': has_partner,
        'father': father,
        'mother': mother,
        'siblings': siblings,
        'grandparents': grandparents,
        'partner': partner,
        'proband': proband,
        'intake_complete': intake_complete,
        'steps_remaining': len(missing_steps),
        'missing_steps': missing_steps
    }
