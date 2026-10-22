# Related work

Tools that turn equations into tactile graphs exist. What sets Locus apart is everything after drawing: it
**checks** each graph against measured touch-legibility rules, has an agent **fix** failures within an allowed set of
changes, **ships only what passes**, and **re-checks every shipped graph** whenever the code changes.

| | TactileView math module | ViewPlus Audio Graphing Calculator | 2026 JSCAD STL pipeline (paper) | Locus |
|---|---|---|---|---|
| Makes tactile function graphs | Yes | Yes | Statistical charts only | Yes |
| Cost / setup | ~$775, Windows software | Paid, embosser workflow | Research code | Free; send an email |
| Checks readability by touch before delivery | No (relies on the designer) | No | No (fixed parameters) | Yes: 5 measured rules, release blocked on failure |
| Fixes its own failed output | No | No | No | Yes: agent, allowed fixes only, refuses otherwise |
| Versioned, traceable output | No | No | No | Yes: release + braille ID on every print |
| Re-checks old graphs when the generator changes | No | No | No | Yes: every change re-checks every shipped graph, and an agent explains any impact |
| From request to print shop | No | No | No | Yes: reply to the teacher and print order, by email |

Compared from each tool's public material (sources below).

## Sources

- **JSCAD tactile STL charts (July 2026)**: builds JSCAD-based tactile statistical charts with Grade 1 braille labels;
  reports manual CAD at ~2 hours per chart; no automated legibility validation.
  [arXiv 2607.01214 summary](https://www.emergentmind.com/papers/2607.01214). Locus does function graphs, end to end.
- **Automated tactile mathematics overview**: [Accessing Higher Ground](https://accessinghigherground.org/automated-generation-of-tactile-mathematics/)
- **TactileView**: [product page](https://specialneedscomputers.ca/products/tactileview-software)
- **SVGPlott** (research): [paper](https://www.springerprofessional.de/svgplott-generating-adaptive-and-accessible-audio-tactile-functi/2191120)
- **ViewPlus Audio Graphing Calculator**: [AHG guide (PDF)](https://accessinghigherground.org/wp/wp-content/uploads/2025/04/Creating-Tactile-Graphs-with-the-ViewPlus-Audio-Graphing-Calculator.pdf)
- **Desmos-based workflows**: notes that Desmos methods "do not create acceptable braille labels presently".
  [AHG Desmos guide (PDF)](https://accessinghigherground.org/wp/wp-content/uploads/2025/04/CreatingTactileGraphsWithDesMos.pdf)
- **3D-printed maths graphs help blind students identify graphs**:
  [Visio SenseMath](https://www.visio.org/visio.org/media/Visio/Downloads/KEI/Vision-2017/Does-multisensory-presentation-of-mathematical-graphs-improve-visually-impaired-students-performance-on-identifying-mathematical-graphs-A-comparison.pdf),
  [Scientific American](https://blogs.scientificamerican.com/guest-blog/teaching-blind-students-with-3-d-prints/)
