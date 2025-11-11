'use client';

import React from 'react';
import { Copy, Edit, Download, Eye, ExternalLink } from 'lucide-react';

interface PlanModeProps {
  planData: {
    title: string;
    content: string;
    type: 'flowchart' | 'timeline' | 'roadmap' | 'process' | 'diagram';
  };
  onSave?: (content: string) => void;
  onEdit?: () => void;
}

export default function PlanMode({ planData, onSave, onEdit }: PlanModeProps) {
  // Helper function to clean content and extract from JSON if needed
  const cleanContent = (content: string): string => {
    let cleanContent = content;
    
    // If content looks like JSON, extract the actual content
    if (content.includes('"content":')) {
      try {
        const jsonMatch = content.match(/"content":"([^"]+)"/);
        if (jsonMatch) {
          cleanContent = jsonMatch[1].replace(/\\n/g, '\n');
        }
      } catch (e) {
        console.log('Could not parse JSON content, using raw content');
      }
    }
    
    // Convert \n to actual newlines
    cleanContent = cleanContent.replace(/\\n/g, '\n');
    
    return cleanContent;
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(cleanContent(planData.content));
      // You could add a toast notification here
    } catch (err) {
      console.error('Failed to copy plan content:', err);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([cleanContent(planData.content)], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${planData.title.replace(/\s+/g, '_')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleOpenInNewTab = () => {
    // Create a standalone HTML page for the plan
    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${planData.title}</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif; }
    </style>
</head>
<body class="min-h-screen bg-gray-50">
    <!-- Website Header -->
    <header class="bg-white border-b border-gray-200 px-6 py-4">
        <div class="flex items-center justify-between">
            <div class="flex items-center space-x-3">
                <div class="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                    <span class="text-white text-sm font-bold">📋</span>
                </div>
                <div>
                    <h1 class="text-xl font-bold text-gray-900">${planData.title}</h1>
                    <p class="text-sm text-gray-500">Interactive Plan Document</p>
                </div>
            </div>
            <div class="flex items-center space-x-2 text-sm text-gray-500">
                <span>Generated on ${new Date().toLocaleDateString()}</span>
            </div>
        </div>
    </header>
    
    <!-- Main Content Area -->
    <main class="px-6 py-8">
        <div class="max-w-6xl mx-auto">
            <div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div class="p-8">
                    ${renderPlanContentAsHTML()}
                </div>
            </div>
        </div>
    </main>
</body>
</html>`;

    // Create a blob with the HTML content
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    
    // Open in new tab
    window.open(url, '_blank');
    
    // Clean up the URL after a delay
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const renderPlanContentAsHTML = () => {
    const { content, type } = planData;
    
    switch (type) {
      case 'flowchart':
        return renderFlowchartAsHTML(content);
      case 'timeline':
        return renderTimelineAsHTML(content);
      case 'roadmap':
        return renderRoadmapAsHTML(content);
      case 'process':
        return renderProcessAsHTML(content);
      case 'diagram':
        return renderDiagramAsHTML(content);
      default:
        return renderGenericPlanAsHTML(content);
    }
  };

  const renderFlowchartAsHTML = (content: string) => {
    const cleanContentStr = cleanContent(content);
    const lines = cleanContentStr.split('\n').filter(line => line.trim());
    
    return `
      <div class="max-w-4xl mx-auto">
        <!-- Page Header -->
        <header class="mb-8">
          <h1 class="text-3xl font-bold text-gray-900 mb-2">Process Flowchart</h1>
          <p class="text-gray-600">Visual representation of the workflow process</p>
        </header>
        
        <!-- Flowchart Content -->
        <main class="space-y-6">
          ${lines.map((line, index) => {
            let cleanLine = line.replace(/^\d+\.\s*/, '').replace(/\*\*/g, '').trim();
            
            if (line.includes('→') || line.includes('->') || line.includes('→')) {
              const parts = line.split(/[→\->]/);
              return `
                <section class="flex items-center justify-center space-x-8">
                  <div class="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                    <h3 class="font-semibold text-gray-900">${parts[0]?.trim().replace(/^\d+\.\s*/, '').replace(/\*\*/g, '')}</h3>
                  </div>
                  <div class="flex items-center">
                    <div class="w-8 h-0.5 bg-gray-300"></div>
                    <div class="mx-2 text-gray-400">→</div>
                    <div class="w-8 h-0.5 bg-gray-300"></div>
                  </div>
                  <div class="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                    <h3 class="font-semibold text-gray-900">${parts[1]?.trim().replace(/^\d+\.\s*/, '').replace(/\*\*/g, '')}</h3>
                  </div>
                </section>
              `;
            }
            
            if (cleanLine.includes('?') || cleanLine.includes('if') || cleanLine.includes('decision') || cleanLine.includes('valid') || cleanLine.includes('check')) {
              return `
                <section class="flex items-center justify-center">
                  <div class="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-6 max-w-md">
                    <div class="text-center">
                      <div class="w-4 h-4 bg-yellow-400 rounded-full mx-auto mb-3"></div>
                      <h3 class="font-bold text-gray-900 mb-2">${cleanLine}</h3>
                      <p class="text-sm text-gray-600">Decision Point</p>
                    </div>
                  </div>
                </section>
              `;
            }
            
            if (cleanLine.toLowerCase().includes('start') || cleanLine.toLowerCase().includes('begin')) {
              return `
                <section class="flex items-center justify-center">
                  <div class="bg-green-50 border-2 border-green-200 rounded-full px-8 py-4">
                    <div class="text-center">
                      <div class="w-6 h-6 bg-green-500 rounded-full mx-auto mb-2"></div>
                      <h3 class="font-bold text-green-800">START</h3>
                      <p class="text-sm text-green-600">${cleanLine}</p>
                    </div>
                  </div>
                </section>
              `;
            }
            
            if (cleanLine.toLowerCase().includes('end') || cleanLine.toLowerCase().includes('logout') || cleanLine.toLowerCase().includes('dashboard')) {
              return `
                <section class="flex items-center justify-center">
                  <div class="bg-red-50 border-2 border-red-200 rounded-full px-8 py-4">
                    <div class="text-center">
                      <div class="w-6 h-6 bg-red-500 rounded-full mx-auto mb-2"></div>
                      <h3 class="font-bold text-red-800">END</h3>
                      <p class="text-sm text-red-600">${cleanLine}</p>
                    </div>
                  </div>
                </section>
              `;
            }
            
            return `
              <section class="flex items-center justify-center">
                <div class="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow max-w-md">
                  <h3 class="font-semibold text-gray-900">${cleanLine}</h3>
                </div>
              </section>
            `;
          }).join('')}
        </main>
      </div>
    `;
  };

  const renderRoadmapAsHTML = (content: string) => {
    const cleanContentStr = cleanContent(content);
    const lines = cleanContentStr.split('\n').filter(line => line.trim());
    
    return `
      <div class="max-w-4xl mx-auto">
        <!-- Page Header -->
        <header class="mb-8">
          <h1 class="text-3xl font-bold text-gray-900 mb-2">Product Roadmap</h1>
          <p class="text-gray-600">Strategic timeline and milestones for product development</p>
        </header>
        
        <!-- Roadmap Content -->
        <main class="space-y-8">
          ${lines.map((line, index) => {
            let cleanLine = line.replace(/^\d+\.\s*/, '').replace(/\*\*/g, '').trim();
            
            if (cleanLine.match(/quarter|month|phase|release/i)) {
              return `
                <section class="border-l-4 border-purple-500 pl-6 mb-8">
                  <div class="bg-purple-50 border border-purple-200 rounded-lg p-6">
                    <div class="flex items-center mb-4">
                      <div class="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center mr-3">
                        <span class="text-white text-sm font-bold">📅</span>
                      </div>
                      <h2 class="text-xl font-bold text-purple-900">${cleanLine}</h2>
                    </div>
                  </div>
                </section>
              `;
            }
            
            const isMilestone = cleanLine.match(/milestone|goal|target|objective|release|launch/i);
            const isTask = cleanLine.match(/task|action|todo|item|feature|development|testing/i);
            
            if (isMilestone) {
              return `
                <article class="bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
                  <div class="flex items-start">
                    <div class="w-4 h-4 bg-blue-500 rounded-full mt-1 mr-4 flex-shrink-0"></div>
                    <div>
                      <h3 class="font-semibold text-gray-900 mb-2">${cleanLine}</h3>
                      <div class="flex items-center text-sm text-gray-500">
                        <span class="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">Milestone</span>
                      </div>
                    </div>
                  </div>
                </article>
              `;
            }
            
            if (isTask) {
              return `
                <article class="bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow ml-8">
                  <div class="flex items-start">
                    <div class="w-3 h-3 bg-green-500 rounded-full mt-1.5 mr-4 flex-shrink-0"></div>
                    <div>
                      <h4 class="font-medium text-gray-900 mb-1">${cleanLine}</h4>
                      <div class="flex items-center text-sm text-gray-500">
                        <span class="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">Task</span>
                      </div>
                    </div>
                  </div>
                </article>
              `;
            }
            
            return `
              <article class="bg-gray-50 border border-gray-200 rounded-lg p-4 ml-12">
                <div class="flex items-start">
                  <div class="w-2 h-2 bg-gray-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <p class="text-gray-700">${cleanLine}</p>
                </div>
              </article>
            `;
          }).join('')}
        </main>
      </div>
    `;
  };

  const renderTimelineAsHTML = (content: string) => {
    const cleanContentStr = cleanContent(content);
    const lines = cleanContentStr.split('\n').filter(line => line.trim());
    
    return `
      <div class="max-w-4xl mx-auto">
        <!-- Page Header -->
        <header class="mb-8">
          <h1 class="text-3xl font-bold text-gray-900 mb-2">Project Timeline</h1>
          <p class="text-gray-600">Sequential phases and milestones for project development</p>
        </header>
        
        <!-- Timeline Content -->
        <main class="space-y-6">
          ${lines.map((line, index) => {
            let cleanLine = line.replace(/^\d+\.\s*/, '').replace(/\*\*/g, '').trim();
            
            // Detect quarters/phases
            if (cleanLine.match(/q[1-4]:|phase|timeline/i)) {
              return `
                <section class="border-l-4 border-blue-500 pl-6 mb-8">
                  <div class="bg-blue-50 border border-blue-200 rounded-lg p-6">
                    <div class="flex items-center mb-4">
                      <div class="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center mr-3">
                        <span class="text-white text-sm font-bold">📅</span>
                      </div>
                      <h2 class="text-xl font-bold text-blue-900">${cleanLine}</h2>
                    </div>
                  </div>
                </section>
              `;
            }
            
            // Detect tasks/items
            if (cleanLine.startsWith('-') || cleanLine.startsWith('•')) {
              return `
                <article class="bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow ml-8">
                  <div class="flex items-start">
                    <div class="w-3 h-3 bg-green-500 rounded-full mt-1.5 mr-4 flex-shrink-0"></div>
                    <div>
                      <h4 class="font-medium text-gray-900 mb-1">${cleanLine.replace(/^[-•]\s*/, '')}</h4>
                      <div class="flex items-center text-sm text-gray-500">
                        <span class="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">Task</span>
                      </div>
                    </div>
                  </div>
                </article>
              `;
            }
            
            // Regular items
            return `
              <article class="bg-gray-50 border border-gray-200 rounded-lg p-4 ml-12">
                <div class="flex items-start">
                  <div class="w-2 h-2 bg-gray-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <p class="text-gray-700">${cleanLine}</p>
                </div>
              </article>
            `;
          }).join('')}
        </main>
      </div>
    `;
  };

  const renderProcessAsHTML = (content: string) => {
    return `<div class="max-w-4xl mx-auto"><h1 class="text-3xl font-bold text-gray-900 mb-8">Process</h1><div class="space-y-4">${content.split('\n').map(line => `<div class="bg-white border border-gray-200 rounded-lg p-4"><p class="text-gray-900">${line}</p></div>`).join('')}</div></div>`;
  };

  const renderDiagramAsHTML = (content: string) => {
    return `<div class="max-w-4xl mx-auto"><h1 class="text-3xl font-bold text-gray-900 mb-8">Diagram</h1><div class="space-y-4">${content.split('\n').map(line => `<div class="bg-white border border-gray-200 rounded-lg p-4"><p class="text-gray-900">${line}</p></div>`).join('')}</div></div>`;
  };

  const renderGenericPlanAsHTML = (content: string) => {
    return `<div class="max-w-4xl mx-auto"><h1 class="text-3xl font-bold text-gray-900 mb-8">Plan</h1><div class="space-y-4">${content.split('\n').map(line => `<div class="bg-white border border-gray-200 rounded-lg p-4"><p class="text-gray-900">${line}</p></div>`).join('')}</div></div>`;
  };

  const renderPlanContent = () => {
    const { content, type } = planData;
    
    switch (type) {
      case 'flowchart':
        return renderFlowchart(content);
      case 'timeline':
        return renderTimeline(content);
      case 'roadmap':
        return renderRoadmap(content);
      case 'process':
        return renderProcess(content);
      case 'diagram':
        return renderDiagram(content);
      default:
        return renderGenericPlan(content);
    }
  };

  const renderFlowchart = (content: string) => {
    const lines = content.split('\n').filter(line => line.trim());
    
    return (
      <div className="max-w-4xl mx-auto">
        {/* Page Header */}
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Process Flowchart</h1>
          <p className="text-gray-600">Visual representation of the workflow process</p>
        </header>
        
        {/* Flowchart Content */}
        <main className="space-y-6">
          {lines.map((line, index) => {
            // Clean up the line
            let cleanLine = line.replace(/^\d+\.\s*/, '').replace(/\*\*/g, '').trim();
            
            // Detect flowchart elements with arrows
            if (line.includes('→') || line.includes('->') || line.includes('→')) {
              const parts = line.split(/[→\->]/);
              return (
                <section key={index} className="flex items-center justify-center space-x-8">
                  <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                    <h3 className="font-semibold text-gray-900">{parts[0]?.trim().replace(/^\d+\.\s*/, '').replace(/\*\*/g, '')}</h3>
                  </div>
                  <div className="flex items-center">
                    <div className="w-8 h-0.5 bg-gray-300"></div>
                    <div className="mx-2 text-gray-400">→</div>
                    <div className="w-8 h-0.5 bg-gray-300"></div>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                    <h3 className="font-semibold text-gray-900">{parts[1]?.trim().replace(/^\d+\.\s*/, '').replace(/\*\*/g, '')}</h3>
                  </div>
                </section>
              );
            }
            
            // Detect decision points
            if (cleanLine.includes('?') || cleanLine.includes('if') || cleanLine.includes('decision') || cleanLine.includes('valid') || cleanLine.includes('check')) {
              return (
                <section key={index} className="flex items-center justify-center">
                  <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-6 max-w-md">
                    <div className="text-center">
                      <div className="w-4 h-4 bg-yellow-400 rounded-full mx-auto mb-3"></div>
                      <h3 className="font-bold text-gray-900 mb-2">{cleanLine}</h3>
                      <p className="text-sm text-gray-600">Decision Point</p>
                    </div>
                  </div>
                </section>
              );
            }
            
            // Detect start/end points
            if (cleanLine.toLowerCase().includes('start') || cleanLine.toLowerCase().includes('begin')) {
              return (
                <section key={index} className="flex items-center justify-center">
                  <div className="bg-green-50 border-2 border-green-200 rounded-full px-8 py-4">
                    <div className="text-center">
                      <div className="w-6 h-6 bg-green-500 rounded-full mx-auto mb-2"></div>
                      <h3 className="font-bold text-green-800">START</h3>
                      <p className="text-sm text-green-600">{cleanLine}</p>
                    </div>
                  </div>
                </section>
              );
            }
            
            if (cleanLine.toLowerCase().includes('end') || cleanLine.toLowerCase().includes('logout') || cleanLine.toLowerCase().includes('dashboard')) {
              return (
                <section key={index} className="flex items-center justify-center">
                  <div className="bg-red-50 border-2 border-red-200 rounded-full px-8 py-4">
                    <div className="text-center">
                      <div className="w-6 h-6 bg-red-500 rounded-full mx-auto mb-2"></div>
                      <h3 className="font-bold text-red-800">END</h3>
                      <p className="text-sm text-red-600">{cleanLine}</p>
                    </div>
                  </div>
                </section>
              );
            }
            
            // Regular process steps
            return (
              <section key={index} className="flex items-center justify-center">
                <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow max-w-md">
                  <h3 className="font-semibold text-gray-900">{cleanLine}</h3>
                </div>
              </section>
            );
          })}
        </main>
      </div>
    );
  };

  const renderTimeline = (content: string) => {
    const cleanContentStr = cleanContent(content);
    const lines = cleanContentStr.split('\n').filter(line => line.trim());
    
    return (
      <div className="max-w-4xl mx-auto">
        {/* Page Header */}
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Project Timeline</h1>
          <p className="text-gray-600">Sequential phases and milestones for project development</p>
        </header>
        
        {/* Timeline Content */}
        <main className="space-y-6">
          {lines.map((line, index) => {
            let cleanLine = line.replace(/^\d+\.\s*/, '').replace(/\*\*/g, '').trim();
            
            // Detect quarters/phases
            if (cleanLine.match(/q[1-4]:|phase|timeline/i)) {
              return (
                <section key={index} className="border-l-4 border-blue-500 pl-6 mb-8">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                    <div className="flex items-center mb-4">
                      <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center mr-3">
                        <span className="text-white text-sm font-bold">📅</span>
                      </div>
                      <h2 className="text-xl font-bold text-blue-900">{cleanLine}</h2>
                    </div>
                  </div>
                </section>
              );
            }
            
            // Detect tasks/items
            if (cleanLine.startsWith('-') || cleanLine.startsWith('•')) {
              return (
                <article key={index} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow ml-8">
                  <div className="flex items-start">
                    <div className="w-3 h-3 bg-green-500 rounded-full mt-1.5 mr-4 flex-shrink-0"></div>
                    <div>
                      <h4 className="font-medium text-gray-900 mb-1">{cleanLine.replace(/^[-•]\s*/, '')}</h4>
                      <div className="flex items-center text-sm text-gray-500">
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">Task</span>
                      </div>
                    </div>
                  </div>
                </article>
              );
            }
            
            // Regular items
            return (
              <article key={index} className="bg-gray-50 border border-gray-200 rounded-lg p-4 ml-12">
                <div className="flex items-start">
                  <div className="w-2 h-2 bg-gray-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <p className="text-gray-700">{cleanLine}</p>
                </div>
              </article>
            );
          })}
        </main>
      </div>
    );
  };

  const renderRoadmap = (content: string) => {
    const lines = content.split('\n').filter(line => line.trim());
    
    return (
      <div className="max-w-4xl mx-auto">
        {/* Page Header */}
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Product Roadmap</h1>
          <p className="text-gray-600">Strategic timeline and milestones for product development</p>
        </header>
        
        {/* Roadmap Content */}
        <main className="space-y-8">
          {lines.map((line, index) => {
            // Clean up the line
            let cleanLine = line.replace(/^\d+\.\s*/, '').replace(/\*\*/g, '').trim();
            
            // Detect quarters/sections
            if (cleanLine.match(/quarter|month|phase|release/i)) {
              return (
                <section key={index} className="border-l-4 border-purple-500 pl-6 mb-8">
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
                    <div className="flex items-center mb-4">
                      <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center mr-3">
                        <span className="text-white text-sm font-bold">📅</span>
                      </div>
                      <h2 className="text-xl font-bold text-purple-900">{cleanLine}</h2>
                    </div>
                  </div>
                </section>
              );
            }
            
            // Detect milestones/goals
            const isMilestone = cleanLine.match(/milestone|goal|target|objective|release|launch/i);
            const isTask = cleanLine.match(/task|action|todo|item|feature|development|testing/i);
            
            if (isMilestone) {
              return (
                <article key={index} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-start">
                    <div className="w-4 h-4 bg-blue-500 rounded-full mt-1 mr-4 flex-shrink-0"></div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">{cleanLine}</h3>
                      <div className="flex items-center text-sm text-gray-500">
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">Milestone</span>
                      </div>
                    </div>
                  </div>
                </article>
              );
            }
            
            if (isTask) {
              return (
                <article key={index} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow ml-8">
                  <div className="flex items-start">
                    <div className="w-3 h-3 bg-green-500 rounded-full mt-1.5 mr-4 flex-shrink-0"></div>
                    <div>
                      <h4 className="font-medium text-gray-900 mb-1">{cleanLine}</h4>
                      <div className="flex items-center text-sm text-gray-500">
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">Task</span>
                      </div>
                    </div>
                  </div>
                </article>
              );
            }
            
            // Regular items
            return (
              <article key={index} className="bg-gray-50 border border-gray-200 rounded-lg p-4 ml-12">
                <div className="flex items-start">
                  <div className="w-2 h-2 bg-gray-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <p className="text-gray-700">{cleanLine}</p>
                </div>
              </article>
            );
          })}
        </main>
      </div>
    );
  };

  const renderProcess = (content: string) => {
    const lines = content.split('\n').filter(line => line.trim());
    
    return (
      <div className="space-y-2">
        {lines.map((line, index) => {
          const isStart = line.match(/start|begin|initiate/i);
          const isEnd = line.match(/end|finish|complete|done/i);
          const isProcess = line.match(/process|step|action/i);
          
          return (
            <div key={index} className="flex items-center space-x-3">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                isStart ? 'bg-green-500 text-white' :
                isEnd ? 'bg-red-500 text-white' :
                isProcess ? 'bg-primary text-primary-foreground' :
                'bg-muted text-muted-foreground'
              }`}>
                {isStart ? 'S' : isEnd ? 'E' : index + 1}
              </div>
              <div className="flex-1 bg-card border border-border px-3 py-2 rounded-lg text-sm">
                {line}
              </div>
              {index < lines.length - 1 && (
                <div className="text-muted-foreground">↓</div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const renderDiagram = (content: string) => {
    // For generic diagrams, render as structured text
    return (
      <div className="space-y-2">
        {content.split('\n').map((line, index) => (
          <div key={index} className="bg-card border border-border px-3 py-2 rounded-lg text-sm">
            {line}
          </div>
        ))}
      </div>
    );
  };

  const renderGenericPlan = (content: string) => {
    return (
      <div className="space-y-2">
        {content.split('\n').map((line, index) => (
          <div key={index} className="bg-card border border-border px-3 py-2 rounded-lg text-sm">
            {line}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Website Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-sm font-bold">📋</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{planData.title}</h1>
              <p className="text-sm text-gray-500">Interactive Plan Document</p>
            </div>
          </div>
          <nav className="flex items-center space-x-2">
            <button
              onClick={handleOpenInNewTab}
              className="px-3 py-2 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors duration-200 border border-blue-200"
              title="Open in new tab"
            >
              <ExternalLink className="w-4 h-4 mr-1 inline" />
              Open in New Tab
            </button>
            <button
              onClick={handleCopy}
              className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors duration-200"
              title="Copy plan"
            >
              <Copy className="w-4 h-4 mr-1 inline" />
              Copy
            </button>
            <button
              onClick={onEdit}
              className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors duration-200"
              title="Edit plan"
            >
              <Edit className="w-4 h-4 mr-1 inline" />
              Edit
            </button>
            <button
              onClick={handleDownload}
              className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors duration-200"
              title="Download plan"
            >
              <Download className="w-4 h-4 mr-1 inline" />
              Download
            </button>
          </nav>
        </div>
      </header>
      
      {/* Main Content Area */}
      <main className="px-6 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-8">
              {renderPlanContent()}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}