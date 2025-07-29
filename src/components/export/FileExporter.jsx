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

  const generateWespaTou = () => {
    if (!tournamentInfo || !players || !results) {
        toast.error("Complete tournament data is not available for export.");
        return null;
    }

    let fileContent = `M${new Date().toLocaleDateString()} ${tournamentInfo.name}\n`;
    fileContent += `*A\n`;
    fileContent += `0 ${players.length} ${tournamentInfo.rounds}\n`;

    const playerIndexMap = new Map(players.map((p, i) => [p.name, i + 1]));

    players.forEach(player => {
        let playerLine = `${player.name.padEnd(20, ' ')}`;
        const playerResults = results.filter(r => r.player1_name === player.name || r.player2_name === player.name)
                                     .sort((a, b) => a.round - b.round);
        
        playerResults.forEach(result => {
            let yourScore, opponentScore, opponentName;
            if (result.player1_name === player.name) {
                yourScore = result.score1;
                opponentScore = result.score2;
                opponentName = result.player2_name;
            } else {
                yourScore = result.score2;
                opponentScore = result.score1;
                opponentName = result.player1_name;
            }
            const opponentIndex = playerIndexMap.get(opponentName);
            if (opponentIndex) {
                 playerLine += `${yourScore.toString().padStart(4, ' ')} ${opponentIndex.toString().padStart(3, ' ')} ${opponentScore.toString().padStart(4, ' ')} `;
            }
        });
        fileContent += playerLine.trimEnd() + '\n';
    });
    
    fileContent += '*** END OF FILE ***\n';
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
        fileName = `RESULTS.TOU`;
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
          <h4 className="font-medium text-foreground mb-2">WESPA Export</h4>
          <p className="text-xs text-muted-foreground flex-1 mb-4">
            Generates a `.TOU` file for submission to WESPA and other international bodies.
          </p>
          <Button
            variant="outline"
            onClick={() => handleExport('wespa')}
            iconName="Download"
            iconPosition="left"
          >
            Download .TOU File
          </Button>
        </div>
      </div>
    </div>
  );
};

export default FileExporter;