# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Web developers, engineers, and learners practicing JavaScript/TypeScript, prototyping React components, studying language internals, and preparing for technical interviews and DSA challenges.

## Product Purpose

RunJS is a fast, client-side web development utility, interactive playground, and comprehensive learning platform. It allows users to write, run, and experiment with JavaScript, TypeScript, React, and HTML/CSS completely in the browser without server dependencies, friction, or latency.

## Positioning

An all-in-one integrated learning suite that unifies real-time code scratchpads, structured interactive curricula (175+ lessons), DSA problem runners with automated test suites, and interview preparation in a single local-first browser environment.

## Operating Context

- Used in web browsers across desktop and mobile devices.
- Developers testing code snippets, debugging algorithms, experimenting with APIs, or revising for interviews.
- Fast, instant feedback loops with zero setup or remote server delays.

## Capabilities and Constraints

- **Playgrounds**: JavaScript Scratchpad (`/js`), TypeScript Studio (`/ts`), React + Vite Sandbox (`/react`), and HTML/CSS/JS Studio (`/html`).
- **Learning & Practice**: Algorithmic coding challenges & DSA problem runner (`/problems`), interactive curriculum (`/learn`), and JavaScript interview Q&A (`/interview`).
- **Privacy & Storage**: 100% client-side execution via in-browser WebAssembly transpilation (`esbuild-wasm`), Monaco Editor, and Sandpack. Local persistence using IndexedDB and LocalStorage.
- **Constraints**: Desktop and mobile responsive parity, high-density editor layout, low-friction instant execution without mandatory logins or telemetry.

## Brand Commitments

- **Name**: RunJS (runjs.in)
- **Tone**: Focused, fast, developer-first, clear, and pragmatic.
- **Core Guarantees**: Instant run, user code sovereignty, and clean, clutter-free utility.

## Evidence on Hand

- Production web application deployed at [runjs.in](https://runjs.in).
- Fully functional multi-route suite (`/js`, `/ts`, `/react`, `/html`, `/problems`, `/learn`, `/interview`, `/bin`).
- Offline persistence layer implemented with browser IndexedDB (`idb`) and LocalStorage.

## Product Principles

1. **Instant Feedback**: Execution and diagnostics should feel instantaneous, minimizing compile and evaluation latency.
2. **All-in-One Learning & Prototyping**: Seamless transitions between learning concepts, practicing problems, and scratchpad experimentation.
3. **High-Density Utility**: Prioritize editor real estate, responsive layout parity, and low-friction access to runtime output.
4. **Data Sovereignty & Local-First**: Keep user code and progress stored safely on their own machine.
