# Chatbot PTP - AI-Powered Chat Interface

A modern chatbot application built with [Next.js](https://nextjs.org/), leveraging OpenAI's API for intelligent conversations. This project was bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Features
- Real-time chat interface
- Integration with OpenAI's API
- Responsive design
- Modern React components

## Prerequisites
- Node.js 16.x or higher
- NPM or alternative package manager
- OpenAI API key

## Getting Started

1. Clone the repository:
```bash
git clone https://github.com/ghif/chatbot-ptp.git
cd chatbot-ptp
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
# or yarn dev
# or pnpm dev
# or bun dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the application in action.

## OpenAI API Configuration
1. Copy and rename the environment file:
```bash
cp .env.local .env
```
2. Open `.env` and add your OpenAI API key:
```
OPENAI_API_KEY="<YOUR_API_KEY_HERE>"
```

## Development
- The main application code is in `app/page.js`
- Changes are reflected immediately during development
- Uses [`next/font`](https://nextjs.org/docs/basic-features/font-optimization) for optimized typography

## Documentation
For more information about the technologies used:
- [Next.js Documentation](https://nextjs.org/docs) - Framework features and API
- [Learn Next.js](https://nextjs.org/learn) - Interactive tutorial
- [Next.js GitHub Repository](https://github.com/vercel/next.js/)

## Deployment
Deploy easily using [Vercel](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme), the platform from Next.js creators.

For detailed deployment instructions, consult the [Next.js deployment documentation](https://nextjs.org/docs/deployment).

## Contributing
Contributions are welcome! Please feel free to submit a Pull Request.

