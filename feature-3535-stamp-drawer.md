# Feature: Reskin Stamp Drawer UI (Issue #3535)

## Overview

This feature enhances the Stamp verification drawer with two new layout variants to better match the complexity of different Stamps. The new designs provide clearer information hierarchy, better verification progress visibility, and improved user guidance.

## Feature Description

### Current State
- Single drawer layout for all Stamps
- Limited visual states for credentials
- No step-by-step guidance for complex Stamps

### New Functionality
- **Two Layout Variants:**
  - **Variant 1:** For Stamps with many credentials and minimal explanation
  - **Variant 2:** For Stamps with fewer credentials requiring step-by-step guidance
- **Enhanced Credential States:** Clear visual indicators for Not Verified, Verified, Deduplicated, and Expired states
- **Points Gained Module:** Shows potential points with optional Time/Price info
- **Step-by-Step Guide:** Rich content support for complex verification flows (Variant 2 only)

## Design Specification

### Shared Elements (Both Variants)
1. **Title** - Stamp name
2. **Description** - Brief explanation of the Stamp
3. **Credential Group Header** - Section label for credentials
4. **Credential List** - Badge/button/card format for each credential
5. **Points Gained Module**
   - Points value display
   - Optional: Time to Get
   - Optional: Price

### Variant 1 - Multiple Credentials
- Optimized for Stamps with many verification options
- Compact credential display
- Focus on credential selection and status

### Variant 2 - Guided Experience
- For complex Stamps requiring guidance
- Includes step-by-step instructions
- Each step can contain:
  - Text instructions
  - Action buttons
  - Supporting images
- All steps visible (no expand/collapse)

### Credential States

#### Primary States:
1. **Not Verified** (default)
   - Neutral styling
   - Ready for verification
   - Shows potential points

2. **Verified**
   - Success styling (green background)
   - Shows earned points
   - May have additional flags:
     - **No flags** - Contributes to score
     - **Deduplicated flag** - Verified but not scored (0 points)
     - **Expired flag** - Previously verified, now invalid

#### Platform-Level Verification State:
- Derived from individual credential states
- Shows as "X/Y points gained" where X is sum of verified, non-flagged credentials
- Updates automatically as credentials are verified

