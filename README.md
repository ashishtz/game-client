# Game Client

## [Link](https://game-client-37j0.onrender.com)


## Overview

**Game Client** is an Angular-based web application built to provide a rich 3D gaming experience, utilizing the Babylon.js framework for rendering 3D graphics and Colyseus.js for real-time multiplayer functionality. The application leverages Angular's robust structure to manage the user interface and Babylon.js for game mechanics and visuals, offering a seamless and interactive user experience.

### Key Features

- Real-time multiplayer gaming via **Colyseus.js**
- 3D graphics powered by **Babylon.js**
- Responsive UI built with **Angular Material**
- Optimized animations using **Angular Animations**

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Installation](#installation)
- [Running the Application](#running-the-application)
- [File Structure](#file-structure)
- [Important Links](#important-links)
- [Contributing](#contributing)
- [License](#license)

## Tech Stack

This project is built with the following technologies:

- **[Angular](https://angular.io/)**: Framework for building single-page applications.
- **[Babylon.js](https://www.babylonjs.com/)**: A powerful 3D engine for rendering high-performance 3D applications in web browsers.
- **[Colyseus.js](https://docs.colyseus.io/)**: Multiplayer game client for real-time communication with a Colyseus game server.
- **[Angular Material](https://material.angular.io/)**: A UI component library that follows Google’s Material Design principles.
- **[RxJS](https://rxjs.dev/)**: Reactive programming library for managing asynchronous operations.

## Installation

To set up the project locally, follow these steps:

### Prerequisites

Make sure that you have [Node.js](https://nodejs.org/) and [npm](https://www.npmjs.com/get-npm) installed. You can verify their installation by running:

```bash
node -v
npm -v
```

### Setup Steps

1. **Clone the repository**:

   ```bash
   git clone https://github.com/ashishtz/game-client.git
   cd game-client
   ```

2. **Install dependencies**:

   Use the following command to install all required npm packages:

   ```bash
   npm install
   ```

3. **Configure the environment**:

   Ensure that the configurations in `angular.json` and `tsconfig.json` match your development setup. Adjust as necessary.

## Running the Application

Once the project is set up, follow these steps to run the application:

1. **Run the development server**:

   ```bash
   ng serve
   ```

   The app will be available at `http://localhost:4200/` and will automatically reload when you make changes to the source files.

2. **Build for production**:

   To create a production-ready build, run:

   ```bash
   ng build
   ```

   The output will be placed in the `dist/` folder. These files can be deployed to any web server.

## File Structure

Here is an overview of the project's file structure:

```
.
├── angular.json                 # Angular CLI configuration
├── package.json                 # Node.js dependencies and scripts
├── src/                         # Source code of the Angular application
│   ├── app/                     # Main application logic
│   ├── assets/                  # Static assets (images, icons, etc.)
│   └── environments/            # Environment-specific settings
├── tsconfig.json                # TypeScript configuration
├── tsconfig.app.json            # TypeScript config for app
├── tsconfig.spec.json           # TypeScript config for testing
└── README.md                    # Project documentation
```

## Important Links

Here are some key resources for the technologies used in this project:

- [Angular Documentation](https://angular.io/docs)
- [Babylon.js Documentation](https://doc.babylonjs.com/)
- [Colyseus.js Documentation](https://docs.colyseus.io/)
- [RxJS Documentation](https://rxjs.dev/guide/overview)