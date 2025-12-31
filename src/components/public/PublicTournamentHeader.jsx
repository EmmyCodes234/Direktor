import React from 'react';
import { format } from 'date-fns';

const PublicTournamentHeader = ({ tournament }) => {
    // Defaults for instant rendering
    const bannerUrl = tournament?.banner_path || '/lekki_banner.png';
    const formattedDate = tournament?.date ? format(new Date(tournament.date), "MMMM do, yyyy") : "";
    const tournamentName = tournament?.name || "Loading Tournament...";

    return (
        <div className="text-center border-b border-gray-200 print:hidden">
            <div className="w-full bg-blue-50">
                <img
                    src={bannerUrl}
                    className="w-full max-w-5xl mx-auto object-cover max-h-[350px]"
                    alt={tournamentName}
                    onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'block';
                    }}
                />
                <div className="hidden py-8 px-4">
                    <h1 className="text-3xl font-bold text-blue-900">{tournamentName}</h1>
                    <p className="text-gray-600">{formattedDate}</p>
                </div>
            </div>
        </div>
    );
};

export default PublicTournamentHeader;
