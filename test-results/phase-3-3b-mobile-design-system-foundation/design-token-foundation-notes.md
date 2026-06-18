# Design Token Foundation Notes

We have successfully established a unified design token system for the Vantage ERP mobile application. All styling constants have been centralized in the `mobile/src/constants/` directory.

## Implemented Tokens

### 1. Colors & Gradients (`colors.ts`)
- **HSL-Curated Palettes**:
  - `background`: `#F0F4F8` (Soft slate background)
  - `backgroundDark`: `#0F172A` (Rich navy backdrop)
  - `surface`: `#FFFFFF` (White elevated cards)
  - `border`: `#E2E8F0`
- **Role Accents**:
  - `student`: `#10B981` (Teal/Emerald active tint)
  - `parent`: `#3B82F6` (Royal blue active tint)
  - `teacher`: `#8B5CF6` (Indigo/Purple active tint)
- **Gradients**:
  - Linear gradients matching primary, role accents, and heroes (`heroStudent`, `heroParent`, `heroTeacher`).

### 2. Layout (`layout.ts`)
- **Spacing Scale**: Consistent step padding (e.g. `xxs: 4`, `xs: 8`, `sm: 12`, `md: 16`, `lg: 20`, `xl: 24`, `xxl: 32`, `xxxl: 40`, `massive: 48`).
- **Border Radii**: Modular corners (`xs: 4`, `sm: 8`, `md: 12`, `lg: 16`, `xl: 20`, `xxl: 24`, `full: 9999`).
- **Sizing**: Layout heights like `tabBarHeight: 68`.

### 3. Typography (`typography.ts`)
- Unified TextStyle configurations mapping `fontFamily` based on Platform (Android: Roboto, iOS: System).
- **Scale Categories**: `displayLarge`, `displayMedium`, `displaySmall`, `headingLarge`, `headingMedium`, `headingSmall`, `bodyLarge`, `bodyMedium`, `bodySmall`, `label`, `labelSmall`, `caption`, `captionSmall`, `overline`, `tabLabel`, `statLarge`, `statMedium`, `statSmall`, `buttonLarge`, `buttonMedium`, `buttonSmall`.

### 4. Shadows (`shadows.ts`)
- Consistent elevations for elevated elements (`sm`, `md`, `lg`).

### 5. Barrel Export (`theme.ts`)
- Barrel file to import layout, colors, gradients, typography, and shadows directly from standard theme entry point:
  `import { colors, spacing, typography, shadows } from '../constants/theme';`
