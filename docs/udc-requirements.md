# **Design System Web Engineer — Task Brief**

You are tasked with designing and implementing a small component library called "**Faster"** for the company's Design System.

The library should include:

- **Button**
- **Input**
- **Dialog**

The components should be:

- Production-ready
- Fully tested
- Built using reusable design tokens
- Well-documented in Storybook with interactive controls
- Integrated with CI/CD automation

You will need to run the library locally and present your approach. We'll use this presentation to discuss your decisions, trade-offs, component architecture, testing strategy, accessibility considerations, and design system thinking.

In addition, please publish your solution to GitHub so that the implementation can be reviewed before the presentation session.

**Implementation Stack**

React · TypeScript · Tailwind CSS · Jest · Cypress · Storybook · GitHub Actions

## **Tech Stack**

- **React** — Component framework
- **TypeScript (TSX)** — Type-safe development
- **Tailwind CSS** — Utility-first styling
- **Design Tokens** — Required for colors and scalability
- **Jest** — Unit testing
- **Cypress** — Component and interaction testing
- **Storybook** — Documentation and interactive component exploration
- **GitHub Actions** — CI/CD automation

## **Process**

### **Step 1 — Review the Figma File**

Before writing any code:

- Open the provided Figma file
- Use the Inspect panel to extract design specifications:
  - Typography (font size, weight, line height)
  - Colors
  - Borders / radius
  - Spacing and layout
  - States (default, hover, focus, disabled, error)

Ensure you fully understand the components, variants, states, and behaviors before implementation.

### **Step 2 — Define Design Tokens**

Create a reusable token structure for colors.

Requirements:

- Do not hardcode colors directly inside components
- Define centralized color tokens
- Ensure tokens are reusable and scalable within a design system context

You may use:

- TypeScript token files
- Tailwind theme extension
- CSS Variables
- Combination of the above

### **Step 3 — Build the Components**

Implement the following components:

- Button
- Input
- Dialog

Requirements for all components:

- TypeScript support
- Tailwind CSS styling
- Accessibility best practices
- Reusable and scalable API
- Alignment with Figma specifications
- Usage of design tokens

### **Step 4 — Write Tests**

#### **Jest + React Testing Library**

Create tests covering:

- Component rendering
- Variants and states
- User interactions
- Accessibility where applicable

#### Cypress (Mandatory)

Create component tests covering:

- Successful mounting
- Basic rendering validation
- Component interactions
- Dialog open/close behavior
- Input interactions
- Button interactions

### **Step 5 — Create Storybook Stories**

Create Storybook documentation for all components.

Requirements:

- Write stories for all component variants
- Include disabled, error, and interaction states where applicable
- Include a **Playground** story with full control exposure
- Ensure stories are clear, structured, and useful for other developers

### **Step 6 — Configure CI/CD and NPM Library**

Create a GitHub Actions workflow that automatically runs:

- Install Dependencies
- Lint
- Type Check
- Jest Tests
- Cypress Tests
- Storybook Build
- Production Build
- NPM Library Release

The goal is to demonstrate that the component library is protected by automated quality checks.

### **Step 7 — Publish Repository & Storybook**

Please publish your solution to a GitHub repository.

Before the presentation session, we should be able to:

- Review the code on GitHub
- Run the project locally
- Access and review the local Storybook documentation

## **Acceptance Criteria**

- Components match the Figma design and specifications
- Component APIs and behavior are well-structured and consistent
- Design tokens are implemented and used consistently
- All Jest tests pass
- All Cypress tests pass
- Storybook provides full control and visibility of the components
- No console errors in Storybook
- CI/CD pipeline executes successfully
- Repository can be cloned and run locally

## **Deliverables**

Please provide:

- GitHub Repository URL
- README with setup instructions
- Jest tests
- Cypress tests
- GitHub Actions workflow
- NPM Library

## **Presentation Session**

Please be prepared to walk us through:

- Figma analysis and implementation approach
- Component architecture
- Design token strategy
- Accessibility decisions
- Testing approach
- Storybook setup
- CI/CD workflow
- Trade-offs and improvements
- How you would scale Faster UI as a larger design system

## **Resources**

### Figma File

<https://www.figma.com/design/7OfpQVe2pYpE9MF5pQeXhH/taptap-design-copy?node-id=12-11244&m=dev>

### Tailwind CSS

<https://tailwindcss.com/docs>

### Storybook Controls

<https://storybook.js.org/docs/essentials/controls>

### Cypress Component Testing

<https://docs.cypress.io/guides/component-testing/overview>

### GitHub Actions

<https://docs.github.com/en/actions>