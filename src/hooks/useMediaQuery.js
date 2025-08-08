import { useState, useEffect } from 'react';

/**
 * A custom React hook for tracking the state of a CSS media query.
 * @param {string} query The media query string to watch.
 * @returns {boolean} A boolean indicating whether the media query matches.
 */
const useMediaQuery = (query) => {
    // Initialize state with the current match status
    const [matches, setMatches] = useState(() => window.matchMedia(query).matches);

    useEffect(() => {
        const mediaQueryList = window.matchMedia(query);
        
        // Define a listener to update state on change
        const listener = (event) => setMatches(event.matches);
        
        // Add the listener
        mediaQueryList.addEventListener('change', listener);
        
        // Cleanup function to remove the listener on component unmount
        return () => mediaQueryList.removeEventListener('change', listener);
    }, [query]); // Re-run effect only if the query string changes

    return matches;
};

export default useMediaQuery;