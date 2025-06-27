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
6. **Call-to-Action (CTA) Button**
   - Custom CTA text (e.g., "Identity Staking") when specified
   - Falls back to "Verify" button if no custom CTA defined
   - Different styling for custom CTAs (rounded pill button with external link icon)

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
  totalPossiblePoints?: number;
  // Post-verification props
  pointsGained?: number;
  validityDays?: number;
}
```

**Pre-verification Display:**
- Large "0/X points gained" text with progress bar below
- Gray progress bar showing 0% completion
- Time and price info displayed below in separate sections with icons
- Clean, minimal layout focusing on potential points

**Post-verification Display:**  
- Green background card showing "X/Y points gained"
- Progress bar showing completion percentage
- Validity period indicator (e.g., "Valid for 90 more days")
- Success state with enhanced visual feedback

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
  cta?: StepAction; // Custom CTA using StepAction type (e.g., { label: "Identity Staking", href: "https://..." })
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

## Final Implementation Plan (December 2024)

### Unified Component Architecture

After thorough testing and iteration, we've determined that the two "variants" are actually just one responsive component with conditional rendering. The drawer adapts based on:
1. Whether the stamp has steps (`steps.length > 0`)
2. Whether the stamp is verified (hides steps when verified)
3. Viewport size (mobile/desktop/wide)

### Component Structure
```
app/components/StampDrawer/
├── index.tsx                    # Main responsive container
├── components/
│   ├── DrawerHeader.tsx         # Platform icon + name + close button
│   ├── CTAButtons.tsx           # Verify/custom CTA + Learn More link
│   ├── PointsModule.tsx         # Points/time/price display
│   ├── CredentialCard.tsx       # Individual stamp cards
│   ├── CredentialGrid.tsx       # Grid layout for stamps
│   ├── StepGuide.tsx            # Step-by-step instructions
│   └── DrawerFooter.tsx         # Update Score button
└── types.ts                     # TypeScript interfaces
```

### Shared Components Breakdown

All stamps share these components:
- **DrawerHeader**: Platform icon, name, and close button positioning
- **CTAButtons**: Either Verify/Close buttons or custom CTA with Learn More
- **PointsModule**: Pre-verification (time/price) or post-verification (points gained)
- **CredentialGrid/Cards**: The stamp display with all state variations
- **StepGuide**: Conditionally shown only for stamps that have steps
- **DrawerFooter**: Fixed "Update Score" button at bottom

### Example: HumanID Phone Steps
```typescript
const humanIdPhoneSteps = [
  {
    number: 1,
    title: "Visit the HumanID verification page",
    description: "Navigate to the HumanID Phone verification page to begin the process.",
    actions: [{
      label: "Go to HumanID Phone Verification",
      href: "https://humanid.org/verify",
      icon: "external"
    }]
  },
  {
    number: 2,
    title: "Enter your phone number",
    description: "Provide your phone number to receive a verification code. Your number will be hashed and not stored.",
    image: {
      src: "/images/stamps/humanid-phone-entry.png",
      alt: "Phone number entry interface"
    }
  },
  {
    number: 3,
    title: "Complete SMS verification",
    description: "Enter the verification code sent to your phone. This proves ownership of the phone number.",
    actions: [{
      label: "Learn about privacy protection",
      href: "/help/humanid-privacy"
    }]
  },
  {
    number: 4,
    title: "Return to Passport",
    description: "After successful verification, return to Passport and click 'Verify' to claim your stamp."
  }
];
```

### Integration Plan
1. Create component structure in `app/components/StampDrawer/`
2. Port shared components from test implementation
3. Implement responsive layout logic in main StampDrawer
4. Replace SideBarContent with StampDrawer in GenericPlatform
5. Add steps data to platform configurations where needed

## Updated Layout System (December 2024)

The drawer now uses a responsive column system that adapts based on viewport width and content:

### Multi-Column Layout Rules

#### Desktop Layouts (768px+)
- **Description/CTA Section**: Takes up flexible space (up to 2 columns worth)
- **Points/Cost Box**: Fixed width of 1 column (w-80 = 320px)
- **Layout**: Horizontal flex container with 8-unit gap
  - Left: Description text + CTA buttons
  - Right: Points module with constrained width

#### Mobile Layout (<768px)
- **All elements stack vertically**
- Points module appears below description and CTA buttons
- Full width for all elements

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
   - **Desktop**: Right side of description/CTA section in a fixed-width container (320px)
   - **Mobile**: Below description/CTA section, full width
   - Pre-verification: Shows Time to Get + Price
   - Post-verification: Shows points gained + validity period

3. **Description/CTA Layout**:
   - **Desktop**: Flexible width (flex-1), takes remaining space after points module
   - **Mobile**: Full width, stacked above points module
   - Contains description text and action buttons (custom CTA or Verify)

4. **Scrolling Behavior**:
   - 1-column: Entire body scrolls as one
   - Multi-column: Stamps and steps have independent scroll containers

5. **Header Distribution**:
   - In multi-column layouts, the description/CTA and points module form a horizontal layout
   - Steps section (when present) starts at the same top level as stamps

6. **Layout Selection Logic**:
   - Check viewport width
   - Check if stamp has steps (guided flow)
   - Check number of stamps
   - Apply appropriate layout based on these factors

7. **Implementation Notes**:
   - Use Tailwind's responsive modifiers (`sm:`, `md:`, `lg:`, `xl:`) for breakpoints
   - Points module uses `flex-shrink-0 w-80` for fixed width on desktop
   - Description section uses `flex-1` to take remaining space
   - Mobile uses stacked layout with `mt-6` spacing

### Visual Reference:
- See `./size-variant-drawers.png` for layout examples

## Implementation Updates (December 2024)

### Platform Configuration Structure

The steps and CTA configuration now follows this clean structure:

1. **Steps Configuration** - In `platforms/src/{Platform}/Providers-config.ts`:
   ```typescript
   export const PlatformDetails: PlatformSpec = {
     icon: "./assets/platformIcon.svg",
     platform: "PlatformName",
     name: "Platform Display Name",
     description: "Platform description",
     connectMessage: "Connect message",
     steps: [  // Optional step-by-step guide
       {
         number: 1,
         title: "Step title",
         description: "Step description",
         actions: [{
           label: "Action label",
           href: "https://example.com"
         }],
         image: {
           src: "/images/stamps/example.png",
           alt: "Image description"
         }
       }
     ]
   };
   ```

2. **CTA Configuration** - In `platforms/src/{Platform}/App-Bindings.tsx`:
   ```typescript
   export class PlatformName extends Platform {
     banner = {
       content: <div>Banner content</div>,
       cta: {  // Optional custom CTA
         label: "Custom Action",
         url: "https://example.com"
       }
     };
   }
   ```

3. **Frontend Usage**:
   - Steps are automatically sourced from `PlatformDetails.steps`
   - CTA is extracted from `platform.banner?.cta`
   - StampDrawer receives both and renders appropriately

### Example Platforms Updated

1. **HumanIdPhone** - Added 4-step phone verification guide
2. **CleanHands** - Added 3-step sanctions verification guide  
3. **Binance** - Added custom CTA "Get BABT Token" and 3-step guide

## Implementation Complete (December 2024)

### What Was Implemented

1. **Created StampDrawer Component Structure**
   - Location: `/app/components/StampDrawer/`
   - All shared components ported from test implementation
   - Responsive layouts working with Tailwind CSS
   - Connected to real data from CeramicContext and ScorerContext

2. **Component Architecture**
   ```
   app/components/StampDrawer/
   ├── index.tsx                    # Main responsive container
   ├── components/
   │   ├── DrawerHeader.tsx         # Platform icon + name + close button
   │   ├── CTAButtons.tsx           # Verify/custom CTA + Learn More link
   │   ├── PointsModule.tsx         # Points/time/price display
   │   ├── CredentialCard.tsx       # Individual stamp cards
   │   ├── CredentialGrid.tsx       # Grid layout for stamps
   │   ├── StepGuide.tsx            # Step-by-step instructions
   │   └── DrawerFooter.tsx         # Update Score button
   ├── hooks/
   │   └── useViewport.tsx          # Viewport detection hook
   └── types.ts                     # TypeScript interfaces
   ```

3. **Integration with GenericPlatform**
   - Replaced SideBarContent with StampDrawer in GenericPlatform.tsx
   - Updated platform data flow to support new drawer
   - Added steps property to PlatformProps type

4. **Platform Configurations Updated**
   - **HumanID Phone**: Added 4-step guide for phone verification
   - **Clean Hands**: Added 3-step guide for sanctions verification
   - Both platforms now export steps data and include it in platformMap

5. **Key Features Implemented**
   - ✅ Responsive layouts (mobile/desktop/wide)
   - ✅ All credential states (verified, expired, deduplicated)
   - ✅ Points module with pre/post verification states
   - ✅ Custom CTAs for platforms that need them
   - ✅ Step-by-step guides with actions and placeholder images
   - ✅ Real data integration from contexts
   - ✅ Proper error handling with default values

### Technical Notes

- No separate variants needed - single responsive component
- Steps are not hidden when verified (per request)
- Used existing theme colors from CLAUDE.md
- Maintained compatibility with existing verification logic
- Fixed runtime errors by adding default values for context data

### Remaining Work

1. **Visual Polish**
   - Add actual images for step guides (currently using placeholders)
   - Fine-tune spacing and typography to match Figma designs
   - Test with all platforms to ensure proper display

2. **Additional Platform Steps**
   - Add step guides for other complex platforms that could benefit
   - Work with product team to identify which platforms need guides

3. **Testing**
   - Comprehensive testing across all breakpoints
   - Test with various stamp configurations
   - Ensure accessibility compliance

4. **Clean Up**
   - Remove old SideBarContent component once fully migrated
   - Clean up test-components directory
   - Update any documentation

## Current TODOs (December 2024)

### Type System Refinement ✅ COMPLETED
1. **Move Shared Types to Types Package**
   - ✅ Added `StepConfig` and `StepAction` types to `platforms/src/types.ts` (temporary, marked with TODO to move to types package)
   - ✅ Updated `PlatformSpec` to include optional `steps?: StepConfig[]` property
   - ✅ Defined discriminated union for `StepAction` without `never`:
     ```typescript
     type StepAction = 
       | {
           label: string;
           href: string;      // For external links
         }
       | {
           label: string;
           onClick: () => void;  // For internal actions
         }
     ```

2. **Platform Configuration Updates**
   - ✅ Steps are now part of `PlatformDetails` (PlatformSpec) in Providers-config.ts
   - ✅ Frontend updated to source steps from `PlatformDetails.steps` instead of separate exports
   - ✅ CTA continues to be sourced from `platform.banner?.cta` (existing structure)
   - ✅ Added example steps to HumanIdPhone and CleanHands platforms

### Remaining TODOs

1. **Type References Cleanup**
   - Replace `platform: any` with proper `Platform` type in StampDrawer
   - Use `PROVIDER_ID` instead of `string[]` for provider arrays
   - Use `PLATFORM_ID` for platform identifiers
   - Move `StepConfig` and `StepAction` to `/types/src/` package

2. **CTA Migration (Future)**
   - Update PlatformBanner.cta to use `StepAction` type instead of `{ label: string; url: string }`
   - Consider moving CTA from banner to main platform config
   - Keep existing structure for now to avoid breaking changes

5. **Create UI-Specific Type Module**
   - Separate display types from configuration types
   - Create `CredentialDisplay` and `CredentialGroupDisplay` for UI state
   - Keep clear distinction between platform config and UI runtime state

### Implementation Tasks
1. **Visual Polish**
   - Add actual images for step guides (currently using placeholders)
   - Fine-tune spacing and typography to match Figma designs
   - Test with all platforms to ensure proper display

2. **Additional Platform Steps**
   - Add step guides for other complex platforms that could benefit
   - Work with product team to identify which platforms need guides

3. **Testing**
   - Comprehensive testing across all breakpoints
   - Test with various stamp configurations
   - Ensure accessibility compliance

## FUTURE PLANS

### Banner System Deprecation
**⚠️ WARNING: Do not delete the banner system without coordination!**

The current implementation temporarily uses the banner system in App-Bindings for CTAs, but this will be deprecated in favor of the new approach:

1. **Current State**: CTAs are sourced from platform banners in App-Bindings
2. **Future State**: CTAs will be defined in platform configuration alongside other UI properties
3. **Migration Plan**:
   - Define CTAs in platform configuration using `StepAction` type
   - Update StampDrawer to source CTAs from platform config instead of banners
   - Migrate all platforms to use new CTA system
   - Only then remove banner-related code from App-Bindings

**Files affected**:
- `platforms/src/*/App-Bindings.tsx` - Contains banner definitions to be removed
- `app/components/GenericPlatform.tsx` - References to banners
- Any platform-specific banner implementations

### Component Cleanup
Once fully migrated and tested:
1. Remove old `SideBarContent` component
2. Clean up `test-components/` directory
3. Update documentation to reflect new architecture
4. Remove any legacy type definitions that were replaced

## Implementation Status (Dec 2024)

### Completed Fixes ✅
1. **3-Column Layout for Steps Version**
   - Wide desktop view now correctly shows 2 stamp columns + 1 steps column
   - Stamps use `grid-cols-2` in wide view when steps are present

2. **Stamp Grid Constraints**
   - Stamps properly constrained to single cells
   - Grid automatically adjusts: 1 → 2 → 3 columns based on viewport

3. **Title Section Positioning**
   - Header (title + close button) now contained within stamp column
   - Only title and close button are fixed; all other content scrolls

4. **Mobile Layout Order**
   - Steps now appear before stamps in mobile view
   - Proper content hierarchy maintained

5. **Scrolling Behavior**
   - Fixed header contains only title and close button
   - Description, actions, points module, and stamps all scroll together
   - Steps column has independent scroll with fixed "Step by step Guide" header

6. **Verified State Behavior**
   - Steps column completely hidden when stamp is verified
   - Stamps column expands to full width
   - No empty space where steps used to be

7. **StampSection Component Implementation** (Dec 2024)
   - Created new `StampSection` component to handle stamp column layouts
   - Component takes a single `cols` prop (1, 2, or 3) representing stamp grid columns
   - Automatically determines description/points layout based on available columns:
     - `cols=1`: Stack description and points vertically (no horizontal space)
     - `cols>1`: Display description and points side-by-side
   - Parent components calculate appropriate column count based on:
     - Viewport size (mobile/desktop/wide)
     - Whether steps are shown alongside stamps
     - Available space in the drawer
   - Clean abstraction: StampSection doesn't need to know about viewport or steps

### Current Test Coverage
- Layout issue tests for all responsive breakpoints
- Visual regression tests for all scenarios and viewports
- Scrolling behavior tests
- Conditional rendering tests (verified state)
- Interaction tests (verify button, close button)
- StampSection component tests for different column configurations

### Testing Strategy
Due to repeated issues with fixing one thing and breaking another, implementing UI tests would help ensure consistent behavior across all responsive breakpoints and layout variants.

### Test File Management Rule
**IMPORTANT**: Only maintain ONE test HTML file at a time. When making changes:
1. Always use `stamp-drawer-unified.html` as the main test file
2. Delete or archive old test files to avoid confusion
3. All changes should be made to this single file
4. This prevents working on the wrong file and losing changes

### Test-Driven Development (TDD) Approach
**RECOMMENDED**: Use TDD for all UI changes to prevent regression and ensure fixes work correctly:

1. **Write the test first** - Add Playwright tests that describe the expected behavior
2. **Run the test** - Verify it fails (red phase)
3. **Implement the fix** - Make minimal changes to make the test pass
4. **Verify visually** - Use Playwright browser automation to take screenshots
5. **Refactor if needed** - Clean up the code while keeping tests green

#### Example TDD Workflow:
```bash
# 1. Add test for new behavior
# Edit: playwright-tests/stamp-drawer.spec.ts

# 2. Run specific test
cd test-components
npm test -- --grep "steps column should be hidden when verified"

# 3. Implement fix in stamp-drawer-unified.html

# 4. Run test again to verify it passes
npm test -- --grep "steps column should be hidden when verified"

# 5. Run all tests to ensure no regression
npm test
```

This approach has proven effective for catching layout issues early and ensuring fixes don't break other functionality.

### Playwright Test Structure
The test suite is organized into logical groups:

```
playwright-tests/stamp-drawer.spec.ts
├── Layout Issues (original problems)
│   ├── 3-column layout verification
│   ├── Stamp grid constraints
│   ├── Title positioning
│   └── Mobile layout order
├── Visual Regression Tests
│   └── All scenarios × all viewports
├── Scrolling Behavior
│   ├── Guided flow column scrolling
│   ├── Multi-credential content scrolling
│   └── Steps column visibility when verified
├── StampSection Component Tests
│   ├── Column-based layout logic
│   ├── Description/points stacking behavior
│   └── Responsive grid adjustments
└── Interaction Tests
    ├── Verify button functionality
    └── Close button positioning
```

### Running Tests
```bash
# Install dependencies (first time only)
cd test-components
npm install
npm run install:playwright

# Run all tests
npm test

# Run with UI (recommended for debugging)
npm run test:ui

# Run specific test file
npm run test:specific

# View HTML report after test run
npm run test:report
```


