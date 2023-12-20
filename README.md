![WebDaw Icon](./public/logo-192.png)

# WebDAW

WebDAW is a portable music composition and production environment that runs in your browser. It is based on the [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API) and the [Web MIDI API](https://developer.mozilla.org/en-US/docs/Web/API/Web_MIDI_API) to provide a performant and feature rich foundation for music creation. Our intention is to use [Web Audio Modules 2.0](https://doi.org/10.1145/3487553.3524225) as plugin architecture to enable easy integration of synthesizers, effects and other relevant components.

Currently, WebDAW a pure client-side application, and  functional builds are
accessible via the [GitHub Pages for this project](https://ai-music.github.io/webdaw/). The project is referencing and incorporating the [sample-pi](https://github.com/alex-esc/sample-pi) repository to include some initial audio content.

## Getting Started

To invoke the application, simply navigate to [https://ai-music.github.io/webdaw/](https://ai-music.github.io/webdaw/).

End-user documentation is accesible from the _Help_ menu inside the application.

## Similar Projects

Here is a list of similar projects that I have come across. This list is likely incomplete.

- [OpenDAW](https://github.com/pverrecchia/OpenDAW)
- [WebDAW](https://github.com/jakejarrett/WebDAW) (fork of OpenDAW)
- [WebDAW](https://www.webdaw.net/)
- [WebDAW modules](https://github.com/abudaan/webdaw-modules)
- [Wam-openstudio](https://github.com/TER-M1/wam-openstudio)
- [Efflux Tracker](https://github.com/igorski/efflux-tracker)
- [TuneFlow](https://github.com/tuneflow/tuneflow)
- [EchoInMirror](https://github.com/EchoInMirror/EIM)
- [beets](https://github.com/brandongregoryscott/beets)
- [butterDAWg](https://github.com/Jaybee18/butterDAWg)
- [dawesome](https://github.com/nbennett320/dawesome)
- [REAW](https://github.com/notakamihe/REAW)




## For Developers

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app). In addition, the build system is incorporating [react-gh-pages](https://github.com/gitname/react-gh-pages) for simple deployment via GitHub Pages.

In the project directory, you can run the following commands:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.\
You will also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

### `npm run deploy`

Deploys the app into the GitHub Pages associated with this Github repository. If you want to create a fork of the
application on your own, please follow [these instructions to configure GitHub Pages appropriately](https://github.com/gitname/react-gh-pages). In particular, you will need to update `homepage` in `package.json` to point to your own account.

### `npm run docs`

Creates HTML _developer_ documentation for the project in the `./docs` directory using the typedoc tool. The `typedoc.json` file serves as configuration file for this process.

__Note:__ End-user documentation is maintained in the [webdaw-doc](https://github.com/ai-music/webdaw-doc) repository and served from the corresponding [GitHub Pages](https://ai-music.github.io/webdaw-doc).
