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
├── assets/
│   ├── images/
│   │   └── logo.png               # App logo
│   └── fonts/                     # Custom fonts
├── src/
│   ├── components/
│   │   ├── common/                # Common UI components
│   │   │   ├── Button.js
│   │   │   ├── Card.js
│   │   │   └── Header.js
│   │   ├── auth/                  # Authentication components
│   │   │   ├── LoginForm.js
│   │   │   └── RegisterForm.js
│   │   └── dashboard/             # Dashboard components
│   │       ├── DashboardStats.js
│   │       ├── EventCard.js
│   │       └── ActivistFeed.js
│   ├── screens/
│   │   ├── onboarding/
│   │   │   ├── SplashScreen.js    # Initial splash screen
│   │   │   ├── TermsScreen.js     # Terms of service screen
│   │   │   └── WelcomeScreen.js   # Welcome introduction
│   │   ├── auth/
│   │   │   ├── LoginScreen.js     # Login screen
│   │   │   └── RegisterScreen.js  # Registration screen
│   │   └── main/
│   │       ├── HomeScreen.js      # Dashboard/home screen
│   │       ├── ResourcesScreen.js # Educational resources
│   │       ├── CommunityScreen.js # Community features
│   │       ├── OrganizerScreen.js # Event organization
│   │       └── ProfileScreen.js   # User profile
│   ├── navigation/
│   │   ├── AppNavigator.js        # Main navigator (handles auth state)
│   │   ├── AuthNavigator.js       # Authentication flow
│   │   ├── MainNavigator.js       # Main app tabs
│   │   └── OnboardingNavigator.js # Onboarding flow (ToS)
│   ├── context/
│   │   ├── AuthContext.js         #
