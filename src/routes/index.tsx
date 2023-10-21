import { $, component$, noSerialize, useSignal, useStore, useVisibleTask$ } from "@builder.io/qwik";
import { useLocation, type DocumentHead } from "@builder.io/qwik-city";

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

  const { 
    data: userJournals 
  } = await supabaseClient.from('journals').select('*').eq('user_email', userEmail);

  console.log(requestEvent)


  return { 
    journals: userJournals ? userJournals as Row[] : [], 
    userId: userId, 
    auth: auth 
  };
});



import { questionBank } from '../components/questions.js';
const questions = questionBank as { [key: string]: string };

const supabaseUrl = 'https://qjpeursbnlmjowsuwigl.supabase.co'
const supabaseKey = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqcGV1cnNibmxtam93c3V3aWdsIiwicm9sZSI6ImFub24iLCJpYXQiOjE2ODU0ODI5OTYsImV4cCI6MjAwMTA1ODk5Nn0.s6bnKJbvt24vwIUIZ83uexzMz6YGyUmPxPC3nzXXQI8`;
const localClient = createClient(supabaseUrl, supabaseKey);

export default component$(() => {
  const getJournal = $(async (uuid: string) => {
    const { data, error } = await localClient.from('journals').select().eq('uuid', uuid);

    if (error) {
      return null;
    }

    return data[0] as Row;
  })

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
  console.log('Server Loader:', {journals, userId, auth});

  const feed = useStore<{ journals: Row[] }>({ journals: [] })

  useVisibleTask$(async () => {
    const { data } = await localClient.from('journals')
    .select('*').eq('draft', false)
    .eq('private', false)
    .eq('basic_date', dayjs().format('DD/MM/YYYY'));
  
    feed.journals = data as Row[];
  })

  const location = useLocation();
  const searchParams = location.url.searchParams;
  let pageRoute = searchParams.get('page');
  const possibleRoutes = [
    'viewing-daily-prompt', 
    'writing-answer',
    'viewing-journal-published',
    'viewing-journal-draft',
    'viewing-community'
  ];
  if (!pageRoute || !possibleRoutes.includes(pageRoute)) {
    pageRoute = 'viewing-daily-prompt';
  }

  const overrideWindow = useSignal(searchParams.get('overridewindow') ? true : false);

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

  const uploadPhoto = $(async (formData: FormData) => {
    const serverURL = `https://ntrl-server-production.up.railway.app/upload/${userId}`;
    const request = await fetch(serverURL, {
      method: 'POST',
      body: formData
    });
  
    return noSerialize(request);
  })

  const photoIsUploading = useSignal(false);

  const photoInputHandler = $(async (e: any, targetElement: HTMLInputElement) => {
    const event = e as Event;
    console.log({event, targetElement});

    if (targetElement.files) {
      const photo = targetElement.files[0];

      const megabyte = 1048576;
      if (photo.size > (5 * megabyte)) {
        //optional size limiter.
      }

      const dimensions = await getImageDimensions(photo);
      console.log({dimensions})
      
      const isVertical = dimensions.height > dimensions.width;
      currentJournalData.vertical = isVertical;

      photoIsUploading.value = true;

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

      const uploadResponse = await uploadPhoto(formData);

      const uploadData = await uploadResponse?.json();
      const { fileName } = uploadData;

      const img = document.querySelector('.photo-preview') as HTMLImageElement;
      img.onload = () => {
        photoIsUploading.value = false;
      }

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
        if (overrideWindow.value) {
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
      if (overrideWindow.value) {
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

      if (overrideWindow.value === true) {
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
        user_email: auth.session.user.email,
        basic_date: dayjs().format('DD/MM/YYYY')
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
  const viewCommunityPublishedHandler = $(async (uuid: string) => {
    const journalDataCall = getJournal(uuid);
    routeSPA('viewing-journal-published', [journalDataCall]);

    const journalData = await journalDataCall;
    Object.assign(currentJournalData, journalData);
  })

  const viewCommunityHandler = $(async () => {
    routeSPA('viewing-community', []);
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

              {currentJournalData.draft === false ? (<>

                <div class="view-published-wrapper"  onClick$={viewPublishedHandler} >
                  <div class="published-image-preview">
                    {// eslint-disable-next-line qwik/jsx-img
                    <img height={400} width={400} src={currentJournalData.image_url || ''} alt="" />}
                    <div class="view-published-fade-background"></div>
                  </div>
                  <button class="view-published-button">View Your Answer →</button>
                </div>

                <div class="view-community-wrapper">
                  <button onClick$={viewCommunityHandler} class="view-community-button">See how others answered →</button>
                </div>

              </>) : draftExists.value ? (
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

        <div class={`photo-take-box ${currentJournalData.image_url && 'preview-photo'} ${currentJournalData.vertical ? 'vertical' : ''} ${photoIsUploading.value ? 'loading' : ''}`}>
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
            <div class="photo-loader">
              <span class="loader"></span>
            </div>
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
            {currentJournalData.created_at && dayjs(currentJournalData.created_at).format('MMMM D, YYYY')}
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

      <div class={`community-wrapper`}>
        <div class="navigation-buttons">
          <div class="go-home" onClick$={() => routeSPA('viewing-daily-prompt', [])}>← Go Home</div>
          {/* <div class="explore-answers" onClick$={() => routeSPA('viewing-daily-prompt')}>Explore Answers →</div> */}
        </div>

        <div class="feed">
        
          {(feed.journals.length > 0) ? feed.journals.map((journal) => {
            return (
              <div key={journal.uuid} class="view-published-wrapper"onClick$={() => {
                viewCommunityPublishedHandler(journal.uuid)
              }} >
                <div class="published-image-preview">
                  {// eslint-disable-next-line qwik/jsx-img
                  <img height={400} width={400} src={journal.image_url || ''} alt="" />}
                  <div class="view-published-fade-background"></div>
                </div>
                <button class="view-published-button">View {journal.user_first_name || journal.user_email}'s Answer →</button>
              </div>
            )
          }) : <></>}

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
