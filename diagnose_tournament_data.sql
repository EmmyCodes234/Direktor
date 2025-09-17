-- Diagnostic script to check tournament data for Tournament ID 25
-- This will help identify why results and standings are not showing

-- Check tournament basic info
SELECT 
    id, 
    name, 
    type, 
    currentRound, 
    pairing_system,
    best_of_value,
    status,
    created_at
FROM tournaments 
WHERE id = 25;

-- Check tournament players
SELECT 
    tp.tournament_id,
    tp.player_id,
    p.name as player_name,
    tp.wins,
    tp.losses,
    tp.ties,
    tp.spread,
    tp.match_wins,
    tp.match_losses,
    tp.status
FROM tournament_players tp
JOIN players p ON tp.player_id = p.id
WHERE tp.tournament_id = 25
ORDER BY tp.player_id;

-- Check results table
SELECT 
    id,
    tournament_id,
    round,
    player1_id,
    player2_id,
    score1,
    score2,
    created_at,
    updated_at
FROM results 
WHERE tournament_id = 25
ORDER BY round, created_at;

-- Check matches table
SELECT 
    id,
    tournament_id,
    round,
    player1_id,
    player2_id,
    status,
    created_at
FROM matches 
WHERE tournament_id = 25
ORDER BY round, id;

-- Check if there are any results with different tournament_id format
SELECT 
    'Results with different tournament_id' as check_type,
    COUNT(*) as count
FROM results 
WHERE tournament_id::text LIKE '%25%' OR tournament_id = 25;

-- Check if there are any matches with different tournament_id format  
SELECT 
    'Matches with different tournament_id' as check_type,
    COUNT(*) as count
FROM matches 
WHERE tournament_id::text LIKE '%25%' OR tournament_id = 25;

-- Check for any data type issues
SELECT 
    'Data type check' as check_type,
    pg_typeof(tournament_id) as tournament_id_type,
    COUNT(*) as count
FROM results 
WHERE tournament_id = 25
GROUP BY pg_typeof(tournament_id);

-- Check if results exist but with different player_id format
SELECT 
    r.id,
    r.tournament_id,
    r.player1_id,
    r.player2_id,
    r.score1,
    r.score2,
    p1.name as player1_name,
    p2.name as player2_name
FROM results r
LEFT JOIN players p1 ON r.player1_id = p1.id
LEFT JOIN players p2 ON r.player2_id = p2.id
WHERE r.tournament_id = 25
ORDER BY r.created_at;
