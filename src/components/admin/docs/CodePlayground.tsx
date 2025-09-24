import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Play,
  Copy,
  RotateCcw,
  CheckCircle,
  AlertTriangle,
  Code,
  Eye
} from 'lucide-react';

interface CodeExample {
  id: string;
  title: string;
  description: string;
  language: 'typescript' | 'javascript' | 'sql' | 'bash';
  code: string;
  editable?: boolean;
}

interface CodePlaygroundProps {
  examples: CodeExample[];
  title?: string;
  description?: string;
}

export const CodePlayground: React.FC<CodePlaygroundProps> = ({
  examples,
  title = "Code Examples",
  description = "Interactive code examples and documentation"
}) => {
  const [activeExample, setActiveExample] = useState(examples[0]?.id || '');
  const [editedCode, setEditedCode] = useState<Record<string, string>>({});
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [outputs, setOutputs] = useState<Record<string, {
    success: boolean;
    message: string;
    output?: string;
    error?: string;
    rows?: string;
    timestamp: string;
  }>>({});

  const currentExample = examples.find(ex => ex.id === activeExample);

  useEffect(() => {
    // Initialize edited code with original code
    const initialCode: Record<string, string> = {};
    examples.forEach(example => {
      initialCode[example.id] = example.code;
    });
    setEditedCode(initialCode);
  }, [examples]);

  const copyToClipboard = (code: string, exampleId: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(exampleId);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const resetCode = (exampleId: string) => {
    const example = examples.find(ex => ex.id === exampleId);
    if (example) {
      setEditedCode(prev => ({
        ...prev,
        [exampleId]: example.code
      }));
    }
  };

  const executeCode = (exampleId: string) => {
    const code = editedCode[exampleId];
    const example = examples.find(ex => ex.id === exampleId);

    if (!code || !example) return;

    try {
      if (example.language === 'javascript' || example.language === 'typescript') {
        // For demo purposes, we'll just validate syntax and show a success message
        // In a real implementation, you might use a sandboxed execution environment
        const result = {
          success: true,
          message: 'Code executed successfully!',
          output: 'Console output would appear here...',
          timestamp: new Date().toLocaleTimeString()
        };
        setOutputs(prev => ({ ...prev, [exampleId]: result }));
      } else if (example.language === 'sql') {
        // Mock SQL execution
        const result = {
          success: true,
          message: 'SQL query validated successfully!',
          output: 'Query result would appear here...',
          rows: 'Affected rows: 1',
          timestamp: new Date().toLocaleTimeString()
        };
        setOutputs(prev => ({ ...prev, [exampleId]: result }));
      } else if (example.language === 'bash') {
        // Mock bash command execution
        const result = {
          success: true,
          message: 'Command syntax validated!',
          output: 'Command output would appear here...',
          timestamp: new Date().toLocaleTimeString()
        };
        setOutputs(prev => ({ ...prev, [exampleId]: result }));
      }
    } catch (error) {
      const result = {
        success: false,
        message: 'Execution failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toLocaleTimeString()
      };
      setOutputs(prev => ({ ...prev, [exampleId]: result }));
    }
  };

  const getLanguageColor = (language: string) => {
    switch (language) {
      case 'typescript': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'javascript': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'sql': return 'bg-green-100 text-green-800 border-green-200';
      case 'bash': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (!examples.length) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          No code examples available for this section.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Code className="h-5 w-5 text-circleTel-orange" />
          {title}
        </CardTitle>
        {description && (
          <p className="text-muted-foreground">{description}</p>
        )}
      </CardHeader>
      <CardContent>
        <Tabs value={activeExample} onValueChange={setActiveExample}>
          {/* Tab List */}
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
            {examples.map((example) => (
              <TabsTrigger key={example.id} value={example.id} className="text-xs">
                <div className="flex items-center gap-1">
                  <span>{example.title}</span>
                  <Badge
                    variant="outline"
                    className={`text-xs ${getLanguageColor(example.language)}`}
                  >
                    {example.language}
                  </Badge>
                </div>
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Tab Content */}
          {examples.map((example) => (
            <TabsContent key={example.id} value={example.id} className="mt-4">
              <div className="space-y-4">
                {/* Example Description */}
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    {example.description}
                  </p>
                </div>

                {/* Code Editor */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={getLanguageColor(example.language)}>
                        {example.language}
                      </Badge>
                      {example.editable && (
                        <Badge variant="secondary" className="text-xs">
                          Editable
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(editedCode[example.id] || example.code, example.id)}
                      >
                        {copiedCode === example.id ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                        Copy
                      </Button>
                      {example.editable && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => resetCode(example.id)}
                          >
                            <RotateCcw className="h-4 w-4" />
                            Reset
                          </Button>
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => executeCode(example.id)}
                          >
                            <Play className="h-4 w-4" />
                            Run
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                  {example.editable ? (
                    <Textarea
                      value={editedCode[example.id] || example.code}
                      onChange={(e) => setEditedCode(prev => ({
                        ...prev,
                        [example.id]: e.target.value
                      }))}
                      className="font-mono text-sm min-h-[200px] bg-black text-green-400"
                      placeholder="Enter your code here..."
                    />
                  ) : (
                    <pre className="bg-black text-green-400 p-4 rounded-lg text-sm overflow-x-auto min-h-[200px]">
                      <code>{example.code}</code>
                    </pre>
                  )}
                </div>

                {/* Output Section */}
                {outputs[example.id] && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4" />
                      <span className="font-semibold">Output</span>
                    </div>
                    <Alert className={outputs[example.id].success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
                      <AlertDescription>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            {outputs[example.id].success ? (
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            ) : (
                              <AlertTriangle className="h-4 w-4 text-red-600" />
                            )}
                            <span className="font-medium">{outputs[example.id].message}</span>
                            <Badge variant="outline" className="text-xs">
                              {outputs[example.id].timestamp}
                            </Badge>
                          </div>
                          {outputs[example.id].output && (
                            <pre className="bg-black text-green-400 p-2 rounded text-xs">
                              {outputs[example.id].output}
                            </pre>
                          )}
                          {outputs[example.id].rows && (
                            <div className="text-sm text-muted-foreground">
                              {outputs[example.id].rows}
                            </div>
                          )}
                          {outputs[example.id].error && (
                            <div className="text-sm text-red-600 font-mono">
                              Error: {outputs[example.id].error}
                            </div>
                          )}
                        </div>
                      </AlertDescription>
                    </Alert>
                  </div>
                )}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default CodePlayground;