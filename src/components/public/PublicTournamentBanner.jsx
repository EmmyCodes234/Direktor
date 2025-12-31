import React from 'react';
import { format } from 'date-fns';
import Icon from '../AppIcon';

const PublicTournamentBanner = ({ tournament }) => {
    if (!tournament) return null;

    const bannerUrl = tournament.banner_url || tournament.banner_path || null;
    const tournamentName = tournament.name || "Loading Tournament...";
    const location = tournament.location;
    const formattedDate = tournament.date
        ? format(new Date(tournament.date), "MMMM do, yyyy")
        : (tournament.start_date ? format(new Date(tournament.start_date), "MMMM do, yyyy") : "");

    return (
        <div className="w-full bg-blue-50 text-center border-b border-gray-200 mb-6">
            <div className="w-full flex flex-col items-center justify-center">
                {bannerUrl && (
                    <img
                        src={bannerUrl}
                        alt={`${tournamentName} Banner`}
                        className="w-full max-w-5xl mx-auto object-cover max-h-[350px]"
                        onError={(e) => {
                            e.target.style.display = 'none';
                        }}
                    />
                )}

                <div className={`${bannerUrl ? 'hidden' : 'block'} w-full py-8 px-4`}>
                    <h1 className="text-5xl font-bold text-blue-900 tracking-tight font-display mb-3">
                        {tournamentName}
                    </h1>

                    <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-blue-900/60 font-medium text-lg">
                        {formattedDate && (
                            <span className="flex items-center gap-2">
                                <Icon name="Calendar" size={18} className="text-blue-500" />
                                {formattedDate}
                            </span>
                        )}
                        {location && (
                            <span className="flex items-center gap-2">
                                <Icon name="MapPin" size={18} className="text-blue-500" />
                                {location}
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PublicTournamentBanner;
