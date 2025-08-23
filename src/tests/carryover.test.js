/**
 * Unit tests for the Carry-Over System
 * Tests all policies, edge cases, and calculations
 */

// Mock data for testing
const mockPlayer = {
    player_id: '123',
    name: 'Test Player',
    wins: 8,
    losses: 2,
    ties: 0,
    spread: 150,
    group_id: 'group1'
};

const mockConfig = {
    policy: 'none',
    percentage: 50,
    spread_cap: 100,
    show_carryover_in_standings: true
};

// Test utility functions
const calculateCarryover = (policy, percentage, spreadCap, player) => {
    const wins = player.wins || 0;
    const losses = player.losses || 0;
    const ties = player.ties || 0;
    const spread = player.spread || 0;
    const gamesPlayed = wins + losses + ties;

    switch (policy) {
        case 'none':
            return { carryoverWins: 0, carryoverSpread: 0 };
        
        case 'full':
            return { carryoverWins: wins, carryoverSpread: spread };
        
        case 'partial':
            if (percentage === null || percentage === undefined) {
                throw new Error('Percentage required for partial carry-over policy');
            }
            return {
                carryoverWins: Math.round((wins * percentage / 100) * 100) / 100,
                carryoverSpread: Math.round((spread * percentage / 100) * 100) / 100
            };
        
        case 'capped':
            if (spreadCap === null || spreadCap === undefined) {
                throw new Error('Spread cap required for capped carry-over policy');
            }
            return {
                carryoverWins: wins,
                carryoverSpread: Math.min(spread, spreadCap * gamesPlayed)
            };
        
        case 'seedingOnly':
            return { carryoverWins: wins, carryoverSpread: spread };
        
        default:
            throw new Error(`Unknown carry-over policy: ${policy}`);
    }
};

