import React, { useState } from 'react';
import ConfirmationModal from '../../../components/ConfirmationModal.jsx';
import Button from '../../../components/ui/Button';

const TeamManagerModal = ({ isOpen, onClose, teams, players, onSave }) => {
  const [editTeams, setEditTeams] = useState(() => teams.map(t => ({ ...t })));
  const [selectedTeamId, setSelectedTeamId] = useState(teams[0]?.id || null);
  const [logoUrl, setLogoUrl] = useState('');
  const [color, setColor] = useState('#cccccc');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleTeamChange = (id, field, value) => {
    setEditTeams(ts => ts.map(t => t.id === id ? { ...t, [field]: value } : t));
  };

  const handleAssignPlayer = (teamId, playerId) => {
    setEditTeams(ts => ts.map(t =>
      t.id === teamId
        ? { ...t, players: [...(t.players || []), playerId] }
        : { ...t, players: (t.players || []).filter(pid => pid !== playerId) }
    ));
  };

  const handleBranding = (id, logo, color) => {
    setEditTeams(ts => ts.map(t => t.id === id ? { ...t, branding: { logo, color } } : t));
  };

  const handleSave = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      await onSave(editTeams);
      onClose();
    } catch (error) {
      console.error("Failed to save teams", error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <ConfirmationModal isOpen={isOpen} onCancel={onClose} title="Manage Teams" message={null}>
      <div className="flex gap-4">
        <div className="w-1/3">
          <ul>
            {editTeams.map(team => (
              <li key={team.id} className={`p-2 cursor-pointer rounded ${selectedTeamId === team.id ? 'bg-primary/10' : ''}`}
                onClick={() => setSelectedTeamId(team.id)}>
                <span className="font-bold">{team.name}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="flex-1">
          {editTeams.filter(t => t.id === selectedTeamId).map(team => (
            <div key={team.id}>
              <label className="block mb-2 font-semibold">Team Name</label>
              <input className="input mb-4" value={team.name} onChange={e => handleTeamChange(team.id, 'name', e.target.value)} />
              <label className="block mb-2 font-semibold">Branding</label>
              <div className="flex items-center gap-2 mb-4">
                <input type="text" className="input" placeholder="Logo URL" value={team.branding?.logo || ''} onChange={e => handleBranding(team.id, e.target.value, team.branding?.color || color)} />
                <input type="color" value={team.branding?.color || color} onChange={e => handleBranding(team.id, team.branding?.logo || logoUrl, e.target.value)} />
              </div>
              <label className="block mb-2 font-semibold">Assign Players</label>
              <ul className="mb-4">
                {players.map(p => (
                  <li key={p.player_id}>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" checked={(team.players || []).includes(p.player_id)} onChange={e => handleAssignPlayer(team.id, p.player_id)} />
                      {p.name}
                    </label>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
      <div className="flex justify-end gap-2 mt-4">
        <Button variant="ghost" onClick={onClose} disabled={isProcessing}>Cancel</Button>
        <Button onClick={handleSave} loading={isProcessing}>Save Changes</Button>
      </div>
    </ConfirmationModal>
  );
};

export default TeamManagerModal;
