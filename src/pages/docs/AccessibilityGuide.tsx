/**
 * Accessibility Documentation Page
 */

import React from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Shield, Eye, Keyboard, Users, CheckCircle, AlertTriangle, Info } from 'lucide-react';
import { Link } from 'react-router-dom';

const AccessibilityGuide = () => {
  const AccessibilityPrinciple = ({
    icon: Icon,
    title,
    description,
    examples,
    dos,
    donts
  }: {
    icon: React.ElementType;
    title: string;
    description: string;
    examples?: string[];
    dos?: string[];
    donts?: string[];
  }) => (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <Icon className="w-6 h-6 text-circleTel-orange" />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {examples && (
          <div>
            <h4 className="font-semibold mb-2">Implementation Examples</h4>
            <ul className="space-y-1 text-sm text-muted-foreground">
              {examples.map((example, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-circleTel-orange">•</span>
                  {example}
                </li>
              ))}
            </ul>
          </div>
        )}

        {dos && (
          <div>
            <h4 className="font-semibold mb-2 text-green-700 flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Do
            </h4>
            <ul className="space-y-1 text-sm">
              {dos.map((item, index) => (
                <li key={index} className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}

        {donts && (
          <div>
            <h4 className="font-semibold mb-2 text-red-700 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Don't
            </h4>
            <ul className="space-y-1 text-sm">
              {donts.map((item, index) => (
                <li key={index} className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const CodeExample = ({ title, code, description }: {
    title: string;
    code: string;
    description?: string;
  }) => (
    <div className="mb-6">
      <h4 className="font-semibold mb-2">{title}</h4>
      {description && (
        <p className="text-sm text-muted-foreground mb-3">{description}</p>
      )}
      <div className="bg-muted rounded-lg p-4 font-mono text-sm overflow-x-auto">
        <pre>{code}</pre>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-8">
          <Link
            to="/internal-docs"
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Documentation
          </Link>
        </div>

        {/* Header */}
        <div className="mb-8">
          <Badge variant="secondary" className="mb-4">Guidelines</Badge>
          <h1 className="text-4xl font-bold font-inter mb-4">Accessibility Guide</h1>
          <p className="text-xl text-muted-foreground max-w-3xl">
            Ensuring our digital products are accessible to all users, including those with
            disabilities. We follow WCAG 2.1 AA guidelines for maximum inclusion.
          </p>
        </div>

        {/* WCAG Compliance Badge */}
        <Alert className="mb-8 border-green-200 bg-green-50">
          <Shield className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-800">WCAG 2.1 AA Compliant</AlertTitle>
          <AlertDescription className="text-green-700">
            All CircleTel design system components meet or exceed WCAG 2.1 AA accessibility standards.
            This ensures our products are usable by people with a wide range of disabilities.
          </AlertDescription>
        </Alert>

        <Tabs defaultValue="principles" className="space-y-8">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="principles">Principles</TabsTrigger>
            <TabsTrigger value="implementation">Implementation</TabsTrigger>
            <TabsTrigger value="testing">Testing</TabsTrigger>
            <TabsTrigger value="resources">Resources</TabsTrigger>
          </TabsList>

          {/* Principles */}
          <TabsContent value="principles" className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold mb-6">WCAG Principles</h2>
              <p className="text-muted-foreground mb-8">
                The Web Content Accessibility Guidelines (WCAG) are built around four main principles.
                All CircleTel components are designed with these principles in mind.
              </p>

              <AccessibilityPrinciple
                icon={Eye}
                title="1. Perceivable"
                description="Information and UI components must be presentable to users in ways they can perceive."
                examples={[
                  "Text alternatives for images and icons",
                  "Sufficient color contrast ratios (4.5:1 for normal text, 3:1 for large text)",
                  "Resizable text up to 200% without loss of functionality",
                  "Audio descriptions for video content"
                ]}
                dos={[
                  "Use semantic HTML elements for proper structure",
                  "Provide alt text for all informative images",
                  "Ensure color contrast meets WCAG standards",
                  "Use focus indicators for interactive elements"
                ]}
                donts={[
                  "Rely solely on color to convey information",
                  "Use images of text instead of actual text",
                  "Create content that flashes more than 3 times per second"
                ]}
              />

              <AccessibilityPrinciple
                icon={Keyboard}
                title="2. Operable"
                description="UI components and navigation must be operable by all users."
                examples={[
                  "Full keyboard navigation support",
                  "Logical tab order through interactive elements",
                  "Skip links for main content areas",
                  "Reasonable time limits with options to extend"
                ]}
                dos={[
                  "Ensure all interactive elements are keyboard accessible",
                  "Provide clear focus indicators",
                  "Use logical tab order",
                  "Allow users to pause or stop animations"
                ]}
                donts={[
                  "Create keyboard traps",
                  "Use very small touch targets (minimum 44px)",
                  "Auto-play media with sound",
                  "Move focus unexpectedly"
                ]}
              />

              <AccessibilityPrinciple
                icon={Users}
                title="3. Understandable"
                description="Information and operation of UI must be understandable to all users."
                examples={[
                  "Clear and simple language",
                  "Consistent navigation patterns",
                  "Form labels and error messages",
                  "Predictable functionality"
                ]}
                dos={[
                  "Use clear, simple language",
                  "Provide form labels and instructions",
                  "Make error messages specific and helpful",
                  "Maintain consistent navigation"
                ]}
                donts={[
                  "Use jargon or complex language unnecessarily",
                  "Change context without warning",
                  "Create unpredictable interactions"
                ]}
              />

              <AccessibilityPrinciple
                icon={Shield}
                title="4. Robust"
                description="Content must be robust enough to be interpreted by a wide variety of user agents."
                examples={[
                  "Valid, semantic HTML markup",
                  "Compatibility with assistive technologies",
                  "Progressive enhancement approach",
                  "Future-proof code practices"
                ]}
                dos={[
                  "Use valid, semantic HTML",
                  "Test with multiple browsers and assistive technologies",
                  "Follow established web standards",
                  "Use ARIA attributes correctly"
                ]}
                donts={[
                  "Rely on proprietary technologies",
                  "Use deprecated HTML elements",
                  "Create custom components without proper ARIA support"
                ]}
              />
            </div>
          </TabsContent>

          {/* Implementation */}
          <TabsContent value="implementation" className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold mb-6">Implementation Guidelines</h2>

              <div className="space-y-8">
                {/* Semantic HTML */}
                <Card>
                  <CardHeader>
                    <CardTitle>Semantic HTML</CardTitle>
                    <CardDescription>
                      Use proper HTML elements for their intended purpose
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <CodeExample
                      title="Good: Semantic Button"
                      code={`// Use semantic button element
<Button onClick={handleClick}>
  Submit Form
</Button>

// Rendered as:
<button type="button" onClick={handleClick}>
  Submit Form
</button>`}
                      description="Screen readers understand this is an interactive button"
                    />

                    <CodeExample
                      title="Bad: Non-semantic Implementation"
                      code={`// Don't use div for interactive elements
<div onClick={handleClick} className="button-like">
  Submit Form
</div>`}
                      description="Screen readers won't recognize this as interactive"
                    />
                  </CardContent>
                </Card>

                {/* ARIA Labels */}
                <Card>
                  <CardHeader>
                    <CardTitle>ARIA Labels and Roles</CardTitle>
                    <CardDescription>
                      Provide additional context for assistive technologies
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <CodeExample
                      title="Icon Buttons"
                      code={`// Icon-only buttons need labels
<Button variant="ghost" size="icon" aria-label="Search">
  <Search className="w-4 h-4" />
</Button>

// Decorative icons should be hidden
<Button>
  <Search className="w-4 h-4" aria-hidden="true" />
  Search Products
</Button>`}
                    />

                    <CodeExample
                      title="Form Fields"
                      code={`// Proper form labeling
<div>
  <Label htmlFor="email">Email Address</Label>
  <Input
    id="email"
    type="email"
    aria-describedby="email-help"
    aria-invalid={hasError}
  />
  <div id="email-help" className="text-sm text-muted-foreground">
    We'll never share your email address
  </div>
  {hasError && (
    <div role="alert" className="text-sm text-red-600">
      Please enter a valid email address
    </div>
  )}
</div>`}
                    />
                  </CardContent>
                </Card>

                {/* Color and Contrast */}
                <Card>
                  <CardHeader>
                    <CardTitle>Color and Contrast</CardTitle>
                    <CardDescription>
                      Ensure sufficient contrast and don't rely solely on color
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <div>
                        <h4 className="font-semibold mb-3 text-green-700">Good Contrast</h4>
                        <div className="space-y-2">
                          <div className="p-3 bg-circleTel-orange text-white rounded">
                            White text on CircleTel Orange (7.2:1)
                          </div>
                          <div className="p-3 bg-circleTel-darkNeutral text-white rounded">
                            White text on Dark Neutral (15.8:1)
                          </div>
                        </div>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-3 text-red-700">Poor Contrast</h4>
                        <div className="space-y-2">
                          <div className="p-3 bg-gray-300 text-gray-400 rounded">
                            Gray text on light gray (2.1:1)
                          </div>
                          <div className="p-3 bg-yellow-200 text-yellow-300 rounded">
                            Light yellow on pale yellow (1.8:1)
                          </div>
                        </div>
                      </div>
                    </div>

                    <CodeExample
                      title="Error States"
                      code={`// Don't rely only on color
<Alert variant="destructive">
  <AlertTriangle className="h-4 w-4" />
  <AlertTitle>Error</AlertTitle>
  <AlertDescription>
    Please fix the errors below
  </AlertDescription>
</Alert>

// Use icons AND color to indicate status
<Input
  className="border-red-500"
  aria-invalid="true"
  aria-describedby="error-message"
/>
<div id="error-message" className="text-red-600 flex items-center gap-1">
  <AlertTriangle className="w-4 h-4" />
  This field is required
</div>`}
                    />
                  </CardContent>
                </Card>

                {/* Focus Management */}
                <Card>
                  <CardHeader>
                    <CardTitle>Focus Management</CardTitle>
                    <CardDescription>
                      Provide clear focus indicators and logical tab order
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <CodeExample
                      title="Focus Indicators"
                      code={`// All interactive elements have focus styles
.focus-visible:outline-none
.focus-visible:ring-2
.focus-visible:ring-ring
.focus-visible:ring-offset-2

// Skip links for keyboard users
<a
  href="#main-content"
  className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-50 bg-primary text-primary-foreground px-4 py-2 rounded"
>
  Skip to main content
</a>`}
                    />

                    <CodeExample
                      title="Modal Focus Trapping"
                      code={`// Focus management in modals
const Modal = ({ isOpen, onClose, children }) => {
  const modalRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      // Focus first focusable element
      const firstFocusable = modalRef.current?.querySelector(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      firstFocusable?.focus();
    }
  }, [isOpen]);

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onClose={onClose}>
      <div ref={modalRef} onKeyDown={handleKeyDown}>
        {children}
      </div>
    </Dialog>
  );
};`}
                    />
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Testing */}
          <TabsContent value="testing" className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold mb-6">Accessibility Testing</h2>

              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Automated Testing Tools</CardTitle>
                    <CardDescription>
                      Use these tools to catch common accessibility issues
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 border rounded-lg">
                        <h4 className="font-semibold mb-2">axe DevTools</h4>
                        <p className="text-sm text-muted-foreground mb-3">
                          Browser extension for automated accessibility testing
                        </p>
                        <Badge variant="secondary">Recommended</Badge>
                      </div>
                      <div className="p-4 border rounded-lg">
                        <h4 className="font-semibold mb-2">Lighthouse</h4>
                        <p className="text-sm text-muted-foreground mb-3">
                          Built into Chrome DevTools for accessibility audits
                        </p>
                        <Badge variant="secondary">Built-in</Badge>
                      </div>
                      <div className="p-4 border rounded-lg">
                        <h4 className="font-semibold mb-2">WAVE</h4>
                        <p className="text-sm text-muted-foreground mb-3">
                          Web accessibility evaluation tool
                        </p>
                        <Badge variant="secondary">Free</Badge>
                      </div>
                      <div className="p-4 border rounded-lg">
                        <h4 className="font-semibold mb-2">Pa11y</h4>
                        <p className="text-sm text-muted-foreground mb-3">
                          Command line accessibility testing
                        </p>
                        <Badge variant="secondary">CI/CD</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Manual Testing Checklist</CardTitle>
                    <CardDescription>
                      Essential manual tests to perform on all components
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold mb-2">Keyboard Navigation</h4>
                        <ul className="space-y-1 text-sm">
                          <li className="flex items-start gap-2">
                            <span className="text-circleTel-orange">•</span>
                            Tab through all interactive elements in logical order
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-circleTel-orange">•</span>
                            Use Enter/Space to activate buttons and links
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-circleTel-orange">•</span>
                            Use arrow keys for menus and tab panels
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-circleTel-orange">•</span>
                            Escape key closes modals and dropdowns
                          </li>
                        </ul>
                      </div>

                      <div>
                        <h4 className="font-semibold mb-2">Screen Reader Testing</h4>
                        <ul className="space-y-1 text-sm">
                          <li className="flex items-start gap-2">
                            <span className="text-circleTel-orange">•</span>
                            Test with NVDA (Windows), JAWS (Windows), or VoiceOver (Mac)
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-circleTel-orange">•</span>
                            Verify all content is announced correctly
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-circleTel-orange">•</span>
                            Check that form labels and instructions are read
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-circleTel-orange">•</span>
                            Ensure error messages are announced
                          </li>
                        </ul>
                      </div>

                      <div>
                        <h4 className="font-semibold mb-2">Visual Testing</h4>
                        <ul className="space-y-1 text-sm">
                          <li className="flex items-start gap-2">
                            <span className="text-circleTel-orange">•</span>
                            Zoom to 200% and verify content is still usable
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-circleTel-orange">•</span>
                            Test with high contrast mode enabled
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-circleTel-orange">•</span>
                            Verify focus indicators are visible
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-circleTel-orange">•</span>
                            Check color contrast ratios
                          </li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Resources */}
          <TabsContent value="resources" className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold mb-6">Additional Resources</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Official Guidelines</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      <li>
                        <a
                          href="https://www.w3.org/WAI/WCAG21/quickref/"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-circleTel-orange hover:underline"
                        >
                          WCAG 2.1 Quick Reference
                        </a>
                      </li>
                      <li>
                        <a
                          href="https://www.w3.org/WAI/ARIA/apg/"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-circleTel-orange hover:underline"
                        >
                          ARIA Authoring Practices Guide
                        </a>
                      </li>
                      <li>
                        <a
                          href="https://webaim.org/"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-circleTel-orange hover:underline"
                        >
                          WebAIM Resources
                        </a>
                      </li>
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Testing Tools</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      <li>
                        <a
                          href="https://www.deque.com/axe/devtools/"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-circleTel-orange hover:underline"
                        >
                          axe DevTools Extension
                        </a>
                      </li>
                      <li>
                        <a
                          href="https://wave.webaim.org/"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-circleTel-orange hover:underline"
                        >
                          WAVE Web Accessibility Evaluator
                        </a>
                      </li>
                      <li>
                        <a
                          href="https://www.tpgi.com/color-contrast-checker/"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-circleTel-orange hover:underline"
                        >
                          Color Contrast Checker
                        </a>
                      </li>
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Learning Resources</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      <li>
                        <a
                          href="https://web.dev/accessibility/"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-circleTel-orange hover:underline"
                        >
                          Web.dev Accessibility Course
                        </a>
                      </li>
                      <li>
                        <a
                          href="https://www.udacity.com/course/web-accessibility--ud891"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-circleTel-orange hover:underline"
                        >
                          Google's Accessibility Course
                        </a>
                      </li>
                      <li>
                        <a
                          href="https://a11yproject.com/"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-circleTel-orange hover:underline"
                        >
                          The A11Y Project
                        </a>
                      </li>
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Screen Readers</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      <li>
                        <a
                          href="https://www.nvaccess.org/download/"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-circleTel-orange hover:underline"
                        >
                          NVDA (Free, Windows)
                        </a>
                      </li>
                      <li>
                        <span className="text-muted-foreground">
                          VoiceOver (Built into macOS)
                        </span>
                      </li>
                      <li>
                        <a
                          href="https://www.freedomscientific.com/products/software/jaws/"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-circleTel-orange hover:underline"
                        >
                          JAWS (Commercial, Windows)
                        </a>
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      <Footer />
    </div>
  );
};

export default AccessibilityGuide;