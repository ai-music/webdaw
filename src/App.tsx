import { Alignment, Button, Navbar } from '@blueprintjs/core';
import { Project } from './ui/Project';

function App() {
  return (
    <>
      <Navbar>
        <Navbar.Group align={Alignment.LEFT}>
          <Navbar.Heading>WebDaw</Navbar.Heading>
          <Navbar.Divider />
          <Button className="bp5-minimal" icon="projects" text="Project" />
          <Button className="bp5-minimal" icon="edit" text="Edit" />
          <Button className="bp5-minimal" icon="build" text="Tools" />
        </Navbar.Group>
      </Navbar>
      <Project />
    </>
  );
}

export default App;
