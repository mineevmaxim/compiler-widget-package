// src/components/RunContainer.tsx
import React from 'react';
import cls from './RunContainer.module.scss';
import { Play, Save, Square } from 'lucide-react';

interface RunContainerProps {
    run: () => void,
    stop: () => void,
    save: () => void,
}

export const RunContainer: React.FC<RunContainerProps> = (props: RunContainerProps) => {
    return (
        <div className={cls.runContainer}>
            <button className={cls.runButton} onClick={props.run}>
                <Play className={cls.startIcon}/>
                <p className={cls.runText}>Run</p>
            </button>
            <button className={cls.stopButton} onClick={props.stop}>
                <Square className={cls.stopIcon}/>
                <p className={cls.runText}>Stop</p>
            </button>
            <button className={cls.saveButton} onClick={props.save}>
                <Save className={cls.saveIcon}/>
                <p className={cls.runText}>Save</p>
            </button>
        </div>
    );
};
