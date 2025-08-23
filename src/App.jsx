import React from "react";
import { Provider } from "react-redux";
import { store } from "./store";
import Routes from "./Routes";
import { OnboardingProvider } from "./components/onboarding/OnboardingProvider";
import OnboardingModal from "./components/onboarding/OnboardingModal";

function App() {
  return (
    <Provider store={store}>
      <OnboardingProvider>
        <Routes />
        <OnboardingModal />
      </OnboardingProvider>
    </Provider>
  );
}

export default App;
