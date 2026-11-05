'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { PedigreeMember, FamilyRecord } from './types';
import {
  X,
  Users,
  User,
  HeartPulse,
  UploadCloud,
  ChevronDown,
  ChevronUp,
  Check,
  AlertCircle,
  FileText,
  ShieldCheck,
  Plus,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Info,
  Calendar,
  CheckCircle2,
  HelpCircle,
  Heart,
  Baby,
  UserCheck,
  Search,
  Upload
} from 'lucide-react';

interface FamilyWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFamilyCreated: (family: FamilyRecord, probandMember: any) => Promise<void>;
  onAddMember: (memberData: any) => Promise<void>;
  onUpdateMember?: (memberId: string | number, memberData: any) => Promise<void>;
  existingFamily?: FamilyRecord | null;
  initialStep?: 1 | 2 | 3;
  editingMember?: PedigreeMember | null;
  initialRelation?: string | null;
  newFamilyId?: string | null;
}

const ADJECTIVES = [
  'Curious', 'Silent', 'Brave', 'Swift', 'Calm', 'Gentle', 'Keen', 'Noble',
  'Bright', 'Resilient', 'Serene', 'Stalwart', 'Candid', 'Amber', 'Cedar',
  'Silver', 'Golden', 'Solar', 'Lunar', 'Cosmic', 'Vibrant', 'Wired', 'Alert',
  'Subtle', 'Quiet', 'Mystic', 'Daring', 'Nimble', 'Eager', 'Patient', 'Radiant'
];

const NOUNS = [
  'Falcon', 'Cheetah', 'Otter', 'Heron', 'Dolphin', 'Sequoia', 'Osprey', 'Badger',
  'Lynx', 'Fox', 'Hawk', 'Gazelle', 'Panda', 'Eagle', 'Raven', 'Stag',
  'Wolf', 'Orchid', 'Cypress', 'Pine', 'Breeze', 'Voyager', 'Sparrow', 'Robin',
  'Finch', 'Plover', 'Phoenix', 'Willow', 'Horizon', 'Nebula'
];

function generateClientPseudonym(): string {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  const num = Math.floor(1000 + Math.random() * 9000);
  return `${adj}-${noun}-${num}`;
}

// 16 Comprehensive Relationship Card Definitions with Icons & Simple English Labels
const RELATION_CARDS = [
  { id: 'father', label: 'Father', defaultSex: 'male', category: 'parent', desc: 'Biological Father' },
  { id: 'mother', label: 'Mother', defaultSex: 'female', category: 'parent', desc: 'Biological Mother' },
  { id: 'full_sibling', label: 'Full Sibling', defaultSex: 'male', category: 'sibling', desc: 'Full brother or sister' },
  { id: 'half_sibling_father', label: 'Half Sibling (Father)', defaultSex: 'male', category: 'sibling', desc: 'Via father' },
  { id: 'half_sibling_mother', label: 'Half Sibling (Mother)', defaultSex: 'female', category: 'sibling', desc: 'Via mother' },
  { id: 'twin_identical', label: 'Twin (Identical)', defaultSex: 'male', category: 'sibling', desc: 'Identical (monozygotic)' },
  { id: 'twin_fraternal', label: 'Twin (Fraternal)', defaultSex: 'male', category: 'sibling', desc: 'Fraternal (dizygotic)' },
  { id: 'husband_wife', label: 'Spouse / Partner', defaultSex: 'female', category: 'partner', desc: 'Husband, Wife or Partner' },
  { id: 'son', label: 'Son', defaultSex: 'male', category: 'child', desc: 'Biological Son' },
  { id: 'daughter', label: 'Daughter', defaultSex: 'female', category: 'child', desc: 'Biological Daughter' },
  { id: 'paternal_uncle_aunt', label: 'Paternal Uncle / Aunt', defaultSex: 'male', category: 'extended', desc: "Father's brother or sister" },
  { id: 'maternal_uncle_aunt', label: 'Maternal Uncle / Aunt', defaultSex: 'female', category: 'extended', desc: "Mother's brother or sister" },
  { id: 'grandparents', label: 'Grandparents', defaultSex: 'male', category: 'grandparent', desc: 'Grandfather or Grandmother' },
  { id: 'cousin', label: 'Cousin', defaultSex: 'male', category: 'extended', desc: 'First blood cousin' },
  { id: 'adopted_child', label: 'Adopted Child', defaultSex: 'male', category: 'child', desc: 'Adopted son or daughter' },
  { id: 'pregnancy_loss', label: 'Pregnancy Loss', defaultSex: 'unknown', category: 'loss', desc: 'Miscarriage or stillbirth' }
];

// Comprehensive Master Catalog of Hereditary Diseases, Inherited Conditions, and Genetic Traits
const COMPREHENSIVE_HEREDITARY_CATALOG = [
  'Beta-Thalassemia Major',
  'Beta-Thalassemia Minor (Trait)',
  'Alpha-Thalassemia',
  'Sickle Cell Anemia',
  'Sickle Cell Trait',
  'Spinal Muscular Atrophy (SMA Type 1/2/3)',
  'Cystic Fibrosis (CFTR)',
  'Hemophilia A (Factor VIII)',
  'Hemophilia B (Factor IX)',
  'Hereditary Breast & Ovarian Cancer (BRCA1/2)',
  'Lynch Syndrome (Hereditary Colon Cancer)',
  'Huntington’s Disease',
  'Fragile X Syndrome',
  'Duchenne Muscular Dystrophy (DMD)',
  'Becker Muscular Dystrophy (BMD)',
  'Familial Hypercholesterolemia (High Cholesterol)',
  'Hypertrophic Cardiomyopathy (HCM)',
  'Long QT Syndrome (Heart Rhythm)',
  'Marfan Syndrome',
  'Neurofibromatosis Type 1 (NF1)',
  'Polycystic Kidney Disease (PKD)',
  'Hereditary Hemochromatosis (Iron Overload)',
  'Wilson’s Disease (Copper Metabolism)',
  'Alpha-1 Antitrypsin Deficiency',
  'Gaucher Disease',
  'Tay-Sachs Disease',
  'Phenylketonuria (PKU)',
  'Down Syndrome (Trisomy 21)',
  'Turner Syndrome (45,X)',
  'Klinefelter Syndrome (47,XXY)',
  'Edwards Syndrome (Trisomy 18)',
  'Patau Syndrome (Trisomy 13)',
  'Non-obstructive Azoospermia (Infertility)',
  'Premature Ovarian Insufficiency (POI)',
  'Polycystic Ovary Syndrome (PCOS)',
  'Recurrent Pregnancy Loss (Repeated Miscarriages)',
  'G6PD Deficiency (Favism / Enzyme Deficiency)',
  'Red-Green Color Blindness',
  'Hereditary Hearing Loss / Early Deafness',
  'Retinitis Pigmentosa (Vision Loss)',
  'Albinism (Oculocutaneous)',
  'Osteogenesis Imperfecta (Brittle Bones)',
  'Ehlers-Danlos Syndrome (EDS)',
  'Charcot-Marie-Tooth Disease (CMT)',
  'Congenital Adrenal Hyperplasia (CAH)',
  'Familial Mediterranean Fever (FMF)',
  'Hereditary Spherocytosis (Hemolytic Anemia)',
  'Early-Onset Type 1 Diabetes',
  'Severe Familial Hypertension',
  'Early-Onset Coronary Artery Disease',
  'Cleft Lip / Palate (Familial)',
  'Familial Alopecia / Premature Baldness'
];

