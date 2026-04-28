import { technologies } from '../data/technologies';

export function computeRecommendation(answers, questions) {
  const scores = { anon: 0, dp: 0, mpc: 0, fl: 0, legal: 0 };
  const tags = {};
  const selectedOptions = [];

  answers.forEach((answerIdx, qIdx) => {
    if (answerIdx === null || answerIdx === undefined) return;
    const q = questions[qIdx];
    const option = q.options[answerIdx];
    selectedOptions.push({ question: q, option, qIdx });

    Object.entries(option.scores).forEach(([tech, score]) => {
      scores[tech] = (scores[tech] || 0) + score;
    });

    if (option.tag) tags[q.id] = option.tag;
  });

  // Shift so minimum score is zero (avoids negative display values)
  const minScore = Math.min(...Object.values(scores));
  if (minScore < 0) {
    Object.keys(scores).forEach(k => { scores[k] -= minScore; });
  }

  const ranked = Object.entries(scores)
    .sort(([, a], [, b]) => b - a)
    .map(([tech, score]) => ({ tech, score }));

  const winner = ranked[0].tech;
  const maxScore = ranked[0].score;

  const techScores = ranked.map(r => ({
    ...r,
    percentage: maxScore > 0 ? Math.round((r.score / maxScore) * 100) : 0,
    tech_data: technologies[r.tech],
  }));

  const params = deriveParameters(winner, tags);
  const justification = deriveJustification(winner, selectedOptions);
  const combinations = technologies[winner].combinations || [];

  const stack = buildStack(winner, combinations, tags, techScores);
  const requirements = buildRequirements(winner, tags, combinations, justification, stack);
  const tradeoffs = buildTradeoffs(stack);
  const rejections = buildRejections(winner, techScores, tags, stack);
  const rollout = buildRollout(winner, tags);
  const idealProfile = deriveIdealProfile(tags);
  const simpleParam = deriveSimpleParam(winner, tags);

  return { winner, winnerTech: technologies[winner], techScores, params, justification, combinations, tags, stack, requirements, tradeoffs, rejections, rollout, idealProfile, simpleParam };
}

