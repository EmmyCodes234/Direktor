import React from 'react';
import { motion } from 'framer-motion';
import Icon from '../AppIcon';
import { Button } from '../ui/Button';

const DirectorProfileHeader = ({ user, stats, onCreateClick }) => {
    const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Director';
    const countryCode = user?.user_metadata?.country || 'un'; // Default to UN flag if unknown
    const avatarUrl = user?.user_metadata?.avatar_url; // If we supported avatar upload to metadata
    const [imageError, setImageError] = React.useState(false);

    // Reset error state when avatar URL changes
    React.useEffect(() => {
        setImageError(false);
    }, [avatarUrl]);

    // Fallback Avatar Logic
    const initials = userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

    return (
        <div className="relative w-full overflow-hidden mb-12 rounded-3xl border border-white/10 bg-slate-900/40 backdrop-blur-xl shadow-2xl">
            {/* Background Decoration */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none -translate-y-1/2 translate-x-1/2" />

            <div className="relative z-10 p-6 md:p-10 flex flex-col lg:flex-row items-center lg:items-end justify-between gap-8 text-center lg:text-left">

                {/* Left: Profile Info */}
                <div className="flex flex-col lg:flex-row items-center gap-4 lg:gap-6 w-full lg:w-auto">
                    {/* Avatar */}
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="relative"
                    >
                        <div className="w-20 h-20 md:w-32 md:h-32 rounded-3xl bg-slate-800 border-2 border-slate-700/50 flex items-center justify-center overflow-hidden shadow-lg transform rotate-3 hover:rotate-0 transition-transform duration-300">
                            {avatarUrl && !imageError ? (
                                <img
                                    src={avatarUrl}
                                    alt={userName}
                                    className="w-full h-full object-cover"
                                    onError={() => setImageError(true)}
                                />
                            ) : (
                                <span className="text-2xl md:text-5xl font-heading font-black text-slate-600 select-none">
                                    {initials}
                                </span>
                            )}
                        </div>
                        {/* Online Status Dot */}
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 md:w-6 md:h-6 bg-slate-900 rounded-full flex items-center justify-center">
                            <div className="w-3 h-3 md:w-4 md:h-4 bg-emerald-500 rounded-full border-2 border-slate-900" />
                        </div>
                    </motion.div>

                    {/* Text Details */}
                    <div className="space-y-1 md:space-y-2 w-full">
                        <div className="flex items-center justify-center lg:justify-start gap-2 md:gap-3">
                            <h1 className="text-2xl md:text-4xl font-heading font-bold text-white tracking-tight truncate max-w-[200px] md:max-w-none">
                                {userName}
                            </h1>
                            {/* Country Flag */}
                            {countryCode && (
                                <img
                                    src={`https://flagcdn.com/w40/${countryCode.toLowerCase()}.png`}
                                    srcSet={`https://flagcdn.com/w80/${countryCode.toLowerCase()}.png 2x`}
                                    width="28"
                                    alt={countryCode}
                                    className="rounded-md shadow-sm opacity-90 hover:opacity-100 hover:scale-110 transition-transform"
                                    onError={(e) => e.target.style.display = 'none'}
                                />
                            )}
                        </div>

                        <div className="flex flex-col md:flex-row items-center gap-1 md:gap-2 justify-center lg:justify-start text-slate-400 text-sm font-medium">
                            <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase tracking-wider text-[10px]">
                                Tournament Director
                            </span>
                            <span className="hidden md:block w-1 h-1 rounded-full bg-slate-600" />
                            <span className="text-xs md:text-sm">{user?.email}</span>
                        </div>

                        {/* Quick Stats Row */}
                        <div className="flex items-center justify-center lg:justify-start gap-4 md:gap-6 pt-4 md:pt-2 w-full">
                            <div className="text-center lg:text-left">
                                <div className="text-lg font-bold text-white">{stats.active}</div>
                                <div className="text-[10px] md:text-xs text-slate-500 uppercase tracking-widest">Active</div>
                            </div>
                            <div className="w-px h-8 bg-white/10" />
                            <div className="text-center lg:text-left">
                                <div className="text-lg font-bold text-white">{stats.total}</div>
                                <div className="text-[10px] md:text-xs text-slate-500 uppercase tracking-widest">Lifetime</div>
                            </div>
                            <div className="w-px h-8 bg-white/10" />
                            <div className="text-center lg:text-left">
                                <div className="text-lg font-bold text-white">{stats.drafts}</div>
                                <div className="text-[10px] md:text-xs text-slate-500 uppercase tracking-widest">Drafts</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right: Actions */}
                <div className="flex gap-4 w-full lg:w-auto">
                    <Button
                        onClick={onCreateClick}
                        size="lg"
                        className="w-full lg:w-auto h-12 md:h-14 px-8 text-base shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 bg-emerald-600 hover:bg-emerald-500 text-white border-0 rounded-2xl"
                        iconName="Plus"
                    >
                        Create New Event
                    </Button>
                </div>

            </div>
        </div>
    );
};

export default DirectorProfileHeader;
