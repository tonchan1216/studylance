/* eslint-disable require-jsdoc */
$(function() {
  // Peer object
  $('body').scrollTop();
  const peer = new Peer({
    key:   window.__SKYWAY_KEY__
  });

  let localStream;
  let v_room;
  let c_room;
  let user_num;
  const roomID = $('#room_id').html();

  peer.on('open', () => {
    $('#my-id').text(peer.id);
    // Get things started
    step1();
    connect_chat();
  });

  peer.on('error', err => {
    alert(err.message);
    // Return to step 2 if error occurs
    step2();
  });

  $('#make-call').on('click', e => {
    e.preventDefault();
    v_room = peer.joinRoom('sfu_video_' + roomID, {mode: 'sfu', stream: localStream});
    step3(v_room);
  });

  $('#end-call').on('click', () => {
    v_room.close();
    $('#their-videos').empty();
    step2();
  });

  $('.go-home').on('click', () => {
    window.location.href = '/';
  });

  $(window).on('beforeunload', function(e) {
    $.ajax({
      url: '/room/' + roomID,
      type: 'DELETE',
    })
    .done(function(result) {
      console.log(result);
    })
    .fail(function(err) {
      console.log(err);
    });
  });


  // set up audio and video input selectors
  const audioSelect = $('#audioSource');
  const videoSelect = $('#videoSource');
  const selectors = [audioSelect, videoSelect];

  navigator.mediaDevices.enumerateDevices()
    .then(deviceInfos => {
      const values = selectors.map(select => select.val() || '');
      selectors.forEach(select => {
        const children = select.children(':first');
        while (children.length) {
          select.remove(children);
        }
      });

      for (let i = 0; i !== deviceInfos.length; ++i) {
        const deviceInfo = deviceInfos[i];
        const option = $('<option>').val(deviceInfo.deviceId);

        if (deviceInfo.kind === 'audioinput') {
          option.text(deviceInfo.label ||
            'Microphone ' + (audioSelect.children().length + 1));
          audioSelect.append(option);
        } else if (deviceInfo.kind === 'videoinput') {
          option.text(deviceInfo.label ||
            'Camera ' + (videoSelect.children().length + 1));
          videoSelect.append(option);
        }
      }

      selectors.forEach((select, selectorIndex) => {
        if (Array.prototype.slice.call(select.children()).some(n => {
          return n.value === values[selectorIndex];
        })) {
          select.val(values[selectorIndex]);
        }
      });

      videoSelect.on('change', step1);
      audioSelect.on('change', step1);
    });

  $('#send').on('submit', e => {
    e.preventDefault();
    // For each active connection, send the message.
    const msg = $('#text').val();
    if (msg == "") {
      return false;
    }
    c_room.send(msg);
    $('#chat_box').append('<p class="you"><span class="text">' + msg + '</span></p>');
    $('#text').val('');
    $('#text').focus();
    $('#chat_box').scrollTop($('#chat_box').get(0).scrollHeight);
  });

  function connect_chat() {
    c_room = peer.joinRoom('sfu_text_' + roomID, {mode: 'sfu'});

    c_room.on('open', function() {
      $('#text').focus();

      c_room.getLog();
      c_room.once('log', logs => {
        for (let i = 0; i < logs.length; i++) {
          const log = JSON.parse(logs[i]);

          switch (log.messageType) {
            case 'ROOM_DATA':
              $('#chat_box').append('<p class="peer"><span class="user" style="background-color: ' + log.message.src.toRGBCode() + '">' + log.message.src[0] + '</span><span class="text">' + log.message.data + '</span></p>');
              break;
          }
        }
      });

      c_room.on('data', message => {
        $('#chat_box').append('<p class="peer"><span class="user" style="background-color: ' + message.src.toRGBCode() + '">' + message.src[0] + '</span><span class="text">' + message.data + '</span></p>');
        $('#chat_box').scrollTop($('#chat_box').get(0).scrollHeight);
      });

      c_room.on('peerJoin', peerId => {
        $('#chat_box').append('<p class="notice"><span>' + peerId + ' が入室しました</span></p>');
        $('#chat_box').scrollTop($('#chat_box').get(0).scrollHeight);
      });

      c_room.on('peerLeave', peerId => {
        $('#chat_box').append('<p class="notice"><span>' + peerId + ' が退室しました</span></p>');
        $('#chat_box').scrollTop($('#chat_box').get(0).scrollHeight);
      });
    });
  }

  function step1() {
    //connecting chat room
    // 

    // Get video stream
    const videoSource = $('#videoSource').val();
    const constraints = {
      audio: false,
      video: {
        width: 320,
        height: 240,
        deviceId: videoSource ? {exact: videoSource} : undefined
      },
    };

    navigator.mediaDevices.getUserMedia(constraints).then(stream => {
      $('#my-video').get(0).srcObject = stream;
      localStream = stream;

      if (v_room) {
        v_room.replaceStream(localStream);
        return;
      }
    
      step2();
    }).catch(err => {
      $('#step1-error').show();
      console.error(err);
    });
  }

  function step2() {
    $('#step1, .step3').hide();
    $('.step2').show();
  }

  function step3(room) {
    // Wait for stream on the call, then set peer video display
    v_room.on('stream', stream => {
      const peerId = stream.peerId;
      const color = peerId.toRGBCode();
      // console.log('get_stream: '+stream.id);
      const id = 'video_' + peerId + '_' + stream.id.replace('{', '').replace('}', '');

      const video_frame = '<div class="col-sm-6 col-xs-6 mbr-gallery-item video_' + peerId + '" id="' + id + '">' + 
      '<figcaption class="mbr-figure__caption mbr-figure__caption--std-grid">' +
      '<div class="mbr-caption-background" style="background-color: ' + color + ';"></div>' + 
      '<small class="mbr-figure__caption-small">' + stream.peerId + '</small></figcaption>' + 
      '<video class="remoteVideos" muted="true" autoplay playsinline></div>';

      $('#their-videos').append(video_frame);
      const el = $('#' + id).find('video').get(0);
      el.srcObject = stream;

      setTimeout(function(){
        isPromise = el.play();
      },1000);
    });

    v_room.on('removeStream', stream => {
      const peerId = stream.peerId;
      const id = 'video_' + peerId + '_' + stream.id.replace('{', '').replace('}', '');
      $('#' + id).remove();
      // console.log('remove_stream: ' + stream.id);
    });

    // UI stuff
    v_room.on('close', step2);

    v_room.on('peerJoin', peerId => {
      setTimeout(function(){
        step1();
      },1000);
      // console.log('peerJoin: ' + peerId);
    });
    v_room.on('peerLeave', peerId => {
      $('.video_' + peerId).remove();
      // console.log('peerLeave: ' + peerId);
    });
    $('#step1, .step2').hide();
    $('.step3').show();
  }

});