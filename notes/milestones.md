# Milestones for Developing WebDAW

This document is an outline of how WebDAW may evolve towards a usable music production environment. Milestone 1 may appear substantially overloaded with features, but it very much provides the foundation for all the pieces to follow in later milestones.

## Milestone 1: Multi-Track Sample Player

- [X] Arrangement view showing tracks over arrangement timeline
- [X] Ability to zoom and pan arrangement view
- [X] Ability to play back arrangement incl. looped playback
- [ ] Static volume and panning for each track
- [ ] Ability to control mute and solo for each track
- [ ] Ability to rename each track
- [ ] Ability to add and remove audio tracks
- [ ] Ability to change order of audio tracks (drag and drop)
- [ ] Ability to place regions referencing audio files to a track
- [ ] Ability to move regions within their containing track
- [ ] Ability to move regions from one audio track to another
- [ ] Ability to cut a region into two
- [ ] Ability to combine two or more consecutive regions on the same track into a single one
- [ ] Ability to clone a region and place it within the arrangement
- [ ] Ability to subset region within audio file by selecting start offset and size
- [ ] Ability remove audio regions from audio tracks
- [ ] Ability to mute/unmute individual audio regions
- [ ] Ability to rename and color individual regions

## Milestone 2: Adding Project Management

- [ ] Integration of Google Drive as workspace
- [ ] Ability to import audio files into workspace
- [ ] Ability to organize projects inside workspace
- [ ] Versioning/history of projects
- [ ] Ability to share projects

## Milestone 3: Adding Sample Processing, Effects and Automation

- [ ] Sample viewer for audio files and audio regions
- [ ] Sample warping: adjust BPM
- [ ] Sample warping: adjust pitch
- [ ] Sample warping: quantize and Groove quantize
- [ ] Ability to loop individual audio regions
- [ ] Library of audio effects
- [ ] Effect racks on each track
- [ ] EQ effect
- [ ] compressor effect
- [ ] delay affect
- [ ] reverb effect
- [ ] Automation curves that can be associated with instrument, effect or track parameters (volume, pan)
- [ ] Automation support for changing BPM
- [ ] Automation support for changing the time signature at the boundaries of measures

## Milestone 4: Adding Instruments

- [ ] Piano Roll
- [ ] Drum Grid
- [ ] Subtractive Synth
- [ ] Multi-Sample Player
- [ ] Quantization
- [ ] Groove Quantization

## Milestone 5: Adding MIDI Input and Output

- [ ] Adding support for MIDI tracks
- [ ] Ability to select MIDI input and MIDI output devices

## Milestone 6: Adding recording of audio and MIDI

- [ ] MIDI input can be used to trigger instruments
- [ ] MIDI input can be recorded into a MIDI or instrument track
- [ ] Audio can be recorded into a new audio region and associated audio files
- [ ] Support for count-in 
- [ ] Support for looping and cpaturing of multiple recordings
- [ ] Support for comping of multiple recordings within a region into a single clip
- [ ] Punch in and punch out

## Milestone 7: Web Audio Module Support

- [ ] Library of effects and instruments
- [ ] Web Audio Module Effects
- [ ] Web Audio Module Instruments
- [ ] Web Audio Module MIDI processors
- [ ] Latency compensation for tracks

## Milestone 8: Adding Mixer View

- [ ] Mixer view
- [ ] sidechain support
- [ ] Group tracks
- [ ] Routing of track outputs
- [ ] Return tracks

## Milestone 9: Clip Launcher/Song Structure View