import {
  Alignment,
  Button,
  Dialog,
  DialogBody,
  DialogFooter,
  Menu,
  MenuDivider,
  MenuItem,
  Navbar,
  Popover,
  ProgressBar,
} from '@blueprintjs/core';
import { Project } from './ui/Project';
import { Project as ProjectObj } from './core/Project';
import { createProject, loadProject, saveAsProject, saveProject } from './controller/Projects';
import { copy, cut, doDelete, paste, redo, undo } from './controller/Edit';
import { useEffect, useState } from 'react';
import { Engine } from './core/Engine';
import { BUFFER_SIZE, SAMPLE_RATE } from './core/Config';

const audioContext = new AudioContext();

/**
 * Open the application documentation in a new window.
 * @returns false
 */
function openDocumentation() {
  window.open('https://ai-music.github.io/webdaw-doc/', 'Documentation', 'width=800, height=600');
  return false;
}

function App() {
  const [project, setProject] = useState(new ProjectObj());
  const [engine, setEngine] = useState(
    new Engine(audioContext, { bufferSize: BUFFER_SIZE, sampleRate: SAMPLE_RATE }),
  );
  const [loading, setLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0); // [0, 1]
  const [showDisclaimer, setShowDisclaimer] = useState(true);

  useEffect(() => {
    engine.project = project;
    setLoading(true);
    project.loadFiles(engine.context, (project) => {
      setLoading(false);
    });
  }, [engine, project]);

  return (
    <>
      <Dialog title="Attention" icon="warning-sign" isOpen={showDisclaimer}>
        <DialogBody>
          <p>
            This application is a work in progress. It is not feature complete. There are many bugs
            and missing features. At this point in time, do not expect any particular feature to be
            available or working.
          </p>
          <p>
            It is definitively not intended for use in a production environment. USE AT YOUR OWN
            RISK.
          </p>
          <p>
            That being said, if you are interested in actively contributing to this project, please
            get in touch via the <a href="https://github.com/ai-music/webdaw">Github repository</a>.
          </p>
        </DialogBody>
        <DialogFooter
          actions={
            <Button intent="danger" text="I Acknowledge" onClick={() => setShowDisclaimer(false)} />
          }
        />
      </Dialog>
      <Dialog title="Loading" icon="cloud-download" isOpen={loading}>
        <DialogBody>
          <p>Please wait while the project is being loaded...</p>
          <ProgressBar value={loadingProgress} />
        </DialogBody>
      </Dialog>
      <Navbar>
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
                    createProject(setProject);
                  }}
                />
                <MenuItem icon="cloud-download" text="Load..." onClick={loadProject} />
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
                <MenuItem icon="manual" text="Documentation" href="#" onClick={openDocumentation} />
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
              </Menu>
            }
            placement="bottom"
          >
            <Button className="bp5-minimal" icon="help" text="Help" />
          </Popover>
        </Navbar.Group>
      </Navbar>
      <Project engine={engine} project={project} />
    </>
  );
}

export default App;
