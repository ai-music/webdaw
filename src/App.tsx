import { Alignment, Button, Menu, MenuDivider, MenuItem, Navbar, Popover } from '@blueprintjs/core';
import { Project } from './ui/Project';
import { Project as ProjectObj } from './core/Project';
import { createProject, loadProject, saveAsProject, saveProject } from './controller/Projects';
import { copy, cut, doDelete, paste, redo, undo } from './controller/Edit';
import { useState } from 'react';

function App() {
  const [project, setProject] = useState(new ProjectObj('Untitled Project', [], []));

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
        </Navbar.Group>
      </Navbar>
      <Project project={project} />
    </>
  );
}

export default App;