## Design References
- [Figma Designs](https://www.figma.com/design/SFzb234NWo6ViBrMD7SWTj/Passport-App?node-id=18734-13026&t=NYcJxDteDcQRFYph-1)
- ./steps-drawer.png
- ./simple-drawer.png
- ./mobile-drawer.png

---

# Design Plan

## Current Implementation Analysis

Based on code review, the existing stamp drawer implementation consists of:

### Key Components:
1. **GenericPlatform.tsx** - Main drawer container using Chakra UI's Drawer
   - Handles verification logic and state management
   - Manages OAuth flow and credential fetching
   - Location: `app/components/GenericPlatform.tsx:416-453`

2. **SideBarContent.tsx** - Drawer content wrapper
   - Renders platform header, verify button, and stamp list
   - Location: `app/components/SideBarContent.tsx:34-86`

3. **PlatformDetails.tsx** - Platform header section
   - Shows icon, name, description, points progress
   - Includes expiration indicator and menu
   - Location: `app/components/PlatformDetails.tsx:115-231`

4. **StampSelector.tsx** - Credential list renderer
   - Displays stamps grouped by platformGroup
   - Handles 4 states: verified, expired, deduplicated, not-verified
   - Shows points for each stamp
   - Location: `app/components/StampSelector.tsx:65-176`

### Current UI Structure:
```
Drawer (right-side overlay)
├── CancelButton (mobile only)
├── PlatformDetails (header)
│   ├── Platform icon & name
│   ├── Description with optional link
│   ├── GenericBanner (optional)
│   └── Points box with expiration indicator
├── Verify/Close Button
└── StampSelector (body)
    └── For each platformGroup:
        ├── Group title
        └── Credential cards (provider items)
            ├── Title with checkmark/labels
            ├── Description
            └── Points display
```

## Phase 1: Analysis & Discovery

### 1.1 Current State Management
- Verification states: managed in GenericPlatform via `isLoading`, `canSubmit`, `submitted`
- Credential states: `verifiedProviders`, `expiredProviders` from CeramicContext
- Points: from ScorerContext (`stampWeights`, `earnedPoints`, `possiblePoints`)
- Deduplication: `stampDedupStatus` from ScorerContext

### 1.2 Component Isolation Strategy
- Extract the drawer rendering logic from existing components
- Create a test harness that mocks the required contexts
- Build static data that covers all credential states and both variants

## Phase 2: Test Component Development

### 2.1 Create Isolated Test Environment
```
/test-components/
  ├── StampDrawerTest.tsx      # Main test component
  ├── mockData/
  │   ├── variant1Data.ts      # Multi-credential test data
  │   └── variant2Data.ts      # Guided experience test data
  └── StampDrawerTest.css      # Isolated styles
```

### 2.2 Static Data Structure
```typescript
interface TestStampData {
  variant: 1 | 2;
  title: string;
  description: string;
  credentials: TestCredential[];
  pointsGained: {
    points: number;
    timeToGet?: string;
    price?: string;
  };
  steps?: TestStep[]; // Only for variant 2
}

interface TestCredential {
  id: string;
  name: string;
  state: 'not-verified' | 'verified' | 'deduplicated' | 'expired';
  description?: string;
}

interface TestStep {
  number: number;
  title: string;
  description: string;
  buttons?: TestButton[];
  image?: string;
}
```

## Phase 3: Implementation Strategy

### 3.1 New Component Architecture

Based on the design analysis, the two variants have significantly different layouts and don't share a common header structure. The architecture follows a clear data flow where the platform level handles all state logic and passes clean, formatted data to presentation components:

```
app/components/StampDrawer/
├── index.tsx                    # Main drawer container
├── StampDrawerLayout.tsx        # Layout wrapper that switches between variants
├── variants/
│   ├── MultiCredentialView.tsx  # Variant 1 - Complete layout
│   │   ├── Header (icon, name, description, verify button)
│   │   ├── PointsModule (when verified)
│   │   └── CredentialGroups
│   └── GuidedFlowView.tsx       # Variant 2 - Complete layout
│       ├── Header (icon, name)
│       ├── PointsModule (time/price when not verified)
│       ├── Description
│       └── StepByStepGuide
├── shared/
│   ├── PlatformIcon.tsx         # Icon/name component used by both
│   ├── PointsModule.tsx         # Flexible points/time/price display
│   ├── CredentialGrid.tsx       # Grid layout for variant 1
│   ├── CredentialCard.tsx       # Individual credential cards
│   ├── CredentialState.tsx      # State indicators (verified/expired/etc)
│   └── StepGuide.tsx            # Step-by-step component for variant 2
└── types.ts                     # TypeScript interfaces
```

### 3.2 Variant-Specific Layouts

#### Variant 1 - Multi-Credential View (e.g., Ethereum)
- Compact header with platform info and verify button
- Points module shows "X points gained" with validity period when verified
- Multiple credential groups (e.g., "Engagement Milestones", "Activity Metrics")
- Grid layout with uniform card size
- Supports all credential states: verified, expired, deduplicated, not-verified

#### Variant 2 - Guided Flow View (e.g., Clean Hands)
- Simple header with platform icon and name
- Points module shows "Time to get" and "Price" when not verified
- Platform description as separate section
- Prominent "Step by Step Guide" section
- Sequential steps with instructions, buttons, and images
- Simpler credential display below the guide

### 3.3 Data Flow & State Management

#### Data Processing at Platform Level
The main drawer component (index.tsx) processes all the raw data from contexts and creates a clean data structure:

```typescript
// In StampDrawer/index.tsx
function StampDrawer({ platform, isOpen, onClose }) {
  const { verifiedProviders, expiredProviders } = useCeramicContext();
  const { stampWeights, stampDedupStatus } = useScorerContext();
  
  // Process all data at the top level
  const stampData = useMemo(() => {
    return {
      credentials: platform.providers.map(provider => ({
        id: provider.name,
        title: provider.title,
        description: provider.description,
        verified: verifiedProviders.includes(provider.name),
        flags: [
          expiredProviders.includes(provider.name) && 'expired',
          stampDedupStatus[provider.name] && 'deduplicated'
        ].filter(Boolean),
        points: stampWeights[provider.name] || 0,
        pointsDisplay: formatPoints(provider, verifiedProviders, stampDedupStatus),
      })),
      totalPoints: calculateTotalPoints(platform, verifiedProviders, stampDedupStatus),
      possiblePoints: calculatePossiblePoints(platform),
    };
  }, [platform, verifiedProviders, expiredProviders, stampWeights, stampDedupStatus]);
  
  // Pass clean data to variant components
  return (
    <Drawer isOpen={isOpen} onClose={onClose}>
      <StampDrawerLayout 
        variant={platform.drawerVariant} 
        platform={platform}
        stampData={stampData}
      />
    </Drawer>
  );
}
```

This ensures:
- All state logic happens in the main component
- No need for additional hooks with similar names
- Components receive pre-processed, display-ready data
- Easy to test and maintain
- Consistent formatting across the UI

### 3.5 Component Details

#### PointsModule Component
```typescript
interface PointsModuleProps {
  variant: 'pre-verification' | 'post-verification';
  // Pre-verification props
  timeToGet?: string;
  price?: string;
  // Post-verification props
  pointsGained?: number;
  validityDays?: number;
}
```
- Pre-verification: Shows time and price in side-by-side layout
- Post-verification: Shows points gained with validity indicator

#### CredentialCard Component
```typescript
interface CredentialCardProps {
  verified: boolean;
  flags?: ('expired' | 'deduplicated')[];
  title: string;
  description?: string;
  points: number;
  pointsDisplay: string; // Pre-formatted by parent (e.g., "+2.4" or "0")
  // Additional props for state-specific UI
}
```
- Pure presentation component - receives all data pre-processed
- Uniform card size across all credential groups
- Parent component handles all state logic and formatting
- Flags displayed as badges/labels on verified credentials

#### Credential States Visual Design

**Not Verified:**
- Default/neutral styling
- No state indicators
- Shows potential points available

**Verified (no flags):**
- Green background (`bg-green-100` or similar)
- Checkmark icon
- Full points displayed and counted toward score

**Verified with Expired flag:**
- Green background with expired indicator
- Clock icon or expired badge
- Shows as verified but may need renewal

**Verified with Deduplicated flag:**
- Green background with deduplicated indicator
- Info icon with tooltip explaining deduplication
- Shows 0 points (verified but not counted)

### 3.6 Step-by-Step Guide Implementation

The step-by-step guide will be implemented as a hardcoded React component rather than using markdown. This approach provides:
- Full control over layout and styling
- Easy integration of action buttons with proper onClick handlers
- Straightforward image handling via imports
- No parsing overhead or markdown edge cases
- Consistency with existing codebase patterns

#### Step Configuration Structure
```typescript
// Example step configuration for Clean Hands stamp
const cleanHandsSteps: StepConfig[] = [
  {
    title: "Visit the issuance page",
    description: "Navigate to the Proof of Clean Hands issuance page to begin the verification process.",
    actions: [{
      label: "Go to Proof of Clean Hands",
      href: "https://example.com/clean-hands",
      icon: "external"
    }],
    image: {
      src: "/images/stamps/clean-hands-step-1.png",
      alt: "Clean Hands issuance page"
    }
  },
  {
    title: "Connect your wallet",
    description: "Connect the wallet you want to verify to the issuance page.",
    // No actions for this step
    image: {
      src: "/images/stamps/clean-hands-step-2.png",
      alt: "Wallet connection interface"
    }
  },
  {
    title: "Complete verification",
    description: "Follow the on-screen instructions to verify your clean hands status.",
    actions: [{
      label: "Learn more about verification",
      href: "/help/clean-hands"
    }]
  }
];
```

#### StepGuide Component Implementation
```tsx
// app/components/StampDrawer/shared/StepGuide.tsx
interface StepGuideProps {
  steps: StepConfig[];
}

export const StepGuide = ({ steps }: StepGuideProps) => (
  <div className="mt-8">
    <h3 className="text-lg font-semibold mb-4">Step by step Guide</h3>
    <div className="space-y-6">
      {steps.map((step, index) => (
        <div key={index} className="flex gap-3">
          <span className="text-2xl font-bold text-color-6 flex-shrink-0">
            {index + 1}
          </span>
          <div className="flex-1">
            <h4 className="font-semibold text-color-1">{step.title}</h4>
            <p className="text-sm text-color-6 mt-1">{step.description}</p>
            
            {step.actions && (
              <div className="mt-2 space-x-2">
                {step.actions.map((action) => (
                  <a
                    key={action.label}
                    href={action.href}
                    onClick={action.onClick}
                    className="inline-flex items-center gap-1 text-sm font-medium 
                               text-color-5 hover:text-color-5 hover:underline"
                    target={action.href?.startsWith('http') ? '_blank' : undefined}
                    rel={action.href?.startsWith('http') ? 'noopener noreferrer' : undefined}
                  >
                    {action.label}
                    {action.icon === 'external' && (
                      <svg className="w-3 h-3" /* external link icon */ />
                    )}
                  </a>
                ))}
              </div>
            )}
            
            {step.image && (
              <img 
                src={step.image.src} 
                alt={step.image.alt}
                className="mt-3 rounded-lg border border-foreground-5"
              />
            )}
          </div>
        </div>
      ))}
    </div>
  </div>
);
```

### 3.7 Data Structure Updates
```typescript
// Platform configuration
interface PlatformConfig {
  id: string;
  name: string;
  icon: string;
  description: string;
  drawerVariant: 1 | 2;
  // Variant 1 specific
  credentialGroups?: CredentialGroup[];
  // Variant 2 specific
  steps?: StepConfig[];
  credentials?: CredentialConfig[];
}

interface CredentialGroup {
  title: string;
  credentials: CredentialConfig[];
}

interface StepConfig {
  title: string;
  description: string;
  actions?: {
    label: string;
    href?: string;
    onClick?: () => void;
    icon?: string;
  }[];
  image?: {
    src: string;
    alt: string;
  };
}
```

### 3.7 Styling Strategy
- Leverage existing design tokens and Tailwind classes
- **Use Tailwind's built-in responsive modifiers** for all media queries:
  - `sm:`, `md:`, `lg:`, `xl:` prefixes instead of custom breakpoints
  - Example: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`
  - No custom CSS media queries needed
- New credential state classes:
  - Verified: `bg-green-50` with `border-green-200`
  - Expired flag: Badge or label overlay on verified card
  - Deduplicated flag: Badge or label overlay on verified card
- Maintain consistent spacing and typography
- Ensure responsive design for mobile/tablet views using Tailwind's responsive utilities

## Phase 4: Integration Plan

### 4.1 Configuration
- Add variant field to platform/stamp config
- Default to Variant 1 for backward compatibility
- Map existing stamps to appropriate variants

### 4.2 Migration Strategy
1. Deploy new component alongside existing
2. Feature flag for gradual rollout
3. Update stamps individually
4. Remove old component after full migration

## Phase 5: Testing Strategy

### 5.1 Component Testing
- Unit tests for each variant
- Credential state transitions
- Accessibility tests (ARIA, keyboard nav)
- Responsive design tests

### 5.2 Integration Testing
- Test with real stamp data
- Verify state persistence
- Test in both app and embed contexts

## Technical Considerations

### Dependencies
- Existing UI libraries (Tailwind, Chakra UI)
- State management (React Context)
- Stamp/Platform registry

### Performance
- Lazy load variant components
- Optimize re-renders for credential updates
- Consider virtualization for long credential lists

### Accessibility
- ARIA labels for all states
- Keyboard navigation support
- Screen reader announcements for state changes
- Color contrast compliance

## Development Workflow

1. **Isolate** - Extract current drawer to test component
2. **Mock** - Create comprehensive test data
3. **Iterate** - Rapid design iterations in isolation
4. **Validate** - Test with designers/stakeholders
5. **Integrate** - Port back to main app
6. **Test** - Full integration testing
7. **Deploy** - Gradual rollout with monitoring

## Success Metrics
- Reduced time to understand stamp requirements
- Increased completion rate for complex stamps
- Improved accessibility scores
- Faster load times despite richer content

## Test Component Implementation ✅

### Completed
A fully functional test implementation has been created in the `test-components/` directory to validate the design before integration.

**Final Test Component**: `test-components/stamp-drawer-responsive-v2.html`

### Key Features Implemented
- Fully responsive layout using Tailwind CSS
- Two layout variants (multi-credential and guided flow)
- All credential states (verified, expired, deduplicated)
- Mobile-first design with proper breakpoints
- Independent scrolling for desktop two-column layouts
- Clean component architecture ready for integration

## Updated Layout System (December 2024)

The drawer now uses a responsive column system that adapts based on viewport width and content:

### 1-Column Layout (Mobile/Narrow)
- **When**: Viewport < 768px or narrow desktop drawer
- **Structure** (top to bottom):
  - Title/Description section
  - Points/Time/Price module
  - Action button (Verify/Close + Learn More)
  - Steps (optional, for guided flow stamps)
  - Stamps section
- **Behavior**: Single scrollable body, fixed bottom button section

### 2-Column Layout (Medium Desktop)
- **When**: Viewport 768px-1200px with appropriate content
- **Options**:
  - **Option A**: Grid of stamps (2 columns)
  - **Option B**: 1 column stamps + 1 column steps (for guided flow)
- **Structure**:
  - Title/Description/Points module/Action button distributed over stamp section only
  - Close button in top-right of stamp section
  - Stamps and steps scroll independently
  - Fixed bottom button section

### 3-Column Layout (Wide Desktop)
- **When**: Viewport > 1200px with appropriate content
- **Options**:
  - **Option A**: Grid of stamps (3 columns)
  - **Option B**: 2 columns stamps + 1 column steps (for guided flow)
- **Structure**:
  - Title/Description/Points module/Action button distributed over stamp section only
  - Close button in top-right of stamp section
  - Stamps and steps scroll independently
  - Fixed bottom button section

### Key Layout Rules:
1. **Fixed Elements**:
   - Bottom button section ("Update Score") is always fixed
   - Close button placement:
     - 1-column: Top-right of drawer header
     - Multi-column: Top-right of stamp section

2. **Points/Score Module Placement**:
   - Shows after or alongside title/description
   - Pre-verification: Shows Time to Get + Price
   - Post-verification: Shows points gained + validity period

3. **Scrolling Behavior**:
   - 1-column: Entire body scrolls as one
   - Multi-column: Stamps and steps have independent scroll containers

4. **Header Distribution**:
   - In multi-column layouts, the title/description/points/action buttons are positioned above the stamps section only
   - Steps section (when present) starts at the same top level as stamps

5. **Layout Selection Logic**:
   - Check viewport width
   - Check if stamp has steps (guided flow)
   - Check number of stamps
   - Apply appropriate layout based on these factors

6. **Implementation Notes**:
   - Use Tailwind's responsive modifiers (`sm:`, `md:`, `lg:`, `xl:`) for breakpoints
   - Avoid manual media queries or custom breakpoint logic
   - Let Tailwind handle responsive behavior with its built-in system

### Visual Reference:
- See `./size-variant-drawers.png` for layout examples

## Next Steps for Test Component

### Immediate Tasks
1. **Create new test component with proper responsive layouts**:
   - Start with `test-components/stamp-drawer-responsive-v2.html`
   - Remove all manual media queries
   - Use Tailwind responsive modifiers (`sm:`, `md:`, `lg:`, `xl:`)
   - Implement three distinct layouts based on content + viewport

2. **Fix layout structure for each breakpoint**:
   - **Mobile (<768px)**: Single column with all elements stacked
   - **Medium (768px-1200px)**: Either 2-col grid OR 1-col stamps + 1-col steps
   - **Large (>1200px)**: Either 3-col grid OR 2-col stamps + 1-col steps

3. **Correct element positioning**:
   - Points/Time/Price module: After title/description, before action buttons
   - Close button: Top-right of drawer (mobile) or stamp section (desktop)
   - Update Score button: Always fixed at bottom

4. **Implement independent scrolling**:
   - In multi-column layouts, stamps and steps scroll separately
   - Use `overflow-y-auto` on individual sections
   - Ensure proper height constraints on parent containers

5. **Test scenarios to verify**:
   - Ethereum (many stamps, no steps) → Should use grid layout
   - Clean Hands (1 stamp, with steps) → Should use stamps + steps layout
   - Scroll behavior works correctly in each layout
   - Responsive transitions are smooth

### Quick Implementation Checklist
- [ ] Remove custom CSS media queries
- [ ] Replace with Tailwind classes like `md:grid-cols-2 lg:grid-cols-3`
- [ ] Fix close button positioning with `md:absolute md:top-4 md:right-4`
- [ ] Add proper scroll containers for multi-column views
- [ ] Test all breakpoints with browser resize
- [ ] Verify layout selection logic works as expected


