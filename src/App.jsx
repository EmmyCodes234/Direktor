import React from "react";
import { Provider } from "react-redux";
import { store } from "./store";
import Routes from "./Routes";
import { OnboardingProvider } from "./components/onboarding/OnboardingProvider";
import OnboardingModal from "./components/onboarding/OnboardingModal";
import { ThemeProvider } from "./contexts/ThemeContext";

function App() {
  return (
    <Provider store={store}>
      <ThemeProvider>
        <OnboardingProvider>
          <Routes />
          <OnboardingModal />
        </OnboardingProvider>
      </ThemeProvider>
    </Provider>
  );
}

export default App;
