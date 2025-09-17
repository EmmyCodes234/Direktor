import React, { useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import Icon from './AppIcon';
import Button from './ui/Button';
import { toast } from 'sonner';
import { format } from 'date-fns';

const ScorecardExporter = ({ player, tournament, results, matches, tournamentType }) => {
  const [isExporting, setIsExporting] = useState(false);
  const scorecardRef = useRef(null);

  // Calculate player statistics
  const calculatePlayerStats = () => {
    if (!player || !results) {
      return { wins: 0, losses: 0, ties: 0, spread: 0, match_wins: 0, match_losses: 0, games: [] };
    }

    let wins = 0, losses = 0, ties = 0, spread = 0;
    let match_wins = 0, match_losses = 0;
    const games = [];

    // Calculate per-game stats
    results.forEach((result, index) => {
      if (result.player1_id === player.player_id || result.player2_id === player.player_id) {
        const isP1 = result.player1_id === player.player_id;
        const myScore = isP1 ? result.score1 : result.score2;
        const oppScore = isP1 ? result.score2 : result.score1;
        const opponent = isP1 ? result.player2_name : result.player1_name;
        
        let gameResult;
        if (myScore > oppScore) {
          wins++;
          gameResult = 'W';
        } else if (myScore < oppScore) {
          losses++;
          gameResult = 'L';
        } else {
          ties++;
          gameResult = 'T';
        }
        
        spread += (myScore - oppScore);
        
        games.push({
          round: result.round || index + 1,
          opponent,
          myScore,
          oppScore,
          result: gameResult,
          spread: myScore - oppScore
        });
      }
    });

    // Calculate match wins/losses for best-of-league
    if (tournamentType === 'best_of_league') {
      const bestOf = 15; // Default
      const majority = Math.floor(bestOf / 2) + 1;
      const matchupMap = {};
      
      results.forEach(result => {
        if (!result.player1_id || !result.player2_id) return;
        const ids = [result.player1_id, result.player2_id].sort((a, b) => a - b);
        const key = ids.join('-');
        if (!matchupMap[key]) matchupMap[key] = [];
        matchupMap[key].push(result);
      });

      Object.entries(matchupMap).forEach(([key, matchResults]) => {
        if (!key.split('-').includes(String(player.player_id))) return;
        
        const [id1, id2] = key.split('-').map(Number);
        let p1Wins = 0, p2Wins = 0;
        
        matchResults.forEach(r => {
          if (r.score1 > r.score2) {
            if (r.player1_id === id1) p1Wins++;
            else p2Wins++;
          } else if (r.score2 > r.score1) {
            if (r.player2_id === id1) p1Wins++;
            else p2Wins++;
          }
        });

        if (id1 === player.player_id) {
          if (p1Wins >= majority) match_wins++;
          else if (p2Wins >= majority) match_losses++;
        }
        if (id2 === player.player_id) {
          if (p2Wins >= majority) match_wins++;
          else if (p1Wins >= majority) match_losses++;
        }
      });
    }

    return { wins, losses, ties, spread, match_wins, match_losses, games: games.sort((a, b) => a.round - b.round) };
  };

  const stats = calculatePlayerStats();

  const exportToPNG = async () => {
    if (!scorecardRef.current) return;
    
    setIsExporting(true);
    try {
      // High-quality PNG export with optimal settings
      const canvas = await html2canvas(scorecardRef.current, {
        scale: 3, // Higher scale for better quality
        backgroundColor: '#ffffff',
        useCORS: true,
        allowTaint: false,
        width: scorecardRef.current.scrollWidth,
        height: scorecardRef.current.scrollHeight,
        scrollX: 0,
        scrollY: 0,
        logging: false,
        onclone: (clonedDoc) => {
          // Ensure proper styling and high-DPI rendering
          const clonedElement = clonedDoc.querySelector('[data-scorecard]');
          if (clonedElement) {
            clonedElement.style.fontFamily = 'system-ui, -apple-system, sans-serif';
            clonedElement.style.fontSize = '14px'; // Ensure consistent font size
            clonedElement.style.lineHeight = '1.4';
            
            // Force all table elements to have consistent styling
            const tables = clonedElement.querySelectorAll('table');
            tables.forEach(table => {
              table.style.fontSize = '12px';
              table.style.borderCollapse = 'collapse';
            });
            
            const cells = clonedElement.querySelectorAll('td, th');
            cells.forEach(cell => {
              cell.style.fontSize = '12px';
              cell.style.padding = '6px';
              cell.style.border = '1px solid #666';
            });
          }
        }
      });

      // Create high-quality PNG with maximum quality
      const link = document.createElement('a');
      link.download = `${player.name.replace(/[^a-zA-Z0-9]/g, '_')}_scorecard_${tournament.name.replace(/[^a-zA-Z0-9]/g, '_')}.png`;
      link.href = canvas.toDataURL('image/png', 1.0); // Maximum quality
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('High-quality scorecard downloaded successfully!');
    } catch (error) {
      console.error('PNG export error:', error);
      toast.error('Failed to download scorecard');
    } finally {
      setIsExporting(false);
    }
  };

  const exportToPDF = async () => {
    if (!scorecardRef.current) return;
    
    setIsExporting(true);
    try {
      // Create lightweight PDF using text-based approach instead of image
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 15;
      const contentWidth = pageWidth - 2 * margin;
      let yPosition = margin + 10;
      
      // Header
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      const titleLines = pdf.splitTextToSize(tournament.name, contentWidth);
      pdf.text(titleLines, pageWidth / 2, yPosition, { align: 'center' });
      yPosition += titleLines.length * 6 + 5;
      
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      const venueText = `${tournament.venue} • ${formattedDate}`;
      pdf.text(venueText, pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 8;
      
      if (tournament.type) {
        const typeText = tournament.type === 'best_of_league' ? 'Best-of-League Tournament' : 
                        tournament.type === 'team' ? 'Team Tournament' : 'Individual Tournament';
        pdf.text(typeText, pageWidth / 2, yPosition, { align: 'center' });
        yPosition += 8;
      }
      
      // Player scorecard title
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`Player Scorecard: ${player.name}`, pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 15;
      
      // Player info section
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Player Information:', margin, yPosition);
      pdf.text('Tournament Summary:', margin + contentWidth / 2, yPosition);
      yPosition += 6;
      
      pdf.setFont('helvetica', 'normal');
      const playerInfo = [
        `Name: ${player.name}`,
        `Rating: ${player.rating || 'Unrated'}`,
        `Seed: #${player.seed || 'N/A'}`,
        `Final Rank: #${player.rank || 'N/A'}`
      ];
      
      const summaryInfo = tournamentType === 'best_of_league' ? [
        `Match Record: ${stats.match_wins}-${stats.match_losses}`,
        `Game Record: ${stats.wins}-${stats.losses}-${stats.ties}`,
        `Total Spread: ${stats.spread > 0 ? '+' : ''}${stats.spread}`,
        `Games Played: ${stats.games.length}`
      ] : [
        `Record: ${stats.wins}-${stats.losses}-${stats.ties}`,
        `Total Spread: ${stats.spread > 0 ? '+' : ''}${stats.spread}`,
        `Games Played: ${stats.games.length}`
      ];
      
      playerInfo.forEach((info, i) => {
        pdf.text(info, margin, yPosition + i * 4);
      });
      
      summaryInfo.forEach((info, i) => {
        pdf.text(info, margin + contentWidth / 2, yPosition + i * 4);
      });
      
      yPosition += Math.max(playerInfo.length, summaryInfo.length) * 4 + 10;
      
      // Game results table
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Game Results:', margin, yPosition);
      yPosition += 8;
      
      // Table headers
      const colWidths = [15, 50, 25, 15, 20];
      const headers = ['Round', 'Opponent', 'Score', 'Result', 'Spread'];
      let xPos = margin;
      
      pdf.setFont('helvetica', 'bold');
      headers.forEach((header, i) => {
        pdf.text(header, xPos, yPosition);
        xPos += colWidths[i];
      });
      yPosition += 5;
      
      // Table data
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      
      stats.games.forEach((game, index) => {
        // Check if we need a new page
        if (yPosition > pageHeight - 30) {
          pdf.addPage();
          yPosition = margin + 10;
        }
        
        xPos = margin;
        const rowData = [
          game.round.toString(),
          game.opponent.substring(0, 20), // Truncate long names
          `${game.myScore}-${game.oppScore}`,
          game.result,
          `${game.spread > 0 ? '+' : ''}${game.spread}`
        ];
        
        rowData.forEach((data, i) => {
          pdf.text(data, xPos, yPosition);
          xPos += colWidths[i];
        });
        yPosition += 4;
      });
      
      // Footer
      yPosition = pageHeight - 15;
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      const footerText = `Generated by Scrabble Direktor • ${format(new Date(), 'PPpp')}`;
      pdf.text(footerText, pageWidth / 2, yPosition, { align: 'center' });
      
      // Save lightweight PDF
      pdf.save(`${player.name.replace(/[^a-zA-Z0-9]/g, '_')}_scorecard_${tournament.name.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);
      
      toast.success('Lightweight PDF downloaded successfully!');
    } catch (error) {
      console.error('PDF export error:', error);
      toast.error('Failed to download PDF');
    } finally {
      setIsExporting(false);
    }
  };

  const formattedDate = tournament.type === 'best_of_league' 
    ? `${format(new Date(tournament.start_date), "MMM do")} - ${format(new Date(tournament.end_date), "MMM do, yyyy")}`
    : tournament.date ? format(new Date(tournament.date), "MMMM do, yyyy") : "Date not set";

  return (
    <div className="space-y-4">
      {/* Export Options Description */}
      <div className="text-center mb-4">
        <p className="text-sm text-muted-foreground mb-2">
          Choose your preferred export format:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-muted-foreground">
          <div className="flex items-center justify-center space-x-2">
            <Icon name="Image" size={14} className="text-green-600" />
            <span><strong>HD PNG:</strong> High-quality image, shows all games clearly</span>
          </div>
          <div className="flex items-center justify-center space-x-2">
            <Icon name="FileText" size={14} className="text-red-600" />
            <span><strong>Light PDF:</strong> Text-based format, smaller file size</span>
          </div>
        </div>
      </div>
      
      {/* Export Buttons */}
      <div className="flex gap-3 justify-center mb-6">
        <Button
          onClick={exportToPNG}
          disabled={isExporting}
          className="bg-green-600 hover:bg-green-700 text-white"
          title="Download high-quality PNG image (larger file size)"
        >
          <Icon name="Download" size={18} className="mr-2" />
          {isExporting ? 'Downloading...' : 'Download HD PNG'}
        </Button>
        <Button
          onClick={exportToPDF}
          disabled={isExporting}
          className="bg-red-600 hover:bg-red-700 text-white"
          title="Download lightweight text-based PDF (smaller file size)"
        >
          <Icon name="Download" size={18} className="mr-2" />
          {isExporting ? 'Downloading...' : 'Download Light PDF'}
        </Button>
      </div>

      {/* Scorecard Preview */}
      <div 
        ref={scorecardRef}
        data-scorecard
        className="bg-white text-black p-8 rounded-lg border-2 border-gray-300 max-w-4xl mx-auto"
        style={{ 
          fontFamily: 'system-ui, -apple-system, sans-serif',
          minHeight: 'auto',
          width: '800px', // Fixed width for consistent exports
          fontSize: '14px',
          lineHeight: '1.4',
          maxHeight: stats.games.length > 20 ? 'none' : '1200px' // Dynamic height based on games
        }}
      >
        {/* Header */}
        <div className="text-center mb-6 border-b-2 border-gray-800 pb-4">
          <h1 className="text-3xl font-bold text-gray-800 mb-3">{tournament.name}</h1>
          <div className="text-gray-600 mb-3 space-y-1">
            <p className="text-lg">{tournament.venue} • {formattedDate}</p>
            {tournament.type && (
              <p className="text-sm uppercase tracking-wide font-medium">
                {tournament.type === 'best_of_league' ? 'Best-of-League Tournament' : 
                 tournament.type === 'team' ? 'Team Tournament' : 
                 'Individual Tournament'}
              </p>
            )}
            {tournament.rounds && (
              <p className="text-sm">Tournament Rounds: {tournament.rounds}</p>
            )}
          </div>
          <div className="text-xl font-bold text-gray-800 bg-gray-100 py-2 px-4 rounded-lg inline-block">
            Player Scorecard: {player.name}
          </div>
        </div>

        {/* Player Info */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          <div>
            <h3 className="font-bold text-gray-800 mb-3">Player Information</h3>
            <div className="space-y-2 text-sm">
              <div><span className="font-medium">Name:</span> {player.name}</div>
              <div><span className="font-medium">Rating:</span> {player.rating || 'Unrated'}</div>
              <div><span className="font-medium">Seed:</span> #{player.seed || 'N/A'}</div>
              <div><span className="font-medium">Final Rank:</span> #{player.rank || 'N/A'}</div>
            </div>
          </div>
          
          <div>
            <h3 className="font-bold text-gray-800 mb-3">Tournament Summary</h3>
            <div className="space-y-2 text-sm">
              {tournamentType === 'best_of_league' ? (
                <>
                  <div><span className="font-medium">Match Record:</span> {stats.match_wins}-{stats.match_losses}</div>
                  <div><span className="font-medium">Game Record:</span> {stats.wins}-{stats.losses}-{stats.ties}</div>
                </>
              ) : (
                <div><span className="font-medium">Record:</span> {stats.wins}-{stats.losses}-{stats.ties}</div>
              )}
              <div><span className="font-medium">Total Spread:</span> {stats.spread > 0 ? '+' : ''}{stats.spread}</div>
              <div><span className="font-medium">Games Played:</span> {stats.games.length}</div>
            </div>
          </div>
        </div>

        {/* Game Results */}
        <div>
          <h3 className="font-bold text-gray-800 mb-3">Game Results</h3>
          <div className="overflow-visible">
            {stats.games.length > 0 ? (
              <table className="w-full border-collapse" style={{ fontSize: '12px' }}>
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border-2 border-gray-600 px-3 py-2 text-left font-bold">Round</th>
                    <th className="border-2 border-gray-600 px-3 py-2 text-left font-bold">Opponent</th>
                    <th className="border-2 border-gray-600 px-3 py-2 text-center font-bold">Score</th>
                    <th className="border-2 border-gray-600 px-3 py-2 text-center font-bold">Result</th>
                    <th className="border-2 border-gray-600 px-3 py-2 text-center font-bold">Spread</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.games.map((game, index) => (
                    <tr key={index} className={game.result === 'W' ? 'bg-green-50' : game.result === 'L' ? 'bg-red-50' : 'bg-yellow-50'}>
                      <td className="border border-gray-600 px-3 py-2 font-semibold text-center">{game.round}</td>
                      <td className="border border-gray-600 px-3 py-2" style={{ maxWidth: '200px', wordWrap: 'break-word' }}>
                        {game.opponent}
                      </td>
                      <td className="border border-gray-600 px-3 py-2 text-center font-mono font-semibold">
                        {game.myScore}-{game.oppScore}
                      </td>
                      <td className="border border-gray-600 px-3 py-2 text-center font-bold text-lg">
                        {game.result}
                      </td>
                      <td className="border border-gray-600 px-3 py-2 text-center font-mono font-semibold">
                        {game.spread > 0 ? '+' : ''}{game.spread}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-center text-gray-500 py-8">
                <p>No games played yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-gray-300 text-center text-xs text-gray-500">
          Generated by Scrabble Direktor • {format(new Date(), 'PPpp')}
        </div>
      </div>
    </div>
  );
};

export default ScorecardExporter;