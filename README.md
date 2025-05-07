# iMobilize

A comprehensive mobile/web application aimed at facilitating social/civic activism by providing educational resources, location-specific legal guides, and tools for coordination and communication.

## Project Goals

- Eliminate barriers to social/civic activism
- Provide quality education on activism methods
- Offer location-specific legal guides and resources
- Create tools for group organization and event coordination
- Support SDG goals 16 ("Peace, Justice, and Strong Institutions") and 10 ("Reduced Inequalities")

## Features

- Event organization tools
- Educational resources on activism methods
- Location-specific legal guides
- Forum-like communication system
- Documentation support
- Safety and security protocols

## Tech Stack

- **Frontend**: React Native (mobile)
- **Backend**: Node.js with Express.js
- **Database**: MongoDB and PostgreSQL
- **End-to-End Encryption**: Signal Protocol

### Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)
- Expo CLI (for mobile development)

### Example project structure for now:
imobilize-mobile/
├── App.js                         # Entry point
├── app.json                       # Expo configuration
├── babel.config.js                # Babel configuration
├── package.json                   # Dependencies
├── assets/                        # Static assets
│   ├── images/                    # App images
│   │   └── logo.png               # App logo
│   └── fonts/                     # Custom fonts
├── src/
│   ├── components/                # Reusable components
│   │   ├── common/                # Shared UI components
│   │   │   ├── Button.js          # Custom button component
│   │   │   ├── Card.js            # Card container component
│   │   │   └── Header.js          # App header component
│   │   ├── auth/                  # Authentication components
│   │   │   ├── LoginForm.js       # Login form
│   │   │   └── RegisterForm.js    # Registration form
│   │   └── dashboard/             # Dashboard components
│   │       ├── DashboardStats.js  # Stats display
│   │       ├── EventCard.js       # Event card component
│   │       └── ActivistFeed.js    # Feed component
│   ├── screens/                   # App screens
│   │   ├── onboarding/            # Onboarding screens
│   │   │   ├── SplashScreen.js    # Initial splash screen
│   │   │   ├── TermsScreen.js     # Terms of service screen
│   │   │   └── WelcomeScreen.js   # Welcome introduction
│   │   ├── auth/                  # Auth screens
│   │   │   ├── LoginScreen.js     # Login screen
│   │   │   └── RegisterScreen.js  # Registration screen
│   │   └── main/                  # Main app screens
│   │       ├── HomeScreen.js      # Dashboard/home screen
│   │       ├── ResourcesScreen.js # Educational resources
│   │       ├── CommunityScreen.js # Community features
│   │       ├── OrganizerScreen.js # Event organization
│   │       └── ProfileScreen.js   # User profile
│   ├── navigation/                # Navigation
│   │   ├── AppNavigator.js        # Main navigator (handles auth state)
│   │   ├── AuthNavigator.js       # Authentication flow
│   │   ├── MainNavigator.js       # Main app tabs
│   │   └── OnboardingNavigator.js # Onboarding flow (ToS)
│   ├── context/                   # React Context
│   │   ├── AuthContext.js         # Auth state management
│   │   └── OnboardingContext.js   # Tracks ToS acceptance
│   ├── services/                  # API and services
│   │   ├── api.js                 # API configuration
│   │   └── storage.js             # Local storage utilities
│   ├── utils/                     # Utility functions
│   │   ├── constants.js           # App constants
│   │   └── validation.js          # Form validation
│   └── data/                      # Local data
│       ├── mockEvents.js          # Mock event data for development
│       └── termsOfService.js      # ToS content
└── .gitignore                     # Git ignore file
