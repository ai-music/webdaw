import {
  Alignment,
  Button,
  Dialog,
  DialogBody,
  DialogFooter,
  Drawer,
  Menu,
  MenuDivider,
  MenuItem,
  Navbar,
  Popover,
  ProgressBar,
  TextArea,
} from '@blueprintjs/core';
import { Project } from './ui/Project';
import { Project as ProjectObj } from './core/Project';
import { createProject, loadProject, saveAsProject, saveProject } from './controller/Projects';
import { copy, cut, doDelete, paste, redo, undo } from './controller/Edit';
import { useEffect, useRef, useState } from 'react';
import { Engine } from './core/Engine';
import { BUFFER_SIZE, SAMPLE_RATE } from './core/Config';

import styles from './App.module.css';
import { AudioFileManager } from './core/AudioFileManager';
import { AudioFileManagerContext, EngineContext } from './ui/Context';

const audioContext = new AudioContext();

// MIT License
const LICENSE =
  'MIT License\n\nCopyright (c) 2023, 2024 Hans-Martin Will\n\nPermission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:\n\nThe above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.\n\nTHE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.';

/**
 * Open the application documentation in a new window.
 * @returns false
 */
function openDocumentation() {
  window.open('https://ai-music.github.io/webdaw-doc/', 'Documentation', 'width=800, height=600');
  return false;
}

