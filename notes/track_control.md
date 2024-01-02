# Controlling tracks during playback

This design note outlines the approach to implement manual control of track parameters. Specifically, we are
concerned with:

- volume control
- pan control
- mute
- solo

Within this document, we are only considering controlling these parameters in the absence of track automation.
Track automation will be covered elsewhere. We begin by calling out a few important design considerations.

## Design Considerations

### Volume Control

In the context of mixing audio signals, it is common to represent volume using a logarithmic decibel (dB)
scale. In this scale, 6 dB correspond to a factor of 2 in amplitude of the signal. However, with a strictly
logarithmic scale, there would be no way to fully silence a signal. Therefore, a common approach in DAWs is
to extend the volume scale at the bottom using a "minus infinity" dB value, at which a signal is being fully 
supressed.

For WebDAW, we are using a range of [-60, 6] for volume levels, where -60 is treated as special case
corresponding to fully silencing the signal. With this convention, we have { -infinity } + (-60, 6] as
the effective range for volume values.

We implement volume control by mapping it to a [GainNode](https://webaudio.github.io/web-audio-api/#GainNode)
as provided by the Web Audio API. This nodes multiplies the incoming signal by a gain value. Because this 
multiplier lives in linear scale, the transformation from logarithmic dB scale to linear scale needs to 
happen somewhere upstream of providing the value to the `GainNode` instance that is implementing the
volume control of the track within the audio graph.

### Pan Control

At the user interface level, we are exposing panning values as a range [-50L, 50R]. In the initial(?)
implementation, we implement stereo panning of tracks by mapping the operation to a
[StereoPannerNode](https://webaudio.github.io/web-audio-api/#stereopannernode) as provided by the 
Web Audio API. As a consideration, the Web Audio API also provides a more sophisticated
[PannerNode](https://webaudio.github.io/web-audio-api/#PannerNode), which can be used to truly
position an audio signal in 3D space relative to the listener.

The `StereoPannerNode` interface exposes a `pan` parameter, which is in the range [-1, 1] representing
positions from fully left to fully right. The mapping of the range [-50L, 50R] to [-1, 1] needs to
happen somewhere upstream of providing the parameter value to the `StereoPannerNode` instance that is
implementing the pan control of the track within the audio graph.

### Track Mute

Muting a track is conceptually very simple: When a track is muted, it does not generate any audio
signal that is fed into downstream processing. Track Mute interacts with Track Solo, in that 
a muted track will be generating audio if it is selected as a solo track.

Within the audio graph, we have two possible apporaches to enable playback of a track. One option is to introduce 
an instance of [GainNode](https://webaudio.github.io/web-audio-api/#GainNode), where the `gain` value is
set to 0 or 1 depending on the mute status. Another option is to disconnect the upstream audio source on the track
from feeding into the channel controls (effect send pre/post fader, pan, volume fader). In addition, while a track
is muted, we will want to disable any scheduling of sound generation on this track. Should the track be unmuted,
we can schedule continuation of any sound that would have been started prior to the unmute of the track.

### Track Solo

Track Solo allows one or more selected tracks to play, while all other tracks are being surpressed/muted.
An important consideration of the Track Solo operation is that any downstream track (in particular any
effect return) of a solod track will also need to be enabled. Because Track Solo effectively overrides 
Track Mute, the track enablement logic needs to first check if any track is being solod, in which case
track enablement is determined by Track Solo. Otherwise, tracks will be enabled based on their mute
status.

## Design Sketch

### Track Enable/Disable

For muting and unmuting of tracks, we will separate status tracking at the engine level from the state
presented at the UX level. That is, individual tracks will have an internal `enabled`/`disabled` state,
which will determine if a track generates an output signal and if audio generation should be scheduled.

Upstream logic at the application level will translate the sole and mute status of tracks into enabling
of tracks at the engine level. When a track gets enabled, the next iteration on the scheduler should take care
of launching any audio generation that should be in progress.

When disabling a track, disconnecting the audio source and cancelling any on-going audio generation can be
immediate.

### Logic to translate Solo/Mute Settings into Track Enable/Disable

This should be a method implemented on the `Project` class. The logic is:

- If any of the tracks are soloed, then we are in solo mode. That is, we determine all tracks that have solo 
  selected, and we enable those and all downstream tracks. Any other track is being disabled.
- If no track is soloed, then the mute setting directly translates to the enabled setting of the track.

### Track Pan

Tracks capture pan values in a -1 to 1 range. The translation to [50L, 50R] happens at the UI level.

### Track Volume

Tracks capture volume levels in a dB scale. Translation to amplitude levels happens at the engine level.