function deriveParameters(tech, tags) {
  const sensitivity = tags['sensitivity'];
  const trust = tags['trust'];
  const protectWhat = tags['protect_what'];
  const threatActor = tags['threat_actor'] || tags['goal'];

  if (tech === 'anon') {
    const k = sensitivity === 'extreme_sensitivity' ? 25
      : sensitivity === 'high_sensitivity' ? 10
      : 3;

    const useLDiv = protectWhat === 'protect_attributes' || protectWhat === 'protect_both';
    const l = sensitivity === 'extreme_sensitivity' ? 5
      : sensitivity === 'high_sensitivity' ? 3
      : 2;

    const params = [
      {
        label: 'Recommended k (K-Anonymity)',
        value: `k = ${k}`,
        detail: `Every record must be indistinguishable from at least ${k - 1} others on quasi-identifiers (age, ZIP, gender, etc.).`,
      },
      {
        label: 'Quasi-identifier identification',
        value: 'Audit all linkable attributes',
        detail: 'Enumerate every attribute that, alone or in combination, could enable re-identification — these become the quasi-identifiers to generalize.',
      },
      {
        label: 'Generalization strategy',
        value: 'Value generalization / hierarchy',
        detail: 'Replace specific values with ranges (exact age → decade) or category hierarchies (city → region → country).',
      },
      {
        label: 'Suppression threshold',
        value: '≤ 5% of records',
        detail: 'Records that cannot reach group size k after generalization may be suppressed (removed). Keep suppression below 5% to maintain dataset utility.',
      },
    ];

    if (useLDiv) {
      params.push({
        label: 'L-Diversity (recommended)',
        value: `l = ${l}`,
        detail: `Your data contains sensitive attributes requiring additional protection. Each equivalence class of k records must contain at least ${l} distinct sensitive attribute values to prevent attribute inference.`,
      });
      params.push({
        label: 'L-Diversity variant',
        value: 'Distinct l-diversity (start here)',
        detail: 'Distinct: require l unique values. Entropy: enforce more uniform distribution. Recursive (c,l)-diversity: bound the most frequent value for skewed distributions.',
      });
    }

    return params;
  }

  if (tech === 'dp') {
    let epsilon = sensitivity === 'extreme_sensitivity' ? 0.1
      : sensitivity === 'high_sensitivity' ? 0.5
      : 2.0;
    const mode = trust === 'no_trust' || trust === 'semi_trusted' ? 'Local DP' : 'Central DP';
    // Local DP needs more noise for the same formal guarantee
    if (mode === 'Local DP') epsilon = Math.min(epsilon * 3, 10);

    return [
      {
        label: 'Privacy mode',
        value: mode,
        detail: mode === 'Central DP'
          ? 'A trusted curator aggregates data and adds noise to results. Highest accuracy for a given ε.'
          : 'Each individual randomizes their own data locally before sharing — no trusted curator required, but requires more noise.',
      },
      {
        label: 'Privacy budget (ε)',
        value: `ε = ${epsilon.toFixed(1)}`,
        detail: `Lower ε = stronger privacy, more noise. Community guidance: ε < 1 (strong), 1–3 (moderate), > 3 (weak). Budget is spent per query or training run.`,
      },
      {
        label: 'Delta (δ)',
        value: 'δ = 1 × 10⁻⁶',
        detail: 'Probability that the ε guarantee fails for a given individual. Must remain much smaller than 1/n where n is dataset size.',
      },
      {
        label: 'Noise mechanism',
        value: 'Laplace (counts/sums) or Gaussian (ML)',
        detail: 'Use the Laplace mechanism for counting and sum queries under pure ε-DP. Use the Gaussian mechanism for ML training (DP-SGD) under (ε, δ)-DP.',
      },
      {
        label: 'Privacy budget accounting',
        value: 'Track cumulative ε — required',
        detail: 'Sequential composition: budgets add across queries. Parallel composition: take the max over disjoint subsets. Use Rényi DP or PRV accountants for tighter bounds on DP-SGD.',
      },
    ];
  }

  if (tech === 'mpc') {
    const protocol = tags['parties'] === '2_to_10_orgs'
      ? 'SPDZ or ABY3 (Secret Sharing, 3+ parties)'
      : "Yao's Garbled Circuits (2 parties) or SPDZ (3+ parties)";
    const security = trust === 'no_trust' ? 'Malicious / active security' : 'Semi-honest / passive security';
    const threshold = trust === 'no_trust' ? 't < n / 3' : 't < n / 2';

    return [
      {
        label: 'Recommended protocol',
        value: protocol,
        detail: '2 parties → Garbled Circuits (Yao); 3–10 parties → SPDZ (arithmetic) or GMW/BMR (Boolean). Choose arithmetic for sums/products, Boolean for comparisons.',
      },
      {
        label: 'Security model',
        value: security,
        detail: 'Semi-honest: all parties follow the protocol but may try to learn from transcripts. Malicious: secure even against parties that actively deviate from the protocol.',
      },
      {
        label: 'Corruption threshold',
        value: threshold,
        detail: `Maximum fraction of corrupt (malicious) parties the protocol can tolerate before security breaks.`,
      },
      {
        label: 'Offline / online phase',
        value: 'Leverage offline preprocessing',
        detail: 'SPDZ and related protocols split computation into a data-independent offline (preprocessing) phase and a fast online phase. Precompute during idle time for low online latency.',
      },
      {
        label: 'Communication overhead',
        value: 'Plan for high bandwidth usage',
        detail: 'MPC requires substantial inter-party communication. Co-locate parties in the same data center or cloud region when possible, and batch operations to minimize round trips.',
      },
    ];
  }

  if (tech === 'fl') {
    const addDP = sensitivity === 'high_sensitivity' || sensitivity === 'extreme_sensitivity';
    const addSecAgg = trust === 'no_trust' || trust === 'semi_trusted';

    const params = [
      {
        label: 'Aggregation algorithm',
        value: 'FedAvg (McMahan et al.)',
        detail: 'Average client model updates weighted by local dataset size. Use FedProx for highly heterogeneous (non-IID) data distributions across clients.',
      },
      {
        label: 'Communication rounds',
        value: '50–200 rounds',
        detail: 'Monitor validation accuracy on a held-out set to detect convergence and stop early. More rounds improve accuracy but increase communication cost.',
      },
      {
        label: 'Local training per round',
        value: 'E = 1–5 epochs',
        detail: 'More local epochs reduce communication but risk client drift (divergence from the global objective) on heterogeneous data.',
      },
      {
        label: 'Client sampling',
        value: '5–10% of clients per round',
        detail: 'Randomly sample a fraction of available clients each round for scalability and resilience to client dropouts.',
      },
    ];

    if (addDP) {
      params.push({
        label: 'Privacy enhancement (recommended)',
        value: 'DP-SGD — ε = 1.0, δ = 1 × 10⁻⁵',
        detail: 'Clip local gradients to a maximum L₂ norm, then add Gaussian noise before sharing. Use Opacus (PyTorch) or TF Privacy. Compose privacy across rounds using the moments accountant.',
      });
    }

    if (addSecAgg) {
      params.push({
        label: 'Secure aggregation (recommended)',
        value: 'Bonawitz et al. Secure Aggregation protocol',
        detail: 'Cryptographic protocol ensuring the aggregation server sees only the sum of model updates — individual client updates remain private even from the server.',
      });
    }

    return params;
  }

  if (tech === 'legal') {
    const isConstitutional = threatActor === 'threat_government' || threatActor === 'goal_constitutional';
    const isRegulatory = threatActor === 'threat_company' || threatActor === 'goal_regulatory';

    if (isConstitutional) {
      return [
        {
          label: 'Applicable subcategory',
          value: 'Constitutional Protections — 4th & 5th Amendment',
          detail: 'This framework constrains government power over search, seizure, and compelled disclosure — it does not apply to private organizations.',
        },
        {
          label: '4th Amendment',
          value: 'Warrant + probable cause required',
          detail: 'Government access to your data, devices, or stored communications generally requires a warrant based on probable cause (Riley v. California, 2014; Carpenter v. United States, 2018).',
        },
        {
          label: '5th Amendment',
          value: 'Limits on compelled self-incrimination',
          detail: 'Testimonial content (passwords, PINs, decryption keys) may be protected. Biometric unlocks (fingerprint, face) are less protected — courts are split. Consult counsel for your jurisdiction.',
        },
        {
          label: 'Key factors courts weigh (per Carpenter)',
          value: 'Comprehensiveness · Intimacy · Expense · Retrospectivity · Voluntariness',
          detail: 'Comprehensiveness: how much data is collected. Intimacy: how sensitive. Expense: how cheap/scalable surveillance is. Retrospectivity: ability to reconstruct past behavior. Voluntariness: whether sharing was truly optional.',
        },
        {
          label: 'Technical complement (recommended)',
          value: 'End-to-end encryption + MPC',
          detail: 'Technical controls make data practically inaccessible even when legal process is served. E2E encryption, zero-knowledge proofs, and MPC provide defense in depth alongside constitutional rights.',
        },
      ];
    }

    // Default to regulatory (or general if no tag)
    return [
      {
        label: 'Applicable subcategory',
        value: 'Regulatory Law — ADPPA / GDPR-style frameworks',
        detail: 'This framework constrains how organizations collect, process, retain, and share personal data through enforceable legal obligations.',
      },
      {
        label: 'Data minimization',
        value: 'Collect only what is strictly necessary',
        detail: 'Define the minimum dataset needed for each specific purpose. Enforce limits technically (field restrictions, collection caps) and contractually (DPAs, vendor agreements).',
      },
      {
        label: 'Consent requirements',
        value: 'Explicit, informed, granular, and revocable consent',
        detail: 'Obtain consent that is specific to each purpose, not bundled with general terms, and withdrawable at any time. Document consent events with timestamps and mechanism.',
      },
      {
        label: 'Sensitive data restrictions',
        value: 'Heightened protections for health, financial, biometric, location data',
        detail: 'Apply additional legal constraints (HIPAA, GDPR Art. 9) and technical controls to categories of sensitive data. Default to prohibition unless explicit lawful basis exists.',
      },
      {
        label: 'Enforcement mechanisms',
        value: 'Fines · Private right of action · Regulatory audits',
        detail: 'GDPR: fines up to 4% of global annual revenue. ADPPA (proposed): private right of action. CCPA: $100–$750 per consumer per incident. Maintain audit trails for enforcement defense.',
      },
      {
        label: 'Technical complement (recommended)',
        value: 'Layer with Anonymization and/or Differential Privacy',
        detail: 'Legal frameworks constrain actor behavior; technical controls constrain technical access. Use both for comprehensive defense: regulations prevent misuse, technical tools prevent unauthorized access.',
      },
    ];
  }

  return [];
}