function App() {
  const initialProject = new ProjectObj();
  const engine = useRef<Engine>(
    new Engine(audioContext, { bufferSize: BUFFER_SIZE, sampleRate: SAMPLE_RATE }, initialProject),
  );
  const audioFileManager = useRef<AudioFileManager>(new AudioFileManager());

  const [project, setProject] = useState(initialProject);
  const [tracks, setTracks] = useState(initialProject.tracks); // [TrackInterface]

  const [loading, setLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0); // [0, 1]
  const [confirmStopAudio, setConfirmStopAudio] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [mixerVisible, setMixerVisible] = useState(false);
  const [browserVisible, setBrowserVisible] = useState(true);
  const [showSettings, setShowSettings] = useState(false);

  const continueChangeProject = useRef<() => void>();

  useEffect(() => {
    initializeEngine(engine.current);
  }, []);

  function initializeEngine(engine: Engine) {
    setLoading(true);
    engine.initialize(() => {
      setLoading(false);
    });
  }

  function loadFiles(project: ProjectObj) {
    setLoading(true);
    project.loadFiles(
      engine.current.context,
      (project) => {
        engine.current.project = project;
        setProject(project);
        setTracks(project.tracks);
        setLoading(false);
      },
      (project, progress) => {
        setLoadingProgress(progress);
      },
    );
  }

  function changeProject(action: () => void) {
    continueChangeProject.current = action;
    if (engine.current.isPlaying) {
      setConfirmStopAudio(true);
    } else {
      action();
    }
  }

  return (
    <EngineContext.Provider value={engine.current}>
      <Dialog title="About" icon="info-sign" isOpen={showAbout}>
        <DialogBody>
          <img src="logo-192.png" alt="WebDAW Logo" width="96" style={{ float: 'right' }} />
          <p>Welcome to</p>
          <h1>WebDAW</h1>
          <p>Copyright &copy; 2023, 2024 Hans-Martin Will</p>
          <p>
            WebDAW is a digital audio workstation (DAW) that runs in the browser. It utilizes the{' '}
            <a href="https://www.w3.org/TR/webaudio/" target="_blank" rel="noreferrer">
              Web Audio API
            </a>{' '}
            for audio processing and the{' '}
            <a href="https://www.w3.org/TR/webmidi/" target="_blank" rel="noreferrer">
              Web MIDI API
            </a>{' '}
            for integration with MIDI instruments, which are supported in modern browsers (
            <a
              href="https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API#browser_compatibility"
              target="_blank"
              rel="noreferrer"
            >
              Audio
            </a>
            ,{' '}
            <a
              href="https://developer.mozilla.org/en-US/docs/Web/API/Web_MIDI_API#browser_compatibility"
              target="_blank"
              rel="noreferrer"
            >
              MIDI
            </a>
            ).
          </p>
          <TextArea fill={true} small={true} rows={6}>
            {LICENSE}
          </TextArea>
        </DialogBody>
        <DialogFooter
          actions={<Button intent="primary" text="Close" onClick={() => setShowAbout(false)} />}
        />
      </Dialog>
      <Dialog title="Loading" icon="cloud-download" isOpen={loading}>
        <DialogBody>
          <p>Please wait while the project is being loaded...</p>
          <ProgressBar value={loadingProgress} />
        </DialogBody>
      </Dialog>
      <Dialog title="Stop Audio" icon="warning-sign" isOpen={confirmStopAudio}>
        <DialogBody>
          <p>Proceeding with this action will stop all audio. Are you sure you want to continue?</p>
        </DialogBody>
        <DialogFooter
          actions={
            <>
              <Button
                intent="danger"
                text="Yes"
                onClick={() => {
                  setConfirmStopAudio(false);
                  continueChangeProject.current?.();
                }}
              />
              <Button intent="primary" text="No" onClick={() => setConfirmStopAudio(false)} />
            </>
          }
        />
      </Dialog>
      <div className={styles.app}>
        <Navbar style={{ flex: 0 }}>
          <Navbar.Group align={Alignment.LEFT}>
            <Navbar.Heading>WebDAW</Navbar.Heading>
            <Navbar.Divider />
            <Popover
              content={
                <Menu>
                  <MenuItem
                    icon="new-object"
                    text="New Project"
                    onClick={() => {
                      changeProject(() => {
                        engine.current.stop();
                        project.audioFiles.forEach((audioFile) => {
                          audioFileManager.current.unregisterAudioFile(audioFile);
                        });
                        createProject(audioFileManager.current, loadFiles);
                      });
                    }}
                  />
                  <MenuItem
                    icon="cloud-download"
                    text="Load..."
                    onClick={() => {
                      changeProject(() => {
                        engine.current.stop();
                        loadProject(audioFileManager.current);
                      });
                    }}
                  />
                  <MenuItem icon="cloud-upload" text="Save" onClick={saveProject} />
                  <MenuItem icon="duplicate" text="Save As..." onClick={saveAsProject} />
                </Menu>
              }
              placement="bottom"
            >
              <Button className="bp5-minimal" icon="projects" text="Project" />
            </Popover>
            <Popover
              content={
                <Menu>
                  <MenuItem icon="undo" text="Undo" onClick={undo} />
                  <MenuItem icon="redo" text="Redo" onClick={redo} />
                  <MenuDivider />
                  <MenuItem icon="cut" text="Cut" onClick={cut} />
                  <MenuItem icon="duplicate" text="Copy" onClick={copy} />
                  <MenuItem icon="insert" text="Paste" onClick={paste} />
                  <MenuItem icon="delete" text="Delete" onClick={doDelete} />
                </Menu>
              }
              placement="bottom"
            >
              <Button className="bp5-minimal" icon="edit" text="Edit" />
            </Popover>
            <Button className="bp5-minimal" icon="build" text="Tools" />
            <Popover
              content={
                <Menu>
                  <MenuItem
                    icon="cloud"
                    text={browserVisible ? 'Hide Library' : 'Show Library'}
                    onClick={() => setBrowserVisible(!browserVisible)}
                  />
                  <MenuItem
                    icon="settings"
                    text={mixerVisible ? 'Hide Mixer' : 'Show Mixer'}
                    onClick={() => setMixerVisible(!mixerVisible)}
                  />
                  <MenuItem
                    icon="cog"
                    text={showSettings ? 'Hide Settings' : 'Show Setting'}
                    onClick={() => setShowSettings(!showSettings)}
                  />
                </Menu>
              }
              placement="bottom"
            >
              <Button className="bp5-minimal" icon="control" text="View" />
            </Popover>
            <Popover
              content={
                <Menu>
                  <MenuItem
                    icon="manual"
                    text="Documentation"
                    href="#"
                    onClick={openDocumentation}
                  />
                  <MenuItem
                    icon="git-repo"
                    text="Github"
                    href="https://github.com/ai-music/webdaw"
                    target="_blank"
                  />
                  <MenuItem
                    icon="issue"
                    text="Report an issue"
                    href="https://github.com/ai-music/webdaw/issues"
                    target="_blank"
                  />
                  <MenuDivider />
                  <MenuItem icon="info-sign" text="About" onClick={() => setShowAbout(true)} />
                </Menu>
              }
              placement="bottom"
            >
              <Button className="bp5-minimal" icon="help" text="Help" />
            </Popover>
          </Navbar.Group>
        </Navbar>
        <Project
          project={project}
          tracks={tracks}
          setTracks={setTracks}
          mixerVisible={mixerVisible}
          setMixerVisible={setMixerVisible}
          browserVisible={browserVisible}
          setBrowserVisible={setBrowserVisible}
        />
      </div>
      <Drawer
        isOpen={showSettings}
        position="right"
        icon="cog"
        title="Settings"
        onClose={() => setShowSettings(false)}
      ></Drawer>
    </EngineContext.Provider>
  );
}

export default App;