describe('Carry-Over System', () => {
    describe('Policy Calculations', () => {
        test('none policy - should return zero carry-over', () => {
            const result = calculateCarryover('none', null, null, mockPlayer);
            expect(result.carryoverWins).toBe(0);
            expect(result.carryoverSpread).toBe(0);
        });

        test('full policy - should carry all wins and spread', () => {
            const result = calculateCarryover('full', null, null, mockPlayer);
            expect(result.carryoverWins).toBe(8);
            expect(result.carryoverSpread).toBe(150);
        });

        test('partial policy - should carry percentage of wins and spread', () => {
            const result = calculateCarryover('partial', 50, null, mockPlayer);
            expect(result.carryoverWins).toBe(4.00);
            expect(result.carryoverSpread).toBe(75.00);
        });

        test('partial policy - should round to 2 decimal places', () => {
            const playerWithDecimals = { ...mockPlayer, wins: 7, spread: 133 };
            const result = calculateCarryover('partial', 33.33, null, playerWithDecimals);
            expect(result.carryoverWins).toBe(2.33);
            expect(result.carryoverSpread).toBe(44.33);
        });

        test('capped policy - should carry all wins but cap spread', () => {
            const result = calculateCarryover('capped', null, 100, mockPlayer);
            expect(result.carryoverWins).toBe(8);
            expect(result.carryoverSpread).toBe(100); // 100 cap * 10 games = 1000, but spread is 150
        });

        test('capped policy - should not cap if spread is below limit', () => {
            const playerWithLowSpread = { ...mockPlayer, spread: 50 };
            const result = calculateCarryover('capped', null, 100, playerWithLowSpread);
            expect(result.carryoverWins).toBe(8);
            expect(result.carryoverSpread).toBe(50); // Below cap, so no capping
        });

        test('seedingOnly policy - should carry all wins and spread', () => {
            const result = calculateCarryover('seedingOnly', null, null, mockPlayer);
            expect(result.carryoverWins).toBe(8);
            expect(result.carryoverSpread).toBe(150);
        });
    });

    describe('Edge Cases', () => {
        test('player with zero stats', () => {
            const zeroPlayer = { ...mockPlayer, wins: 0, losses: 0, ties: 0, spread: 0 };
            const result = calculateCarryover('full', null, null, zeroPlayer);
            expect(result.carryoverWins).toBe(0);
            expect(result.carryoverSpread).toBe(0);
        });

        test('player with negative spread', () => {
            const negativePlayer = { ...mockPlayer, spread: -50 };
            const result = calculateCarryover('full', null, null, negativePlayer);
            expect(result.carryoverWins).toBe(8);
            expect(result.carryoverSpread).toBe(-50);
        });

        test('partial policy with negative spread', () => {
            const negativePlayer = { ...mockPlayer, spread: -100 };
            const result = calculateCarryover('partial', 50, null, negativePlayer);
            expect(result.carryoverWins).toBe(4.00);
            expect(result.carryoverSpread).toBe(-50.00);
        });

        test('capped policy with negative spread', () => {
            const negativePlayer = { ...mockPlayer, spread: -200 };
            const result = calculateCarryover('capped', null, 100, negativePlayer);
            expect(result.carryoverWins).toBe(8);
            expect(result.carryoverSpread).toBe(-200); // Negative spreads are not capped
        });

        test('player with only ties', () => {
            const tiePlayer = { ...mockPlayer, wins: 0, losses: 0, ties: 10, spread: 0 };
            const result = calculateCarryover('full', null, null, tiePlayer);
            expect(result.carryoverWins).toBe(0);
            expect(result.carryoverSpread).toBe(0);
        });

        test('partial policy with 0%', () => {
            const result = calculateCarryover('partial', 0, null, mockPlayer);
            expect(result.carryoverWins).toBe(0.00);
            expect(result.carryoverSpread).toBe(0.00);
        });

        test('partial policy with 100%', () => {
            const result = calculateCarryover('partial', 100, null, mockPlayer);
            expect(result.carryoverWins).toBe(8.00);
            expect(result.carryoverSpread).toBe(150.00);
        });
    });

    describe('Error Handling', () => {
        test('partial policy without percentage should throw error', () => {
            expect(() => {
                calculateCarryover('partial', null, null, mockPlayer);
            }).toThrow('Percentage required for partial carry-over policy');
        });

        test('capped policy without spread cap should throw error', () => {
            expect(() => {
                calculateCarryover('capped', null, null, mockPlayer);
            }).toThrow('Spread cap required for capped carry-over policy');
        });

        test('unknown policy should throw error', () => {
            expect(() => {
                calculateCarryover('unknown', null, null, mockPlayer);
            }).toThrow('Unknown carry-over policy: unknown');
        });
    });

    describe('Complex Scenarios', () => {
        test('player with decimal wins (from previous carry-over)', () => {
            const decimalPlayer = { ...mockPlayer, wins: 4.5, spread: 75.25 };
            const result = calculateCarryover('partial', 60, null, decimalPlayer);
            expect(result.carryoverWins).toBe(2.70);
            expect(result.carryoverSpread).toBe(45.15);
        });

        test('capped policy with very high spread', () => {
            const highSpreadPlayer = { ...mockPlayer, spread: 500 };
            const result = calculateCarryover('capped', null, 50, highSpreadPlayer);
            expect(result.carryoverWins).toBe(8);
            expect(result.carryoverSpread).toBe(500); // 50 cap * 10 games = 500, so no capping
        });

        test('capped policy with very low spread cap', () => {
            const result = calculateCarryover('capped', null, 10, mockPlayer);
            expect(result.carryoverWins).toBe(8);
            expect(result.carryoverSpread).toBe(100); // 10 cap * 10 games = 100, so spread is capped
        });

        test('multiple carry-over applications', () => {
            // First carry-over: 8 wins, 150 spread with 50% partial
            const firstResult = calculateCarryover('partial', 50, null, mockPlayer);
            expect(firstResult.carryoverWins).toBe(4.00);
            expect(firstResult.carryoverSpread).toBe(75.00);

            // Second carry-over: 4 wins, 75 spread with 25% partial
            const secondPlayer = { ...mockPlayer, wins: 4, spread: 75 };
            const secondResult = calculateCarryover('partial', 25, null, secondPlayer);
            expect(secondResult.carryoverWins).toBe(1.00);
            expect(secondResult.carryoverSpread).toBe(18.75);
        });
    });

    describe('Policy Combinations', () => {
        test('seedingOnly with partial calculation', () => {
            // Even though seedingOnly carries full values, the calculation should work
            const result = calculateCarryover('seedingOnly', null, null, mockPlayer);
            expect(result.carryoverWins).toBe(8);
            expect(result.carryoverSpread).toBe(150);
        });

        test('capped policy with zero games played', () => {
            const zeroGamesPlayer = { ...mockPlayer, wins: 0, losses: 0, ties: 0 };
            const result = calculateCarryover('capped', null, 100, zeroGamesPlayer);
            expect(result.carryoverWins).toBe(0);
            expect(result.carryoverSpread).toBe(0); // 100 cap * 0 games = 0
        });
    });

    describe('Data Validation', () => {
        test('should handle null/undefined player stats', () => {
            const incompletePlayer = { player_id: '123', name: 'Test' };
            const result = calculateCarryover('full', null, null, incompletePlayer);
            expect(result.carryoverWins).toBe(0);
            expect(result.carryoverSpread).toBe(0);
        });

        test('should handle string numbers', () => {
            const stringPlayer = { 
                ...mockPlayer, 
                wins: '8', 
                losses: '2', 
                spread: '150' 
            };
            const result = calculateCarryover('full', null, null, stringPlayer);
            expect(result.carryoverWins).toBe(8);
            expect(result.carryoverSpread).toBe(150);
        });
    });
});

// Integration test helpers
describe('Carry-Over Integration Tests', () => {
    test('total calculation with seedingOnly policy', () => {
        const carryoverWins = 8;
        const carryoverSpread = 150;
        const currentWins = 3;
        const currentSpread = 50;
        const policy = 'seedingOnly';

        // For seedingOnly, totals should be just current values
        const totalWins = policy === 'seedingOnly' ? currentWins : currentWins + carryoverWins;
        const totalSpread = policy === 'seedingOnly' ? currentSpread : currentSpread + carryoverSpread;

        expect(totalWins).toBe(3);
        expect(totalSpread).toBe(50);
    });

    test('total calculation with full policy', () => {
        const carryoverWins = 8;
        const carryoverSpread = 150;
        const currentWins = 3;
        const currentSpread = 50;
        const policy = 'full';

        // For full policy, totals should include carry-over
        const totalWins = policy === 'seedingOnly' ? currentWins : currentWins + carryoverWins;
        const totalSpread = policy === 'seedingOnly' ? currentSpread : currentSpread + carryoverSpread;

        expect(totalWins).toBe(11);
        expect(totalSpread).toBe(200);
    });
});

export { calculateCarryover };
