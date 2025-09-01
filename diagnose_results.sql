-- Diagnostic script to check for duplicate results and player stats issues

-- Check all results for the current tournament
SELECT 
  r.id,
  r.tournament_id,
  r.round,
  r.player1_id,
  r.player2_id,
  r.score1,
  r.score2,
  p1.name as player1_name,
  p2.name as player2_name,
  r.created_at
FROM results r
JOIN players p1 ON r.player1_id = p1.id
JOIN players p2 ON r.player2_id = p2.id
WHERE r.tournament_id = (SELECT id FROM tournaments ORDER BY created_at DESC LIMIT 1)
ORDER BY r.round, r.created_at;

-- Check for duplicate results
SELECT 
  tournament_id,
  round,
  player1_id,
  player2_id,
  score1,
  score2,
  COUNT(*) as duplicate_count
FROM results
WHERE tournament_id = (SELECT id FROM tournaments ORDER BY created_at DESC LIMIT 1)
GROUP BY tournament_id, round, player1_id, player2_id, score1, score2
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC;

-- Check current player stats
SELECT 
  p.name,
  tp.player_id,
  tp.wins,
  tp.losses,
  tp.ties,
  tp.spread,
  (tp.wins + (tp.ties * 0.5)) as adjusted_wins,
  (tp.losses + (tp.ties * 0.5)) as adjusted_losses
FROM tournament_players tp
JOIN players p ON tp.player_id = p.id
WHERE tp.tournament_id = (SELECT id FROM tournaments ORDER BY created_at DESC LIMIT 1)
ORDER BY tp.rank;

-- Check if there are any results that don't match the expected pattern
SELECT 
  r.id,
  r.round,
  p1.name as player1_name,
  p2.name as player2_name,
  r.score1,
  r.score2,
  CASE 
    WHEN r.score1 > r.score2 THEN 'Player1 Win'
    WHEN r.score2 > r.score1 THEN 'Player2 Win'
    ELSE 'Tie'
  END as expected_outcome
FROM results r
JOIN players p1 ON r.player1_id = p1.id
JOIN players p2 ON r.player2_id = p2.id
WHERE r.tournament_id = (SELECT id FROM tournaments ORDER BY created_at DESC LIMIT 1)
ORDER BY r.round, r.created_at;