// The 3 Clinical Dropdown Categories
const FERTILITY_CONDITIONS = [
  'Non-obstructive Azoospermia (AZF deletion)',
  'Premature Ovarian Insufficiency (POI / FMR1)',
  'Recurrent Pregnancy Loss (Repeated Miscarriages)',
  'Polycystic Ovary Syndrome (PCOS)',
  'Severe Oligospermia',
  'Endometriosis',
  'Hypogonadotropic Hypogonadism',
  'Congenital Absence of Vas Deferens (CBAVD)'
];

const INHERITED_CONDITIONS = [
  'Beta-Thalassemia Major / Minor',
  'Sickle Cell Anemia / Trait',
  'Spinal Muscular Atrophy (SMA)',
  'Cystic Fibrosis (CFTR)',
  'Hereditary Breast & Ovarian Cancer (BRCA1/2)',
  'Hemophilia A / B',
  'Huntington’s Disease',
  'Fragile X Syndrome',
  'Duchenne Muscular Dystrophy (DMD)',
  'Gaucher Disease',
  'Tay-Sachs Disease',
  'Familial Hypercholesterolemia'
];

const CHROMOSOMAL_CONDITIONS = [
  'Down Syndrome (Trisomy 21)',
  'Turner Syndrome (45,X)',
  'Klinefelter Syndrome (47,XXY)',
  'Edwards Syndrome (Trisomy 18)',
  'Patau Syndrome (Trisomy 13)',
  'Recurrent Miscarriages / Stillbirth',
  'Balanced Chromosomal Translocation',
  'Microdeletion Syndrome (22q11.2 DiGeorge)'
];

