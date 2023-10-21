import { $, component$, useSignal, useStore, useVisibleTask$ } from "@builder.io/qwik";
import { server$, useLocation, type DocumentHead, type RequestHandler } from "@builder.io/qwik-city";

import exifr from 'exifr';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import duration from 'dayjs/plugin/duration';
import dayOfYear from 'dayjs/plugin/dayOfYear';
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(customParseFormat)
dayjs.extend(duration)
dayjs.extend(dayOfYear);

import { Storage } from '@google-cloud/storage';

const credentials = {
  "type": "service_account",
  "project_id": "constant-crow-377602",
  "private_key_id": "3afac1223bd1108f05e0a7937806279c821f16d0",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDdwx3QV7IWJ+hx\nyNS0gWIS3yDn5nYEzhC9m5hapKtyB8kay7Z4FZDfdTp9IJ5sa2zpJeKRFa6d+tY1\n7mGlUN8TI8ltm8my5JT8XpVltKoMSg++hZOTDEXW9LOAxCqOwqIz8NHh+m8JZaBK\n5lwdjiHQH578Wl4QecinUFOF5iuO/70ki4GH25Bh5ZcZZCp27l2r7FvwhszTV7oe\nkEr8+FCUjz1ODZ3bZUjBVAv1t47SaPd5rcvXHdYjgZwfkQ19ju4idj4WgkvWo/3O\n8qeSJ9jrdxLZ4SCWcD8UjKFfEDm6Rxy9KIOvuzSkJSS/IyOHHN1ekBKpp5mS8i+7\nJl9Onn2bAgMBAAECggEAMCtvQO+jl8twYrLgfRrzjizYbXbyYMXP/hebpujI8tp9\nFOx2BKyOjPNeUoqwztUg0Z3wklo21UsEl69hl3KzGem2ma/yxoB/WjhDVFXDcCrw\nM465SQIr826wxQIXSm49pHGlbWQkFVL1V/+kt6jFcHtF4gPRFdwWOT2p/tZJ1OQR\njqHs/PMAhMe/KBY0mY8r7EgqQV0eZQwTV7CpN1mGLDZ683px/h/N6c3hawCCavlz\n+xgdyYkXtCspaLDqABbCGqigmDjn7WXtLrtzLZBb3aWanFjbEk+vPKoAewbGooiG\nDsF7irUZxxSyXsvbfyHLmevIT/edU7Tdq4AfLV6EtQKBgQDyzvOeV9p6bKEbuvqI\n2N6/CR2VcGwsoPc3YWSsPIL4Gk1VDb3KeirFC84AVQkp+4C7OG2k3he0f7+Dqkhb\ncitnTVfAXIRtQE54Qo7BUiUkHctE1cRmSWImSymkjUQZgjjBUWIEu89A/jF5iqSC\npHv+AwWNmN5vMOosK95rv8NfDwKBgQDpz3KmqtIdPHeeSURQE6hHi0sHm6yuRk/Z\n6rHgHt2swGqL3PvBNN4dtyC5WPvEoubsY/4OnJxCi1SV25NeCS5iAR6vM3fftvec\npR1hPveFn9UbiJha0ztwzJnzXmvlEQ5/1PxE9Buibsw7gu7tp+GJMjVyLb/DmBgn\n83y86D84tQKBgFkgDdx5cwCtDxYWtA+3S0vkFK/d7FcVXqk9Xq66J3jabrhhquC/\npyNdCeilTg/S+ZW/SL/Tpe/jVHEH+DdY2QW6JhO94f4YNLV/+NaNSITRSuOhc833\n8ccMn+R+1hhm7F5JeSkzpwe8RnzOn0Q1DC5Y/ZjUHBHEarB8CdCTOyuRAoGBAOL/\n8YQ3HMAd0NTwtU45h4vOhQ3h6olY4nXkEsZRsU7jkY4xAovWVD/tZ+wLpISI1EJ1\n4lc1XdCNjZXhFPabW1jzVWMsSRn+ffCrrhaYF6C4SSLuP10O8ArX2jAaYA6JvNYH\nZtVbWukdQVQWDvrVn3agNJuiJygzJmDDWTvfEGJxAoGABf4fSuHtoLp3xBgATVpj\n4KeUexduGC6X733EWyLxPilaF0FRnnOBV7gw8PDMdPd32nRUD1pcG9jPfRQOCJ0d\nt/r61I6EvQGSyVHb3H1/VYAPt6IgJk1SHpZnPj1xzC97UjMtr9N5cFKVeEjs+kRW\n1Jk/7gqdhwxT9CfX+N6Bjvo=\n-----END PRIVATE KEY-----\n",
  "client_email": "storage@constant-crow-377602.iam.gserviceaccount.com",
  "client_id": "112682772146194746875",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/storage%40constant-crow-377602.iam.gserviceaccount.com",
  "universe_domain": "googleapis.com"
}

