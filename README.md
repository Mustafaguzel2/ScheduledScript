# XOPS

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Version](https://img.shields.io/badge/version-1.0.0-green.svg)

## Contents

- [About](#about)
- [Features](#features)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
- [Usage](#usage)
- [Project Structure](#project-structure)
- [API Endpoints](#api-endpoints)
- [Development](#development)
- [Contributing](#contributing)
- [License](#license)
- [Contact](#contact)
- [Acknowledgments](#acknowledgments)

## About

XOPS is a modern web application built with [Next.js](https://nextjs.org) and [Tailwind CSS](https://tailwindcss.com). It provides an intuitive admin panel for operations management with dashboard visualizations, configuration tools, and user management capabilities.

## Features

- **Modern Dashboard**: Real-time monitoring and visualization
- **User Management**: Integration with Active Directory for user administration
- **Configuration Panel**: System settings and configuration interface
- **Responsive Design**: Works on desktop and mobile devices
- **Dark/Light Mode**: Support for theme preferences

## Getting Started

Follow these instructions to set up the project locally.

### Prerequisites

- Node.js (v18 or newer)
- npm, yarn, pnpm, or bun

### Installation

1. Clone the repository

   ```bash
   git clone https://github.com/yourusername/xops.git
   cd xops
   ```

2. Install dependencies

   ```bash
   npm install
   # or
   yarn install
   ```

3. Create a `.env.local` file based on `.env.example` (if provided)

## Usage

To run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## Project Structure

```text
xops/
├── public/        # Static assets
├── src/
│   ├── app/       # Next.js 13+ App Router
│   │   ├── (login)/     # Authentication pages
│   │   ├── api/         # API routes
│   │   ├── panel/       # Admin panel pages
│   │       ├── dashboard/
│   │       ├── configurator/
│   │       ├── settings/
│   ├── components/      # React components
│   ├── hooks/           # Custom React hooks
│   ├── lib/             # Utility functions and libraries
│   └── types/           # TypeScript type definitions
```

## API Endpoints

- **Login API** - `POST /api/auth/login`  
  Request Body:

  ```json
  {
    "username": "user",
    "password": "pass"
  }
  ```

  Response: Session cookie and authentication status.

- **Get Users API** - `GET /api/users/get-users`  
  Requires a valid session cookie. Returns a list of users in Active Directory.

- **Edit User API** - `PATCH /api/users/edit-user`  
  Request Body:

  ```json
  {
    "userPrincipalName": "user@example.com",
    "cn": "User Name",
    "sAMAccountName": "username",
    "groups": ["Group1", "Group2"]
  }
  ```

  Response: Success or failure message.

- **Delete User API** - `DELETE /api/users/delete-user`  
  Request Body:

  ```json
  {
    "userId": "username"
  }
  ```

  Response: Confirmation message of user deletion.

## Development

- **Tailwind CSS**: Customize styling in `tailwind.config.ts` and `src/app/globals.css`
- **TypeScript & ESLint**: Enforced for type safety and code quality
- **App Router**: Uses Next.js 13+ App Router for improved routing and layouts
- **Hot Reloading**: Changes reflect immediately during development

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

Please adhere to the project's code style and commit message conventions.

## License

Distributed under the MIT License. See `LICENSE` file for more information.

## Contact

For questions or suggestions, please contact [your.email@example.com](mailto:your.email@example.com).

## Acknowledgments

- Thanks to the teams behind [Next.js](https://nextjs.org) and [Tailwind CSS](https://tailwindcss.com) for their excellent tools and documentation
- Inspired by the need for modern, efficient operations management interfaces
