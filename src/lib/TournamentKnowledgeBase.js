import { parse } from 'date-fns';

export const TournamentKnowledgeBase = {
    getInitialGreeting: () => "Welcome! I'm here to help you plan your tournament. To start, what would you like to name your event?",

    getResponse: (state, userInput, currentPlan) => {
        let aiResponse = '';
        let newPlan = { ...currentPlan };
        let nextState = state;
        const userInputLower = userInput.toLowerCase();

        switch (state) {
            case 'awaiting_name':
                newPlan.name = userInput.trim();
                aiResponse = `Sounds great! Where will "${newPlan.name}" be held?`;
                nextState = 'awaiting_venue';
                break;
            
            case 'awaiting_venue':
                newPlan.venue = userInput.trim();
                aiResponse = `Okay, the venue is set. What type of tournament are you planning? (e.g., Individual, Team, or "Best of" League)`;
                nextState = 'awaiting_type';
                break;
            
            case 'awaiting_type':
                const type = userInputLower;
                if (type.includes('individual')) {
                    newPlan.type = 'individual';
                } else if (type.includes('team')) {
                    newPlan.type = 'team';
                } else if (type.includes('best of')) {
                    newPlan.type = 'best_of_league';
                } else {
                    aiResponse = 'Please choose a valid type: Individual, Team, or "Best of" League.';
                    nextState = 'awaiting_type';
                    break;
                }
                
                if (newPlan.type === 'best_of_league') {
                    aiResponse = "A 'Best of' league is a great format! What is the start date for the league?";
                    nextState = 'awaiting_start_date';
                } else {
                    aiResponse = "Got it. What is the date of the tournament?";
                    nextState = 'awaiting_date';
                }
                break;

            case 'awaiting_date':
                try {
                    const parsedDate = parse(userInput.trim(), 'do MMMM, yyyy', new Date());
                    if (isNaN(parsedDate)) throw new Error("Invalid date");
                    newPlan.date = parsedDate.toISOString().split('T')[0];
                    aiResponse = `How many players are you expecting?`;
                    nextState = 'awaiting_players';
                } catch (e) {
                    aiResponse = "I couldn't understand that date. Please use a format like '2nd August, 2025'.";
                }
                break;
            
            case 'awaiting_start_date':
                try {
                    const parsedDate = parse(userInput.trim(), 'do MMMM, yyyy', new Date());
                    if (isNaN(parsedDate)) throw new Error("Invalid date");
                    newPlan.start_date = parsedDate.toISOString().split('T')[0];
                    aiResponse = "And what is the end date for the league?";
                    nextState = 'awaiting_end_date';
                } catch(e) {
                    aiResponse = "I couldn't understand that date. Please use a format like '2nd August, 2025'.";
                }
                break;

            case 'awaiting_end_date':
                try {
                    const parsedDate = parse(userInput.trim(), 'do MMMM, yyyy', new Date());
                    if (isNaN(parsedDate)) throw new Error("Invalid date");
                    newPlan.end_date = parsedDate.toISOString().split('T')[0];
                    aiResponse = `How many players will be participating?`;
                    nextState = 'awaiting_players';
                } catch(e) {
                    aiResponse = "I couldn't understand that date. Please use a format like '2nd August, 2025'.";
                }
                break;

            case 'awaiting_players':
                const playerCount = parseInt(userInput, 10);
                if (isNaN(playerCount) || playerCount < 4) {
                    aiResponse = "Tournaments work best with at least 4 players. Please enter a valid number.";
                } else {
                    newPlan.playerCount = playerCount;
                    const recommendedRounds = newPlan.playerCount < 8 ? newPlan.playerCount - 1 : Math.ceil(Math.log2(newPlan.playerCount)) + 3;
                    newPlan.rounds = recommendedRounds;
                    aiResponse = `Perfect. For ${playerCount} players, I recommend a ${recommendedRounds}-round tournament. This ensures a fair result with a manageable schedule. Does that sound good? (Yes/No)`;
                    nextState = 'awaiting_confirmation';
                }
                break;
            
            case 'awaiting_confirmation':
                if (userInputLower.startsWith('y')) {
                    aiResponse = "Excellent! I've finalized a plan for you. You can review it below and proceed to the setup wizard.";
                    nextState = 'plan_complete';
                } else {
                    aiResponse = "No problem. How many rounds would you like to have instead?";
                    nextState = 'awaiting_rounds_custom';
                }
                break;
            
            case 'awaiting_rounds_custom':
                const customRounds = parseInt(userInput, 10);
                if (isNaN(customRounds) || customRounds < 1) {
                    aiResponse = "Please enter a valid number of rounds.";
                } else {
                    newPlan.rounds = customRounds;
                    aiResponse = "Got it. I've updated the plan with your custom round count. You can review it below.";
                    nextState = 'plan_complete';
                }
                break;

            default:
                aiResponse = "You can review your plan below or start over.";
        }

        return { aiResponse, newPlan, nextState };
    }
};