# Pinny

Pinny is a beautiful, open-source, **private frontend for Pinterest**. Built with **Next.js 16**, it is designed to showcase advanced front-end architecture, API proxying, and performance optimization.

It provides an infinitely scrolling, perfectly virtualized masonry grid, robust recommendation blending, and a completely private local-board saving system.

![An image that shows the Pinny web app](https://pinnyapp.vercel.app/landing@1x.jpeg)

## 🌟 Key Features

- **Next.js 16 App Router**: Leverages the latest React paradigms and Turbopack for lightning-fast builds.
- **Masonry UI Virtualization**: Implements a highly optimized, infinitely scrolling grid that dynamically measures and batches images to prevent DOM bloat.
- **Complex Recommendation Engine**: Seamlessly blends multiple history interests into a unified, privacy-friendly home feed.
- **Progressive Web App (PWA)**: Fully installable on iOS and Android devices with a native app feel and offline fallback capabilities.
- **100% Private Local Boards**: Uses `IndexedDB` to securely save and categorize your favorite pins locally on your device. Your boards are never uploaded to a cloud server.
- **Intelligent Cache Persistence**: Features zero-second scroll restoration when using the back button by intelligently manipulating `sessionStorage` and browser `beforeunload` events.

> **Note:** When using a public instance on [pinnyapp.vercel.app](https://pinnyapp.vercel.app) your address is proxied through our servers, however if you host the stack locally, your IP can be exposed to Pinterest servers.


## 🛠️ Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Styling**: Vanilla CSS for maximum performance and fluid dynamic layouts
- **Storage**: IndexedDB (for Boards) & Session Storage (for caching)
- **Backend APIs**: Next.js Serverless API Routes (CORS proxying)

## 🔒 Privacy & Networking Architecture

Here is a breakdown of exactly how the networking behaves in different deployment scenarios:

**When users access a public Vercel instance:**
- The user's browser sends a request to the Vercel deployment.
- Vercel's backend servers execute the application's API logic (such as fetching pins or proxying images) by making direct, server-to-server requests to Pinterest.
- Because Vercel's infrastructure acts as the middleman, Pinterest only ever sees the IP address of the Vercel server making the request. This completely hides the end user's personal IP address.

**When you host the stack locally (e.g., running `npm run dev` or `npm run start`):**
- Your browser sends a request to your local Next.js server running on localhost.
- Your local Node.js server executes the API logic and makes the requests to Pinterest.
- Because the "server" making the request is physically running on your own computer, the IP address exposed to Pinterest is your home network's public IP address.

## ⚖️ License & Disclaimers

### GNU General Public License v3.0
This project utilizes backend proxying concepts and data structures heavily inspired by [Binternet](https://github.com/Ahwxorg/Binternet), which is licensed under the **GNU General Public License v3.0**. In compliance with the GPLv3 copyleft terms, Pinny is also released under the GNU General Public License v3.0.

### Disclaimer
> **Disclaimer:** This is a non-commercial, educational portfolio project. It is not affiliated with, endorsed by, or connected to Pinterest. It was built strictly to demonstrate advanced full-stack engineering, API proxying, and UI virtualization.
> 
> Pinny does not host any content. All content shown on this application is sourced from Pinterest™. Pinterest is a registered trademark of Pinterest Inc. Pinny is not affiliated with Pinterest Inc. Any issues with content shown on any Pinny instances need to be reported to Pinterest, not the instance host's internet provider or domain provider.
