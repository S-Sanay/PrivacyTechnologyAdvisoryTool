// scores: { anon, dp, mpc, fl, legal }
// anon = Anonymization (K-Anonymity + L-Diversity)
// dp   = Differential Privacy
// mpc  = Secure Multi-Party Computation (Cryptographic Methods)
// fl   = Federated Learning
// legal = Legal & Constitutional Frameworks

export const questions = [
  {
    id: 'goal',
    question: "What is your organization's primary privacy objective?",
    subtitle: 'Select the option that best describes what you are trying to accomplish.',
    options: [
      {
        text: 'Publish or share a dataset while protecting individual privacy',
        detail: 'Release data — for research, partners, or public use — with individual records de-identified',
        scores: { anon: 5, dp: 1, mpc: 0, fl: 0, legal: 0 },
        reasons: {
          anon: 'Publishing a de-identified dataset — while protecting individual records — is the core use case for Anonymization.',
        },
      },
      {
        text: 'Run private queries or analyses on sensitive data',
        detail: 'Answer statistical questions or build models with formal, provable privacy guarantees',
        scores: { anon: 1, dp: 5, mpc: 1, fl: 0, legal: 0 },
        reasons: {
          dp: 'Private querying with formal mathematical guarantees is exactly what Differential Privacy is designed for.',
        },
      },
      {
        text: 'Collaborate with other organizations without exposing raw data',
        detail: 'Multiple parties want joint insights while keeping their own data private from each other',
        scores: { anon: 0, dp: 1, mpc: 5, fl: 2, legal: 1 },
        reasons: {
          mpc: 'Cross-organization collaboration with zero raw data exposure is the primary use case for Secure MPC.',
          fl: 'Collaborative model training across organizations is a natural fit for Federated Learning.',
        },
      },
      {
        text: 'Train machine learning models on sensitive or distributed data',
        detail: 'Build AI/ML models across data that cannot or should not be moved to a central location',
        scores: { anon: 0, dp: 2, mpc: 1, fl: 5, legal: 0 },
        reasons: {
          fl: 'Training ML models on data that must stay distributed is exactly what Federated Learning was built for.',
          dp: 'Centralized ML on sensitive data can use DP-SGD for formally private model training.',
        },
      },
      {
        text: 'Constrain how organizations collect, retain, or use personal data',
        detail: 'Establish legal rules, consent mechanisms, or compliance frameworks — the risk is institutional misuse, not a technical data breach',
        scores: { anon: 0, dp: 0, mpc: 0, fl: 0, legal: 6 },
        tag: 'goal_regulatory',
        reasons: {
          legal: 'When the objective is constraining organizational data collection and use, Regulatory Law is the primary mechanism — it addresses what technical tools cannot.',
        },
      },
      {
        text: 'Protect against government surveillance or compelled data disclosure',
        detail: 'Guard against law enforcement access, surveillance programs, or legally compelled decryption / disclosure',
        scores: { anon: 0, dp: 0, mpc: 1, fl: 0, legal: 6 },
        tag: 'goal_constitutional',
        reasons: {
          legal: 'Constitutional protections (4th and 5th Amendment principles) are the primary defense against government surveillance and compelled disclosure.',
          mpc: 'Cryptographic controls like end-to-end encryption and MPC complement constitutional rights by making data practically inaccessible even with legal process.',
        },
      },
    ],
  },

  {
    id: 'threat_actor',
    question: 'Who poses the greatest privacy risk in your scenario?',
    subtitle: 'Understanding the threat actor is critical — different actors require fundamentally different defenses.',
    options: [
      {
        text: 'External adversaries — hackers, data thieves, or unauthorized third parties',
        detail: 'The main risk is unauthorized outside access to data you hold',
        scores: { anon: 2, dp: 2, mpc: 2, fl: 2, legal: 0 },
        reasons: {
          anon: 'External re-identification attacks are exactly what Anonymization guards against.',
          dp: 'DP\'s formal guarantee holds against arbitrary external adversaries with any background knowledge.',
          mpc: 'MPC\'s cryptographic guarantee protects inputs from any external observer.',
        },
      },
      {
        text: 'Organizations or companies misusing legitimately held data',
        detail: 'The data controller, its employees, or business partners could misuse, over-share, or over-retain data',
        scores: { anon: 1, dp: 1, mpc: 0, fl: 0, legal: 5 },
        tag: 'threat_company',
        reasons: {
          legal: 'Organizational misuse of legitimately collected data cannot be prevented by encryption alone — Regulatory Law is the primary control mechanism.',
        },
      },
      {
        text: 'Government agencies, law enforcement, or surveillance programs',
        detail: 'The main risk is state-level surveillance, subpoenas, national security letters, or court-compelled disclosure',
        scores: { anon: 0, dp: 1, mpc: 2, fl: 0, legal: 5 },
        tag: 'threat_government',
        reasons: {
          legal: 'Constitutional protections — 4th Amendment warrant requirements, 5th Amendment limits on compelled disclosure — are the primary framework against government access.',
          mpc: 'Strong cryptographic controls can complement legal rights by making data technically inaccessible even when legal process is served.',
        },
      },
      {
        text: 'Multiple threat vectors — technical attacks and institutional risks simultaneously',
        detail: 'We face both external attackers and risks from internal or governmental actors',
        scores: { anon: 2, dp: 2, mpc: 2, fl: 1, legal: 3 },
        reasons: {
          legal: 'A multi-threat environment requires legal frameworks as part of a layered defense alongside technical controls.',
        },
      },
    ],
  },

  {
    id: 'data_location',
    question: 'Where does the sensitive data currently reside?',
    subtitle: 'Data distribution is one of the strongest architectural signals for selecting the right privacy approach.',
    options: [
      {
        text: 'All centralized within our organization',
        detail: 'A single database, data warehouse, or repository holds all the data',
        scores: { anon: 3, dp: 3, mpc: 0, fl: 0, legal: 2 },
        reasons: {
          anon: 'Centralized data is straightforward to process with Anonymization — no cross-party coordination needed.',
          dp: 'A central trusted curator can apply Differential Privacy directly to the dataset.',
          legal: 'Centralized data is precisely what regulatory law governs — data minimization and use restrictions apply directly.',
        },
      },
      {
        text: 'Distributed across 2–10 partner organizations',
        detail: 'Multiple organizations each hold a portion of the relevant data',
        scores: { anon: 0, dp: 1, mpc: 5, fl: 3, legal: 1 },
        reasons: {
          mpc: 'Data split across a small number of distrusting partners is the textbook scenario for Secure MPC.',
          fl: 'A small set of partner organizations can train collaboratively via Federated Learning without sharing raw data.',
        },
      },
      {
        text: 'On many individual user devices or edge endpoints',
        detail: 'Data lives on phones, IoT devices, browsers, or distributed edge infrastructure',
        scores: { anon: 0, dp: 1, mpc: 1, fl: 5, legal: 1 },
        reasons: {
          fl: 'Data on millions of end-user devices is the canonical Federated Learning scenario — training happens locally.',
        },
      },
    ],
  },

  {
    id: 'parties',
    question: 'How many parties are involved in the computation or data access?',
    subtitle: 'Scale affects which protocols are practical, secure, and economically viable.',
    options: [
      {
        text: 'Just our organization',
        detail: 'We are the sole data holder and the only party running analyses',
        scores: { anon: 3, dp: 3, mpc: 0, fl: 0, legal: 3 },
        reasons: {
          anon: 'Single-party data ownership simplifies Anonymization — no coordination overhead.',
          dp: 'A single trusted curator is the standard model for Central Differential Privacy.',
          legal: 'Regulatory law directly governs single-organization data practices.',
        },
      },
      {
        text: '2 to 10 organizations',
        detail: 'A small consortium of partners collaborating on joint data analysis',
        scores: { anon: 0, dp: 1, mpc: 5, fl: 2, legal: 1 },
        reasons: {
          mpc: '2–10 parties is the ideal range for Secure MPC — protocols like SPDZ are highly optimized for this scale.',
        },
      },
      {
        text: 'Many organizations or thousands of devices',
        detail: 'A large federation, open platform, or fleet of edge devices',
        scores: { anon: 0, dp: 1, mpc: 0, fl: 5, legal: 1 },
        reasons: {
          fl: 'Federated Learning scales to millions of participants — it was specifically designed for this regime.',
        },
      },
    ],
  },

  {
    id: 'trust',
    question: 'What is the trust model between the parties involved?',
    subtitle: 'Trust assumptions fundamentally determine which privacy guarantees are necessary.',
    options: [
      {
        text: 'A single trusted curator or our organization controls all data',
        detail: 'One party can be fully trusted to see all raw data and apply privacy measures correctly',
        scores: { anon: 3, dp: 3, mpc: 0, fl: 1, legal: 2 },
        tag: 'trusted_central',
        reasons: {
          anon: 'A trusted curator is the natural operator of an Anonymization pipeline.',
          dp: 'A trusted curator enables Central DP — far more accurate than Local DP.',
          legal: 'A trusted curator still needs legal accountability mechanisms to prevent future misuse.',
        },
      },
      {
        text: 'A central server exists, but we do not fully trust it',
        detail: 'An aggregator or cloud server is present but could be compromised or act dishonestly',
        scores: { anon: 1, dp: 2, mpc: 2, fl: 3, legal: 2 },
        tag: 'semi_trusted',
        reasons: {
          fl: 'A semi-trusted aggregator is the standard FL setup — the server aggregates gradients but never sees raw data.',
          mpc: 'A semi-trusted central party can be managed with Secure Aggregation (a lightweight MPC protocol).',
        },
      },
      {
        text: 'No single party should ever see another party\'s raw data',
        detail: 'Strong zero-trust requirement — each party\'s data must be cryptographically protected from all others',
        scores: { anon: 0, dp: 1, mpc: 5, fl: 2, legal: 2 },
        tag: 'no_trust',
        reasons: {
          mpc: 'Zero-trust between parties demands Secure MPC — its cryptographic guarantees hold even against actively malicious participants.',
        },
      },
    ],
  },

  {
    id: 'output_type',
    question: 'What type of output does your use case require?',
    subtitle: 'The form of the desired output constrains which privacy mechanisms are applicable.',
    options: [
      {
        text: 'A shareable, anonymized dataset that others can freely query',
        detail: 'A published table or file that external analysts or researchers can explore at will',
        scores: { anon: 5, dp: 1, mpc: 0, fl: 0, legal: 0 },
        reasons: {
          anon: 'Producing a shareable, queryable de-identified dataset is Anonymization\'s primary output.',
        },
      },
      {
        text: 'Aggregate statistics, summaries, or query results',
        detail: 'Counts, averages, histograms, or other derived statistics — not the raw data itself',
        scores: { anon: 1, dp: 5, mpc: 2, fl: 0, legal: 0 },
        reasons: {
          dp: 'Private release of aggregate statistics is Differential Privacy\'s core strength.',
          mpc: 'MPC can jointly compute aggregate statistics across parties without sharing any inputs.',
        },
      },
      {
        text: 'A trained machine learning model or prediction service',
        detail: 'An AI model artifact or API that can be deployed or shared',
        scores: { anon: 0, dp: 2, mpc: 0, fl: 5, legal: 0 },
        reasons: {
          fl: 'Training and releasing an ML model from distributed data is Federated Learning\'s defining output.',
          dp: 'DP-SGD can provide formal privacy guarantees for centrally trained model artifacts.',
        },
      },
      {
        text: 'A specific joint computation result',
        detail: 'One precise answer computed over all parties\' data combined (e.g., joint sum, set intersection, ranking)',
        scores: { anon: 0, dp: 1, mpc: 5, fl: 0, legal: 0 },
        reasons: {
          mpc: 'Exact joint computation across distrusting parties is the canonical Secure MPC use case.',
        },
      },
      {
        text: 'A compliance framework, policy, or legal constraint on data use',
        detail: 'We need rules governing how data is collected, retained, and used — not a technical data output',
        scores: { anon: 0, dp: 0, mpc: 0, fl: 0, legal: 5 },
        reasons: {
          legal: 'Constraining data collection and use through enforceable policy is precisely what Legal Frameworks deliver.',
        },
      },
    ],
  },

  {
    id: 'accuracy',
    question: 'How critical is exact numerical accuracy in your outputs?',
    subtitle: 'Some privacy techniques introduce calibrated noise as their core privacy mechanism.',
    options: [
      {
        text: 'Results must be exact — any inaccuracy is unacceptable',
        detail: 'Business rules, auditing requirements, or downstream systems demand precise values',
        scores: { anon: 3, dp: -1, mpc: 4, fl: 1, legal: 2 },
        tag: 'exact_required',
        reasons: {
          mpc: 'MPC computes exact results with no noise — suitable when precision is non-negotiable.',
          anon: 'Anonymization preserves exact non-generalized values rather than adding noise.',
          legal: 'Legal frameworks impose no accuracy tradeoff — compliance requirements are independent of result precision.',
        },
      },
      {
        text: 'Small statistical noise is acceptable for stronger privacy',
        detail: 'We can tolerate 1–5% error in exchange for formal privacy guarantees',
        scores: { anon: 2, dp: 4, mpc: 1, fl: 3, legal: 2 },
        reasons: {
          dp: 'Calibrated noise is Differential Privacy\'s mechanism — tunable to your specific accuracy/privacy tradeoff.',
          fl: 'FL model accuracy degrades gracefully; small noise from DP-SGD is well-tolerated in practice.',
        },
      },
      {
        text: 'Significant approximation is fine — privacy is the top priority',
        detail: 'We prioritize maximum privacy and can accept larger accuracy tradeoffs',
        scores: { anon: 0, dp: 5, mpc: 0, fl: 3, legal: 2 },
        reasons: {
          dp: 'High-privacy DP settings (small epsilon) introduce substantial noise — best when accuracy is secondary to privacy.',
        },
      },
    ],
  },

  {
    id: 'sensitivity',
    question: 'How sensitive is the data your organization is working with?',
    subtitle: 'Sensitivity level determines both the strength of protections needed and their legal classification.',
    options: [
      {
        text: 'Moderately sensitive — basic PII or general business records',
        detail: 'Names, addresses, demographics, or routine business data — sensitive but not critical',
        scores: { anon: 4, dp: 2, mpc: 1, fl: 1, legal: 2 },
        tag: 'low_sensitivity',
        reasons: {
          anon: 'Moderate sensitivity is a good fit for Anonymization\'s practical, heuristic-based protections.',
          legal: 'Even moderate PII falls under most data protection regulations — basic compliance is required.',
        },
      },
      {
        text: 'Highly sensitive — medical, financial, or legal records',
        detail: 'Health data, financial transactions, or legal matters where exposure causes serious harm',
        scores: { anon: 2, dp: 4, mpc: 3, fl: 2, legal: 3 },
        tag: 'high_sensitivity',
        reasons: {
          dp: 'Highly sensitive data requires formal privacy guarantees — DP provides rigorous, auditable worst-case bounds.',
          mpc: 'Sensitive multi-party health or financial data warrants MPC\'s cryptographic protections.',
          legal: 'HIPAA, GDPR Article 9, and similar laws impose heightened obligations for sensitive data categories.',
        },
      },
      {
        text: 'Extremely sensitive — government, critical infrastructure, or trade secrets',
        detail: 'Data where any exposure could cause catastrophic harm, legal liability, or national security risk',
        scores: { anon: 0, dp: 3, mpc: 5, fl: 2, legal: 3 },
        tag: 'extreme_sensitivity',
        reasons: {
          mpc: 'Extreme sensitivity demands MPC\'s cryptographic zero-disclosure guarantees — no party ever sees another\'s raw data.',
          dp: 'Even with MPC, DP adds a complementary formal privacy layer for extremely sensitive data.',
          legal: 'Classified or critical infrastructure data is subject to specialized legal regimes beyond commercial privacy law.',
        },
      },
    ],
  },

  {
    id: 'regulations',
    question: 'Which regulatory or legal frameworks apply to your data?',
    subtitle: 'Legal constraints can mandate or strongly favor specific privacy approaches.',
    options: [
      {
        text: 'No specific data protection regulations at this time',
        detail: 'We operate without strict legal privacy requirements currently',
        scores: { anon: 3, dp: 2, mpc: 1, fl: 1, legal: 1 },
        reasons: {
          anon: 'Without regulatory mandates, Anonymization offers a practical, well-understood baseline protection.',
        },
      },
      {
        text: 'GDPR (EU General Data Protection Regulation)',
        detail: 'Operating in the EU or processing data of EU residents',
        scores: { anon: 2, dp: 3, mpc: 2, fl: 2, legal: 3 },
        reasons: {
          legal: 'GDPR\'s requirements for consent, data minimization, purpose limitation, and data subject rights are directly addressed by legal compliance frameworks.',
          dp: 'GDPR\'s "data protection by design" principle (Article 25) aligns well with DP\'s formal guarantees.',
        },
      },
      {
        text: 'HIPAA (US Health Insurance Portability and Accountability Act)',
        detail: 'Processing Protected Health Information (PHI) in the United States',
        scores: { anon: 2, dp: 3, mpc: 3, fl: 2, legal: 3 },
        reasons: {
          legal: 'HIPAA\'s Privacy Rule directly constrains how PHI is used, shared, and retained — legal compliance is required.',
          dp: 'HIPAA\'s Expert Determination de-identification path accepts DP\'s formal statistical proof.',
          anon: 'HIPAA\'s Safe Harbor method effectively specifies a form of K-Anonymity (18 identifier removal).',
        },
      },
      {
        text: 'CCPA or other state/sector-specific regulations',
        detail: 'California Consumer Privacy Act, FERPA, COPPA, or similar frameworks',
        scores: { anon: 2, dp: 2, mpc: 2, fl: 2, legal: 3 },
        reasons: {
          legal: 'CCPA and similar statutes impose consumer rights, opt-out requirements, and data sale restrictions that require legal compliance frameworks.',
        },
      },
      {
        text: 'Multiple strict regulations or classified data requirements',
        detail: 'Subject to several overlapping legal regimes or government-level security classification',
        scores: { anon: 1, dp: 3, mpc: 4, fl: 2, legal: 4 },
        reasons: {
          legal: 'Overlapping strict regulatory requirements demand a comprehensive legal compliance program as the governance layer.',
          mpc: 'Multiple strict regulations often indicate multi-party data sharing — MPC provides cryptographic compliance evidence.',
        },
      },
    ],
  },

  {
    id: 'compute_budget',
    question: 'What computational resources can you dedicate to the privacy system?',
    subtitle: 'Privacy techniques vary enormously in computational and operational overhead.',
    options: [
      {
        text: 'Limited — efficiency and low cost are critical',
        detail: 'We need a solution that runs on standard infrastructure without significant overhead',
        scores: { anon: 4, dp: 3, mpc: 0, fl: 2, legal: 5 },
        reasons: {
          anon: 'Anonymization is computationally inexpensive — runs efficiently on standard hardware.',
          dp: 'Adding calibrated noise is nearly free computationally — DP scales well under resource constraints.',
          legal: 'Legal frameworks impose zero computational overhead — they operate through policy and enforcement, not computation.',
        },
      },
      {
        text: 'Moderate — some overhead is acceptable for meaningful privacy benefits',
        detail: 'We can invest in reasonable infrastructure if it delivers clear value',
        scores: { anon: 2, dp: 3, mpc: 2, fl: 3, legal: 3 },
        reasons: {
          fl: 'FL\'s communication overhead is manageable with moderate infrastructure investment.',
        },
      },
      {
        text: 'High — we can invest heavily in compute if privacy demands it',
        detail: 'Resources are not a binding constraint — correctness and privacy take priority',
        scores: { anon: 1, dp: 2, mpc: 5, fl: 3, legal: 1 },
        reasons: {
          mpc: 'MPC protocols — especially malicious-secure variants — are computationally expensive. High resource availability makes them feasible.',
        },
      },
    ],
  },

  {
    id: 'protect_what',
    question: 'What specifically needs to be protected in your scenario?',
    subtitle: 'Different privacy threats require fundamentally different technical and legal countermeasures.',
    options: [
      {
        text: 'Individual identity — prevent re-identification of records in a dataset',
        detail: 'Records must not be linkable back to specific named individuals through quasi-identifier combinations',
        scores: { anon: 5, dp: 2, mpc: 1, fl: 1, legal: 1 },
        tag: 'protect_identity',
        reasons: {
          anon: 'Preventing re-identification through quasi-identifier linkage is K-Anonymity\'s core guarantee.',
        },
      },
      {
        text: 'Sensitive attribute values — protect specific fields like diagnosis, salary, or religion',
        detail: 'Even if someone knows a record belongs to a person, the sensitive field values must remain private',
        scores: { anon: 3, dp: 3, mpc: 2, fl: 1, legal: 2 },
        tag: 'protect_attributes',
        reasons: {
          anon: 'Protecting sensitive attribute values from inference is exactly what L-Diversity adds on top of K-Anonymity.',
          dp: 'DP protects individual attribute values through calibrated noise on all query outputs.',
          legal: 'Sensitive data categories (health, religious belief, financial status) receive heightened legal protection under GDPR Article 9 and similar statutes.',
        },
      },
      {
        text: 'Both individual identity and sensitive attribute values',
        detail: 'Full protection against re-identification AND sensitive attribute inference',
        scores: { anon: 3, dp: 3, mpc: 2, fl: 1, legal: 2 },
        tag: 'protect_both',
        reasons: {
          anon: 'L-Diversity provides both re-identification protection (via k-anonymity) and attribute protection — the full anonymization package.',
          dp: 'DP\'s formal guarantee simultaneously bounds both identity and attribute disclosure.',
        },
      },
      {
        text: 'Each party\'s entire input dataset from other participating parties',
        detail: 'In a multi-party setting, no organization should learn anything about the others\' raw data',
        scores: { anon: 0, dp: 1, mpc: 5, fl: 2, legal: 1 },
        tag: 'protect_parties',
        reasons: {
          mpc: 'Zero input disclosure across parties is MPC\'s defining guarantee — parties learn only the output, nothing about each other\'s data.',
          fl: 'FL keeps raw data local; parties share only model updates, not underlying training data.',
        },
      },
      {
        text: 'Protection from institutional misuse — how an organization collects or uses my data',
        detail: 'The concern is not a technical data breach, but organizations or governments using data in unauthorized or harmful ways',
        scores: { anon: 0, dp: 0, mpc: 0, fl: 0, legal: 6 },
        tag: 'protect_institutional',
        reasons: {
          legal: 'Protection from institutional misuse cannot be achieved by encryption or anonymization alone — it requires legal constraints on actor behavior.',
        },
      },
    ],
  },

  {
    id: 'ml_training',
    question: 'Does your use case involve training or deploying machine learning models?',
    subtitle: 'ML use cases require privacy techniques compatible with gradient-based training pipelines.',
    options: [
      {
        text: 'No — this is not an ML or AI use case',
        detail: 'We are focused on data release, statistical analysis, joint computation, or policy',
        scores: { anon: 3, dp: 2, mpc: 3, fl: -3, legal: 2 },
        reasons: {
          anon: 'Non-ML use cases — data release, analysis — are a core fit for Anonymization.',
          mpc: 'Non-ML joint computation is MPC\'s native territory.',
        },
      },
      {
        text: 'Yes — training a centralized model with privacy guarantees',
        detail: 'Data is (or could be) centralized, but we need to protect individuals in the training set',
        scores: { anon: 0, dp: 4, mpc: 0, fl: 2, legal: 0 },
        reasons: {
          dp: 'DP-SGD (differentially private stochastic gradient descent) is the standard approach for private centralized model training.',
        },
      },
      {
        text: 'Yes — training on distributed data that must remain in place',
        detail: 'The training data cannot be moved or centralized; training must happen locally at each source',
        scores: { anon: 0, dp: 1, mpc: 1, fl: 5, legal: 0 },
        tag: 'distributed_ml',
        reasons: {
          fl: 'Federated Learning was purpose-built to train on data that cannot be centralized.',
        },
      },
    ],
  },

  {
    id: 'data_format',
    question: 'What is the primary format of your sensitive data?',
    subtitle: 'Data format affects which privacy techniques are compatible and practical to implement.',
    options: [
      {
        text: 'Tabular / structured data (rows and columns)',
        detail: 'CSV files, database tables, spreadsheets, or relational data with well-defined records',
        scores: { anon: 4, dp: 3, mpc: 2, fl: 1, legal: 2 },
        reasons: {
          anon: 'Tabular records with quasi-identifiers and sensitive attributes are the standard input format for Anonymization.',
        },
      },
      {
        text: 'Text, logs, or documents',
        detail: 'Natural language text, event logs, JSON documents, or semi-structured data',
        scores: { anon: 1, dp: 3, mpc: 2, fl: 2, legal: 2 },
        reasons: {
          dp: 'DP mechanisms extend to text and log data through query answering and DP-NLP approaches.',
        },
      },
      {
        text: 'Images, audio, or video',
        detail: 'Media files, biometric data, or sensor recordings that may contain identifiable content',
        scores: { anon: 0, dp: 2, mpc: 1, fl: 4, legal: 1 },
        reasons: {
          fl: 'FL is widely used for privacy-preserving image and audio model training (face recognition, voice models).',
        },
      },
      {
        text: 'ML feature vectors, embeddings, or model training datasets',
        detail: 'Data already formatted for machine learning pipelines',
        scores: { anon: 0, dp: 2, mpc: 1, fl: 5, legal: 0 },
        reasons: {
          fl: 'ML-formatted distributed training data is the canonical Federated Learning input.',
        },
      },
    ],
  },

  {
    id: 'formal_guarantee',
    question: 'How important is a formal mathematical privacy guarantee?',
    subtitle: 'Formal guarantees are mathematically provable but may require tradeoffs in utility, performance, or cost.',
    options: [
      {
        text: 'Not required — practical or policy-level protection is sufficient',
        detail: 'We need reasonable protection but not a mathematical proof of privacy',
        scores: { anon: 4, dp: 0, mpc: 0, fl: 2, legal: 4 },
        reasons: {
          anon: 'Anonymization provides strong practical protection without requiring formal probabilistic proofs.',
          legal: 'Legal frameworks provide accountability and deterrence without mathematical guarantees — often sufficient for policy-level protection.',
        },
      },
      {
        text: 'Important — we want provable guarantees with practical tradeoffs',
        detail: 'We need a formal guarantee but can balance it against utility and cost',
        scores: { anon: 1, dp: 4, mpc: 3, fl: 2, legal: 2 },
        reasons: {
          dp: 'Differential Privacy provides rigorous, quantifiable (ε, δ) guarantees while remaining tunable for utility.',
          mpc: 'MPC\'s cryptographic guarantees are formally proven under well-established security models.',
        },
      },
      {
        text: 'Essential — strong cryptographic or mathematical proof is required',
        detail: 'Compliance requirements, adversarial threat models, or liability demand iron-clad, auditable guarantees',
        scores: { anon: 0, dp: 3, mpc: 5, fl: 1, legal: 0 },
        reasons: {
          mpc: 'MPC provides cryptographically proven security — the gold standard when formal proof is a hard requirement.',
          dp: 'DP\'s formal proofs satisfy even strict regulatory and adversarial interpretations of mathematical privacy.',
        },
      },
    ],
  },
];
