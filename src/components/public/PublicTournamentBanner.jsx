import React from 'react';
import { format } from 'date-fns';

const PublicTournamentBanner = ({ tournament }) => {
    if (!tournament) return null;

    const bannerUrl = tournament.banner_url || tournament.banner_path || null;
    const tournamentName = tournament.name || "Loading Tournament...";
    const formattedDate = tournament.date
        ? format(new Date(tournament.date), "MMMM do, yyyy")
        : (tournament.start_date ? format(new Date(tournament.start_date), "MMMM do, yyyy") : "");

    return (
        <div className="w-full bg-blue-50 text-center border-b border-gray-200 mb-6">
            <div className="w-full min-h-[100px] flex flex-col items-center justify-center">
                {bannerUrl ? (
                    <img
                        src={bannerUrl}
                        alt={`${tournamentName} Banner`}
                        className="w-full max-w-5xl mx-auto object-cover max-h-[350px]"
                        onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'block';
                        }}
                    />
                ) : null}
                <div className={`${bannerUrl ? 'hidden' : 'block'} py-12 px-4`}>
                    <h1 className="text-4xl font-bold text-blue-900 tracking-tight">{tournamentName}</h1>
                    {formattedDate && <p className="text-blue-700/60 mt-2 font-medium">{formattedDate}</p>}
                </div>
            </div>
        </div>
    );
};

export default PublicTournamentBanner;