function deriveJustification(tech, selectedOptions) {
  const reasons = [];
  const seen = new Set();

  selectedOptions.forEach(({ question, option }) => {
    const score = option.scores[tech] || 0;
    if (score >= 4 && option.reasons && option.reasons[tech]) {
      const reason = option.reasons[tech];
      if (!seen.has(reason)) {
        seen.add(reason);
        reasons.push(reason);
      }
    }
  });

  return reasons.slice(0, 5);
}

// ─── Extended derivation helpers ───────────────────────────────────────────

const COMBO_NAME_TO_ID = {
  'Differential Privacy': 'dp',
  'Differential Privacy (DP-SGD)': 'dp',
  'Federated Learning': 'fl',
  'Federated Learning (DP-SGD)': 'dp',
  'Secure Multi-Party Computation': 'mpc',
  'Secure MPC': 'mpc',
  'Secure Aggregation (MPC)': 'mpc',
  'Cryptographic Methods (MPC / End-to-End Encryption)': 'mpc',
  'Anonymization Techniques': 'anon',
  'Anonymization': 'anon',
  'K-Anonymity': 'anon',
  'Legal & Constitutional Frameworks': 'legal',
  'Legal Frameworks': 'legal',
};

const PRIMARY_REQUIREMENT = {
  anon:  'Publish a dataset while protecting individual identity',
  dp:    'Generate statistics or train models with formal mathematical privacy guarantees',
  mpc:   'Compute jointly across parties — none seeing each other\'s raw data',
  fl:    'Train ML models on data that cannot be centralized',
  legal: 'Constrain how organizations collect, retain, and use personal data',
};

