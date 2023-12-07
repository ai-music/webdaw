## Rendering Loop

Currently, the Web Audio API is only accessible from within the main thread in the browser. This means, that the main rendering loop that is submitting requests into this API will need to live in the main thread. However, `setTimeout` and `setInterval` are known to have rather significant variation in current browser implementations, which gets exacerbated by the unpredicatbility of all the other work performed by this thread.

However, both Web Audio and Web MIDI provide built-in high precision timers and the ability to schedule audio parameter changes and MIDI events using those timers. This leads to a design where the rendering loop is used to perform the following actions:

- scheduling of Web Audio parameter changes ahead of time via `AudioScheduledSourceNode.start(timestamp)`, `AudioParam.setValueAtTime(value, timestamp)` and variations thereof,
- scheduling of MIDI events ahead of time via `MIDIOutput.send(data, timestamp)`,
- creation and connection of nodes to the audio graph ahead of time in preparation of an upcoming playback, and
- disconnection of nodes in the audio graph after their signals have been silenced.

For high-quality playback, the last two bullets imply that we will usually apply some form of gain control prior to removing an audio node. This high-level design has been described in ["A tale of two clocks"](https://web.dev/articles/audio-scheduling).

The rendering loop will be triggered using the standard eventing functions `setTimeout` and `setInterval`. However, even though we are relying on high-precision timing, we may still observe timer drift due to the variabilities observed in event scheduling. For this reason, the event loop will monitor and control drift using the techniques in the YouTube video ["Precision Timer"](https://www.youtube.com/watch?v=x8PBWobv6NY).
