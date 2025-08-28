import React from 'react';
import Icon from '../AppIcon';
import Button from '../ui/Button';
import { toast } from 'sonner';

const FileExporter = ({ tournamentInfo, players, results }) => {

  const generateNaspaTsh = () => {
    if (!tournamentInfo || !players) {
      toast.error("Tournament data is not available for export.");
      return null;
    }

    let content = `# Scrabble Direktor Export for NASPA\n`;
    content += `# Tournament: ${tournamentInfo.name}\n`;
    content += `# Date: ${tournamentInfo.date}\n\n`;

    content += `config: divisions 1\n`;
    content += `config: rounds ${tournamentInfo.rounds}\n\n`;

    players.forEach(player => {
        content += `player: 1 "${player.name}" ${player.rating || 0}\n`;
    });

    content += "\n";

    results.forEach(result => {
        content += `result: 1 ${result.round || 1} "${result.player1_name}" ${result.score1} "${result.player2_name}" ${result.score2}\n`;
    });

    return content;
  };

  // Date normalization function for AUPAIR.EXE format
  const normalizeDate = (dateString) => {
    if (!dateString) return new Date().toLocaleDateString('en-GB').replace(/\//g, '.');
    
    // Extract year (4-digit)
    const yearMatch = dateString.match(/\b([2-9]\d{3})\b/);
    if (!yearMatch) {
      return new Date().toLocaleDateString('en-GB').replace(/\//g, '.');
    }
    
    const year = yearMatch[1];
    let remainingDate = dateString.replace(/\b([2-9]\d{3})\b/, '');
    
    // Extract month
    let month = null;
    const monthPatterns = {
      'Jan': 1, 'January': 1, 'Feb': 2, 'February': 2,
      'Mar': 3, 'March': 3, 'Apr': 4, 'April': 4,
      'May': 5, 'Jun': 6, 'June': 6, 'Jul': 7, 'July': 7,
      'Aug': 8, 'August': 8, 'Sep': 9, 'Sept': 9, 'September': 9,
      'Oct': 10, 'October': 10, 'Nov': 11, 'November': 11,
      'Dec': 12, 'December': 12
    };
    
    for (const [monthName, monthNum] of Object.entries(monthPatterns)) {
      if (remainingDate.includes(monthName)) {
        month = monthNum;
        remainingDate = remainingDate.replace(new RegExp(`\\b${monthName}\\b.*`), '');
        break;
      }
    }
    
    // Extract day
    let day = null;
    const dayMatch = remainingDate.match(/(\d+)\D*$/);
    if (dayMatch) {
      day = parseInt(dayMatch[1]);
    } else {
      const dashMatch = remainingDate.match(/-(\d+)-(\d+)/);
      if (dashMatch) {
        month = parseInt(dashMatch[1]);
        day = parseInt(dashMatch[2]);
      } else {
        // Fix: Handle M/D/YYYY format properly
        const slashMatch = remainingDate.match(/(\d+)\/(\d+)/);
        if (slashMatch) {
          month = parseInt(slashMatch[1]);
          day = parseInt(slashMatch[2]);
          // Don't swap month/day for slash format - assume M/D/YYYY
        }
      }
    }
    
    // Ensure we have valid month and day
    if (!month || !day) {
      // Fallback to current date if parsing failed
      const now = new Date();
      return `${String(now.getDate()).padStart(2, '0')}.${String(now.getMonth() + 1).padStart(2, '0')}.${now.getFullYear()}`;
    }
    
    return `${String(day).padStart(2, '0')}.${String(month).padStart(2, '0')}.${year}`;
  };

  // Player name formatting for AUPAIR.EXE
  const formatPlayerName = (name) => {
    if (!name) return 'Unknown Player';
    return name;
  };

  // Game result encoding for AUPAIR.EXE format
  const encodeGameResult = (playerScore, opponentScore, opponentId) => {
    if (opponentScore === null || opponentScore === undefined) {
      // Bye or forfeit
      if (playerScore > 0) {
        return ` 2${String(1).padStart(3, ' ')}${String(opponentId).padStart(4, ' ')}`;      // Winning bye
      } else if (playerScore === 0) {
        return ` 1${String(0).padStart(3, ' ')}${String(opponentId).padStart(4, ' ')}`;       // Tied bye
      } else {
        return ` 0${String(0).padStart(3, ' ')}${String(opponentId).padStart(4, ' ')}`;       // Forfeit loss
      }
    } else {
      // Regular game - determine win/loss/tie
      if (playerScore > opponentScore) {
        // Win - add + after score
        return ` 2${String(playerScore).padStart(3, ' ')}+${String(opponentId).padStart(4, ' ')}`;
      } else if (playerScore < opponentScore) {
        // Loss - no + symbol
        return ` 0${String(playerScore).padStart(3, ' ')}${String(opponentId).padStart(4, ' ')}`;
      } else {
        // Tie - no + symbol
        return ` 1${String(playerScore).padStart(3, ' ')}${String(opponentId).padStart(4, ' ')}`;
      }
    }
  };

  // Generate player line for AUPAIR.EXE format
  const generatePlayerLine = (player, rounds, playerIdMapping, results, players) => {
    // Format player name (20 characters, left-aligned)
    const formattedName = formatPlayerName(player.name);
    let line = formattedName.padEnd(20);
    
    // Add game results for each round
    for (let roundNum = 1; roundNum <= rounds; roundNum++) {
      const roundResults = results.filter(r => 
        (r.player1_name === player.name || r.player2_name === player.name) && 
        r.round === roundNum
      );
      
      if (roundResults.length > 0) {
        const result = roundResults[0];
        let playerScore, opponentScore, opponentName;
        
        if (result.player1_name === player.name) {
          playerScore = result.score1;
          opponentScore = result.score2;
          opponentName = result.player2_name;
        } else {
          playerScore = result.score2;
          opponentScore = result.score1;
          opponentName = result.player1_name;
        }
        
        // Find opponent in player list
        const opponent = players.find(p => p.name === opponentName);
        if (opponent) {
          const opponentId = playerIdMapping.get(opponent.name);
          if (opponentId) {
            line += encodeGameResult(playerScore, opponentScore, opponentId);
          }
        }
      } else {
        // Handle bye/forfeit - no result for this round
        line += `    0${String(0).padStart(3, ' ')}${String(playerIdMapping.get(player.name)).padStart(4, ' ')}`;
      }
    }
    
    return line + '\r\n';
  };

  const generateWespaTou = () => {
    if (!tournamentInfo || !players || !results) {
      toast.error("Complete tournament data is not available for export.");
      return null;
    }

    console.log('=== TOU GENERATION DEBUG START ===');
    console.log('tournamentInfo:', tournamentInfo);
    console.log('players:', players);
    console.log('results:', results);
    console.log('players.length:', players?.length);
    console.log('results.length:', results?.length);
    
    // Debug: Check player structure
    if (players && players.length > 0) {
      console.log('First player structure:', players[0]);
      console.log('First player name:', players[0]?.name);
      console.log('First player keys:', Object.keys(players[0] || {}));
    }
    
    // Debug: Check results structure
    if (results && results.length > 0) {
      console.log('First result structure:', results[0]);
      console.log('First result keys:', Object.keys(results[0] || {}));
    }
    
    console.log('=== TOU GENERATION DEBUG END ===');

    // Debug: Log first few players and results
    console.log('Sample players:', players.slice(0, 3));
    console.log('Sample results:', results.slice(0, 3));

    let fileContent = '';
    
    // Get tournament date (try multiple fields)
    const eventDate = tournamentInfo.start_date || tournamentInfo.date || tournamentInfo.created_at || new Date();
    const normalizedDate = normalizeDate(eventDate.toString());
    
    console.log('Event date:', eventDate, 'Normalized:', normalizedDate);
    
    // Determine divisions - check if tournament has divisions configured
    let divisions = ['A']; // Default to single division A
    if (tournamentInfo.divisions && Array.isArray(tournamentInfo.divisions) && tournamentInfo.divisions.length > 0) {
      divisions = tournamentInfo.divisions;
    } else if (tournamentInfo.division) {
      divisions = [tournamentInfo.division];
    } else {
      // Fallback: if no divisions configured, create a default division
      divisions = ['A'];
      console.log('No divisions configured, using default division A');
    }
    
    console.log('Divisions:', divisions);
    console.log('Divisions length:', divisions.length);
    
    // Write headers for each division
    for (let divIdx = 0; divIdx < divisions.length; divIdx++) {
      const division = divisions[divIdx];
      
      console.log(`Processing division ${division} (index ${divIdx})`);
      
      // Write event header only for first division
      if (divIdx === 0) {
        fileContent += `*M${normalizedDate} ${tournamentInfo.name}\r\n`;
        console.log('Added event header:', `*M${normalizedDate} ${tournamentInfo.name}`);
      }
      
      fileContent += `*${division}\r\n`;
      fileContent += "                                      0\r\n";
      console.log('Added division header:', `*${division}`);
      console.log('Added spacing line:', "                                      0");
      
      // Filter players for this division
      let divisionPlayers = players;
      if (tournamentInfo.divisions && Array.isArray(tournamentInfo.divisions)) {
        // If divisions are configured, filter players by division
        divisionPlayers = players.filter(player => {
          const playerData = tournamentInfo.players?.find(p => p.id === player.id);
          return playerData?.division === division || playerData?.group_id === division;
        });
      }
      
      // Fallback: if no players found, use all players
      if (divisionPlayers.length === 0) {
        console.log('No players found for division, using all players');
        divisionPlayers = players;
      }
      
      console.log(`Division ${division} players:`, divisionPlayers.length);
      console.log(`Division ${division} sample players:`, divisionPlayers.slice(0, 2));
      
      // Create player ID mapping for this division (1-based indexing for AUPAIR)
      const playerIdMapping = new Map();
      divisionPlayers.forEach((player, index) => {
        playerIdMapping.set(player.name, index + 1);
      });
      
      console.log('Player ID mapping:', Object.fromEntries(playerIdMapping));
      
      // Include ALL players in the division, not just those with results
      // This ensures we generate lines for all tournament participants
      const allDivisionPlayers = divisionPlayers;
      
      console.log(`Division ${division} all players:`, allDivisionPlayers.length);
      console.log('All players:', allDivisionPlayers.map(p => p.name));
      
      // Generate player lines for this division
      allDivisionPlayers.forEach(player => {
        console.log(`Generating line for player: ${player.name}`);
        const playerLine = generatePlayerLine(
          player, 
          tournamentInfo.rounds || tournamentInfo.total_rounds || 8, 
          playerIdMapping,
          results, // Pass results
          players // Pass players
        );
        console.log(`Generated line: "${playerLine.trim()}"`);
        fileContent += playerLine;
      });
    }
    
    // Write footer
    fileContent += '*** END OF FILE ***\r\n';
    
    console.log('Generated TOU content length:', fileContent.length);
    console.log('TOU content preview:', fileContent.substring(0, 500));
    console.log('Final file content:', fileContent);
    
    return fileContent;
  };

  const handleExport = (format) => {
    let fileContent;
    let fileName;
    let fileType = 'text/plain;charset=utf-8';

    if (format === 'naspa') {
        fileContent = generateNaspaTsh();
        fileName = `${tournamentInfo.name.replace(/ /g, '_')}.tsh`;
    } else if (format === 'wespa') {
        fileContent = generateWespaTou();
        
        // Generate appropriate filename based on divisions
        if (tournamentInfo.divisions && Array.isArray(tournamentInfo.divisions) && tournamentInfo.divisions.length > 1) {
          fileName = `AUPAIR.TOU`; // Multiple divisions
        } else {
          const division = tournamentInfo.divisions?.[0] || tournamentInfo.division || 'A';
          fileName = `${division}.TOU`; // Single division
        }
    } else {
        return;
    }

    if (!fileContent) return;

    const blob = new Blob([fileContent], { type: fileType });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`${fileName} has been downloaded.`);
  };

  return (
    <div className="glass-card p-6">
      <h3 className="font-heading font-semibold text-lg mb-4 flex items-center space-x-2">
        <Icon name="DownloadCloud" size={20} className="text-primary" />
        <span>Data Export for Ratings</span>
      </h3>
      <p className="text-sm text-muted-foreground mb-4">
        Generate the official files required for submitting your tournament results to sanctioning bodies like NASPA and WESPA.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 bg-muted/10 border border-border rounded-lg flex flex-col items-start">
          <h4 className="font-medium text-foreground mb-2">NASPA Export</h4>
          <p className="text-xs text-muted-foreground flex-1 mb-4">
            Generates a `.tsh` file compatible with the official NASPA submission tools.
          </p>
          <Button
            variant="outline"
            onClick={() => handleExport('naspa')}
            iconName="Download"
            iconPosition="left"
          >
            Download .tsh File
          </Button>
        </div>
        <div className="p-4 bg-muted/10 border border-border rounded-lg flex flex-col items-start">
          <h4 className="font-medium text-foreground mb-2">WESPA Export (AUPAIR.EXE)</h4>
          <p className="text-xs text-muted-foreground flex-1 mb-4">
            Generates a `.TOU` file in AUPAIR.EXE format for submission to WESPA and other international bodies.
          </p>
          <Button
            variant="outline"
            onClick={() => handleExport('wespa')}
            iconName="Download"
            iconPosition="left"
          >
            Download AUPAIR.TOU File
          </Button>
        </div>
      </div>
    </div>
  );
};

export default FileExporter;