import React from 'react';
import Icon from '../AppIcon';
import { motion } from 'framer-motion';

const AudioRecorder = ({ isRecording, onStart, onStop }) => {
    return (
        <div className="flex flex-col items-center justify-center">
            <motion.button
                type="button"
                onMouseDown={onStart}
                onMouseUp={onStop}
                onTouchStart={onStart}
                onTouchEnd={onStop}
                className="w-24 h-24 rounded-full bg-primary flex items-center justify-center text-white shadow-glow focus:outline-none"
                whileTap={{ scale: 1.1 }}
            >
                <Icon name={isRecording ? "Square" : "Mic"} size={48} />
            </motion.button>
            <p className="text-muted-foreground mt-4 text-sm font-medium">
                {isRecording ? 'Recording...' : 'Hold to Speak'}
            </p>
        </div>
    );
};

export default AudioRecorder;