import { routeLoader$ } from '@builder.io/qwik-city';
import { createServerClient } from 'supabase-auth-helpers-qwik';
import type { Database } from "~/supabase";
import { createClient } from "@supabase/supabase-js";

type Row = Database['public']['Tables']['journals']['Row'];

export const useServerSupabaseClient = routeLoader$(async (requestEvent) => {
  const supabaseClient = createServerClient(
    requestEvent.env.get('DB_PUBLIC_URL')!,
    requestEvent.env.get('DB_PUBLIC_KEY')!,
    requestEvent
  );

  const cookie = requestEvent.cookie;
  const accessToken = cookie.get('my-access-token')?.value;
  const refreshToken = cookie.get('my-refresh-token')?.value;

  if (accessToken && refreshToken) {
    supabaseClient.auth.setSession({
      access_token: accessToken, 
      refresh_token: refreshToken
    })

    console.log('setting auth tokens on server client.')
  }


  const {data: auth } = await supabaseClient.auth.getSession();
  const userId = auth.session?.user.id;
  const userEmail = auth.session?.user.email;

  if (!userId || !userEmail) {
    throw requestEvent.redirect(302, '/auth');
  }

  const { data: userJournals } = await supabaseClient.from('journals').select('*').eq('user_email', userEmail);

  return { journals: userJournals as Row[], userId: userId, auth: auth };
});



import { questionBank } from '../components/questions.js';
const questions = questionBank as { [key: string]: string };

const storage = new Storage({
  projectId: 'constant-crow-377602',
  credentials: credentials,
});

let overrideWindow = false;

type BodyType = {
  'userid': string;
} & {
  [key: string]: {
    [key: string]: File
  };
};

export const onPost: RequestHandler = async (req) => {
  const body = await req.parseBody() as BodyType;
  console.log(body)

  const { userid, ...fileObject } = body;
  const fileKey = Object.keys(fileObject)[0];
  const fileWrapper = body[fileKey];
  const fileTypeKey = Object.keys(fileWrapper)[0];

  const file = fileWrapper[fileTypeKey];
  const prefix = userid;
  const fileName = `${prefix}/${file.name}`;
  
  const destinationStream = storage.bucket('natural-bucket').file(fileName).createWriteStream({
    metadata: {
      contentType: file.type
    }
  })

  const streamOperation: Promise<string> = new Promise((resolve, reject) => {
    destinationStream.on('error', (err) => {
      console.error(`Error uploading file: ${err}`);
      reject(err)
    });
  
    destinationStream.on('finish', () => {
      console.log(`File uploaded to ${fileName}`);
      resolve(fileName)
    });
  });

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  destinationStream.end(buffer)

  /* const operationFailCallback = (err: any) => {
    req.error(500, `Error uploading file: ${err}`)
  } */

  const operationResult = await streamOperation;
  req.json(200, { fileName: operationResult })

  return;
}

