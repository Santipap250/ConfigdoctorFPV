# Design System

The visual system is **Flight Deck Atelier**, an industrial-precision interpretation of aerospace instrumentation. The interface uses an instrument rail, graphite work surfaces, hairline borders, mono labels, and one high-salience action colour rather than rounded generic dashboard cards.

| Token / rule | Value and intent |
|---|---|
| Background | `#101311` carbon graphite; supports long technical sessions |
| Surface | `#151A17`; separates editable work from the environment |
| Signature colour | **OBIX Signal Lime `#B8FF4D`**; primary action, pass state, and active navigation |
| Warning / critical | `#FFC96B` / `#FF7E70`; reserved for meaningful validation signals |
| Display text | Space Grotesk; compact, strong hierarchy |
| Body text | IBM Plex Sans Thai; readable bilingual technical prose |
| Data text | JetBrains Mono; units, metadata and command output |
| Motion | 160–380 ms transform/opacity only; disabled under reduced motion |

Components communicate state explicitly. `StatusBadge` never relies on colour alone because each state includes plain text. `MetricCard` provides formula provenance below each result. Inputs carry units in the field boundary, and every tool must state whether it is Available or Planned.

The responsive composition converts the desktop instrument rail to a mobile mission strip and five-item bottom navigation; it does not compress desktop side navigation into a narrow column.