const PRIMARY_WHY = {
  anon:  'K-anonymity groups every record with k−1 others, preventing individual linkage',
  dp:    'Calibrated noise provably limits how much any one record influences any output',
  mpc:   'Cryptographic protocols reveal only the agreed output — nothing about inputs',
  fl:    'Only gradient updates (never raw data) leave each participant\'s environment',
  legal: 'Enforceable rules constrain what actors are permitted to do, not just able to do',
};

const SUPPORTING_THRESHOLD = 65; // supporting tech must score ≥ 65% of winner to appear

function buildStack(winner, combinations, tags, techScores = []) {
  const scoreMap = Object.fromEntries(techScores.map(t => [t.tech, t.percentage]));
  const stack = [{ techId: winner, role: 'Primary', requirement: PRIMARY_REQUIREMENT[winner], why: PRIMARY_WHY[winner] }];

  const used = new Set([winner]);
  for (const combo of combinations) {
    if (stack.length >= 2) break;
    const id = COMBO_NAME_TO_ID[combo.tech];
    if (!id || used.has(id)) continue;
    if ((scoreMap[id] ?? 0) < SUPPORTING_THRESHOLD) continue;
    used.add(id);
    const role = 'Supporting';
    // Derive short requirement from combo reason
    const why = combo.reason.split('.')[0];
    const reqMap = {
      dp:    'Statistical outputs need formal privacy bounds on top of the primary approach',
      fl:    'Training data must stay distributed across participant environments',
      mpc:   'Computation between parties needs cryptographic zero-disclosure guarantees',
      anon:  'Published dataset must be protected against re-identification attacks',
      legal: 'A regulatory compliance layer is required alongside technical controls',
    };
    stack.push({ techId: id, role, requirement: reqMap[id] || why, why });
  }
  return stack;
}

function buildRequirements(winner, tags, combinations, justification, stack) {
  const stackIds = new Set(stack.map(s => s.techId));
  const reqs = [];

  const add = (text, satisfiers, how, icon) => {
    const primaryMatch = satisfiers.includes(winner);
    const stackMatch = satisfiers.some(id => stackIds.has(id));
    reqs.push({
      text,
      fit: primaryMatch ? 'strong' : stackMatch ? 'moderate' : 'weak',
      techId: satisfiers.find(id => stackIds.has(id)) || satisfiers[0],
      how,
      icon,
    });
  };

  if (tags.ml_training === 'distributed_ml')
    add('Data cannot be centralized for training', ['fl'], 'Models train on-device; only updates are shared', '📡');
  if (tags.trust === 'no_trust')
    add('Zero trust — no party can see another\'s raw data', ['mpc'], 'Cryptographic protocol reveals only the joint output', '🔐');
  if (tags.trust === 'semi_trusted')
    add('Central aggregator present but not fully trusted', ['fl', 'mpc'], 'Secure aggregation hides individual updates', '🔒');
  if (tags.sensitivity === 'extreme_sensitivity')
    add('Extreme data sensitivity — cryptographic protection required', ['mpc', 'dp'], 'Zero-disclosure protocols prevent all information leakage', '🛡️');
  if (tags.sensitivity === 'high_sensitivity')
    add('High sensitivity data requires formal privacy guarantees', ['dp', 'mpc'], 'Mathematical bounds cap worst-case privacy loss per query', '🔏');
  if (tags.accuracy === 'exact_required')
    add('Results must be numerically exact — no noise tolerance', ['mpc', 'anon'], 'Cryptographic computation produces exact outputs', '🎯');
  if (tags.goal === 'goal_regulatory')
    add('Regulatory compliance framework required', ['legal'], 'Law governs what can be collected, retained, and used', '⚖️');
  if (tags.goal === 'goal_constitutional')
    add('Protection from government surveillance or compelled access', ['legal', 'mpc'], 'Constitutional rights + cryptographic inaccessibility', '🏛️');
  if (tags.protect_what === 'protect_parties')
    add("Parties' full datasets must be invisible to each other", ['mpc', 'fl'], 'Only the joint computation result is revealed per party', '🤝');
  if (tags.protect_what === 'protect_identity')
    add('Individual records must not be re-identifiable', ['anon', 'dp'], 'Quasi-identifiers generalized so records cannot be linked', '👤');
  if (tags.protect_what === 'protect_institutional')
    add('Protection from organizational data misuse', ['legal'], 'Enforceable rules constrain what actors are permitted to do', '🏢');
  if (tags.threat_actor === 'threat_government')
    add('Protection from state-level surveillance or subpoenas', ['legal', 'mpc'], 'Constitutional rights plus cryptographic inaccessibility', '🏛️');

  // If we have fewer than 3 requirements, derive from justification
  justification.slice(0, Math.max(0, 4 - reqs.length)).forEach(j => {
    // Shorten justification to a requirement-style phrase
    const shortened = j.length > 80 ? j.slice(0, 78) + '…' : j;
    reqs.push({ text: shortened, fit: 'strong', techId: winner, how: PRIMARY_WHY[winner], icon: '✓' });
  });

  // Always include a primary requirement
  if (!reqs.some(r => r.techId === winner && r.fit === 'strong')) {
    reqs.unshift({ text: PRIMARY_REQUIREMENT[winner], fit: 'strong', techId: winner, how: PRIMARY_WHY[winner], icon: '✓' });
  }

  return reqs.slice(0, 6);
}

