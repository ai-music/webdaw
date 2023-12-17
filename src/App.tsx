import { Alignment, Button, Menu, MenuDivider, MenuItem, Navbar, Popover } from '@blueprintjs/core';
import { Project } from './ui/Project';
import { Project as ProjectObj } from './core/Project';
import { createProject, loadProject, saveAsProject, saveProject } from './controller/Projects';
import { copy, cut, doDelete, paste, redo, undo } from './controller/Edit';
import { useEffect, useState } from 'react';
import { Engine } from './core/Engine';
import { BUFFER_SIZE, SAMPLE_RATE } from './core/Config';

const audioContext = new AudioContext();

function App() {
  const [project, setProject] = useState(new ProjectObj());
  const [engine, setEngine] = useState(
    new Engine(audioContext, { bufferSize: BUFFER_SIZE, sampleRate: SAMPLE_RATE }),
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    engine.project = project;
    setLoading(true);
    project.loadFiles(engine.context, (project) => {
      setLoading(false);
    });
  }, [engine, project]);

  return (
    <>
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
                <MenuItem
                  icon="manual"
                  text="Documentation"
                  href="https://ai-music.github.io/webdaw-doc/"
                  target="_blank"
                />
                <MenuItem
                  icon="git-repo"
                  text="Github"
                  href="https://github.com/ai-music/webdaw"
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
