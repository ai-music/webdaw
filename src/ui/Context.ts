import { createContext } from 'react';
import { Engine } from '../core/Engine';
import { AudioFileManager } from '../core/AudioFileManager';

export const EngineContext = createContext(null as Engine | null);
export const AudioFileManagerContext = createContext(new AudioFileManager());
export const AudioContextContext = createContext(new AudioContext());
