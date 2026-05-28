---
doc_type: question_seed
focus_area: Technical
sector: defense
difficulty: Mixed
---

# Technical Interview Seeds — Defense & Aerospace

## Embedded and real-time

- Interrupt vs DMA tradeoff for sensor sampling—latency and CPU load.
- Watchdog and safe state on firmware hang detection.
- Endianness and struct packing bugs—prevention in cross-platform teams.
- RTOS task priority inversion scenario and fix.

## Integration and interfaces

- Binary protocol versioning backward compatibility.
- Store-and-forward when tactical link is intermittent.
- Schema for traceable message ID through multi-hop routing.
- Hardware-in-the-loop test setup purpose and limitations.

## Quality and verification

- Requirement ID to test case traceability matrix example.
- Difference verification vs validation with program example.
- Soak test design: duration, load, pass criteria.
- Defect severity classification impact on release gate.

## Security

- Dual control for production signing keys.
- Role separation: developer vs operator vs admin on test bench.
- Immutable audit log properties needed for assessment.

## Debugging scenarios

- Field unit intermittent fault—repro steps in lab.
- Late integration endian bug—CI prevention added.
- Performance regression on target hardware not seen on x86 sim.

## Strong answer signals

Verification evidence, traceability, safety language, personal ownership in test or integration design.

## Weak answer signals

Only agile/scrum vocabulary; no test strategy; ignores configuration management; "we restarted" fixes.
