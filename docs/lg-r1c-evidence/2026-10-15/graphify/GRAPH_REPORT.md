# Graph Report - .  (2026-10-15)

## Corpus Check
- Large corpus: 340 files · ~10,843,610 words. Semantic extraction will be expensive (many Claude tokens). Consider running on a subfolder, or use --no-semantic to run AST-only.

## Summary
- 342 nodes · 353 edges · 4 communities detected
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output


## Input Scope
- Requested: auto
- Resolved: committed (source: default-auto)
- Included files: 340 · Candidates: 366
- Excluded: 6 untracked · 42244 ignored · 0 sensitive · 0 missing committed
- Recommendation: Use --scope all or graphify.yaml inputs.corpus for a knowledge-base folder.
## God Nodes (most connected - your core abstractions)
1. `updateField()` - 3 edges
2. `getAdminName()` - 3 edges
3. `loadApplications()` - 3 edges
4. `handleApprove()` - 3 edges
5. `handleReject()` - 3 edges
6. `toggleZone()` - 2 edges
7. `updateZoneMinOrder()` - 2 edges
8. `formatPrice()` - 2 edges
9. `handleOrderSubmit()` - 2 edges
10. `simulateWebhook()` - 2 edges

## Surprising Connections (you probably didn't know these)
- None detected - all connections are within the same source files.

## Communities

### Community 3 - "Community 3"
Cohesion: 0.09
Nodes (2): formatPrice(), handleOrderSubmit()

### Community 5 - "Community 5"
Cohesion: 0.21
Nodes (4): getAdminName(), handleApprove(), handleReject(), loadApplications()

### Community 10 - "Community 10"
Cohesion: 0.27
Nodes (3): toggleZone(), updateField(), updateZoneMinOrder()

### Community 19 - "Community 19"
Cohesion: 1
Nodes (2): run(), simulateWebhook()

## Knowledge Gaps
- **Thin community `Community 3`** (2 nodes): `formatPrice()`, `handleOrderSubmit()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 19`** (2 nodes): `run()`, `simulateWebhook()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.06 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.07 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.08 - nodes in this community are weakly interconnected._
- **Should `Community 3` be split into smaller, more focused modules?**
  _Cohesion score 0.09 - nodes in this community are weakly interconnected._
- **Should `Community 4` be split into smaller, more focused modules?**
  _Cohesion score 0.13 - nodes in this community are weakly interconnected._