// Social Sharing Utility
export const socialSharing = {
  // Share to Twitter/X
  shareToTwitter: (text, url) => {
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
    window.open(twitterUrl, '_blank', 'width=600,height=400');
  },

  // Share to Facebook
  shareToFacebook: (url, quote = '') => {
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(quote)}`;
    window.open(facebookUrl, '_blank', 'width=600,height=400');
  },

  // Share to LinkedIn
  shareToLinkedIn: (url, title = '', summary = '') => {
    const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}&summary=${encodeURIComponent(summary)}`;
    window.open(linkedInUrl, '_blank', 'width=600,height=400');
  },

  // Share to WhatsApp
  shareToWhatsApp: (text, url) => {
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`;
    window.open(whatsappUrl, '_blank');
  },

  // Share to Telegram
  shareToTelegram: (text, url) => {
    const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
    window.open(telegramUrl, '_blank');
  },

  // Share to Reddit
  shareToReddit: (url, title = '') => {
    const redditUrl = `https://reddit.com/submit?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`;
    window.open(redditUrl, '_blank', 'width=600,height=400');
  },

  // Copy to clipboard
  copyToClipboard: async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        document.body.removeChild(textArea);
        return true;
      } catch (fallbackErr) {
        document.body.removeChild(textArea);
        return false;
      }
    }
  },

  // Share via email
  shareViaEmail: (subject, body) => {
    const emailUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = emailUrl;
  },

  // Share via SMS (mobile only)
  shareViaSMS: (text) => {
    const smsUrl = `sms:?body=${encodeURIComponent(text)}`;
    window.location.href = smsUrl;
  },

  // Native sharing (if supported)
  nativeShare: async (data) => {
    if (navigator.share) {
      try {
        await navigator.share(data);
        return true;
      } catch (err) {
        return false;
      }
    }
    return false;
  }
};

