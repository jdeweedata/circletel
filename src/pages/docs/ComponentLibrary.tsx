/**
 * Component Library Documentation Page
 */

import React, { useState } from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import { Copy, Check, ArrowLeft, Search, Settings, AlertCircle, CheckCircle, Info, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';

const ComponentLibrary = () => {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const CodeBlock = ({ code, title }: { code: string; title?: string }) => (
    <div className="relative">
      {title && (
        <div className="text-sm font-medium text-muted-foreground mb-2">{title}</div>
      )}
      <div className="relative bg-muted rounded-lg p-4 font-mono text-sm">
        <pre className="overflow-x-auto">{code}</pre>
        <Button
          variant="ghost"
          size="sm"
          className="absolute top-2 right-2"
          onClick={() => copyToClipboard(code)}
        >
          {copiedCode === code ? (
            <Check className="w-4 h-4" />
          ) : (
            <Copy className="w-4 h-4" />
          )}
        </Button>
      </div>
    </div>
  );

  const ComponentExample = ({
    title,
    description,
    children,
    code,
    props
  }: {
    title: string;
    description: string;
    children: React.ReactNode;
    code: string;
    props?: Array<{ name: string; type: string; description: string; default?: string }>;
  }) => (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {title}
          <Badge variant="secondary">Component</Badge>
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Live Example */}
        <div>
          <h4 className="font-semibold mb-3">Example</h4>
          <div className="p-6 border rounded-lg bg-background">
            {children}
          </div>
        </div>

        {/* Code */}
        <div>
          <h4 className="font-semibold mb-3">Code</h4>
          <CodeBlock code={code} />
        </div>

        {/* Props */}
        {props && (
          <div>
            <h4 className="font-semibold mb-3">Props</h4>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left p-3 font-medium">Name</th>
                    <th className="text-left p-3 font-medium">Type</th>
                    <th className="text-left p-3 font-medium">Description</th>
                    <th className="text-left p-3 font-medium">Default</th>
                  </tr>
                </thead>
                <tbody>
                  {props.map((prop, index) => (
                    <tr key={prop.name} className={index % 2 === 0 ? 'bg-background' : 'bg-muted/50'}>
                      <td className="p-3 font-mono text-sm">{prop.name}</td>
                      <td className="p-3 font-mono text-sm text-blue-600">{prop.type}</td>
                      <td className="p-3 text-sm">{prop.description}</td>
                      <td className="p-3 font-mono text-sm text-muted-foreground">{prop.default || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
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
          <Badge variant="secondary" className="mb-4">Component Library</Badge>
          <h1 className="text-4xl font-bold font-inter mb-4">Components</h1>
          <p className="text-xl text-muted-foreground max-w-3xl">
            Comprehensive documentation for all CircleTel design system components,
            including usage examples, props, and implementation guidelines.
          </p>
        </div>

        {/* Search */}
        <div className="mb-8">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search components..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <Tabs defaultValue="atoms" className="space-y-8">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="atoms">Atoms</TabsTrigger>
            <TabsTrigger value="molecules">Molecules</TabsTrigger>
            <TabsTrigger value="organisms">Organisms</TabsTrigger>
          </TabsList>

          {/* Atoms */}
          <TabsContent value="atoms" className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold mb-6">Atoms</h2>
              <p className="text-muted-foreground mb-8">
                Basic building blocks of the design system. These are the fundamental HTML elements
                styled according to our design tokens.
              </p>

              {/* Buttons */}
              <ComponentExample
                title="Button"
                description="Primary action component with multiple variants and sizes"
                code={`import { Button } from '@/design-system';

<Button variant="default" size="lg">
  Primary Button
</Button>

<Button variant="outline" size="md">
  Secondary Button
</Button>

<Button variant="ghost" size="sm">
  Ghost Button
</Button>`}
                props={[
                  { name: 'variant', type: 'string', description: 'Button style variant', default: 'default' },
                  { name: 'size', type: 'string', description: 'Button size', default: 'md' },
                  { name: 'disabled', type: 'boolean', description: 'Disabled state', default: 'false' },
                  { name: 'asChild', type: 'boolean', description: 'Render as child component', default: 'false' },
                ]}
              >
                <div className="flex flex-wrap gap-4">
                  <Button variant="default" size="lg">Primary Button</Button>
                  <Button variant="outline" size="md">Secondary Button</Button>
                  <Button variant="ghost" size="sm">Ghost Button</Button>
                  <Button variant="destructive" size="md">Destructive</Button>
                </div>
              </ComponentExample>

              {/* Input */}
              <ComponentExample
                title="Input"
                description="Text input field with consistent styling and states"
                code={`import { Input, Label } from '@/design-system';

<div className="space-y-2">
  <Label htmlFor="email">Email</Label>
  <Input
    id="email"
    type="email"
    placeholder="Enter your email"
  />
</div>`}
                props={[
                  { name: 'type', type: 'string', description: 'Input type', default: 'text' },
                  { name: 'placeholder', type: 'string', description: 'Placeholder text' },
                  { name: 'disabled', type: 'boolean', description: 'Disabled state', default: 'false' },
                  { name: 'className', type: 'string', description: 'Additional CSS classes' },
                ]}
              >
                <div className="space-y-4 max-w-sm">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" placeholder="Enter your email" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input id="password" type="password" placeholder="Enter your password" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="disabled">Disabled Input</Label>
                    <Input id="disabled" disabled placeholder="Disabled input" />
                  </div>
                </div>
              </ComponentExample>

              {/* Textarea */}
              <ComponentExample
                title="Textarea"
                description="Multi-line text input for longer content"
                code={`import { Textarea, Label } from '@/design-system';

<div className="space-y-2">
  <Label htmlFor="message">Message</Label>
  <Textarea
    id="message"
    placeholder="Enter your message..."
    rows={4}
  />
</div>`}
                props={[
                  { name: 'rows', type: 'number', description: 'Number of visible rows', default: '3' },
                  { name: 'placeholder', type: 'string', description: 'Placeholder text' },
                  { name: 'disabled', type: 'boolean', description: 'Disabled state', default: 'false' },
                ]}
              >
                <div className="space-y-2 max-w-sm">
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    placeholder="Enter your message..."
                    rows={4}
                  />
                </div>
              </ComponentExample>

              {/* Form Controls */}
              <ComponentExample
                title="Form Controls"
                description="Checkboxes, switches, and other form controls"
                code={`import { Checkbox, Switch, Label } from '@/design-system';

<div className="space-y-4">
  <div className="flex items-center space-x-2">
    <Checkbox id="terms" />
    <Label htmlFor="terms">Accept terms and conditions</Label>
  </div>

  <div className="flex items-center space-x-2">
    <Switch id="notifications" />
    <Label htmlFor="notifications">Enable notifications</Label>
  </div>
</div>`}
              >
                <div className="space-y-4 max-w-sm">
                  <div className="flex items-center space-x-2">
                    <Checkbox id="terms" />
                    <Label htmlFor="terms">Accept terms and conditions</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch id="notifications" />
                    <Label htmlFor="notifications">Enable notifications</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox id="marketing" />
                    <Label htmlFor="marketing">Receive marketing emails</Label>
                  </div>
                </div>
              </ComponentExample>

              {/* Progress & Sliders */}
              <ComponentExample
                title="Progress & Sliders"
                description="Progress indicators and range inputs"
                code={`import { Progress, Slider } from '@/design-system';

<div className="space-y-6">
  <div>
    <Label>Upload Progress</Label>
    <Progress value={75} className="mt-2" />
  </div>

  <div>
    <Label>Volume</Label>
    <Slider defaultValue={[50]} max={100} step={1} className="mt-2" />
  </div>
</div>`}
              >
                <div className="space-y-6 max-w-sm">
                  <div>
                    <Label>Upload Progress</Label>
                    <Progress value={75} className="mt-2" />
                  </div>

                  <div>
                    <Label>Volume</Label>
                    <Slider defaultValue={[50]} max={100} step={1} className="mt-2" />
                  </div>
                </div>
              </ComponentExample>
            </div>
          </TabsContent>

          {/* Molecules */}
          <TabsContent value="molecules" className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold mb-6">Molecules</h2>
              <p className="text-muted-foreground mb-8">
                Simple combinations of atoms that function together as a cohesive unit.
              </p>

              {/* Alerts */}
              <ComponentExample
                title="Alert"
                description="Contextual feedback messages for user actions"
                code={`import { Alert, AlertDescription, AlertTitle } from '@/design-system';
import { AlertCircle, CheckCircle, Info } from 'lucide-react';

<Alert>
  <Info className="h-4 w-4" />
  <AlertTitle>Information</AlertTitle>
  <AlertDescription>
    This is an informational message.
  </AlertDescription>
</Alert>`}
              >
                <div className="space-y-4">
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertTitle>Information</AlertTitle>
                    <AlertDescription>
                      This is an informational message about the current process.
                    </AlertDescription>
                  </Alert>

                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>
                      Something went wrong. Please try again.
                    </AlertDescription>
                  </Alert>

                  <Alert className="border-green-200 bg-green-50 text-green-900">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertTitle>Success</AlertTitle>
                    <AlertDescription>
                      Your changes have been saved successfully.
                    </AlertDescription>
                  </Alert>
                </div>
              </ComponentExample>

              {/* Cards */}
              <ComponentExample
                title="Card"
                description="Flexible content containers with header, content, and footer sections"
                code={`import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/design-system';

<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
    <CardDescription>
      Card description goes here
    </CardDescription>
  </CardHeader>
  <CardContent>
    <p>Card content goes here.</p>
  </CardContent>
  <CardFooter>
    <Button>Action</Button>
  </CardFooter>
</Card>`}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Business Connect</CardTitle>
                      <CardDescription>
                        Essential connectivity package for small businesses
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        Includes high-speed internet, business phone system, and basic security features.
                      </p>
                    </CardContent>
                    <CardFooter>
                      <Button>Learn More</Button>
                    </CardFooter>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Enterprise Pro</CardTitle>
                      <CardDescription>
                        Complete solution for large organizations
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        Advanced networking, dedicated support, and enterprise-grade security.
                      </p>
                    </CardContent>
                    <CardFooter>
                      <Button variant="outline">Contact Sales</Button>
                    </CardFooter>
                  </Card>
                </div>
              </ComponentExample>
            </div>
          </TabsContent>

          {/* Organisms */}
          <TabsContent value="organisms" className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold mb-6">Organisms</h2>
              <p className="text-muted-foreground mb-8">
                Complex components composed of molecules and atoms that form distinct sections of an interface.
              </p>

              <Alert>
                <Settings className="h-4 w-4" />
                <AlertTitle>Work in Progress</AlertTitle>
                <AlertDescription>
                  Organism components documentation is currently being developed.
                  Check back soon for comprehensive examples and usage guidelines.
                </AlertDescription>
              </Alert>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      <Footer />
    </div>
  );
};

export default ComponentLibrary;