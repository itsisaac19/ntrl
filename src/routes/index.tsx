import { $, component$, useSignal, useVisibleTask$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";

export default component$(() => {
  const videoRef = useSignal<HTMLVideoElement>();
  const video = videoRef.value;

  const canvasRef = useSignal<HTMLCanvasElement>();
  const canvas = canvasRef.value;

  const stripRef = useSignal<HTMLElement>();
  const strip = stripRef.value;

  const constraints = {
    audio: false,
    video: {
      facingMode: 'user'
    }
  }

  const getVideo = $(() => {
    if (!video) return
    
    console.log('hello?')
    
    navigator.mediaDevices.getUserMedia(constraints)
      .then(localMediaStream => {
        console.log(localMediaStream);
      
  //  DEPRECIATION : 
  //       The following has been depreceated by major browsers as of Chrome and Firefox.
  //       video.src = window.URL.createObjectURL(localMediaStream);
  //       Please refer to these:
  //       Deprecated  - https://developer.mozilla.org/en-US/docs/Web/API/URL/createObjectURL
  //       Newer Syntax - https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/srcObject
        console.dir(video);
        if ('srcObject' in video) {
          video.srcObject = localMediaStream;
        } else {
          //video.src = URL.createObjectURL(localMediaStream);
        }
        // video.src = window.URL.createObjectURL(localMediaStream);
        video.play();
      })
      .catch(err => {
        console.error(`OH NO!!!!`, err);
      });
  })
  
  const paintToCanvas = $(() => {
    if (!video || !canvas) return;

    const width = video.videoWidth;
    const height = video.videoHeight;
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
  
    return setInterval(() => {
      ctx.drawImage(video, 0, 0, width, height);
      // take the pixels out
      // let pixels = ctx.getImageData(0, 0, width, height);
      // mess with them
      // pixels = redEffect(pixels);
  
      // pixels = rgbSplit(pixels);
      // ctx.globalAlpha = 0.8;
  
      // pixels = greenScreen(pixels);
      // put them back
      // ctx.putImageData(pixels, 0, 0);
    }, 16);
  })
  
  const takePhoto = $(() => {
    if (!canvas || !strip) return;
  
    // take the data out of the canvas
    const data = canvas.toDataURL('image/jpeg');
    const link = document.createElement('a');
    link.href = data;
    link.setAttribute('download', 'handsome');
    link.innerHTML = `<img src="${data}" alt="Handsome Man" />`;
    strip.insertBefore(link, strip.firstChild);
  })

  useVisibleTask$(() => {
    if (video) {
      // Fix for iOS Safari from https://leemartin.dev/hello-webrtc-on-safari-11-e8bcb5335295
      video.setAttribute('autoplay', '');
      video.setAttribute('muted', '');
      video.setAttribute('playsinline', '')

      getVideo();

      video.addEventListener('canplay', paintToCanvas);
    }
  })

  return (
    <>
      <div class="controls">
        <button onClick$={takePhoto}>Take Photo</button>
      </div>

      <canvas ref={canvasRef} class="photo"></canvas>
      <video ref={videoRef} class="player"></video>
      <div ref={stripRef} class="strip"></div>
    </>
  );
});

export const head: DocumentHead = {
  title: "Welcome to Qwik",
  meta: [
    {
      name: "description",
      content: "Qwik site description",
    },
  ],
};