// Tournament-specific sharing functions
export const tournamentSharing = {
  // Share tournament overview
  shareTournament: (tournament, url, players = []) => {
    const playerCount = players.length || tournament.player_count || 0;
    const text = `🏆 Check out ${tournament.name} - Live tournament with ${playerCount} players! Follow the action live:`;
    const title = `${tournament.name} - Live Tournament`;
    const summary = `Live tournament with ${playerCount} players. Follow the action in real-time!`;

    return {
      twitter: () => socialSharing.shareToTwitter(text, url),
      facebook: () => socialSharing.shareToFacebook(url, text),
      linkedin: () => socialSharing.shareToLinkedIn(url, title, summary),
      whatsapp: () => socialSharing.shareToWhatsApp(text, url),
      telegram: () => socialSharing.shareToTelegram(text, url),
      reddit: () => socialSharing.shareToReddit(url, title),
      copy: () => socialSharing.copyToClipboard(`${text} ${url}`),
      email: () => socialSharing.shareViaEmail(title, `${text}\n\n${url}`),
      sms: () => socialSharing.shareViaSMS(`${text} ${url}`),
      native: () => socialSharing.nativeShare({
        title,
        text,
        url
      })
    };
  },

  // Share standings
  shareStandings: (tournament, players, url) => {
    const top3 = players.slice(0, 3).map((p, i) => `${i + 1}. ${p.name}`).join(', ');
    const text = `🏆 ${tournament.name} - Current Standings: ${top3}. Follow live updates:`;
    const title = `${tournament.name} - Live Standings`;

    return {
      twitter: () => socialSharing.shareToTwitter(text, url),
      facebook: () => socialSharing.shareToFacebook(url, text),
      linkedin: () => socialSharing.shareToLinkedIn(url, title, text),
      whatsapp: () => socialSharing.shareToWhatsApp(text, url),
      telegram: () => socialSharing.shareToTelegram(text, url),
      reddit: () => socialSharing.shareToReddit(url, title),
      copy: () => socialSharing.copyToClipboard(`${text} ${url}`),
      email: () => socialSharing.shareViaEmail(title, `${text}\n\n${url}`),
      sms: () => socialSharing.shareViaSMS(`${text} ${url}`),
      native: () => socialSharing.nativeShare({
        title,
        text,
        url
      })
    };
  },

  // Share specific result
  shareResult: (result, tournament, url) => {
    const text = `⚡ ${result.player1_name} vs ${result.player2_name} - Final Score: ${result.score1}-${result.score2} in ${tournament.name}!`;
    const title = `${tournament.name} - Match Result`;

    return {
      twitter: () => socialSharing.shareToTwitter(text, url),
      facebook: () => socialSharing.shareToFacebook(url, text),
      linkedin: () => socialSharing.shareToLinkedIn(url, title, text),
      whatsapp: () => socialSharing.shareToWhatsApp(text, url),
      telegram: () => socialSharing.shareToTelegram(text, url),
      reddit: () => socialSharing.shareToReddit(url, title),
      copy: () => socialSharing.copyToClipboard(`${text} ${url}`),
      email: () => socialSharing.shareViaEmail(title, `${text}\n\n${url}`),
      sms: () => socialSharing.shareViaSMS(`${text} ${url}`),
      native: () => socialSharing.nativeShare({
        title,
        text,
        url
      })
    };
  },

  // Share pairings
  sharePairings: (tournament, round, pairings, url) => {
    const topMatchups = pairings.slice(0, 3).map(p => {
      // Handle different pairing data structures
      const player1Name = p.player1_name || (p.player1 && p.player1.name) || 'TBD';
      const player2Name = p.player2_name || (p.player2 && p.player2.name) || 'TBD';
      return `${player1Name} vs ${player2Name}`;
    }).join(', ');
    const text = `⚔️ Round ${round} Pairings in ${tournament.name}: ${topMatchups}. Follow live:`;
    const title = `${tournament.name} - Round ${round} Pairings`;

    return {
      twitter: () => socialSharing.shareToTwitter(text, url),
      facebook: () => socialSharing.shareToFacebook(url, text),
      linkedin: () => socialSharing.shareToLinkedIn(url, title, text),
      whatsapp: () => socialSharing.shareToWhatsApp(text, url),
      telegram: () => socialSharing.shareToTelegram(text, url),
      reddit: () => socialSharing.shareToReddit(url, title),
      copy: () => socialSharing.copyToClipboard(`${text} ${url}`),
      email: () => socialSharing.shareViaEmail(title, `${text}\n\n${url}`),
      sms: () => socialSharing.shareViaSMS(`${text} ${url}`),
      native: () => socialSharing.nativeShare({
        title,
        text,
        url
      })
    };
  }
};

// Social platform configurations
export const socialPlatforms = {
  twitter: {
    name: 'Twitter/X',
    icon: 'Twitter',
    color: '#1DA1F2',
    mobileOnly: false
  },
  facebook: {
    name: 'Facebook',
    icon: 'Facebook',
    color: '#1877F2',
    mobileOnly: false
  },
  linkedin: {
    name: 'LinkedIn',
    icon: 'Linkedin',
    color: '#0A66C2',
    mobileOnly: false
  },
  whatsapp: {
    name: 'WhatsApp',
    icon: 'MessageCircle',
    color: '#25D366',
    mobileOnly: true
  },
  telegram: {
    name: 'Telegram',
    icon: 'Send',
    color: '#0088CC',
    mobileOnly: false
  },
  reddit: {
    name: 'Reddit',
    icon: 'MessageSquare',
    color: '#FF4500',
    mobileOnly: false
  },
  copy: {
    name: 'Copy Link',
    icon: 'Copy',
    color: '#6B7280',
    mobileOnly: false
  },
  email: {
    name: 'Email',
    icon: 'Mail',
    color: '#EA4335',
    mobileOnly: false
  },
  sms: {
    name: 'SMS',
    icon: 'MessageSquare',
    color: '#34C759',
    mobileOnly: true
  },
  native: {
    name: 'Share',
    icon: 'Share2',
    color: '#8B5CF6',
    mobileOnly: true
  }
}; 