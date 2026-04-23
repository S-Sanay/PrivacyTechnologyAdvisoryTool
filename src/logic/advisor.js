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

  return { winner, winnerTech: technologies[winner], techScores, params, justification, combinations, tags };
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
