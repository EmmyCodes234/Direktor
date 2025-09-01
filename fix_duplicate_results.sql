-- Fix duplicate results and recalculate player stats

-- First, remove duplicate results (keep only the first one)
DELETE FROM results 
WHERE id NOT IN (
  SELECT MIN(id)
  FROM results
  WHERE tournament_id = (SELECT id FROM tournaments ORDER BY created_at DESC LIMIT 1)
  GROUP BY tournament_id, round, player1_id, player2_id, score1, score2
);

-- Reset all player stats to zero
UPDATE tournament_players 
SET wins = 0, losses = 0, ties = 0, spread = 0
WHERE tournament_id = (SELECT id FROM tournaments ORDER BY created_at DESC LIMIT 1);

-- Recalculate stats from clean results
WITH player_stats AS (
  SELECT 
    tournament_id,
    player1_id,
    player2_id,
    score1,
    score2,
    -- Player 1 stats
    CASE 
      WHEN score1 > score2 THEN 1 
      WHEN score1 < score2 THEN 0 
      ELSE 0.5 
    END as player1_win,
    CASE 
      WHEN score1 < score2 THEN 1 
      WHEN score1 > score2 THEN 0 
      ELSE 0.5 
    END as player1_loss,
    (score1 - score2) as player1_spread,
    -- Player 2 stats
    CASE 
      WHEN score2 > score1 THEN 1 
      WHEN score2 < score1 THEN 0 
      ELSE 0.5 
    END as player2_win,
    CASE 
      WHEN score2 < score1 THEN 1 
      WHEN score2 > score1 THEN 0 
      ELSE 0.5 
    END as player2_loss,
    (score2 - score1) as player2_spread
  FROM results 
  WHERE tournament_id = (SELECT id FROM tournaments ORDER BY created_at DESC LIMIT 1)
)
UPDATE tournament_players 
SET 
  wins = (
    SELECT COALESCE(SUM(
      CASE 
        WHEN player_id = player1_id THEN player1_win
        WHEN player_id = player2_id THEN player2_win
        ELSE 0
      END
    ), 0)
    FROM player_stats
  ),
  losses = (
    SELECT COALESCE(SUM(
      CASE 
        WHEN player_id = player1_id THEN player1_loss
        WHEN player_id = player2_id THEN player2_loss
        ELSE 0
      END
    ), 0)
    FROM player_stats
  ),
  ties = (
    SELECT COALESCE(SUM(
      CASE 
        WHEN player_id = player1_id AND player1_win = 0.5 THEN 1
        WHEN player_id = player2_id AND player2_win = 0.5 THEN 1
        ELSE 0
      END
    ), 0)
    FROM player_stats
  ),
  spread = (
    SELECT COALESCE(SUM(
      CASE 
        WHEN player_id = player1_id THEN player1_spread
        WHEN player_id = player2_id THEN player2_spread
        ELSE 0
      END
    ), 0)
    FROM player_stats
  )
WHERE tournament_id = (SELECT id FROM tournaments ORDER BY created_at DESC LIMIT 1);

-- Show the final corrected stats
SELECT 
  p.name,
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