const localClient = createClient(import.meta.env.PUBLIC_DB_URL, import.meta.env.PUBLIC_DB_KEY);

export default component$(() => {
  const addJournalToDatabase = $(async (journalData: Partial<Row>) => {
    const { data, error } = await localClient.from('journals').insert(journalData).select();

    if (error) {
      return null;
    }

    return data[0] as Row;
  })

  const updateJournalToDatabase = $(async (journalData: Partial<Row>) => {
    const { data, error } = await localClient.from('journals').update(journalData).eq('uuid', journalData.uuid).select();

    if (error) {
      return null;
    }

    return data[0] as Row;
  })

  const serverClient = useServerSupabaseClient();
  const { journals, userId, auth } = serverClient.value;
  //console.log('Server Loader:', {journals, userId, auth});

  const location = useLocation();
  const searchParams = location.url.searchParams;
  let pageRoute = searchParams.get('page');
  const possibleRoutes = [
    'viewing-daily-prompt', 
    'writing-answer',
    'viewing-journal-published',
    'viewing-journal-draft'
  ];
  if (!pageRoute || !possibleRoutes.includes(pageRoute)) {
    pageRoute = 'viewing-daily-prompt';
  }

  if (searchParams.get('overridewindow')) {
    overrideWindow = true;
  }

  const customSPA = useStore({
    route: pageRoute,
  })

  const routeSPA = $(async (pageName: string, promises: Promise<any>[]) => {
    const biggestWrap = document.querySelector('.biggest-wrapper') as HTMLElement;
    biggestWrap.classList.add('fadeout');

    location.url.searchParams.set('page', pageName);
    window.history.pushState({}, '', location.url);

    const minimumTimeout = new Promise((resolve) => setTimeout(resolve, 500))

    await Promise.all([...promises, minimumTimeout]);
    customSPA.route = pageName;
    biggestWrap.classList.remove('fadeout');

    return pageName;
  })

  const popStateHandler = $((ev: PopStateEvent) => {
    console.log({ev});
  
    const searchParams = new URLSearchParams(window.location.search);
    const pageName = searchParams.get('page');
    if (!pageName) {
      console.error('popstate fired but no route.')
      return
    }
    console.log({pageName});
    customSPA.route = pageName;
  })

  const currentJournalData = useStore<Partial<Row>>({})

  const answerTextTypeHandler = $((e: any, targetElement: HTMLDivElement) => {
    /* const event = e as KeyboardEvent;
    console.log({event, targetElement}); */
    const contentEditableDiv = targetElement as HTMLDivElement;

    if (!contentEditableDiv.textContent?.trim()) {
      contentEditableDiv.innerHTML = '';
    } 

    console.log(contentEditableDiv.textContent)
    currentJournalData.answer = contentEditableDiv.textContent;
  })

  const takePhotoLabel = useSignal<'Retake Photo' | 'Take Photo'>('Take Photo');

  const getImageDimensions = $(async (file: File) => {
    return new Promise<{ width: number, height: number }>((resolve, reject) => {
      const fileReader = new FileReader();
  
      fileReader.onload = function(e) {
        const image = new Image();
        if (!e.target) {
          return 
        }
        image.src = e.target.result as string;
  
        image.onload = function () {
          //@ts-ignore
          const width = this.width;
          //@ts-ignore
          const height = this.height;
  
          resolve({ width, height });
        };
  
        image.onerror = function() {
          reject(new Error('Failed to load image.'));
        };
      };
  
      fileReader.readAsDataURL(file);
    });
  });

  const photoInputHandler = server$(async (e: any, targetElement: HTMLInputElement) => {
    const event = e as Event;
    console.log({event, targetElement});

    if (targetElement.files) {
      const photo = targetElement.files[0];
      const dimensions = await getImageDimensions(photo);
      console.log({dimensions})

      const photoBox = document.querySelector('.photo-take-box') as HTMLElement;
      photoBox.classList.add('preview-photo');

      const previewImage = photoBox.querySelector('img.photo-preview') as HTMLImageElement;

      setTimeout(() => {
        const isVertical = dimensions.height > dimensions.width;
        currentJournalData.vertical = isVertical;
      }, 100);

      currentJournalData.image_url = `https://i.ibb.co/60PTxt1/loading.gif`;
      previewImage.classList.add('loading');

      const meta = await exifr.parse(photo);
      const metaWrapper = document.querySelector('.photo-preview-meta') as HTMLElement;
      metaWrapper.innerHTML = '';
      metaWrapper.classList.remove('show-meta')

      const metaItems = []

      if (meta?.LensModel) {
        metaWrapper.classList.add('show-meta')
        const metaItem = Object.assign(document.createElement('span'), {
          innerHTML: meta.LensModel
        })
        metaItems.push(metaItem)
      }

      if (meta?.ExifImageWidth && meta?.ExifImageHeight) {
        metaWrapper.classList.add('show-meta')
        const metaItem = Object.assign(document.createElement('span'), {
          innerHTML: `${meta.ExifImageWidth}x${meta.ExifImageHeight}`
        })
        metaItems.push(metaItem)
      }

      metaItems.forEach(item => {
        metaWrapper.appendChild(item);
      })

      const formData = new FormData();
      formData.append('userid', userId)
      formData.append(photo.name, photo)

      const uploadResponse = await fetch('./', {
        method: 'POST',
        body: formData
      })

      const uploadData = await uploadResponse.json();
      const { fileName } = uploadData;
      previewImage.classList.remove('loading');
      currentJournalData.image_url = `https://storage.googleapis.com/natural-bucket/${fileName}`;

      takePhotoLabel.value = 'Retake Photo';

      updateJournalToDatabase(currentJournalData);
    }
  })


  const lowerBoundTime = useSignal('')
  const upperBoundTime = useSignal('')

  const getSunriseSunset = $(async () => {
    const roughLocationRequest = await fetch(`https://ipapi.co/json/`);
    const roughLocation = await roughLocationRequest.json();
    const { latitude: lat, longitude: lon, timezone } = roughLocation;

    const todayFormat = dayjs().format('YYYY-MM-DD')
    const sunriseSunsetRequest = await fetch(`https://api.sunrise-sunset.org/json?lat=${lat}&lng=${lon}&formatted=0&date=${todayFormat}`)
    const sunriseSunsetData = await sunriseSunsetRequest.json();
    const utcTimes = sunriseSunsetData.results;

    const userTimeZone = timezone;

    // Convert UTC times to the user's time zone
    const convertedTimes: {[timeProperty: string]: string} = {
      userTimeZone,
    };

    for (const key in utcTimes) {
      if (Object.prototype.hasOwnProperty.call(utcTimes, key)) {
        const instance = dayjs(utcTimes[key]);
        if (key === 'sunrise' || key === 'sunset') {
          convertedTimes[`${key}-lower-bound`] = instance.subtract(60, 'minutes').format();
          convertedTimes[`${key}-upper-bound`] = instance.add(60, 'minutes').format();
        }

        convertedTimes[key] = instance.format(); // Format the time if needed
      }
    }

    console.log({roughLocation, utcTimes, convertedTimes})
    return convertedTimes;
  })

  const todaysQuestion = questions[`${dayjs().dayOfYear()}`];
  const dailyPrompt = useSignal(todaysQuestion)

  const answerBoxFocused = useSignal(false);
  const sunActionText = useSignal<'sunrise' | 'sunset'>('sunrise');
  const windowText = useSignal('Your sunrise window is...');
  const windowIsOpen = useSignal(false);
  const currentTime = useSignal('');
  const currentDate = useSignal('')

  const datingDataLoaded = useSignal(false);
  const draftExists = useSignal(false);

  const pageWrapper = useSignal<HTMLElement>();
  const sunCircleHeight = useSignal(500);



  useVisibleTask$(async () => {
    const pageNameInURL = location.url.searchParams.get('page');
    const pageNameActual = customSPA.route;
    if (pageNameInURL !== pageNameActual) {
      location.url.searchParams.set('page', pageNameActual);
      window.history.replaceState({}, '', location.url)
    }

    window.addEventListener('popstate', popStateHandler);

    const answerText = document.querySelector('.answer-text') as HTMLTextAreaElement;
    answerText.onfocus = () => {
      answerBoxFocused.value = true;
    }
    answerText.onblur = () => {
      answerBoxFocused.value = false;
    }

    currentDate.value = dayjs().format('D.M.YY')

    const times = await getSunriseSunset();

    const sunriseUpperBound = dayjs(times['sunrise-upper-bound']);
    if (dayjs().isAfter(sunriseUpperBound)) {
      sunActionText.value = 'sunset';
      document.body.classList.add('sunset-theme')
    } else {
      document.body.classList.add('sunrise-theme')
    }

    lowerBoundTime.value = times[`${sunActionText.value}-lower-bound`];
    upperBoundTime.value = times[`${sunActionText.value}-upper-bound`];

    datingDataLoaded.value = true;

    const checkForDrafts = () => {
      const lowerInstance = dayjs(lowerBoundTime.value);
      const upperInstance = dayjs(upperBoundTime.value);
  
      const draft = journals.filter(journal => {
        return journal.draft;
      }).find(journal => {
        let currentInstance = dayjs(journal.created_at);
        if (overrideWindow) {
          currentInstance = lowerInstance.add(60, 'minutes')
        }


        if (currentInstance.isAfter(lowerInstance) && currentInstance.isBefore(upperInstance)) {
          console.log('this journal is a draft!', {journal})
          return true;
        } 

        return false;
      })

      if (draft) {
        draftExists.value = true;
        Object.assign(currentJournalData, draft);
        if (draft.image_url) {
          takePhotoLabel.value = 'Retake Photo';
        }
      }

      return draft;
    }
    
    const publishedAnswer = journals.filter(journal => {
      return (journal.draft === false);
    }).find(journal => {
      const currentInstance = dayjs(journal.created_at);
      const isToday = dayjs().isSame(currentInstance, 'day');

      return isToday;
    })

    if (publishedAnswer) {
      Object.assign(currentJournalData, publishedAnswer);
    } else {
      checkForDrafts();
    }

    answerText.textContent = currentJournalData.answer || '';

    const timeManagement = () => {
      const lowerInstance = dayjs(lowerBoundTime.value);
      const upperInstance = dayjs(upperBoundTime.value);

      let currentInstance = dayjs();
      if (overrideWindow) {
        currentInstance = lowerInstance.add(60, 'minutes')
      }

      if (currentInstance.isBefore(lowerInstance)) {
        windowText.value = `Your ${sunActionText.value} window will open at ${lowerInstance.format('h:mm A')}, and it will close at ${upperInstance.format('h:mm A')}.`
        windowIsOpen.value = false;
      } else if (currentInstance.isAfter(upperInstance)) {
        windowText.value = `Your ${sunActionText.value} window is closed.`
        windowIsOpen.value = false;
      } else {
        windowText.value = `Your ${sunActionText.value} window is open!`
        windowIsOpen.value = true;
      }

      if (overrideWindow === true) {
        windowIsOpen.value = true;
      }

      /**
       * 
       * @param P Decimal format percentage of 24 hours.
       * @returns 
       */
      const percentOf24hoursToPixelHeight = (P: number) => {
        const r = sunCircleHeight.value / 2;
        const Theta = Math.PI * (1 - P);
        const xFromCenter = Math.cos(Theta) * r;

        const height = r + xFromCenter;

        if (sunActionText.value === 'sunset') {
          return r - xFromCenter;
        }

        return height;
      } 

      const instanceInMinutes = (instance: dayjs.Dayjs) => {
        return dayjs.duration({
          hours: instance.hour(),
          minutes: instance.minute()
        }).asMinutes();
      }

      const upperBoundFraction = instanceInMinutes(upperInstance) / (24 * 60);
      const upperBoundLine = document.querySelector('.upper-window-bound') as HTMLElement;
      upperBoundLine.style.bottom = `${percentOf24hoursToPixelHeight(upperBoundFraction)}px`;

      const lowerBoundFraction = instanceInMinutes(lowerInstance) / (24 * 60);
      const lowerBoundLine = document.querySelector('.lower-window-bound') as HTMLElement;
      lowerBoundLine.style.bottom = `${percentOf24hoursToPixelHeight(lowerBoundFraction)}px`;

      const currentFraction = instanceInMinutes(currentInstance) / (24 * 60);
      const currentTheta = Math.PI * (1 - currentFraction);
      const currentDegrees = currentTheta * (180 / Math.PI);
      const bruh = 90 - currentDegrees;

      const currentLine = document.querySelector('.sun-arm') as HTMLElement;
      currentTime.value = currentInstance.format('h:mm A');
      currentLine.style.rotate = `${bruh}deg`;

      const currentBoundLine = document.querySelector('.current-window-bound') as HTMLElement;
      currentBoundLine.style.bottom = `${percentOf24hoursToPixelHeight(currentFraction)}px`;
    }
    timeManagement();
    setInterval(timeManagement, 1000);

    if (!pageWrapper.value) return;
    const wrapper = pageWrapper.value;
    setTimeout(() => {
      wrapper.classList.add('initial-animation-done');
    }, 2000)
  }) 


  
  const answerPromptButtonHandler = $(async () => {
    if (windowIsOpen.value === true) {
      if (!auth.session?.user.email) {
        return console.error('email not found.')
      }
      
      const addTemplateJournal = addJournalToDatabase({
        user_email: auth.session.user.email
      });
      routeSPA('writing-answer', [addTemplateJournal]);

      const initalJournalData = await addTemplateJournal;
      Object.assign(currentJournalData, initalJournalData);
      console.log(currentJournalData)
    }
  })

  const viewDraftHandler = $(async () => {
    if (windowIsOpen.value === true) {
      (document.querySelector('.answer-text') as HTMLTextAreaElement).textContent = currentJournalData.answer || '';
      routeSPA('writing-answer', []);
    }
  })

  const viewPublishedHandler = $(async () => {
      routeSPA('viewing-journal-published', []);
  })

  const saveDraftHandler = $(async (e: any, element: HTMLButtonElement) => {
    console.log({e, element, currentJournalData});

    currentJournalData.draft = true;
    const updateCall = updateJournalToDatabase(currentJournalData)
    routeSPA('viewing-daily-prompt', [updateCall]);
    
    const savedJournalData = await updateCall;
    if (savedJournalData) {
      console.log({savedJournalData});
    }

  })

  const finishButtonHandler = $(async () => {
    const label = document.querySelector('.take-photo-button') as HTMLElement;
    label.classList.remove('flash');

    if (takePhotoLabel.value === 'Take Photo') {
      setTimeout(() => {
        label.classList.add('flash');
      }, 100)

      return;
    }

    //element.classList.remove('valid');

    console.log({currentJournalData});

    routeSPA('viewing-journal-draft', []);
  })

  const editAnswerHandler = $(async (e: any, element: HTMLButtonElement) => {
    console.log({e, element});
    routeSPA('writing-answer', []);
  })

  const publishButtonHandler = $(async (e: any, element: HTMLButtonElement) => {
    console.log({e, element});

    currentJournalData.draft = false;

    const updateCall = updateJournalToDatabase(currentJournalData);
    routeSPA('viewing-journal-published', [updateCall]);

    const savedJournalData = await updateCall;
    if (savedJournalData) {
      console.log({savedJournalData});
    }
  })

  const archiveButtonHandler = $(async (e: any, element: HTMLButtonElement) => {
    console.log({e, element});
  })

  return (
    <div ref={pageWrapper} class="biggest-wrapper" data-page={customSPA.route}>

      <div class="daily-prompt-wrapper">
        <div class="daily-prompt-meta-outer-wrapper">
          <div class="daily-prompt-meta-wrapper">

            <div class="daily-prompt-meta">
              <div class="daily-prompt-label">Daily Prompt &nbsp;&nbsp;&nbsp; {currentDate.value}</div>
              <div class="daily-prompt-text">{dailyPrompt.value}</div>
            </div>
            <div class="daily-prompt-buttons">
              {windowIsOpen.value ? <></> : currentJournalData.draft !== false ? <div class="explanation">You must be in the {sunActionText.value} window in order to answer.</div> : <></>}

              {currentJournalData.draft === false ? (

                <div class="view-published-wrapper">
                  <div class="published-image-preview">
                    {// eslint-disable-next-line qwik/jsx-img
                    <img height={400} width={400} src={currentJournalData.image_url || ''} alt="" />}
                    <div class="view-published-fade-background"></div>
                  </div>
                  <button onClick$={viewPublishedHandler} class="view-published-button">View Your Answer →</button>
                </div>

              ) : draftExists.value ? (
                <button onClick$={viewDraftHandler} class="view-draft-button">
                  <div class="continue-draft-text">Continue Draft →</div>
                  <div class="draft-snippet">{currentJournalData.answer}</div>
                </button>
              ) : (
                <button onClick$={answerPromptButtonHandler} class={`answer-early-button ${windowIsOpen.value ? 'available' : ''}`}>I have an answer →</button>
              )}

              <button class="answer-at-button">I need time to think →</button>
            </div>

          </div>
        </div>


        <div class={`astronomy-information-wrapper ${datingDataLoaded.value ? 'loaded' : ''}`}>
          <div class="window-meta">
            <div class="window-text">
              {windowText.value}
            </div>
          </div>

          <div class="sun-path">
            <svg width="250px" height="500px" class="sun-semi-circle-svg" viewBox="0 0 190 369" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle  cx="184.5" cy="184.5" r="184" transform="rotate(-90 184.5 184.5)" stroke-width='2'/>
            </svg>

            <div class="upper-window-bound">
              <div class="bound-label-wrap"><span class="bound-label-value">{upperBoundTime.value && dayjs(upperBoundTime.value).format('h:mm A')}</span></div>
            </div>
            <div class="current-window-bound">
              <div class="bound-label-wrap"></div>
            </div>

            <div class="lower-window-bound">
              <div class="bound-label-wrap"><span class="bound-label-value">{lowerBoundTime.value && dayjs(lowerBoundTime.value).format('h:mm A')}</span></div>
            </div>

            <div class="sun-circle-outer-wrap">
              <div class="sun-circle-inner-wrap">
                <div class="sun-arm">
                  <div class="sun-arm-inner">
                    <span class="sun-time-label">{currentTime.value}</span>
                    <div class="sun-circle"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      <div class={`answer-writing-wrapper ${windowIsOpen.value ? 'available' : ''}`}>
        <div class="daily-prompt-box">
          <div class="daily-prompt-label">DAILY PROMPT</div>
          <div class="daily-prompt-text">{dailyPrompt.value}</div>
        </div>

        <div class={`photo-take-box ${currentJournalData.image_url && 'preview-photo'} ${currentJournalData.vertical && 'vertical'}`}>
          <div class="photo-take-text">{sunActionText.value} available starting at {lowerBoundTime.value && dayjs(lowerBoundTime.value).format('h:mm A')}</div>

          <div class="time-information">
            <span class="current-time-text">Current Time</span>
            <span class="current-time-value">{currentTime.value}</span>

            <span class="spacer"></span>

            <span class="sun-action">{sunActionText.value}</span>
            <span class="action-timing">{lowerBoundTime.value && dayjs(lowerBoundTime.value).format('h:mm')}-{upperBoundTime.value && dayjs(upperBoundTime.value).format('h:mm A')}</span>
          </div>
          <div class="photo-preview-box">
            {// eslint-disable-next-line qwik/jsx-img
            <img class="photo-preview" src={currentJournalData.image_url || ''} alt=""></img>}
          </div>
          <div class="photo-preview-meta">
              
          </div>
          <div class="photo-file-box">
            <label for="photo-input" class="take-photo-button">
              <span class="take-photo-text">{takePhotoLabel.value}</span>           
            </label>
            <input onInput$={photoInputHandler} id="photo-input" type="file" accept="image/*" ></input>
          </div>
        </div>

        <div class="answer-box">
          <div contentEditable="true"  onKeyUp$={answerTextTypeHandler} placeholder="type your answer here..." class="answer-text"></div>
        </div>

        <div class={`finish-box ${answerBoxFocused.value ? 'hide' : 'show'}`}>
          <button onClick$={saveDraftHandler} class="save-draft-button">← Save Draft (Exit)</button>
          <button onClick$={finishButtonHandler} class={`finish-button ${takePhotoLabel.value === 'Retake Photo' ? 'valid' : ''}`}>Finish →</button>
        </div>
      </div>

      <div class={`view-journal-wrapper`}>
        <div class="image-background-full">
          {// eslint-disable-next-line qwik/jsx-img
          <img src={currentJournalData.image_url || ''} alt="" />}
        </div>

        <div class="fade-out-background"></div>

        <div class="navigation-buttons">
          <div class="go-home" onClick$={() => routeSPA('viewing-daily-prompt', [])}>← Go Home</div>
          {/* <div class="explore-answers" onClick$={() => routeSPA('viewing-daily-prompt')}>Explore Answers →</div> */}
        </div>

        <div class="journal-meta-box">
          <div class="journal-meta-dating">
            <div class="creation-date">
            {currentJournalData.created_at && dayjs(currentJournalData.created_at).format('D.M.YYYY')}
            </div>
            <div class="creation-time">
            {currentJournalData.created_at && dayjs(currentJournalData.created_at).format('h:mm A')}
            </div>
          </div>
          <div class="divider"></div>

          <div class="journal-visibility-label">{currentJournalData.private ? 'Private' : 'Public'}</div>
          
          <div class="journal-meta-visibility">
            <label class='privacy-select-label' for="privacy-select">Privacy</label>
            <select onInput$={(ev: any, element: HTMLSelectElement) => {
              const isPrivateSelected = element.value === 'private';
              currentJournalData.private = isPrivateSelected;
            }} name="" id="privacy-select">
              <option value="private">Private</option>
              <option value="public">Public</option>
            </select>
          </div>
        </div>

        <div class="journal-actions">
          <button onClick$={editAnswerHandler} class="edit-answer-button draft-action">← Edit Answer</button>
          <button onClick$={publishButtonHandler} class={`publish-button valid draft-action`}>Publish →</button>
          <button onClick$={archiveButtonHandler} class={`archive-button published-action`}>Archive</button>
        </div>

        <div class="daily-prompt-box">
          <div class="daily-prompt-text">{dailyPrompt.value}</div>
        </div>

        <div class="viewing-answer-box">
          <div class="viewing-answer-text">{currentJournalData.answer}</div>
        </div>
      </div>
    </div>
  );
});

export const head: DocumentHead = {
  title: "ntrl",
  meta: [
    {
      name: "description",
      content: "the natural way of journaling.",
    },
  ],
};
