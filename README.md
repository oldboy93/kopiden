# Kopi Den React

Professional Coffee Shop application built with Next.js, Supabase, and Tailwind CSS.

## Features

- Modern, responsive UI design
- Product gallery and menu
- Shopping cart functionality
- Secure checkout integration
- Order tracking

## Tech Stack

- **Framework**: Next.js
- **Database**: Supabase
- **Styling**: Tailwind CSS
- **Icons**: Lucide React

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Deployment Instructions

### Deploy to Vercel (Recommended)

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme).

1.  **Push your code** to GitHub (already done).
2.  **Sign up for Vercel** and connect your GitHub account.
3.  **Import the project**: Pick the `kopiden` repository.
4.  **Add Environment Variables**:
    - Copy the keys from your `.env.local` to the Vercel project settings (Environment Variables).
    - Necessary variables usually include:
      - `NEXT_PUBLIC_SUPABASE_URL`
      - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
      - `MIDTRANS_SERVER_KEY`
5.  **Click Deploy**: Vercel will handle the build and give you a live URL.

### Build Locally

To test the production build locally:

```bash
npm run build
npm run start
```