const BASE_METRICS = {
  anon:  { privacy: 62, utility: 82, compute: 92, compliance: 78, scalability: 68, adoption: 88 },
  dp:    { privacy: 90, utility: 68, compute: 80, compliance: 90, scalability: 82, adoption: 60 },
  mpc:   { privacy: 97, utility: 90, compute: 28, compliance: 88, scalability: 38, adoption: 22 },
  fl:    { privacy: 72, utility: 76, compute: 55, compliance: 72, scalability: 95, adoption: 65 },
  legal: { privacy: 52, utility: 98, compute: 100, compliance: 98, scalability: 100, adoption: 78 },
};

function buildTradeoffs(stack) {
  const weights = [0.6, 0.3, 0.1];
  const keys = ['privacy', 'utility', 'compute', 'compliance', 'scalability', 'adoption'];
  const result = {};
  keys.forEach(k => { result[k] = 0; });
  let totalW = 0;

  stack.forEach((item, i) => {
    const w = weights[i] ?? 0.1;
    const m = BASE_METRICS[item.techId];
    if (!m) return;
    keys.forEach(k => { result[k] += m[k] * w; });
    totalW += w;
  });

  if (totalW > 0) keys.forEach(k => { result[k] = Math.round(result[k] / totalW); });
  return result;
}

const REJECTION_DATA = {
  anon:  {
    pros: ['Computationally inexpensive, runs on standard hardware', 'No accuracy loss on non-quasi-identifier fields'],
    cons: ['No formal mathematical privacy guarantee', 'Vulnerable to background-knowledge and homogeneity attacks'],
    reasons: {
      distributed_ml: 'Anonymization is designed for static datasets — incompatible with distributed ML training pipelines.',
      no_trust: 'Heuristic anonymization lacks the cryptographic guarantees required in zero-trust multi-party settings.',
      extreme_sensitivity: 'Heuristic anonymization does not satisfy formal guarantee requirements for extreme-sensitivity data.',
      protect_parties: 'Anonymization protects individual records in a dataset — it cannot isolate entire datasets from other parties.',
      default: 'Best suited for static dataset publishing — your scenario requires stronger guarantees or a different output form.',
    },
  },
  dp: {
    pros: ['Formal, mathematically provable (ε, δ) privacy guarantee', 'Composable across multiple queries over time'],
    cons: ['Introduces calibrated noise that reduces output accuracy', 'Privacy budget depletes with each query — not unlimited'],
    reasons: {
      exact_required: 'DP introduces unavoidable statistical noise — incompatible with exact numerical accuracy requirements.',
      protect_parties: 'DP protects individuals within a dataset; it cannot isolate full datasets from other parties.',
      no_trust: 'Under Local DP (no trusted curator), the noise required for the same ε level significantly degrades utility.',
      default: 'The accuracy tradeoff introduced by DP does not align with the primary output requirements in your scenario.',
    },
  },
  mpc: {
    pros: ['Cryptographic zero-disclosure guarantee — parties learn only the output', 'Exact results with no noise or accuracy tradeoff'],
    cons: ['Very high computational and communication overhead', 'Does not scale efficiently beyond ~10 participating parties'],
    reasons: {
      goal_regulatory: 'Your primary concern is constraining organizational behavior — MPC cannot address this; only law can.',
      many_parties: 'MPC protocols do not scale efficiently to many parties — Federated Learning handles large-scale settings better.',
      default: 'MPC\'s significant operational complexity and compute overhead exceed what your stated scenario requires.',
    },
  },
  fl: {
    pros: ['Raw data never leaves its source organization or device', 'Scales to millions of participants by design'],
    cons: ['Gradient updates can leak information without DP-SGD protection', 'Requires ML infrastructure at every participating endpoint'],
    reasons: {
      not_ml: 'Federated Learning is designed for distributed ML training — your use case does not involve training models.',
      exact_required: 'FL model training is inherently approximate — incompatible with exact numerical accuracy requirements.',
      single_party: 'FL is built for distributed settings — centralizing data makes FL unnecessary infrastructure overhead.',
      default: 'Your use case does not require training ML models across distributed data sources — FL\'s design doesn\'t match the need.',
    },
  },
  legal: {
    pros: ['Applies to all legitimately held data — requires no technical circumvention', 'Addresses data collection, purpose limitation, and retention directly'],
    cons: ['No mathematical privacy guarantee — depends entirely on compliance and enforcement', 'Laws may lag behind technological threats by years or decades'],
    reasons: {
      no_trust: 'Zero-trust requirements demand cryptographic guarantees — legal frameworks alone cannot provide these.',
      formal_guarantee: 'Your scenario requires a formal mathematical proof of privacy — regulatory compliance cannot provide this.',
      threat_external: 'External attackers are not constrained by organizational policy or regulation — technical controls are required.',
      default: 'Your primary need is technical data protection — legal frameworks address institutional behavior, not cryptographic access control.',
    },
  },
};