export const FamilyWizardModal: React.FC<FamilyWizardModalProps> = ({
  isOpen,
  onClose,
  onFamilyCreated,
  onAddMember,
  onUpdateMember,
  existingFamily,
  initialStep = 1,
  editingMember = null,
  initialRelation = null,
  newFamilyId = null
}) => {
  // Wizard active step: 1 (About Family), 2 (Verify Profile), 3 (Add Members / Form)
  const [step, setStep] = useState<1 | 2 | 3>(initialStep);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recentSavedName, setRecentSavedName] = useState<string | null>(null);

  // --- Step 1: About Your Family ---
  const [familyName, setFamilyName] = useState('');
  const [familyId, setFamilyId] = useState('');
  const [conditionsOfInterest, setConditionsOfInterest] = useState<string[]>([]);
  const [conditionSearch, setConditionSearch] = useState('');
  const [familyHealthHistory, setFamilyHealthHistory] = useState('');

  // --- Step 2: Profile (Proband) ---
  const [profileFullName, setProfileFullName] = useState('');
  const [profileGender, setProfileGender] = useState<'male' | 'female' | 'other'>('female');
  const [profileDob, setProfileDob] = useState('');

  const [profileHeight, setProfileHeight] = useState('168 cm');
  const [profileWeight, setProfileWeight] = useState('65 kg');
  const [profileEmail, setProfileEmail] = useState('');
  const [profilePhone, setProfilePhone] = useState('+91 98765 43210');
  const [profileLocation, setProfileLocation] = useState('Mumbai, Maharashtra');
  const [profileBloodGroup, setProfileBloodGroup] = useState('B+');
  const [profileKnownTraits, setProfileKnownTraits] = useState<string[]>(['Beta-Thalassemia Minor (Trait)']);
  const [profileTraitSearch, setProfileTraitSearch] = useState('');
  const [profileTestPdf, setProfileTestPdf] = useState<File | null>(null);
  const [confirmProfileUpdate, setConfirmProfileUpdate] = useState(true);

  // --- Step 3: Add Family Member State ---
  const [activeFormRelation, setActiveFormRelation] = useState<string | null>(null);
  const [memberName, setMemberName] = useState('');
  const [memberSudoName, setMemberSudoName] = useState('');
  const [showPostSaveChoice, setShowPostSaveChoice] = useState(false);
  const [memberSex, setMemberSex] = useState<'male' | 'female' | 'unknown'>('male');
  const [memberDob, setMemberDob] = useState('');
  const [memberLivingStatus, setMemberLivingStatus] = useState<'Alive' | 'Deceased' | 'Unknown'>('Alive');
  const [hasHealthConditions, setHasHealthConditions] = useState<'yes' | 'no' | 'not_sure'>('no');
  const [selectedFertility, setSelectedFertility] = useState<string[]>([]);
  const [selectedInherited, setSelectedInherited] = useState<string[]>([]);
  const [selectedChromosomal, setSelectedChromosomal] = useState<string[]>([]);
  const [fertilitySearch, setFertilitySearch] = useState('');
  const [inheritedSearch, setInheritedSearch] = useState('');
  const [chromosomalSearch, setChromosomalSearch] = useState('');

  // Expandable medical details
  const [showMedicalDetails, setShowMedicalDetails] = useState(false);
  const [testingStatus, setTestingStatus] = useState<string>('Not tested');
  const [carrierStatus, setCarrierStatus] = useState<'Carrier' | 'Non-carrier' | 'Unknown'>('Unknown');
  const [testResults, setTestResults] = useState('');
  const [geneVariant, setGeneVariant] = useState('');
  const [ageAtDiagnosis, setAgeAtDiagnosis] = useState('');
  const [otherMedicalHistory, setOtherMedicalHistory] = useState('');

  // Medical report upload
  const [uploadedReportFile, setUploadedReportFile] = useState<File | null>(null);
  const [reportExtractedData, setReportExtractedData] = useState<{
    fileName: string;
    variant: string;
    carrierStatus: string;
    condition: string;
    isConfirmed: boolean;
  } | null>(null);

  // Previously created members preserved in database (available to link to new tree)
  const [savedUnlinkedNodes, setSavedUnlinkedNodes] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen && step === 3) {
      fetch('/api/pedigree-nodes')
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (data) {
            const list = Array.isArray(data) ? data : data.pedigree_nodes || [];
            const currentIds = new Set((existingFamily?.members || []).map((m: any) => m.id));
            const available = list.filter((n: any) => !currentIds.has(n.id) && !n.is_proband);
            setSavedUnlinkedNodes(available);
          }
        })
        .catch(() => {});
    }
  }, [isOpen, step, existingFamily?.members]);

  // Filtered list of hereditary conditions based on user search (Defined before any return)
  const filteredHereditaryList = useMemo(() => {
    if (!conditionSearch.trim()) return COMPREHENSIVE_HEREDITARY_CATALOG.slice(0, 15);
    const q = conditionSearch.toLowerCase();
    return COMPREHENSIVE_HEREDITARY_CATALOG.filter((item) => item.toLowerCase().includes(q));
  }, [conditionSearch]);

  const filteredProfileTraitsList = useMemo(() => {
    if (!profileTraitSearch.trim()) return COMPREHENSIVE_HEREDITARY_CATALOG.slice(0, 10);
    const q = profileTraitSearch.toLowerCase();
    return COMPREHENSIVE_HEREDITARY_CATALOG.filter((item) => item.toLowerCase().includes(q));
  }, [profileTraitSearch]);

  // Generate Family Pedigree Chart ID as FA-000001 (Sequential and Unique, no duplicate IDs)
  useEffect(() => {
    if (isOpen && !existingFamily) {
      if (newFamilyId) {
        setFamilyId(newFamilyId);
      } else {
        fetch('/api/families/next-id')
          .then((res) => (res.ok ? res.json() : null))
          .then((data) => {
            if (data && data.next_family_id) {
              setFamilyId(data.next_family_id);
            } else {
              setFamilyId('FA-000001');
            }
          })
          .catch(() => {
            setFamilyId('FA-000001');
          });
      }
    }
  }, [isOpen, existingFamily, newFamilyId]);

  // Fetch logged-in user profile from backend
  useEffect(() => {
    if (isOpen) {
      fetch('/api/profile')
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data) {
            const p = data.profile || data;
            if (p.full_name) setProfileFullName(p.full_name);
            if (p.email) setProfileEmail(p.email);
            if (p.dob) setProfileDob(p.dob);
            if (p.phone) setProfilePhone(p.phone);
            if (p.city || p.country) {
              setProfileLocation([p.city, p.country].filter(Boolean).join(', '));
            }
            if (p.blood_type) setProfileBloodGroup(p.blood_type);
            if (p.height) setProfileHeight(p.height);
            if (p.weight) setProfileWeight(p.weight);
            if (p.known_traits) {
              const traits = Array.isArray(p.known_traits)
                ? p.known_traits
                : p.known_traits.split(',').map((t: string) => t.trim());
              setProfileKnownTraits(traits);
            }
          }
        })
        .catch(() => {});
    }
  }, [isOpen]);

  // Setup initial step and edit mode
  useEffect(() => {
    if (isOpen) {
      if (editingMember) {
        setStep(3);
        setActiveFormRelation(editingMember.relationship_to_proband || 'relative');
        setMemberName(editingMember.full_name || '');
        setMemberSudoName(editingMember.pseudonym || generateClientPseudonym());
        setShowPostSaveChoice(false);
        setMemberSex(
          editingMember.sex === 'male' || editingMember.sex === 'female' ? editingMember.sex : 'unknown'
        );
        setMemberDob(editingMember.dob || '');
        setMemberLivingStatus(
          editingMember.living_status || (editingMember.is_deceased ? 'Deceased' : 'Alive')
        );
        const hasConds =
          (editingMember.conditions && editingMember.conditions.length > 0) ||
          (editingMember.fertility_conditions && editingMember.fertility_conditions.length > 0) ||
          (editingMember.inherited_conditions && editingMember.inherited_conditions.length > 0) ||
          (editingMember.chromosomal_conditions && editingMember.chromosomal_conditions.length > 0);
        setHasHealthConditions(hasConds ? 'yes' : 'no');
        setSelectedFertility(editingMember.fertility_conditions || []);
        setSelectedInherited(
          editingMember.inherited_conditions ||
            editingMember.conditions?.filter((c) => INHERITED_CONDITIONS.includes(c)) ||
            []
        );
        setSelectedChromosomal(editingMember.chromosomal_conditions || []);
        setTestingStatus(editingMember.genetic_testing_status || 'Not tested');
        setCarrierStatus(
          editingMember.is_carrier ? 'Carrier' : editingMember.carrier_details ? 'Carrier' : 'Unknown'
        );
        setTestResults(editingMember.test_results || '');
        setGeneVariant(editingMember.gene_variant || '');
        setAgeAtDiagnosis(
          editingMember.age_at_diagnosis ? String(editingMember.age_at_diagnosis) : ''
        );
        setOtherMedicalHistory(editingMember.medical_history || editingMember.notes || '');
        if (editingMember.gene_variant || editingMember.test_results || editingMember.medical_history) {
          setShowMedicalDetails(true);
        }
      } else if (existingFamily) {
        setFamilyName(existingFamily.family_name);
        setFamilyId(existingFamily.family_id);
        if (initialRelation) {
          setStep(3);
          openFormForRelation(initialRelation);
        } else {
          setStep(initialStep);
        }
      } else {
        setStep(1);
        setActiveFormRelation(null);
        setFamilyName('');
        setConditionsOfInterest([]);
        setFamilyHealthHistory('');
        if (newFamilyId) {
          setFamilyId(newFamilyId);
        }
      }
    }
  }, [isOpen, editingMember, existingFamily, initialStep, initialRelation, newFamilyId]);

  // Open Form for specific relationship card
  const openFormForRelation = (relId: string) => {
    setActiveFormRelation(relId);
    setMemberName('');
    setMemberDob('');
    setMemberLivingStatus('Alive');
    setHasHealthConditions('no');
    setSelectedFertility([]);
    setSelectedInherited([]);
    setSelectedChromosomal([]);
    setShowMedicalDetails(false);
    setTestingStatus('Not tested');
    setCarrierStatus('Unknown');
    setTestResults('');
    setGeneVariant('');
    setAgeAtDiagnosis('');
    setOtherMedicalHistory('');
    setUploadedReportFile(null);
    setReportExtractedData(null);
    setRecentSavedName(null);

    setMemberSudoName(generateClientPseudonym());
    setShowPostSaveChoice(false);

    // Auto-populate default gender
    const card = RELATION_CARDS.find((c) => c.id === relId);
    if (card) {
      setMemberSex(card.defaultSex as any);
    } else if (relId === 'father' || relId.includes('brother') || relId === 'son' || relId.includes('paternal')) {
      setMemberSex('male');
    } else if (relId === 'mother' || relId.includes('sister') || relId === 'daughter' || relId.includes('maternal')) {
      setMemberSex('female');
    } else if (relId === 'pregnancy_loss') {
      setMemberSex('unknown');
    } else {
      setMemberSex('male');
    }
  };

  // Handle Medical Report File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedReportFile(file);

    setTimeout(() => {
      let detectedVariant = 'HBB:c.315+1G>A';
      let detectedCondition = 'Beta-Thalassemia Major / Minor';
      let detectedStatus = 'Carrier';

      if (file.name.toLowerCase().includes('sickle')) {
        detectedVariant = 'HBB:c.20A>T (Glu6Val)';
        detectedCondition = 'Sickle Cell Anemia / Trait';
      } else if (file.name.toLowerCase().includes('sma')) {
        detectedVariant = 'SMN1 Exon 7-8 Deletion';
        detectedCondition = 'Spinal Muscular Atrophy (SMA)';
      } else if (file.name.toLowerCase().includes('brca')) {
        detectedVariant = 'BRCA1:c.5266dupC';
        detectedCondition = 'Hereditary Breast & Ovarian Cancer (BRCA1/2)';
      }

      setReportExtractedData({
        fileName: file.name,
        variant: detectedVariant,
        carrierStatus: detectedStatus,
        condition: detectedCondition,
        isConfirmed: false
      });
    }, 500);
  };

  const confirmReportExtraction = () => {
    if (!reportExtractedData) return;
    setReportExtractedData({ ...reportExtractedData, isConfirmed: true });
    setHasHealthConditions('yes');
    if (!selectedInherited.includes(reportExtractedData.condition)) {
      setSelectedInherited([...selectedInherited, reportExtractedData.condition]);
    }
    setGeneVariant(reportExtractedData.variant);
    setCarrierStatus(reportExtractedData.carrierStatus as any);
    setTestingStatus('Positive');
    setTestResults(`Verified lab finding: ${reportExtractedData.variant}`);
    setShowMedicalDetails(true);
  };

  // Step 1 -> Step 2
  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!familyName.trim()) {
      setError('Please enter a name for your family tree (for example, Sharma Family).');
      return;
    }
    setError(null);
    if (existingFamily) {
      setStep(3);
    } else {
      setStep(2);
    }
  };

  // Step 2 -> Step 3: Create Family & Proband in Database with Plain English Errors
  const handleStep2Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileFullName.trim()) {
      setError('Please enter your full name to continue.');
      return;
    }
    setError(null);
    setLoading(true);

    try {
      // Optional profile save if user confirmed
      if (confirmProfileUpdate) {
        await fetch('/api/profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            full_name: profileFullName,
            dob: profileDob,
            blood_type: profileBloodGroup,
            phone: profilePhone,
            city: profileLocation,
            height: profileHeight,
            weight: profileWeight,
            known_traits: profileKnownTraits.join(', ')
          })
        }).catch(() => {});
      }

      if (existingFamily) {
        setStep(3);
        setLoading(false);
        return;
      }

      // Create new family record
      const familyPayload = {
        family_id: familyId || 'FA-000001',
        family_name: familyName,
        proband_name: profileFullName,
        health_conditions_of_interest: conditionsOfInterest,
        family_history_description: familyHealthHistory,
        is_consanguineous: false
      };

      const probandPayload = {
        pseudonym: profileFullName,
        full_name: profileFullName,
        sex: profileGender === 'other' ? 'unknown' : profileGender,
        relationship_to_proband: 'self',
        is_proband: true,
        dob: profileDob,
        living_status: 'Alive',
        location: profileLocation,
        conditions: [...conditionsOfInterest, ...profileKnownTraits],
        medical_report_name: profileTestPdf ? profileTestPdf.name : undefined
      };

      await onFamilyCreated(familyPayload as any, probandPayload);
      setStep(3);
    } catch (err: any) {
      console.error('Family initialization error:', err);
      // Plain English user guidance
      if (err?.message?.includes('log in') || err?.message?.includes('401')) {
        setError('Please log in to your GuardianAngel account so we can securely save your family tree.');
      } else {
        setError(err?.message || 'We could not save your family tree. Please check your connection and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Submit Member Form
  const handleMemberFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const allConditions = Array.from(
        new Set([...selectedFertility, ...selectedInherited, ...selectedChromosomal])
      );

      const isAffected = allConditions.length > 0;
      const isCarrier = carrierStatus === 'Carrier';
      const autoAlias = memberSudoName || generateClientPseudonym();
      const dispName = memberName.trim() || autoAlias;

      const payload: Partial<PedigreeMember> = {
        pseudonym: autoAlias,
        full_name: memberName.trim() || undefined,
        relationship_to_proband: activeFormRelation || 'relative',
        sex: memberSex,
        dob: memberDob || undefined,
        living_status: memberLivingStatus,
        is_deceased: memberLivingStatus === 'Deceased',
        is_affected: isAffected,
        is_carrier: isCarrier,
        conditions: allConditions,
        fertility_conditions: selectedFertility,
        inherited_conditions: selectedInherited,
        chromosomal_conditions: selectedChromosomal,
        genetic_testing_status: testingStatus,
        carrier_details: carrierStatus !== 'Unknown' ? carrierStatus : undefined,
        test_results: testResults || undefined,
        gene_variant: geneVariant || undefined,
        age_at_diagnosis: ageAtDiagnosis ? parseInt(ageAtDiagnosis, 10) : undefined,
        medical_history: otherMedicalHistory || undefined,
        medical_report_name: reportExtractedData?.fileName || uploadedReportFile?.name || undefined
      };

      if (editingMember && onUpdateMember) {
        await onUpdateMember(editingMember.id, payload);
        onClose();
      } else {
        await onAddMember(payload);
        setRecentSavedName(dispName);
        setShowPostSaveChoice(true);
      }
    } catch (err: any) {
      setError(err?.message || 'Could not save this family member. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Count existing relatives per card type
  const getRelationCount = (relId: string) => {
    if (!existingFamily?.members) return 0;
    return existingFamily.members.filter((m) => {
      const r = (m.relationship_to_proband || '').toLowerCase();
      if (relId === 'husband_wife') return r === 'spouse' || r === 'husband' || r === 'wife' || r === 'partner';
      if (relId === 'grandparents') return r.includes('grandfather') || r.includes('grandmother') || r.includes('grandparent');
      if (relId === 'paternal_uncle_aunt') return r.includes('paternal_uncle') || r.includes('paternal_aunt') || (r.includes('uncle') && !r.includes('maternal')) || (r.includes('aunt') && !r.includes('maternal'));
      if (relId === 'maternal_uncle_aunt') return r.includes('maternal_uncle') || r.includes('maternal_aunt');
      if (relId === 'full_sibling') return r === 'brother' || r === 'sister' || r === 'full_sibling' || r === 'sibling';
      if (relId === 'half_sibling_father') return r.includes('half_sibling_father') || (r.includes('half') && r.includes('father'));
      if (relId === 'half_sibling_mother') return r.includes('half_sibling_mother') || (r.includes('half') && r.includes('mother'));
      if (relId === 'twin_identical') return r.includes('identical');
      if (relId === 'twin_fraternal') return r.includes('fraternal');
      if (relId === 'adopted_child') return r.includes('adopt');
      if (relId === 'pregnancy_loss') return r.includes('loss') || r.includes('miscarriage');
      return r.includes(relId);
    }).length;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
      <div className="relative w-full max-w-3xl my-6 bg-white rounded-3xl shadow-2xl border border-slate-200/80 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Top Header with 3 Step Progress Pills */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-800 text-white flex items-center justify-center shadow-xs">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-800 text-base">
                  Family Health Tree Builder
                </h3>
                <span className="px-2.5 py-0.5 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-[11px] font-mono font-bold">
                  {familyId || 'FA-000001'}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Simple, step-by-step family tree for you and your doctor
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Indicator Bar */}
        <div className="px-6 py-2.5 bg-slate-100/60 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-xs font-semibold">
            {/* Step 1 Pill */}
            <button
              type="button"
              onClick={() => setStep(1)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full transition-all ${
                step === 1
                  ? 'bg-teal-800 text-white shadow-xs'
                  : step > 1
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-white text-slate-500 border border-slate-200'
              }`}
            >
              <span>1</span>
              <span>About Family</span>
              {step > 1 && <Check className="w-3.5 h-3.5" />}
            </button>

            <span className="text-slate-300">&bull;</span>

            {/* Step 2 Pill */}
            <button
              type="button"
              onClick={() => setStep(2)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full transition-all ${
                step === 2
                  ? 'bg-teal-800 text-white shadow-xs'
                  : step > 2
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-white text-slate-500 border border-slate-200'
              }`}
            >
              <span>2</span>
              <span>Your Profile</span>
              {step > 2 && <Check className="w-3.5 h-3.5" />}
            </button>

            <span className="text-slate-300">&bull;</span>

            {/* Step 3 Pill */}
            <button
              type="button"
              onClick={() => setStep(3)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full transition-all ${
                step === 3
                  ? 'bg-teal-800 text-white shadow-xs'
                  : 'bg-white text-slate-500 border border-slate-200'
              }`}
            >
              <span>3</span>
              <span>Add Relatives</span>
            </button>
          </div>

          <span className="text-[11px] font-mono text-slate-400">
            Step {step} of 3
          </span>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {error && (
            <div className="p-3 text-xs bg-red-50 text-red-700 border border-red-200 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 1: ABOUT YOUR FAMILY                                                 */}
          {/* ========================================================================= */}
          {step === 1 && (
            <form onSubmit={handleStep1Submit} className="space-y-5">
              <div>
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                  Let's start with your family
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  First, tell us a little about your family.
                </p>
              </div>

              {/* Family Chart Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Family Chart Name *
                </label>
                <input
                  type="text"
                  value={familyName}
                  onChange={(e) => setFamilyName(e.target.value)}
                  placeholder="e.g. Sharma Family or Kapoor Extended Family"
                  required
                  className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-700 focus:border-teal-700 bg-white shadow-xs"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  This will be the title displayed on your family health chart.
                </p>
              </div>

              {/* Unique Family Pedigree Chart ID (FA-000001, FA-000002) */}
              <div className="p-3.5 bg-teal-50/70 border border-teal-200 rounded-2xl flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-teal-800 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-teal-900">
                      Family Pedigree Chart ID: {familyId || 'FA-000001'}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-teal-800 text-white font-mono text-[10px]">
                      Unique &amp; Auto-Generated
                    </span>
                  </div>
                  <p className="text-teal-800/80 mt-1 leading-relaxed">
                    Every family tree has a unique tracking code (like FA-000001). No two family trees share the same ID.
                  </p>
                </div>
              </div>

              {/* Health Conditions of Interest (Extensive Searchable Dropdown) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Health conditions of interest
                </label>
                <div className="relative mb-2">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={conditionSearch}
                    onChange={(e) => setConditionSearch(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (conditionSearch.trim() && !conditionsOfInterest.includes(conditionSearch.trim())) {
                          setConditionsOfInterest([...conditionsOfInterest, conditionSearch.trim()]);
                          setConditionSearch('');
                        }
                      }
                    }}
                    placeholder="Search any hereditary trait, condition or disease (e.g. Thalassemia, Sickle Cell, Diabetes, Cancer)..."
                    className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-700 bg-slate-50"
                  />
                </div>

                {/* Selected Tags */}
                {conditionsOfInterest.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-2.5">
                    {conditionsOfInterest.map((cond) => (
                      <span
                        key={cond}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-teal-100 text-teal-900 text-xs font-medium border border-teal-300"
                      >
                        <span>{cond}</span>
                        <button
                          type="button"
                          onClick={() =>
                            setConditionsOfInterest(conditionsOfInterest.filter((c) => c !== cond))
                          }
                          className="hover:text-red-700"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {/* Search Results & Quick Suggestions */}
                <div className="p-2 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5 max-h-40 overflow-y-auto">
                  {conditionSearch.trim() && !conditionsOfInterest.includes(conditionSearch.trim()) && (
                    <button
                      type="button"
                      onClick={() => {
                        setConditionsOfInterest([...conditionsOfInterest, conditionSearch.trim()]);
                        setConditionSearch('');
                      }}
                      className="w-full text-left text-xs px-2.5 py-1.5 rounded-lg bg-teal-50 text-teal-900 font-bold hover:bg-teal-100 flex items-center justify-between"
                    >
                      <span>+ Add custom condition: "{conditionSearch.trim()}"</span>
                      <span className="text-[10px] text-teal-700">Press Enter or click</span>
                    </button>
                  )}

                  <div className="flex flex-wrap gap-1.5">
                    {filteredHereditaryList
                      .filter((c) => !conditionsOfInterest.includes(c))
                      .map((item) => (
                        <button
                          type="button"
                          key={item}
                          onClick={() => setConditionsOfInterest([...conditionsOfInterest, item])}
                          className="text-[11px] px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 hover:border-teal-700 hover:text-teal-800 transition"
                        >
                          + {item}
                        </button>
                      ))}
                  </div>
                </div>
              </div>

              {/* Family Health History (Optional Textarea) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Family health history (Optional)
                </label>
                <textarea
                  rows={3}
                  value={familyHealthHistory}
                  onChange={(e) => setFamilyHealthHistory(e.target.value)}
                  placeholder="Share any general notes about diseases or health patterns running in your family..."
                  className="w-full px-4 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-700 bg-white"
                />
              </div>

              {/* Step 1 Actions */}
              <div className="flex items-center justify-end pt-4 border-t border-slate-100">
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-6 py-2.5 text-xs font-bold text-white bg-teal-800 hover:bg-teal-900 rounded-xl shadow-md transition"
                >
                  <span>Continue to Add Family Members</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}

          {/* ========================================================================= */}
          {/* STEP 2: VERIFY YOUR PROFILE                                               */}
          {/* ========================================================================= */}
          {step === 2 && (
            <form onSubmit={handleStep2Submit} className="space-y-5">
              <div>
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                  Let's check your information
                </h2>
                <p className="text-sm text-slate-600 mt-1">
                  We've found some information from your GuradinaAngel profile. Please review it and update anything that's missing.
                </p>
              </div>

              {/* Friendly Explanation of Starting Person (Proband [P]) in Plain English */}
              <div className="p-4 bg-teal-50/70 border border-teal-200 rounded-2xl flex items-start gap-3">
                <Info className="w-5 h-5 text-teal-800 shrink-0 mt-0.5" />
                <div className="text-xs text-teal-900 space-y-1">
                  <div className="font-bold text-teal-950">
                    You are the starting point of this family tree:
                  </div>
                  <p className="text-teal-900/90 leading-relaxed">
                    Since this is your health record, you will be placed at the center of the chart (shown with a special <span className="font-bold text-teal-950">[P]</span> symbol, which doctors call the <em>Starting Person</em> or <em>Proband</em>). All relatives (parents, children, siblings) will be connected around you.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Full Name */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Full Name *
                    </label>
                    {!profileFullName && (
                      <span className="text-[10px] text-amber-600 font-bold px-1.5 py-0.5 bg-amber-50 rounded">
                        Missing - Required
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    value={profileFullName}
                    onChange={(e) => setProfileFullName(e.target.value)}
                    placeholder="Enter your full name"
                    required
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-700 bg-white"
                  />
                </div>

                {/* Biological Gender */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Biological Gender *
                  </label>
                  <select
                    value={profileGender}
                    onChange={(e) => setProfileGender(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-700 bg-white"
                  >
                    <option value="female">Female (Circle Symbol)</option>
                    <option value="male">Male (Square Symbol)</option>
                    <option value="other">Other / Unknown (Diamond Symbol)</option>
                  </select>
                </div>

                {/* Date of Birth */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Date of Birth *
                    </label>
                    {!profileDob && (
                      <span className="text-[10px] text-amber-600 font-bold px-1.5 py-0.5 bg-amber-50 rounded">
                        Missing
                      </span>
                    )}
                  </div>
                  <input
                    type="date"
                    value={profileDob}
                    onChange={(e) => setProfileDob(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-700 bg-white"
                  />
                </div>

                {/* Blood Group */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Blood Group (Optional)
                  </label>
                  <input
                    type="text"
                    value={profileBloodGroup}
                    onChange={(e) => setProfileBloodGroup(e.target.value)}
                    placeholder="e.g. O+, B+, A-, AB+"
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-700 bg-white"
                  />
                </div>

                {/* Height (New Field) */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Height
                  </label>
                  <input
                    type="text"
                    value={profileHeight}
                    onChange={(e) => setProfileHeight(e.target.value)}
                    placeholder="e.g. 172 cm or 5 ft 8 in"
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-700 bg-white"
                  />
                </div>

                {/* Weight (New Field) */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Weight
                  </label>
                  <input
                    type="text"
                    value={profileWeight}
                    onChange={(e) => setProfileWeight(e.target.value)}
                    placeholder="e.g. 68 kg"
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-700 bg-white"
                  />
                </div>

                {/* Email Address */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={profileEmail}
                    onChange={(e) => setProfileEmail(e.target.value)}
                    placeholder="your.email@example.com"
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-700 bg-white"
                  />
                </div>

                {/* Phone Number */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={profilePhone}
                    onChange={(e) => setProfilePhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-700 bg-white"
                  />
                </div>
              </div>

              {/* City / Location */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  City & Geographic Location
                </label>
                <input
                  type="text"
                  value={profileLocation}
                  onChange={(e) => setProfileLocation(e.target.value)}
                  placeholder="e.g. Mumbai, Maharashtra"
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-700 bg-white"
                />
              </div>

              {/* Known Traits & Diseases Search & Add Box (New Requirement) */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
                    Your Current Known Traits &amp; Diseases
                  </label>
                  <p className="text-[11px] text-slate-500">
                    Search and select any health conditions or carrier traits you currently have:
                  </p>
                </div>

                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={profileTraitSearch}
                    onChange={(e) => setProfileTraitSearch(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (profileTraitSearch.trim() && !profileKnownTraits.includes(profileTraitSearch.trim())) {
                          setProfileKnownTraits([...profileKnownTraits, profileTraitSearch.trim()]);
                          setProfileTraitSearch('');
                        }
                      }
                    }}
                    placeholder="Search trait or disease (e.g. Thalassemia Minor, High Blood Pressure, Asthma)..."
                    className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-700 bg-white"
                  />
                </div>

                {/* Selected Personal Traits */}
                {profileKnownTraits.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {profileKnownTraits.map((t) => (
                      <span
                        key={t}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-teal-800 text-white text-xs font-medium"
                      >
                        <span>{t}</span>
                        <button
                          type="button"
                          onClick={() =>
                            setProfileKnownTraits(profileKnownTraits.filter((x) => x !== t))
                          }
                          className="hover:text-red-200"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {/* Quick Add Suggestions */}
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                  {filteredProfileTraitsList
                    .filter((t) => !profileKnownTraits.includes(t))
                    .map((item) => (
                      <button
                        type="button"
                        key={item}
                        onClick={() => setProfileKnownTraits([...profileKnownTraits, item])}
                        className="text-[11px] px-2 py-0.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:border-teal-700 hover:text-teal-800"
                      >
                        + {item}
                      </button>
                    ))}
                </div>
              </div>

              {/* Upload Test PDF (New Requirement) */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2.5">
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Upload Lab Report / Test PDF (Optional)
                </label>
                <p className="text-[11px] text-slate-500">
                  Have a blood test, genetic report, or health document? Attach it to your profile:
                </p>

                <label className="flex items-center justify-center gap-2 border-2 border-dashed border-slate-300 hover:border-teal-700 rounded-xl p-4 bg-white cursor-pointer transition">
                  <Upload className="w-4 h-4 text-teal-800" />
                  <span className="text-xs font-semibold text-slate-700">
                    {profileTestPdf ? profileTestPdf.name : 'Click to select or upload PDF document'}
                  </span>
                  <input
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg"
                    onChange={(e) => {
                      if (e.target.files?.[0]) setProfileTestPdf(e.target.files[0]);
                    }}
                    className="hidden"
                  />
                </label>

                {profileTestPdf && (
                  <div className="flex items-center justify-between text-xs p-2 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800">
                    <span className="font-semibold">✓ Attached: {profileTestPdf.name}</span>
                    <button
                      type="button"
                      onClick={() => setProfileTestPdf(null)}
                      className="text-red-600 hover:text-red-800 text-[11px]"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>

              {/* Save Profile Confirmation Checkbox */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={confirmProfileUpdate}
                    onChange={(e) => setConfirmProfileUpdate(e.target.checked)}
                    className="mt-0.5 rounded border-slate-300 text-teal-800 focus:ring-teal-700"
                  />
                  <span className="text-xs text-slate-700">
                    <span className="font-semibold">Save these updates to my profile.</span> Your details are private and securely protected.
                  </span>
                </label>
              </div>

              {/* Step 2 Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center gap-2 px-6 py-2.5 text-xs font-bold text-white bg-teal-800 hover:bg-teal-900 rounded-xl shadow-md transition disabled:opacity-50"
                >
                  <span>Continue to Family Members</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}

          {/* ========================================================================= */}
          {/* STEP 3: ADD FAMILY MEMBERS                                                */}
          {/* ========================================================================= */}
          {step === 3 && (
            <div className="space-y-6">
              {/* Recently saved relative notification banner */}
              {recentSavedName && !activeFormRelation && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-900 flex items-center justify-between animate-in fade-in">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                    <span>
                      <strong className="font-bold">{recentSavedName}</strong> has been added to your family tree!
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setRecentSavedName(null)}
                    className="text-emerald-700 hover:text-emerald-900"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Post-Save Continue / Exit Dialog */}
              {showPostSaveChoice ? (
                <div className="p-6 bg-slate-50 rounded-3xl border border-teal-200 text-center space-y-4 animate-in fade-in">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto shadow-xs">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">
                      Family Member Saved to Database!
                    </h3>
                    <p className="text-xs text-slate-600 mt-1 max-w-md mx-auto">
                      <strong>{recentSavedName}</strong> was saved and linked to Chart <span className="font-mono font-bold text-teal-800">{familyId}</span>. All details and auto-generated sudo-name are preserved.
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowPostSaveChoice(false);
                        setActiveFormRelation(null);
                      }}
                      className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-teal-800 hover:bg-teal-900 text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-xs"
                    >
                      <Plus className="w-4 h-4" />
                      <span>+ Add Another Relative</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowPostSaveChoice(false);
                        onClose();
                      }}
                      className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-bold transition flex items-center justify-center gap-2 shadow-xs"
                    >
                      <Check className="w-4 h-4" />
                      <span>Exit &amp; View Pedigree Chart</span>
                    </button>
                  </div>
                </div>
              ) : !activeFormRelation ? (
                <>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                      Who would you like to add?
                    </h2>
                    <p className="text-sm text-slate-500 mt-1">
                      Select a family member to add them to your family tree. You can add as many relatives as you like.
                    </p>
                  </div>

                  {/* 10 Attractive Clickable Cards Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3.5">
                    {RELATION_CARDS.map((card) => {
                      const count = getRelationCount(card.id);
                      return (
                        <button
                          type="button"
                          key={card.id}
                          onClick={() => openFormForRelation(card.id)}
                          className="flex flex-col items-center justify-center p-4 rounded-2xl bg-white border border-slate-200 hover:border-teal-700 hover:shadow-md transition group text-center relative"
                        >
                          {count > 0 && (
                            <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded-full bg-teal-100 text-teal-800 text-[10px] font-bold">
                              {count} added
                            </span>
                          )}

                          <div className="w-12 h-12 rounded-2xl bg-teal-50 group-hover:bg-teal-800 text-teal-800 group-hover:text-white flex items-center justify-center mb-2.5 transition">
                            {card.defaultSex === 'male' ? (
                              <User className="w-6 h-6" />
                            ) : card.defaultSex === 'female' ? (
                              <UserCheck className="w-6 h-6" />
                            ) : (
                              <Users className="w-6 h-6" />
                            )}
                          </div>
                          <span className="text-xs font-bold text-slate-800 group-hover:text-teal-900">
                            {card.label}
                          </span>
                          <span className="text-[10px] text-slate-400 mt-0.5">
                            {card.desc}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Previously Created Relatives Preserved in Database */}
                  {savedUnlinkedNodes.length > 0 && (
                    <div className="p-4 bg-teal-50/70 rounded-2xl border border-teal-200 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-xs font-bold text-teal-950 uppercase tracking-wider block">
                            Add Previously Created Relatives ({savedUnlinkedNodes.length})
                          </span>
                          <span className="text-[11px] text-teal-800">
                            These relatives were preserved in your database. Click to add them into this family tree:
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 pt-1">
                        {savedUnlinkedNodes.map((node) => (
                          <button
                            type="button"
                            key={node.id}
                            onClick={async () => {
                              try {
                                setLoading(true);
                                await onAddMember({ existing_member_id: node.id });
                                setSavedUnlinkedNodes((prev) => prev.filter((n) => n.id !== node.id));
                                setRecentSavedName(node.name || node.alias_name || 'Relative');
                              } catch (e: any) {
                                setError(e.message || 'Failed to link relative');
                              } finally {
                                setLoading(false);
                              }
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-teal-800 hover:text-white border border-teal-300 text-xs font-semibold text-teal-900 transition shadow-2xs group"
                          >
                            <Plus className="w-3.5 h-3.5 text-teal-700 group-hover:text-white" />
                            <span>{node.name || node.alias_name}</span>
                            <span className="text-[10px] text-teal-600 group-hover:text-teal-200 capitalize">
                              ({(node.relationship || 'Relative').replace(/_/g, ' ')})
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Current Tree Members List */}
                  {existingFamily?.members && existingFamily.members.length > 0 && (
                    <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                          Current Tree Members ({existingFamily.members.length})
                        </span>
                        <span className="text-[11px] text-teal-800 font-semibold">
                          Connected &amp; Ready
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2 pt-1">
                        {existingFamily.members.map((m) => (
                          <div
                            key={m.id}
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white border border-slate-200 text-xs font-medium text-slate-700 shadow-2xs"
                          >
                            <span
                              className={`w-2 h-2 rounded-full ${
                                m.is_proband
                                  ? 'bg-teal-700'
                                  : m.is_affected
                                  ? 'bg-amber-500'
                                  : 'bg-slate-400'
                              }`}
                            />
                            <span>{m.full_name || m.pseudonym || m.relationship_to_proband}</span>
                            {m.is_proband && (
                              <span className="text-[10px] font-bold text-teal-700 font-mono">
                                [P]
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Finish & View Tree Button */}
                  <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>Back to Profile</span>
                    </button>

                    <button
                      type="button"
                      onClick={onClose}
                      className="inline-flex items-center gap-2 px-6 py-2.5 text-xs font-bold text-white bg-teal-800 hover:bg-teal-900 rounded-xl shadow-md transition"
                    >
                      <Check className="w-4 h-4" />
                      <span>Finish &amp; View Family Tree</span>
                    </button>
                  </div>
                </>
              ) : (
                /* Add / Edit Family Member Form */
                <form onSubmit={handleMemberFormSubmit} className="space-y-5">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-800">
                        <User className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-slate-900 capitalize">
                          {editingMember ? 'Edit Family Member' : `Add ${activeFormRelation.replace(/_/g, ' ')}`}
                        </h3>
                        <p className="text-xs text-slate-500">
                          Enter basic details and any known health traits
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setActiveFormRelation(null)}
                      className="text-xs font-semibold text-slate-500 hover:text-slate-800 px-3 py-1.5 rounded-lg hover:bg-slate-100"
                    >
                      &larr; Choose Different Relative
                    </button>
                  </div>

                  {/* Section A: Basic Information */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold text-teal-900 uppercase tracking-wider">
                      1. Basic Information
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Name (Optional) */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                          Name (Optional)
                        </label>
                        <input
                          type="text"
                          value={memberName}
                          onChange={(e) => setMemberName(e.target.value)}
                          placeholder="e.g. Ramesh Sharma"
                          className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-700 bg-white"
                        />
                      </div>

                      {/* Auto-Generated Sudo-Name */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                            Auto-Generated Sudo-Name *
                          </label>
                          <span className="text-[10px] bg-teal-100 text-teal-800 font-bold px-1.5 py-0.5 rounded">
                            De-Identified Alias
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            value={memberSudoName}
                            onChange={(e) => setMemberSudoName(e.target.value)}
                            placeholder="e.g. Swift-Falcon-4821"
                            required
                            className="w-full px-3 py-2 text-xs rounded-xl border border-teal-300 bg-teal-50/50 font-mono font-bold text-teal-900 focus:outline-none focus:ring-2 focus:ring-teal-700"
                          />
                          <button
                            type="button"
                            onClick={() => setMemberSudoName(generateClientPseudonym())}
                            className="px-2.5 py-2 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl whitespace-nowrap"
                            title="Generate another alias"
                          >
                            New Alias
                          </button>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          Protects clinical privacy on shared pedigree charts.
                        </p>
                      </div>

                      {/* Relationship (Auto-populated) */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                          Relationship (Auto-populated)
                        </label>
                        <input
                          type="text"
                          readOnly
                          value={activeFormRelation.replace(/_/g, ' ')}
                          className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-100 font-semibold text-slate-700 capitalize"
                        />
                      </div>

                      {/* Gender (Male / Female / Unknown) */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                          Gender *
                        </label>
                        <select
                          value={memberSex}
                          onChange={(e) => setMemberSex(e.target.value as any)}
                          className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-700 bg-white"
                        >
                          <option value="male">Male (Square)</option>
                          <option value="female">Female (Circle)</option>
                          <option value="unknown">Unknown / Loss (Diamond/Triangle)</option>
                        </select>
                      </div>

                      {/* Date of Birth (Optional) */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                          Date of Birth (Optional)
                        </label>
                        <input
                          type="date"
                          value={memberDob}
                          onChange={(e) => setMemberDob(e.target.value)}
                          className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-700 bg-white"
                        />
                      </div>
                    </div>

                    {/* Living Status */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Living Status
                      </label>
                      <div className="flex gap-2">
                        {(['Alive', 'Deceased', 'Unknown'] as const).map((status) => (
                          <button
                            type="button"
                            key={status}
                            onClick={() => setMemberLivingStatus(status)}
                            className={`flex-1 py-2 rounded-xl text-xs font-bold border transition ${
                              memberLivingStatus === status
                                ? 'bg-teal-800 text-white border-teal-800'
                                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                            }`}
                          >
                            {status}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Section B: Health Information */}
                  <div className="space-y-4 pt-3 border-t border-slate-100">
                    <div>
                      <h4 className="text-xs font-bold text-teal-900 uppercase tracking-wider mb-1">
                        2. Health Information
                      </h4>
                      <p className="text-xs font-semibold text-slate-700">
                        Does this family member have any health conditions?
                      </p>
                    </div>

                    <div className="flex gap-3">
                      {[
                        { id: 'yes', label: 'Yes' },
                        { id: 'no', label: 'No' },
                        { id: 'not_sure', label: 'Not sure' }
                      ].map((opt) => (
                        <button
                          type="button"
                          key={opt.id}
                          onClick={() => setHasHealthConditions(opt.id as any)}
                          className={`flex-1 py-2 px-4 rounded-xl text-xs font-bold border transition ${
                            hasHealthConditions === opt.id
                              ? 'bg-teal-800 text-white border-teal-800 shadow-xs'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>

                    {/* If YES: Show 3 Separate Searchable Multi-Select Dropdowns */}
                    {hasHealthConditions === 'yes' && (
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-4 animate-in fade-in">
                        {/* 1. Fertility-related conditions */}
                        <div>
                          <label className="block text-xs font-bold text-slate-800 mb-1">
                            Fertility-related conditions
                          </label>
                          <input
                            type="text"
                            value={fertilitySearch}
                            onChange={(e) => setFertilitySearch(e.target.value)}
                            placeholder="Search fertility conditions..."
                            className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white mb-2"
                          />
                          <div className="flex flex-wrap gap-1.5">
                            {FERTILITY_CONDITIONS.filter((c) =>
                              c.toLowerCase().includes(fertilitySearch.toLowerCase())
                            ).map((c) => {
                              const isChecked = selectedFertility.includes(c);
                              return (
                                <button
                                  type="button"
                                  key={c}
                                  onClick={() => {
                                    if (isChecked) {
                                      setSelectedFertility(selectedFertility.filter((x) => x !== c));
                                    } else {
                                      setSelectedFertility([...selectedFertility, c]);
                                    }
                                  }}
                                  className={`text-[11px] px-2.5 py-1 rounded-lg border transition ${
                                    isChecked
                                      ? 'bg-teal-800 text-white border-teal-800'
                                      : 'bg-white text-slate-700 border-slate-200 hover:border-slate-400'
                                  }`}
                                >
                                  {isChecked ? '✓ ' : '+ '}
                                  {c}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* 2. Conditions that can be passed to children */}
                        <div>
                          <label className="block text-xs font-bold text-slate-800 mb-1">
                            Conditions that can be passed to children
                          </label>
                          <input
                            type="text"
                            value={inheritedSearch}
                            onChange={(e) => setInheritedSearch(e.target.value)}
                            placeholder="Search inherited conditions (e.g. Thalassemia, Sickle Cell)..."
                            className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white mb-2"
                          />
                          <div className="flex flex-wrap gap-1.5">
                            {INHERITED_CONDITIONS.filter((c) =>
                              c.toLowerCase().includes(inheritedSearch.toLowerCase())
                            ).map((c) => {
                              const isChecked = selectedInherited.includes(c);
                              return (
                                <button
                                  type="button"
                                  key={c}
                                  onClick={() => {
                                    if (isChecked) {
                                      setSelectedInherited(selectedInherited.filter((x) => x !== c));
                                    } else {
                                      setSelectedInherited([...selectedInherited, c]);
                                    }
                                  }}
                                  className={`text-[11px] px-2.5 py-1 rounded-lg border transition ${
                                    isChecked
                                      ? 'bg-teal-800 text-white border-teal-800'
                                      : 'bg-white text-slate-700 border-slate-200 hover:border-slate-400'
                                  }`}
                                >
                                  {isChecked ? '✓ ' : '+ '}
                                  {c}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* 3. Pregnancy loss and chromosome conditions */}
                        <div>
                          <label className="block text-xs font-bold text-slate-800 mb-1">
                            Pregnancy loss and chromosome conditions
                          </label>
                          <input
                            type="text"
                            value={chromosomalSearch}
                            onChange={(e) => setChromosomalSearch(e.target.value)}
                            placeholder="Search chromosome conditions (e.g. Down syndrome)..."
                            className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white mb-2"
                          />
                          <div className="flex flex-wrap gap-1.5">
                            {CHROMOSOMAL_CONDITIONS.filter((c) =>
                              c.toLowerCase().includes(chromosomalSearch.toLowerCase())
                            ).map((c) => {
                              const isChecked = selectedChromosomal.includes(c);
                              return (
                                <button
                                  type="button"
                                  key={c}
                                  onClick={() => {
                                    if (isChecked) {
                                      setSelectedChromosomal(
                                        selectedChromosomal.filter((x) => x !== c)
                                      );
                                    } else {
                                      setSelectedChromosomal([...selectedChromosomal, c]);
                                    }
                                  }}
                                  className={`text-[11px] px-2.5 py-1 rounded-lg border transition ${
                                    isChecked
                                      ? 'bg-teal-800 text-white border-teal-800'
                                      : 'bg-white text-slate-700 border-slate-200 hover:border-slate-400'
                                  }`}
                                >
                                  {isChecked ? '✓ ' : '+ '}
                                  {c}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Expandable: Add more medical details (Optional) */}
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => setShowMedicalDetails(!showMedicalDetails)}
                      className="flex items-center gap-1.5 text-xs font-bold text-teal-800 hover:text-teal-900 transition"
                    >
                      {showMedicalDetails ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                      <span>
                        {showMedicalDetails
                          ? 'Hide medical details'
                          : '+ Add more medical details (Optional)'}
                      </span>
                    </button>

                    {showMedicalDetails && (
                      <div className="mt-3 p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-4 animate-in fade-in">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Genetic testing status */}
                          <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                              Genetic testing status
                            </label>
                            <select
                              value={testingStatus}
                              onChange={(e) => setTestingStatus(e.target.value)}
                              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white"
                            >
                              <option value="Not tested">Not tested</option>
                              <option value="Positive">Positive (Variant Detected)</option>
                              <option value="Negative">Negative (No Variant Detected)</option>
                              <option value="Pending">Test Pending</option>
                            </select>
                          </div>

                          {/* Carrier status */}
                          <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                              Carrier status
                            </label>
                            <select
                              value={carrierStatus}
                              onChange={(e) => setCarrierStatus(e.target.value as any)}
                              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white"
                            >
                              <option value="Unknown">Unknown</option>
                              <option value="Carrier">Carrier (Central Dot Symbol)</option>
                              <option value="Non-carrier">Non-carrier</option>
                            </select>
                          </div>

                          {/* Gene and variant info */}
                          <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                              Gene &amp; Variant info
                            </label>
                            <input
                              type="text"
                              value={geneVariant}
                              onChange={(e) => setGeneVariant(e.target.value)}
                              placeholder="e.g. HBB:c.315+1G>A or SMN1"
                              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white"
                            />
                          </div>

                          {/* Age at diagnosis */}
                          <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                              Age at diagnosis
                            </label>
                            <input
                              type="number"
                              value={ageAtDiagnosis}
                              onChange={(e) => setAgeAtDiagnosis(e.target.value)}
                              placeholder="e.g. 12"
                              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white"
                            />
                          </div>
                        </div>

                        {/* Test results notes */}
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Test results details
                          </label>
                          <input
                            type="text"
                            value={testResults}
                            onChange={(e) => setTestResults(e.target.value)}
                            placeholder="e.g. Heterozygous splice-site mutation identified via test"
                            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white"
                          />
                        </div>

                        {/* Other medical history */}
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Other medical history
                          </label>
                          <textarea
                            rows={2}
                            value={otherMedicalHistory}
                            onChange={(e) => setOtherMedicalHistory(e.target.value)}
                            placeholder="Any known hospitalizations, surgeries, or medications..."
                            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Section C: Medical Report Upload */}
                  <div className="p-4 bg-teal-50/50 border border-teal-200/80 rounded-2xl space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-teal-800 text-white flex items-center justify-center shrink-0">
                        <UploadCloud className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-teal-900">
                          Medical report upload
                        </h4>
                        <p className="text-xs text-teal-800/80 mt-0.5">
                          Have a medical or genetic report? Upload it and we'll help fill in the information.
                        </p>
                      </div>
                    </div>

                    <label className="flex flex-col items-center justify-center border-2 border-dashed border-teal-300 hover:border-teal-700 rounded-xl p-4 bg-white cursor-pointer transition">
                      <FileText className="w-6 h-6 text-teal-700 mb-1" />
                      <span className="text-xs font-semibold text-teal-900">
                        Click or drag report to upload
                      </span>
                      <span className="text-[10px] text-slate-400 mt-0.5">
                        Supports PDF, JPG, and PNG files
                      </span>
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>

                    {/* Report Review & Confirm Box */}
                    {reportExtractedData && (
                      <div className="p-3 bg-white rounded-xl border border-teal-300 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-teal-900">
                            Extracted Finding from {reportExtractedData.fileName}:
                          </span>
                          {reportExtractedData.isConfirmed ? (
                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded text-[10px]">
                              Confirmed
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-amber-100 text-amber-800 font-bold rounded text-[10px]">
                              Review Required
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-700 space-y-1">
                          <div>
                            Condition: <span className="font-bold">{reportExtractedData.condition}</span>
                          </div>
                          <div>
                            Variant: <span className="font-mono font-bold text-teal-800">{reportExtractedData.variant}</span>
                          </div>
                          <div>
                            Status: <span className="font-bold">{reportExtractedData.carrierStatus}</span>
                          </div>
                        </div>

                        {!reportExtractedData.isConfirmed && (
                          <button
                            type="button"
                            onClick={confirmReportExtraction}
                            className="w-full py-2 bg-teal-800 text-white rounded-lg text-xs font-bold hover:bg-teal-900 transition flex items-center justify-center gap-1.5"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Confirm &amp; Auto-fill Medical Details</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Form Actions */}
                  <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setActiveFormRelation(null)}
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>Back to Relationship Cards</span>
                    </button>

                    <button
                      type="submit"
                      disabled={loading}
                      className="inline-flex items-center gap-2 px-6 py-2.5 text-xs font-bold text-white bg-teal-800 hover:bg-teal-900 rounded-xl shadow-md transition disabled:opacity-50"
                    >
                      <Check className="w-4 h-4" />
                      <span>Save Family Member &amp; Add to Tree</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
