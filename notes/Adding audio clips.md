# Adding audio clips from the library

This note captures the process of adding an audio clip into an arrangement. From the user perspective,
audio clips are available in the library browser, which provides a hierarchical organization of audio
files available on a web server. The user can navigate the tree, select an audio file and then drag 
it into the arrangement view, where it becomes a new region on a track.

## Design Ideas

Audio clips are represented using intances of `AudioFile` objects. Once used within the arrangement,
`AudioFile` instances are maintained within the project. `AudioFile` instances hold a reference to
a web resource where the audio data is maintained (that is, a URL), and when the project is loaded into
the DAW, all those audio data files are downloaded to populate `AudioBuffer` objects associated with
the `AudioFile`. This is fundamentally an asynchronous process.

When the user selects an audio clip in the library, at that point, all the library browser is holding on
to is a name and a URL from where to load the data file. All other information, including length, number
of channels and the length of the audio clip, are only available once the audio file has been downloaded
and decoded into the `AudioBuffer` object.

When the user selects an audio clip in the library, the first thing to check is if the clip is already
referenced by the project as an `AudioFile` object that is being tracked. If this is the case, all other
required information is already available. For example, already during the drag operation to place the 
audio clip into the arrangement the correct length of the clil can be used to visualize the new region
to be created.

When the user is selecting and dragging an audio file that is not yet present in the project, we first
need to download and decode the audio file. We create an `AudioFile` instance whenever a clip is
selected in the browser that is not yet present in the project. Eventually, the browser will have 
a preview function, and it will make sense to begin fetching the audio file from the storage backend
as soon as a clip is selected. Unless that preview operation is available, that fetch operation may be 
delayed until the user begins dragging the clip into the arrangement.

The drag operation will begin without the audio data present. When the user begins to drag the 
region plaeholder, this placeholder will not represent the correct length of the region. Once
the download and decode of the audio file completes, the placeholder region can be updated to the
correct length.

In order to complete placing the new region into the arrangement, we have three options:
1. We will not allow dropping a region without downloaded audio file (and thus unknown length). In this
option the pointer will need to indicate that dragging cannot be completed until the data has been
downloaded and decoded.
2. We allow dropping the new region into the arrangement, but using a default length. The region will
also be effectively muted/deactivated until the audio buffer has been populated. One the audio buffer
is present, the region will become active, and its length can be adjusted.
3. We do not allow the user to begin dagging of clips into the arrangement until the audio file had 
been downloaded and decoded. Instead, the user needs to download the audio clip prior to placing it into
the arrangement. 

We will go with option 3. For this to work, we will add a download button to each audio clip in the 
browser, and we will maintain state to check of the file is available locally (effectively, we
can attach the AudioFile to each TreeNodeInfo instance). In addition, we will maintain a map/cache
of audio clips that have been downloaded into the browser, but that are not included in the project
yet.

This can be either an LRU type cache that maintains the last, say 20 files, or it is implemented using
an explicit clear operation invoked by the user.

## UX Logic

There's quite a bit of state transition logic that needs to be implemented in the UX:
- Drag'n'drop can only be initiated from a file that is local. Change the mouse pointer to identify tree nodes from where a drag'n'drop gesture can be initiated vs. where not (`grab` versus `default`).
- Adjust the size of the placeholder region to the real region size during the drag operation
- Drag'n'drop of audio regions can only end on an existing audio track or o create a new audio track. Adjust the pointer shape based on whether it is over a valid drop target location or not. That is, while dragging outside of arrangement areas, use `grabbing`. If over an invalid drop target, use `not-allowed`.
- If the target is a new track, create the new track and place the new region snapped to the minor timeline tick granularity.
- If the target is an existing track, we need to ensure that regions on the track do not overlap post the addition of the new region. A meaningful logic is as follows:
  - If the start of the new region overlaps with an existing region, then truncate the existing region to stop at the beginning of the new region.
  - Then truncate the new region up the the new start of any existing region.
  - We don't allow dropping a new region unless there is at least space for one minor timeline tick duration. This also needs to be indicated by the pointer shape