function buildRejections(winner, techScores, tags, stack = []) {
  const stackIds = new Set(stack.map(s => s.techId));
  return techScores
    .filter(t => !stackIds.has(t.tech))
    .slice(0, 3)
    .map(t => {
      const data = REJECTION_DATA[t.tech];
      let reason = data.reasons.default;

      if (t.tech === 'anon') {
        if (tags.ml_training === 'distributed_ml') reason = data.reasons.distributed_ml;
        else if (tags.trust === 'no_trust') reason = data.reasons.no_trust;
        else if (tags.sensitivity === 'extreme_sensitivity') reason = data.reasons.extreme_sensitivity;
        else if (tags.protect_what === 'protect_parties') reason = data.reasons.protect_parties;
      } else if (t.tech === 'dp') {
        if (tags.accuracy === 'exact_required') reason = data.reasons.exact_required;
        else if (tags.protect_what === 'protect_parties') reason = data.reasons.protect_parties;
        else if (tags.trust === 'no_trust') reason = data.reasons.no_trust;
      } else if (t.tech === 'mpc') {
        if (tags.goal === 'goal_regulatory') reason = data.reasons.goal_regulatory;
      } else if (t.tech === 'fl') {
        if (tags.ml_training !== 'distributed_ml') reason = data.reasons.not_ml;
        else if (tags.accuracy === 'exact_required') reason = data.reasons.exact_required;
      } else if (t.tech === 'legal') {
        if (tags.trust === 'no_trust') reason = data.reasons.no_trust;
      }

      return { techId: t.tech, percentage: t.percentage, pros: data.pros, cons: data.cons, reason };
    });
}

const ROLLOUT_PHASES = {
  anon: [
    { phase: 1, name: 'Pilot & Scoping', icon: '🔍', desc: 'Identify all quasi-identifiers and sensitive attributes in a representative sample. Set k and l thresholds with your privacy and legal team.' },
    { phase: 2, name: 'Privacy Evaluation', icon: '🧪', desc: 'Apply anonymization to the pilot dataset. Measure information loss and validate that re-identification risk meets your target with expert review.' },
    { phase: 3, name: 'Compliance Sign-Off', icon: '✅', desc: 'Document methodology for HIPAA Safe Harbor or GDPR de-identification evidence. Obtain legal and privacy counsel approval before any production data release.' },
    { phase: 4, name: 'Production & Governance', icon: '🚀', desc: 'Integrate into your data release pipeline. Establish governance for re-evaluation as source data changes and as external linkage datasets grow.' },
  ],
  dp: [
    { phase: 1, name: 'Privacy Budget Design', icon: '📐', desc: 'Define the privacy budget (ε) with your privacy team based on sensitivity and acceptable accuracy tradeoff. Establish a budget accounting policy before implementation.' },
    { phase: 2, name: 'Pilot Validation', icon: '🧪', desc: 'Apply DP to a representative set of queries or a pilot model. Validate that results remain useful for business decisions at the chosen ε level.' },
    { phase: 3, name: 'Compliance Documentation', icon: '✅', desc: 'Document DP implementation for regulatory review (HIPAA Expert Determination, GDPR Article 25). Define procedures for budget exhaustion and epoch reset.' },
    { phase: 4, name: 'Deployment & Monitoring', icon: '🚀', desc: 'Deploy to production. Monitor cumulative budget consumption. Establish alerts for depletion and a governance process for new analysis requests.' },
  ],
  mpc: [
    { phase: 1, name: 'Stakeholder Alignment', icon: '🤝', desc: 'Define computation objectives, parties, trust model, and data formats with all stakeholders. Agree on security model (semi-honest vs. malicious) and acceptable latency targets.' },
    { phase: 2, name: 'Infrastructure Design', icon: '🏗️', desc: 'Select the appropriate MPC protocol. Design network topology to minimize inter-party communication latency. Plan compute infrastructure for each party.' },
    { phase: 3, name: 'Security Audit', icon: '🔒', desc: 'Engage an independent cryptography firm to audit protocol selection and deployment architecture. Document for GDPR/HIPAA compliance evidence.' },
    { phase: 4, name: 'Staged Rollout', icon: '🚀', desc: 'Deploy with a subset of parties first. Validate correctness and latency under realistic loads. Expand to full deployment after operational sign-off from all parties.' },
  ],
  fl: [
    { phase: 1, name: 'Architecture & Onboarding', icon: '🤝', desc: 'Define the FL objective, participant eligibility, and aggregation server design. Establish participation agreements and data governance policies for all parties.' },
    { phase: 2, name: 'Pilot Training Run', icon: '🧪', desc: 'Run a small-scale pilot with a representative participant subset. Validate model convergence, communication overhead, and data heterogeneity handling.' },
    { phase: 3, name: 'Privacy Enhancement & Compliance', icon: '🔒', desc: 'Layer in DP-SGD and/or Secure Aggregation per sensitivity requirements. Confirm with legal counsel that model updates do not constitute PHI transfer under HIPAA.' },
    { phase: 4, name: 'Full Deployment & Governance', icon: '🚀', desc: 'Scale to full participant population. Monitor convergence, dropout rates, and drift. Establish model version governance and rollback procedures.' },
  ],
  legal: [
    { phase: 1, name: 'Regulatory Mapping', icon: '⚖️', desc: 'Map all applicable regulations (GDPR, HIPAA, CCPA, ADPPA) to your data types and processing activities. Identify compliance gaps with qualified legal counsel.' },
    { phase: 2, name: 'Policy & Control Design', icon: '📋', desc: 'Draft privacy policies, consent mechanisms, data subject rights workflows, and data processing agreements. Establish data minimization and retention schedules.' },
    { phase: 3, name: 'Compliance Validation', icon: '✅', desc: 'Conduct a DPIA/PIA. Validate consent flows, data subject rights, and incident response plans. Engage external auditors for independent review.' },
    { phase: 4, name: 'Ongoing Governance', icon: '🔭', desc: 'Establish a privacy governance committee, annual compliance reviews, and mandatory staff training. Monitor regulatory changes across all relevant jurisdictions.' },
  ],
};

