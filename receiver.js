const context = cast.framework.CastReceiverContext.getInstance();
const playerManager = context.getPlayerManager();
const queueManager = playerManager.getQueueManager();
const castDebugLogger = cast.debug.CastDebugLogger.getInstance();
const playbackConfig = new cast.framework.PlaybackConfig();

queueManager.setQueueStatusLimit(false);

playerManager.setMessageInterceptor(
  cast.framework.messages.MessageType.LOAD,
  request => {
    if (request.media.streamType === cast.framework.messages.StreamType.BUFFERED) {
        /* 
        If you get issues loading CMAF HLS streams, try this:
        media.hlsSegmentFormat = cast.framework.messages.HlsSegmentFormat.FMP4;
        media.hlsVideoSegmentFormat = cast.framework.messages.HlsVideoSegmentFormat.FMP4;

        Likewise for TS-based HLS:
        media.hlsSegmentFormat = cast.framework.messages.HlsSegmentFormat.TS;
        media.hlsVideoSegmentFormat = cast.framework.messages.HlsVideoSegmentFormat.TS;

        */
        playerManager.addSupportedMediaCommands(cast.framework.messages.Command.SEEK, true);
    }
    else if (request.media.streamType === cast.framework.messages.StreamType.LIVE) {
      playerManager.removeSupportedMediaCommands(cast.framework.messages.Command.SEEK, true);
    }

    return request;
  });

playerManager.addEventListener(
  cast.framework.events.EventType.PLAYER_LOAD_COMPLETE,
  mediaInformation => {
    const audioTracksManager = playerManager.getAudioTracksManager();
    const textTracksManager = playerManager.getTextTracksManager();

    selectPreferredTracks(mediaInformation.media, audioTracksManager, textTracksManager);
  });

function selectPreferredTracks(media, audioTracksManager, textTracksManager) {
  let customData = media.customData;

  if (customData.audioTracks) {
    selectPreferredAudioTrack(audioTracksManager, customData.audioTracks);
  }

  if (customData.subtitlesTracks) {
    selectPreferredTextTrack(textTracksManager, customData.subtitlesTracks);
  }
}

function selectPreferredAudioTrack(audioTracksManager, preferredAudioTracks) {
  const availableAudioTracks = audioTracksManager.getTracks();

  for (let i = 0; i < preferredAudioTracks.length; i++) {
    for (let j = 0; j < availableAudioTracks.length; j++) {
      if (preferredAudioTracks[i] === availableAudioTracks[j].language) {
        audioTracksManager.setActiveByLanguage(preferredAudioTracks[i]);
        return;
      }
    }
  }

  audioTracksManager.setActiveByLanguage('no');
}

function selectPreferredTextTrack(textTracksManager, preferredTextTracks) {
  const availableTextTracks = textTracksManager.getTracks();

  for (let i = 0; i < preferredTextTracks.length; i++) {
    for (let j = 0; j < availableTextTracks.length; j++) {
      if (preferredTextTracks[i] === availableTextTracks[j].language) {
        textTracksManager.setActiveByLanguage(preferredTextTracks[i]);
        return;
      }
    }
  }
}

context.start({ playbackConfig: playbackConfig });