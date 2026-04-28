# Decision Making

## High-Level Overview

The advisor evaluates five privacy technologies — **Anonymization**, **Differential Privacy (DP)**, **Secure Multi-Party Computation (MPC)**, **Federated Learning (FL)**, and **Legal/Constitutional Frameworks** — by accumulating scores across 14 questions. Each answer option carries numeric weights for each technology. After all questions are answered, the technology with the highest total score wins and drives all downstream outputs: parameter recommendations, tradeoffs, rejection reasoning, and a phased implementation roadmap.

Alongside raw scores, certain answers attach semantic **tags** (e.g., `goal_regulatory`, `threat_government`, `extreme_sensitivity`). Tags drive the branching logic that customizes the output — choosing which MPC protocol to recommend, whether to apply DP-SGD to federated learning, whether to frame Legal as constitutional vs. regulatory, and so on.

Negative scores can also occur (e.g., DP penalized when exact accuracy is required; FL penalized when no ML is involved). These are normalized to zero before ranking so the relative ordering is preserved but no technology displays negatively.

---

## Question-by-Question Contributions

**Q1 — Goal** (primary objective)  
The highest-weight question. Each goal option gives a large score (5–6 pts) exclusively to one technology, making the user's stated purpose the single strongest signal. A regulatory or government-surveillance goal pushes Legal to 6 pts; dataset publishing pushes Anonymization; formal query guarantees push DP; collaborative computation pushes MPC; distributed ML training pushes FL.

**Q2 — Threat Actor** (who poses the risk)  
Distinguishes between technical adversaries (external hackers) and institutional ones (organizations, governments). Organizational or government threat actors strongly favor Legal (5 pts each), while technical threats spread moderate scores (2 pts each) across the technical tools. This separates "law can fix this" scenarios from "cryptography can fix this" ones.

**Q3 — Data Location** (where data lives)  
Determines the architectural model. Centralized data favors Anonymization and DP; data split across a small number of partners favors MPC; data distributed across many devices (edge/mobile) strongly favors FL. This question is critical for filtering out approaches that are architecturally incompatible.

**Q4 — Number of Parties**  
Reinforces Q3 by counting participants. A single organization favors Anonymization/DP/Legal; 2–10 organizations strongly favor MPC; many organizations or thousands of devices strongly favor FL. Together with Q3, these two questions lock in the distributed-vs-centralized axis.

**Q5 — Trust Model** (assumptions between parties)  
Specifically targets MPC. A zero-trust requirement (no party sees another's data) is the canonical use case for MPC and awards it 5 pts. A single trusted curator favors Anonymization and DP. A partially trusted central server gives moderate credit to FL and MPC. This question is most decisive in MPC vs. FL tie-breaking.

**Q6 — Output Type** (desired form of result)  
Maps directly to technology capabilities. Each option strongly awards the technology that produces that output: shareable anonymized dataset → Anonymization; aggregate statistics → DP; trained ML model → FL; joint computation result → MPC; compliance policy → Legal. This acts as a secondary goal confirmation.

**Q7 — Accuracy Tolerance** (noise acceptable?)  
The main differentiator for DP. When exact results are required, DP receives a −1 penalty and MPC/Anonymization receive modest boosts. When noise is acceptable, DP gains 4–5 pts. This prevents DP from being recommended in contexts where its fundamental mechanism (adding noise) is incompatible with the user's requirements.

**Q8 — Data Sensitivity** (how sensitive is the data)  
Scales the recommendation toward stronger technical guarantees. Moderate sensitivity favors Anonymization; high sensitivity boosts DP and MPC; extreme sensitivity strongly favors MPC. Beyond scoring, the sensitivity tag directly controls parameter values downstream — the k-value for anonymization (3, 10, or 25), the epsilon for DP (2.0, 0.5, or 0.1), and whether DP-SGD is applied in federated learning.

**Q9 — Regulatory Requirements** (applicable laws)  
Adds Legal score (3–4 pts) when regulations like GDPR, HIPAA, CCPA, or multiple frameworks apply. Multiple strict regulations also boost MPC (4 pts) as a technical complement to legal compliance. Contributes the `regulatory` tag used later to determine whether Legal recommendations should reference specific laws and penalties.

**Q10 — Compute Budget** (available resources)  
Acts as a practical feasibility filter. Limited compute strongly favors Legal (5 pts — zero compute cost) and Anonymization; high compute budgets unlock MPC (5 pts), which has the highest overhead. Moderate budgets favor FL and DP. This prevents recommending computationally impractical approaches for resource-constrained environments.

**Q11 — What to Protect** (specific threat type)  
Differentiates within the technical tools. Protecting individual identity favors Anonymization (5 pts); protecting sensitive attribute values adds to both Anonymization and DP; protecting each party's full dataset favors MPC (5 pts); preventing institutional misuse strongly favors Legal (6 pts). This refines the recommendation when multiple technical tools score similarly on other questions.

**Q12 — ML Training** (is machine learning involved)  
The primary FL qualifier. "No ML use case" gives FL a −3 penalty, ensuring it is not recommended for non-ML scenarios. Centralized training with privacy boosts DP (4 pts); distributed training without centralizing data strongly favors FL (5 pts). The tag from this question determines whether FL recommendations include DP-SGD and secure aggregation.

**Q13 — Data Format** (structure of the data)  
Fine-tunes FL and DP selection. Tabular/structured data favors Anonymization and DP; text/logs favor DP; images/audio/video favor FL; ML feature vectors/embeddings strongly favor FL (5 pts). This question has the most impact when Q12 has already indicated ML involvement, sharpening the DP vs. FL distinction.

**Q14 — Formal Guarantee** (mathematical proof required)  
Separates practical from cryptographic protection. When no formal proof is needed, Anonymization and Legal score highest. When mathematical proof is important, DP and MPC gain 3–4 pts. When cryptographic proof is essential, MPC receives 5 pts and DP receives 3 pts. This is the final discriminator between Anonymization (heuristic protection) and MPC/DP (provable guarantees).

---

## From Scores to Output

Once the winner is determined, tags drive the customized details:

- **Parameters**: sensitivity tags set k/ε/protocol; trust tags determine DP mode (central vs. local) and MPC security model; ML tags trigger DP-SGD for FL.
- **Technology stack**: The winner may be paired with a supporting technology (e.g., MPC + DP) when their `combinations` overlap.
- **Rejection reasoning**: Each non-winner receives a scenario-specific explanation drawn from the user's tags, not generic technology weaknesses.
- **Tradeoffs**: Six metrics (privacy, utility, compute, compliance, scalability, adoption) are blended 60/30/10% across primary and supporting technologies.
- **Rollout**: A four-phase implementation plan tailored to the winning technology, with operational guidance on governance, auditing, and monitoring.
