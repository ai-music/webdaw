## Rendering Loop

Currently, the Web Audio API is only accessible from within the main thread in the browser. This means, that the main rendering loop that is submitting requests into this API will need to live in the main thread. However, `setTimeout` and `setInterval` are known to have rather significant variation in current browser implementations, which gets exacerbated by the unpredicatbility of all the other work performed by this thread.

However, both Web Audio and Web MIDI provide built-in high precision timers and the ability to schedule audio parameter changes and MIDI events using those timers. This leads to a design where the rendering loop is used to perform the following actions:

- scheduling of Web Audio parameter changes ahead of time via `AudioScheduledSourceNode.start(timestamp)`, `AudioParam.setValueAtTime(value, timestamp)` and variations thereof,
- scheduling of MIDI events ahead of time via `MIDIOutput.send(data, timestamp)`,
- creation and connection of nodes to the audio graph ahead of time in preparation of an upcoming playback, and
- disconnection of nodes in the audio graph after their signals have been silenced.

For high-quality playback, the last two bullets imply that we will usually apply some form of gain control prior to removing an audio node. This high-level design has been described in ["A tale of two clocks"](https://web.dev/articles/audio-scheduling).

The rendering loop will be triggered using the standard eventing functions `setTimeout` and `setInterval`. However, even though we are relying on high-precision timing, we may still observe timer drift due to the variabilities observed in event scheduling. For this reason, the event loop will monitor and control drift using the techniques in the YouTube video ["Precision Timer"](https://www.youtube.com/watch?v=x8PBWobv6NY).

## Handling Playback Loops

### Audio Clips

Audio clips are rendered using instances of `AudioBufferSourceNode`. These support looping of content, if necessary. Rendering is scheduled using the `start()` method, which supports providing a start offset and an overall playback duration.

Most simplistic case: 
1. We do not have looping at the level of individual regions
2. We do not allow modifications of loop boundaries or the loop playback mode while audio is being rendered.

Some ideas:
- for each track, we should keep track of audio nodes that are rendering, and for how long they are scheduled to do so
- there needs to be a clean-up process that removes audio nodes that are no longer rendering from further consideration
- when playback stops through manual intervention, we invoke `stop()` for each of the currently active audio nodes, before removing them from tracking.

The scheduler inside the audio engine will not schedule any events that are past the end locator of the project.
However, even though playback "stopped", the scheduler may still need to process further parameter or audio changes.
That will stop whenever playback is stopped manually.

Scheduling with loop enabled:

- We'll schedule all audio rendering such that it will stop at the loop end.
- When we render the loop start coming in from a repetition, we'll check for any region that intersects the loops start. Those regions need to be scheduled such that the starting offset corresponds to the beginning of the repetition.
- when the scheduling interval comes to the end of the loop: ensure that we do not schedule events past the end of the loop. and wrap around the scheduling interval to also include the beginning of the loop
- here a minimum loop length is needed to ensure that the wrap situation is properly handled.
- also the minimum length should be longer than the scheduling interval
- if we measure a delay on scheduling in the rendering loop beyond the minimum loop length, we should stop rendering

Behavior when playback parameters are changed during playback:

- end locator is moved:
- loop start locator is moved:
- loop end locator is moved:
- current playback position is moved:
- loop mode is changed (loop on/off):