const OPERATIONAL = {
  anon: [
    { area: 'Governance', desc: 'Assign ownership of anonymization parameters (k, l). Document all decisions with justification for audit and regulatory evidence.' },
    { area: 'Auditing', desc: 'Log all released datasets: pipeline version, parameters applied, date, and recipient. Maintain audit trail for regulatory review.' },
    { area: 'Monitoring', desc: 'Re-assess re-identification risk periodically as external linkage datasets grow. Consider automated risk scoring on a quarterly basis.' },
    { area: 'Infrastructure', desc: 'Minimal overhead — anonymization runs as a preprocessing step within existing ETL pipelines.' },
  ],
  dp: [
    { area: 'Governance', desc: 'Establish a privacy budget committee. Centralize the budget register and enforce ε allocation across all use cases and teams.' },
    { area: 'Auditing', desc: 'Log every query and model training run with its ε expenditure. Maintain a cumulative ledger per dataset epoch.' },
    { area: 'Monitoring', desc: 'Alert when cumulative budget exceeds 80% of threshold. Define a budget exhaustion policy and epoch reset procedure before deployment.' },
    { area: 'Infrastructure', desc: 'Low overhead — noise addition is trivial. DP-SGD for ML training adds ~20–50% training time depending on clipping norms.' },
  ],
  mpc: [
    { area: 'Governance', desc: 'Establish multi-party governance agreements before deployment. Define dispute resolution for protocol failures or output challenges.' },
    { area: 'Auditing', desc: 'Log all computation sessions, participating parties, and outcomes. Retain transcripts as cryptographic compliance evidence.' },
    { area: 'Monitoring', desc: 'Monitor inter-party network latency and completion rates. Define timeout and fallback procedures for party dropouts.' },
    { area: 'Infrastructure', desc: 'High overhead — plan for 10–100× the compute of equivalent plaintext computation, plus significant inter-party bandwidth.' },
  ],
  fl: [
    { area: 'Governance', desc: 'Define participant eligibility criteria and exclusion policies. Establish a model governance process for version approval and rollback.' },
    { area: 'Auditing', desc: 'Log all training rounds, participant counts, and aggregated metrics. Track model provenance for compliance and debugging.' },
    { area: 'Monitoring', desc: 'Monitor model convergence, participant dropout rates, and cross-participant data distribution drift over time.' },
    { area: 'Infrastructure', desc: 'Moderate — requires a central aggregation server and FL client at each participant. Communication scales with model size and round frequency.' },
  ],
  legal: [
    { area: 'Governance', desc: 'Establish a data governance committee with privacy, legal, and IT representation. Assign clear data ownership and stewardship roles.' },
    { area: 'Auditing', desc: 'Maintain GDPR Article 30 processing records. Log all consent events, data subject requests, and incident responses with timestamps.' },
    { area: 'Monitoring', desc: 'Track regulatory changes across applicable jurisdictions. Subscribe to enforcement authority guidance and adapt policies proactively.' },
    { area: 'Infrastructure', desc: 'Primarily organizational — consent management platforms, data catalog tools, and incident response workflows. Minimal compute overhead.' },
  ],
};

