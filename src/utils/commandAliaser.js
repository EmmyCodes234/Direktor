/**
 * Command Aliaser Utility
 * Resolves legacy TSH-style command aliases to new Direktor command names.
 */

const COMMAND_MAP = {
    // Leaderboard
    'lb': 'leaderboard',
    'st': 'leaderboard',
    'standings': 'leaderboard',

    // Cross-Table
    'ct': 'crosstable',
    'wc': 'crosstable',
    'wallchart': 'crosstable',

    // Field
    'f': 'field',
    'ros': 'field',
    'roster': 'field',
    'rosters': 'field',

    // Matchups
    'm': 'matchups',
    'p': 'matchups',
    'pairings': 'matchups',

    // Peak Score
    'ps': 'peakscore',
    'hw': 'peakscore', // High Wins

    // Shootout
    'so': 'shootout',
    'hc': 'shootout', // High Combined

    // Tough Break (High Losses)
    'tb': 'toughbreak',
    'hl': 'toughbreak',

    // Clutch Win (Lucky Stiffs)
    'cw': 'clutchwin',
    'ls': 'clutchwin',

    // Close Defeats (Tuff Luck)
    'cd': 'closedefeats',
    'tl': 'closedefeats',

    // Giant Killers (Rating Upsets)
    'gk': 'giantkillers',
    'ru': 'giantkillers',

    // Match Log (Scorecard)
    'ml': 'matchlog',
    'sc': 'matchlog',
    'scorecard': 'matchlog'
};

/**
 * Resolves a raw input string into a primary command and its arguments.
 * @param {string} input - The raw command string entered by the user.
 * @returns {object} { command: string, args: string[] }
 */
export const resolveCommand = (input) => {
    if (!input || typeof input !== 'string') {
        return { command: '', args: [] };
    }

    const trimmed = input.trim();
    if (!trimmed) {
        return { command: '', args: [] };
    }

    const parts = trimmed.split(/\s+/);
    const rawCommand = parts[0].toLowerCase();
    const args = parts.slice(1);

    // Resolve alias or return original if no alias found
    // If it's already a primary command (e.g. 'leaderboard'), it won't be in map keys usually 
    // unless we map identity. But if not in map, we assume it is the command itself.
    // However, to be safe, we can check if it IS a known alias. 

    const resolved = COMMAND_MAP[rawCommand] || rawCommand;

    return {
        command: resolved,
        args
    };
};

export default resolveCommand;
