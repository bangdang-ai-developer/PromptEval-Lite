# PromptEval-Lite Frontend

A beautiful, modern React frontend for the PromptEval-Lite API built with TypeScript, Tailwind CSS, and Vite.

## Features

- 🎨 **Modern Design**: Clean, responsive UI with smooth animations
- 🚀 **Fast Performance**: Built with Vite for optimal development and build performance
- 📱 **Responsive**: Works seamlessly on desktop, tablet, and mobile devices
- 🔄 **Real-time Status**: Live API health monitoring
- 🎯 **Type Safety**: Full TypeScript support with proper API type definitions
- ✨ **Smooth UX**: Loading states, animations, and intuitive navigation

## Requirements

- **Node.js 18+** (tested with Node.js 18.20.8)
- **npm 8+**

## Development

```bash
# Quick start (recommended)
./start-dev.sh

# Manual setup
npm install
npm run dev

# Build for production
npm run build

# Build and copy to backend static directory
./build.sh
```

### Troubleshooting

**Node.js Compatibility**: If you encounter `crypto.hash is not a function` error, you're likely using an incompatible Node.js version. The frontend uses Vite 4.x for compatibility with Node.js 18.

## Tech Stack

- **React 18** with TypeScript
- **Vite** for build tooling
- **Tailwind CSS** for styling
- **Heroicons** for icons

## Components

- **TestPrompt**: Interactive form for testing prompts with synthetic cases
- **EnhancePrompt**: AI-powered prompt enhancement with before/after comparison
- **TestResults**: Detailed results display with scoring and analysis
- **LoadingSpinner**: Reusable loading indicator

The frontend provides a polished, professional interface for interacting with the PromptEval-Lite API.