function buildRollout(winner) {
  return {
    phases: ROLLOUT_PHASES[winner] || ROLLOUT_PHASES.dp,
    operational: OPERATIONAL[winner] || OPERATIONAL.dp,
  };
}

function deriveIdealProfile(tags) {
  const sens = tags.sensitivity;
  const trust = tags.trust;
  const goal = tags.goal;
  const threat = tags.threat_actor;
  const ml = tags.ml_training;
  const accuracy = tags.accuracy;

  return {
    privacy: sens === 'extreme_sensitivity' ? 97
           : sens === 'high_sensitivity' ? 88
           : 72,
    utility: accuracy === 'exact_required' ? 97
           : trust === 'no_trust' ? 58
           : 74,
    compute: trust === 'no_trust' ? 42
           : sens === 'extreme_sensitivity' ? 52
           : 72,
    scalability: ml === 'distributed_ml' ? 90
               : trust === 'no_trust' ? 48
               : 65,
    adoption: trust === 'no_trust' ? 38
            : sens === 'extreme_sensitivity' ? 48
            : 70,
    compliance: goal === 'goal_regulatory' ? 95
              : threat === 'threat_company' ? 85
              : threat === 'threat_government' ? 80
              : 62,
  };
}

function deriveSimpleParam(tech, tags) {
  if (tech === 'dp') {
    const sens = tags.sensitivity;
    let eps = sens === 'extreme_sensitivity' ? 0.1 : sens === 'high_sensitivity' ? 0.5 : 2.0;
    if (tags.trust === 'no_trust' || tags.trust === 'semi_trusted') eps = Math.min(eps * 3, 10);
    const logMin = Math.log10(0.01), logMax = Math.log10(10);
    const pct = Math.round(((Math.log10(Math.max(eps, 0.01)) - logMin) / (logMax - logMin)) * 100);
    const mode = (tags.trust === 'no_trust' || tags.trust === 'semi_trusted') ? 'Local DP' : 'Central DP';
    const context = eps < 1 ? 'Strong privacy — small accuracy reduction'
                 : eps < 3 ? 'Balanced — moderate privacy/utility tradeoff'
                 : 'Higher utility — weaker formal guarantee';
    return { name: 'Privacy Budget (ε)', leftLabel: 'Strict Privacy', rightLabel: 'Higher Utility',
             value: `ε = ${eps.toFixed(1)}`, subvalue: mode, pct, markers: ['0.01', '0.1', '1', '5', '10'], context,
             recommendedZone: { from: 33, to: 67 }, zoneLabel: 'ε = 0.1 → 1.0',
             description: 'Epsilon (ε) bounds how much a single person\'s data can shift any query result. Every answer is randomized by noise calibrated to ε — lower values add more noise for stronger privacy; higher values add less noise for more accurate outputs.' };
  }

  if (tech === 'anon') {
    const sens = tags.sensitivity;
    const k = sens === 'extreme_sensitivity' ? 25 : sens === 'high_sensitivity' ? 10 : 3;
    const pct = Math.round(((Math.min(k, 50) - 2) / 48) * 100);
    const context = k <= 3 ? 'Baseline — suitable for low-sensitivity data'
                 : k <= 10 ? 'Standard — recommended for most business data'
                 : 'Strong — required for high-sensitivity or public datasets';
    return { name: 'K-Anonymity Level', leftLabel: 'Less Utility Loss', rightLabel: 'Stronger Protection',
             value: `k = ${k}`, subvalue: null, pct, markers: ['k=2', 'k=5', 'k=10', 'k=25', 'k=50'], context,
             recommendedZone: { from: 6, to: 48 }, zoneLabel: 'k = 5 → 25',
             description: 'k is the minimum group size every record must belong to. The dataset is generalized (e.g., broadening ages or zip codes) and partially suppressed until no individual can be singled out from at least k−1 others who share the same identifying attributes.' };
  }

  if (tech === 'fl') {
    const pct = 13;
    return { name: 'Client Participation Rate', leftLabel: 'Fewer clients / round', rightLabel: 'More clients / round',
             value: '5–10%', subvalue: 'per training round', pct, markers: ['1%', '5%', '10%', '25%', '50%'],
             context: 'Sample 5–10% of available participants per round for scalability and dropout resilience',
             recommendedZone: { from: 8, to: 18 }, zoneLabel: '5% → 10% per round',
             description: 'Each training round, only a random fraction of clients are selected to download the global model, train locally on their own data, and return only gradient updates — never raw data. This rate balances convergence speed against the cost of coordinating large numbers of devices per round.' };
  }

  return null;
}
